import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionState {
  subscribed: boolean;
  plan: string | null;
  subscriptionEnd: string | null;
  customerId: string | null;
  isLoading: boolean;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionState>({
    subscribed: false,
    plan: "free_trial",
    subscriptionEnd: null,
    customerId: null,
    isLoading: false,
  });

  const checkSubscription = useCallback(async (): Promise<SubscriptionState | null> => {
    setSubscription(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");

      if (error) {
        console.error("Error checking subscription:", error);
        setSubscription(prev => ({ ...prev, isLoading: false }));
        return null;
      }

      const newState: SubscriptionState = {
        subscribed: data.subscribed || false,
        plan: data.plan || "free_trial",
        subscriptionEnd: data.subscription_end || null,
        customerId: data.customer_id || null,
        isLoading: false,
      };

      setSubscription(newState);
      return newState;
    } catch (error) {
      console.error("Error checking subscription:", error);
      setSubscription(prev => ({ ...prev, isLoading: false }));
      return null;
    }
  }, []);

  return {
    subscription,
    checkSubscription,
    setSubscription,
  };
}
