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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      accommodation_bookings: {
        Row: {
          accommodation_id: string
          check_in_date: string
          check_out_date: string
          created_at: string
          guests: number
          id: string
          notes: string | null
          status: string
          user_id: string
        }
        Insert: {
          accommodation_id: string
          check_in_date: string
          check_out_date: string
          created_at?: string
          guests?: number
          id?: string
          notes?: string | null
          status?: string
          user_id: string
        }
        Update: {
          accommodation_id?: string
          check_in_date?: string
          check_out_date?: string
          created_at?: string
          guests?: number
          id?: string
          notes?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accommodation_bookings_accommodation_id_fkey"
            columns: ["accommodation_id"]
            isOneToOne: false
            referencedRelation: "accommodations"
            referencedColumns: ["id"]
          },
        ]
      }
      accommodations: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          guide_id: string | null
          id: string
          image_url: string | null
          latitude: number | null
          longitude: number | null
          name: string
          price_range: string | null
          type: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          guide_id?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          price_range?: string | null
          type?: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          guide_id?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          price_range?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "accommodations_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "guide_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          required_checkins: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name: string
          required_checkins?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          required_checkins?: number
        }
        Relationships: []
      }
      checkin_likes: {
        Row: {
          checkin_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          checkin_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          checkin_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkin_likes_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "checkins"
            referencedColumns: ["id"]
          },
        ]
      }
      checkins: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string | null
          location_id: string
          points_earned: number
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          location_id: string
          points_earned?: number
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          location_id?: string
          points_earned?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_profiles: {
        Row: {
          business_name: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          is_approved: boolean
          user_id: string
        }
        Insert: {
          business_name: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_approved?: boolean
          user_id: string
        }
        Update: {
          business_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_approved?: boolean
          user_id?: string
        }
        Relationships: []
      }
      location_feedback: {
        Row: {
          created_at: string
          feedback_text: string | null
          id: string
          location_id: string
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_text?: string | null
          id?: string
          location_id: string
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_text?: string | null
          id?: string
          location_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_feedback_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_feedback_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      location_quiz_questions: {
        Row: {
          correct_option: string
          created_at: string
          id: string
          location_id: string
          option_a: string
          option_b: string
          option_c: string
          question_order: number
          question_text: string
        }
        Insert: {
          correct_option: string
          created_at?: string
          id?: string
          location_id: string
          option_a: string
          option_b: string
          option_c: string
          question_order?: number
          question_text: string
        }
        Update: {
          correct_option?: string
          created_at?: string
          id?: string
          location_id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          question_order?: number
          question_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_quiz_questions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_quiz_questions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      location_stories: {
        Row: {
          created_at: string
          fun_fact: string | null
          id: string
          location_id: string
          story_text: string
        }
        Insert: {
          created_at?: string
          fun_fact?: string | null
          id?: string
          location_id: string
          story_text: string
        }
        Update: {
          created_at?: string
          fun_fact?: string | null
          id?: string
          location_id?: string
          story_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_stories_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: true
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_stories_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: true
            referencedRelation: "locations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          checkin_type: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          latitude: number | null
          longitude: number | null
          name: string
          points_reward: number
          qr_code_id: string
          quest_enabled: boolean
          quest_reward: string | null
          quest_task: string | null
          time_restriction: string | null
        }
        Insert: {
          checkin_type?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          points_reward?: number
          qr_code_id: string
          quest_enabled?: boolean
          quest_reward?: string | null
          quest_task?: string | null
          time_restriction?: string | null
        }
        Update: {
          checkin_type?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          points_reward?: number
          qr_code_id?: string
          quest_enabled?: boolean
          quest_reward?: string | null
          quest_task?: string | null
          time_restriction?: string | null
        }
        Relationships: []
      }
      point_rewards: {
        Row: {
          created_at: string
          id: string
          points_threshold: number
          reward_description: string | null
          reward_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          points_threshold: number
          reward_description?: string | null
          reward_name: string
        }
        Update: {
          created_at?: string
          id?: string
          points_threshold?: number
          reward_description?: string | null
          reward_name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          onboarded: boolean
          origin: Database["public"]["Enums"]["user_origin"] | null
          phone: string | null
          points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          onboarded?: boolean
          origin?: Database["public"]["Enums"]["user_origin"] | null
          phone?: string | null
          points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          onboarded?: boolean
          origin?: Database["public"]["Enums"]["user_origin"] | null
          phone?: string | null
          points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quest_locations: {
        Row: {
          id: string
          location_id: string
          quest_id: string
          step_order: number
        }
        Insert: {
          id?: string
          location_id: string
          quest_id: string
          step_order?: number
        }
        Update: {
          id?: string
          location_id?: string
          quest_id?: string
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quest_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_locations_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_path_responses: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          path_number: number
          quest_id: string
          response_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          path_number: number
          quest_id: string
          response_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          path_number?: number
          quest_id?: string
          response_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quests: {
        Row: {
          created_at: string
          description: string | null
          guide_id: string
          icon: string
          id: string
          title: string
          total_steps: number
          type: Database["public"]["Enums"]["quest_type"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          guide_id: string
          icon?: string
          id?: string
          title: string
          total_steps?: number
          type: Database["public"]["Enums"]["quest_type"]
        }
        Update: {
          created_at?: string
          description?: string | null
          guide_id?: string
          icon?: string
          id?: string
          title?: string
          total_steps?: number
          type?: Database["public"]["Enums"]["quest_type"]
        }
        Relationships: [
          {
            foreignKeyName: "quests_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "guide_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_bookings: {
        Row: {
          booking_date: string
          created_at: string
          guide_id: string
          id: string
          notes: string | null
          party_size: number
          quest_id: string
          status: string
          user_id: string
        }
        Insert: {
          booking_date: string
          created_at?: string
          guide_id: string
          id?: string
          notes?: string | null
          party_size?: number
          quest_id: string
          status?: string
          user_id: string
        }
        Update: {
          booking_date?: string
          created_at?: string
          guide_id?: string
          id?: string
          notes?: string | null
          party_size?: number
          quest_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_bookings_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "guide_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quests: {
        Row: {
          completed: boolean
          completed_at: string | null
          id: string
          progress: number
          quest_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          id?: string
          progress?: number
          quest_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          id?: string
          progress?: number
          quest_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quiz_answers: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          selected_option: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct: boolean
          question_id: string
          selected_option: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_option?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "location_quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reward_claims: {
        Row: {
          claimed_at: string
          id: string
          reward_choice: string
          reward_id: string
          status: string
          user_id: string
        }
        Insert: {
          claimed_at?: string
          id?: string
          reward_choice: string
          reward_id: string
          status?: string
          user_id: string
        }
        Update: {
          claimed_at?: string
          id?: string
          reward_choice?: string
          reward_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reward_claims_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "point_rewards"
            referencedColumns: ["id"]
          },
        ]
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
      locations_public: {
        Row: {
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          name: string | null
          points_reward: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          name?: string | null
          points_reward?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          name?: string | null
          points_reward?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      advance_quest: { Args: { p_quest_id: string }; Returns: Json }
      advance_quests_for_checkin: {
        Args: { p_location_id: string }
        Returns: Json
      }
      award_badge_if_eligible: {
        Args: { p_badge_id: string }
        Returns: undefined
      }
      get_location_by_qr: { Args: { p_qr_code_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      quest_type:
        | "astrology"
        | "ikigai"
        | "human_design"
        | "economical"
        | "religious"
        | "political"
      user_origin:
        | "around_ga_mphahlele"
        | "local_community"
        | "provincial"
        | "national"
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
      app_role: ["admin", "moderator", "user"],
      quest_type: [
        "astrology",
        "ikigai",
        "human_design",
        "economical",
        "religious",
        "political",
      ],
      user_origin: [
        "around_ga_mphahlele",
        "local_community",
        "provincial",
        "national",
      ],
    },
  },
} as const
