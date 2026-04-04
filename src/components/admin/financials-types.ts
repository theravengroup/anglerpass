import type { LucideIcon } from "lucide-react";

export interface MonthlyRevenue {
  month: string;
  platform_fee: number;
  cross_club_fee: number;
  guide_service_fee: number;
  total: number;
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
