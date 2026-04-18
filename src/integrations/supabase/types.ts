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
      component_suggestions: {
        Row: {
          component_name: string
          created_at: string
          top_failures: string[]
          top_issues: string[]
        }
        Insert: {
          component_name: string
          created_at?: string
          top_failures?: string[]
          top_issues?: string[]
        }
        Update: {
          component_name?: string
          created_at?: string
          top_failures?: string[]
          top_issues?: string[]
        }
        Relationships: []
      }
      defect_entries: {
        Row: {
          child_code: string | null
          component: string | null
          condition: string | null
          created_at: string
          date: string
          description_auto: string | null
          failure_mode: string | null
          id: string
          issue_type: string | null
          location: string | null
          model: string | null
          parent_code: string | null
          related_component: string | null
          shop: string | null
          source: string | null
          sub_system: string | null
          sub_zone: string | null
          symptom: string | null
          system: string | null
          vin: string | null
          zone: string | null
        }
        Insert: {
          child_code?: string | null
          component?: string | null
          condition?: string | null
          created_at?: string
          date?: string
          description_auto?: string | null
          failure_mode?: string | null
          id?: string
          issue_type?: string | null
          location?: string | null
          model?: string | null
          parent_code?: string | null
          related_component?: string | null
          shop?: string | null
          source?: string | null
          sub_system?: string | null
          sub_zone?: string | null
          symptom?: string | null
          system?: string | null
          vin?: string | null
          zone?: string | null
        }
        Update: {
          child_code?: string | null
          component?: string | null
          condition?: string | null
          created_at?: string
          date?: string
          description_auto?: string | null
          failure_mode?: string | null
          id?: string
          issue_type?: string | null
          location?: string | null
          model?: string | null
          parent_code?: string | null
          related_component?: string | null
          shop?: string | null
          source?: string | null
          sub_system?: string | null
          sub_zone?: string | null
          symptom?: string | null
          system?: string | null
          vin?: string | null
          zone?: string | null
        }
        Relationships: []
      }
      masters: {
        Row: {
          code: string
          created_at: string
          id: string
          kind: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          kind: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          kind?: string
          name?: string
        }
        Relationships: []
      }
      related_components: {
        Row: {
          component_name: string
          created_at: string
          id: string
          related_code: string
          related_name: string
          system_name: string
        }
        Insert: {
          component_name: string
          created_at?: string
          id?: string
          related_code?: string
          related_name: string
          system_name: string
        }
        Update: {
          component_name?: string
          created_at?: string
          id?: string
          related_code?: string
          related_name?: string
          system_name?: string
        }
        Relationships: []
      }
      system_components: {
        Row: {
          component_code: string
          component_name: string
          created_at: string
          id: string
          system_name: string
        }
        Insert: {
          component_code: string
          component_name: string
          created_at?: string
          id?: string
          system_name: string
        }
        Update: {
          component_code?: string
          component_name?: string
          created_at?: string
          id?: string
          system_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
