// Stripe product and price configuration for WeldMatch subscriptions

export const STRIPE_PLANS = {
  free_trial: {
    name: "Free Trial",
    price: "$0",
    period: "14 days",
    description: "Try WeldMatch risk-free",
    features: [
      "Post 1 job",
      "View up to 10 candidates",
      "Basic matching",
      "Email support",
    ],
    priceId: null,
    productId: null,
  },
  pro: {
    name: "Professional",
    price: "$49.99",
    period: "per month",
    description: "For growing companies",
    features: [
      "Unlimited job postings",
      "Unlimited candidate views",
      "Advanced matching algorithm",
      "Priority support",
      "Candidate shortlists",
      "Custom branding",
    ],
    priceId: "price_1SuvL6BwEgLLTCFxFIEl0Vid",
    productId: "prod_TsgiKDG3btgeCJ",
  },
  enterprise: {
    name: "Enterprise",
    price: "$99.99",
    period: "per month",
    description: "For large organizations",
    features: [
      "Everything in Professional",
      "Dedicated account manager",
      "API access",
      "Custom integrations",
      "Analytics dashboard",
      "Multi-location support",
    ],
    priceId: "price_1SuvLRBwEgLLTCFxRTH2rYma",
    productId: "prod_TsgiRI5zqRyRho",
  },
} as const;

export type PlanKey = keyof typeof STRIPE_PLANS;

// Map product IDs to plan keys
export const PRODUCT_ID_TO_PLAN: Record<string, PlanKey> = {
  "prod_TsgiKDG3btgeCJ": "pro",
  "prod_TsgiRI5zqRyRho": "enterprise",
};

// Map price IDs to plan keys
export const PRICE_ID_TO_PLAN: Record<string, PlanKey> = {
  "price_1SuvL6BwEgLLTCFxFIEl0Vid": "pro",
  "price_1SuvLRBwEgLLTCFxRTH2rYma": "enterprise",
};

// Helper to get plan display name
export function getPlanDisplayName(planKey: string | null): string {
  if (!planKey || planKey === "free_trial") {
    return "Free Trial";
  }
  return STRIPE_PLANS[planKey as PlanKey]?.name || "Free Trial";
}

// Helper to check if plan is paid
export function isPaidPlan(planKey: string | null): boolean {
  return planKey === "pro" || planKey === "enterprise";
}
