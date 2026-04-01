import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  /** Tailwind max-width class (e.g. "max-w-4xl", "max-w-5xl"). Defaults to "max-w-5xl". */
  maxWidth?: string;
  /** Tailwind text color class for the spinner (e.g. "text-forest", "text-bronze"). Defaults to "text-charcoal". */
  color?: string;
}

export function LoadingSpinner({
  maxWidth = "max-w-5xl",
  color = "text-charcoal",
}: LoadingSpinnerProps) {
  return (
    <div className={`mx-auto flex ${maxWidth} items-center justify-center py-24`}>
      <Loader2 className={`size-6 animate-spin ${color}`} />
    </div>
  );
}
