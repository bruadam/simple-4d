/**
 * Database Type Definitions for Supabase
 *
 * Generated types for the database schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          task_id: string;
          name: string;
          start_date: string;
          end_date: string;
          duration: number;
          percent_complete: number;
          predecessors: string[] | null;
          resources: string[] | null;
          notes: string | null;
          outline_level: number;
          outline_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          task_id: string;
          name: string;
          start_date: string;
          end_date: string;
          duration: number;
          percent_complete?: number;
          predecessors?: string[] | null;
          resources?: string[] | null;
          notes?: string | null;
          outline_level?: number;
          outline_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          task_id?: string;
          name?: string;
          start_date?: string;
          end_date?: string;
          duration?: number;
          percent_complete?: number;
          predecessors?: string[] | null;
          resources?: string[] | null;
          notes?: string | null;
          outline_level?: number;
          outline_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ifc_models: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          version: number;
          file_url: string | null;
          file_hash: string | null;
          uploaded_at: string;
          is_current: boolean;
          user_id: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          version?: number;
          file_url?: string | null;
          file_hash?: string | null;
          uploaded_at?: string;
          is_current?: boolean;
          user_id: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          version?: number;
          file_url?: string | null;
          file_hash?: string | null;
          uploaded_at?: string;
          is_current?: boolean;
          user_id?: string;
        };
      };
      task_entity_links: {
        Row: {
          id: string;
          task_id: string;
          project_id: string;
          ifc_model_id: string;
          entity_global_id: string;
          entity_express_id: number;
          entity_type: string;
          entity_name: string | null;
          link_type: 'manual' | 'rule';
          created_at: string;
          created_by: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          project_id: string;
          ifc_model_id: string;
          entity_global_id: string;
          entity_express_id: number;
          entity_type: string;
          entity_name?: string | null;
          link_type?: 'manual' | 'rule';
          created_at?: string;
          created_by: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          project_id?: string;
          ifc_model_id?: string;
          entity_global_id?: string;
          entity_express_id?: number;
          entity_type?: string;
          entity_name?: string | null;
          link_type?: 'manual' | 'rule';
          created_at?: string;
          created_by?: string;
        };
      };
      link_rules: {
        Row: {
          id: string;
          project_id: string;
          task_id: string;
          rule_type: 'property_match' | 'name_pattern' | 'type_filter';
          rule_config: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          created_by: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          task_id: string;
          rule_type: 'property_match' | 'name_pattern' | 'type_filter';
          rule_config: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          task_id?: string;
          rule_type?: 'property_match' | 'name_pattern' | 'type_filter';
          rule_config?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
