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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      affiliate_brands: {
        Row: {
          affiliate_program_id: string | null
          commission_rate: number | null
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          network_id: string | null
          slug: string
          tier: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          affiliate_program_id?: string | null
          commission_rate?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          network_id?: string | null
          slug: string
          tier?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          affiliate_program_id?: string | null
          commission_rate?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          network_id?: string | null
          slug?: string
          tier?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_brands_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "affiliate_networks"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_clicks: {
        Row: {
          clicked_at: string
          context: Json
          id: string
          ip_hash: string | null
          product_id: string
          session_id: string | null
          source: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          clicked_at?: string
          context?: Json
          id?: string
          ip_hash?: string | null
          product_id: string
          session_id?: string | null
          source?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          clicked_at?: string
          context?: Json
          id?: string
          ip_hash?: string | null
          product_id?: string
          session_id?: string | null
          source?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "affiliate_products"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_conversions: {
        Row: {
          approved_at: string | null
          click_id: string | null
          commission_cents: number
          converted_at: string
          created_at: string
          id: string
          network_id: string | null
          network_transaction_id: string | null
          order_amount_cents: number | null
          product_id: string
          status: string
        }
        Insert: {
          approved_at?: string | null
          click_id?: string | null
          commission_cents: number
          converted_at?: string
          created_at?: string
          id?: string
          network_id?: string | null
          network_transaction_id?: string | null
          order_amount_cents?: number | null
          product_id: string
          status?: string
        }
        Update: {
          approved_at?: string | null
          click_id?: string | null
          commission_cents?: number
          converted_at?: string
          created_at?: string
          id?: string
          network_id?: string | null
          network_transaction_id?: string | null
          order_amount_cents?: number | null
          product_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_conversions_click_id_fkey"
            columns: ["click_id"]
            isOneToOne: false
            referencedRelation: "affiliate_clicks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_conversions_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "affiliate_networks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_conversions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "affiliate_products"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_networks: {
        Row: {
          api_key_encrypted: string | null
          base_url: string | null
          created_at: string
          default_commission_rate: number | null
          id: string
          is_active: boolean
          name: string
          network_type: string
          updated_at: string
        }
        Insert: {
          api_key_encrypted?: string | null
          base_url?: string | null
          created_at?: string
          default_commission_rate?: number | null
          id?: string
          is_active?: boolean
          name: string
          network_type: string
          updated_at?: string
        }
        Update: {
          api_key_encrypted?: string | null
          base_url?: string | null
          created_at?: string
          default_commission_rate?: number | null
          id?: string
          is_active?: boolean
          name?: string
          network_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      affiliate_products: {
        Row: {
          affiliate_url: string
          brand_id: string
          category: string
          created_at: string
          description: string | null
          fallback_url: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price_cents: number | null
          season_tags: string[]
          slug: string
          sort_priority: number
          species_tags: string[]
          tags: string[]
          updated_at: string
          water_type_tags: string[]
        }
        Insert: {
          affiliate_url: string
          brand_id: string
          category: string
          created_at?: string
          description?: string | null
          fallback_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price_cents?: number | null
          season_tags?: string[]
          slug: string
          sort_priority?: number
          species_tags?: string[]
          tags?: string[]
          updated_at?: string
          water_type_tags?: string[]
        }
        Update: {
          affiliate_url?: string
          brand_id?: string
          category?: string
          created_at?: string
          description?: string | null
          fallback_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price_cents?: number | null
          season_tags?: string[]
          slug?: string
          sort_priority?: number
          species_tags?: string[]
          tags?: string[]
          updated_at?: string
          water_type_tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "affiliate_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_revenue_monthly: {
        Row: {
          brand_id: string | null
          clicks: number
          conversions: number
          created_at: string
          id: string
          network_id: string | null
          period: string
          revenue_cents: number
        }
        Insert: {
          brand_id?: string | null
          clicks?: number
          conversions?: number
          created_at?: string
          id?: string
          network_id?: string | null
          period: string
          revenue_cents?: number
        }
        Update: {
          brand_id?: string | null
          clicks?: number
          conversions?: number
          created_at?: string
          id?: string
          network_id?: string | null
          period?: string
          revenue_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_revenue_monthly_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "affiliate_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_revenue_monthly_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "affiliate_networks"
            referencedColumns: ["id"]
          },
        ]
      }
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
      angler_delegates: {
        Row: {
          accepted_at: string | null
          access_level: string
          angler_id: string
          delegate_email: string | null
          delegate_id: string | null
          granted_at: string
          id: string
          revoked_at: string | null
          status: string
        }
        Insert: {
          accepted_at?: string | null
          access_level: string
          angler_id: string
          delegate_email?: string | null
          delegate_id?: string | null
          granted_at?: string
          id?: string
          revoked_at?: string | null
          status?: string
        }
        Update: {
          accepted_at?: string | null
          access_level?: string
          angler_id?: string
          delegate_email?: string | null
          delegate_id?: string | null
          granted_at?: string
          id?: string
          revoked_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "angler_delegates_angler_id_fkey"
            columns: ["angler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "angler_delegates_delegate_id_fkey"
            columns: ["delegate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          organization_id: string | null
          reason: string | null
          represented_user_id: string | null
          scope: string | null
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
          organization_id?: string | null
          reason?: string | null
          represented_user_id?: string | null
          scope?: string | null
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
          organization_id?: string | null
          reason?: string | null
          represented_user_id?: string | null
          scope?: string | null
        }
        Relationships: []
      }
      booking_standing: {
        Row: {
          cancellation_score: number
          cancellation_score_updated_at: string | null
          concurrent_cap: number
          created_at: string
          id: string
          reason: string | null
          standing: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          cancellation_score?: number
          cancellation_score_updated_at?: string | null
          concurrent_cap?: number
          created_at?: string
          id?: string
          reason?: string | null
          standing?: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          cancellation_score?: number
          cancellation_score_updated_at?: string | null
          concurrent_cap?: number
          created_at?: string
          id?: string
          reason?: string | null
          standing?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_standing_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_standing_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          amount_cents: number | null
          angler_id: string
          base_rate: number
          booking_date: string
          booking_days: number
          booking_end_date: string | null
          booking_group_id: string | null
          booking_start_date: string | null
          cancellation_fault: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          club_commission: number
          club_membership_id: string
          confirmed_at: string | null
          created_at: string
          created_by_user_id: string | null
          cross_club_fee: number
          duration: string
          guide_id: string | null
          guide_payout: number | null
          guide_rate: number | null
          guide_service_fee: number | null
          home_club_referral: number
          hospitable_reservation_uuid: string | null
          id: string
          includes_lodging: boolean | null
          is_cross_club: boolean
          landowner_notes: string | null
          landowner_payout: number
          late_cancel_fee: number | null
          lodging_checkin_date: string | null
          lodging_checkout_date: string | null
          lodging_nightly_rate: number | null
          lodging_nights: number | null
          lodging_platform_fee: number | null
          lodging_source: string | null
          lodging_subtotal: number | null
          message: string | null
          non_fishing_guests: number
          on_behalf_of: boolean
          paid_at: string | null
          party_size: number
          payment_status: string | null
          payout_distributed_at: string | null
          platform_fee: number
          platform_fee_cents: number | null
          property_id: string
          refund_amount: number | null
          refund_percentage: number | null
          refunded_at: string | null
          status: string
          stripe_payment_intent_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          amount_cents?: number | null
          angler_id: string
          base_rate: number
          booking_date: string
          booking_days?: number
          booking_end_date?: string | null
          booking_group_id?: string | null
          booking_start_date?: string | null
          cancellation_fault?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          club_commission?: number
          club_membership_id: string
          confirmed_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          cross_club_fee?: number
          duration?: string
          guide_id?: string | null
          guide_payout?: number | null
          guide_rate?: number | null
          guide_service_fee?: number | null
          home_club_referral?: number
          hospitable_reservation_uuid?: string | null
          id?: string
          includes_lodging?: boolean | null
          is_cross_club?: boolean
          landowner_notes?: string | null
          landowner_payout?: number
          late_cancel_fee?: number | null
          lodging_checkin_date?: string | null
          lodging_checkout_date?: string | null
          lodging_nightly_rate?: number | null
          lodging_nights?: number | null
          lodging_platform_fee?: number | null
          lodging_source?: string | null
          lodging_subtotal?: number | null
          message?: string | null
          non_fishing_guests?: number
          on_behalf_of?: boolean
          paid_at?: string | null
          party_size?: number
          payment_status?: string | null
          payout_distributed_at?: string | null
          platform_fee?: number
          platform_fee_cents?: number | null
          property_id: string
          refund_amount?: number | null
          refund_percentage?: number | null
          refunded_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          amount_cents?: number | null
          angler_id?: string
          base_rate?: number
          booking_date?: string
          booking_days?: number
          booking_end_date?: string | null
          booking_group_id?: string | null
          booking_start_date?: string | null
          cancellation_fault?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          club_commission?: number
          club_membership_id?: string
          confirmed_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          cross_club_fee?: number
          duration?: string
          guide_id?: string | null
          guide_payout?: number | null
          guide_rate?: number | null
          guide_service_fee?: number | null
          home_club_referral?: number
          hospitable_reservation_uuid?: string | null
          id?: string
          includes_lodging?: boolean | null
          is_cross_club?: boolean
          landowner_notes?: string | null
          landowner_payout?: number
          late_cancel_fee?: number | null
          lodging_checkin_date?: string | null
          lodging_checkout_date?: string | null
          lodging_nightly_rate?: number | null
          lodging_nights?: number | null
          lodging_platform_fee?: number | null
          lodging_source?: string | null
          lodging_subtotal?: number | null
          message?: string | null
          non_fishing_guests?: number
          on_behalf_of?: boolean
          paid_at?: string | null
          party_size?: number
          payment_status?: string | null
          payout_distributed_at?: string | null
          platform_fee?: number
          platform_fee_cents?: number | null
          property_id?: string
          refund_amount?: number | null
          refund_percentage?: number | null
          refunded_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
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
            foreignKeyName: "bookings_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      campaign_enrollments: {
        Row: {
          campaign_id: string
          completed_at: string | null
          current_step: number
          enrolled_at: string
          id: string
          last_step_sent_at: string | null
          lead_id: string | null
          next_step_due_at: string | null
          recipient_email: string
          recipient_id: string | null
          recipient_type: string
          status: string
        }
        Insert: {
          campaign_id: string
          completed_at?: string | null
          current_step?: number
          enrolled_at?: string
          id?: string
          last_step_sent_at?: string | null
          lead_id?: string | null
          next_step_due_at?: string | null
          recipient_email: string
          recipient_id?: string | null
          recipient_type?: string
          status?: string
        }
        Update: {
          campaign_id?: string
          completed_at?: string | null
          current_step?: number
          enrolled_at?: string
          id?: string
          last_step_sent_at?: string | null
          lead_id?: string | null
          next_step_due_at?: string | null
          recipient_email?: string
          recipient_id?: string | null
          recipient_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_enrollments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_enrollments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_enrollments_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_sends: {
        Row: {
          bounce_reason: string | null
          bounced_at: string | null
          campaign_id: string
          click_count: number
          clicked_at: string | null
          created_at: string
          delivered_at: string | null
          drip_scheduled_for: string | null
          id: string
          lead_id: string | null
          open_count: number
          opened_at: string | null
          recipient_email: string
          recipient_id: string | null
          recipient_type: string
          resend_message_id: string | null
          sent_at: string | null
          status: string
          step_id: string
          template_data: Json | null
          unsubscribed_at: string | null
        }
        Insert: {
          bounce_reason?: string | null
          bounced_at?: string | null
          campaign_id: string
          click_count?: number
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          drip_scheduled_for?: string | null
          id?: string
          lead_id?: string | null
          open_count?: number
          opened_at?: string | null
          recipient_email: string
          recipient_id?: string | null
          recipient_type?: string
          resend_message_id?: string | null
          sent_at?: string | null
          status?: string
          step_id: string
          template_data?: Json | null
          unsubscribed_at?: string | null
        }
        Update: {
          bounce_reason?: string | null
          bounced_at?: string | null
          campaign_id?: string
          click_count?: number
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          drip_scheduled_for?: string | null
          id?: string
          lead_id?: string | null
          open_count?: number
          opened_at?: string | null
          recipient_email?: string
          recipient_id?: string | null
          recipient_type?: string
          resend_message_id?: string | null
          sent_at?: string | null
          status?: string
          step_id?: string
          template_data?: Json | null
          unsubscribed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_sends_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_sends_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_sends_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "campaign_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_steps: {
        Row: {
          campaign_id: string
          created_at: string
          cta_label: string | null
          cta_url: string | null
          delay_minutes: number
          html_body: string
          id: string
          plain_body: string | null
          step_order: number
          subject: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          delay_minutes?: number
          html_body: string
          id?: string
          plain_body?: string | null
          step_order?: number
          subject: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          delay_minutes?: number
          html_body?: string
          id?: string
          plain_body?: string | null
          step_order?: number
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_steps_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          from_email: string
          from_name: string
          id: string
          is_prebuilt: boolean
          name: string
          prebuilt_key: string | null
          reply_to: string | null
          segment_id: string | null
          send_time_strategy: string | null
          started_at: string | null
          status: string
          topic_id: string | null
          trigger_config: Json
          trigger_event: string | null
          type: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          from_email?: string
          from_name?: string
          id?: string
          is_prebuilt?: boolean
          name: string
          prebuilt_key?: string | null
          reply_to?: string | null
          segment_id?: string | null
          send_time_strategy?: string | null
          started_at?: string | null
          status?: string
          topic_id?: string | null
          trigger_config?: Json
          trigger_event?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          from_email?: string
          from_name?: string
          id?: string
          is_prebuilt?: boolean
          name?: string
          prebuilt_key?: string | null
          reply_to?: string | null
          segment_id?: string | null
          send_time_strategy?: string | null
          started_at?: string | null
          status?: string
          topic_id?: string | null
          trigger_config?: Json
          trigger_event?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "crm_subscription_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      club_calendar_tokens: {
        Row: {
          club_id: string
          created_at: string
          id: string
          token: string
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          token?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_calendar_tokens_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: true
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_campaign_recipients: {
        Row: {
          bounce_reason: string | null
          bounced_at: string | null
          campaign_id: string
          click_count: number | null
          clicked_at: string | null
          created_at: string
          delivered_at: string | null
          email: string
          error_message: string | null
          esp_message_id: string | null
          id: string
          membership_id: string
          open_count: number | null
          opened_at: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          bounce_reason?: string | null
          bounced_at?: string | null
          campaign_id: string
          click_count?: number | null
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          email: string
          error_message?: string | null
          esp_message_id?: string | null
          id?: string
          membership_id: string
          open_count?: number | null
          opened_at?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          bounce_reason?: string | null
          bounced_at?: string | null
          campaign_id?: string
          click_count?: number | null
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          email?: string
          error_message?: string | null
          esp_message_id?: string | null
          id?: string
          membership_id?: string
          open_count?: number | null
          opened_at?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "club_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_campaign_recipients_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      club_campaigns: {
        Row: {
          body_html: string
          body_text: string
          bounce_count: number | null
          click_count: number | null
          club_id: string
          created_at: string
          failed_reason: string | null
          group_id: string | null
          id: string
          open_count: number | null
          recipient_count: number | null
          scheduled_at: string | null
          segment_filters: Json | null
          sender_user_id: string
          sending_started_at: string | null
          sent_at: string | null
          status: string
          subject: string
          template_id: string | null
          type: string
          updated_at: string
          vertical_context: Json | null
        }
        Insert: {
          body_html?: string
          body_text?: string
          bounce_count?: number | null
          click_count?: number | null
          club_id: string
          created_at?: string
          failed_reason?: string | null
          group_id?: string | null
          id?: string
          open_count?: number | null
          recipient_count?: number | null
          scheduled_at?: string | null
          segment_filters?: Json | null
          sender_user_id: string
          sending_started_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          template_id?: string | null
          type: string
          updated_at?: string
          vertical_context?: Json | null
        }
        Update: {
          body_html?: string
          body_text?: string
          bounce_count?: number | null
          click_count?: number | null
          club_id?: string
          created_at?: string
          failed_reason?: string | null
          group_id?: string | null
          id?: string
          open_count?: number | null
          recipient_count?: number | null
          scheduled_at?: string | null
          segment_filters?: Json | null
          sender_user_id?: string
          sending_started_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          template_id?: string | null
          type?: string
          updated_at?: string
          vertical_context?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "club_campaigns_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_campaigns_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "club_member_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_campaigns_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "club_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      club_communication_preferences: {
        Row: {
          club_id: string
          email_broadcasts: boolean
          email_digest: boolean
          email_event_notices: boolean
          email_targeted: boolean
          id: string
          membership_id: string
          updated_at: string
        }
        Insert: {
          club_id: string
          email_broadcasts?: boolean
          email_digest?: boolean
          email_event_notices?: boolean
          email_targeted?: boolean
          id?: string
          membership_id: string
          updated_at?: string
        }
        Update: {
          club_id?: string
          email_broadcasts?: boolean
          email_digest?: boolean
          email_event_notices?: boolean
          email_targeted?: boolean
          id?: string
          membership_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_communication_preferences_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_communication_preferences_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      club_event_registrations: {
        Row: {
          cancelled_at: string | null
          checked_in_at: string | null
          created_at: string
          event_id: string
          guest_count: number
          id: string
          membership_id: string
          notes: string | null
          promoted_at: string | null
          registered_at: string
          status: string
          vertical_context: Json | null
          waitlist_position: number | null
        }
        Insert: {
          cancelled_at?: string | null
          checked_in_at?: string | null
          created_at?: string
          event_id: string
          guest_count?: number
          id?: string
          membership_id: string
          notes?: string | null
          promoted_at?: string | null
          registered_at?: string
          status?: string
          vertical_context?: Json | null
          waitlist_position?: number | null
        }
        Update: {
          cancelled_at?: string | null
          checked_in_at?: string | null
          created_at?: string
          event_id?: string
          guest_count?: number
          id?: string
          membership_id?: string
          notes?: string | null
          promoted_at?: string | null
          registered_at?: string
          status?: string
          vertical_context?: Json | null
          waitlist_position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "club_event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "club_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_event_registrations_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      club_events: {
        Row: {
          all_day: boolean
          attended_count: number
          cancelled_reason: string | null
          club_id: string
          created_at: string
          created_by: string
          description: string | null
          ends_at: string | null
          guest_allowed: boolean
          guest_limit_per_member: number | null
          id: string
          location: string | null
          registered_count: number
          rsvp_deadline: string | null
          rsvp_limit: number | null
          starts_at: string
          status: string
          title: string
          type: string
          updated_at: string
          vertical_context: Json | null
          waitlist_count: number
          waitlist_enabled: boolean
        }
        Insert: {
          all_day?: boolean
          attended_count?: number
          cancelled_reason?: string | null
          club_id: string
          created_at?: string
          created_by: string
          description?: string | null
          ends_at?: string | null
          guest_allowed?: boolean
          guest_limit_per_member?: number | null
          id?: string
          location?: string | null
          registered_count?: number
          rsvp_deadline?: string | null
          rsvp_limit?: number | null
          starts_at: string
          status?: string
          title: string
          type: string
          updated_at?: string
          vertical_context?: Json | null
          waitlist_count?: number
          waitlist_enabled?: boolean
        }
        Update: {
          all_day?: boolean
          attended_count?: number
          cancelled_reason?: string | null
          club_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          ends_at?: string | null
          guest_allowed?: boolean
          guest_limit_per_member?: number | null
          id?: string
          location?: string | null
          registered_count?: number
          rsvp_deadline?: string | null
          rsvp_limit?: number | null
          starts_at?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
          vertical_context?: Json | null
          waitlist_count?: number
          waitlist_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "club_events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_incidents: {
        Row: {
          assigned_to: string | null
          closed_at: string | null
          club_id: string
          created_at: string
          description: string
          id: string
          occurred_at: string | null
          reported_by: string
          resolution: string | null
          resolved_at: string | null
          severity: string
          status: string
          title: string
          type: string
          updated_at: string
          vertical_context: Json | null
        }
        Insert: {
          assigned_to?: string | null
          closed_at?: string | null
          club_id: string
          created_at?: string
          description: string
          id?: string
          occurred_at?: string | null
          reported_by: string
          resolution?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title: string
          type: string
          updated_at?: string
          vertical_context?: Json | null
        }
        Update: {
          assigned_to?: string | null
          closed_at?: string | null
          club_id?: string
          created_at?: string
          description?: string
          id?: string
          occurred_at?: string | null
          reported_by?: string
          resolution?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
          vertical_context?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "club_incidents_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_incidents_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_incidents_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      club_member_activity_events: {
        Row: {
          club_id: string
          event_type: string
          id: string
          membership_id: string
          metadata: Json | null
          occurred_at: string
        }
        Insert: {
          club_id: string
          event_type: string
          id?: string
          membership_id: string
          metadata?: Json | null
          occurred_at?: string
        }
        Update: {
          club_id?: string
          event_type?: string
          id?: string
          membership_id?: string
          metadata?: Json | null
          occurred_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_member_activity_events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_member_activity_events_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      club_member_group_assignments: {
        Row: {
          added_at: string
          added_by: string | null
          group_id: string
          membership_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          group_id: string
          membership_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          group_id?: string
          membership_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_member_group_assignments_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_member_group_assignments_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "club_member_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_member_group_assignments_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      club_member_groups: {
        Row: {
          club_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_smart: boolean
          member_count: number | null
          name: string
          smart_filters: Json | null
          updated_at: string
        }
        Insert: {
          club_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_smart?: boolean
          member_count?: number | null
          name: string
          smart_filters?: Json | null
          updated_at?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_smart?: boolean
          member_count?: number | null
          name?: string
          smart_filters?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_member_groups_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_member_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          referral_code: string | null
          referred_by: string | null
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
          referral_code?: string | null
          referred_by?: string | null
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
          referral_code?: string | null
          referred_by?: string | null
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
            foreignKeyName: "club_memberships_referred_by_fkey"
            columns: ["referred_by"]
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
      club_templates: {
        Row: {
          body_template: string
          club_id: string | null
          created_at: string
          id: string
          is_system_default: boolean
          name: string
          subject_template: string
          type: string
          updated_at: string
        }
        Insert: {
          body_template?: string
          club_id?: string | null
          created_at?: string
          id?: string
          is_system_default?: boolean
          name: string
          subject_template?: string
          type: string
          updated_at?: string
        }
        Update: {
          body_template?: string
          club_id?: string | null
          created_at?: string
          id?: string
          is_system_default?: boolean
          name?: string
          subject_template?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_templates_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_waitlists: {
        Row: {
          accepted_at: string | null
          cancelled_at: string | null
          club_id: string
          created_at: string
          id: string
          notes: string | null
          offer_expires_at: string | null
          offered_at: string | null
          position: number
          reference_id: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
          vertical_context: Json | null
        }
        Insert: {
          accepted_at?: string | null
          cancelled_at?: string | null
          club_id: string
          created_at?: string
          id?: string
          notes?: string | null
          offer_expires_at?: string | null
          offered_at?: string | null
          position: number
          reference_id?: string | null
          status?: string
          type: string
          updated_at?: string
          user_id: string
          vertical_context?: Json | null
        }
        Update: {
          accepted_at?: string | null
          cancelled_at?: string | null
          club_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          offer_expires_at?: string | null
          offered_at?: string | null
          position?: number
          reference_id?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
          vertical_context?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "club_waitlists_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_waitlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_waiver_signatures: {
        Row: {
          expires_at: string | null
          id: string
          ip_address: unknown
          membership_id: string
          signed_at: string
          user_agent: string | null
          waiver_id: string
        }
        Insert: {
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          membership_id: string
          signed_at?: string
          user_agent?: string | null
          waiver_id: string
        }
        Update: {
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          membership_id?: string
          signed_at?: string
          user_agent?: string | null
          waiver_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_waiver_signatures_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_waiver_signatures_waiver_id_fkey"
            columns: ["waiver_id"]
            isOneToOne: false
            referencedRelation: "club_waivers"
            referencedColumns: ["id"]
          },
        ]
      }
      club_waivers: {
        Row: {
          body_text: string
          club_id: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          requires_annual_renewal: boolean
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          body_text: string
          club_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          requires_annual_renewal?: boolean
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          body_text?: string
          club_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          requires_annual_renewal?: boolean
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "club_waivers_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_waivers_created_by_fkey"
            columns: ["created_by"]
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
          is_active: boolean
          location: string | null
          logo_url: string | null
          membership_application_required: boolean
          name: string
          owner_id: string
          platform_tier: string | null
          referral_program_enabled: boolean
          referral_reward: number
          rules: string | null
          stripe_connect_account_id: string | null
          stripe_connect_onboarded: boolean
          stripe_dues_price_id: string | null
          stripe_subscription_id: string | null
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
          is_active?: boolean
          location?: string | null
          logo_url?: string | null
          membership_application_required?: boolean
          name: string
          owner_id: string
          platform_tier?: string | null
          referral_program_enabled?: boolean
          referral_reward?: number
          rules?: string | null
          stripe_connect_account_id?: string | null
          stripe_connect_onboarded?: boolean
          stripe_dues_price_id?: string | null
          stripe_subscription_id?: string | null
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
          is_active?: boolean
          location?: string | null
          logo_url?: string | null
          membership_application_required?: boolean
          name?: string
          owner_id?: string
          platform_tier?: string | null
          referral_program_enabled?: boolean
          referral_reward?: number
          rules?: string | null
          stripe_connect_account_id?: string | null
          stripe_connect_onboarded?: boolean
          stripe_dues_price_id?: string | null
          stripe_subscription_id?: string | null
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
      compass_conversations: {
        Row: {
          created_at: string
          id: string
          messages: Json
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compass_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compass_credit_purchases: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          messages_purchased: number
          pack_key: string
          status: string
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          messages_purchased: number
          pack_key: string
          status?: string
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          messages_purchased?: number
          pack_key?: string
          status?: string
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compass_credit_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compass_credits: {
        Row: {
          balance: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compass_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compass_usage: {
        Row: {
          created_at: string
          id: string
          message_count: number
          period: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_count?: number
          period: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_count?: number
          period?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compass_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_requests: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          notes: string | null
          organization: string
          preferred_dates: string | null
          property_count: number | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          notes?: string | null
          organization: string
          preferred_dates?: string | null
          property_count?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string | null
          organization?: string
          preferred_dates?: string | null
          property_count?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
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
      crm_contact_activity: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          email: string
          id: string
          metadata: Json | null
          source_id: string | null
          source_type: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          email: string
          id?: string
          metadata?: Json | null
          source_id?: string | null
          source_type?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          email?: string
          id?: string
          metadata?: Json | null
          source_id?: string | null
          source_type?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      crm_contact_tags: {
        Row: {
          added_by: string | null
          created_at: string
          id: string
          tag: string
          user_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          id?: string
          tag: string
          user_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          id?: string
          tag?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_conversions: {
        Row: {
          attributed_campaign_id: string | null
          attributed_send_id: string | null
          attributed_workflow_id: string | null
          attribution_type: string | null
          attribution_window_hours: number | null
          created_at: string
          currency: string | null
          email: string
          event_category: string
          event_name: string
          id: string
          properties: Json | null
          user_id: string | null
          value_cents: number | null
        }
        Insert: {
          attributed_campaign_id?: string | null
          attributed_send_id?: string | null
          attributed_workflow_id?: string | null
          attribution_type?: string | null
          attribution_window_hours?: number | null
          created_at?: string
          currency?: string | null
          email: string
          event_category?: string
          event_name: string
          id?: string
          properties?: Json | null
          user_id?: string | null
          value_cents?: number | null
        }
        Update: {
          attributed_campaign_id?: string | null
          attributed_send_id?: string | null
          attributed_workflow_id?: string | null
          attribution_type?: string | null
          attribution_window_hours?: number | null
          created_at?: string
          currency?: string | null
          email?: string
          event_category?: string
          event_name?: string
          id?: string
          properties?: Json | null
          user_id?: string | null
          value_cents?: number | null
        }
        Relationships: []
      }
      crm_dashboard_snapshots: {
        Row: {
          active_campaigns: number
          active_workflows: number
          bounces_30d: number
          bounces_7d: number
          click_rate_7d: number
          clicks_30d: number
          clicks_7d: number
          clicks_by_day: Json
          created_at: string
          delivered_30d: number
          delivered_7d: number
          id: string
          open_rate_7d: number
          opens_30d: number
          opens_7d: number
          opens_by_day: Json
          sends_30d: number
          sends_7d: number
          sends_by_day: Json
          snapshot_date: string
          top_campaigns: Json
          total_contacts: number
          total_leads: number
          unsubscribes_30d: number
          unsubscribes_7d: number
        }
        Insert: {
          active_campaigns?: number
          active_workflows?: number
          bounces_30d?: number
          bounces_7d?: number
          click_rate_7d?: number
          clicks_30d?: number
          clicks_7d?: number
          clicks_by_day?: Json
          created_at?: string
          delivered_30d?: number
          delivered_7d?: number
          id?: string
          open_rate_7d?: number
          opens_30d?: number
          opens_7d?: number
          opens_by_day?: Json
          sends_30d?: number
          sends_7d?: number
          sends_by_day?: Json
          snapshot_date: string
          top_campaigns?: Json
          total_contacts?: number
          total_leads?: number
          unsubscribes_30d?: number
          unsubscribes_7d?: number
        }
        Update: {
          active_campaigns?: number
          active_workflows?: number
          bounces_30d?: number
          bounces_7d?: number
          click_rate_7d?: number
          clicks_30d?: number
          clicks_7d?: number
          clicks_by_day?: Json
          created_at?: string
          delivered_30d?: number
          delivered_7d?: number
          id?: string
          open_rate_7d?: number
          opens_30d?: number
          opens_7d?: number
          opens_by_day?: Json
          sends_30d?: number
          sends_7d?: number
          sends_by_day?: Json
          snapshot_date?: string
          top_campaigns?: Json
          total_contacts?: number
          total_leads?: number
          unsubscribes_30d?: number
          unsubscribes_7d?: number
        }
        Relationships: []
      }
      crm_engagement_windows: {
        Row: {
          click_count: number
          day_of_week: number
          email: string
          hour_utc: number
          id: string
          open_count: number
          score: number
          updated_at: string
        }
        Insert: {
          click_count?: number
          day_of_week: number
          email: string
          hour_utc: number
          id?: string
          open_count?: number
          score?: number
          updated_at?: string
        }
        Update: {
          click_count?: number
          day_of_week?: number
          email?: string
          hour_utc?: number
          id?: string
          open_count?: number
          score?: number
          updated_at?: string
        }
        Relationships: []
      }
      crm_frequency_caps: {
        Row: {
          applies_to: string
          created_at: string
          id: string
          is_active: boolean
          max_sends: number
          name: string
          updated_at: string
          window_hours: number
        }
        Insert: {
          applies_to?: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_sends?: number
          name: string
          updated_at?: string
          window_hours?: number
        }
        Update: {
          applies_to?: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_sends?: number
          name?: string
          updated_at?: string
          window_hours?: number
        }
        Relationships: []
      }
      crm_lead_topic_subscriptions: {
        Row: {
          id: string
          lead_id: string
          subscribed: boolean
          topic_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          subscribed?: boolean
          topic_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          subscribed?: boolean
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_lead_topic_subscriptions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_lead_topic_subscriptions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "crm_subscription_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_notifications: {
        Row: {
          action_url: string | null
          body: string | null
          category: string
          created_at: string
          id: string
          is_read: boolean
          read_at: string | null
          source_id: string | null
          source_type: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          category?: string
          created_at?: string
          id?: string
          is_read?: boolean
          read_at?: string | null
          source_id?: string | null
          source_type?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string | null
          category?: string
          created_at?: string
          id?: string
          is_read?: boolean
          read_at?: string | null
          source_id?: string | null
          source_type?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_send_schedule: {
        Row: {
          created_at: string
          id: string
          recipient_email: string
          scheduled_for: string
          send_id: string | null
          status: string
          strategy: string
          workflow_enrollment_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          recipient_email: string
          scheduled_for: string
          send_id?: string | null
          status?: string
          strategy?: string
          workflow_enrollment_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          recipient_email?: string
          scheduled_for?: string
          send_id?: string | null
          status?: string
          strategy?: string
          workflow_enrollment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_send_schedule_send_id_fkey"
            columns: ["send_id"]
            isOneToOne: false
            referencedRelation: "campaign_sends"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_send_schedule_workflow_enrollment_id_fkey"
            columns: ["workflow_enrollment_id"]
            isOneToOne: false
            referencedRelation: "crm_workflow_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_sms_sends: {
        Row: {
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          message: string
          phone_number: string
          provider_id: string | null
          sent_at: string | null
          source_id: string | null
          source_type: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message: string
          phone_number: string
          provider_id?: string | null
          sent_at?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message?: string
          phone_number?: string
          provider_id?: string | null
          sent_at?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      crm_subscription_topics: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_default: boolean
          is_required: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_default?: boolean
          is_required?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_default?: boolean
          is_required?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_user_topic_subscriptions: {
        Row: {
          id: string
          subscribed: boolean
          topic_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          subscribed?: boolean
          topic_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          subscribed?: boolean
          topic_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_user_topic_subscriptions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "crm_subscription_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_workflow_edges: {
        Row: {
          created_at: string
          id: string
          source_handle: string | null
          source_node_id: string
          target_node_id: string
          workflow_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          source_handle?: string | null
          source_node_id: string
          target_node_id: string
          workflow_id: string
        }
        Update: {
          created_at?: string
          id?: string
          source_handle?: string | null
          source_node_id?: string
          target_node_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_workflow_edges_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "crm_workflow_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_workflow_edges_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "crm_workflow_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_workflow_edges_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "crm_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_workflow_enrollments: {
        Row: {
          completed_at: string | null
          context_data: Json | null
          current_node_id: string | null
          email: string
          enrolled_at: string
          id: string
          last_processed_at: string | null
          status: string
          user_id: string | null
          wait_until: string | null
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          context_data?: Json | null
          current_node_id?: string | null
          email: string
          enrolled_at?: string
          id?: string
          last_processed_at?: string | null
          status?: string
          user_id?: string | null
          wait_until?: string | null
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          context_data?: Json | null
          current_node_id?: string | null
          email?: string
          enrolled_at?: string
          id?: string
          last_processed_at?: string | null
          status?: string
          user_id?: string | null
          wait_until?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_workflow_enrollments_current_node_id_fkey"
            columns: ["current_node_id"]
            isOneToOne: false
            referencedRelation: "crm_workflow_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_workflow_enrollments_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "crm_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_workflow_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          enrollment_id: string
          id: string
          node_id: string | null
          workflow_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          enrollment_id: string
          id?: string
          node_id?: string | null
          workflow_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          enrollment_id?: string
          id?: string
          node_id?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_workflow_logs_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "crm_workflow_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_workflow_logs_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "crm_workflow_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_workflow_logs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "crm_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_workflow_nodes: {
        Row: {
          config: Json
          created_at: string
          id: string
          label: string
          position_x: number
          position_y: number
          type: string
          workflow_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          label?: string
          position_x?: number
          position_y?: number
          type: string
          workflow_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          label?: string
          position_x?: number
          position_y?: number
          type?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_workflow_nodes_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "crm_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_workflows: {
        Row: {
          activated_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          paused_at: string | null
          segment_id: string | null
          send_time_strategy: string | null
          status: string
          trigger_event: string | null
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          paused_at?: string | null
          segment_id?: string | null
          send_time_strategy?: string | null
          status?: string
          trigger_event?: string | null
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          paused_at?: string | null
          segment_id?: string | null
          send_time_strategy?: string | null
          status?: string
          trigger_event?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_workflows_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "segments"
            referencedColumns: ["id"]
          },
        ]
      }
      cross_club_agreements: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          club_a_id: string
          club_b_id: string
          created_at: string
          id: string
          proposed_at: string
          proposed_by: string
          revoked_at: string | null
          revoked_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          club_a_id: string
          club_b_id: string
          created_at?: string
          id?: string
          proposed_at?: string
          proposed_by: string
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          club_a_id?: string
          club_b_id?: string
          created_at?: string
          id?: string
          proposed_at?: string
          proposed_by?: string
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cross_club_agreements_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_club_agreements_club_a_id_fkey"
            columns: ["club_a_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_club_agreements_club_b_id_fkey"
            columns: ["club_b_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_club_agreements_proposed_by_fkey"
            columns: ["proposed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_club_agreements_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      email_suppression_list: {
        Row: {
          created_at: string
          email: string
          id: string
          reason: string
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          reason: string
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          reason?: string
          source?: string | null
        }
        Relationships: []
      }
      engagement_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: unknown
          send_id: string
          url: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: unknown
          send_id: string
          url?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: unknown
          send_id?: string
          url?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_events_send_id_fkey"
            columns: ["send_id"]
            isOneToOne: false
            referencedRelation: "campaign_sends"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          description: string | null
          enabled: boolean
          key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          enabled?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          enabled?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      finance_daily_snapshots: {
        Row: {
          booking_count: number
          compass_credit_revenue: number
          created_at: string
          dispute_count: number
          gross_processed: number
          id: string
          membership_revenue: number
          mercury_balance: number
          net_revenue: number
          open_exceptions: number
          payouts_arrived: number
          payouts_created: number
          refunds_issued: number
          snapshot_date: string
          stripe_available_balance: number
          stripe_fees: number
          stripe_pending_balance: number
        }
        Insert: {
          booking_count?: number
          compass_credit_revenue?: number
          created_at?: string
          dispute_count?: number
          gross_processed?: number
          id?: string
          membership_revenue?: number
          mercury_balance?: number
          net_revenue?: number
          open_exceptions?: number
          payouts_arrived?: number
          payouts_created?: number
          refunds_issued?: number
          snapshot_date: string
          stripe_available_balance?: number
          stripe_fees?: number
          stripe_pending_balance?: number
        }
        Update: {
          booking_count?: number
          compass_credit_revenue?: number
          created_at?: string
          dispute_count?: number
          gross_processed?: number
          id?: string
          membership_revenue?: number
          mercury_balance?: number
          net_revenue?: number
          open_exceptions?: number
          payouts_arrived?: number
          payouts_created?: number
          refunds_issued?: number
          snapshot_date?: string
          stripe_available_balance?: number
          stripe_fees?: number
          stripe_pending_balance?: number
        }
        Relationships: []
      }
      finance_mercury_accounts: {
        Row: {
          account_number_last4: string | null
          available_balance: number
          current_balance: number
          id: string
          kind: string
          last_snapshot_at: string
          mercury_account_id: string
          name: string
        }
        Insert: {
          account_number_last4?: string | null
          available_balance?: number
          current_balance?: number
          id?: string
          kind?: string
          last_snapshot_at?: string
          mercury_account_id: string
          name: string
        }
        Update: {
          account_number_last4?: string | null
          available_balance?: number
          current_balance?: number
          id?: string
          kind?: string
          last_snapshot_at?: string
          mercury_account_id?: string
          name?: string
        }
        Relationships: []
      }
      finance_mercury_transactions: {
        Row: {
          amount: number
          bank_description: string | null
          counterparty_name: string | null
          created_at: string
          external_memo: string | null
          id: string
          is_stripe_deposit: boolean
          matched_at: string | null
          matched_payout_id: string | null
          mercury_account_id: string
          mercury_category: string | null
          mercury_txn_id: string
          note: string | null
          posted_at: string | null
          reconciliation_status: string
          status: string
          synced_at: string
        }
        Insert: {
          amount: number
          bank_description?: string | null
          counterparty_name?: string | null
          created_at?: string
          external_memo?: string | null
          id?: string
          is_stripe_deposit?: boolean
          matched_at?: string | null
          matched_payout_id?: string | null
          mercury_account_id: string
          mercury_category?: string | null
          mercury_txn_id: string
          note?: string | null
          posted_at?: string | null
          reconciliation_status?: string
          status?: string
          synced_at?: string
        }
        Update: {
          amount?: number
          bank_description?: string | null
          counterparty_name?: string | null
          created_at?: string
          external_memo?: string | null
          id?: string
          is_stripe_deposit?: boolean
          matched_at?: string | null
          matched_payout_id?: string | null
          mercury_account_id?: string
          mercury_category?: string | null
          mercury_txn_id?: string
          note?: string | null
          posted_at?: string | null
          reconciliation_status?: string
          status?: string
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_mercury_transactions_matched_payout_id_fkey"
            columns: ["matched_payout_id"]
            isOneToOne: false
            referencedRelation: "finance_stripe_payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_reconciliation_exceptions: {
        Row: {
          actual_amount: number | null
          created_at: string
          description: string
          expected_amount: number | null
          id: string
          mercury_txn_id: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          stripe_payout_id: string | null
          type: string
        }
        Insert: {
          actual_amount?: number | null
          created_at?: string
          description: string
          expected_amount?: number | null
          id?: string
          mercury_txn_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          stripe_payout_id?: string | null
          type: string
        }
        Update: {
          actual_amount?: number | null
          created_at?: string
          description?: string
          expected_amount?: number | null
          id?: string
          mercury_txn_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          stripe_payout_id?: string | null
          type?: string
        }
        Relationships: []
      }
      finance_stripe_balance_txns: {
        Row: {
          amount: number
          available_on: string | null
          booking_id: string | null
          created_at: string
          currency: string
          description: string | null
          fee: number
          id: string
          metadata: Json | null
          net: number
          reporting_category: string | null
          source_id: string | null
          source_type: string | null
          stripe_balance_txn_id: string
          stripe_payout_id: string | null
          synced_at: string
          type: string
        }
        Insert: {
          amount: number
          available_on?: string | null
          booking_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          fee?: number
          id?: string
          metadata?: Json | null
          net: number
          reporting_category?: string | null
          source_id?: string | null
          source_type?: string | null
          stripe_balance_txn_id: string
          stripe_payout_id?: string | null
          synced_at?: string
          type: string
        }
        Update: {
          amount?: number
          available_on?: string | null
          booking_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          fee?: number
          id?: string
          metadata?: Json | null
          net?: number
          reporting_category?: string | null
          source_id?: string | null
          source_type?: string | null
          stripe_balance_txn_id?: string
          stripe_payout_id?: string | null
          synced_at?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_stripe_balance_txns_stripe_payout_id_fkey"
            columns: ["stripe_payout_id"]
            isOneToOne: false
            referencedRelation: "finance_stripe_payouts"
            referencedColumns: ["stripe_payout_id"]
          },
        ]
      }
      finance_stripe_payouts: {
        Row: {
          amount: number
          arrival_date: string | null
          balance_transaction_id: string | null
          created_at: string
          currency: string
          description: string | null
          failed_at: string | null
          failure_code: string | null
          failure_message: string | null
          fee_amount: number | null
          gross_amount: number | null
          id: string
          item_count: number | null
          matched_at: string | null
          matched_mercury_txn_id: string | null
          metadata: Json | null
          method: string
          paid_at: string | null
          reconciliation_status: string
          refund_amount: number | null
          status: string
          stripe_payout_id: string
          synced_at: string
          trace_id: string | null
        }
        Insert: {
          amount: number
          arrival_date?: string | null
          balance_transaction_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          failed_at?: string | null
          failure_code?: string | null
          failure_message?: string | null
          fee_amount?: number | null
          gross_amount?: number | null
          id?: string
          item_count?: number | null
          matched_at?: string | null
          matched_mercury_txn_id?: string | null
          metadata?: Json | null
          method?: string
          paid_at?: string | null
          reconciliation_status?: string
          refund_amount?: number | null
          status?: string
          stripe_payout_id: string
          synced_at?: string
          trace_id?: string | null
        }
        Update: {
          amount?: number
          arrival_date?: string | null
          balance_transaction_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          failed_at?: string | null
          failure_code?: string | null
          failure_message?: string | null
          fee_amount?: number | null
          gross_amount?: number | null
          id?: string
          item_count?: number | null
          matched_at?: string | null
          matched_mercury_txn_id?: string | null
          metadata?: Json | null
          method?: string
          paid_at?: string | null
          reconciliation_status?: string
          refund_amount?: number | null
          status?: string
          stripe_payout_id?: string
          synced_at?: string
          trace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_matched_mercury_txn"
            columns: ["matched_mercury_txn_id"]
            isOneToOne: false
            referencedRelation: "finance_mercury_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_sync_status: {
        Row: {
          id: string
          last_error: string | null
          last_sync_at: string | null
          last_sync_status: string
          next_sync_at: string | null
          records_synced: number | null
          system: string
        }
        Insert: {
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          last_sync_status?: string
          next_sync_at?: string | null
          records_synced?: number | null
          system: string
        }
        Update: {
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          last_sync_status?: string
          next_sync_at?: string | null
          records_synced?: number | null
          system?: string
        }
        Relationships: []
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
          checkr_candidate_id: string | null
          checkr_completed_at: string | null
          checkr_report_id: string | null
          checkr_status: string | null
          closest_airports: string | null
          created_at: string
          display_name: string
          first_aid_cert_url: string | null
          first_aid_expiry: string | null
          gear_details: string | null
          gear_included: boolean
          guide_license_expiry: string | null
          guide_license_url: string | null
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
          live_at: string | null
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
          suspension_type: string | null
          techniques: string[] | null
          trips_completed: number | null
          updated_at: string
          uscg_license_expiry: string | null
          uscg_license_url: string | null
          user_id: string
          verification_fee_paid: boolean
          verification_fee_paid_at: string | null
          verification_fee_session_id: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          base_location?: string | null
          bio?: string | null
          cancellation_rate?: number | null
          checkr_candidate_id?: string | null
          checkr_completed_at?: string | null
          checkr_report_id?: string | null
          checkr_status?: string | null
          closest_airports?: string | null
          created_at?: string
          display_name: string
          first_aid_cert_url?: string | null
          first_aid_expiry?: string | null
          gear_details?: string | null
          gear_included?: boolean
          guide_license_expiry?: string | null
          guide_license_url?: string | null
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
          live_at?: string | null
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
          suspension_type?: string | null
          techniques?: string[] | null
          trips_completed?: number | null
          updated_at?: string
          uscg_license_expiry?: string | null
          uscg_license_url?: string | null
          user_id: string
          verification_fee_paid?: boolean
          verification_fee_paid_at?: string | null
          verification_fee_session_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          base_location?: string | null
          bio?: string | null
          cancellation_rate?: number | null
          checkr_candidate_id?: string | null
          checkr_completed_at?: string | null
          checkr_report_id?: string | null
          checkr_status?: string | null
          closest_airports?: string | null
          created_at?: string
          display_name?: string
          first_aid_cert_url?: string | null
          first_aid_expiry?: string | null
          gear_details?: string | null
          gear_included?: boolean
          guide_license_expiry?: string | null
          guide_license_url?: string | null
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
          live_at?: string | null
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
          suspension_type?: string | null
          techniques?: string[] | null
          trips_completed?: number | null
          updated_at?: string
          uscg_license_expiry?: string | null
          uscg_license_url?: string | null
          user_id?: string
          verification_fee_paid?: boolean
          verification_fee_paid_at?: string | null
          verification_fee_session_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
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
          {
            foreignKeyName: "guide_profiles_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_trip_proposal_invitees: {
        Row: {
          angler_id: string
          created_at: string
          id: string
          proposal_id: string
          responded_at: string | null
          status: string
        }
        Insert: {
          angler_id: string
          created_at?: string
          id?: string
          proposal_id: string
          responded_at?: string | null
          status?: string
        }
        Update: {
          angler_id?: string
          created_at?: string
          id?: string
          proposal_id?: string
          responded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_trip_proposal_invitees_angler_id_fkey"
            columns: ["angler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_trip_proposal_invitees_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "guide_trip_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_trip_proposals: {
        Row: {
          club_id: string
          created_at: string
          duration_hours: number
          expires_at: string | null
          guide_fee_per_angler: number
          guide_id: string
          id: string
          max_anglers: number
          notes: string | null
          property_id: string
          proposed_date: string
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          club_id: string
          created_at?: string
          duration_hours: number
          expires_at?: string | null
          guide_fee_per_angler: number
          guide_id: string
          id?: string
          max_anglers?: number
          notes?: string | null
          property_id: string
          proposed_date: string
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          duration_hours?: number
          expires_at?: string | null
          guide_fee_per_angler?: number
          guide_id?: string
          id?: string
          max_anglers?: number
          notes?: string | null
          property_id?: string
          proposed_date?: string
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_trip_proposals_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_trip_proposals_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "guide_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_trip_proposals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_verification_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          guide_id: string
          id: string
          metadata: Json
          new_status: string | null
          old_status: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          guide_id: string
          id?: string
          metadata?: Json
          new_status?: string | null
          old_status?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          guide_id?: string
          id?: string
          metadata?: Json
          new_status?: string | null
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_verification_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_verification_events_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "guide_profiles"
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
      hospitable_connections: {
        Row: {
          connection_status: string | null
          created_at: string
          hospitable_access_token: string | null
          hospitable_connected_at: string | null
          hospitable_refresh_token: string | null
          hospitable_token_expires_at: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_status?: string | null
          created_at?: string
          hospitable_access_token?: string | null
          hospitable_connected_at?: string | null
          hospitable_refresh_token?: string | null
          hospitable_token_expires_at?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_status?: string | null
          created_at?: string
          hospitable_access_token?: string | null
          hospitable_connected_at?: string | null
          hospitable_refresh_token?: string | null
          hospitable_token_expires_at?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      impersonation_sessions: {
        Row: {
          admin_email: string
          admin_id: string
          ended_at: string | null
          id: string
          is_active: boolean
          session_token: string
          started_at: string
          target_role: string
          target_user_email: string
          target_user_id: string
          target_user_name: string | null
        }
        Insert: {
          admin_email: string
          admin_id: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          session_token: string
          started_at?: string
          target_role: string
          target_user_email: string
          target_user_id: string
          target_user_name?: string | null
        }
        Update: {
          admin_email?: string
          admin_id?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          session_token?: string
          started_at?: string
          target_role?: string
          target_user_email?: string
          target_user_id?: string
          target_user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "impersonation_sessions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impersonation_sessions_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      landowner_calendar_tokens: {
        Row: {
          created_at: string
          id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          token?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "landowner_calendar_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          converted_at: string | null
          converted_to_user_id: string | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          interest_type: string
          last_name: string | null
          message: string | null
          role_response: string | null
          source: string | null
          state: string | null
          type: string
        }
        Insert: {
          converted_at?: string | null
          converted_to_user_id?: string | null
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          interest_type: string
          last_name?: string | null
          message?: string | null
          role_response?: string | null
          source?: string | null
          state?: string | null
          type?: string
        }
        Update: {
          converted_at?: string | null
          converted_to_user_id?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          interest_type?: string
          last_name?: string | null
          message?: string | null
          role_response?: string | null
          source?: string | null
          state?: string | null
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
          email_marketing: boolean
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
          email_marketing?: boolean
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
          email_marketing?: boolean
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
      permissions: {
        Row: {
          category: string
          description: string | null
          id: string
          scope_type: string
        }
        Insert: {
          category: string
          description?: string | null
          id: string
          scope_type: string
        }
        Update: {
          category?: string
          description?: string | null
          id?: string
          scope_type?: string
        }
        Relationships: []
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
      platform_staff: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          revoked_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          revoked_at?: string | null
          role: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          revoked_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_staff_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
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
          phone: string | null
          phone_number: string | null
          role: string
          roles: string[] | null
          sms_consent: boolean
          sms_consent_at: string | null
          sms_consent_ip: string | null
          sms_consent_revoked_at: string | null
          sms_consent_text: string | null
          sms_opt_in: boolean
          stripe_connect_account_id: string | null
          stripe_connect_onboarded: boolean
          stripe_customer_id: string | null
          suspended_at: string | null
          suspended_reason: string | null
          timezone: string | null
          updated_at: string | null
          welcome_email_step: number
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
          phone?: string | null
          phone_number?: string | null
          role?: string
          roles?: string[] | null
          sms_consent?: boolean
          sms_consent_at?: string | null
          sms_consent_ip?: string | null
          sms_consent_revoked_at?: string | null
          sms_consent_text?: string | null
          sms_opt_in?: boolean
          stripe_connect_account_id?: string | null
          stripe_connect_onboarded?: boolean
          stripe_customer_id?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          timezone?: string | null
          updated_at?: string | null
          welcome_email_step?: number
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
          phone?: string | null
          phone_number?: string | null
          role?: string
          roles?: string[] | null
          sms_consent?: boolean
          sms_consent_at?: string | null
          sms_consent_ip?: string | null
          sms_consent_revoked_at?: string | null
          sms_consent_text?: string | null
          sms_opt_in?: boolean
          stripe_connect_account_id?: string | null
          stripe_connect_onboarded?: boolean
          stripe_customer_id?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          timezone?: string | null
          updated_at?: string | null
          welcome_email_step?: number
        }
        Relationships: []
      }
      properties: {
        Row: {
          access_notes: string | null
          advance_booking_days: number | null
          coordinates: string | null
          created_at: string | null
          created_by_club_id: string | null
          description: string | null
          gate_code: string | null
          gate_code_required: boolean | null
          half_day_allowed: boolean | null
          id: string
          knowledge_completeness: number | null
          latitude: number | null
          location_description: string | null
          lodging_available: boolean
          lodging_url: string | null
          longitude: number | null
          max_bookings_per_member_per_month: number | null
          max_guests: number | null
          max_rods: number | null
          name: string
          owner_id: string | null
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
          advance_booking_days?: number | null
          coordinates?: string | null
          created_at?: string | null
          created_by_club_id?: string | null
          description?: string | null
          gate_code?: string | null
          gate_code_required?: boolean | null
          half_day_allowed?: boolean | null
          id?: string
          knowledge_completeness?: number | null
          latitude?: number | null
          location_description?: string | null
          lodging_available?: boolean
          lodging_url?: string | null
          longitude?: number | null
          max_bookings_per_member_per_month?: number | null
          max_guests?: number | null
          max_rods?: number | null
          name: string
          owner_id?: string | null
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
          advance_booking_days?: number | null
          coordinates?: string | null
          created_at?: string | null
          created_by_club_id?: string | null
          description?: string | null
          gate_code?: string | null
          gate_code_required?: boolean | null
          half_day_allowed?: boolean | null
          id?: string
          knowledge_completeness?: number | null
          latitude?: number | null
          location_description?: string | null
          lodging_available?: boolean
          lodging_url?: string | null
          longitude?: number | null
          max_bookings_per_member_per_month?: number | null
          max_guests?: number | null
          max_rods?: number | null
          name?: string
          owner_id?: string | null
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
            foreignKeyName: "properties_created_by_club_id_fkey"
            columns: ["created_by_club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_availability: {
        Row: {
          booking_id: string | null
          created_at: string
          created_by: string | null
          date: string
          id: string
          property_id: string
          reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          created_by?: string | null
          date: string
          id?: string
          property_id: string
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          property_id?: string
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_availability_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_availability_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_claim_invitations: {
        Row: {
          claimed_at: string | null
          claimed_by: string | null
          club_id: string
          created_at: string
          id: string
          landowner_email: string
          last_reminded_at: string | null
          property_id: string
          reminder_count: number
          status: string
          token: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          club_id: string
          created_at?: string
          id?: string
          landowner_email: string
          last_reminded_at?: string | null
          property_id: string
          reminder_count?: number
          status?: string
          token?: string
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          club_id?: string
          created_at?: string
          id?: string
          landowner_email?: string
          last_reminded_at?: string | null
          property_id?: string
          reminder_count?: number
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_claim_invitations_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_claim_invitations_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_claim_invitations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_knowledge: {
        Row: {
          access_and_logistics: Json | null
          amenities: Json | null
          completeness_score: number
          created_at: string
          equipment_recommendations: Json | null
          experience_profile: Json | null
          flow_and_gauge: Json | null
          hatches_and_patterns: Json | null
          id: string
          pressure_and_crowding: Json | null
          property_id: string
          regulations_and_rules: Json | null
          safety_and_hazards: Json | null
          seasonal_conditions: Json | null
          species_detail: Json | null
          updated_at: string
          water_characteristics: Json | null
        }
        Insert: {
          access_and_logistics?: Json | null
          amenities?: Json | null
          completeness_score?: number
          created_at?: string
          equipment_recommendations?: Json | null
          experience_profile?: Json | null
          flow_and_gauge?: Json | null
          hatches_and_patterns?: Json | null
          id?: string
          pressure_and_crowding?: Json | null
          property_id: string
          regulations_and_rules?: Json | null
          safety_and_hazards?: Json | null
          seasonal_conditions?: Json | null
          species_detail?: Json | null
          updated_at?: string
          water_characteristics?: Json | null
        }
        Update: {
          access_and_logistics?: Json | null
          amenities?: Json | null
          completeness_score?: number
          created_at?: string
          equipment_recommendations?: Json | null
          experience_profile?: Json | null
          flow_and_gauge?: Json | null
          hatches_and_patterns?: Json | null
          id?: string
          pressure_and_crowding?: Json | null
          property_id?: string
          regulations_and_rules?: Json | null
          safety_and_hazards?: Json | null
          seasonal_conditions?: Json | null
          species_detail?: Json | null
          updated_at?: string
          water_characteristics?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "property_knowledge_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_lodging: {
        Row: {
          amenities: Json
          bathrooms: number | null
          bedrooms: number | null
          checkin_time: string | null
          checkout_time: string | null
          created_at: string
          external_listing_url: string | null
          hospitable_last_synced_at: string | null
          hospitable_listing_url: string | null
          hospitable_property_uuid: string | null
          hospitable_sync_status: string | null
          id: string
          is_active: boolean
          lodging_description: string | null
          lodging_name: string | null
          lodging_type: string | null
          lodging_type_other: string | null
          min_nights: number
          nightly_rate_max: number | null
          nightly_rate_min: number | null
          pet_policy: string
          property_id: string
          sleeps: number | null
          updated_at: string
        }
        Insert: {
          amenities?: Json
          bathrooms?: number | null
          bedrooms?: number | null
          checkin_time?: string | null
          checkout_time?: string | null
          created_at?: string
          external_listing_url?: string | null
          hospitable_last_synced_at?: string | null
          hospitable_listing_url?: string | null
          hospitable_property_uuid?: string | null
          hospitable_sync_status?: string | null
          id?: string
          is_active?: boolean
          lodging_description?: string | null
          lodging_name?: string | null
          lodging_type?: string | null
          lodging_type_other?: string | null
          min_nights?: number
          nightly_rate_max?: number | null
          nightly_rate_min?: number | null
          pet_policy?: string
          property_id: string
          sleeps?: number | null
          updated_at?: string
        }
        Update: {
          amenities?: Json
          bathrooms?: number | null
          bedrooms?: number | null
          checkin_time?: string | null
          checkout_time?: string | null
          created_at?: string
          external_listing_url?: string | null
          hospitable_last_synced_at?: string | null
          hospitable_listing_url?: string | null
          hospitable_property_uuid?: string | null
          hospitable_sync_status?: string | null
          id?: string
          is_active?: boolean
          lodging_description?: string | null
          lodging_name?: string | null
          lodging_type?: string | null
          lodging_type_other?: string | null
          min_nights?: number
          nightly_rate_max?: number | null
          nightly_rate_min?: number | null
          pet_policy?: string
          property_id?: string
          sleeps?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_lodging_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_credits: {
        Row: {
          amount: number
          club_id: string
          created_at: string
          earned_at: string | null
          id: string
          paid_out_at: string | null
          referred_membership_id: string
          referrer_membership_id: string
          status: string
          stripe_transfer_id: string | null
          updated_at: string
          voided_at: string | null
        }
        Insert: {
          amount: number
          club_id: string
          created_at?: string
          earned_at?: string | null
          id?: string
          paid_out_at?: string | null
          referred_membership_id: string
          referrer_membership_id: string
          status?: string
          stripe_transfer_id?: string | null
          updated_at?: string
          voided_at?: string | null
        }
        Update: {
          amount?: number
          club_id?: string
          created_at?: string
          earned_at?: string | null
          id?: string
          paid_out_at?: string | null
          referred_membership_id?: string
          referrer_membership_id?: string
          status?: string
          stripe_transfer_id?: string | null
          updated_at?: string
          voided_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_credits_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_credits_referred_membership_id_fkey"
            columns: ["referred_membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_credits_referrer_membership_id_fkey"
            columns: ["referrer_membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      review_category_ratings: {
        Row: {
          category_key: string
          id: string
          rating_value: number
          review_id: string
        }
        Insert: {
          category_key: string
          id?: string
          rating_value: number
          review_id: string
        }
        Update: {
          category_key?: string
          id?: string
          rating_value?: number
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_category_ratings_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "trip_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_flags: {
        Row: {
          acknowledged_at: string | null
          flag_notes: string | null
          flag_reason: string
          flagged_at: string
          flagged_by_role: string
          flagged_by_user_id: string | null
          id: string
          resolution: string | null
          resolved_at: string | null
          resolved_by_user_id: string | null
          review_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          flag_notes?: string | null
          flag_reason: string
          flagged_at?: string
          flagged_by_role: string
          flagged_by_user_id?: string | null
          id?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          review_id: string
        }
        Update: {
          acknowledged_at?: string | null
          flag_notes?: string | null
          flag_reason?: string
          flagged_at?: string
          flagged_by_role?: string
          flagged_by_user_id?: string | null
          id?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_flags_flagged_by_user_id_fkey"
            columns: ["flagged_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_flags_resolved_by_user_id_fkey"
            columns: ["resolved_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_flags_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "trip_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_prompt_log: {
        Row: {
          angler_id: string
          booking_id: string
          channel: string
          created_at: string
          error_message: string | null
          id: string
          prompt_type: string
          property_id: string
          sent_at: string
          status: string
        }
        Insert: {
          angler_id: string
          booking_id: string
          channel: string
          created_at?: string
          error_message?: string | null
          id?: string
          prompt_type: string
          property_id: string
          sent_at?: string
          status?: string
        }
        Update: {
          angler_id?: string
          booking_id?: string
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          prompt_type?: string
          property_id?: string
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_prompt_log_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_prompt_log_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      review_responses: {
        Row: {
          id: string
          published_at: string
          responder_role: string
          responder_user_id: string
          response_text: string
          review_id: string
          status: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          published_at?: string
          responder_role: string
          responder_user_id: string
          response_text: string
          review_id: string
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          published_at?: string
          responder_role?: string
          responder_user_id?: string
          response_text?: string
          review_id?: string
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_responses_responder_user_id_fkey"
            columns: ["responder_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_responses_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: true
            referencedRelation: "trip_reviews"
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
      role_permissions: {
        Row: {
          id: string
          permission: string
          role: string
          scope_type: string
        }
        Insert: {
          id?: string
          permission: string
          role: string
          scope_type: string
        }
        Update: {
          id?: string
          permission?: string
          role?: string
          scope_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_fkey"
            columns: ["permission"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      segments: {
        Row: {
          cached_at: string | null
          cached_count: number | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          include_leads: boolean
          is_dynamic: boolean
          name: string
          rules: Json
          updated_at: string
        }
        Insert: {
          cached_at?: string | null
          cached_count?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          include_leads?: boolean
          is_dynamic?: boolean
          name: string
          rules?: Json
          updated_at?: string
        }
        Update: {
          cached_at?: string | null
          cached_count?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          include_leads?: boolean
          is_dynamic?: boolean
          name?: string
          rules?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "segments_created_by_fkey"
            columns: ["created_by"]
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
      staff_notes: {
        Row: {
          body: string
          club_id: string
          created_at: string
          created_by: string
          entity_id: string
          entity_type: string
          id: string
          updated_at: string
        }
        Insert: {
          body: string
          club_id: string
          created_at?: string
          created_by: string
          entity_id: string
          entity_type: string
          id?: string
          updated_at?: string
        }
        Update: {
          body?: string
          club_id?: string
          created_at?: string
          created_by?: string
          entity_id?: string
          entity_type?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_notes_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_webhook_events: {
        Row: {
          data: Json | null
          id: string
          processed_at: string
          type: string
        }
        Insert: {
          data?: Json | null
          id: string
          processed_at?: string
          type: string
        }
        Update: {
          data?: Json | null
          id?: string
          processed_at?: string
          type?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_notes: string | null
          assigned_to: string | null
          category: string
          created_at: string
          id: string
          message: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          assigned_to?: string | null
          category: string
          created_at?: string
          id?: string
          message: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          assigned_to?: string | null
          category?: string
          created_at?: string
          id?: string
          message?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_reviews: {
        Row: {
          angler_user_id: string
          booking_id: string
          created_at: string
          extension_expires_at: string | null
          extension_requested: boolean
          host_response_published_at: string | null
          host_response_text: string | null
          id: string
          is_anonymous: boolean
          moderation_reason: string | null
          moderation_resolved_at: string | null
          overall_rating: number
          private_feedback_text: string | null
          property_id: string
          published_at: string | null
          review_text: string
          review_window_expires_at: string
          status: string
          submitted_at: string | null
          trip_completed: boolean
          updated_at: string
          would_fish_again: boolean
        }
        Insert: {
          angler_user_id: string
          booking_id: string
          created_at?: string
          extension_expires_at?: string | null
          extension_requested?: boolean
          host_response_published_at?: string | null
          host_response_text?: string | null
          id?: string
          is_anonymous?: boolean
          moderation_reason?: string | null
          moderation_resolved_at?: string | null
          overall_rating: number
          private_feedback_text?: string | null
          property_id: string
          published_at?: string | null
          review_text: string
          review_window_expires_at: string
          status?: string
          submitted_at?: string | null
          trip_completed: boolean
          updated_at?: string
          would_fish_again: boolean
        }
        Update: {
          angler_user_id?: string
          booking_id?: string
          created_at?: string
          extension_expires_at?: string | null
          extension_requested?: boolean
          host_response_published_at?: string | null
          host_response_text?: string | null
          id?: string
          is_anonymous?: boolean
          moderation_reason?: string | null
          moderation_resolved_at?: string | null
          overall_rating?: number
          private_feedback_text?: string | null
          property_id?: string
          published_at?: string | null
          review_text?: string
          review_window_expires_at?: string
          status?: string
          submitted_at?: string | null
          trip_completed?: boolean
          updated_at?: string
          would_fish_again?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "trip_reviews_angler_user_id_fkey"
            columns: ["angler_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      property_availability_public: {
        Row: {
          booking_id: string | null
          created_at: string | null
          date: string | null
          id: string | null
          property_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          date?: string | null
          id?: string | null
          property_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          date?: string | null
          id?: string | null
          property_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_availability_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_availability_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_review_stats: {
        Row: {
          avg_rating: number | null
          latest_review_at: string | null
          property_id: string | null
          review_count: number | null
          would_fish_again_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_compass_credits: {
        Args: { p_amount: number; p_user_id: string }
        Returns: number
      }
      calculate_cancellation_score: {
        Args: { p_user_id: string }
        Returns: number
      }
      cross_club_agreement_limit: {
        Args: { p_club_id: string }
        Returns: number
      }
      decrement_compass_credits: {
        Args: { p_user_id: string }
        Returns: number
      }
      evaluate_segment_query: {
        Args: { query_params?: string; query_sql: string }
        Returns: Json
      }
      get_corporate_invitation_by_token: {
        Args: { p_token: string }
        Returns: {
          accepted_at: string
          club_id: string
          corporate_member_id: string
          email: string
          id: string
          invited_at: string
          status: string
        }[]
      }
      increment_compass_usage: {
        Args: { p_period: string; p_user_id: string }
        Returns: number
      }
      is_club_admin: { Args: { p_club_id: string }; Returns: boolean }
      is_club_member: { Args: { p_club_id: string }; Returns: boolean }
      is_club_staff: { Args: { p_club_id: string }; Returns: boolean }
      is_cross_club_eligible: { Args: { p_club_id: string }; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
