import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Network } from "lucide-react";

interface CrossClubNetworkCardProps {
  crossClubBookingCount: number;
}

export default function CrossClubNetworkCard({
  crossClubBookingCount,
}: CrossClubNetworkCardProps) {
  if (crossClubBookingCount <= 0) return null;

  return (
    <Card className="border-stone-light/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Network className="size-4 text-river" />
          Cross-Club Network
        </CardTitle>
        <CardDescription>
          Bookings from members of other clubs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-river/20 bg-river/5 p-4">
          <p className="text-2xl font-semibold text-river">
            {crossClubBookingCount}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Cross-club bookings on your properties
          </p>
          <p className="mt-2 text-xs text-text-light">
            Your club earns the standard $5/rod commission on these bookings.
            The visiting angler&apos;s home club earns a $5/rod referral fee.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
