"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Search,
  Mail,
  MousePointerClick,
  TrendingUp,
  Tag,
} from "lucide-react";
import AdminPageGuard from "@/components/admin/AdminPageGuard";

interface ContactRow {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  phone_number: string | null;
  sms_opt_in: boolean;
  created_at: string;
  emails_sent: number;
  emails_opened: number;
  conversions: number;
  tags: string[];
}

export default function CrmContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const limit = 25;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(page * limit),
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/crm/contacts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts ?? []);
        setTotal(data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(0);
  }, [search]);

  const totalPages = Math.ceil(total / limit);

  return (
    <AdminPageGuard path="/admin/crm">
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-light" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full rounded-md border border-stone-light/30 py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-light"
            />
          </div>
          <span className="text-xs text-text-secondary">
            {total.toLocaleString()} contact{total !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-charcoal" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="rounded-lg border border-stone-light/20 p-8 text-center">
            <p className="text-sm text-text-secondary">No contacts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-stone-light/20">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-light/20 bg-offwhite/50">
                  <th className="px-4 py-2.5 text-xs font-semibold text-text-secondary">
                    Contact
                  </th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-text-secondary">
                    Role
                  </th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-text-secondary">
                    <Mail className="mx-auto size-3.5" />
                  </th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-text-secondary">
                    <MousePointerClick className="mx-auto size-3.5" />
                  </th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-text-secondary">
                    <TrendingUp className="mx-auto size-3.5" />
                  </th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-text-secondary">
                    Tags
                  </th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-text-secondary">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() =>
                      router.push(`/admin/crm/contacts/${c.id}`)
                    }
                    className="cursor-pointer border-b border-stone-light/10 bg-white transition-colors hover:bg-offwhite/50"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-primary">
                        {c.display_name || "No name"}
                      </p>
                      <p className="text-xs text-text-light">{c.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={c.role} />
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-text-secondary">
                      {c.emails_sent}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-text-secondary">
                      {c.emails_opened}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-text-secondary">
                      {c.conversions}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-0.5 rounded-full bg-forest/10 px-2 py-0.5 text-[10px] font-medium text-forest"
                          >
                            <Tag className="size-2.5" />
                            {tag}
                          </span>
                        ))}
                        {c.tags.length > 3 && (
                          <span className="text-[10px] text-text-light">
                            +{c.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-light">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-md border border-stone-light/30 px-3 py-1.5 text-xs text-text-secondary hover:bg-offwhite disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs text-text-light">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-md border border-stone-light/30 px-3 py-1.5 text-xs text-text-secondary hover:bg-offwhite disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </AdminPageGuard>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    landowner: "bg-forest/10 text-forest",
    club: "bg-river/10 text-river",
    angler: "bg-bronze/10 text-bronze",
    guide: "bg-charcoal/10 text-charcoal",
    admin: "bg-red-50 text-red-600",
  };

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
        colors[role] ?? "bg-stone-light/20 text-text-secondary"
      }`}
    >
      {role}
    </span>
  );
}
