"use client";

import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import AdminPageGuard from "@/components/admin/AdminPageGuard";
import CampaignHeader from "@/components/admin/crm/CampaignHeader";
import CrmCampaignSettingsPanel from "@/components/admin/crm/CrmCampaignSettingsPanel";
import CampaignStepList from "@/components/admin/crm/CampaignStepList";
import CrmStatsCards from "@/components/admin/crm/CrmStatsCards";
import { useCampaignDetail } from "@/hooks/use-campaign-detail";

export default function CrmCampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const {
    campaign,
    loading,
    saving,
    actionLoading,
    stats,
    topicOptions,
    isEditable,
    fields,
    actions,
  } = useCampaignDetail({
    campaignId,
    redirectPath: "/admin/crm/campaigns",
    loadTopics: true,
  });

  if (loading) {
    return (
      <AdminPageGuard path="/admin/crm">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-6 animate-spin text-charcoal" />
        </div>
      </AdminPageGuard>
    );
  }

  if (!campaign) return null;

  return (
    <AdminPageGuard path="/admin/crm">
      <div className="space-y-6">
        <CampaignHeader
          name={campaign.name}
          status={campaign.status}
          type={campaign.type}
          startedAt={campaign.started_at}
          hasSteps={campaign.steps.length > 0}
          isEditable={isEditable}
          actionLoading={actionLoading}
          onBack={() => router.push("/admin/crm/campaigns")}
          onTestSend={actions.testSend}
          onActivate={actions.activateCampaign}
          onPause={actions.pauseCampaign}
        />

        {stats.total_sends > 0 && <CrmStatsCards stats={stats} />}

        {isEditable && (
          <CrmCampaignSettingsPanel
            fields={fields}
            topicOptions={topicOptions}
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
          showQualityPanel
        />
      </div>
    </AdminPageGuard>
  );
}
