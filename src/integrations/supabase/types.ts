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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          address: string | null
          contact_number: string
          country_code: string
          created_at: string
          credit_limit: number | null
          customer_name: string
          email: string | null
          fax: string | null
          id: string
          id_type_name: string | null
          id_type_number: string | null
          is_active: boolean
          is_blacklisted: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          contact_number: string
          country_code?: string
          created_at?: string
          credit_limit?: number | null
          customer_name: string
          email?: string | null
          fax?: string | null
          id?: string
          id_type_name?: string | null
          id_type_number?: string | null
          is_active?: boolean
          is_blacklisted?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          contact_number?: string
          country_code?: string
          created_at?: string
          credit_limit?: number | null
          customer_name?: string
          email?: string | null
          fax?: string | null
          id?: string
          id_type_name?: string | null
          id_type_number?: string | null
          is_active?: boolean
          is_blacklisted?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          address: string
          created_at: string
          designation: string
          email: string
          id: string
          name: string
          parent_name: string | null
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string
          designation: string
          email: string
          id?: string
          name: string
          parent_name?: string | null
          phone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string
          designation?: string
          email?: string
          id?: string
          name?: string
          parent_name?: string | null
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      floor_plan_templates: {
        Row: {
          category: string | null
          created_at: string
          dimensions: Json | null
          id: string
          image_url: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          dimensions?: Json | null
          id?: string
          image_url: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          dimensions?: Json | null
          id?: string
          image_url?: string
          name?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          brand_details: string | null
          created_at: string
          datasheet_url: string | null
          id: string
          item_group: string
          item_name: string
          remarks: string | null
          unit_of_measurement: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_details?: string | null
          created_at?: string
          datasheet_url?: string | null
          id?: string
          item_group: string
          item_name: string
          remarks?: string | null
          unit_of_measurement: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_details?: string | null
          created_at?: string
          datasheet_url?: string | null
          id?: string
          item_group?: string
          item_name?: string
          remarks?: string | null
          unit_of_measurement?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_profiles: {
        Row: {
          company_name: string
          country_code: string
          created_at: string
          email: string
          full_phone: string
          id: string
          is_merchant: boolean
          mobile_number: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          company_name: string
          country_code?: string
          created_at?: string
          email: string
          full_phone: string
          id?: string
          is_merchant?: boolean
          mobile_number: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          company_name?: string
          country_code?: string
          created_at?: string
          email?: string
          full_phone?: string
          id?: string
          is_merchant?: boolean
          mobile_number?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      purchase_orders: {
        Row: {
          created_at: string
          delivery_date: string
          id: string
          notes: string | null
          order_date: string
          order_number: string
          po_approved_note: string | null
          po_date: string | null
          po_number: string | null
          quotation_id: string | null
          status: string
          supplier_name: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_date: string
          id?: string
          notes?: string | null
          order_date: string
          order_number: string
          po_approved_note?: string | null
          po_date?: string | null
          po_number?: string | null
          quotation_id?: string | null
          status?: string
          supplier_name: string
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_date?: string
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          po_approved_note?: string | null
          po_date?: string | null
          po_number?: string | null
          quotation_id?: string | null
          status?: string
          supplier_name?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_settings: {
        Row: {
          created_at: string
          font: string
          footer_text: string | null
          header_text: string | null
          id: string
          logo_url: string | null
          primary_color: string
          secondary_color: string
          template: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          font?: string
          footer_text?: string | null
          header_text?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          template?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          font?: string
          footer_text?: string | null
          header_text?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          template?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quotations: {
        Row: {
          billing_address: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          discount_amount: number
          discount_rate: number
          id: string
          is_completed: boolean
          items: Json
          payment_type: string | null
          quotation_date: string
          quotation_number: string
          shipping_address: string | null
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number
          terms_conditions: string | null
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_address?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          discount_amount?: number
          discount_rate?: number
          id?: string
          is_completed?: boolean
          items?: Json
          payment_type?: string | null
          quotation_date: string
          quotation_number: string
          shipping_address?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          terms_conditions?: string | null
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_address?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          discount_amount?: number
          discount_rate?: number
          id?: string
          is_completed?: boolean
          items?: Json
          payment_type?: string | null
          quotation_date?: string
          quotation_number?: string
          shipping_address?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          terms_conditions?: string | null
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sale_orders: {
        Row: {
          created_at: string
          customer_name: string
          delivery_date: string
          id: string
          notes: string | null
          order_date: string
          order_number: string
          po_approved_note: string | null
          po_date: string | null
          po_number: string | null
          quotation_id: string | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_name: string
          delivery_date: string
          id?: string
          notes?: string | null
          order_date: string
          order_number: string
          po_approved_note?: string | null
          po_date?: string | null
          po_number?: string | null
          quotation_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          delivery_date?: string
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          po_approved_note?: string | null
          po_date?: string | null
          po_number?: string | null
          quotation_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_orders_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      security_devices: {
        Row: {
          created_at: string
          device_type: string
          icon_data: string | null
          id: string
          name: string
          properties: Json | null
        }
        Insert: {
          created_at?: string
          device_type: string
          icon_data?: string | null
          id?: string
          name: string
          properties?: Json | null
        }
        Update: {
          created_at?: string
          device_type?: string
          icon_data?: string | null
          id?: string
          name?: string
          properties?: Json | null
        }
        Relationships: []
      }
      security_projects: {
        Row: {
          canvas_data: Json | null
          created_at: string
          description: string | null
          floor_plan_type: string | null
          floor_plan_url: string | null
          id: string
          name: string
          template_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          canvas_data?: Json | null
          created_at?: string
          description?: string | null
          floor_plan_type?: string | null
          floor_plan_url?: string | null
          id?: string
          name: string
          template_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          canvas_data?: Json | null
          created_at?: string
          description?: string | null
          floor_plan_type?: string | null
          floor_plan_url?: string | null
          id?: string
          name?: string
          template_name?: string | null
          updated_at?: string
          user_id?: string
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
