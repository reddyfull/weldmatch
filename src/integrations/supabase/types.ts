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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          cover_message: string | null
          created_at: string | null
          employer_notes: string | null
          id: string
          job_id: string
          match_score: number | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["application_status"] | null
          updated_at: string | null
          welder_id: string
        }
        Insert: {
          cover_message?: string | null
          created_at?: string | null
          employer_notes?: string | null
          id?: string
          job_id: string
          match_score?: number | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          updated_at?: string | null
          welder_id: string
        }
        Update: {
          cover_message?: string | null
          created_at?: string | null
          employer_notes?: string | null
          id?: string
          job_id?: string
          match_score?: number | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          updated_at?: string | null
          welder_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_welder_id_fkey"
            columns: ["welder_id"]
            isOneToOne: false
            referencedRelation: "welder_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      career_coach_results: {
        Row: {
          certifications_snapshot: string[] | null
          checked_actions: string[] | null
          created_at: string
          id: string
          profile_snapshot: Json | null
          result_data: Json
          updated_at: string
          welder_id: string
        }
        Insert: {
          certifications_snapshot?: string[] | null
          checked_actions?: string[] | null
          created_at?: string
          id?: string
          profile_snapshot?: Json | null
          result_data: Json
          updated_at?: string
          welder_id: string
        }
        Update: {
          certifications_snapshot?: string[] | null
          checked_actions?: string[] | null
          created_at?: string
          id?: string
          profile_snapshot?: Json | null
          result_data?: Json
          updated_at?: string
          welder_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_coach_results_welder_id_fkey"
            columns: ["welder_id"]
            isOneToOne: true
            referencedRelation: "welder_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          ai_extracted_data: Json | null
          cert_name: string | null
          cert_number: string | null
          cert_type: string
          created_at: string | null
          document_url: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuing_body: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at: string | null
          verified_by: string | null
          welder_id: string
        }
        Insert: {
          ai_extracted_data?: Json | null
          cert_name?: string | null
          cert_number?: string | null
          cert_type: string
          created_at?: string | null
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_body?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
          welder_id: string
        }
        Update: {
          ai_extracted_data?: Json | null
          cert_name?: string | null
          cert_number?: string | null
          cert_type?: string
          created_at?: string | null
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_body?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          verified_by?: string | null
          welder_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certifications_welder_id_fkey"
            columns: ["welder_id"]
            isOneToOne: false
            referencedRelation: "welder_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employer_profiles: {
        Row: {
          address_line1: string | null
          city: string | null
          company_name: string
          company_size: Database["public"]["Enums"]["company_size"] | null
          created_at: string | null
          description: string | null
          id: string
          industry: string | null
          lat: number | null
          lng: number | null
          logo_url: string | null
          phone: string | null
          state: string | null
          stripe_customer_id: string | null
          subscription_plan:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          trial_ends_at: string | null
          updated_at: string | null
          user_id: string
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address_line1?: string | null
          city?: string | null
          company_name: string
          company_size?: Database["public"]["Enums"]["company_size"] | null
          created_at?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          phone?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address_line1?: string | null
          city?: string | null
          company_name?: string
          company_size?: Database["public"]["Enums"]["company_size"] | null
          created_at?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          phone?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employer_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      external_jobs: {
        Row: {
          apply_is_direct: boolean | null
          apply_link: string
          city: string | null
          company: string
          company_logo: string | null
          country: string | null
          created_at: string | null
          description: string | null
          description_snippet: string | null
          employment_type: string | null
          expires_at: string | null
          external_id: string
          fetched_at: string | null
          id: string
          is_active: boolean | null
          is_remote: boolean | null
          location: string | null
          posted_at: string | null
          required_education: string | null
          required_experience_months: number | null
          required_skills: string[] | null
          salary_display: string | null
          salary_max: number | null
          salary_min: number | null
          salary_period: string | null
          search_query: string | null
          source: string | null
          source_link: string | null
          state: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          apply_is_direct?: boolean | null
          apply_link: string
          city?: string | null
          company: string
          company_logo?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          description_snippet?: string | null
          employment_type?: string | null
          expires_at?: string | null
          external_id: string
          fetched_at?: string | null
          id?: string
          is_active?: boolean | null
          is_remote?: boolean | null
          location?: string | null
          posted_at?: string | null
          required_education?: string | null
          required_experience_months?: number | null
          required_skills?: string[] | null
          salary_display?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_period?: string | null
          search_query?: string | null
          source?: string | null
          source_link?: string | null
          state?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          apply_is_direct?: boolean | null
          apply_link?: string
          city?: string | null
          company?: string
          company_logo?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          description_snippet?: string | null
          employment_type?: string | null
          expires_at?: string | null
          external_id?: string
          fetched_at?: string | null
          id?: string
          is_active?: boolean | null
          is_remote?: boolean | null
          location?: string | null
          posted_at?: string | null
          required_education?: string | null
          required_experience_months?: number | null
          required_skills?: string[] | null
          salary_display?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_period?: string | null
          search_query?: string | null
          source?: string | null
          source_link?: string | null
          state?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      job_aggregator_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          jobs_added: number | null
          jobs_fetched: number | null
          jobs_skipped: number | null
          jobs_updated: number | null
          location: string | null
          run_type: string
          search_query: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          jobs_added?: number | null
          jobs_fetched?: number | null
          jobs_skipped?: number | null
          jobs_updated?: number | null
          location?: string | null
          run_type: string
          search_query?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          jobs_added?: number | null
          jobs_fetched?: number | null
          jobs_skipped?: number | null
          jobs_updated?: number | null
          location?: string | null
          run_type?: string
          search_query?: string | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          applications_count: number | null
          benefits: string[] | null
          city: string | null
          created_at: string | null
          description: string | null
          employer_id: string
          experience_min: number | null
          expires_at: string | null
          id: string
          job_type: Database["public"]["Enums"]["job_type"]
          lat: number | null
          lng: number | null
          pay_max: number | null
          pay_min: number | null
          pay_type: Database["public"]["Enums"]["pay_type"] | null
          required_certs: string[] | null
          required_positions: string[] | null
          required_processes: string[] | null
          start_date: string | null
          state: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          title: string
          updated_at: string | null
          views_count: number | null
          zip_code: string | null
        }
        Insert: {
          applications_count?: number | null
          benefits?: string[] | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          employer_id: string
          experience_min?: number | null
          expires_at?: string | null
          id?: string
          job_type?: Database["public"]["Enums"]["job_type"]
          lat?: number | null
          lng?: number | null
          pay_max?: number | null
          pay_min?: number | null
          pay_type?: Database["public"]["Enums"]["pay_type"] | null
          required_certs?: string[] | null
          required_positions?: string[] | null
          required_processes?: string[] | null
          start_date?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          title: string
          updated_at?: string | null
          views_count?: number | null
          zip_code?: string | null
        }
        Update: {
          applications_count?: number | null
          benefits?: string[] | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          employer_id?: string
          experience_min?: number | null
          expires_at?: string | null
          id?: string
          job_type?: Database["public"]["Enums"]["job_type"]
          lat?: number | null
          lng?: number | null
          pay_max?: number | null
          pay_min?: number | null
          pay_type?: Database["public"]["Enums"]["pay_type"] | null
          required_certs?: string[] | null
          required_positions?: string[] | null
          required_processes?: string[] | null
          start_date?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_strength_results: {
        Row: {
          certifications_snapshot: string[] | null
          created_at: string
          id: string
          profile_snapshot: Json | null
          result_data: Json
          updated_at: string
          welder_id: string
        }
        Insert: {
          certifications_snapshot?: string[] | null
          created_at?: string
          id?: string
          profile_snapshot?: Json | null
          result_data: Json
          updated_at?: string
          welder_id: string
        }
        Update: {
          certifications_snapshot?: string[] | null
          created_at?: string
          id?: string
          profile_snapshot?: Json | null
          result_data?: Json
          updated_at?: string
          welder_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_strength_results_welder_id_fkey"
            columns: ["welder_id"]
            isOneToOne: true
            referencedRelation: "welder_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      welder_job_interactions: {
        Row: {
          clicked_apply_at: string | null
          created_at: string | null
          external_job_id: string
          first_viewed_at: string | null
          id: string
          marked_applied_at: string | null
          match_reason: string | null
          match_score: number | null
          missing_skills: string[] | null
          notes: string | null
          saved_at: string | null
          status: string | null
          status_updated_at: string | null
          updated_at: string | null
          welder_id: string
        }
        Insert: {
          clicked_apply_at?: string | null
          created_at?: string | null
          external_job_id: string
          first_viewed_at?: string | null
          id?: string
          marked_applied_at?: string | null
          match_reason?: string | null
          match_score?: number | null
          missing_skills?: string[] | null
          notes?: string | null
          saved_at?: string | null
          status?: string | null
          status_updated_at?: string | null
          updated_at?: string | null
          welder_id: string
        }
        Update: {
          clicked_apply_at?: string | null
          created_at?: string | null
          external_job_id?: string
          first_viewed_at?: string | null
          id?: string
          marked_applied_at?: string | null
          match_reason?: string | null
          match_score?: number | null
          missing_skills?: string[] | null
          notes?: string | null
          saved_at?: string | null
          status?: string | null
          status_updated_at?: string | null
          updated_at?: string | null
          welder_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "welder_job_interactions_external_job_id_fkey"
            columns: ["external_job_id"]
            isOneToOne: false
            referencedRelation: "external_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "welder_job_interactions_welder_id_fkey"
            columns: ["welder_id"]
            isOneToOne: false
            referencedRelation: "welder_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      welder_profiles: {
        Row: {
          bio: string | null
          city: string | null
          created_at: string | null
          desired_salary_max: number | null
          desired_salary_min: number | null
          id: string
          is_available: boolean | null
          lat: number | null
          lng: number | null
          profile_completion: number | null
          salary_type: Database["public"]["Enums"]["salary_type"] | null
          state: string | null
          updated_at: string | null
          user_id: string
          weld_positions: string[] | null
          weld_processes: string[] | null
          willing_to_travel: boolean | null
          years_experience: number | null
          zip_code: string | null
        }
        Insert: {
          bio?: string | null
          city?: string | null
          created_at?: string | null
          desired_salary_max?: number | null
          desired_salary_min?: number | null
          id?: string
          is_available?: boolean | null
          lat?: number | null
          lng?: number | null
          profile_completion?: number | null
          salary_type?: Database["public"]["Enums"]["salary_type"] | null
          state?: string | null
          updated_at?: string | null
          user_id: string
          weld_positions?: string[] | null
          weld_processes?: string[] | null
          willing_to_travel?: boolean | null
          years_experience?: number | null
          zip_code?: string | null
        }
        Update: {
          bio?: string | null
          city?: string | null
          created_at?: string | null
          desired_salary_max?: number | null
          desired_salary_min?: number | null
          id?: string
          is_available?: boolean | null
          lat?: number | null
          lng?: number | null
          profile_completion?: number | null
          salary_type?: Database["public"]["Enums"]["salary_type"] | null
          state?: string | null
          updated_at?: string | null
          user_id?: string
          weld_positions?: string[] | null
          weld_processes?: string[] | null
          willing_to_travel?: boolean | null
          years_experience?: number | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "welder_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_samples: {
        Row: {
          created_at: string | null
          description: string | null
          file_type: string | null
          file_url: string
          id: string
          welder_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          welder_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          welder_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_samples_welder_id_fkey"
            columns: ["welder_id"]
            isOneToOne: false
            referencedRelation: "welder_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_profile_completion: {
        Args: { _welder_id: string }
        Returns: number
      }
      get_user_type: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_type"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      application_status:
        | "new"
        | "reviewing"
        | "interview"
        | "offer"
        | "hired"
        | "rejected"
      company_size: "1-10" | "11-50" | "51-200" | "200+"
      job_status: "draft" | "active" | "paused" | "filled" | "expired"
      job_type: "full_time" | "part_time" | "contract" | "per_diem"
      pay_type: "hourly" | "salary" | "doe"
      salary_type: "hourly" | "annual"
      subscription_plan: "free_trial" | "starter" | "pro" | "enterprise"
      subscription_status: "trial" | "active" | "past_due" | "cancelled"
      user_type: "welder" | "employer" | "admin"
      verification_status: "pending" | "verified" | "expired" | "invalid"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      application_status: [
        "new",
        "reviewing",
        "interview",
        "offer",
        "hired",
        "rejected",
      ],
      company_size: ["1-10", "11-50", "51-200", "200+"],
      job_status: ["draft", "active", "paused", "filled", "expired"],
      job_type: ["full_time", "part_time", "contract", "per_diem"],
      pay_type: ["hourly", "salary", "doe"],
      salary_type: ["hourly", "annual"],
      subscription_plan: ["free_trial", "starter", "pro", "enterprise"],
      subscription_status: ["trial", "active", "past_due", "cancelled"],
      user_type: ["welder", "employer", "admin"],
      verification_status: ["pending", "verified", "expired", "invalid"],
    },
  },
} as const
