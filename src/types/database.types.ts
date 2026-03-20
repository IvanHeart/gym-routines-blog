export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1'
  }
  public: {
    Tables: {
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: 'cart_items_cart_id_fkey'
            columns: ['cart_id']
            isOneToOne: false
            referencedRelation: 'carts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'cart_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'carts_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          routine_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          routine_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          routine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'comments_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comments_routine_id_fkey'
            columns: ['routine_id']
            isOneToOne: false
            referencedRelation: 'routines'
            referencedColumns: ['id']
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          order_index: number
          reps: string | null
          rest_seconds: number | null
          routine_id: string
          sets: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          order_index?: number
          reps?: string | null
          rest_seconds?: number | null
          routine_id: string
          sets?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          order_index?: number
          reps?: string | null
          rest_seconds?: number | null
          routine_id?: string
          sets?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'exercises_routine_id_fkey'
            columns: ['routine_id']
            isOneToOne: false
            referencedRelation: 'routines'
            referencedColumns: ['id']
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          routine_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          routine_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          routine_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'favorites_routine_id_fkey'
            columns: ['routine_id']
            isOneToOne: false
            referencedRelation: 'routines'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'favorites_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_number: number
          shipping_address_id: string
          status: string
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_number?: number
          shipping_address_id: string
          status?: string
          total: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_number?: number
          shipping_address_id?: string
          status?: string
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'orders_shipping_address_id_fkey'
            columns: ['shipping_address_id']
            isOneToOne: false
            referencedRelation: 'shipping_addresses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'orders_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      product_categories: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          order_index: number
          product_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_index?: number
          product_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          order_index?: number
          product_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: 'product_images_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          category_id: string | null
          created_at: string
          deleted_at: string | null
          description: string
          dimensions: string | null
          id: string
          name: string
          price: number
          published: boolean
          slug: string
          stock: number
          updated_at: string
          weight: number | null
        }
        Insert: {
          brand?: string | null
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string
          dimensions?: string | null
          id?: string
          name: string
          price: number
          published?: boolean
          slug: string
          stock?: number
          updated_at?: string
          weight?: number | null
        }
        Update: {
          brand?: string | null
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string
          dimensions?: string | null
          id?: string
          name?: string
          price?: number
          published?: boolean
          slug?: string
          stock?: number
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'product_categories'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          role: Database['public']['Enums']['user_role']
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role?: Database['public']['Enums']['user_role']
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: Database['public']['Enums']['user_role']
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      routine_reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          resolved: boolean
          routine_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          resolved?: boolean
          routine_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          resolved?: boolean
          routine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'routine_reports_reporter_id_fkey'
            columns: ['reporter_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'routine_reports_routine_id_fkey'
            columns: ['routine_id']
            isOneToOne: false
            referencedRelation: 'routines'
            referencedColumns: ['id']
          },
        ]
      }
      routines: {
        Row: {
          author_id: string
          category_id: string | null
          content: string
          cover_image_url: string | null
          created_at: string
          deleted_at: string | null
          difficulty: Database['public']['Enums']['difficulty_level']
          duration_minutes: number | null
          excerpt: string | null
          id: string
          published: boolean
          search_vector: unknown
          slug: string
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          author_id: string
          category_id?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string
          deleted_at?: string | null
          difficulty?: Database['public']['Enums']['difficulty_level']
          duration_minutes?: number | null
          excerpt?: string | null
          id?: string
          published?: boolean
          search_vector?: unknown
          slug: string
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          author_id?: string
          category_id?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string
          deleted_at?: string | null
          difficulty?: Database['public']['Enums']['difficulty_level']
          duration_minutes?: number | null
          excerpt?: string | null
          id?: string
          published?: boolean
          search_vector?: unknown
          slug?: string
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: 'routines_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'routines_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      shipping_addresses: {
        Row: {
          address_line: string
          city: string
          country: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean
          notes: string | null
          phone: string
          postal_code: string
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line: string
          city: string
          country?: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean
          notes?: string | null
          phone: string
          postal_code: string
          state: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line?: string
          city?: string
          country?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          notes?: string | null
          phone?: string
          postal_code?: string
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'shipping_addresses_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_order: {
        Args: { p_order_id: string; p_user_id: string }
        Returns: undefined
      }
      create_order: {
        Args: {
          p_notes?: string
          p_shipping_address_id: string
          p_user_id: string
        }
        Returns: string
      }
      increment_routine_views: {
        Args: { routine_id: string }
        Returns: undefined
      }
      unaccent: { Args: { '': string }; Returns: string }
    }
    Enums: {
      difficulty_level: 'beginner' | 'intermediate' | 'advanced'
      user_role: 'user' | 'admin'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      difficulty_level: ['beginner', 'intermediate', 'advanced'],
      user_role: ['user', 'admin'],
    },
  },
} as const
