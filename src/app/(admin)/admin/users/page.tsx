"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Search,
  Users,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Ban,
  CheckCircle2,
  MoreHorizontal,
  Download,
  Eye,
  Trash2,
  EyeOff,
} from "lucide-react";
import { startImpersonation } from "@/lib/admin/actions/impersonation";
import {
  ROLE_LABELS,
  ROLE_BADGE_COLORS,
  VALID_ROLES,
} from "@/lib/constants/status";
import { downloadCSV } from "@/lib/csv";
import AdminPageGuard from "@/components/admin/AdminPageGuard";

interface User {
  id: string;
  display_name: string | null;
  email: string | null;
  role: string;
  created_at: string;
  suspended_at: string | null;
  suspended_reason: string | null;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/** Role filter dropdown options (empty string = "All Roles") */
const ROLE_FILTER_OPTIONS = ["", ...VALID_ROLES];
const STATUS_FILTER_OPTIONS = ["", "active", "suspended"];

export default function UsersPage() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [hideInternal, setHideInternal] = useState(true);
  const [actionUser, setActionUser] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (!hideInternal) params.set("hide_internal", "false");

      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const debounce = setTimeout(load, 300);
    return () => clearTimeout(debounce);
  }, [page, search, roleFilter, statusFilter, hideInternal]);

  async function handleAction(
    userId: string,
    action: "change_role" | "suspend" | "unsuspend",
    role?: string,
    reason?: string
  ) {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, action, role, reason }),
      });

      if (res.ok) {
        await load(); // Refresh
      } else {
        const err = await res.json();
        alert(err.error ?? "Action failed");
      }
    } catch {
      alert("An error occurred");
    } finally {
      setActionLoading(false);
      setActionUser(null);
    }
  }

  async function handleDelete(userId: string, displayName: string | null) {
    const confirmed = confirm(
      `Permanently delete user "${displayName ?? userId}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users?user_id=${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await load();
      } else {
        const err = await res.json();
        alert(err.error ?? "Delete failed");
      }
    } catch {
      alert("An error occurred");
    } finally {
      setActionLoading(false);
      setActionUser(null);
    }
  }

  function handleExport() {
    if (!data) return;
    downloadCSV(
      [
        ["Name", "Email", "Role", "Status", "Joined"],
        ...data.users.map((u) => [
          u.display_name ?? "",
          u.email ?? "",
          u.role,
          u.suspended_at ? "Suspended" : "Active",
          new Date(u.created_at).toLocaleDateString(),
        ]),
      ],
      `anglerpass-users-${new Date().toISOString().slice(0, 10)}.csv`
    );
  }

  return (
    <AdminPageGuard path="/admin/users">
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
            User Management
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Search, filter, and manage all registered users.
            {data && (
              <span className="ml-1 font-medium">
                ({data.total} total)
              </span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={handleExport}
          disabled={!data?.users?.length}
        >
          <Download className="mr-1 size-3" />
          Export
        </Button>
      </div>

      {/* Search / Filter bar */}
      <Card className="border-stone-light/20">
        <CardContent className="py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-light" />
              <input
                type="text"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-9 w-full rounded-md border border-stone-light/25 bg-white pl-9 pr-3 text-sm text-text-primary placeholder:text-text-light focus:border-forest/40 focus:outline-none focus:ring-2 focus:ring-forest/15"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-md border border-stone-light/25 bg-white px-3 text-sm text-text-primary focus:border-forest/40 focus:outline-none focus:ring-2 focus:ring-forest/15"
              >
                {ROLE_FILTER_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r ? ROLE_LABELS[r] : "All Roles"}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setHideInternal(!hideInternal);
                  setPage(1);
                }}
                className={`flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm transition-colors ${
                  hideInternal
                    ? "border-stone-light/25 bg-white text-text-secondary hover:bg-offwhite"
                    : "border-forest/30 bg-forest/5 text-forest"
                }`}
                title={hideInternal ? "Internal @anglerpass.com accounts are hidden" : "Showing all accounts"}
              >
                <EyeOff className="size-3.5" />
                {hideInternal ? "Internal hidden" : "Showing all"}
              </button>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-md border border-stone-light/25 bg-white px-3 text-sm text-text-primary focus:border-forest/40 focus:outline-none focus:ring-2 focus:ring-forest/15"
              >
                {STATUS_FILTER_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s === "" ? "All Statuses" : s === "active" ? "Active" : "Suspended"}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users table */}
      <Card className="border-stone-light/20">
        <CardContent className="p-0">
          {/* Table header */}
          <div className="grid grid-cols-[1.5fr_2fr_1fr_1fr_1fr_auto] gap-4 border-b border-stone-light/15 px-6 py-3 text-xs font-medium uppercase tracking-wider text-text-light">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
            <span>Joined</span>
            <span>Actions</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-river" />
            </div>
          ) : !data?.users?.length ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="flex size-14 items-center justify-center rounded-full bg-forest/10">
                <Users className="size-6 text-forest" />
              </div>
              <h3 className="mt-4 text-base font-medium text-text-primary">
                No users found
              </h3>
              <p className="mt-1 max-w-sm text-center text-sm text-text-secondary">
                {search || roleFilter || statusFilter
                  ? "Try adjusting your filters."
                  : "Registered users will appear here."}
              </p>
            </div>
          ) : (
            <div>
              {data.users.map((u) => (
                <div
                  key={u.id}
                  className={`grid grid-cols-[1.5fr_2fr_1fr_1fr_1fr_auto] items-center gap-4 border-b border-stone-light/10 px-6 py-3 text-sm last:border-b-0 ${
                    u.suspended_at ? "bg-red-50/30" : ""
                  }`}
                >
                  <span className="truncate font-medium text-text-primary">
                    {u.display_name ?? "—"}
                  </span>
                  <span className="truncate text-text-secondary">
                    {u.email ?? "—"}
                  </span>
                  <span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        ROLE_BADGE_COLORS[u.role] ?? ROLE_BADGE_COLORS.angler
                      }`}
                    >
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </span>
                  <span>
                    {u.suspended_at ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500">
                        <Ban className="size-3" />
                        Suspended
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-forest">
                        <CheckCircle2 className="size-3" />
                        Active
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-text-light">
                    {new Date(u.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="relative">
                    <button
                      onClick={() =>
                        setActionUser(actionUser === u.id ? null : u.id)
                      }
                      className="rounded-md p-1 text-text-light transition-colors hover:bg-offwhite hover:text-text-primary"
                      disabled={actionLoading}
                    >
                      <MoreHorizontal className="size-4" />
                    </button>

                    {/* Dropdown menu */}
                    {actionUser === u.id && (
                      <div className="absolute right-0 top-8 z-10 w-48 rounded-lg border border-stone-light/20 bg-white py-1 shadow-lg">
                        {/* Role change options */}
                        <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-text-light">
                          Change Role
                        </p>
                        {ROLE_FILTER_OPTIONS.filter((r) => r && r !== u.role).map((r) => (
                          <button
                            key={r}
                            onClick={() => handleAction(u.id, "change_role", r)}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-text-primary hover:bg-offwhite"
                            disabled={actionLoading}
                          >
                            <ShieldCheck className="size-3.5 text-text-light" />
                            {ROLE_LABELS[r]}
                          </button>
                        ))}

                        {/* Impersonate (non-admin users only) */}
                        {u.role !== "admin" && (
                          <>
                            <div className="my-1 border-t border-stone-light/15" />
                            <form action={startImpersonation}>
                              <input type="hidden" name="targetUserId" value={u.id} />
                              <button
                                type="submit"
                                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-bronze hover:bg-bronze/5"
                                disabled={actionLoading}
                              >
                                <Eye className="size-3.5" />
                                Impersonate User
                              </button>
                            </form>
                          </>
                        )}

                        <div className="my-1 border-t border-stone-light/15" />

                        {/* Suspend / Unsuspend */}
                        {u.suspended_at ? (
                          <button
                            onClick={() => handleAction(u.id, "unsuspend")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-forest hover:bg-offwhite"
                            disabled={actionLoading}
                          >
                            <CheckCircle2 className="size-3.5" />
                            Unsuspend User
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const reason = prompt(
                                "Reason for suspension (optional):"
                              );
                              if (reason !== null) {
                                handleAction(u.id, "suspend", undefined, reason || undefined);
                              }
                            }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-red-500 hover:bg-red-50"
                            disabled={actionLoading}
                          >
                            <Ban className="size-3.5" />
                            Suspend User
                          </button>
                        )}

                        <div className="my-1 border-t border-stone-light/15" />
                        <button
                          onClick={() => handleDelete(u.id, u.display_name)}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
                          disabled={actionLoading}
                        >
                          <Trash2 className="size-3.5" />
                          Delete User
                        </button>
                      </div>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {data && data.total_pages > 1 && (
            <div className="flex items-center justify-between border-t border-stone-light/15 px-6 py-3">
              <p className="text-xs text-text-light">
                Showing {(data.page - 1) * data.page_size + 1}–
                {Math.min(data.page * data.page_size, data.total)} of{" "}
                {data.total}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1}
                  className="size-8 p-0"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= data.total_pages}
                  className="size-8 p-0"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </AdminPageGuard>
  );
}
