"use client";

/**
 * Beautiful credit card display component inspired by untitledui.com.
 *
 * Renders a branded card with 3:2 aspect ratio showing cardholder name,
 * last 4 digits, expiration, card brand, and a decorative chip.
 * Background gradient is role-colored (forest/river/bronze).
 */

type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "unknown";
type RoleTheme = "angler" | "landowner" | "club" | "guide";

interface CardDisplayProps {
  /** Cardholder name as it appears on the card */
  name: string;
  /** Last 4 digits of the card number */
  last4: string;
  /** Expiration month (1-12) */
  expMonth: number;
  /** Expiration year (4-digit) */
  expYear: number;
  /** Card brand from Stripe */
  brand: CardBrand;
  /** Which role theme to use for the gradient background */
  theme?: RoleTheme;
  /** Optional className for the container */
  className?: string;
}

const THEME_GRADIENTS: Record<RoleTheme, string> = {
  angler: "from-bronze to-bronze-light",
  landowner: "from-forest to-forest-deep",
  club: "from-river to-river-light",
  guide: "from-charcoal to-stone",
};

const THEME_PATTERN_OPACITY: Record<RoleTheme, string> = {
  angler: "opacity-10",
  landowner: "opacity-10",
  club: "opacity-10",
  guide: "opacity-10",
};

function CardBrandLogo({ brand }: { brand: CardBrand }) {
  switch (brand) {
    case "visa":
      return (
        <svg viewBox="0 0 48 32" className="h-8 w-12" fill="none" aria-label="Visa">
          <path
            d="M19.5 21.5h-3.2l2-12.3h3.2l-2 12.3zm13.4-12c-.6-.3-1.6-.5-2.9-.5-3.2 0-5.4 1.7-5.4 4.1 0 1.8 1.6 2.8 2.8 3.4 1.2.6 1.6 1 1.6 1.5 0 .8-1 1.2-1.9 1.2-1.2 0-1.9-.2-2.9-.6l-.4-.2-.4 2.7c.7.3 2.1.6 3.5.6 3.4 0 5.5-1.7 5.6-4.2 0-1.4-.8-2.5-2.7-3.4-1.1-.6-1.8-1-1.8-1.5 0-.5.6-1.1 1.8-1.1 1 0 1.8.2 2.4.5l.3.1.4-2.6zm8.4 0h-2.5c-.8 0-1.4.2-1.7 1l-4.8 11.3h3.4l.7-1.9h4.1l.4 1.9h3l-2.6-12.3zm-4 7.9l1.7-4.6.9 4.6h-2.6zM16.3 9.2l-3 8.4-.3-1.6c-.6-1.9-2.3-3.9-4.2-5l2.9 10.9h3.4l5.1-12.7h-3.9z"
            fill="white"
          />
          <path
            d="M10.1 9.2H5l-.1.3c4 1 6.7 3.5 7.8 6.5l-1.1-5.6c-.2-.8-.8-1.1-1.5-1.2z"
            fill="white"
            opacity="0.8"
          />
        </svg>
      );
    case "mastercard":
      return (
        <svg viewBox="0 0 48 32" className="h-8 w-12" fill="none" aria-label="Mastercard">
          <circle cx="18" cy="16" r="10" fill="white" opacity="0.8" />
          <circle cx="30" cy="16" r="10" fill="white" opacity="0.6" />
        </svg>
      );
    case "amex":
      return (
        <span className="text-sm font-bold tracking-wider text-white/90">
          AMEX
        </span>
      );
    case "discover":
      return (
        <span className="text-sm font-bold tracking-wider text-white/90">
          DISCOVER
        </span>
      );
    default:
      return (
        <span className="text-xs font-medium uppercase tracking-wider text-white/60">
          Card
        </span>
      );
  }
}

function ChipIcon() {
  return (
    <svg
      viewBox="0 0 40 30"
      className="h-8 w-10"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="1"
        y="1"
        width="38"
        height="28"
        rx="4"
        fill="white"
        opacity="0.25"
        stroke="white"
        strokeOpacity="0.4"
        strokeWidth="1"
      />
      <line x1="1" y1="10" x2="39" y2="10" stroke="white" strokeOpacity="0.3" strokeWidth="0.5" />
      <line x1="1" y1="20" x2="39" y2="20" stroke="white" strokeOpacity="0.3" strokeWidth="0.5" />
      <line x1="14" y1="1" x2="14" y2="29" stroke="white" strokeOpacity="0.3" strokeWidth="0.5" />
      <line x1="26" y1="1" x2="26" y2="29" stroke="white" strokeOpacity="0.3" strokeWidth="0.5" />
    </svg>
  );
}

function CirclePattern() {
  return (
    <svg
      className="absolute right-0 top-0 h-full w-1/2"
      viewBox="0 0 200 140"
      fill="none"
      preserveAspectRatio="xMaxYMid slice"
      aria-hidden="true"
    >
      <circle cx="160" cy="70" r="100" stroke="white" strokeOpacity="0.08" strokeWidth="1" />
      <circle cx="160" cy="70" r="70" stroke="white" strokeOpacity="0.06" strokeWidth="1" />
      <circle cx="160" cy="70" r="40" stroke="white" strokeOpacity="0.04" strokeWidth="1" />
    </svg>
  );
}

export function CardDisplay({
  name,
  last4,
  expMonth,
  expYear,
  brand,
  theme = "angler",
  className = "",
}: CardDisplayProps) {
  const gradientClass = THEME_GRADIENTS[theme];
  const patternOpacity = THEME_PATTERN_OPACITY[theme];
  const expDisplay = `${String(expMonth).padStart(2, "0")}/${String(expYear).slice(-2)}`;

  return (
    <div
      className={`relative aspect-[1.586/1] w-full max-w-[340px] overflow-hidden rounded-2xl bg-linear-to-br ${gradientClass} p-5 shadow-lg ${className}`}
    >
      {/* Decorative pattern overlay */}
      <div className={`pointer-events-none absolute inset-0 ${patternOpacity}`}>
        <CirclePattern />
      </div>

      {/* Card content */}
      <div className="relative z-10 flex h-full flex-col justify-between">
        {/* Top row: chip + brand */}
        <div className="flex items-start justify-between">
          <ChipIcon />
          <CardBrandLogo brand={brand} />
        </div>

        {/* Card number (masked) */}
        <div className="mt-auto">
          <p className="font-mono text-lg tracking-[0.2em] text-white/90">
            ••••&nbsp;&nbsp;••••&nbsp;&nbsp;••••&nbsp;&nbsp;{last4}
          </p>
        </div>

        {/* Bottom row: name + expiry */}
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/50">
              Card Holder
            </p>
            <p className="text-sm font-medium tracking-wide text-white">
              {name.toUpperCase()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/50">
              Expires
            </p>
            <p className="font-mono text-sm tracking-wider text-white">
              {expDisplay}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
