import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const N8N_URL = Deno.env.get('N8N_WEBHOOK_URL')!
const N8N_API_KEY = Deno.env.get('N8N_API_KEY')!

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20 // Max requests per window per user

// In-memory rate limit store (per instance)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const userLimit = rateLimitStore.get(userId)

  if (!userLimit || now > userLimit.resetTime) {
    // New window
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetIn: RATE_LIMIT_WINDOW_MS }
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    // Rate limited
    return { allowed: false, remaining: 0, resetIn: userLimit.resetTime - now }
  }

  // Increment count
  userLimit.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - userLimit.count, resetIn: userLimit.resetTime - now }
}

// Cleanup old entries periodically (prevent memory leaks)
setInterval(() => {
  const now = Date.now()
  for (const [userId, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(userId)
    }
  }
}, RATE_LIMIT_WINDOW_MS)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate Supabase JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data, error } = await supabase.auth.getClaims(token)
    
    if (error || !data?.claims) {
      console.error('Auth error:', error)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userId = data.claims.sub as string

    // Check rate limit
    const rateLimit = checkRateLimit(userId)
    
    const rateLimitHeaders = {
      'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(rateLimit.resetIn / 1000).toString(),
    }

    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for user ${userId}`)
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded', 
        retryAfter: Math.ceil(rateLimit.resetIn / 1000) 
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          ...rateLimitHeaders,
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil(rateLimit.resetIn / 1000).toString()
        }
      })
    }

    // Get endpoint and payload
    const { endpoint, payload } = await req.json()

    const allowedEndpoints = [
      '/verify-certification',
      '/parse-resume',
      '/job-match',
      '/send-email'
    ]

    if (!allowedEndpoints.includes(endpoint)) {
      return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
        status: 400,
        headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Proxying request to n8n: ${endpoint} for user ${userId}`)

    // Call n8n with secret API key
    const n8nResponse = await fetch(`${N8N_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': N8N_API_KEY,
      },
      body: JSON.stringify({ ...payload, userId }),
    })

    const result = await n8nResponse.json()

    if (!n8nResponse.ok) {
      console.error('n8n error:', result)
      return new Response(JSON.stringify({ error: result.message || 'n8n request failed' }), {
        status: n8nResponse.status,
        headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Proxy error:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
