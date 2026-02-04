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
      collectibles_catalog: {
        Row: {
          base_atk: number
          base_hp: number
          base_mana: number
          created_at: string
          flavor_text: string | null
          id: string
          image_url: string | null
          lore: string | null
          model_key: string | null
          name: string
          rarity: Database["public"]["Enums"]["rarity"]
          series: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          base_atk?: number
          base_hp?: number
          base_mana?: number
          created_at?: string
          flavor_text?: string | null
          id?: string
          image_url?: string | null
          lore?: string | null
          model_key?: string | null
          name: string
          rarity: Database["public"]["Enums"]["rarity"]
          series?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          base_atk?: number
          base_hp?: number
          base_mana?: number
          created_at?: string
          flavor_text?: string | null
          id?: string
          image_url?: string | null
          lore?: string | null
          model_key?: string | null
          name?: string
          rarity?: Database["public"]["Enums"]["rarity"]
          series?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      strains_catalog: {
        Row: {
          created_at: string
          description: string | null
          family: Database["public"]["Enums"]["strain_family"]
          id: string
          image_url: string | null
          name: string
          penalty: string | null
          rarity: Database["public"]["Enums"]["rarity"]
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          family: Database["public"]["Enums"]["strain_family"]
          id?: string
          image_url?: string | null
          name: string
          penalty?: string | null
          rarity: Database["public"]["Enums"]["rarity"]
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          family?: Database["public"]["Enums"]["strain_family"]
          id?: string
          image_url?: string | null
          name?: string
          penalty?: string | null
          rarity?: Database["public"]["Enums"]["rarity"]
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      lootbox_tiers: {
        Row: {
          id: string
          slug: string
          name: string
          cost_essence: number
          prob_common: number
          prob_uncommon: number
          prob_rare: number
          prob_epic: number
          prob_legendary: number
        }
        Insert: never
        Update: never
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          essence_balance: number
          id: string
          is_admin: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          essence_balance?: number
          id: string
          is_admin?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          essence_balance?: number
          id?: string
          is_admin?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          created_at: string
          email_hash: string | null
          id: number
          ip_hash: string | null
          success: boolean
        }
        Insert: {
          created_at?: string
          email_hash?: string | null
          id?: number
          ip_hash?: string | null
          success?: boolean
        }
        Update: {
          created_at?: string
          email_hash?: string | null
          id?: number
          ip_hash?: string | null
          success?: boolean
        }
        Relationships: []
      }
      redemption_attempts: {
        Row: {
          code_hash: string | null
          created_at: string
          id: number
          ip_hash: string | null
          success: boolean
          user_id: string | null
        }
        Insert: {
          code_hash?: string | null
          created_at?: string
          id?: number
          ip_hash?: string | null
          success?: boolean
          user_id?: string | null
        }
        Update: {
          code_hash?: string | null
          created_at?: string
          id?: number
          ip_hash?: string | null
          success?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      redemption_codes: {
        Row: {
          batch_id: string | null
          code_hash: string
          created_at: string
          id: string
          is_active: boolean
          redeemed_at: string | null
          redeemed_by: string | null
          redeemed_inventory_id: string | null
        }
        Insert: {
          batch_id?: string | null
          code_hash: string
          created_at?: string
          id?: string
          is_active?: boolean
          redeemed_at?: string | null
          redeemed_by?: string | null
          redeemed_inventory_id?: string | null
        }
        Update: {
          batch_id?: string | null
          code_hash?: string
          created_at?: string
          id?: string
          is_active?: boolean
          redeemed_at?: string | null
          redeemed_by?: string | null
          redeemed_inventory_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "redemption_codes_redeemed_inventory_fk"
            columns: ["redeemed_inventory_id"]
            isOneToOne: false
            referencedRelation: "user_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      user_inventory: {
        Row: {
          acquired_at: string
          collectible_id: string
          id: string
          redemption_code_hash: string | null
          source: string
          user_id: string
        }
        Insert: {
          acquired_at?: string
          collectible_id: string
          id?: string
          redemption_code_hash?: string | null
          source?: string
          user_id: string
        }
        Update: {
          acquired_at?: string
          collectible_id?: string
          id?: string
          redemption_code_hash?: string | null
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_inventory_collectible_id_fkey"
            columns: ["collectible_id"]
            isOneToOne: false
            referencedRelation: "collectibles_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      crockford_index: { Args: { p_char: string }; Returns: number }
      is_admin: { Args: Record<string, never>; Returns: boolean }
      is_valid_redemption_code: { Args: { p_code: string }; Returns: boolean }
      redeem_code: {
        Args: { p_code: string }
        Returns: {
          collectible_id: string
          collectible_name: string
          collectible_slug: string
          inventory_id: string
          rarity: Database["public"]["Enums"]["rarity"]
        }[]
      }
    }
    Enums: {
      rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"
      strain_family: "NEURO" | "SHELL" | "PSYCHO"
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
      rarity: ["common", "uncommon", "rare", "epic", "legendary"],
      strain_family: ["NEURO", "SHELL", "PSYCHO"],
    },
  },
} as const

