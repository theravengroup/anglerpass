import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus } from "lucide-react";

export const metadata = {
  title: "Members",
};

export default function MembersPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
            Members
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            View and manage your club membership roster.
          </p>
        </div>
        <Button className="bg-forest text-white hover:bg-forest/90">
          <UserPlus className="size-4" />
          Invite Members
        </Button>
      </div>

      <Card className="border-stone-light/20">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="flex size-14 items-center justify-center rounded-full bg-forest/10">
            <Users className="size-6 text-forest" />
          </div>
          <h3 className="mt-4 text-base font-medium text-text-primary">
            No members yet
          </h3>
          <p className="mt-1 max-w-sm text-center text-sm text-text-secondary">
            Invite anglers to join your club and manage their access to your
            private waters.
          </p>
          <Button className="mt-6 bg-forest text-white hover:bg-forest/90">
            <UserPlus className="size-4" />
            Invite Members
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
