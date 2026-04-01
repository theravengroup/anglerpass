"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  MapPin,
  Users,
  Fish,
  Plus,
  Check,
  Loader2,
  Compass,
} from "lucide-react";

const ROLE_CONFIG: Record<
  string,
  { label: string; icon: typeof Fish; color: string; bg: string; home: string }
> = {
  angler: {
    label: "Angler",
    icon: Fish,
    color: "text-bronze",
    bg: "bg-bronze/10",
    home: "/angler",
  },
  landowner: {
    label: "Landowner",
    icon: MapPin,
    color: "text-forest",
    bg: "bg-forest/10",
    home: "/landowner",
  },
  club_admin: {
    label: "Club Manager",
    icon: Users,
    color: "text-river",
    bg: "bg-river/10",
    home: "/club",
  },
  guide: {
    label: "Guide",
    icon: Compass,
    color: "text-charcoal",
    bg: "bg-charcoal/10",
    home: "/guide",
  },
};

const ADDABLE_ROLES = [
  {
    value: "landowner",
    label: "Become a Landowner",
    description: "List your property for private fishing access",
  },
  {
    value: "club_admin",
    label: "Start a Club",
    description: "Create and manage a fishing club",
  },
  {
    value: "angler",
    label: "Enable Angler Mode",
    description: "Browse and book private fishing waters",
  },
  {
    value: "guide",
    label: "Become a Guide",
    description: "Offer guided fishing trips on AnglerPass",
  },
];

interface RoleSwitcherProps {
  activeRole: string;
  roles: string[];
}

export default function RoleSwitcher({
  activeRole,
  roles,
}: RoleSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [showAddRole, setShowAddRole] = useState(false);
  const [currentRoles, setCurrentRoles] = useState(roles);
  const [currentActive, setCurrentActive] = useState(activeRole);

  const config = ROLE_CONFIG[currentActive] ?? ROLE_CONFIG.angler;
  const ActiveIcon = config.icon;

  const handleSwitch = async (role: string) => {
    if (role === currentActive) {
      setOpen(false);
      return;
    }

    setSwitching(role);
    try {
      const res = await fetch("/api/profile/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (res.ok) {
        setCurrentActive(role);
        setOpen(false);
        const roleConfig = ROLE_CONFIG[role];
        router.push(roleConfig?.home ?? "/dashboard");
        router.refresh();
      }
    } catch {
      // silent
    } finally {
      setSwitching(null);
    }
  };

  const handleAddRole = async (role: string) => {
    setAdding(role);
    try {
      const res = await fetch("/api/profile/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentRoles(data.roles);
        setCurrentActive(data.active_role);
        setShowAddRole(false);
        setOpen(false);
        const roleConfig = ROLE_CONFIG[role];
        router.push(roleConfig?.home ?? "/dashboard");
        router.refresh();
      }
    } catch {
      // silent
    } finally {
      setAdding(null);
    }
  };

  const addableRoles = ADDABLE_ROLES.filter(
    (r) => !currentRoles.includes(r.value)
  );

  return (
    <div className="relative">
      {/* Active role button */}
      <button
        onClick={() => {
          setOpen(!open);
          setShowAddRole(false);
        }}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${config.bg} ${config.color} hover:opacity-80`}
      >
        <ActiveIcon className="size-3.5" />
        {config.label}
        {currentRoles.length > 1 && (
          <ChevronDown
            className={`size-3 transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setOpen(false);
              setShowAddRole(false);
            }}
          />

          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-stone-light/20 bg-white shadow-lg">
            {/* Role list */}
            <div className="p-1.5">
              <p className="px-2 py-1.5 text-xs font-medium uppercase tracking-wider text-text-light">
                Switch Role
              </p>
              {currentRoles
                .filter((r) => r in ROLE_CONFIG)
                .map((role) => {
                  const rc = ROLE_CONFIG[role];
                  const Icon = rc.icon;
                  const isActive = role === currentActive;
                  const isLoading = switching === role;

                  return (
                    <button
                      key={role}
                      onClick={() => handleSwitch(role)}
                      disabled={isLoading}
                      className={`flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors ${
                        isActive
                          ? "bg-offwhite font-medium text-text-primary"
                          : "text-text-secondary hover:bg-offwhite/70 hover:text-text-primary"
                      }`}
                    >
                      <div
                        className={`flex size-7 items-center justify-center rounded-full ${rc.bg}`}
                      >
                        <Icon className={`size-3.5 ${rc.color}`} />
                      </div>
                      <span className="flex-1 text-left">{rc.label}</span>
                      {isActive && <Check className="size-4 text-forest" />}
                      {isLoading && (
                        <Loader2 className="size-4 animate-spin text-text-light" />
                      )}
                    </button>
                  );
                })}
            </div>

            {/* Add role section */}
            {addableRoles.length > 0 && (
              <div className="border-t border-stone-light/15 p-1.5">
                {!showAddRole ? (
                  <button
                    onClick={() => setShowAddRole(true)}
                    className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm text-text-secondary transition-colors hover:bg-offwhite/70 hover:text-text-primary"
                  >
                    <div className="flex size-7 items-center justify-center rounded-full border border-dashed border-stone-light/40">
                      <Plus className="size-3.5 text-text-light" />
                    </div>
                    <span>Add Another Role</span>
                  </button>
                ) : (
                  <div className="space-y-1">
                    <p className="px-2 py-1.5 text-xs font-medium uppercase tracking-wider text-text-light">
                      Add Role
                    </p>
                    {addableRoles.map((ar) => {
                      const rc = ROLE_CONFIG[ar.value];
                      const Icon = rc?.icon ?? Fish;
                      const isLoading = adding === ar.value;

                      return (
                        <Button
                          key={ar.value}
                          variant="ghost"
                          className="flex h-auto w-full items-start gap-2.5 rounded-md px-2 py-2 text-left"
                          onClick={() => handleAddRole(ar.value)}
                          disabled={isLoading}
                        >
                          <div
                            className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${rc?.bg ?? "bg-stone-light/10"}`}
                          >
                            {isLoading ? (
                              <Loader2 className="size-3.5 animate-spin text-text-light" />
                            ) : (
                              <Icon
                                className={`size-3.5 ${rc?.color ?? "text-text-light"}`}
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-primary">
                              {ar.label}
                            </p>
                            <p className="text-xs text-text-light">
                              {ar.description}
                            </p>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
