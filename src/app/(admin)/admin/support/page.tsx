"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Loader2,
  LifeBuoy,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  Tag,
  MessageSquare,
  Save,
} from "lucide-react";
import {
  SUPPORT_CATEGORIES,
  SUPPORT_STATUSES,
  SUPPORT_PRIORITIES,
  STATUS_LABELS,
  PRIORITY_LABELS,
} from "@/lib/validations/support-ticket";
import AdminPageGuard from "@/components/admin/AdminPageGuard";

interface SupportTicket {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  admin_notes: string | null;
  user_display_name: string | null;
  user_email: string | null;
}

interface TicketsResponse {
  tickets: SupportTicket[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
  open: "bg-amber-100 text-amber-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
};

const PRIORITY_BADGE_CLASSES: Record<string, string> = {
  low: "bg-stone-light/30 text-text-secondary",
  normal: "bg-blue-100 text-blue-700",
  high: "bg-red-100 text-red-700",
};

export default function AdminSupportPage() {
  const [data, setData] = useState<TicketsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Detail sheet state
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editAssignedTo, setEditAssignedTo] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/admin/support?${params}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // Silent fail — matches existing admin page pattern
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, categoryFilter, searchQuery]);

  useEffect(() => {
    const debounce = setTimeout(loadTickets, 300);
    return () => clearTimeout(debounce);
  }, [loadTickets]);

  function openTicketDetail(ticket: SupportTicket) {
    setSelectedTicket(ticket);
    setEditStatus(ticket.status);
    setEditPriority(ticket.priority);
    setEditAssignedTo(ticket.assigned_to ?? "");
    setEditNotes(ticket.admin_notes ?? "");
    setSaveError(null);
    setSaveSuccess(false);
    setSheetOpen(true);
  }

  async function handleSave() {
    if (!selectedTicket) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: selectedTicket.id,
          updates: {
            status: editStatus,
            priority: editPriority,
            assigned_to: editAssignedTo || null,
            admin_notes: editNotes || null,
          },
        }),
      });

      if (res.ok) {
        const { ticket } = await res.json();
        setSaveSuccess(true);

        // Update ticket in local state
        setSelectedTicket({
          ...selectedTicket,
          ...ticket,
        });
        setData((prev) =>
          prev
            ? {
                ...prev,
                tickets: prev.tickets.map((t) =>
                  t.id === ticket.id
                    ? { ...t, ...ticket }
                    : t
                ),
              }
            : prev
        );

        setTimeout(() => setSaveSuccess(false), 2000);
      } else {
        const err = await res.json();
        setSaveError(err.error ?? "Failed to update ticket");
      }
    } catch {
      setSaveError("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  }

  // Stats summary
  const openCount =
    data?.tickets.filter((t) => t.status === "open").length ?? 0;
  const inProgressCount =
    data?.tickets.filter((t) => t.status === "in_progress").length ?? 0;

  return (
    <AdminPageGuard path="/admin/support">
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Page header */}
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Support Tickets
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Manage user support requests.
          {data && (
            <span className="ml-1 font-medium">
              ({data.total} total
              {openCount > 0 && ` · ${openCount} open`}
              {inProgressCount > 0 && ` · ${inProgressCount} in progress`})
            </span>
          )}
        </p>
      </div>

      {/* Filter bar */}
      <Card className="border-stone-light/20">
        <CardContent className="py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-light" />
              <input
                type="text"
                placeholder="Search by subject..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="h-9 w-full rounded-md border border-stone-light/25 bg-white pl-9 pr-3 text-sm text-text-primary placeholder:text-text-light focus:border-forest/40 focus:outline-none focus:ring-2 focus:ring-forest/15"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-md border border-stone-light/25 bg-white px-3 text-sm text-text-primary focus:border-forest/40 focus:outline-none focus:ring-2 focus:ring-forest/15"
              >
                <option value="">All Statuses</option>
                {SUPPORT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-md border border-stone-light/25 bg-white px-3 text-sm text-text-primary focus:border-forest/40 focus:outline-none focus:ring-2 focus:ring-forest/15"
              >
                <option value="">All Categories</option>
                {SUPPORT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets table */}
      <Card className="border-stone-light/20">
        <CardContent className="p-0">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[1fr_1.5fr_1.5fr_1fr_1fr_1fr] gap-4 border-b border-stone-light/15 px-6 py-3 text-xs font-medium uppercase tracking-wider text-text-light">
            <span>Submitted</span>
            <span>User</span>
            <span>Subject</span>
            <span>Category</span>
            <span>Priority</span>
            <span>Status</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-river" />
            </div>
          ) : !data?.tickets?.length ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="flex size-14 items-center justify-center rounded-full bg-forest/10">
                <LifeBuoy className="size-6 text-forest" />
              </div>
              <h3 className="mt-4 text-base font-medium text-text-primary">
                No tickets found
              </h3>
              <p className="mt-1 max-w-sm text-center text-sm text-text-secondary">
                {statusFilter || categoryFilter || searchQuery
                  ? "Try adjusting your filters."
                  : "Support tickets will appear here when users submit them."}
              </p>
            </div>
          ) : (
            <div>
              {data.tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => openTicketDetail(ticket)}
                  className="w-full text-left grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_1.5fr_1fr_1fr_1fr] items-center gap-2 sm:gap-4 border-b border-stone-light/10 px-6 py-3 text-sm last:border-b-0 transition-colors hover:bg-offwhite/50"
                >
                  {/* Submitted */}
                  <span className="text-xs text-text-light">
                    {new Date(ticket.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>

                  {/* User */}
                  <span className="truncate text-text-secondary">
                    {ticket.user_display_name ?? ticket.user_email ?? "—"}
                  </span>

                  {/* Subject */}
                  <span className="truncate font-medium text-text-primary">
                    {ticket.subject}
                  </span>

                  {/* Category */}
                  <span className="text-xs text-text-secondary">
                    {ticket.category}
                  </span>

                  {/* Priority */}
                  <span>
                    <Badge
                      variant="secondary"
                      className={
                        PRIORITY_BADGE_CLASSES[ticket.priority] ??
                        PRIORITY_BADGE_CLASSES.normal
                      }
                    >
                      {PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
                    </Badge>
                  </span>

                  {/* Status */}
                  <span>
                    <Badge
                      variant="secondary"
                      className={
                        STATUS_BADGE_CLASSES[ticket.status] ??
                        STATUS_BADGE_CLASSES.open
                      }
                    >
                      {STATUS_LABELS[ticket.status] ?? ticket.status}
                    </Badge>
                  </span>
                </button>
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

      {/* Ticket detail sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
          {selectedTicket && (
            <>
              <SheetHeader>
                <SheetTitle className="font-[family-name:var(--font-heading)] text-text-primary pr-8">
                  {selectedTicket.subject}
                </SheetTitle>
                <SheetDescription>
                  Ticket #{selectedTicket.id.slice(0, 8)}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 px-4 pb-4">
                {/* Ticket metadata */}
                <div className="space-y-3 rounded-lg border border-stone-light/20 bg-offwhite/50 p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="size-4 text-text-light" />
                    <span className="text-text-secondary">
                      {selectedTicket.user_display_name ??
                        selectedTicket.user_email ??
                        "Unknown user"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="size-4 text-text-light" />
                    <span className="text-text-secondary">
                      {new Date(selectedTicket.created_at).toLocaleString(
                        "en-US",
                        {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Tag className="size-4 text-text-light" />
                    <span className="text-text-secondary">
                      {selectedTicket.category}
                    </span>
                  </div>
                  {selectedTicket.updated_at !== selectedTicket.created_at && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="size-4 text-text-light" />
                      <span className="text-text-secondary">
                        Updated{" "}
                        {new Date(
                          selectedTicket.updated_at
                        ).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Full message */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="size-4 text-text-light" />
                    <span className="text-sm font-medium text-text-primary">
                      Message
                    </span>
                  </div>
                  <div className="rounded-lg border border-stone-light/20 bg-white p-4 text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                    {selectedTicket.message}
                  </div>
                </div>

                {/* Editable fields */}
                <div className="space-y-4 border-t border-stone-light/15 pt-4">
                  <h4 className="text-sm font-medium text-text-primary">
                    Manage Ticket
                  </h4>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <Label className="text-sm text-text-secondary">
                      Status
                    </Label>
                    <Select
                      value={editStatus}
                      onValueChange={setEditStatus}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priority */}
                  <div className="space-y-1.5">
                    <Label className="text-sm text-text-secondary">
                      Priority
                    </Label>
                    <Select
                      value={editPriority}
                      onValueChange={setEditPriority}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORT_PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {PRIORITY_LABELS[p]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Assigned to */}
                  <div className="space-y-1.5">
                    <Label className="text-sm text-text-secondary">
                      Assigned To
                    </Label>
                    <Input
                      value={editAssignedTo}
                      onChange={(e) => setEditAssignedTo(e.target.value)}
                      placeholder="Name of assignee"
                      maxLength={100}
                    />
                  </div>

                  {/* Admin notes */}
                  <div className="space-y-1.5">
                    <Label className="text-sm text-text-secondary">
                      Internal Notes
                    </Label>
                    <Textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Notes visible to admins only..."
                      rows={3}
                      maxLength={5000}
                    />
                  </div>

                  {/* Save error */}
                  {saveError && (
                    <div
                      className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                      role="alert"
                      aria-live="polite"
                    >
                      <AlertCircle className="mt-0.5 size-4 shrink-0" />
                      <span>{saveError}</span>
                    </div>
                  )}

                  {/* Save success */}
                  {saveSuccess && (
                    <div
                      className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
                      role="status"
                      aria-live="polite"
                    >
                      <CheckCircle2 className="size-4 shrink-0" />
                      <span>Changes saved</span>
                    </div>
                  )}

                  {/* Save button */}
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-forest text-white hover:bg-forest-deep"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-1.5 size-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-1.5 size-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
    </AdminPageGuard>
  );
}
