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
      advertisements: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link: string | null
          match_id: string | null
          popout: boolean
          size: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link?: string | null
          match_id?: string | null
          popout?: boolean
          size?: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link?: string | null
          match_id?: string | null
          popout?: boolean
          size?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string
          escalated: boolean
          id: string
          ticket_id: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          escalated?: boolean
          id?: string
          ticket_id?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          escalated?: boolean
          id?: string
          ticket_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_escalations: {
        Row: {
          admin_id: string | null
          admin_reply: string | null
          ai_suggestion: string | null
          ai_summary: string | null
          conversation_id: string | null
          created_at: string
          id: string
          reason: string
          resolved_at: string | null
          status: string
          ticket_id: string | null
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          admin_reply?: string | null
          ai_suggestion?: string | null
          ai_summary?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          reason: string
          resolved_at?: string | null
          status?: string
          ticket_id?: string | null
          user_id: string
        }
        Update: {
          admin_id?: string | null
          admin_reply?: string | null
          ai_suggestion?: string | null
          ai_summary?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          reason?: string
          resolved_at?: string | null
          status?: string
          ticket_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_escalations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_escalations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_logs: {
        Row: {
          completion_tokens: number | null
          conversation_id: string | null
          created_at: string
          id: string
          kind: string
          model: string | null
          prompt_preview: string | null
          prompt_tokens: number | null
          response_preview: string | null
          ticket_id: string | null
          user_id: string | null
        }
        Insert: {
          completion_tokens?: number | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          kind: string
          model?: string | null
          prompt_preview?: string | null
          prompt_tokens?: number | null
          response_preview?: string | null
          ticket_id?: string | null
          user_id?: string | null
        }
        Update: {
          completion_tokens?: number | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          model?: string | null
          prompt_preview?: string | null
          prompt_tokens?: number | null
          response_preview?: string | null
          ticket_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link: string | null
          sort_order: number
          title: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link?: string | null
          sort_order?: number
          title?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link?: string | null
          sort_order?: number
          title?: string | null
        }
        Relationships: []
      }
      appeals: {
        Row: {
          admin_reply: string | null
          created_at: string
          id: string
          kind: string
          message: string
          resolved_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_reply?: string | null
          created_at?: string
          id?: string
          kind: string
          message: string
          resolved_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_reply?: string | null
          created_at?: string
          id?: string
          kind?: string
          message?: string
          resolved_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      bet_selections: {
        Row: {
          bet_id: string
          created_at: string
          id: string
          market: string
          match_id: string
          odds_value: number
          selection: string
          status: Database["public"]["Enums"]["bet_status"]
        }
        Insert: {
          bet_id: string
          created_at?: string
          id?: string
          market: string
          match_id: string
          odds_value: number
          selection: string
          status?: Database["public"]["Enums"]["bet_status"]
        }
        Update: {
          bet_id?: string
          created_at?: string
          id?: string
          market?: string
          match_id?: string
          odds_value?: number
          selection?: string
          status?: Database["public"]["Enums"]["bet_status"]
        }
        Relationships: [
          {
            foreignKeyName: "bet_selections_bet_id_fkey"
            columns: ["bet_id"]
            isOneToOne: false
            referencedRelation: "bets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bet_selections_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      bets: {
        Row: {
          booking_code: string | null
          cashout_amount: number | null
          created_at: string
          id: string
          payout: number | null
          potential_payout: number
          selection_hash: string | null
          settled_at: string | null
          stake: number
          status: Database["public"]["Enums"]["bet_status"]
          ticket_code: string | null
          total_odds: number
          user_id: string
        }
        Insert: {
          booking_code?: string | null
          cashout_amount?: number | null
          created_at?: string
          id?: string
          payout?: number | null
          potential_payout: number
          selection_hash?: string | null
          settled_at?: string | null
          stake: number
          status?: Database["public"]["Enums"]["bet_status"]
          ticket_code?: string | null
          total_odds: number
          user_id: string
        }
        Update: {
          booking_code?: string | null
          cashout_amount?: number | null
          created_at?: string
          id?: string
          payout?: number | null
          potential_payout?: number
          selection_hash?: string | null
          settled_at?: string | null
          stake?: number
          status?: Database["public"]["Enums"]["bet_status"]
          ticket_code?: string | null
          total_odds?: number
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      chat_channels: {
        Row: {
          created_at: string
          id: string
          name: string
          type: Database["public"]["Enums"]["chat_channel_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          type: Database["public"]["Enums"]["chat_channel_type"]
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["chat_channel_type"]
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          channel_id: string
          content: string | null
          created_at: string
          deleted_at: string | null
          id: string
          image_url: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          content?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_url?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          content?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          countdown_to: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          countdown_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          countdown_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      leaderboard_factions: {
        Row: {
          draws: number
          id: string
          losses: number
          name: string
          notes: string | null
          played: number
          points: number
          rank: number
          score: number
          top_player: string | null
          type: string
          updated_at: string
          week_start: string
          wins: number
        }
        Insert: {
          draws?: number
          id?: string
          losses?: number
          name: string
          notes?: string | null
          played?: number
          points?: number
          rank: number
          score?: number
          top_player?: string | null
          type: string
          updated_at?: string
          week_start?: string
          wins?: number
        }
        Update: {
          draws?: number
          id?: string
          losses?: number
          name?: string
          notes?: string | null
          played?: number
          points?: number
          rank?: number
          score?: number
          top_player?: string | null
          type?: string
          updated_at?: string
          week_start?: string
          wins?: number
        }
        Relationships: []
      }
      leaderboard_players: {
        Row: {
          gang_or_faction: string | null
          gf_type: string | null
          id: string
          losses: number
          played: number
          player_name: string
          player_role: string | null
          rank: number
          score: number
          updated_at: string
          week_start: string
          wins: number
        }
        Insert: {
          gang_or_faction?: string | null
          gf_type?: string | null
          id?: string
          losses?: number
          played?: number
          player_name: string
          player_role?: string | null
          rank: number
          score?: number
          updated_at?: string
          week_start?: string
          wins?: number
        }
        Update: {
          gang_or_faction?: string | null
          gf_type?: string | null
          id?: string
          losses?: number
          played?: number
          player_name?: string
          player_role?: string | null
          rank?: number
          score?: number
          updated_at?: string
          week_start?: string
          wins?: number
        }
        Relationships: []
      }
      live_highlights: {
        Row: {
          created_at: string
          custom_subtitle: string | null
          custom_title: string | null
          id: string
          is_active: boolean
          match_id: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          custom_subtitle?: string | null
          custom_title?: string | null
          id?: string
          is_active?: boolean
          match_id?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          custom_subtitle?: string | null
          custom_title?: string | null
          id?: string
          is_active?: boolean
          match_id?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      live_score_events: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          match_id: string
          minute: number | null
          team_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          match_id: string
          minute?: number | null
          team_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          match_id?: string
          minute?: number | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_score_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_score_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      match_categories: {
        Row: {
          category_id: string
          match_id: string
        }
        Insert: {
          category_id: string
          match_id: string
        }
        Update: {
          category_id?: string
          match_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_categories_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_score: number
          away_team_id: string
          bookings_locked: boolean
          created_at: string
          ended_at: string | null
          home_score: number
          home_team_id: string
          id: string
          image_url: string | null
          kickoff_time: string
          league: string | null
          location: string | null
          match_minute: number | null
          status: Database["public"]["Enums"]["match_status"]
          updated_at: string
          winner: string | null
        }
        Insert: {
          away_score?: number
          away_team_id: string
          bookings_locked?: boolean
          created_at?: string
          ended_at?: string | null
          home_score?: number
          home_team_id: string
          id?: string
          image_url?: string | null
          kickoff_time: string
          league?: string | null
          location?: string | null
          match_minute?: number | null
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
          winner?: string | null
        }
        Update: {
          away_score?: number
          away_team_id?: string
          bookings_locked?: boolean
          created_at?: string
          ended_at?: string | null
          home_score?: number
          home_team_id?: string
          id?: string
          image_url?: string | null
          kickoff_time?: string
          league?: string | null
          location?: string | null
          match_minute?: number | null
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      odds: {
        Row: {
          id: string
          is_active: boolean
          market: string
          match_id: string
          selection: string
          updated_at: string
          value: number
        }
        Insert: {
          id?: string
          is_active?: boolean
          market: string
          match_id: string
          selection: string
          updated_at?: string
          value: number
        }
        Update: {
          id?: string
          is_active?: boolean
          market?: string
          match_id?: string
          selection?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "odds_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          about_us: string | null
          contact_email: string | null
          contact_phone: string | null
          contact_sms: string | null
          contact_whatsapp: string | null
          id: number
          maintenance_message: string | null
          maintenance_mode: boolean
          max_payout: number
          max_stake: number
          min_stake: number
          notification_triggers: Json
          updated_at: string
          why_trust_us: string | null
        }
        Insert: {
          about_us?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_sms?: string | null
          contact_whatsapp?: string | null
          id?: number
          maintenance_message?: string | null
          maintenance_mode?: boolean
          max_payout?: number
          max_stake?: number
          min_stake?: number
          notification_triggers?: Json
          updated_at?: string
          why_trust_us?: string | null
        }
        Update: {
          about_us?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_sms?: string | null
          contact_whatsapp?: string | null
          id?: number
          maintenance_message?: string | null
          maintenance_mode?: boolean
          max_payout?: number
          max_stake?: number
          min_stake?: number
          notification_triggers?: Json
          updated_at?: string
          why_trust_us?: string | null
        }
        Relationships: []
      }
      players: {
        Row: {
          created_at: string
          id: string
          jersey_number: number | null
          match_id: string
          name: string
          position: string | null
          squad_type: Database["public"]["Enums"]["squad_type"]
          team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          jersey_number?: number | null
          match_id: string
          name: string
          position?: string | null
          squad_type?: Database["public"]["Enums"]["squad_type"]
          team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          jersey_number?: number | null
          match_id?: string
          name?: string
          position?: string | null
          squad_type?: Database["public"]["Enums"]["squad_type"]
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          ban_reason: string | null
          banned_at: string | null
          country: string | null
          created_at: string
          discord_username: string | null
          email: string | null
          full_name: string
          gang_faction: string | null
          gang_type: string | null
          id: string
          is_banned: boolean
          is_muted: boolean
          is_restricted: boolean
          mute_reason: string | null
          phone: string | null
          restrict_reason: string | null
          server: string
          token_balance: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          country?: string | null
          created_at?: string
          discord_username?: string | null
          email?: string | null
          full_name: string
          gang_faction?: string | null
          gang_type?: string | null
          id: string
          is_banned?: boolean
          is_muted?: boolean
          is_restricted?: boolean
          mute_reason?: string | null
          phone?: string | null
          restrict_reason?: string | null
          server?: string
          token_balance?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          country?: string | null
          created_at?: string
          discord_username?: string | null
          email?: string | null
          full_name?: string
          gang_faction?: string | null
          gang_type?: string | null
          id?: string
          is_banned?: boolean
          is_muted?: boolean
          is_restricted?: boolean
          mute_reason?: string | null
          phone?: string | null
          restrict_reason?: string | null
          server?: string
          token_balance?: number
          updated_at?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          amount: number
          code: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number
          max_uses_per_user: number
          note: string | null
          uses: number
        }
        Insert: {
          amount: number
          code: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          max_uses_per_user?: number
          note?: string | null
          uses?: number
        }
        Update: {
          amount?: number
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          max_uses_per_user?: number
          note?: string | null
          uses?: number
        }
        Relationships: []
      }
      promo_redemptions: {
        Row: {
          amount: number
          id: string
          promo_id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          amount: number
          id?: string
          promo_id: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          id?: string
          promo_id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_redemptions_promo_id_fkey"
            columns: ["promo_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          closed_at: string | null
          created_at: string
          id: string
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          user_id: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          country: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          short_name: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          short_name?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          short_name?: string | null
        }
        Relationships: []
      }
      terms_sections: {
        Row: {
          body: string
          category: string
          id: string
          is_active: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          category: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          category?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          ticket_id: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          ticket_id: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      token_requests: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          id: string
          image_url: string | null
          note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["token_request_status"]
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          id?: string
          image_url?: string | null
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["token_request_status"]
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          id?: string
          image_url?: string | null
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["token_request_status"]
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          id: string
          note: string | null
          reference_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          id?: string
          note?: string | null
          reference_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          id?: string
          note?: string | null
          reference_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          gang_name: string
          id: string
          ingame_name: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
          ticket_id: string | null
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          gang_name: string
          id?: string
          ingame_name: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          ticket_id?: string | null
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          gang_name?: string
          id?: string
          ingame_name?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          ticket_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_ban_user: {
        Args: { _ban: boolean; _reason?: string; _user_id: string }
        Returns: undefined
      }
      admin_clear_all_tokens: { Args: { _reason: string }; Returns: undefined }
      admin_grant_tokens: {
        Args: { _amount: number; _note?: string; _user_id: string }
        Returns: undefined
      }
      admin_mute_user: {
        Args: { _mute: boolean; _reason?: string; _user_id: string }
        Returns: undefined
      }
      admin_remove_tokens: {
        Args: { _amount: number; _reason: string; _user_id: string }
        Returns: undefined
      }
      admin_restrict_user: {
        Args: { _reason?: string; _restrict: boolean; _user_id: string }
        Returns: undefined
      }
      approve_token_request: {
        Args: { _admin_note?: string; _req_id: string }
        Returns: undefined
      }
      approve_withdrawal: {
        Args: { _note?: string; _req_id: string }
        Returns: undefined
      }
      book_by_code: { Args: { _code: string; _stake: number }; Returns: string }
      cashout_bet: {
        Args: { _bet_id: string; _fraction?: number }
        Returns: number
      }
      decline_withdrawal: {
        Args: { _note: string; _req_id: string }
        Returns: undefined
      }
      deny_token_request: {
        Args: { _admin_note?: string; _req_id: string }
        Returns: undefined
      }
      edit_bet: {
        Args: {
          _add_selections: Json
          _bet_id: string
          _new_stake: number
          _remove_selection_ids: string[]
        }
        Returns: undefined
      }
      gen_booking_code: { Args: never; Returns: string }
      gen_ticket_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      insert_notification_all: {
        Args: { _body?: string; _link?: string; _title: string }
        Returns: undefined
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_mod_or_admin: { Args: { _user_id: string }; Returns: boolean }
      place_bet: {
        Args: { _selections: Json; _stake: number }
        Returns: string
      }
      redeem_promo: { Args: { _code: string }; Returns: number }
      settle_match: {
        Args: { _match_id: string; _winner: string }
        Returns: undefined
      }
      submit_withdrawal: {
        Args: {
          _amount: number
          _gang: string
          _ingame: string
          _ticket?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "gang_leader"
        | "shooter"
        | "registered"
        | "viewer"
      bet_status: "open" | "won" | "lost" | "cashed_out" | "void"
      chat_channel_type: "general" | "gang" | "moderator"
      match_status: "upcoming" | "live" | "ended" | "cancelled"
      squad_type: "main" | "sub"
      ticket_status: "open" | "closed" | "reported"
      token_request_status: "pending" | "approved" | "denied"
      transaction_type:
        | "grant"
        | "request_approved"
        | "bet_placed"
        | "bet_stake"
        | "bet_won"
        | "bet_payout"
        | "bet_refund"
        | "bet_edit"
        | "cashout"
        | "adjustment"
        | "admin_adjust"
        | "token_grant"
        | "promo"
        | "penalty"
      withdrawal_status: "pending" | "approved" | "declined"
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
      app_role: [
        "admin",
        "moderator",
        "gang_leader",
        "shooter",
        "registered",
        "viewer",
      ],
      bet_status: ["open", "won", "lost", "cashed_out", "void"],
      chat_channel_type: ["general", "gang", "moderator"],
      match_status: ["upcoming", "live", "ended", "cancelled"],
      squad_type: ["main", "sub"],
      ticket_status: ["open", "closed", "reported"],
      token_request_status: ["pending", "approved", "denied"],
      transaction_type: [
        "grant",
        "request_approved",
        "bet_placed",
        "bet_stake",
        "bet_won",
        "bet_payout",
        "bet_refund",
        "bet_edit",
        "cashout",
        "adjustment",
        "admin_adjust",
        "token_grant",
        "promo",
        "penalty",
      ],
      withdrawal_status: ["pending", "approved", "declined"],
    },
  },
} as const
