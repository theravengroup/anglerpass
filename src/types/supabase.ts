/**
 * Supabase Database Types
 *
 * To generate accurate types from your Supabase schema, run:
 *
 *   npx supabase gen types typescript --local > src/types/supabase.ts
 *
 * Or for a remote project:
 *
 *   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
 *
 * This placeholder allows the project to compile before types are generated.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string;
          first_name: string;
          last_name: string | null;
          email: string;
          interest_type: string;
          type: string;
          message: string | null;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name?: string | null;
          email: string;
          interest_type: string;
          type?: string;
          message?: string | null;
          source?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string | null;
          email?: string;
          interest_type?: string;
          type?: string;
          message?: string | null;
          source?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      properties: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          location_description: string | null;
          coordinates: string | null;
          water_type: string | null;
          species: string[];
          regulations: string | null;
          photos: string[];
          capacity: number | null;
          rate_adult_full_day: number | null;
          rate_youth_full_day: number | null;
          rate_child_full_day: number | null;
          half_day_allowed: boolean;
          rate_adult_half_day: number | null;
          rate_youth_half_day: number | null;
          rate_child_half_day: number | null;
          water_miles: number | null;
          access_notes: string | null;
          gate_code_required: boolean;
          gate_code: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string | null;
          location_description?: string | null;
          coordinates?: string | null;
          water_type?: string | null;
          species?: string[];
          regulations?: string | null;
          photos?: string[];
          capacity?: number | null;
          rate_adult_full_day?: number | null;
          rate_youth_full_day?: number | null;
          rate_child_full_day?: number | null;
          half_day_allowed?: boolean;
          rate_adult_half_day?: number | null;
          rate_youth_half_day?: number | null;
          rate_child_half_day?: number | null;
          water_miles?: number | null;
          access_notes?: string | null;
          gate_code_required?: boolean;
          gate_code?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          description?: string | null;
          location_description?: string | null;
          coordinates?: string | null;
          water_type?: string | null;
          species?: string[];
          regulations?: string | null;
          photos?: string[];
          capacity?: number | null;
          rate_adult_full_day?: number | null;
          rate_youth_full_day?: number | null;
          rate_child_full_day?: number | null;
          half_day_allowed?: boolean;
          rate_adult_half_day?: number | null;
          rate_youth_half_day?: number | null;
          rate_child_half_day?: number | null;
          water_miles?: number | null;
          access_notes?: string | null;
          gate_code_required?: boolean;
          gate_code?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "properties_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_log: {
        Row: {
          id: number;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          old_data: Record<string, unknown> | null;
          new_data: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          old_data?: Record<string, unknown> | null;
          new_data?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          actor_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          old_data?: Record<string, unknown> | null;
          new_data?: Record<string, unknown> | null;
          created_at?: string;
        };
        Relationships: [];
      };
      club_invitations: {
        Row: {
          id: string;
          property_id: string;
          invited_by: string;
          club_name: string;
          admin_email: string;
          token: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          invited_by: string;
          club_name: string;
          admin_email: string;
          token?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          invited_by?: string;
          club_name?: string;
          admin_email?: string;
          token?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "club_invitations_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "club_invitations_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      moderation_notes: {
        Row: {
          id: number;
          property_id: string;
          admin_id: string;
          action: string;
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          property_id: string;
          admin_id: string;
          action: string;
          notes: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          property_id?: string;
          admin_id?: string;
          action?: string;
          notes?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "moderation_notes_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "moderation_notes_admin_id_fkey";
            columns: ["admin_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
