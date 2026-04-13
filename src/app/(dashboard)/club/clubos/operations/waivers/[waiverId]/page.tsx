"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import StatCardGrid from "@/components/shared/StatCardGrid";
import type { StatCardItem } from "@/components/shared/StatCardGrid";

interface Waiver {
  id: string;
  title: string;
  body_text: string;
  version: number;
  is_active: boolean;
  requires_annual_renewal: boolean;
}

interface Signature {
  id: string;
  signed_at: string;
  expires_at: string | null;
  membership: {
    id: string;
    user_id: string;
    profile: { full_name: string; email: string };
  };
}

export default function WaiverDetailPage() {
  const params = useParams();
  const waiverId = params.waiverId as string;

  const [waiver, setWaiver] = useState<Waiver | null>(null);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [signatureStats, setSignatureStats] = useState({
    signed: 0,
    total_members: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [waiverId]);

  async function loadData() {
    try {
      const [waiverRes, sigsRes] = await Promise.all([
        fetch(`/api/clubos/waivers/${waiverId}`),
        fetch(`/api/clubos/waivers/${waiverId}/signatures`),
      ]);

      if (waiverRes.ok) {
        const json = await waiverRes.json();
        setWaiver(json.waiver);
        setSignatureStats(json.signature_stats ?? { signed: 0, total_members: 0 });
      }

      if (sigsRes.ok) {
        const json = await sigsRes.json();
        setSignatures(json.signatures ?? []);
      }
    } catch {
      // Handle silently
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-river" />
      </div>
    );
  }

  if (!waiver) {
    return (
      <div className="mx-auto max-w-5xl py-12 text-center text-sm text-text-light">
        Waiver not found.
      </div>
    );
  }

  const unsigned = signatureStats.total_members - signatureStats.signed;
  const expired = signatures.filter(
    (s) => s.expires_at && new Date(s.expires_at) < new Date()
  ).length;

  const stats: StatCardItem[] = [
    {
      label: "Signed",
      value: String(signatureStats.signed),
      description: `of ${signatureStats.total_members} members`,
      icon: CheckCircle2,
      color: "text-forest",
      bg: "bg-forest/10",
    },
    {
      label: "Unsigned",
      value: String(unsigned),
      description: "Signatures pending",
      icon: XCircle,
      color: unsigned > 0 ? "text-bronze" : "text-forest",
      bg: unsigned > 0 ? "bg-bronze/10" : "bg-forest/10",
    },
    {
      label: "Expired",
      value: String(expired),
      description: "Need renewal",
      icon: Clock,
      color: expired > 0 ? "text-red-500" : "text-charcoal",
      bg: expired > 0 ? "bg-red-50" : "bg-charcoal/10",
    },
    {
      label: "Version",
      value: String(waiver.version),
      description: waiver.is_active ? "Active" : "Inactive",
      icon: FileText,
      color: "text-river",
      bg: "bg-river/10",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-text-light">
        <Link
          href="/club/clubos"
          className="transition-colors hover:text-text-secondary"
        >
          ClubOS
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          href="/club/clubos/operations"
          className="transition-colors hover:text-text-secondary"
        >
          Operations
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          href="/club/clubos/operations/waivers"
          className="transition-colors hover:text-text-secondary"
        >
          Waivers
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-text-primary font-medium">{waiver.title}</span>
      </nav>

      {/* Header */}
      <div>
        <h2 className="font-heading text-2xl font-semibold text-text-primary">
          {waiver.title}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Version {waiver.version}
          {waiver.requires_annual_renewal && " · Annual renewal required"}
          {!waiver.is_active && (
            <span className="ml-2 rounded-full bg-stone-light/10 px-2 py-0.5 text-xs text-text-light">
              Inactive
            </span>
          )}
        </p>
      </div>

      {/* Stats */}
      <StatCardGrid stats={stats} />

      {/* Signature List */}
      <Card className="border-stone-light/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="size-4 text-forest" />
            Signatures
          </CardTitle>
          <CardDescription>
            {signatures.length} member{signatures.length !== 1 ? "s" : ""}{" "}
            signed this waiver
          </CardDescription>
        </CardHeader>
        <CardContent>
          {signatures.length === 0 ? (
            <p className="py-6 text-center text-sm text-text-light">
              No signatures yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-light/20 text-left text-xs text-text-light">
                    <th className="pb-2 pr-4">Member</th>
                    <th className="pb-2 pr-4">Signed</th>
                    <th className="pb-2 text-right">Expires</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-light/10">
                  {signatures.map((sig) => {
                    const isExpired =
                      sig.expires_at &&
                      new Date(sig.expires_at) < new Date();
                    return (
                      <tr key={sig.id}>
                        <td className="py-2.5 pr-4">
                          <p className="font-medium text-text-primary">
                            {sig.membership?.profile?.full_name ?? "Unknown"}
                          </p>
                          <p className="text-xs text-text-light">
                            {sig.membership?.profile?.email}
                          </p>
                        </td>
                        <td className="py-2.5 pr-4 text-text-secondary">
                          {new Date(sig.signed_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </td>
                        <td className="py-2.5 text-right">
                          {sig.expires_at ? (
                            <span
                              className={
                                isExpired
                                  ? "text-red-500"
                                  : "text-text-secondary"
                              }
                            >
                              {isExpired ? "Expired " : ""}
                              {new Date(
                                sig.expires_at
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          ) : (
                            <span className="text-text-light">Never</span>
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
    </div>
  );
}
