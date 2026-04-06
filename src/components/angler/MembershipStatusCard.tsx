"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, CreditCard, MapPin, Users } from "lucide-react";
import MembershipCheckoutForm from "@/components/angler/MembershipCheckoutForm";

interface ClubInfo {
  id: string;
  name: string;
  location: string | null;
  logo_url: string | null;
  initiation_fee: number | null;
  annual_dues: number | null;
}

interface MembershipStatusCardProps {
  state: "pending" | "payment_pending";
  club: ClubInfo;
  membershipId?: string;
  applicationStatus?: string;
  onPaymentSuccess?: () => void;
}

export default function MembershipStatusCard({
  state,
  club,
  onPaymentSuccess,
}: MembershipStatusCardProps) {
  if (state === "pending") {
    return (
      <Card className="border-bronze/20 bg-bronze/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="size-5 text-bronze" />
            Application Pending
          </CardTitle>
          <CardDescription>
            Your application is being reviewed by the club manager.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4 rounded-lg border border-stone-light/20 bg-white px-4 py-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-river/10 text-lg font-semibold text-river">
              {club.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-medium text-text-primary">
                {club.name}
              </h3>
              {club.location && (
                <p className="mt-0.5 flex items-center gap-1 text-sm text-text-light">
                  <MapPin className="size-3.5" />
                  {club.location}
                </p>
              )}
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-bronze/5 px-3 py-2">
                <Clock className="size-4 text-bronze" />
                <span className="text-sm text-text-secondary">
                  We&rsquo;ll notify you as soon as the club manager reviews
                  your application.
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // payment_pending state
  return (
    <Card className="border-forest/20 bg-forest/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="size-5 text-forest" />
          Approved — Complete Your Membership
        </CardTitle>
        <CardDescription>
          Great news! {club.name} has approved your application. Complete
          payment to activate your membership and start booking.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4 rounded-lg border border-stone-light/20 bg-white px-4 py-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-river/10 text-lg font-semibold text-river">
            {club.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-base font-medium text-text-primary">
                {club.name}
              </h3>
              {club.location && (
                <span className="flex items-center gap-1 text-xs text-text-light">
                  <MapPin className="size-3" />
                  {club.location}
                </span>
              )}
            </div>
            <MembershipCheckoutForm
              club={{
                id: club.id,
                name: club.name,
                initiation_fee: club.initiation_fee,
                annual_dues: club.annual_dues,
              }}
              onSuccess={() => {
                onPaymentSuccess?.();
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
