import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

export type Database = {
  public: {
    Tables: {
      land_scene_objects: {
        Row: {
          id: string;
          property_id: string;
          zone_key: string;
          title: string;
          object_type: string;
          phase: string;
          transform: unknown;
          material: string;
          status: string;
          cost_range: string | null;
          revenue_role: string | null;
          summary: string;
          steps: string[];
          ai_prompts: string[];
          public_visible: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      projects: {
        Row: {
          id: string;
          property_id: string;
          title: string;
          zone_key: string;
          phase: string;
          priority: string;
          status: string;
          next_step: string | null;
          estimated_cost: number;
          actual_cost: number;
          projected_annual_revenue: number;
          created_at: string;
          updated_at: string;
        };
      };
      scenario_versions: {
        Row: {
          id: string;
          property_id: string;
          title: string;
          state: "draft" | "active" | "archived";
          prompt: string;
          change_summary: string;
          estimated_impact: string | null;
          scene_patch: unknown;
          created_by: string | null;
          created_at: string;
        };
      };
      financial_transactions: {
        Row: {
          id: string;
          property_id: string;
          project_id: string | null;
          contractor_id: string | null;
          direction: "investment" | "expense" | "revenue" | "transfer";
          category: string;
          title: string;
          amount: number;
          transaction_date: string;
          payment_method: string | null;
          paid_to: string | null;
          paid_by: string | null;
          invoice_number: string | null;
          receipt_path: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      contractors: {
        Row: {
          id: string;
          property_id: string;
          name: string;
          trade: string;
          phone: string | null;
          email: string | null;
          company: string | null;
          notes: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      contractor_payments: {
        Row: {
          id: string;
          property_id: string;
          project_id: string | null;
          contractor_id: string;
          transaction_id: string | null;
          title: string;
          amount: number;
          due_date: string | null;
          paid_date: string | null;
          status: "planned" | "due" | "paid" | "cancelled";
          scope_notes: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      project_milestones: {
        Row: {
          id: string;
          property_id: string;
          project_id: string | null;
          contractor_id: string | null;
          title: string;
          milestone_date: string | null;
          status: string;
          budget_amount: number;
          actual_amount: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
};
