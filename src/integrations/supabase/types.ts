export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cargo_types: {
        Row: {
          created_at: string
          default_volume: number | null
          default_weight: number | null
          description: string | null
          fragile: boolean | null
          hazardous: boolean | null
          id: string
          name: string
          temperature_controlled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_volume?: number | null
          default_weight?: number | null
          description?: string | null
          fragile?: boolean | null
          hazardous?: boolean | null
          id?: string
          name: string
          temperature_controlled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_volume?: number | null
          default_weight?: number | null
          description?: string | null
          fragile?: boolean | null
          hazardous?: boolean | null
          id?: string
          name?: string
          temperature_controlled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          contractor_id: string
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          position: string | null
          updated_at: string
        }
        Insert: {
          contractor_id: string
          created_at?: string
          email: string
          id?: string
          name: string
          phone: string
          position?: string | null
          updated_at?: string
        }
        Update: {
          contractor_id?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          position?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      contractors: {
        Row: {
          address: string
          company_name: string
          created_at: string
          id: string
          inn: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          company_name: string
          created_at?: string
          id?: string
          inn: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          company_name?: string
          created_at?: string
          id?: string
          inn?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      document_templates: {
        Row: {
          created_at: string
          description: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          id: string
          is_required: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          id?: string
          is_required?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          id?: string
          is_required?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      drivers: {
        Row: {
          created_at: string
          experience_years: number | null
          id: string
          license: string | null
          name: string
          notes: string | null
          passport_data: string | null
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          experience_years?: number | null
          id?: string
          license?: string | null
          name: string
          notes?: string | null
          passport_data?: string | null
          phone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          experience_years?: number | null
          id?: string
          license?: string | null
          name?: string
          notes?: string | null
          passport_data?: string | null
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string | null
          id: string
          platform: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission?: Database["public"]["Enums"]["app_permission"]
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      routes: {
        Row: {
          created_at: string
          distance_km: number | null
          estimated_duration_hours: number | null
          id: string
          name: string
          notes: string | null
          point_a: string
          point_b: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          distance_km?: number | null
          estimated_duration_hours?: number | null
          id?: string
          name: string
          notes?: string | null
          point_a: string
          point_b: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          distance_km?: number | null
          estimated_duration_hours?: number | null
          id?: string
          name?: string
          notes?: string | null
          point_a?: string
          point_b?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trip_documents: {
        Row: {
          created_at: string
          description: string | null
          document_name: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_path: string | null
          file_size: number | null
          file_url: string | null
          id: string
          is_required: boolean | null
          mime_type: string | null
          trip_id: string
          updated_at: string
          upload_date: string
          uploaded_by: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_name: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_path?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_required?: boolean | null
          mime_type?: string | null
          trip_id: string
          updated_at?: string
          upload_date?: string
          uploaded_by: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_name?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          file_path?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_required?: boolean | null
          mime_type?: string | null
          trip_id?: string
          updated_at?: string
          upload_date?: string
          uploaded_by?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_trip_documents_trip_id"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_expenses: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          expense_date: string
          expense_type: string
          id: string
          receipt_url: string | null
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          expense_date?: string
          expense_type: string
          id?: string
          receipt_url?: string | null
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          expense_date?: string
          expense_type?: string
          id?: string
          receipt_url?: string | null
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          arrival_date: string | null
          cargo_description: string
          cargo_type_id: string | null
          cargo_value: number | null
          cargo_volume: number
          cargo_weight: number
          comments: string | null
          contractor_id: string
          created_at: string
          departure_date: string
          documents: Json | null
          driver_id: string | null
          driver_license: string | null
          driver_name: string
          driver_phone: string
          id: string
          point_a: string
          point_b: string
          route_id: string | null
          status: string
          updated_at: string
          user_id: string
          vehicle_brand: string
          vehicle_capacity: number | null
          vehicle_id: string | null
          vehicle_license_plate: string
          vehicle_model: string
        }
        Insert: {
          arrival_date?: string | null
          cargo_description: string
          cargo_type_id?: string | null
          cargo_value?: number | null
          cargo_volume: number
          cargo_weight: number
          comments?: string | null
          contractor_id: string
          created_at?: string
          departure_date: string
          documents?: Json | null
          driver_id?: string | null
          driver_license?: string | null
          driver_name: string
          driver_phone: string
          id?: string
          point_a: string
          point_b: string
          route_id?: string | null
          status: string
          updated_at?: string
          user_id: string
          vehicle_brand: string
          vehicle_capacity?: number | null
          vehicle_id?: string | null
          vehicle_license_plate: string
          vehicle_model: string
        }
        Update: {
          arrival_date?: string | null
          cargo_description?: string
          cargo_type_id?: string | null
          cargo_value?: number | null
          cargo_volume?: number
          cargo_weight?: number
          comments?: string | null
          contractor_id?: string
          created_at?: string
          departure_date?: string
          documents?: Json | null
          driver_id?: string | null
          driver_license?: string | null
          driver_name?: string
          driver_phone?: string
          id?: string
          point_a?: string
          point_b?: string
          route_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          vehicle_brand?: string
          vehicle_capacity?: number | null
          vehicle_id?: string | null
          vehicle_license_plate?: string
          vehicle_model?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_cargo_type_id_fkey"
            columns: ["cargo_type_id"]
            isOneToOne: false
            referencedRelation: "cargo_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          brand: string
          capacity: number | null
          created_at: string
          id: string
          insurance_expiry: string | null
          insurance_policy: string | null
          license_plate: string
          model: string
          notes: string | null
          registration_certificate: string | null
          technical_inspection_expiry: string | null
          updated_at: string
          user_id: string
          vin: string | null
          year: number | null
        }
        Insert: {
          brand: string
          capacity?: number | null
          created_at?: string
          id?: string
          insurance_expiry?: string | null
          insurance_policy?: string | null
          license_plate: string
          model: string
          notes?: string | null
          registration_certificate?: string | null
          technical_inspection_expiry?: string | null
          updated_at?: string
          user_id: string
          vin?: string | null
          year?: number | null
        }
        Update: {
          brand?: string
          capacity?: number | null
          created_at?: string
          id?: string
          insurance_expiry?: string | null
          insurance_policy?: string | null
          license_plate?: string
          model?: string
          notes?: string | null
          registration_certificate?: string | null
          technical_inspection_expiry?: string | null
          updated_at?: string
          user_id?: string
          vin?: string | null
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_expenses_for_trips: {
        Args: { trip_ids: string[] }
        Returns: Json
      }
      get_required_documents_for_trip: {
        Args: { trip_uuid: string }
        Returns: {
          template_id: string
          template_name: string
          document_type: Database["public"]["Enums"]["document_type"]
          is_uploaded: boolean
        }[]
      }
      get_trip_total_expenses: {
        Args: { trip_uuid: string }
        Returns: number
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_permission: {
        Args: {
          _user_id: string
          _permission: Database["public"]["Enums"]["app_permission"]
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_permission:
        | "view_trips"
        | "edit_trips"
        | "view_contractors"
        | "edit_contractors"
        | "view_drivers"
        | "edit_drivers"
        | "view_vehicles"
        | "edit_vehicles"
        | "view_routes"
        | "edit_routes"
        | "view_cargo_types"
        | "edit_cargo_types"
        | "view_reports"
        | "view_admin_panel"
        | "view_finances"
        | "view_statistics"
        | "manage_users"
      app_role: "admin" | "dispatcher" | "driver"
      document_type:
        | "act"
        | "invoice"
        | "receipt"
        | "contract"
        | "transport_waybill"
        | "customs_declaration"
        | "insurance"
        | "certificate"
        | "permit"
        | "other"
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
      app_permission: [
        "view_trips",
        "edit_trips",
        "view_contractors",
        "edit_contractors",
        "view_drivers",
        "edit_drivers",
        "view_vehicles",
        "edit_vehicles",
        "view_routes",
        "edit_routes",
        "view_cargo_types",
        "edit_cargo_types",
        "view_reports",
        "view_admin_panel",
        "view_finances",
        "view_statistics",
        "manage_users",
      ],
      app_role: ["admin", "dispatcher", "driver"],
      document_type: [
        "act",
        "invoice",
        "receipt",
        "contract",
        "transport_waybill",
        "customs_declaration",
        "insurance",
        "certificate",
        "permit",
        "other",
      ],
    },
  },
} as const
