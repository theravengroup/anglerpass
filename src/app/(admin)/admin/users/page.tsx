import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Users } from "lucide-react";

export const metadata = {
  title: "User Management",
};

export default function UsersPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          User Management
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Search, filter, and manage all registered users.
        </p>
      </div>

      {/* Search / Filter bar */}
      <Card className="border-stone-light/20">
        <CardContent className="py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-light" />
              <input
                type="text"
                placeholder="Search by name or email..."
                className="h-9 w-full rounded-md border border-stone-light/25 bg-white pl-9 pr-3 text-sm text-text-primary placeholder:text-text-light focus:border-forest/40 focus:outline-none focus:ring-2 focus:ring-forest/15"
                disabled
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                All Roles
              </Button>
              <Button variant="outline" size="sm" disabled>
                All Statuses
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users table */}
      <Card className="border-stone-light/20">
        <CardContent className="p-0">
          {/* Table header */}
          <div className="grid grid-cols-[1.5fr_2fr_1fr_1fr_1fr] gap-4 border-b border-stone-light/15 px-6 py-3 text-xs font-medium uppercase tracking-wider text-text-light">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
            <span>Joined</span>
          </div>

          {/* Empty state */}
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex size-14 items-center justify-center rounded-full bg-forest/10">
              <Users className="size-6 text-forest" />
            </div>
            <h3 className="mt-4 text-base font-medium text-text-primary">
              No users found
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-text-secondary">
              Registered users will appear here once people start signing up for
              AnglerPass.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
