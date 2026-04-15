import { Card, CardContent } from "@/components/ui/card";

export function FinancialSummaryCard() {
  return (
    <Card className="border-stone-light/20 bg-offwhite/50">
      <CardContent className="py-5">
        <div className="grid gap-4 text-xs leading-relaxed text-text-light sm:grid-cols-2">
          <div>
            <strong className="text-text-secondary">Revenue streams:</strong>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              <li>15% platform fee on rod bookings (paid by angler)</li>
              <li>
                $25/rod cross-club access fee ($20 AP + $5 home club referral)
              </li>
              <li>10% independent guide service fee (paid by angler)</li>
              <li>
                5% platform fee on membership payments
              </li>
            </ul>
          </div>
          <div>
            <strong className="text-text-secondary">Payout splits:</strong>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              <li>
                Landowners receive base rod fee minus $5/rod club commission
              </li>
              <li>
                Clubs receive $5/rod commission + membership fees + $5/rod
                referral when members fish cross-club
              </li>
              <li>Independent guides receive 100% of their listed day rate</li>
              <li>All payouts processed via Stripe Connect</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
