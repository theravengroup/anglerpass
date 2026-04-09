"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type {
  CampaignDetail,
  CampaignStats,
  TopicOption,
} from "@/types/campaign";
import type { CampaignType, CrmTriggerEvent } from "@/lib/crm/types";

const DEFAULT_STATS: CampaignStats = {
  total_sends: 0,
  delivered_count: 0,
  opened_count: 0,
  clicked_count: 0,
  bounced_count: 0,
  open_rate: 0,
  click_rate: 0,
};

interface UseCampaignDetailOptions {
  campaignId: string;
  /** Where to redirect if the campaign is not found */
  redirectPath: string;
  /** Whether to load topic options for the dropdown */
  loadTopics?: boolean;
}

export interface CampaignFormFields {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  type: CampaignType;
  setType: (v: CampaignType) => void;
  fromName: string;
  setFromName: (v: string) => void;
  fromEmail: string;
  setFromEmail: (v: string) => void;
  replyTo: string;
  setReplyTo: (v: string) => void;
  triggerEvent: CrmTriggerEvent | "";
  setTriggerEvent: (v: CrmTriggerEvent | "") => void;
  topicId: string;
  setTopicId: (v: string) => void;
  sendTimeStrategy: string;
  setSendTimeStrategy: (v: string) => void;
}

export interface CampaignActions {
  saveCampaign: () => Promise<void>;
  activateCampaign: () => Promise<void>;
  pauseCampaign: () => Promise<void>;
  testSend: () => Promise<void>;
  reload: () => void;
}

export interface UseCampaignDetailReturn {
  campaign: CampaignDetail | null;
  loading: boolean;
  saving: boolean;
  actionLoading: string | null;
  stats: CampaignStats;
  topicOptions: TopicOption[];
  isEditable: boolean;
  fields: CampaignFormFields;
  actions: CampaignActions;
}

export function useCampaignDetail({
  campaignId,
  redirectPath,
  loadTopics = false,
}: UseCampaignDetailOptions): UseCampaignDetailReturn {
  const router = useRouter();

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Editable fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<CampaignType>("broadcast");
  const [fromName, setFromName] = useState("AnglerPass");
  const [fromEmail, setFromEmail] = useState("hello@anglerpass.com");
  const [replyTo, setReplyTo] = useState("");
  const [triggerEvent, setTriggerEvent] = useState<CrmTriggerEvent | "">("");
  const [topicId, setTopicId] = useState<string>("");
  const [topicOptions, setTopicOptions] = useState<TopicOption[]>([]);
  const [sendTimeStrategy, setSendTimeStrategy] = useState("immediate");

  // Stats
  const [stats, setStats] = useState<CampaignStats>(DEFAULT_STATS);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}`);
      if (!res.ok) {
        router.push(redirectPath);
        return;
      }
      const data = await res.json();
      const c = data.campaign as CampaignDetail;
      setCampaign(c);
      setName(c.name);
      setDescription(c.description ?? "");
      setType(c.type);
      setFromName(c.from_name);
      setFromEmail(c.from_email);
      setReplyTo(c.reply_to ?? "");
      setTriggerEvent(c.trigger_event ?? "");
      setTopicId(c.topic_id ?? "");
      setSendTimeStrategy(c.send_time_strategy ?? "immediate");

      // Load topics for the dropdown (CRM version only)
      if (loadTopics) {
        const topicsRes = await fetch("/api/admin/crm/topics");
        if (topicsRes.ok) {
          const topicsData = await topicsRes.json();
          setTopicOptions(
            (topicsData.topics ?? []).map((t: Record<string, unknown>) => ({
              id: t.id,
              name: t.name,
              slug: t.slug,
            }))
          );
        }
      }

      // Load stats
      const statsRes = await fetch(`/api/admin/campaigns?limit=1`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        const match = (statsData.campaigns ?? []).find(
          (camp: Record<string, unknown>) => camp.id === campaignId
        );
        if (match) {
          setStats({
            total_sends: (match.total_sends as number) ?? 0,
            delivered_count: (match.delivered_count as number) ?? 0,
            opened_count: (match.opened_count as number) ?? 0,
            clicked_count: (match.clicked_count as number) ?? 0,
            bounced_count: (match.bounced_count as number) ?? 0,
            open_rate: (match.open_rate as number) ?? 0,
            click_rate: (match.click_rate as number) ?? 0,
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [campaignId, redirectPath, loadTopics, router]);

  useEffect(() => {
    load();
  }, [load]);

  const saveCampaign = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          from_name: fromName,
          from_email: fromEmail,
          reply_to: replyTo || null,
          trigger_event: triggerEvent || undefined,
          topic_id: topicId || null,
          send_time_strategy: sendTimeStrategy,
        }),
      });
      load();
    } finally {
      setSaving(false);
    }
  };

  const activateCampaign = async () => {
    setActionLoading("activate");
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/activate`, {
        method: "POST",
      });
      if (res.ok) {
        load();
      } else {
        const data = await res.json();
        alert(data.error ?? "Activation failed");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const pauseCampaign = async () => {
    setActionLoading("pause");
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/pause`, {
        method: "POST",
      });
      if (res.ok) {
        load();
      } else {
        const data = await res.json();
        alert(data.error ?? "Pause failed");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const testSend = async () => {
    const email = prompt("Send test email to:");
    if (!email) return;
    setActionLoading("test");
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/test-send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Test email sent to ${email}`);
      } else {
        alert(data.error ?? "Test send failed");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const isEditable =
    campaign?.status === "draft" || campaign?.status === "paused";

  return {
    campaign,
    loading,
    saving,
    actionLoading,
    stats,
    topicOptions,
    isEditable,
    fields: {
      name,
      setName,
      description,
      setDescription,
      type,
      setType,
      fromName,
      setFromName,
      fromEmail,
      setFromEmail,
      replyTo,
      setReplyTo,
      triggerEvent,
      setTriggerEvent,
      topicId,
      setTopicId,
      sendTimeStrategy,
      setSendTimeStrategy,
    },
    actions: {
      saveCampaign,
      activateCampaign,
      pauseCampaign,
      testSend,
      reload: load,
    },
  };
}
