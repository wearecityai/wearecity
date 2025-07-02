export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      assistant_config: {
        Row: {
          allow_geolocation: boolean | null
          allow_map_display: boolean | null
          assistant_name: string | null
          base_system_instruction: string | null
          config_name: string
          created_at: string | null
          current_language_code: string | null
          enable_google_search: boolean | null
          id: string
          is_active: boolean | null
          procedure_source_urls: Json | null
          recommended_prompts: Json | null
          restricted_city: Json | null
          sede_electronica_url: string | null
          service_tags: Json | null
          system_instruction: string | null
          updated_at: string | null
          uploaded_procedure_documents: Json | null
          user_id: string
        }
        Insert: {
          allow_geolocation?: boolean | null
          allow_map_display?: boolean | null
          assistant_name?: string | null
          base_system_instruction?: string | null
          config_name?: string
          created_at?: string | null
          current_language_code?: string | null
          enable_google_search?: boolean | null
          id?: string
          is_active?: boolean | null
          procedure_source_urls?: Json | null
          recommended_prompts?: Json | null
          restricted_city?: Json | null
          sede_electronica_url?: string | null
          service_tags?: Json | null
          system_instruction?: string | null
          updated_at?: string | null
          uploaded_procedure_documents?: Json | null
          user_id: string
        }
        Update: {
          allow_geolocation?: boolean | null
          allow_map_display?: boolean | null
          assistant_name?: string | null
          base_system_instruction?: string | null
          config_name?: string
          created_at?: string | null
          current_language_code?: string | null
          enable_google_search?: boolean | null
          id?: string
          is_active?: boolean | null
          procedure_source_urls?: Json | null
          recommended_prompts?: Json | null
          restricted_city?: Json | null
          sede_electronica_url?: string | null
          service_tags?: Json | null
          system_instruction?: string | null
          updated_at?: string | null
          uploaded_procedure_documents?: Json | null
          user_id?: string
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
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
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
      scraped_documents: {
        Row: {
          created_at: string | null
          download_status: string | null
          extracted_text: string | null
          file_size: number | null
          file_type: string
          file_url: string
          filename: string
          id: string
          metadata: Json | null
          page_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          download_status?: string | null
          extracted_text?: string | null
          file_size?: number | null
          file_type: string
          file_url: string
          filename: string
          id?: string
          metadata?: Json | null
          page_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          download_status?: string | null
          extracted_text?: string | null
          file_size?: number | null
          file_type?: string
          file_url?: string
          filename?: string
          id?: string
          metadata?: Json | null
          page_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scraped_documents_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "scraped_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      scraped_pages: {
        Row: {
          content: string | null
          content_hash: string | null
          created_at: string | null
          id: string
          last_scraped_at: string | null
          page_type: string | null
          status_code: number | null
          title: string | null
          updated_at: string | null
          url: string
          website_id: string | null
        }
        Insert: {
          content?: string | null
          content_hash?: string | null
          created_at?: string | null
          id?: string
          last_scraped_at?: string | null
          page_type?: string | null
          status_code?: number | null
          title?: string | null
          updated_at?: string | null
          url: string
          website_id?: string | null
        }
        Update: {
          content?: string | null
          content_hash?: string | null
          created_at?: string | null
          id?: string
          last_scraped_at?: string | null
          page_type?: string | null
          status_code?: number | null
          title?: string | null
          updated_at?: string | null
          url?: string
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scraped_pages_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "scraped_websites"
            referencedColumns: ["id"]
          },
        ]
      }
      scraped_websites: {
        Row: {
          allowed_domains: string[] | null
          base_url: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_scraped_at: string | null
          max_pages: number | null
          name: string
          scraping_frequency_hours: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          allowed_domains?: string[] | null
          base_url: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_scraped_at?: string | null
          max_pages?: number | null
          name: string
          scraping_frequency_hours?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          allowed_domains?: string[] | null
          base_url?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_scraped_at?: string | null
          max_pages?: number | null
          name?: string
          scraping_frequency_hours?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
    }
    Enums: {
      user_role: "ciudadano" | "administrativo"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
