interface AnglerPassLogoProps {
  className?: string;
}

export default function AnglerPassLogo({ className }: AnglerPassLogoProps) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className}>
      <path
        d="M14 2C7.37 2 2 7.37 2 14s5.37 12 12 12 12-5.37 12-12S20.63 2 14 2z"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
      />
      <path
        d="M6 18c2-3 4-8 8-8s6 5 8 8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M10 13c0-2 1.5-5 4-5s4 3 4 5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity=".4"
      />
      <circle cx="14" cy="8" r="1.5" fill="currentColor" opacity=".6" />
    </svg>
  );
}
