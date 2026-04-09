import type {
  CampaignStatus,
  CampaignType,
  CrmTriggerEvent,
  SegmentRuleGroup,
} from "@/lib/crm/types";

export interface TopicOption {
  id: string;
  name: string;
  slug: string;
}

export interface CampaignDetail {
  id: string;
  name: string;
  description: string | null;
  type: CampaignType;
  status: CampaignStatus;
  from_name: string;
  from_email: string;
  reply_to: string | null;
  segment_id: string | null;
  topic_id: string | null;
  trigger_event: CrmTriggerEvent | null;
  send_time_strategy: string | null;
  created_at: string;
  started_at: string | null;
  steps: StepRow[];
  segment: SegmentRow | null;
}

export interface StepRow {
  id: string;
  step_order: number;
  subject: string;
  html_body: string;
  delay_minutes: number;
  cta_label: string | null;
  cta_url: string | null;
}

export interface SegmentRow {
  id: string;
  name: string;
  rules: SegmentRuleGroup[];
  cached_count: number | null;
}

export interface CampaignStats {
  total_sends: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  open_rate: number;
  click_rate: number;
}
