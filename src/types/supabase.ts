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
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          property_id: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          property_id?: string;
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
