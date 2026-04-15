import type { LucideIcon } from "lucide-react";

export interface MonthlyRevenue {
  month: string;
  platform_fee: number;
  cross_club_fee: number;
  guide_service_fee: number;
  lease_facilitation_fee: number;
  total: number;
}

export interface ClassificationMixEntry {
  classification: string;
  bookings: number;
  gmv: number;
  platform_fee: number;
}

export interface PricingModeSplit {
  rod_fee_split: { bookings: number; gmv: number };
  upfront_lease: { bookings: number; gmv: number };
}

export interface RecentLeasePayment {
  id: string;
  property_name: string;
  club_name?: string;
  amount: number;
  platform_fee: number;
  landowner_net: number;
  period_start: string;
  period_end: string;
  paid_at: string;
}

export interface TopProperty {
  name: string;
  gmv: number;
  platform_revenue: number;
  bookings: number;
}

export interface Transaction {
  id: string;
  status: string;
  booking_date: string;
  property_name: string;
  base_rate: number;
  platform_fee: number;
  cross_club_fee: number;
  guide_service_fee: number;
  landowner_payout: number;
  club_commission: number;
  guide_payout: number;
  total_amount: number;
  created_at: string;
}

export interface Financials {
  platform_revenue_total: number;
  platform_revenue_period: number;
  platform_fee_total: number;
  cross_club_fee_total: number;
  guide_service_fee_total: number;
  gmv_total: number;
  gmv_period: number;
  landowner_payouts_total: number;
  club_payouts_total: number;
  guide_payouts_total: number;
  total_bookings: number;
  period_bookings: number;
  membership_gmv: number;
  membership_processing_fees: number;
  lease_facilitation_fee_total: number;
  lease_facilitation_fee_period: number;
  lease_payouts_total: number;
  lease_payment_count: number;
  classification_mix: ClassificationMixEntry[];
  pricing_mode_split: PricingModeSplit;
  recent_lease_payments: RecentLeasePayment[];
  revenue_by_month: MonthlyRevenue[];
  top_properties: TopProperty[];
  recent_transactions: Transaction[];
}

export interface StatItem {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

export interface StreamItem {
  label: string;
  amount: number;
  color: string;
}
