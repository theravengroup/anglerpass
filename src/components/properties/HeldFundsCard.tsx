import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, Clock } from "lucide-react";

interface HeldFundsCardProps {
  heldFundsTotal: number;
  awaitingCapture: number;
}

export default function HeldFundsCard({
  heldFundsTotal,
  awaitingCapture,
}: HeldFundsCardProps) {
  if (heldFundsTotal <= 0 && awaitingCapture <= 0) return null;

  return (
    <Card className="border-forest/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="size-4 text-forest" />
          Funds in Pipeline
        </CardTitle>
        <CardDescription>
          Payments held or awaiting your action
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border border-forest/20 bg-forest/5 p-4">
          <p className="text-2xl font-semibold text-forest">
            ${heldFundsTotal.toLocaleString()}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Total held or awaiting payout
          </p>
        </div>
        {awaitingCapture > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-forest">
            <Clock className="size-3" />
            {awaitingCapture} completed trip
            {awaitingCapture !== 1 ? "s" : ""} awaiting payment capture.
            <Link href="/landowner/bookings" className="underline">
              Review bookings
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
