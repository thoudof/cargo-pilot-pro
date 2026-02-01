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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_telegram_subscriptions: {
        Row: {
          created_at: string
          event_types: Database["public"]["Enums"]["notification_event_type"][]
          id: string
          is_active: boolean
          telegram_chat_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_types?: Database["public"]["Enums"]["notification_event_type"][]
          id?: string
          is_active?: boolean
          telegram_chat_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_types?: Database["public"]["Enums"]["notification_event_type"][]
          id?: string
          is_active?: boolean
          telegram_chat_id?: string
          updated_at?: string
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
        }
        Relationships: []
      }
      contacts: {
        Row: {
          contractor_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          position: string | null
        }
        Insert: {
          contractor_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          position?: string | null
        }
        Update: {
          contractor_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          position?: string | null
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
          address: string | null
          company_name: string
          created_at: string
          id: string
          inn: string | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_name: string
          created_at?: string
          id?: string
          inn?: string | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_name?: string
          created_at?: string
          id?: string
          inn?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      document_templates: {
        Row: {
          content: string | null
          created_at: string
          created_by: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      driver_users: {
        Row: {
          created_at: string
          driver_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_users_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
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
          phone: string | null
          telegram_chat_id: string | null
          telegram_link_code: string | null
          telegram_link_code_expires_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          experience_years?: number | null
          id?: string
          license?: string | null
          name: string
          notes?: string | null
          passport_data?: string | null
          phone?: string | null
          telegram_chat_id?: string | null
          telegram_link_code?: string | null
          telegram_link_code_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          experience_years?: number | null
          id?: string
          license?: string | null
          name?: string
          notes?: string | null
          passport_data?: string | null
          phone?: string | null
          telegram_chat_id?: string | null
          telegram_link_code?: string | null
          telegram_link_code_expires_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          telegram_link_code: string | null
          telegram_link_code_expires_at: string | null
          telegram_notifications_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          telegram_link_code?: string | null
          telegram_link_code_expires_at?: string | null
          telegram_notifications_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          telegram_link_code?: string | null
          telegram_link_code_expires_at?: string | null
          telegram_notifications_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string | null
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform?: string | null
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string | null
          token?: string
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
        }
        Relationships: []
      }
      trip_documents: {
        Row: {
          created_at: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_size: number | null
          file_url: string | null
          id: string
          trip_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_size?: number | null
          file_url?: string | null
          id?: string
          trip_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          file_name?: string
          file_size?: number | null
          file_url?: string | null
          id?: string
          trip_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_documents_trip_id_fkey"
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
          category: string
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          id: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          trip_id?: string
          updated_at?: string
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
      trip_locations: {
        Row: {
          accuracy: number | null
          altitude: number | null
          created_at: string
          driver_id: string | null
          heading: number | null
          id: string
          latitude: number
          longitude: number
          metadata: Json | null
          recorded_at: string
          speed: number | null
          trip_id: string
          user_id: string | null
        }
        Insert: {
          accuracy?: number | null
          altitude?: number | null
          created_at?: string
          driver_id?: string | null
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          metadata?: Json | null
          recorded_at?: string
          speed?: number | null
          trip_id: string
          user_id?: string | null
        }
        Update: {
          accuracy?: number | null
          altitude?: number | null
          created_at?: string
          driver_id?: string | null
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          metadata?: Json | null
          recorded_at?: string
          speed?: number | null
          trip_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_locations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_locations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_templates: {
        Row: {
          cargo_description: string | null
          cargo_type_id: string | null
          cargo_value: number | null
          cargo_volume: number | null
          cargo_weight: number | null
          contractor_id: string | null
          created_at: string
          created_by: string | null
          default_expenses: Json | null
          description: string | null
          driver_id: string | null
          id: string
          is_favorite: boolean | null
          name: string
          point_a: string | null
          point_b: string | null
          route_id: string | null
          updated_at: string
          usage_count: number | null
          vehicle_id: string | null
        }
        Insert: {
          cargo_description?: string | null
          cargo_type_id?: string | null
          cargo_value?: number | null
          cargo_volume?: number | null
          cargo_weight?: number | null
          contractor_id?: string | null
          created_at?: string
          created_by?: string | null
          default_expenses?: Json | null
          description?: string | null
          driver_id?: string | null
          id?: string
          is_favorite?: boolean | null
          name: string
          point_a?: string | null
          point_b?: string | null
          route_id?: string | null
          updated_at?: string
          usage_count?: number | null
          vehicle_id?: string | null
        }
        Update: {
          cargo_description?: string | null
          cargo_type_id?: string | null
          cargo_value?: number | null
          cargo_volume?: number | null
          cargo_weight?: number | null
          contractor_id?: string | null
          created_at?: string
          created_by?: string | null
          default_expenses?: Json | null
          description?: string | null
          driver_id?: string | null
          id?: string
          is_favorite?: boolean | null
          name?: string
          point_a?: string | null
          point_b?: string | null
          route_id?: string | null
          updated_at?: string
          usage_count?: number | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_templates_cargo_type_id_fkey"
            columns: ["cargo_type_id"]
            isOneToOne: false
            referencedRelation: "cargo_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_templates_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_templates_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_templates_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_templates_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          arrival_date: string | null
          cargo_description: string | null
          cargo_type_id: string | null
          cargo_value: number | null
          cargo_volume: number | null
          cargo_weight: number | null
          change_log: Json | null
          comments: string | null
          contractor_id: string | null
          created_at: string
          departure_date: string
          documents: string[] | null
          driver_id: string | null
          driver_license: string | null
          driver_name: string | null
          driver_phone: string | null
          id: string
          point_a: string
          point_b: string
          route_id: string | null
          status: string
          updated_at: string
          vehicle_brand: string | null
          vehicle_capacity: number | null
          vehicle_id: string | null
          vehicle_license_plate: string | null
          vehicle_model: string | null
        }
        Insert: {
          arrival_date?: string | null
          cargo_description?: string | null
          cargo_type_id?: string | null
          cargo_value?: number | null
          cargo_volume?: number | null
          cargo_weight?: number | null
          change_log?: Json | null
          comments?: string | null
          contractor_id?: string | null
          created_at?: string
          departure_date: string
          documents?: string[] | null
          driver_id?: string | null
          driver_license?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          point_a: string
          point_b: string
          route_id?: string | null
          status?: string
          updated_at?: string
          vehicle_brand?: string | null
          vehicle_capacity?: number | null
          vehicle_id?: string | null
          vehicle_license_plate?: string | null
          vehicle_model?: string | null
        }
        Update: {
          arrival_date?: string | null
          cargo_description?: string | null
          cargo_type_id?: string | null
          cargo_value?: number | null
          cargo_volume?: number | null
          cargo_weight?: number | null
          change_log?: Json | null
          comments?: string | null
          contractor_id?: string | null
          created_at?: string
          departure_date?: string
          documents?: string[] | null
          driver_id?: string | null
          driver_license?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          point_a?: string
          point_b?: string
          route_id?: string | null
          status?: string
          updated_at?: string
          vehicle_brand?: string | null
          vehicle_capacity?: number | null
          vehicle_id?: string | null
          vehicle_license_plate?: string | null
          vehicle_model?: string | null
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
      user_dashboard_settings: {
        Row: {
          created_at: string
          hidden_widgets: string[] | null
          id: string
          theme_settings: Json | null
          updated_at: string
          user_id: string
          widget_layout: Json | null
        }
        Insert: {
          created_at?: string
          hidden_widgets?: string[] | null
          id?: string
          theme_settings?: Json | null
          updated_at?: string
          user_id: string
          widget_layout?: Json | null
        }
        Update: {
          created_at?: string
          hidden_widgets?: string[] | null
          id?: string
          theme_settings?: Json | null
          updated_at?: string
          user_id?: string
          widget_layout?: Json | null
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          created_at: string
          id: string
          permission: Database["public"]["Enums"]["app_permission"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission: Database["public"]["Enums"]["app_permission"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission?: Database["public"]["Enums"]["app_permission"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
      get_driver_trips: { Args: { _user_id: string }; Returns: string[] }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_permission: {
        Args: {
          _permission: Database["public"]["Enums"]["app_permission"]
          _user_id: string
        }
        Returns: boolean
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
      app_permission:
        | "view_trips"
        | "edit_trips"
        | "delete_trips"
        | "view_contractors"
        | "edit_contractors"
        | "delete_contractors"
        | "view_drivers"
        | "edit_drivers"
        | "delete_drivers"
        | "view_vehicles"
        | "edit_vehicles"
        | "delete_vehicles"
        | "view_routes"
        | "edit_routes"
        | "delete_routes"
        | "view_cargo_types"
        | "edit_cargo_types"
        | "delete_cargo_types"
        | "view_reports"
        | "view_admin_panel"
        | "view_finances"
        | "view_statistics"
        | "manage_users"
        | "view_documents"
        | "edit_documents"
        | "delete_documents"
        | "view_expenses"
        | "edit_expenses"
        | "delete_expenses"
        | "manage_document_templates"
        | "manage_system"
        | "view_analytics"
        | "export_data"
        | "view_own_trips"
        | "update_trip_status"
        | "update_trip_location"
        | "view_own_expenses"
        | "add_own_expenses"
      app_role: "admin" | "dispatcher" | "driver"
      document_type:
        | "waybill"
        | "invoice"
        | "act"
        | "contract"
        | "power_of_attorney"
        | "other"
      notification_event_type:
        | "trip_created"
        | "trip_updated"
        | "trip_status_changed"
        | "trip_deleted"
        | "driver_created"
        | "driver_updated"
        | "driver_deleted"
        | "vehicle_created"
        | "vehicle_updated"
        | "vehicle_deleted"
        | "expense_created"
        | "document_uploaded"
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
        "delete_trips",
        "view_contractors",
        "edit_contractors",
        "delete_contractors",
        "view_drivers",
        "edit_drivers",
        "delete_drivers",
        "view_vehicles",
        "edit_vehicles",
        "delete_vehicles",
        "view_routes",
        "edit_routes",
        "delete_routes",
        "view_cargo_types",
        "edit_cargo_types",
        "delete_cargo_types",
        "view_reports",
        "view_admin_panel",
        "view_finances",
        "view_statistics",
        "manage_users",
        "view_documents",
        "edit_documents",
        "delete_documents",
        "view_expenses",
        "edit_expenses",
        "delete_expenses",
        "manage_document_templates",
        "manage_system",
        "view_analytics",
        "export_data",
        "view_own_trips",
        "update_trip_status",
        "update_trip_location",
        "view_own_expenses",
        "add_own_expenses",
      ],
      app_role: ["admin", "dispatcher", "driver"],
      document_type: [
        "waybill",
        "invoice",
        "act",
        "contract",
        "power_of_attorney",
        "other",
      ],
      notification_event_type: [
        "trip_created",
        "trip_updated",
        "trip_status_changed",
        "trip_deleted",
        "driver_created",
        "driver_updated",
        "driver_deleted",
        "vehicle_created",
        "vehicle_updated",
        "vehicle_deleted",
        "expense_created",
        "document_uploaded",
      ],
    },
  },
} as const
