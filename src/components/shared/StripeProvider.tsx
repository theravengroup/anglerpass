"use client";

import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe/client";
import { anglerPassElementsTheme } from "@/lib/stripe/elements-theme";

interface StripeProviderProps {
  clientSecret: string;
  children: React.ReactNode;
}

/**
 * Wraps children in Stripe Elements context with full AnglerPass theming.
 * Pass a PaymentIntent or SetupIntent client_secret.
 *
 * Loads the DM Sans font into Stripe's iframe so input text matches our site.
 */
export function StripeProvider({ clientSecret, children }: StripeProviderProps) {
  return (
    <Elements
      stripe={getStripe()}
      options={{
        clientSecret,
        appearance: anglerPassElementsTheme,
        fonts: [
          {
            cssSrc:
              "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap",
          },
        ],
        loader: "auto",
      }}
    >
      {children}
    </Elements>
  );
}
