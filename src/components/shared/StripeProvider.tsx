"use client";

import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe/client";
import { anglerPassElementsTheme } from "@/lib/stripe/elements-theme";

interface StripeProviderProps {
  clientSecret: string;
  children: React.ReactNode;
}

/**
 * Wraps children in Stripe Elements context with AnglerPass theming.
 * Pass a PaymentIntent or SetupIntent client_secret.
 */
export function StripeProvider({ clientSecret, children }: StripeProviderProps) {
  return (
    <Elements
      stripe={getStripe()}
      options={{
        clientSecret,
        appearance: anglerPassElementsTheme,
      }}
    >
      {children}
    </Elements>
  );
}
