"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GUIDE_SERVICE_FEE_RATE, roundCurrency } from "@/lib/constants/fees";

export function ProposalStepFee({
  feePerAngler,
  maxAnglers,
  onChange,
}: {
  feePerAngler: number;
  maxAnglers: number;
  onChange: (fee: number) => void;
}) {
  const serviceFee = roundCurrency(feePerAngler * GUIDE_SERVICE_FEE_RATE);
  const netPerAngler = roundCurrency(feePerAngler - serviceFee);
  const totalGuideFee = roundCurrency(feePerAngler * maxAnglers);

  return (
    <div className="space-y-5">
      <p className="text-sm text-text-secondary">
        Set your independent guide fee per angler. AnglerPass charges a{" "}
        {GUIDE_SERVICE_FEE_RATE * 100}% service fee.
      </p>

      <div className="max-w-xs space-y-2">
        <Label
          htmlFor="guide_fee_per_angler"
          className="text-sm text-text-primary"
        >
          Independent Guide Fee Per Angler ($)
        </Label>
        <Input
          id="guide_fee_per_angler"
          type="number"
          min={0}
          step={5}
          value={feePerAngler || ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="border-stone-light/20"
          placeholder="e.g. 150"
          required
        />
      </div>

      {feePerAngler > 0 && (
        <div className="rounded-lg border border-stone-light/20 bg-offwhite/50 p-4">
          <h4 className="text-xs font-medium text-text-secondary">
            Fee Breakdown
          </h4>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">
                Independent guide fee per angler
              </span>
              <span className="font-medium text-text-primary">
                ${feePerAngler.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">
                AnglerPass service fee ({GUIDE_SERVICE_FEE_RATE * 100}%)
              </span>
              <span className="text-red-500">-${serviceFee.toFixed(2)}</span>
            </div>
            <div className="border-t border-stone-light/20 pt-2" />
            <div className="flex justify-between">
              <span className="font-medium text-text-primary">
                Your net per angler
              </span>
              <span className="font-semibold text-forest">
                ${netPerAngler.toFixed(2)}
              </span>
            </div>
            {maxAnglers > 1 && (
              <div className="flex justify-between text-text-light">
                <span>
                  Total independent guide fee ({maxAnglers} anglers)
                </span>
                <span>${totalGuideFee.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
