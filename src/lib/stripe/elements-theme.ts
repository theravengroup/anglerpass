import type { Appearance } from "@stripe/stripe-js";

/**
 * Shared Stripe Elements Appearance theme matching AnglerPass design tokens.
 * Used by all PaymentElement / SetupElement instances across the app.
 *
 * Color tokens reference globals.css @theme values.
 */
export const anglerPassElementsTheme: Appearance = {
  theme: "stripe",
  variables: {
    // Typography
    fontFamily: '"DM Sans", -apple-system, sans-serif',
    fontSizeBase: "15px",
    fontWeightNormal: "400",
    fontWeightMedium: "500",
    fontWeightBold: "600",

    // Colors
    colorPrimary: "#1a3a2a", // forest
    colorBackground: "#ffffff",
    colorText: "#1e1e1a", // text-primary
    colorTextSecondary: "#5a5a52", // text-secondary
    colorTextPlaceholder: "#8a8a80", // text-light
    colorDanger: "#dc2626", // destructive

    // Borders & Radii
    colorIconCardCvc: "#5a5a52",
    borderRadius: "0.5rem", // radius-lg
    spacingUnit: "4px",
    spacingGridRow: "16px",
    spacingGridColumn: "16px",
  },
  rules: {
    ".Input": {
      borderColor: "#d8d4c8", // border token
      boxShadow: "none",
      padding: "10px 14px",
      transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    },
    ".Input:focus": {
      borderColor: "#3a6b7c", // river (ring color)
      boxShadow: "0 0 0 3px rgba(58, 107, 124, 0.15)",
    },
    ".Input--invalid": {
      borderColor: "#dc2626",
      boxShadow: "0 0 0 3px rgba(220, 38, 38, 0.1)",
    },
    ".Label": {
      fontWeight: "500",
      color: "#1e1e1a",
      marginBottom: "6px",
    },
    ".Tab": {
      borderColor: "#d8d4c8",
      borderRadius: "0.5rem",
    },
    ".Tab--selected": {
      borderColor: "#1a3a2a",
      backgroundColor: "#f7f4ec", // parchment-light
      color: "#1a3a2a",
    },
    ".TabIcon--selected": {
      fill: "#1a3a2a",
    },
  },
};
