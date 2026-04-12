import type { Appearance } from "@stripe/stripe-js";

/**
 * AnglerPass design tokens — single source of truth for Stripe Elements styling.
 * These mirror globals.css @theme values so Elements inputs feel native.
 */
const tokens = {
  // Brand colors
  forest: "#1a3a2a",
  forestDeep: "#0f2219",
  river: "#3a6b7c",
  riverLight: "#5a9aad",
  bronze: "#9a7340",
  charcoal: "#2a2a25",
  parchment: "#f0ead6",
  parchmentLight: "#f7f4ec",
  offwhite: "#faf9f5",

  // Text
  textPrimary: "#1e1e1a",
  textSecondary: "#5a5a52",
  textLight: "#8a8a80",

  // UI
  border: "#d8d4c8",
  ring: "#3a6b7c",
  destructive: "#dc2626",
  background: "#ffffff",

  // Radii
  radiusSm: "0.25rem",
  radiusMd: "0.375rem",
  radiusLg: "0.5rem",
  radiusXl: "0.75rem",

  // Typography
  fontBody: '"DM Sans", -apple-system, sans-serif',
  fontHeading: '"Cormorant Garamond", Georgia, serif',
} as const;

/**
 * Shared Stripe Elements Appearance theme matching AnglerPass design tokens.
 * Used by all PaymentElement / SetupElement instances across the app.
 *
 * Deep styling: every visible sub-element is styled to match our shadcn/ui
 * inputs, labels, tabs, and error states so Stripe feels fully native.
 */
export const anglerPassElementsTheme: Appearance = {
  theme: "stripe",
  labels: "floating",
  variables: {
    // ── Typography ──────────────────────────────────────────────
    fontFamily: tokens.fontBody,
    fontSizeBase: "15px",
    fontSizeSm: "13px",
    fontSizeLg: "16px",
    fontWeightNormal: "400",
    fontWeightMedium: "500",
    fontWeightBold: "600",
    fontLineHeight: "1.5",

    // ── Colors ──────────────────────────────────────────────────
    colorPrimary: tokens.forest,
    colorBackground: tokens.background,
    colorText: tokens.textPrimary,
    colorTextSecondary: tokens.textSecondary,
    colorTextPlaceholder: tokens.textLight,
    colorDanger: tokens.destructive,
    colorSuccess: "#16a34a",
    colorWarning: "#d97706",

    // ── Icons ───────────────────────────────────────────────────
    colorIcon: tokens.textSecondary,
    colorIconHover: tokens.textPrimary,
    colorIconCardError: tokens.destructive,
    colorIconCardCvc: tokens.textSecondary,
    colorIconCardCvcError: tokens.destructive,
    colorIconCheckmark: tokens.forest,
    colorIconChevronDown: tokens.textSecondary,
    colorIconChevronDownHover: tokens.textPrimary,
    colorIconRedirect: tokens.river,

    // ── Borders & Radii ─────────────────────────────────────────
    borderRadius: tokens.radiusLg,
    spacingUnit: "4px",
    spacingGridRow: "16px",
    spacingGridColumn: "16px",
    spacingTab: "12px",
    spacingAccordionItem: "12px",
  },
  rules: {
    // ── Inputs ──────────────────────────────────────────────────
    ".Input": {
      borderColor: tokens.border,
      borderWidth: "1px",
      boxShadow: "none",
      backgroundColor: tokens.background,
      padding: "10px 14px",
      fontSize: "15px",
      lineHeight: "1.5",
      transition:
        "border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
    },
    ".Input:hover": {
      borderColor: tokens.textLight,
    },
    ".Input:focus": {
      borderColor: tokens.ring,
      boxShadow: `0 0 0 3px rgba(58, 107, 124, 0.15)`,
      outline: "none",
    },
    ".Input--invalid": {
      borderColor: tokens.destructive,
      boxShadow: `0 0 0 3px rgba(220, 38, 38, 0.08)`,
    },
    ".Input--invalid:focus": {
      borderColor: tokens.destructive,
      boxShadow: `0 0 0 3px rgba(220, 38, 38, 0.15)`,
    },
    ".Input::placeholder": {
      color: tokens.textLight,
    },
    ".Input:disabled": {
      backgroundColor: tokens.parchmentLight,
      borderColor: tokens.border,
      color: tokens.textLight,
      opacity: "0.7",
    },

    // ── Labels ──────────────────────────────────────────────────
    ".Label": {
      fontWeight: "500",
      fontSize: "14px",
      color: tokens.textPrimary,
      marginBottom: "6px",
      letterSpacing: "0.01em",
    },
    ".Label--floating": {
      fontSize: "12px",
      fontWeight: "500",
      color: tokens.textSecondary,
      opacity: "1",
    },

    // ── Error text ──────────────────────────────────────────────
    ".Error": {
      color: tokens.destructive,
      fontSize: "13px",
      fontWeight: "400",
      marginTop: "6px",
    },

    // ── Tabs (card / bank account / etc.) ───────────────────────
    ".Tab": {
      borderColor: tokens.border,
      borderRadius: tokens.radiusLg,
      padding: "10px 16px",
      fontWeight: "500",
      fontSize: "14px",
      color: tokens.textSecondary,
      backgroundColor: tokens.background,
      transition:
        "border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease",
    },
    ".Tab:hover": {
      borderColor: tokens.textLight,
      color: tokens.textPrimary,
      backgroundColor: tokens.offwhite,
    },
    ".Tab:focus": {
      boxShadow: `0 0 0 3px rgba(58, 107, 124, 0.15)`,
      borderColor: tokens.ring,
      outline: "none",
    },
    ".Tab--selected": {
      borderColor: tokens.forest,
      backgroundColor: tokens.parchmentLight,
      color: tokens.forest,
      boxShadow: `0 1px 2px rgba(26, 58, 42, 0.08)`,
    },
    ".Tab--selected:hover": {
      borderColor: tokens.forest,
      backgroundColor: tokens.parchmentLight,
      color: tokens.forest,
    },
    ".Tab--selected:focus": {
      borderColor: tokens.forest,
      boxShadow: `0 0 0 3px rgba(26, 58, 42, 0.15)`,
    },
    ".TabIcon": {
      fill: tokens.textLight,
      transition: "fill 0.2s ease",
    },
    ".TabIcon--selected": {
      fill: tokens.forest,
    },
    ".TabLabel": {
      fontWeight: "500",
      transition: "color 0.2s ease",
    },
    ".TabLabel--selected": {
      color: tokens.forest,
    },

    // ── Accordion (payment method list) ─────────────────────────
    ".AccordionItem": {
      borderColor: tokens.border,
      borderRadius: tokens.radiusLg,
      transition: "border-color 0.2s ease, background-color 0.2s ease",
    },
    ".AccordionItem--selected": {
      borderColor: tokens.forest,
      backgroundColor: tokens.parchmentLight,
    },

    // ── Block (containers) ──────────────────────────────────────
    ".Block": {
      borderColor: tokens.border,
      borderRadius: tokens.radiusLg,
      backgroundColor: tokens.background,
      padding: "16px",
    },

    // ── Checkbox / Radio ────────────────────────────────────────
    ".Checkbox": {
      borderColor: tokens.border,
      borderRadius: tokens.radiusSm,
      transition: "border-color 0.2s ease, background-color 0.2s ease",
    },
    ".Checkbox--checked": {
      borderColor: tokens.forest,
      backgroundColor: tokens.forest,
    },

    // ── Switch ──────────────────────────────────────────────────
    ".Switch": {
      backgroundColor: tokens.border,
      borderRadius: "9999px",
    },
    ".Switch--checked": {
      backgroundColor: tokens.forest,
    },

    // ── Action (links / buttons inside Elements) ────────────────
    ".Action": {
      color: tokens.river,
      fontWeight: "500",
      transition: "color 0.2s ease",
    },
    ".Action:hover": {
      color: tokens.forestDeep,
    },

    // ── Menu dropdown ───────────────────────────────────────────
    ".MenuAction": {
      color: tokens.textPrimary,
      fontWeight: "400",
      transition: "background-color 0.15s ease",
    },
    ".MenuAction:hover": {
      backgroundColor: tokens.offwhite,
    },

    // ── Picker (country / region dropdowns) ─────────────────────
    ".PickerItem": {
      padding: "10px 14px",
      borderRadius: tokens.radiusMd,
      transition: "background-color 0.15s ease",
    },
    ".PickerItem:hover": {
      backgroundColor: tokens.offwhite,
    },
    ".PickerItem--selected": {
      backgroundColor: tokens.parchmentLight,
      color: tokens.forest,
    },
    ".PickerItem--highlight": {
      backgroundColor: tokens.offwhite,
    },

    // ── Code input (2FA, verification codes) ────────────────────
    ".CodeInput": {
      borderColor: tokens.border,
      borderRadius: tokens.radiusMd,
    },
    ".CodeInput:focus": {
      borderColor: tokens.ring,
      boxShadow: `0 0 0 3px rgba(58, 107, 124, 0.15)`,
    },

    // ── Loading indicators ──────────────────────────────────────
    ".Loading": {
      color: tokens.forest,
    },

    // ── Redirect text ───────────────────────────────────────────
    ".RedirectText": {
      color: tokens.textSecondary,
      fontSize: "13px",
    },
  },
};

/**
 * Connect Embedded Components appearance theme.
 * Used by ConnectComponentsProvider for onboarding, payouts, etc.
 */
export const anglerPassConnectTheme = {
  variables: {
    colorPrimary: tokens.forest,
    colorBackground: tokens.background,
    colorText: tokens.textPrimary,
    colorDanger: tokens.destructive,
    fontFamily: tokens.fontBody,
    borderRadius: tokens.radiusLg,
    fontSizeBase: "15px",
    spacingUnit: "4px",
    colorSecondaryText: tokens.textSecondary,
    colorBorder: tokens.border,
    actionPrimaryColorText: "#ffffff",
    actionPrimaryTextDecorationLine: "none",
    actionSecondaryColorText: tokens.forest,
    badgeSuccessColorText: "#16a34a",
    badgeSuccessColorBackground: "#f0fdf4",
    badgeWarningColorText: "#d97706",
    badgeWarningColorBackground: "#fffbeb",
    badgeDangerColorText: tokens.destructive,
    badgeDangerColorBackground: "#fef2f2",
    badgeNeutralColorText: tokens.textSecondary,
    badgeNeutralColorBackground: tokens.parchmentLight,
    formAccentColor: tokens.forest,
    formHighlightColorBorder: tokens.ring,
    buttonPrimaryColorBackground: tokens.forest,
    buttonPrimaryColorText: "#ffffff",
    buttonPrimaryColorBorder: tokens.forest,
    buttonSecondaryColorBackground: tokens.background,
    buttonSecondaryColorText: tokens.textPrimary,
    buttonSecondaryColorBorder: tokens.border,
    overlayBlurRadius: "4px",
    overlayOpacity: "0.5",
  },
};

/** Re-export tokens for use in custom Stripe-adjacent UI that needs to match. */
export { tokens as stripeDesignTokens };
