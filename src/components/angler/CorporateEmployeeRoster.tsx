"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { Users, Loader2 } from "lucide-react";

interface Employee {
  id: string;
  user_id: string | null;
  display_name: string | null;
  email: string | null;
  status: string;
  dues_status: string | null;
  joined_at: string | null;
}

interface CorporateEmployeeRosterProps {
  employees: Employee[];
  onRevoke: (employeeId: string, email: string) => Promise<void>;
}

const STATUS_CLASSES: Record<string, string> = {
  active: "bg-forest/10 text-forest",
  pending: "bg-amber-50 text-amber-700",
  inactive: "bg-stone-light/20 text-text-light",
};

const DUES_CLASSES: Record<string, string> = {
  active: "bg-forest/10 text-forest",
  past_due: "bg-amber-50 text-amber-700",
  grace_period: "bg-orange-50 text-orange-700",
  lapsed: "bg-red-50 text-red-600",
};

const DUES_LABELS: Record<string, string> = {
  active: "Active",
  past_due: "Past Due",
  grace_period: "Grace Period",
  lapsed: "Lapsed",
};

export function CorporateEmployeeRoster({
  employees,
  onRevoke,
}: CorporateEmployeeRosterProps) {
  const [revokingId, setRevokingId] = useState<string | null>(null);

  async function handleRevoke(employee: Employee) {
    setRevokingId(employee.id);
    try {
      await onRevoke(employee.id, employee.email ?? "");
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <Card className="border-stone-light/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="size-4 text-forest" />
          Employee Roster
        </CardTitle>
      </CardHeader>
      <CardContent>
        {employees.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No employees yet"
            description="Invite employees below to add them to your corporate membership."
            iconColor="text-forest"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-light/20 text-left text-xs font-medium text-text-secondary">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Email</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Dues</th>
                  <th className="pb-2 pr-4">Joined</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-light/10">
                {employees.map((employee) => {
                  const statusClass =
                    STATUS_CLASSES[employee.status] ?? STATUS_CLASSES.inactive;
                  const duesClass = employee.dues_status
                    ? (DUES_CLASSES[employee.dues_status] ?? "bg-stone-light/10 text-text-light")
                    : null;
                  const duesLabel = employee.dues_status
                    ? (DUES_LABELS[employee.dues_status] ?? employee.dues_status)
                    : null;

                  return (
                    <tr key={employee.id}>
                      <td className="py-3 pr-4">
                        <span className="font-medium text-text-primary">
                          {employee.display_name ?? "—"}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-text-secondary">
                        {employee.email ?? "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
                        >
                          {employee.status.charAt(0).toUpperCase() +
                            employee.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {duesClass && duesLabel ? (
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${duesClass}`}
                          >
                            {duesLabel}
                          </span>
                        ) : (
                          <span className="text-text-light">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-text-secondary">
                        {employee.joined_at
                          ? new Date(employee.joined_at).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric", year: "numeric" }
                            )
                          : "—"}
                      </td>
                      <td className="py-3">
                        {employee.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-200 text-xs text-red-500 hover:bg-red-50"
                            onClick={() => handleRevoke(employee)}
                            disabled={revokingId === employee.id}
                            aria-label={`Remove ${employee.display_name ?? employee.email ?? "employee"}`}
                          >
                            {revokingId === employee.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              "Remove"
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
