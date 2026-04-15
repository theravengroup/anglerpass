const STEPS = [
  "Property",
  "Trip Details",
  "Independent Guide Fee",
  "Invite Anglers",
  "Review",
];

export function ProposalStepIndicator({
  currentStep,
}: {
  currentStep: number;
}) {
  return (
    <nav aria-label="Proposal steps" className="mb-8">
      <ol className="flex items-center gap-2">
        {STEPS.map((label, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === currentStep;
          const isComplete = stepNum < currentStep;

          return (
            <li key={label} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-xs font-medium ${
                    isActive
                      ? "bg-charcoal text-white"
                      : isComplete
                        ? "bg-charcoal/20 text-charcoal"
                        : "bg-stone-light/20 text-text-light"
                  }`}
                >
                  {stepNum}
                </span>
                <span
                  className={`hidden text-xs sm:inline ${
                    isActive
                      ? "font-medium text-text-primary"
                      : isComplete
                        ? "text-text-secondary"
                        : "text-text-light"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px w-4 sm:w-8 ${
                    isComplete ? "bg-charcoal/30" : "bg-stone-light/20"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
