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
      candidate_profile_views: {
        Row: {
          application_id: string | null
          employer_id: string
          id: string
          viewed_at: string
          welder_id: string
        }
        Insert: {
          application_id?: string | null
          employer_id: string
          id?: string
          viewed_at?: string
          welder_id: string
        }
        Update: {
          application_id?: string | null
          employer_id?: string
          id?: string
          viewed_at?: string
          welder_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_profile_views_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_profile_views_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_profile_views_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employer_profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_profile_views_welder_id_fkey"
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
          cert_number_encrypted: string | null
          cert_type: string
          created_at: string | null
          document_url: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuing_body: string | null
          license_number_encrypted: string | null
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
          cert_number_encrypted?: string | null
          cert_type: string
          created_at?: string | null
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_body?: string | null
          license_number_encrypted?: string | null
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
          cert_number_encrypted?: string | null
          cert_type?: string
          created_at?: string | null
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_body?: string | null
          license_number_encrypted?: string | null
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
          bank_account_encrypted: string | null
          bank_routing_encrypted: string | null
          billing_address_encrypted: string | null
          city: string | null
          company_name: string
          company_size: Database["public"]["Enums"]["company_size"] | null
          created_at: string | null
          description: string | null
          id: string
          industry: string | null
          insurance_policy_encrypted: string | null
          lat: number | null
          lng: number | null
          logo_url: string | null
          phone: string | null
          profile_setup_complete: boolean | null
          state: string | null
          stripe_customer_id: string | null
          subscription_plan:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          tax_id_encrypted: string | null
          trial_ends_at: string | null
          updated_at: string | null
          user_id: string
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address_line1?: string | null
          bank_account_encrypted?: string | null
          bank_routing_encrypted?: string | null
          billing_address_encrypted?: string | null
          city?: string | null
          company_name: string
          company_size?: Database["public"]["Enums"]["company_size"] | null
          created_at?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          insurance_policy_encrypted?: string | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          phone?: string | null
          profile_setup_complete?: boolean | null
          state?: string | null
          stripe_customer_id?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          tax_id_encrypted?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address_line1?: string | null
          bank_account_encrypted?: string | null
          bank_routing_encrypted?: string | null
          billing_address_encrypted?: string | null
          city?: string | null
          company_name?: string
          company_size?: Database["public"]["Enums"]["company_size"] | null
          created_at?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          insurance_policy_encrypted?: string | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          phone?: string | null
          profile_setup_complete?: boolean | null
          state?: string | null
          stripe_customer_id?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          tax_id_encrypted?: string | null
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
          match_reason: string | null
          match_score: number | null
          missing_skills: string[] | null
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
          match_reason?: string | null
          match_score?: number | null
          missing_skills?: string[] | null
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
          match_reason?: string | null
          match_score?: number | null
          missing_skills?: string[] | null
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
      generated_resumes: {
        Row: {
          ats_score: number | null
          created_at: string
          form_data: Json | null
          format_style: string | null
          id: string
          is_active: boolean | null
          resume_data: Json
          suggestions: string[] | null
          updated_at: string
          welder_id: string
        }
        Insert: {
          ats_score?: number | null
          created_at?: string
          form_data?: Json | null
          format_style?: string | null
          id?: string
          is_active?: boolean | null
          resume_data: Json
          suggestions?: string[] | null
          updated_at?: string
          welder_id: string
        }
        Update: {
          ats_score?: number | null
          created_at?: string
          form_data?: Json | null
          format_style?: string | null
          id?: string
          is_active?: boolean | null
          resume_data?: Json
          suggestions?: string[] | null
          updated_at?: string
          welder_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_resumes_welder_id_fkey"
            columns: ["welder_id"]
            isOneToOne: true
            referencedRelation: "welder_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      job_templates: {
        Row: {
          created_at: string
          description: string
          employer_id: string
          id: string
          job_title: string | null
          metadata: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          employer_id: string
          id?: string
          job_title?: string | null
          metadata?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          employer_id?: string
          id?: string
          job_title?: string | null
          metadata?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_templates_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_templates_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employer_profiles_public"
            referencedColumns: ["id"]
          },
        ]
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
          positions_needed: number
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
          positions_needed?: number
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
          positions_needed?: number
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
          {
            foreignKeyName: "jobs_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employer_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      market_intelligence_results: {
        Row: {
          created_at: string
          id: string
          profile_snapshot: Json | null
          request_context: Json | null
          result_data: Json
          updated_at: string
          welder_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_snapshot?: Json | null
          request_context?: Json | null
          result_data: Json
          updated_at?: string
          welder_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_snapshot?: Json | null
          request_context?: Json | null
          result_data?: Json
          updated_at?: string
          welder_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_intelligence_results_welder_id_fkey"
            columns: ["welder_id"]
            isOneToOne: true
            referencedRelation: "welder_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_access_logs: {
        Row: {
          access_type: string
          accessed_at: string | null
          id: string
          referrer: string | null
          viewer_ip: string | null
          viewer_user_agent: string | null
          welder_id: string
        }
        Insert: {
          access_type: string
          accessed_at?: string | null
          id?: string
          referrer?: string | null
          viewer_ip?: string | null
          viewer_user_agent?: string | null
          welder_id: string
        }
        Update: {
          access_type?: string
          accessed_at?: string | null
          id?: string
          referrer?: string | null
          viewer_ip?: string | null
          viewer_user_agent?: string | null
          welder_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_access_logs_welder_id_fkey"
            columns: ["welder_id"]
            isOneToOne: false
            referencedRelation: "welder_profiles"
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
      sensitive_data_audit_log: {
        Row: {
          action: string
          created_at: string | null
          field_name: string
          id: string
          ip_address: unknown
          metadata: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          field_name: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          field_name?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string
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
      welder_equipment: {
        Row: {
          brand: string | null
          created_at: string | null
          equipment_type: string
          id: string
          model: string | null
          owned: boolean | null
          proficiency: string | null
          welder_id: string
        }
        Insert: {
          brand?: string | null
          created_at?: string | null
          equipment_type: string
          id?: string
          model?: string | null
          owned?: boolean | null
          proficiency?: string | null
          welder_id: string
        }
        Update: {
          brand?: string | null
          created_at?: string | null
          equipment_type?: string
          id?: string
          model?: string | null
          owned?: boolean | null
          proficiency?: string | null
          welder_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "welder_equipment_welder_id_fkey"
            columns: ["welder_id"]
            isOneToOne: false
            referencedRelation: "welder_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      welder_portfolio_items: {
        Row: {
          created_at: string | null
          date_completed: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          project_type: string | null
          title: string
          updated_at: string | null
          video_url: string | null
          welder_id: string
        }
        Insert: {
          created_at?: string | null
          date_completed?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          project_type?: string | null
          title: string
          updated_at?: string | null
          video_url?: string | null
          welder_id: string
        }
        Update: {
          created_at?: string | null
          date_completed?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          project_type?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
          welder_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "welder_portfolio_items_welder_id_fkey"
            columns: ["welder_id"]
            isOneToOne: false
            referencedRelation: "welder_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      welder_profiles: {
        Row: {
          available_date: string | null
          background_check_encrypted: string | null
          bank_account_encrypted: string | null
          bank_routing_encrypted: string | null
          bio: string | null
          city: string | null
          cover_photo_url: string | null
          created_at: string | null
          desired_salary_max: number | null
          desired_salary_min: number | null
          dob_encrypted: string | null
          drivers_license_encrypted: string | null
          drug_test_encrypted: string | null
          emergency_phone_encrypted: string | null
          highlights: string[] | null
          home_address_encrypted: string | null
          id: string
          instagram_url: string | null
          is_available: boolean | null
          lat: number | null
          linkedin_url: string | null
          lng: number | null
          looking_for_work: boolean | null
          medical_info_encrypted: string | null
          minimum_hourly_rate: number | null
          open_to_opportunities: boolean | null
          passport_number_encrypted: string | null
          phone_personal_encrypted: string | null
          professional_title: string | null
          profile_completion: number | null
          profile_setup_complete: boolean | null
          profile_views: number | null
          profile_visibility: string | null
          rate_negotiable: boolean | null
          relocation_preferences: string[] | null
          salary_type: Database["public"]["Enums"]["salary_type"] | null
          show_email: boolean | null
          show_phone: boolean | null
          ssn_encrypted: string | null
          state: string | null
          tagline: string | null
          tax_id_encrypted: string | null
          travel_scope: string | null
          updated_at: string | null
          user_id: string
          username: string | null
          weld_positions: string[] | null
          weld_processes: string[] | null
          willing_to_relocate: boolean | null
          willing_to_travel: boolean | null
          work_types: string[] | null
          years_experience: number | null
          zip_code: string | null
        }
        Insert: {
          available_date?: string | null
          background_check_encrypted?: string | null
          bank_account_encrypted?: string | null
          bank_routing_encrypted?: string | null
          bio?: string | null
          city?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          desired_salary_max?: number | null
          desired_salary_min?: number | null
          dob_encrypted?: string | null
          drivers_license_encrypted?: string | null
          drug_test_encrypted?: string | null
          emergency_phone_encrypted?: string | null
          highlights?: string[] | null
          home_address_encrypted?: string | null
          id?: string
          instagram_url?: string | null
          is_available?: boolean | null
          lat?: number | null
          linkedin_url?: string | null
          lng?: number | null
          looking_for_work?: boolean | null
          medical_info_encrypted?: string | null
          minimum_hourly_rate?: number | null
          open_to_opportunities?: boolean | null
          passport_number_encrypted?: string | null
          phone_personal_encrypted?: string | null
          professional_title?: string | null
          profile_completion?: number | null
          profile_setup_complete?: boolean | null
          profile_views?: number | null
          profile_visibility?: string | null
          rate_negotiable?: boolean | null
          relocation_preferences?: string[] | null
          salary_type?: Database["public"]["Enums"]["salary_type"] | null
          show_email?: boolean | null
          show_phone?: boolean | null
          ssn_encrypted?: string | null
          state?: string | null
          tagline?: string | null
          tax_id_encrypted?: string | null
          travel_scope?: string | null
          updated_at?: string | null
          user_id: string
          username?: string | null
          weld_positions?: string[] | null
          weld_processes?: string[] | null
          willing_to_relocate?: boolean | null
          willing_to_travel?: boolean | null
          work_types?: string[] | null
          years_experience?: number | null
          zip_code?: string | null
        }
        Update: {
          available_date?: string | null
          background_check_encrypted?: string | null
          bank_account_encrypted?: string | null
          bank_routing_encrypted?: string | null
          bio?: string | null
          city?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          desired_salary_max?: number | null
          desired_salary_min?: number | null
          dob_encrypted?: string | null
          drivers_license_encrypted?: string | null
          drug_test_encrypted?: string | null
          emergency_phone_encrypted?: string | null
          highlights?: string[] | null
          home_address_encrypted?: string | null
          id?: string
          instagram_url?: string | null
          is_available?: boolean | null
          lat?: number | null
          linkedin_url?: string | null
          lng?: number | null
          looking_for_work?: boolean | null
          medical_info_encrypted?: string | null
          minimum_hourly_rate?: number | null
          open_to_opportunities?: boolean | null
          passport_number_encrypted?: string | null
          phone_personal_encrypted?: string | null
          professional_title?: string | null
          profile_completion?: number | null
          profile_setup_complete?: boolean | null
          profile_views?: number | null
          profile_visibility?: string | null
          rate_negotiable?: boolean | null
          relocation_preferences?: string[] | null
          salary_type?: Database["public"]["Enums"]["salary_type"] | null
          show_email?: boolean | null
          show_phone?: boolean | null
          ssn_encrypted?: string | null
          state?: string | null
          tagline?: string | null
          tax_id_encrypted?: string | null
          travel_scope?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
          weld_positions?: string[] | null
          weld_processes?: string[] | null
          willing_to_relocate?: boolean | null
          willing_to_travel?: boolean | null
          work_types?: string[] | null
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
      welder_work_experience: {
        Row: {
          company_name: string
          created_at: string | null
          description: string | null
          display_order: number | null
          end_date: string | null
          highlights: string[] | null
          id: string
          is_current: boolean | null
          job_title: string
          location: string | null
          start_date: string
          updated_at: string | null
          welder_id: string
        }
        Insert: {
          company_name: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          end_date?: string | null
          highlights?: string[] | null
          id?: string
          is_current?: boolean | null
          job_title: string
          location?: string | null
          start_date: string
          updated_at?: string | null
          welder_id: string
        }
        Update: {
          company_name?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          end_date?: string | null
          highlights?: string[] | null
          id?: string
          is_current?: boolean | null
          job_title?: string
          location?: string | null
          start_date?: string
          updated_at?: string | null
          welder_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "welder_work_experience_welder_id_fkey"
            columns: ["welder_id"]
            isOneToOne: false
            referencedRelation: "welder_profiles"
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
      employer_profiles_public: {
        Row: {
          city: string | null
          company_name: string | null
          company_size: Database["public"]["Enums"]["company_size"] | null
          description: string | null
          id: string | null
          industry: string | null
          logo_url: string | null
          state: string | null
          website: string | null
        }
        Insert: {
          city?: string | null
          company_name?: string | null
          company_size?: Database["public"]["Enums"]["company_size"] | null
          description?: string | null
          id?: string | null
          industry?: string | null
          logo_url?: string | null
          state?: string | null
          website?: string | null
        }
        Update: {
          city?: string | null
          company_name?: string | null
          company_size?: Database["public"]["Enums"]["company_size"] | null
          description?: string | null
          id?: string | null
          industry?: string | null
          logo_url?: string | null
          state?: string | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_profile_completion: {
        Args: { _welder_id: string }
        Returns: number
      }
      can_view_profile: { Args: { _profile_id: string }; Returns: boolean }
      check_username_available: { Args: { p_username: string }; Returns: Json }
      get_audit_log: {
        Args: {
          p_action?: string
          p_end_date?: string
          p_limit?: number
          p_record_id?: string
          p_start_date?: string
          p_table_name?: string
          p_user_id?: string
        }
        Returns: {
          action: string
          created_at: string
          field_name: string
          id: string
          metadata: Json
          record_id: string
          table_name: string
          user_agent: string
          user_id: string
        }[]
      }
      get_public_profile: {
        Args: { p_username: string }
        Returns: {
          is_public: boolean
          profile_data: Json
        }[]
      }
      get_user_type: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_type"]
      }
      get_users_with_email: {
        Args: never
        Returns: {
          email: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_sensitive_access: {
        Args: {
          p_action: string
          p_field_name: string
          p_metadata?: Json
          p_record_id?: string
          p_table_name: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: undefined
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
