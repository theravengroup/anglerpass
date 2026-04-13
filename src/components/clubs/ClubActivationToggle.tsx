"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Power, Loader2, AlertTriangle } from "lucide-react";

interface ClubActivationToggleProps {
  clubId: string;
  isActive: boolean;
  hasProperties: boolean;
  onToggle: (newState: boolean) => void;
}

export default function ClubActivationToggle({
  clubId,
  isActive,
  hasProperties,
  onToggle,
}: ClubActivationToggleProps) {
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setToggling(true);
    setError(null);

    try {
      const res = await fetch(`/api/clubs/${clubId}/activate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !isActive }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to update club status");
        return;
      }

      onToggle(!isActive);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setToggling(false);
    }
  }

  // Can't activate without properties
  if (!hasProperties && !isActive) {
    return (
      <Card className="border-stone-light/20 bg-sand/30">
        <CardContent className="flex items-center gap-3 py-4">
          <AlertTriangle className="size-5 shrink-0 text-bronze" />
          <div>
            <p className="text-sm font-medium text-text-primary">
              Club Inactive
            </p>
            <p className="text-xs text-text-secondary">
              Add at least one property before you can activate your club and
              make it visible to anglers.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={
        isActive
          ? "border-forest/20 bg-forest/5"
          : "border-bronze/20 bg-bronze/5"
      }
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Power
              className={`size-4 ${isActive ? "text-forest" : "text-bronze"}`}
            />
            <CardTitle className="text-base">
              Club {isActive ? "Active" : "Inactive"}
            </CardTitle>
          </div>
          <Button
            size="sm"
            variant={isActive ? "outline" : "default"}
            className={
              isActive
                ? "border-red-200 text-red-600 hover:bg-red-50"
                : "bg-forest text-white hover:bg-forest-deep"
            }
            onClick={handleToggle}
            disabled={toggling}
          >
            {toggling && <Loader2 className="mr-1 size-3 animate-spin" />}
            {isActive ? "Deactivate Club" : "Activate Club"}
          </Button>
        </div>
        <CardDescription className="text-xs">
          {isActive
            ? "Your club and its properties are visible to anglers on AnglerPass."
            : "Your club and its properties are hidden from anglers. Activate to go live."}
        </CardDescription>
      </CardHeader>
      {error && (
        <CardContent className="pt-0">
          <p className="text-xs text-red-600" role="alert" aria-live="polite">
            {error}
          </p>
        </CardContent>
      )}
    </Card>
  );
}
