export type UserRole = "landowner" | "club_admin" | "angler" | "admin";

export type InterestType = "landowner" | "club" | "angler" | "investor" | "other";

export type LeadType = "waitlist" | "investor" | "contact";

export interface Profile {
  id: string;
  display_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  interest_type: InterestType;
  type: LeadType;
  message: string | null;
  source: string | null;
  created_at: string;
}

export type MembershipType = "individual" | "corporate" | "corporate_employee";

export interface CorporateInvitation {
  id: string;
  club_id: string;
  corporate_member_id: string;
  email: string;
  status: "pending" | "accepted" | "expired";
  token: string;
  invited_at: string;
  accepted_at: string | null;
}
