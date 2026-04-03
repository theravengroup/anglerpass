"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Gift,
  DollarSign,
  Copy,
  Check,
  Send,
  Loader2,
  ArrowLeft,
  LinkIcon,
  Settings,
} from "lucide-react";
import { FetchError } from "@/components/shared/FetchError";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { REFERRAL_CREDIT_STATUS } from "@/lib/constants/status";

interface ReferralSettings {
  referral_program_enabled: boolean;
  referral_reward: number;
  initiation_fee: number;
  stats: {
    total_referrals: number;
    earned_referrals: number;
    total_paid: number;
  };
}

interface ReferralCredit {
  id: string;
  amount: number;
  status: string;
  earned_at: string | null;
  paid_out_at: string | null;
  created_at: string;
  referred_member_name: string;
}

export default function ClubReferralsPage() {
  const [clubId, setClubId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [settings, setSettings] = useState<ReferralSettings | null>(null);
  const [credits, setCredits] = useState<ReferralCredit[]>([]);
  const [referralLink, setReferralLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  // Settings form state
  const [editingSettings, setEditingSettings] = useState(false);
  const [settingsEnabled, setSettingsEnabled] = useState(false);
  const [settingsReward, setSettingsReward] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  // Copy state
  const [linkCopied, setLinkCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      // First get the club ID
      const clubRes = await fetch("/api/clubs");
      if (!clubRes.ok) {
        setError(true);
        return;
      }

      const clubData = await clubRes.json();
      const owned = clubData.owned?.[0];
      if (!owned) {
        setError(true);
        return;
      }

      setClubId(owned.id);
      setIsOwner(true);

      // Fetch settings, referral link, and credits in parallel
      const [settingsRes, linkRes, creditsRes] = await Promise.all([
        fetch(`/api/clubs/${owned.id}/referral-settings`),
        fetch(`/api/clubs/${owned.id}/referral-invite`),
        fetch(`/api/clubs/${owned.id}/referral-credits`),
      ]);

      if (settingsRes.ok) {
        const s = await settingsRes.json();
        setSettings(s);
        setSettingsEnabled(s.referral_program_enabled);
        setSettingsReward(String(s.referral_reward));
      }

      if (linkRes.ok) {
        const l = await linkRes.json();
        setReferralLink(l.referralLink);
      }

      if (creditsRes.ok) {
        const c = await creditsRes.json();
        setCredits(c.credits ?? []);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveSettings() {
    if (!clubId) return;
    setSavingSettings(true);

    try {
      const res = await fetch(`/api/clubs/${clubId}/referral-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referral_program_enabled: settingsEnabled,
          referral_reward: Number(settingsReward) || 0,
        }),
      });

      if (res.ok) {
        setEditingSettings(false);
        load();
      } else {
        const data = await res.json();
        setSendError(data.error ?? "Failed to save settings");
      }
    } catch {
      setSendError("Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  }

  async function sendInvite() {
    if (!clubId || !inviteEmail.trim()) return;
    setSending(true);
    setSendError(null);
    setSendSuccess(null);

    try {
      const res = await fetch(`/api/clubs/${clubId}/referral-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          message: inviteMessage.trim() || undefined,
        }),
      });

      if (res.ok) {
        setSendSuccess(`Referral invite sent to ${inviteEmail}`);
        setInviteEmail("");
        setInviteMessage("");
        setTimeout(() => setSendSuccess(null), 4000);
      } else {
        const data = await res.json();
        setSendError(data.error ?? "Failed to send invite");
      }
    } catch {
      setSendError("Failed to send invite");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-river" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl">
        <FetchError message="Failed to load referral data." onRetry={load} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/club">
            <Button variant="ghost" size="sm" className="text-text-secondary">
              <ArrowLeft className="mr-1 size-4" />
              Dashboard
            </Button>
          </Link>
          <div>
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
              Member Referrals
            </h2>
            <p className="mt-0.5 text-sm text-text-secondary">
              Grow your club through member-to-member referrals
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {settings && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-stone-light/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>Total Referrals</CardDescription>
                <div className="flex size-9 items-center justify-center rounded-lg bg-river/10">
                  <Users className="size-[18px] text-river" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight text-text-primary">
                {settings.stats.total_referrals}
              </p>
              <p className="mt-1 text-xs text-text-light">
                {settings.stats.earned_referrals} earned
              </p>
            </CardContent>
          </Card>

          <Card className="border-stone-light/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>Reward per Referral</CardDescription>
                <div className="flex size-9 items-center justify-center rounded-lg bg-bronze/10">
                  <Gift className="size-[18px] text-bronze" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight text-text-primary">
                {settings.referral_program_enabled
                  ? `$${settings.referral_reward}`
                  : "—"}
              </p>
              <p className="mt-1 text-xs text-text-light">
                {settings.referral_program_enabled
                  ? "Active program"
                  : "Program disabled"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-stone-light/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>Total Paid</CardDescription>
                <div className="flex size-9 items-center justify-center rounded-lg bg-forest/10">
                  <DollarSign className="size-[18px] text-forest" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight text-text-primary">
                ${settings.stats.total_paid.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-text-light">
                Referral rewards distributed
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Program Settings (owner only) */}
      {isOwner && (
        <Card className="border-stone-light/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex size-8 items-center justify-center rounded-lg bg-charcoal/10">
                <Settings className="size-4 text-charcoal" />
              </div>
              Referral Program Settings
            </CardTitle>
            <CardDescription>
              Configure how much members earn for successful referrals. The
              reward is deducted from your club&rsquo;s initiation fee revenue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {editingSettings ? (
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settingsEnabled}
                    onChange={(e) => setSettingsEnabled(e.target.checked)}
                    className="size-4 rounded border-stone-light/30 text-river focus:ring-river"
                  />
                  <span className="text-sm font-medium text-text-primary">
                    Enable referral program
                  </span>
                </label>

                {settingsEnabled && (
                  <div className="max-w-xs">
                    <label className="mb-1.5 block text-sm font-medium text-text-primary">
                      Reward per referral ($)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="5"
                      value={settingsReward}
                      onChange={(e) => setSettingsReward(e.target.value)}
                      placeholder="25"
                    />
                    {settings && settings.initiation_fee > 0 && (
                      <p className="mt-1.5 text-xs text-text-light">
                        Your initiation fee is $
                        {settings.initiation_fee.toLocaleString()}. The reward
                        cannot exceed this amount.
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-river text-white hover:bg-river/90"
                    onClick={saveSettings}
                    disabled={savingSettings}
                  >
                    {savingSettings ? (
                      <Loader2 className="mr-1 size-3 animate-spin" />
                    ) : null}
                    Save Settings
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingSettings(false);
                      setSettingsEnabled(
                        settings?.referral_program_enabled ?? false
                      );
                      setSettingsReward(
                        String(settings?.referral_reward ?? 0)
                      );
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-text-primary">
                    Status:{" "}
                    <span
                      className={
                        settings?.referral_program_enabled
                          ? "font-medium text-forest"
                          : "text-text-light"
                      }
                    >
                      {settings?.referral_program_enabled
                        ? "Active"
                        : "Disabled"}
                    </span>
                  </p>
                  {settings?.referral_program_enabled && (
                    <p className="text-sm text-text-secondary">
                      Reward: ${settings.referral_reward} per successful referral
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingSettings(true)}
                >
                  <Settings className="mr-1 size-3" />
                  Edit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Referral Link & Invite */}
      {settings?.referral_program_enabled && referralLink && (
        <Card className="border-stone-light/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex size-8 items-center justify-center rounded-lg bg-river/10">
                <LinkIcon className="size-4 text-river" />
              </div>
              Your Referral Link
            </CardTitle>
            <CardDescription>
              Share this link or send a personal invite. When someone joins
              through your link, you earn ${settings.referral_reward}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Copy link */}
            <div className="flex gap-2">
              <Input
                readOnly
                value={referralLink}
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(referralLink);
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2000);
                }}
              >
                {linkCopied ? (
                  <>
                    <Check className="size-4 text-forest" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            {/* Send invite */}
            <div className="space-y-3 rounded-lg border border-stone-light/20 p-4">
              <p className="text-sm font-medium text-text-primary">
                Send a personal invite
              </p>
              <Input
                type="email"
                placeholder="friend@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <Input
                placeholder="Add a personal note (optional)"
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
              />
              <Button
                size="sm"
                className="bg-river text-white hover:bg-river/90"
                onClick={sendInvite}
                disabled={sending || !inviteEmail.trim()}
              >
                {sending ? (
                  <Loader2 className="mr-1 size-3 animate-spin" />
                ) : (
                  <Send className="mr-1 size-3" />
                )}
                Send Invite
              </Button>
              {sendSuccess && (
                <p
                  className="text-xs font-medium text-forest"
                  role="alert"
                  aria-live="polite"
                >
                  {sendSuccess}
                </p>
              )}
              {sendError && (
                <p
                  className="text-xs font-medium text-red-500"
                  role="alert"
                  aria-live="polite"
                >
                  {sendError}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Referral History */}
      <Card className="border-stone-light/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Referral History</CardTitle>
          <CardDescription>
            Track the status of your referrals and earned rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          {credits.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-light">
              No referrals yet. Share your link to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {credits.map((credit) => (
                <div
                  key={credit.id}
                  className="flex items-center justify-between rounded-lg border border-stone-light/10 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {credit.referred_member_name}
                    </p>
                    <p className="text-xs text-text-light">
                      Referred{" "}
                      {new Date(credit.created_at).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" }
                      )}
                      {credit.earned_at &&
                        ` · Earned ${new Date(credit.earned_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-text-primary">
                      ${credit.amount}
                    </span>
                    <StatusBadge
                      status={credit.status}
                      config={REFERRAL_CREDIT_STATUS}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
