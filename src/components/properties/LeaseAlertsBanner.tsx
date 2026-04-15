import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { daysUntil, formatShortDate } from "@/lib/utils";

interface PropertyPricing {
  property_id: string;
  name: string;
  pricing_mode: string;
  classification: string | null;
  lease_paid_through: string | null;
  lease_amount: number;
}

export function LeaseAlertsBanner({
  properties,
}: {
  properties: PropertyPricing[];
}) {
  const leaseProps = properties.filter(
    (p) => p.pricing_mode === "upfront_lease"
  );
  const pastDue = leaseProps.filter((p) => {
    const d = daysUntil(p.lease_paid_through);
    return d !== null && d < 0;
  });
  const expiringSoon = leaseProps.filter((p) => {
    const d = daysUntil(p.lease_paid_through);
    return d !== null && d >= 0 && d <= 30;
  });

  if (pastDue.length === 0 && expiringSoon.length === 0) return null;

  return (
    <div className="space-y-3">
      {pastDue.length > 0 && (
        <Card className="border-red-500/40 bg-red-500/5" role="alert">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-red-700">
              <AlertTriangle className="size-4" />
              Lease past due
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-red-800">
            {pastDue.map((p) => (
              <div
                key={p.property_id}
                className="flex items-center justify-between"
              >
                <span>{p.name}</span>
                <span>
                  Paid through {formatShortDate(p.lease_paid_through)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {expiringSoon.length > 0 && (
        <Card
          className="border-amber-500/40 bg-amber-500/5"
          role="alert"
          aria-live="polite"
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-amber-800">
              <AlertTriangle className="size-4" />
              Lease expiring soon
            </CardTitle>
            <CardDescription className="text-amber-700">
              Renewal needed within the next 30&nbsp;days.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-amber-900">
            {expiringSoon.map((p) => {
              const d = daysUntil(p.lease_paid_through);
              return (
                <div
                  key={p.property_id}
                  className="flex items-center justify-between"
                >
                  <span>{p.name}</span>
                  <span>
                    {d} day{d === 1 ? "" : "s"} — through{" "}
                    {formatShortDate(p.lease_paid_through)}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
