"use client";

/**
 * Beautiful bank account display card, styled to match CardDisplay.
 *
 * Shows bank name, account holder, last 4 of account number,
 * and account type (checking/savings). Uses a deep forest-green
 * professional palette.
 */

type AccountType = "checking" | "savings";

interface BankAccountDisplayProps {
  /** Account holder name */
  name: string;
  /** Bank / institution name */
  bankName: string;
  /** Last 4 digits of the account number */
  last4: string;
  /** Account type */
  accountType?: AccountType;
  /** Optional className for the container */
  className?: string;
}

function BankIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      className="h-8 w-8"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M16 3L3 11h2v2h22v-2h2L16 3z"
        fill="white"
        opacity="0.9"
      />
      <rect x="6" y="14" width="3" height="10" rx="0.5" fill="white" opacity="0.7" />
      <rect x="11" y="14" width="3" height="10" rx="0.5" fill="white" opacity="0.7" />
      <rect x="18" y="14" width="3" height="10" rx="0.5" fill="white" opacity="0.7" />
      <rect x="23" y="14" width="3" height="10" rx="0.5" fill="white" opacity="0.7" />
      <rect x="3" y="25" width="26" height="3" rx="1" fill="white" opacity="0.9" />
    </svg>
  );
}

function GridPattern() {
  return (
    <svg
      className="absolute right-0 top-0 h-full w-1/2"
      viewBox="0 0 200 140"
      fill="none"
      preserveAspectRatio="xMaxYMid slice"
      aria-hidden="true"
    >
      {/* Horizontal lines */}
      {[20, 40, 60, 80, 100, 120].map((y) => (
        <line
          key={`h-${y}`}
          x1="80"
          y1={y}
          x2="200"
          y2={y}
          stroke="white"
          strokeOpacity="0.05"
          strokeWidth="0.5"
        />
      ))}
      {/* Vertical lines */}
      {[100, 120, 140, 160, 180].map((x) => (
        <line
          key={`v-${x}`}
          x1={x}
          y1="0"
          x2={x}
          y2="140"
          stroke="white"
          strokeOpacity="0.05"
          strokeWidth="0.5"
        />
      ))}
    </svg>
  );
}

export function BankAccountDisplay({
  name,
  bankName,
  last4,
  accountType = "checking",
  className = "",
}: BankAccountDisplayProps) {
  return (
    <div
      className={`relative aspect-[1.586/1] w-full max-w-[340px] overflow-hidden rounded-2xl bg-linear-to-br from-forest-deep to-forest p-5 shadow-lg ${className}`}
    >
      {/* Decorative pattern overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-10">
        <GridPattern />
      </div>

      {/* Card content */}
      <div className="relative z-10 flex h-full flex-col justify-between">
        {/* Top row: bank icon + BANK label */}
        <div className="flex items-start justify-between">
          <BankIcon />
          <span className="text-sm font-bold uppercase tracking-widest text-white/80">
            Bank
          </span>
        </div>

        {/* Bank name + account number */}
        <div className="mt-auto">
          <p className="text-xs font-medium uppercase tracking-wider text-white/50">
            {bankName}
          </p>
          <p className="mt-1 font-mono text-lg tracking-[0.2em] text-white/90">
            ••••&nbsp;&nbsp;{last4}
          </p>
        </div>

        {/* Bottom row: name + account type */}
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/50">
              Account Holder
            </p>
            <p className="text-sm font-medium tracking-wide text-white">
              {name.toUpperCase()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/50">
              Account Type
            </p>
            <p className="text-sm font-medium capitalize tracking-wide text-white">
              {accountType}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
