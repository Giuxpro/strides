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
      access_codes: {
        Row: {
          access_type: string
          code: string
          created_at: string
          created_by: string
          discount_duration_months: number | null
          discount_percent: number | null
          id: string
          is_active: boolean
          label: string
          max_uses: number | null
          trial_days: number | null
          updated_at: string
          used_count: number
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          access_type: string
          code: string
          created_at?: string
          created_by: string
          discount_duration_months?: number | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean
          label: string
          max_uses?: number | null
          trial_days?: number | null
          updated_at?: string
          used_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          access_type?: string
          code?: string
          created_at?: string
          created_by?: string
          discount_duration_months?: number | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean
          label?: string
          max_uses?: number | null
          trial_days?: number | null
          updated_at?: string
          used_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          id: string
          input_tokens: number
          model: string
          output_tokens: number
          provider: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          input_tokens?: number
          model: string
          output_tokens?: number
          provider: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          input_tokens?: number
          model?: string
          output_tokens?: number
          provider?: string
        }
        Relationships: []
      }
      child_countdown_attempts: {
        Row: {
          attempted_at: string
          child_id: string
          id: string
          module_id: string
        }
        Insert: {
          attempted_at?: string
          child_id: string
          id?: string
          module_id: string
        }
        Update: {
          attempted_at?: string
          child_id?: string
          id?: string
          module_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_countdown_attempts_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_countdown_attempts_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      child_daily_challenges: {
        Row: {
          child_id: string
          completed_at: string
          date: string
          id: string
          module_id: string
          stars: number
        }
        Insert: {
          child_id: string
          completed_at?: string
          date?: string
          id?: string
          module_id: string
          stars?: number
        }
        Update: {
          child_id?: string
          completed_at?: string
          date?: string
          id?: string
          module_id?: string
          stars?: number
        }
        Relationships: [
          {
            foreignKeyName: "child_daily_challenges_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_daily_challenges_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      child_game_plays: {
        Row: {
          child_id: string
          correct: number
          game_id: string
          id: string
          played_at: string | null
          total: number
        }
        Insert: {
          child_id: string
          correct?: number
          game_id: string
          id?: string
          played_at?: string | null
          total?: number
        }
        Update: {
          child_id?: string
          correct?: number
          game_id?: string
          id?: string
          played_at?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "child_game_plays_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      child_lesson_completions: {
        Row: {
          child_id: string
          completed_at: string
          id: string
          lesson_id: string
          passed: boolean
          score: number | null
          stars: number
        }
        Insert: {
          child_id: string
          completed_at?: string
          id?: string
          lesson_id: string
          passed?: boolean
          score?: number | null
          stars?: number
        }
        Update: {
          child_id?: string
          completed_at?: string
          id?: string
          lesson_id?: string
          passed?: boolean
          score?: number | null
          stars?: number
        }
        Relationships: [
          {
            foreignKeyName: "child_lesson_completions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_lesson_completions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      child_streaks: {
        Row: {
          child_id: string
          current_streak: number
          last_activity_date: string | null
          longest_streak: number
          updated_at: string
        }
        Insert: {
          child_id: string
          current_streak?: number
          last_activity_date?: string | null
          longest_streak?: number
          updated_at?: string
        }
        Update: {
          child_id?: string
          current_streak?: number
          last_activity_date?: string | null
          longest_streak?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_streaks_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: true
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      child_vocab_mastery: {
        Row: {
          attempt_count: number
          child_id: string
          correct_count: number
          skill_type: string
          updated_at: string
          vocab_id: string
        }
        Insert: {
          attempt_count?: number
          child_id: string
          correct_count?: number
          skill_type?: string
          updated_at?: string
          vocab_id: string
        }
        Update: {
          attempt_count?: number
          child_id?: string
          correct_count?: number
          skill_type?: string
          updated_at?: string
          vocab_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_vocab_mastery_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_vocab_mastery_vocab_id_fkey"
            columns: ["vocab_id"]
            isOneToOne: false
            referencedRelation: "vocabulary_items"
            referencedColumns: ["id"]
          },
        ]
      }
      child_word_status: {
        Row: {
          child_id: string
          id: string
          status: Database["public"]["Enums"]["word_status"]
          updated_at: string
          vocabulary_item_id: string
        }
        Insert: {
          child_id: string
          id?: string
          status?: Database["public"]["Enums"]["word_status"]
          updated_at?: string
          vocabulary_item_id: string
        }
        Update: {
          child_id?: string
          id?: string
          status?: Database["public"]["Enums"]["word_status"]
          updated_at?: string
          vocabulary_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_word_status_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_word_status_vocabulary_item_id_fkey"
            columns: ["vocabulary_item_id"]
            isOneToOne: false
            referencedRelation: "vocabulary_items"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          age: number
          avatar_url: string | null
          created_at: string
          id: string
          name: string
          parent_id: string
          updated_at: string
        }
        Insert: {
          age: number
          avatar_url?: string | null
          created_at?: string
          id?: string
          name: string
          parent_id: string
          updated_at?: string
        }
        Update: {
          age?: number
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
          parent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      code_redemptions: {
        Row: {
          code_id: string
          context: string
          effect_applied: Json
          id: string
          redeemed_at: string
          snapshot: Json
          user_id: string
        }
        Insert: {
          code_id: string
          context: string
          effect_applied: Json
          id?: string
          redeemed_at?: string
          snapshot: Json
          user_id: string
        }
        Update: {
          code_id?: string
          context?: string
          effect_applied?: Json
          id?: string
          redeemed_at?: string
          snapshot?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_redemptions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "access_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "code_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_generation_jobs: {
        Row: {
          created_at: string
          created_by: string
          error: string | null
          id: string
          module_id: string | null
          parameters: Json
          result: Json | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          error?: string | null
          id?: string
          module_id?: string | null
          parameters?: Json
          result?: Json | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          error?: string | null
          id?: string
          module_id?: string | null
          parameters?: Json
          result?: Json | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_generation_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_generation_jobs_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_results: {
        Row: {
          child_id: string
          completed_at: string
          failed_item_ids: string[]
          id: string
          module_id: string
          passed: boolean
          score: number
        }
        Insert: {
          child_id: string
          completed_at?: string
          failed_item_ids?: string[]
          id?: string
          module_id: string
          passed?: boolean
          score: number
        }
        Update: {
          child_id?: string
          completed_at?: string
          failed_item_ids?: string[]
          id?: string
          module_id?: string
          passed?: boolean
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_results_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_results_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_items: {
        Row: {
          exercise_id: string
          id: string
          order: number
          vocabulary_item_id: string
        }
        Insert: {
          exercise_id: string
          id?: string
          order?: number
          vocabulary_item_id: string
        }
        Update: {
          exercise_id?: string
          id?: string
          order?: number
          vocabulary_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_items_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_items_vocabulary_item_id_fkey"
            columns: ["vocabulary_item_id"]
            isOneToOne: false
            referencedRelation: "vocabulary_items"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          config: Json
          created_at: string
          id: string
          lesson_id: string | null
          min_age: number
          module_id: string
          order: number
          phase: Database["public"]["Enums"]["exercise_phase"]
          type: Database["public"]["Enums"]["exercise_type"]
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          lesson_id?: string | null
          min_age?: number
          module_id: string
          order?: number
          phase?: Database["public"]["Enums"]["exercise_phase"]
          type: Database["public"]["Enums"]["exercise_type"]
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          lesson_id?: string | null
          min_age?: number
          module_id?: string
          order?: number
          phase?: Database["public"]["Enums"]["exercise_phase"]
          type?: Database["public"]["Enums"]["exercise_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          context_url: string | null
          created_at: string
          id: string
          message: string | null
          stars: number | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          context_url?: string | null
          created_at?: string
          id?: string
          message?: string | null
          stars?: number | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          context_url?: string | null
          created_at?: string
          id?: string
          message?: string | null
          stars?: number | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      household_members: {
        Row: {
          child_id: string | null
          household_id: string
          id: string
          joined_at: string
          member_type: Database["public"]["Enums"]["household_member_type"]
          profile_id: string | null
        }
        Insert: {
          child_id?: string | null
          household_id: string
          id?: string
          joined_at?: string
          member_type?: Database["public"]["Enums"]["household_member_type"]
          profile_id?: string | null
        }
        Update: {
          child_id?: string | null
          household_id?: string
          id?: string
          joined_at?: string
          member_type?: Database["public"]["Enums"]["household_member_type"]
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "household_members_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          owner_id: string
          status: Database["public"]["Enums"]["household_status"]
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          owner_id: string
          status?: Database["public"]["Enums"]["household_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          owner_id?: string
          status?: Database["public"]["Enums"]["household_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "households_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kid_sessions: {
        Row: {
          child_id: string | null
          device_type: string
          id: string
          started_at: string
        }
        Insert: {
          child_id?: string | null
          device_type: string
          id?: string
          started_at?: string
        }
        Update: {
          child_id?: string | null
          device_type?: string
          id?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kid_sessions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_steps: {
        Row: {
          config: Json
          created_at: string
          exercise_id: string | null
          id: string
          lesson_id: string
          position: number
          step_type: Database["public"]["Enums"]["step_type"]
          title: string | null
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          exercise_id?: string | null
          id?: string
          lesson_id: string
          position?: number
          step_type: Database["public"]["Enums"]["step_type"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          exercise_id?: string | null
          id?: string
          lesson_id?: string
          position?: number
          step_type?: Database["public"]["Enums"]["step_type"]
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_steps_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_steps_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          audio_url: string | null
          cover_url: string | null
          created_at: string
          id: string
          is_published: boolean
          min_age: number
          module_id: string
          order: number
          slug: string
          title_en: string
          title_es: string
          updated_at: string
        }
        Insert: {
          audio_url?: string | null
          cover_url?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          min_age?: number
          module_id: string
          order?: number
          slug: string
          title_en: string
          title_es: string
          updated_at?: string
        }
        Update: {
          audio_url?: string | null
          cover_url?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          min_age?: number
          module_id?: string
          order?: number
          slug?: string
          title_en?: string
          title_es?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          active_game_ids: Json | null
          audio_url: string | null
          countdown_weekly_limit: number
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          daily_challenge_word_count: number
          description_es: string | null
          diario_game_id: string | null
          id: string
          is_published: boolean
          order: number
          reto_game_id: string | null
          reto_modifiers: Json | null
          slug: string
          title_en: string
          title_es: string
          updated_at: string
        }
        Insert: {
          active_game_ids?: Json | null
          audio_url?: string | null
          countdown_weekly_limit?: number
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          daily_challenge_word_count?: number
          description_es?: string | null
          diario_game_id?: string | null
          id?: string
          is_published?: boolean
          order?: number
          reto_game_id?: string | null
          reto_modifiers?: Json | null
          slug: string
          title_en: string
          title_es: string
          updated_at?: string
        }
        Update: {
          active_game_ids?: Json | null
          audio_url?: string | null
          countdown_weekly_limit?: number
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          daily_challenge_word_count?: number
          description_es?: string | null
          diario_game_id?: string | null
          id?: string
          is_published?: boolean
          order?: number
          reto_game_id?: string | null
          reto_modifiers?: Json | null
          slug?: string
          title_en?: string
          title_es?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_flows: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      onboarding_screens: {
        Row: {
          content: Json
          created_at: string | null
          flow_id: string | null
          id: string
          is_published: boolean
          order: number
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: Json
          created_at?: string | null
          flow_id?: string | null
          id?: string
          is_published?: boolean
          order?: number
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          flow_id?: string | null
          id?: string
          is_published?: boolean
          order?: number
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_screens_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "onboarding_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          nps_prompted_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          nps_prompted_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          nps_prompted_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      recordings: {
        Row: {
          audio_url: string
          child_id: string
          created_at: string
          id: string
          module_id: string
        }
        Insert: {
          audio_url: string
          child_id: string
          created_at?: string
          id?: string
          module_id: string
        }
        Update: {
          audio_url?: string
          child_id?: string
          created_at?: string
          id?: string
          module_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recordings_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recordings_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhook_events: {
        Row: {
          event_id: string
          received_at: string
        }
        Insert: {
          event_id: string
          received_at?: string
        }
        Update: {
          event_id?: string
          received_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          acquisition_type: string
          billing_cycle: string | null
          created_at: string
          current_period_end: string | null
          id: string
          pending_discount_months: number | null
          pending_discount_percent: number | null
          redeemed_code_id: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          acquisition_type: string
          billing_cycle?: string | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          pending_discount_months?: number | null
          pending_discount_percent?: number | null
          redeemed_code_id?: string | null
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          acquisition_type?: string
          billing_cycle?: string | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          pending_discount_months?: number | null
          pending_discount_percent?: number | null
          redeemed_code_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_redeemed_code_id_fkey"
            columns: ["redeemed_code_id"]
            isOneToOne: false
            referencedRelation: "access_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_module_access: {
        Row: {
          access_type: Database["public"]["Enums"]["access_type"]
          created_at: string
          expires_at: string | null
          id: string
          module_id: string
          user_id: string
        }
        Insert: {
          access_type: Database["public"]["Enums"]["access_type"]
          created_at?: string
          expires_at?: string | null
          id?: string
          module_id: string
          user_id: string
        }
        Update: {
          access_type?: Database["public"]["Enums"]["access_type"]
          created_at?: string
          expires_at?: string | null
          id?: string
          module_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_module_access_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_module_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vocabulary_items: {
        Row: {
          audio_url: string | null
          created_at: string
          emoji_unicode: string | null
          id: string
          image_url: string | null
          min_age: number
          module_id: string
          order: number
          text_en: string
          text_es: string
          type: Database["public"]["Enums"]["vocabulary_type"]
          updated_at: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          emoji_unicode?: string | null
          id?: string
          image_url?: string | null
          min_age?: number
          module_id: string
          order?: number
          text_en: string
          text_es: string
          type?: Database["public"]["Enums"]["vocabulary_type"]
          updated_at?: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          emoji_unicode?: string | null
          id?: string
          image_url?: string | null
          min_age?: number
          module_id?: string
          order?: number
          text_en?: string
          text_es?: string
          type?: Database["public"]["Enums"]["vocabulary_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_items_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_user_detail: {
        Args: { p_user_id: string }
        Returns: {
          challenges_completed: number
          child_age: number
          child_avatar: string
          child_id: string
          child_name: string
          current_streak: number
          favorite_game: string
          last_activity: string
          last_lesson_name: string
          last_module_name: string
          total_completions: number
          total_game_plays: number
        }[]
      }
      get_admin_users_count: {
        Args: { p_plan?: string; p_search?: string; p_status?: string }
        Returns: number
      }
      get_admin_users_overview: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_plan?: string
          p_search?: string
          p_status?: string
        }
        Returns: {
          acquisition_type: string
          children_count: number
          display_name: string
          email: string
          id: string
          joined_at: string
          last_activity: string
          last_sign_in_at: string
          pending_discount_months: number
          pending_discount_percent: number
          redeemed_code: string
          status: string
          sub_created_at: string
          total_completions: number
          trial_ends_at: string
        }[]
      }
      get_or_create_household: { Args: { p_user_id: string }; Returns: string }
      grant_free_module_access: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      has_module_access: {
        Args: { p_module_id: string; p_user_id: string }
        Returns: boolean
      }
      increment_vocab_mastery:
        | {
            Args: {
              p_attempt?: number
              p_child_id: string
              p_correct: number
              p_vocab_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_attempt?: number
              p_child_id: string
              p_correct: number
              p_skill_type?: string
              p_vocab_id: string
            }
            Returns: undefined
          }
      is_admin: { Args: never; Returns: boolean }
      update_child_streak: { Args: { p_child_id: string }; Returns: undefined }
    }
    Enums: {
      access_type: "free" | "purchased" | "subscription"
      exercise_phase: "practice" | "evaluation"
      exercise_type: "memory" | "recognition" | "speaking"
      household_member_type: "owner" | "included" | "extra"
      household_status: "active" | "trial" | "inactive" | "cancelled"
      job_status: "pending" | "completed" | "failed"
      step_type: "video" | "slide" | "exercise"
      user_role: "parent" | "admin"
      vocabulary_type: "word" | "phrase"
      word_status: "unseen" | "learning" | "mastered"
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
      access_type: ["free", "purchased", "subscription"],
      exercise_phase: ["practice", "evaluation"],
      exercise_type: ["memory", "recognition", "speaking"],
      household_member_type: ["owner", "included", "extra"],
      household_status: ["active", "trial", "inactive", "cancelled"],
      job_status: ["pending", "completed", "failed"],
      step_type: ["video", "slide", "exercise"],
      user_role: ["parent", "admin"],
      vocabulary_type: ["word", "phrase"],
      word_status: ["unseen", "learning", "mastered"],
    },
  },
} as const
