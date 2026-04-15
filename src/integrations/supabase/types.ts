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
      employees: {
        Row: {
          branch: string | null
          cpf: string | null
          created_at: string
          created_by: string | null
          department: string | null
          email: string
          full_name: string
          hire_date: string | null
          id: string
          linked_user_id: string | null
          notes: string | null
          phone: string | null
          position: string | null
          status: string
          updated_at: string
        }
        Insert: {
          branch?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          email?: string
          full_name?: string
          hire_date?: string | null
          id?: string
          linked_user_id?: string | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          branch?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          email?: string
          full_name?: string
          hire_date?: string | null
          id?: string
          linked_user_id?: string | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          asset_tag: string | null
          assigned_to: string | null
          brand: string
          created_at: string
          created_by: string | null
          id: string
          location_branch: string
          location_department: string
          location_room: string
          model: string
          notes: string | null
          serial_number: string | null
          status: Database["public"]["Enums"]["equipment_status"]
          type: Database["public"]["Enums"]["equipment_type"]
          updated_at: string
        }
        Insert: {
          asset_tag?: string | null
          assigned_to?: string | null
          brand?: string
          created_at?: string
          created_by?: string | null
          id?: string
          location_branch?: string
          location_department?: string
          location_room?: string
          model?: string
          notes?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          type: Database["public"]["Enums"]["equipment_type"]
          updated_at?: string
        }
        Update: {
          asset_tag?: string | null
          assigned_to?: string | null
          brand?: string
          created_at?: string
          created_by?: string | null
          id?: string
          location_branch?: string
          location_department?: string
          location_room?: string
          model?: string
          notes?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          type?: Database["public"]["Enums"]["equipment_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_movements: {
        Row: {
          created_at: string
          equipment_id: string
          from_location: string | null
          from_person: string | null
          id: string
          moved_by: string | null
          notes: string | null
          to_location: string | null
          to_person: string | null
        }
        Insert: {
          created_at?: string
          equipment_id: string
          from_location?: string | null
          from_person?: string | null
          id?: string
          moved_by?: string | null
          notes?: string | null
          to_location?: string | null
          to_person?: string | null
        }
        Update: {
          created_at?: string
          equipment_id?: string
          from_location?: string | null
          from_person?: string | null
          id?: string
          moved_by?: string | null
          notes?: string | null
          to_location?: string | null
          to_person?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_movements_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_movements_from_person_fkey"
            columns: ["from_person"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_movements_to_person_fkey"
            columns: ["to_person"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string
          email: string
          full_name: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string
          email?: string
          full_name?: string
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string
          email?: string
          full_name?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "funcionario" | "administrador" | "visitante"
      equipment_status: "active" | "maintenance" | "inactive"
      equipment_type: "notebook" | "monitor" | "router" | "camera" | "printer"
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
      app_role: ["funcionario", "administrador", "visitante"],
      equipment_status: ["active", "maintenance", "inactive"],
      equipment_type: ["notebook", "monitor", "router", "camera", "printer"],
    },
  },
} as const
