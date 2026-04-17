export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string;
          address: string;
          plan_number: string;
          total_lots: number;
          manager_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          address: string;
          plan_number: string;
          total_lots: number;
          manager_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          address?: string;
          plan_number?: string;
          total_lots?: number;
          manager_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "properties_manager_id_fkey";
            columns: ["manager_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      lots: {
        Row: {
          id: string;
          property_id: string;
          lot_number: string;
          liability_share: number;
          owner_id: string | null;
        };
        Insert: {
          id?: string;
          property_id: string;
          lot_number: string;
          liability_share: number;
          owner_id?: string | null;
        };
        Update: {
          id?: string;
          property_id?: string;
          lot_number?: string;
          liability_share?: number;
          owner_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lots_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      join_requests: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          unit_number: string | null;
          applicant_email: string | null;
          occupancy_status: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          property_id: string;
          unit_number?: string | null;
          applicant_email?: string | null;
          occupancy_status?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          property_id?: string;
          unit_number?: string | null;
          applicant_email?: string | null;
          occupancy_status?: string | null;
          status?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "join_requests_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "join_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          mobile_number: string | null;
          home_address: string | null;
          unit_number: string | null;
          occupancy_status: string | null;
          email: string | null;
          full_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name?: string | null;
          last_name?: string | null;
          mobile_number?: string | null;
          home_address?: string | null;
          unit_number?: string | null;
          occupancy_status?: string | null;
          email?: string | null;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string | null;
          last_name?: string | null;
          mobile_number?: string | null;
          home_address?: string | null;
          unit_number?: string | null;
          occupancy_status?: string | null;
          email?: string | null;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          id: string;
          title: string;
          category: string;
          uploaded_at: string;
          file_path: string;
          property_id: string;
        };
        Insert: {
          id?: string;
          title: string;
          category: string;
          uploaded_at?: string;
          file_path: string;
          property_id: string;
        };
        Update: {
          id?: string;
          title?: string;
          category?: string;
          uploaded_at?: string;
          file_path?: string;
          property_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      motions: {
        Row: {
          id: string;
          property_id: string;
          created_by: string;
          title: string;
          resolution: string;
          closing_date: string;
          other_points: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          created_by: string;
          title: string;
          resolution: string;
          closing_date: string;
          other_points?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          created_by?: string;
          title?: string;
          resolution?: string;
          closing_date?: string;
          other_points?: string | null;
          status?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "motions_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "motions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      agm_notices: {
        Row: {
          id: string;
          property_id: string;
          created_by: string;
          meeting_at: string;
          location: string;
          agenda_items: string;
          manager_report: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          created_by: string;
          meeting_at: string;
          location: string;
          agenda_items: string;
          manager_report?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          created_by?: string;
          meeting_at?: string;
          location?: string;
          agenda_items?: string;
          manager_report?: string | null;
          status?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agm_notices_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agm_notices_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
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
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
