"use client";

import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import AdminPageGuard from "@/components/admin/AdminPageGuard";
import CampaignHeader from "@/components/admin/crm/CampaignHeader";
import LegacyCampaignSettingsPanel from "@/components/admin/LegacyCampaignSettingsPanel";
import CampaignStepList from "@/components/admin/crm/CampaignStepList";
import CrmStatsCards from "@/components/admin/crm/CrmStatsCards";
import { useCampaignDetail } from "@/hooks/use-campaign-detail";

export default function AdminCampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const {
    campaign,
    loading,
    saving,
    actionLoading,
    stats,
    isEditable,
    fields,
    actions,
  } = useCampaignDetail({
    campaignId,
    redirectPath: "/admin/campaigns",
  });

  if (loading) {
    return (
      <AdminPageGuard path="/admin/campaigns">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-6 animate-spin text-charcoal" />
        </div>
      </AdminPageGuard>
    );
  }

  if (!campaign) return null;

  return (
    <AdminPageGuard path="/admin/campaigns">
      <div className="mx-auto max-w-5xl space-y-6">
        <CampaignHeader
          name={campaign.name}
          status={campaign.status}
          type={campaign.type}
          startedAt={campaign.started_at}
          hasSteps={campaign.steps.length > 0}
          isEditable={isEditable}
          actionLoading={actionLoading}
          headingClassName="font-[family-name:var(--font-heading)]"
          onBack={() => router.push("/admin/campaigns")}
          onTestSend={actions.testSend}
          onActivate={actions.activateCampaign}
          onPause={actions.pauseCampaign}
        />

        {stats.total_sends > 0 && <CrmStatsCards stats={stats} />}

        {isEditable && (
          <LegacyCampaignSettingsPanel
            fields={fields}
            segment={campaign.segment}
            saving={saving}
            onSave={actions.saveCampaign}
          />
        )}

        <CampaignStepList
          steps={campaign.steps}
          campaignId={campaignId}
          editable={isEditable}
          onUpdated={actions.reload}
        />
      </div>
    </AdminPageGuard>
  );
}
