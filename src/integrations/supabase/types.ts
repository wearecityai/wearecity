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
      cities: {
        Row: {
          admin_user_id: string
          allow_geolocation: boolean | null
          allow_map_display: boolean | null
          assistant_name: string | null
          chat_id: string | null
          created_at: string | null
          current_language_code: string | null
          enable_google_search: boolean | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          name: string
          procedure_source_urls: Json | null
          profile_image_url: string | null
          recommended_prompts: Json | null
          restricted_city: Json | null
          sede_electronica_url: string | null
          service_tags: Json | null
          slug: string
          system_instruction: string | null
          updated_at: string | null
          uploaded_procedure_documents: Json | null
        }
        Insert: {
          admin_user_id: string
          allow_geolocation?: boolean | null
          allow_map_display?: boolean | null
          assistant_name?: string | null
          chat_id?: string | null
          created_at?: string | null
          current_language_code?: string | null
          enable_google_search?: boolean | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          name: string
          procedure_source_urls?: Json | null
          profile_image_url?: string | null
          recommended_prompts?: Json | null
          restricted_city?: Json | null
          sede_electronica_url?: string | null
          service_tags?: Json | null
          slug: string
          system_instruction?: string | null
          updated_at?: string | null
          uploaded_procedure_documents?: Json | null
        }
        Update: {
          admin_user_id?: string
          allow_geolocation?: boolean | null
          allow_map_display?: boolean | null
          assistant_name?: string | null
          chat_id?: string | null
          created_at?: string | null
          current_language_code?: string | null
          enable_google_search?: boolean | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          name?: string
          procedure_source_urls?: Json | null
          profile_image_url?: string | null
          recommended_prompts?: Json | null
          restricted_city?: Json | null
          sede_electronica_url?: string | null
          service_tags?: Json | null
          slug?: string
          system_instruction?: string | null
          updated_at?: string | null
          uploaded_procedure_documents?: Json | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          city_id: string | null
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          city_id?: string | null
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          city_id?: string | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_admin_chat: {
        Args: { chat_name_param?: string; is_public_param?: boolean }
        Returns: {
          id: string
          chat_slug: string
          chat_name: string
          is_public: boolean
        }[]
      }
      create_city_for_admin: {
        Args: { admin_user_id_param: string }
        Returns: {
          id: string
          name: string
          slug: string
          admin_user_id: string
        }[]
      }
      generate_admin_chat_slug: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_city_slug: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_provisional_city_name: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_unique_slug: {
        Args: { base_text: string }
        Returns: string
      }
      get_admin_chat_by_slug: {
        Args: { chat_slug_param: string }
        Returns: {
          id: string
          chat_name: string
          chat_slug: string
          is_public: boolean
          admin_user_id: string
          created_at: string
          updated_at: string
        }[]
      }
      get_admin_chats: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          chat_name: string
          chat_slug: string
          is_public: boolean
          created_at: string
          updated_at: string
        }[]
      }
      get_admin_city: {
        Args: { admin_user_id_param: string }
        Returns: {
          id: string
          name: string
          slug: string
          admin_user_id: string
          chat_id: string
          created_at: string
          updated_at: string
        }[]
      }
      get_admin_finetuning_config: {
        Args: { chat_id_param: string }
        Returns: {
          id: string
          config_name: string
          assistant_name: string
          system_instruction: string
          recommended_prompts: Json
          service_tags: Json
          enable_google_search: boolean
          allow_map_display: boolean
          allow_geolocation: boolean
          current_language_code: string
          procedure_source_urls: Json
          uploaded_procedure_documents: Json
          sede_electronica_url: string
          restricted_city: Json
        }[]
      }
      get_all_system_instructions: {
        Args: Record<PropertyKey, never>
        Returns: {
          instruction_key: string
          instruction_value: string
          description: string
        }[]
      }
      get_system_instruction: {
        Args: { instruction_key_param: string }
        Returns: string
      }
      search_scraped_content: {
        Args: {
          search_query: string
          user_id_param: string
          limit_param?: number
        }
        Returns: {
          id: string
          title: string
          content: string
          url: string
          website_name: string
          content_type: string
          rank: number
        }[]
      }
      update_admin_finetuning_config: {
        Args: { chat_id_param: string; config_data: Json }
        Returns: boolean
      }
      update_city_name_from_chat: {
        Args: { chat_id_param: string; new_chat_name: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "ciudadano" | "administrativo"
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
      user_role: ["ciudadano", "administrativo"],
    },
  },
} as const
