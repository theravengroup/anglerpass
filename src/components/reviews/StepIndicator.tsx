interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export default function StepIndicator({
  currentStep,
  totalSteps,
}: StepIndicatorProps) {
  return (
    <div className="mb-6">
      <p className="mb-2 text-xs font-medium text-text-light">
        Step {currentStep} of {totalSteps}
      </p>
      <div className="flex gap-1.5">
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1;
          const isComplete = step < currentStep;
          const isCurrent = step === currentStep;

          return (
            <div
              key={step}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                isComplete
                  ? "bg-forest"
                  : isCurrent
                    ? "bg-bronze"
                    : "bg-stone-light/25"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
