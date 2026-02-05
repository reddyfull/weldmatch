// supabase/functions/n8n-proxy/index.ts
// Deploy with: supabase functions deploy n8n-proxy

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const N8N_URL = Deno.env.get('N8N_WEBHOOK_URL')!
const N8N_API_KEY = Deno.env.get('N8N_API_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate Supabase auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get endpoint and payload from request
    const { endpoint, payload } = await req.json()
    
    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: 'Missing endpoint parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Whitelist allowed endpoints
    const allowedEndpoints = [
      '/verify-certification',
      '/parse-resume',
      '/match-candidates',
      '/send-email',
      '/score-candidates',
      // AI Career Agents
      '/optimize-profile',
      '/analyze-skills-gap',
      '/scan-job-matches',
      '/career-advice',
      // AI Job Description Generator
      '/generate-job-description',
      // Advanced AI Features
      '/analyze-weld-quality',
      '/optimize-crew',
      '/interview-coach',
      '/safety-compliance',
      '/career-path',
      // Phase 2 AI Features
      '/chat-support',
      '/generate-resume',
      '/generate-cover-letter',
      '/draft-outreach',
      '/market-intelligence'
    ]
    
    if (!allowedEndpoints.includes(endpoint)) {
      return new Response(
        JSON.stringify({ error: `Invalid endpoint: ${endpoint}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate n8n configuration
    if (!N8N_URL || !N8N_API_KEY) {
      console.error('Missing n8n configuration')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call n8n with secret API key
    const n8nUrl = `${N8N_URL}${endpoint}`
    console.log(`Calling n8n: ${n8nUrl}`)
    
    const n8nResponse = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': N8N_API_KEY,
      },
      body: JSON.stringify({ 
        ...payload, 
        userId: user.id,
        userEmail: user.email 
      }),
    })

    // Check if n8n responded successfully
    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text()
      console.error(`n8n error: ${n8nResponse.status} - ${errorText}`)
      return new Response(
        JSON.stringify({ 
          error: 'n8n request failed', 
          status: n8nResponse.status,
          details: errorText 
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle empty or non-JSON responses gracefully
    const responseText = await n8nResponse.text()
    let result
    
    if (!responseText || responseText.trim() === '') {
      console.warn('n8n returned empty response, using fallback')
      result = { success: false, fallback: true, message: 'n8n returned empty response' }
    } else {
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Failed to parse n8n response:', responseText.substring(0, 200))
        result = { success: false, fallback: true, message: 'Invalid JSON from n8n', raw: responseText.substring(0, 500) }
      }
    }
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
