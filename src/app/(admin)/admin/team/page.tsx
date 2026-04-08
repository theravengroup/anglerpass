"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  UserPlus,
  ShieldCheck,
  Mail,
  Loader2,
  Clock,
  Users,
} from "lucide-react";
import AdminPageGuard from "@/components/admin/AdminPageGuard";

interface Admin {
  id: string;
  display_name: string | null;
  email: string;
  created_at: string;
}

interface Invite {
  id: string;
  email: string;
  invited_by_name: string | null;
  invited_by_email: string | null;
  created_at: string;
}

export default function TeamPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/admin/invite");
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.admins ?? []);
        setInvites(data.recentInvites ?? []);
      }
    } catch {
      // Silent fail on load
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleInvite(e: FormEvent) {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    setSending(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          name: name.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: data.message ?? "Invitation sent successfully." });
        setEmail("");
        setName("");
        await load();
      } else {
        setMessage({ type: "error", text: data.error ?? "Failed to send invitation." });
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred. Please try again." });
    } finally {
      setSending(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function getInitial(admin: Admin): string {
    if (admin.display_name) return admin.display_name.charAt(0).toUpperCase();
    if (admin.email) return admin.email.charAt(0).toUpperCase();
    return "?";
  }

  return (
    <AdminPageGuard path="/admin/team">
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Team Management
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Manage AnglerPass administrators
        </p>
      </div>

      {/* Invite Form Card */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-text-primary">
            <UserPlus className="size-4 text-river" />
            Invite Admin
          </CardTitle>
          <CardDescription>
            Send an invitation to join the AnglerPass admin team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={sending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-name">
                  Name <span className="text-text-light">(optional)</span>
                </Label>
                <Input
                  id="invite-name"
                  type="text"
                  placeholder="Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={sending}
                />
              </div>
            </div>

            {message && (
              <div
                className={`rounded-md px-3 py-2 text-sm ${
                  message.type === "success"
                    ? "bg-forest/10 text-forest"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {message.text}
              </div>
            )}

            <Button
              type="submit"
              disabled={sending || !email.trim()}
              className="bg-river text-white hover:bg-river/90"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 size-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Current Admins Card */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-text-primary">
            <ShieldCheck className="size-4 text-charcoal" />
            Current Administrators
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-river" />
            </div>
          ) : admins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="flex size-12 items-center justify-center rounded-full bg-charcoal/10">
                <Users className="size-5 text-charcoal" />
              </div>
              <p className="mt-3 text-sm text-text-secondary">
                No administrators found.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-light/15">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-charcoal/10 text-sm font-semibold text-charcoal">
                    {getInitial(admin)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {admin.display_name ?? admin.email}
                    </p>
                    {admin.display_name && (
                      <p className="truncate text-xs text-text-light">
                        {admin.email}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-xs text-text-light">
                    <Clock className="size-3" />
                    Since {formatDate(admin.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Invitations Card */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-text-primary">
            <Mail className="size-4 text-bronze" />
            Recent Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-river" />
            </div>
          ) : invites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="flex size-12 items-center justify-center rounded-full bg-bronze/10">
                <Mail className="size-5 text-bronze" />
              </div>
              <p className="mt-3 text-sm text-text-secondary">
                No invitations have been sent yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-light/15">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {invite.email}
                    </p>
                    <p className="text-xs text-text-light">
                      Invited by{" "}
                      {invite.invited_by_name ?? invite.invited_by_email ?? "Unknown"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-text-light">
                    {formatDate(invite.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </AdminPageGuard>
  );
}
