
# Stripe Payment Integration Plan for WeldMatch

## Overview
This plan implements a complete Stripe subscription payment system for employers, allowing them to upgrade from the free trial to Professional ($49.99/mo) or Enterprise ($99.99/mo) plans.

## Created Stripe Products

| Plan | Product ID | Price ID | Monthly Price |
|------|------------|----------|---------------|
| Professional | prod_TsgiKDG3btgeCJ | price_1SuvL6BwEgLLTCFxFIEl0Vid | $49.99 |
| Enterprise | prod_TsgiRI5zqRyRho | price_1SuvLRBwEgLLTCFxRTH2rYma | $99.99 |

## Implementation Steps

### Step 1: Create Edge Functions

**1.1 create-checkout** - Creates Stripe checkout sessions for subscription
- Authenticates user via Supabase
- Checks for existing Stripe customer by email
- Creates checkout session with the selected price ID
- Returns checkout URL for redirect

**1.2 check-subscription** - Verifies subscription status
- Queries Stripe for customer by email
- Checks for active subscriptions
- Returns subscription status, plan type, and end date
- Updates employer_profiles table with subscription info

**1.3 customer-portal** - Manages existing subscriptions
- Creates Stripe Customer Portal session
- Allows users to cancel, upgrade, or change payment method
- Returns portal URL for redirect

### Step 2: Create Subscription Constants

Create a new file `src/lib/stripe.ts` with:
- Price ID to plan name mappings
- Product ID to plan name mappings
- Plan feature lists for UI display

### Step 3: Update AuthContext

Add subscription state tracking:
- `subscription` object with status, plan, and end date
- `checkSubscription()` function called on auth change
- Auto-refresh subscription status periodically

### Step 4: Create Pricing Page

New page `/pricing` with:
- Full pricing cards with all features listed
- Dynamic highlighting of current plan for logged-in employers
- Checkout buttons that invoke `create-checkout`
- "Manage Subscription" button for existing subscribers

### Step 5: Update Employer Settings

Enhance the Subscription card to show:
- Current plan name and status
- Subscription end date
- Upgrade button (if on free trial)
- Manage Subscription button (if subscribed)

### Step 6: Update Landing Page Pricing Section

- Link pricing cards to checkout flow
- Show "Current Plan" badge for logged-in users

---

## Technical Details

### Edge Function: create-checkout

```text
Location: supabase/functions/create-checkout/index.ts

Flow:
1. Receive price_id in request body
2. Authenticate user with Supabase token
3. Search Stripe for existing customer by email
4. Create Stripe checkout session with mode: "subscription"
5. Return { url: session.url }

Success URL: /employer/settings?success=true
Cancel URL: /employer/settings?canceled=true
```

### Edge Function: check-subscription

```text
Location: supabase/functions/check-subscription/index.ts

Flow:
1. Authenticate user with Supabase token
2. Search Stripe for customer by email
3. List active subscriptions for customer
4. Map product ID to plan name
5. Update employer_profiles with subscription data
6. Return { subscribed, plan, subscription_end }
```

### Edge Function: customer-portal

```text
Location: supabase/functions/customer-portal/index.ts

Flow:
1. Authenticate user with Supabase token
2. Find Stripe customer by email
3. Create billing portal session
4. Return { url: portalSession.url }
```

### Pricing Page UI

```text
Location: src/pages/Pricing.tsx

Layout:
- 3-column grid with Free Trial, Professional, Enterprise
- Feature comparison table
- CTA buttons that:
  - Redirect to /register/employer if not logged in
  - Open Stripe Checkout if logged in
  - Show "Manage Plan" if already subscribed
```

### Subscription State in AuthContext

```text
New state:
- subscription: { subscribed: boolean, plan: string | null, endDate: string | null }

New functions:
- checkSubscription(): Invokes check-subscription edge function
- Called on: auth state change, page load, every 60 seconds
```

---

## Files to Create

| File | Purpose |
|------|---------|
| supabase/functions/create-checkout/index.ts | Create Stripe checkout sessions |
| supabase/functions/check-subscription/index.ts | Verify subscription status |
| supabase/functions/customer-portal/index.ts | Manage subscriptions |
| src/lib/stripe.ts | Stripe constants and price mappings |
| src/pages/Pricing.tsx | Full pricing page |

## Files to Modify

| File | Changes |
|------|---------|
| src/contexts/AuthContext.tsx | Add subscription state and checking |
| src/pages/employer/EmployerSettings.tsx | Enhanced subscription card with real data |
| src/components/landing/PricingPreviewSection.tsx | Link to checkout for logged-in users |
| src/App.tsx | Add /pricing route |

---

## User Flow

```text
1. Employer visits /pricing or clicks "Upgrade" in settings
2. Selects Professional or Enterprise plan
3. Redirected to Stripe Checkout (in new tab)
4. Completes payment with card details
5. Redirected back to /employer/settings?success=true
6. App checks subscription status and updates UI
7. Employer sees their active plan in settings
8. Can click "Manage Subscription" to access Stripe portal
```

## Important Notes

- Welders always have free access - pricing only applies to employers
- The customer-portal requires you to activate it in Stripe Dashboard first
- Subscription status is checked client-side via Stripe API (no webhooks needed)
- The employer_profiles table will be updated with subscription info for caching
