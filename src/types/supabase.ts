export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      angler_club_invitations: {
        Row: {
          admin_email: string
          admin_name: string | null
          angler_id: string
          club_id: string | null
          club_name: string
          created_at: string
          id: string
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          admin_email: string
          admin_name?: string | null
          angler_id: string
          club_id?: string | null
          club_name: string
          created_at?: string
          id?: string
          status?: string
          token?: string
          updated_at?: string
        }
        Update: {
          admin_email?: string
          admin_name?: string | null
          angler_id?: string
          club_id?: string | null
          club_name?: string
          created_at?: string
          id?: string
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "angler_club_invitations_angler_id_fkey"
            columns: ["angler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "angler_club_invitations_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: number
          new_data: Json | null
          old_data: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: number
          new_data?: Json | null
          old_data?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: number
          new_data?: Json | null
          old_data?: Json | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          angler_id: string
          base_rate: number
          booking_date: string
          cancellation_reason: string | null
          cancelled_at: string | null
          club_commission: number
          club_membership_id: string
          confirmed_at: string | null
          created_at: string
          cross_club_fee: number
          duration: string
          guide_id: string | null
          guide_payout: number | null
          guide_rate: number | null
          guide_service_fee: number | null
          id: string
          is_cross_club: boolean
          landowner_notes: string | null
          landowner_payout: number
          message: string | null
          non_fishing_guests: number
          party_size: number
          platform_fee: number
          property_id: string
          refund_amount: number | null
          refund_percentage: number | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          angler_id: string
          base_rate: number
          booking_date: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          club_commission?: number
          club_membership_id: string
          confirmed_at?: string | null
          created_at?: string
          cross_club_fee?: number
          duration?: string
          guide_id?: string | null
          guide_payout?: number | null
          guide_rate?: number | null
          guide_service_fee?: number | null
          id?: string
          is_cross_club?: boolean
          landowner_notes?: string | null
          landowner_payout?: number
          message?: string | null
          non_fishing_guests?: number
          party_size?: number
          platform_fee?: number
          property_id: string
          refund_amount?: number | null
          refund_percentage?: number | null
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          angler_id?: string
          base_rate?: number
          booking_date?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          club_commission?: number
          club_membership_id?: string
          confirmed_at?: string | null
          created_at?: string
          cross_club_fee?: number
          duration?: string
          guide_id?: string | null
          guide_payout?: number | null
          guide_rate?: number | null
          guide_service_fee?: number | null
          id?: string
          is_cross_club?: boolean
          landowner_notes?: string | null
          landowner_payout?: number
          message?: string | null
          non_fishing_guests?: number
          party_size?: number
          platform_fee?: number
          property_id?: string
          refund_amount?: number | null
          refund_percentage?: number | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_angler_id_fkey"
            columns: ["angler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_club_membership_id_fkey"
            columns: ["club_membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "guide_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_tokens: {
        Row: {
          created_at: string
          id: string
          property_id: string
          token: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          token?: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_tokens_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      club_invitations: {
        Row: {
          admin_email: string
          club_id: string | null
          club_name: string
          created_at: string
          id: string
          invited_by: string
          property_id: string
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          admin_email: string
          club_id?: string | null
          club_name: string
          created_at?: string
          id?: string
          invited_by: string
          property_id: string
          status?: string
          token?: string
          updated_at?: string
        }
        Update: {
          admin_email?: string
          club_id?: string | null
          club_name?: string
          created_at?: string
          id?: string
          invited_by?: string
          property_id?: string
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_invitations_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_invitations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      club_memberships: {
        Row: {
          cancellation_effective_date: string | null
          cancellation_undo_deadline: string | null
          cancelled_at: string | null
          club_id: string
          company_name: string | null
          corporate_sponsor_id: string | null
          created_at: string
          dues_paid_through: string | null
          dues_status: string | null
          grace_period_ends: string | null
          id: string
          invited_at: string | null
          invited_email: string | null
          joined_at: string | null
          membership_type: string
          removal_reason: string | null
          removed_at: string | null
          removed_by: string | null
          role: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cancellation_effective_date?: string | null
          cancellation_undo_deadline?: string | null
          cancelled_at?: string | null
          club_id: string
          company_name?: string | null
          corporate_sponsor_id?: string | null
          created_at?: string
          dues_paid_through?: string | null
          dues_status?: string | null
          grace_period_ends?: string | null
          id?: string
          invited_at?: string | null
          invited_email?: string | null
          joined_at?: string | null
          membership_type?: string
          removal_reason?: string | null
          removed_at?: string | null
          removed_by?: string | null
          role?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cancellation_effective_date?: string | null
          cancellation_undo_deadline?: string | null
          cancelled_at?: string | null
          club_id?: string
          company_name?: string | null
          corporate_sponsor_id?: string | null
          created_at?: string
          dues_paid_through?: string | null
          dues_status?: string | null
          grace_period_ends?: string | null
          id?: string
          invited_at?: string | null
          invited_email?: string | null
          joined_at?: string | null
          membership_type?: string
          removal_reason?: string | null
          removed_at?: string | null
          removed_by?: string | null
          role?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_memberships_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_memberships_corporate_sponsor_id_fkey"
            columns: ["corporate_sponsor_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_memberships_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_property_access: {
        Row: {
          approved_at: string | null
          club_id: string
          created_at: string
          id: string
          property_id: string
          requested_by: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          club_id: string
          created_at?: string
          id?: string
          property_id: string
          requested_by: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          club_id?: string
          created_at?: string
          id?: string
          property_id?: string
          requested_by?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_property_access_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_property_access_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_property_access_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          annual_dues: number | null
          corporate_initiation_fee: number | null
          corporate_memberships_enabled: boolean
          created_at: string
          description: string | null
          id: string
          initiation_fee: number | null
          location: string | null
          logo_url: string | null
          membership_application_required: boolean
          name: string
          owner_id: string
          rules: string | null
          stripe_connect_account_id: string | null
          stripe_connect_onboarded: boolean
          subscription_tier: string
          updated_at: string
          website: string | null
        }
        Insert: {
          annual_dues?: number | null
          corporate_initiation_fee?: number | null
          corporate_memberships_enabled?: boolean
          created_at?: string
          description?: string | null
          id?: string
          initiation_fee?: number | null
          location?: string | null
          logo_url?: string | null
          membership_application_required?: boolean
          name: string
          owner_id: string
          rules?: string | null
          stripe_connect_account_id?: string | null
          stripe_connect_onboarded?: boolean
          subscription_tier?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          annual_dues?: number | null
          corporate_initiation_fee?: number | null
          corporate_memberships_enabled?: boolean
          created_at?: string
          description?: string | null
          id?: string
          initiation_fee?: number | null
          location?: string | null
          logo_url?: string | null
          membership_application_required?: boolean
          name?: string
          owner_id?: string
          rules?: string | null
          stripe_connect_account_id?: string | null
          stripe_connect_onboarded?: boolean
          subscription_tier?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clubs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_invitations: {
        Row: {
          accepted_at: string | null
          club_id: string
          corporate_member_id: string
          email: string
          id: string
          invited_at: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          club_id: string
          corporate_member_id: string
          email: string
          id?: string
          invited_at?: string
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          club_id?: string
          corporate_member_id?: string
          email?: string
          id?: string
          invited_at?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "corporate_invitations_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corporate_invitations_corporate_member_id_fkey"
            columns: ["corporate_member_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          active: boolean
          body: string
          created_at: string
          id: string
          owner_id: string
          property_id: string
          required: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          body: string
          created_at?: string
          id?: string
          owner_id: string
          property_id: string
          required?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          body?: string
          created_at?: string
          id?: string
          owner_id?: string
          property_id?: string
          required?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_templates_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_templates_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_availability: {
        Row: {
          booking_id: string | null
          created_at: string
          date: string
          guide_id: string
          id: string
          status: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          date: string
          guide_id: string
          id?: string
          status?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          date?: string
          guide_id?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_availability_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_availability_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "guide_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_club_affiliations: {
        Row: {
          club_id: string
          created_at: string
          guide_id: string
          id: string
          label: string | null
          status: string
          updated_at: string
        }
        Insert: {
          club_id: string
          created_at?: string
          guide_id: string
          id?: string
          label?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          guide_id?: string
          id?: string
          label?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_club_affiliations_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_club_affiliations_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "guide_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          base_location: string | null
          bio: string | null
          cancellation_rate: number | null
          closest_airports: string | null
          created_at: string
          display_name: string
          first_aid_cert_url: string | null
          first_aid_expiry: string | null
          gear_details: string | null
          gear_included: boolean
          has_motorized_vessel: boolean
          id: string
          insurance_amount: string | null
          insurance_expiry: string | null
          insurance_url: string | null
          languages: string[] | null
          lead_time_days: number
          license_expiry: string | null
          license_state: string | null
          license_url: string | null
          max_anglers: number
          photos: string[] | null
          profile_photo_url: string | null
          rate_description: string | null
          rate_full_day: number | null
          rate_half_day: number | null
          rating_avg: number | null
          rating_count: number | null
          rejection_reason: string | null
          response_time_hours: number | null
          service_region: string | null
          skill_levels: string[] | null
          species: string[] | null
          status: string
          stripe_connect_account_id: string | null
          stripe_connect_onboarded: boolean
          suspended_reason: string | null
          techniques: string[] | null
          trips_completed: number | null
          updated_at: string
          uscg_license_expiry: string | null
          uscg_license_url: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          base_location?: string | null
          bio?: string | null
          cancellation_rate?: number | null
          closest_airports?: string | null
          created_at?: string
          display_name: string
          first_aid_cert_url?: string | null
          first_aid_expiry?: string | null
          gear_details?: string | null
          gear_included?: boolean
          has_motorized_vessel?: boolean
          id?: string
          insurance_amount?: string | null
          insurance_expiry?: string | null
          insurance_url?: string | null
          languages?: string[] | null
          lead_time_days?: number
          license_expiry?: string | null
          license_state?: string | null
          license_url?: string | null
          max_anglers?: number
          photos?: string[] | null
          profile_photo_url?: string | null
          rate_description?: string | null
          rate_full_day?: number | null
          rate_half_day?: number | null
          rating_avg?: number | null
          rating_count?: number | null
          rejection_reason?: string | null
          response_time_hours?: number | null
          service_region?: string | null
          skill_levels?: string[] | null
          species?: string[] | null
          status?: string
          stripe_connect_account_id?: string | null
          stripe_connect_onboarded?: boolean
          suspended_reason?: string | null
          techniques?: string[] | null
          trips_completed?: number | null
          updated_at?: string
          uscg_license_expiry?: string | null
          uscg_license_url?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          base_location?: string | null
          bio?: string | null
          cancellation_rate?: number | null
          closest_airports?: string | null
          created_at?: string
          display_name?: string
          first_aid_cert_url?: string | null
          first_aid_expiry?: string | null
          gear_details?: string | null
          gear_included?: boolean
          has_motorized_vessel?: boolean
          id?: string
          insurance_amount?: string | null
          insurance_expiry?: string | null
          insurance_url?: string | null
          languages?: string[] | null
          lead_time_days?: number
          license_expiry?: string | null
          license_state?: string | null
          license_url?: string | null
          max_anglers?: number
          photos?: string[] | null
          profile_photo_url?: string | null
          rate_description?: string | null
          rate_full_day?: number | null
          rate_half_day?: number | null
          rating_avg?: number | null
          rating_count?: number | null
          rejection_reason?: string | null
          response_time_hours?: number | null
          service_region?: string | null
          skill_levels?: string[] | null
          species?: string[] | null
          status?: string
          stripe_connect_account_id?: string | null
          stripe_connect_onboarded?: boolean
          suspended_reason?: string | null
          techniques?: string[] | null
          trips_completed?: number | null
          updated_at?: string
          uscg_license_expiry?: string | null
          uscg_license_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_water_approvals: {
        Row: {
          club_id: string
          created_at: string
          decline_reason: string | null
          guide_id: string
          id: string
          property_id: string
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          club_id: string
          created_at?: string
          decline_reason?: string | null
          guide_id: string
          id?: string
          property_id: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          decline_reason?: string | null
          guide_id?: string
          id?: string
          property_id?: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_water_approvals_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_water_approvals_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "guide_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_water_approvals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_water_approvals_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string | null
          email: string
          first_name: string
          id: string
          interest_type: string
          last_name: string | null
          message: string | null
          source: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          interest_type: string
          last_name?: string | null
          message?: string | null
          source?: string | null
          type?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          interest_type?: string
          last_name?: string | null
          message?: string | null
          source?: string | null
          type?: string
        }
        Relationships: []
      }
      membership_applications: {
        Row: {
          application_note: string | null
          club_id: string
          created_at: string
          declined_reason: string | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          application_note?: string | null
          club_id: string
          created_at?: string
          declined_reason?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          application_note?: string | null
          club_id?: string
          created_at?: string
          declined_reason?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_applications_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_payments: {
        Row: {
          application_id: string | null
          club_amount: number
          club_id: string
          club_payout: number
          created_at: string
          id: string
          membership_id: string | null
          period_end: string | null
          period_start: string | null
          processing_fee: number
          status: string
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          stripe_subscription_id: string | null
          total_charged: number
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id?: string | null
          club_amount: number
          club_id: string
          club_payout: number
          created_at?: string
          id?: string
          membership_id?: string | null
          period_end?: string | null
          period_start?: string | null
          processing_fee: number
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          total_charged: number
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          application_id?: string | null
          club_amount?: number
          club_id?: string
          club_payout?: number
          created_at?: string
          id?: string
          membership_id?: string | null
          period_end?: string | null
          period_start?: string | null
          processing_fee?: number
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          total_charged?: number
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_payments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "membership_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_payments_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_payments_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_threads: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          last_message_at: string
          participant_a: string
          participant_b: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          participant_a: string
          participant_b: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          participant_a?: string
          participant_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_threads_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_participant_a_fkey"
            columns: ["participant_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_participant_b_fkey"
            columns: ["participant_b"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          booking_id: string | null
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
          thread_id: string
        }
        Insert: {
          body: string
          booking_id?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
          thread_id: string
        }
        Update: {
          body?: string
          booking_id?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      migration_inquiries: {
        Row: {
          club_name: string
          contact_name: string
          created_at: string
          data_source: string
          email: string
          id: string
          loom_url: string
          member_count: number
          multiyear_interest: string | null
          notes: string | null
          target_launch: string | null
          website_platform: string | null
        }
        Insert: {
          club_name: string
          contact_name: string
          created_at?: string
          data_source: string
          email: string
          id?: string
          loom_url: string
          member_count: number
          multiyear_interest?: string | null
          notes?: string | null
          target_launch?: string | null
          website_platform?: string | null
        }
        Update: {
          club_name?: string
          contact_name?: string
          created_at?: string
          data_source?: string
          email?: string
          id?: string
          loom_url?: string
          member_count?: number
          multiyear_interest?: string | null
          notes?: string | null
          target_launch?: string | null
          website_platform?: string | null
        }
        Relationships: []
      }
      moderation_notes: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          id: number
          notes: string
          property_id: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          id?: number
          notes: string
          property_id: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          id?: number
          notes?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_notes_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_notes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_booking_cancelled: boolean
          email_booking_confirmed: boolean
          email_booking_declined: boolean
          email_booking_requested: boolean
          email_member_approved: boolean
          email_member_invited: boolean
          email_property_access: boolean
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_booking_cancelled?: boolean
          email_booking_confirmed?: boolean
          email_booking_declined?: boolean
          email_booking_requested?: boolean
          email_member_approved?: boolean
          email_member_invited?: boolean
          email_property_access?: boolean
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_booking_cancelled?: boolean
          email_booking_confirmed?: boolean
          email_booking_declined?: boolean
          email_booking_requested?: boolean
          email_member_approved?: boolean
          email_member_invited?: boolean
          email_property_access?: boolean
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          link: string | null
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          favorite_species: string[] | null
          fishing_experience: string | null
          id: string
          location: string | null
          role: string
          roles: string[] | null
          stripe_connect_account_id: string | null
          stripe_connect_onboarded: boolean
          suspended_at: string | null
          suspended_reason: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          favorite_species?: string[] | null
          fishing_experience?: string | null
          id: string
          location?: string | null
          role?: string
          roles?: string[] | null
          stripe_connect_account_id?: string | null
          stripe_connect_onboarded?: boolean
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          favorite_species?: string[] | null
          fishing_experience?: string | null
          id?: string
          location?: string | null
          role?: string
          roles?: string[] | null
          stripe_connect_account_id?: string | null
          stripe_connect_onboarded?: boolean
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          access_notes: string | null
          capacity: number | null
          coordinates: string | null
          created_at: string | null
          description: string | null
          gate_code: string | null
          gate_code_required: boolean | null
          half_day_allowed: boolean | null
          id: string
          latitude: number | null
          location_description: string | null
          longitude: number | null
          max_guests: number | null
          max_rods: number | null
          name: string
          owner_id: string
          photos: string[] | null
          rate_adult_full_day: number | null
          rate_adult_half_day: number | null
          rate_child_full_day: number | null
          rate_child_half_day: number | null
          rate_youth_full_day: number | null
          rate_youth_half_day: number | null
          regulations: string | null
          species: string[] | null
          staff_rate_discount: number | null
          status: string
          updated_at: string | null
          water_miles: number | null
          water_type: string | null
        }
        Insert: {
          access_notes?: string | null
          capacity?: number | null
          coordinates?: string | null
          created_at?: string | null
          description?: string | null
          gate_code?: string | null
          gate_code_required?: boolean | null
          half_day_allowed?: boolean | null
          id?: string
          latitude?: number | null
          location_description?: string | null
          longitude?: number | null
          max_guests?: number | null
          max_rods?: number | null
          name: string
          owner_id: string
          photos?: string[] | null
          rate_adult_full_day?: number | null
          rate_adult_half_day?: number | null
          rate_child_full_day?: number | null
          rate_child_half_day?: number | null
          rate_youth_full_day?: number | null
          rate_youth_half_day?: number | null
          regulations?: string | null
          species?: string[] | null
          staff_rate_discount?: number | null
          status?: string
          updated_at?: string | null
          water_miles?: number | null
          water_type?: string | null
        }
        Update: {
          access_notes?: string | null
          capacity?: number | null
          coordinates?: string | null
          created_at?: string | null
          description?: string | null
          gate_code?: string | null
          gate_code_required?: boolean | null
          half_day_allowed?: boolean | null
          id?: string
          latitude?: number | null
          location_description?: string | null
          longitude?: number | null
          max_guests?: number | null
          max_rods?: number | null
          name?: string
          owner_id?: string
          photos?: string[] | null
          rate_adult_full_day?: number | null
          rate_adult_half_day?: number | null
          rate_child_full_day?: number | null
          rate_child_half_day?: number | null
          rate_youth_full_day?: number | null
          rate_youth_half_day?: number | null
          regulations?: string | null
          species?: string[] | null
          staff_rate_discount?: number | null
          status?: string
          updated_at?: string | null
          water_miles?: number | null
          water_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string | null
          booking_id: string
          created_at: string
          id: string
          is_revealed: boolean
          rating: number
          review_window_closes_at: string
          reviewer_id: string
          reviewer_role: string
          subject_id: string
          subject_role: string
          title: string | null
        }
        Insert: {
          body?: string | null
          booking_id: string
          created_at?: string
          id?: string
          is_revealed?: boolean
          rating: number
          review_window_closes_at: string
          reviewer_id: string
          reviewer_role: string
          subject_id: string
          subject_role: string
          title?: string | null
        }
        Update: {
          body?: string | null
          booking_id?: string
          created_at?: string
          id?: string
          is_revealed?: boolean
          rating?: number
          review_window_closes_at?: string
          reviewer_id?: string
          reviewer_role?: string
          subject_id?: string
          subject_role?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      signed_documents: {
        Row: {
          booking_id: string
          id: string
          ip_address: string | null
          signed_at: string
          signer_email: string
          signer_id: string
          signer_name: string
          template_id: string
          template_snapshot: string
          template_title: string
          user_agent: string | null
        }
        Insert: {
          booking_id: string
          id?: string
          ip_address?: string | null
          signed_at?: string
          signer_email: string
          signer_id: string
          signer_name: string
          template_id: string
          template_snapshot: string
          template_title: string
          user_agent?: string | null
        }
        Update: {
          booking_id?: string
          id?: string
          ip_address?: string | null
          signed_at?: string
          signer_email?: string
          signer_id?: string
          signer_name?: string
          template_id?: string
          template_snapshot?: string
          template_title?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signed_documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signed_documents_signer_id_fkey"
            columns: ["signer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signed_documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
