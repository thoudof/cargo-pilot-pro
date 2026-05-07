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
    PostgrestVersion: "14.5"
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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_telegram_subscriptions: {
        Row: {
          created_at: string
          event_types: string[]
          id: string
          is_active: boolean
          telegram_chat_id: string | null
          telegram_username: string | null
          updated_at: string
          user_id: string
          verification_code: string | null
          verification_expires_at: string | null
        }
        Insert: {
          created_at?: string
          event_types?: string[]
          id?: string
          is_active?: boolean
          telegram_chat_id?: string | null
          telegram_username?: string | null
          updated_at?: string
          user_id: string
          verification_code?: string | null
          verification_expires_at?: string | null
        }
        Update: {
          created_at?: string
          event_types?: string[]
          id?: string
          is_active?: boolean
          telegram_chat_id?: string | null
          telegram_username?: string | null
          updated_at?: string
          user_id?: string
          verification_code?: string | null
          verification_expires_at?: string | null
        }
        Relationships: []
      }
      cargo_types: {
        Row: {
          company_id: string | null
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
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
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
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
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
          user_id?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          inn: string | null
          is_active: boolean
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          inn?: string | null
          is_active?: boolean
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          inn?: string | null
          is_active?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_default: boolean
          role: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_default?: boolean
          role?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_default?: boolean
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
          company_id: string | null
          company_name: string
          created_at: string
          id: string
          inn: string
          notes: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address: string
          company_id?: string | null
          company_name: string
          created_at?: string
          id?: string
          inn: string
          notes?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string
          company_id?: string | null
          company_name?: string
          created_at?: string
          id?: string
          inn?: string
          notes?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      document_templates: {
        Row: {
          company_id: string | null
          content: string | null
          created_at: string
          created_by: string | null
          description: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          id: string
          is_active: boolean
          is_required: boolean | null
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          id?: string
          is_active?: boolean
          is_required?: boolean | null
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          id?: string
          is_active?: boolean
          is_required?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string | null
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
        Relationships: []
      }
      drivers: {
        Row: {
          company_id: string | null
          created_at: string
          experience_years: number | null
          id: string
          license: string | null
          name: string
          notes: string | null
          passport_data: string | null
          phone: string
          telegram_chat_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          experience_years?: number | null
          id?: string
          license?: string | null
          name: string
          notes?: string | null
          passport_data?: string | null
          phone: string
          telegram_chat_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          experience_years?: number | null
          id?: string
          license?: string | null
          name?: string
          notes?: string | null
          passport_data?: string | null
          phone?: string
          telegram_chat_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          read: boolean
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          read?: boolean
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          read?: boolean
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
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          role: string | null
          telegram_chat_id: string | null
          telegram_link_code: string | null
          telegram_link_code_expires_at: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string | null
          telegram_chat_id?: string | null
          telegram_link_code?: string | null
          telegram_link_code_expires_at?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          telegram_chat_id?: string | null
          telegram_link_code?: string | null
          telegram_link_code_expires_at?: string | null
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
          company_id: string | null
          created_at: string
          distance_km: number | null
          estimated_duration_hours: number | null
          id: string
          name: string
          notes: string | null
          point_a: string
          point_b: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          distance_km?: number | null
          estimated_duration_hours?: number | null
          id?: string
          name: string
          notes?: string | null
          point_a: string
          point_b: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          distance_km?: number | null
          estimated_duration_hours?: number | null
          id?: string
          name?: string
          notes?: string | null
          point_a?: string
          point_b?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      trip_documents: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          document_name: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string | null
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
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          document_name: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_name?: string | null
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
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          document_name?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          file_name?: string | null
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
          user_id?: string | null
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
          category: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          date: string | null
          description: string | null
          expense_date: string | null
          expense_type: string | null
          id: string
          receipt_url: string | null
          trip_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string | null
          description?: string | null
          expense_date?: string | null
          expense_type?: string | null
          id?: string
          receipt_url?: string | null
          trip_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string | null
          description?: string | null
          expense_date?: string | null
          expense_type?: string | null
          id?: string
          receipt_url?: string | null
          trip_id?: string
          updated_at?: string
          user_id?: string | null
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
          created_at: string
          driver_id: string | null
          heading: number | null
          id: string
          latitude: number
          longitude: number
          recorded_at: string
          speed: number | null
          trip_id: string
        }
        Insert: {
          accuracy?: number | null
          created_at?: string
          driver_id?: string | null
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          recorded_at?: string
          speed?: number | null
          trip_id: string
        }
        Update: {
          accuracy?: number | null
          created_at?: string
          driver_id?: string | null
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          recorded_at?: string
          speed?: number | null
          trip_id?: string
        }
        Relationships: []
      }
      trip_templates: {
        Row: {
          cargo_description: string | null
          cargo_type_id: string | null
          cargo_value: number | null
          cargo_volume: number | null
          cargo_weight: number | null
          company_id: string | null
          contractor_id: string | null
          created_at: string
          created_by: string
          description: string | null
          driver_id: string | null
          id: string
          is_favorite: boolean
          name: string
          point_a: string | null
          point_b: string | null
          route_id: string | null
          updated_at: string
          usage_count: number
          vehicle_id: string | null
        }
        Insert: {
          cargo_description?: string | null
          cargo_type_id?: string | null
          cargo_value?: number | null
          cargo_volume?: number | null
          cargo_weight?: number | null
          company_id?: string | null
          contractor_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          driver_id?: string | null
          id?: string
          is_favorite?: boolean
          name: string
          point_a?: string | null
          point_b?: string | null
          route_id?: string | null
          updated_at?: string
          usage_count?: number
          vehicle_id?: string | null
        }
        Update: {
          cargo_description?: string | null
          cargo_type_id?: string | null
          cargo_value?: number | null
          cargo_volume?: number | null
          cargo_weight?: number | null
          company_id?: string | null
          contractor_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          driver_id?: string | null
          id?: string
          is_favorite?: boolean
          name?: string
          point_a?: string | null
          point_b?: string | null
          route_id?: string | null
          updated_at?: string
          usage_count?: number
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
          cargo_description: string
          cargo_type_id: string | null
          cargo_value: number | null
          cargo_volume: number
          cargo_weight: number
          comments: string | null
          company_id: string | null
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
          user_id: string | null
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
          company_id?: string | null
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
          user_id?: string | null
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
          company_id?: string | null
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
          user_id?: string | null
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
      user_dashboard_settings: {
        Row: {
          created_at: string
          hidden_widgets: string[]
          id: string
          updated_at: string
          user_id: string
          widget_layout: Json
        }
        Insert: {
          created_at?: string
          hidden_widgets?: string[]
          id?: string
          updated_at?: string
          user_id: string
          widget_layout?: Json
        }
        Update: {
          created_at?: string
          hidden_widgets?: string[]
          id?: string
          updated_at?: string
          user_id?: string
          widget_layout?: Json
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          permission: Database["public"]["Enums"]["app_permission"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission: Database["public"]["Enums"]["app_permission"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
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
          company_id: string | null
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
          user_id: string | null
          vin: string | null
          year: number | null
        }
        Insert: {
          brand: string
          capacity?: number | null
          company_id?: string | null
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
          user_id?: string | null
          vin?: string | null
          year?: number | null
        }
        Update: {
          brand?: string
          capacity?: number | null
          company_id?: string | null
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
          user_id?: string | null
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
      get_current_company_id: { Args: never; Returns: string }
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
      is_company_member: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_global_admin: { Args: { _user_id: string }; Returns: boolean }
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
      app_role: "admin" | "dispatcher" | "driver" | "global_admin"
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
        | "power_of_attorney"
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
      ],
      app_role: ["admin", "dispatcher", "driver", "global_admin"],
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
        "power_of_attorney",
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
