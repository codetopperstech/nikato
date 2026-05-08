// ============================================================
// NIKATO · types/database.ts
// Hand-authored DB types. Regenerate with: npm run types
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = "customer" | "shop_owner" | "delivery" | "admin"
export type OrderStatus =
  | "pending" | "confirmed" | "preparing" | "ready"
  | "picked_up" | "delivered" | "cancelled" | "rejected"
export type PaymentMethod = "COD" | "ONLINE"
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded"
export type NotificationType = "ORDER_UPDATE" | "PROMO" | "SYSTEM"
export type DeliveryStatus = "assigned" | "picked_up" | "delivered" | "failed"
export type RazorpayStatus = "created" | "captured" | "failed" | "refunded"

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          phone: string
          full_name: string
          email: string | null
          avatar_url: string | null
          role: UserRole
          is_active: boolean
          fcm_token: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>
      }

      addresses: {
        Row: {
          id: string
          user_id: string
          label: string
          address_line: string
          city: string
          pincode: string
          lat: number
          lng: number
          is_default: boolean
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["addresses"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["addresses"]["Insert"]>
      }

      shops: {
        Row: {
          id: string
          owner_id: string
          name: string
          description: string | null
          logo_url: string | null
          phone: string
          address_line: string
          city: string
          pincode: string
          lat: number
          lng: number
          delivery_radius_km: number
          is_open: boolean
          is_delivery_available: boolean
          min_order_amount: number
          avg_delivery_minutes: number
          commission_rate: number
          is_approved: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["shops"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["shops"]["Insert"]>
      }

      categories: {
        Row: {
          id: string
          shop_id: string
          name: string
          sort_order: number
          is_active: boolean
        }
        Insert: Omit<Database["public"]["Tables"]["categories"]["Row"], "id">
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>
      }

      products: {
        Row: {
          id: string
          shop_id: string
          category_id: string | null
          name: string
          description: string | null
          image_url: string | null
          price: number
          mrp: number | null
          stock: number
          unit: string
          is_available: boolean
          is_veg: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["products"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>
      }

      orders: {
        Row: {
          id: string
          order_number: string
          customer_id: string
          shop_id: string
          delivery_partner_id: string | null
          delivery_address_id: string
          status: OrderStatus
          payment_method: PaymentMethod
          payment_status: PaymentStatus
          subtotal: number
          delivery_fee: number
          discount: number
          total_amount: number
          commission_amount: number
          shop_earning: number
          delivery_earning: number
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          special_instructions: string | null
          cancelled_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["orders"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>
      }

      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          total_price: number
          product_name: string
          product_image: string | null
        }
        Insert: Omit<Database["public"]["Tables"]["order_items"]["Row"], "id">
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>
      }

      delivery_assignments: {
        Row: {
          id: string
          order_id: string
          delivery_partner_id: string
          assigned_at: string
          picked_up_at: string | null
          delivered_at: string | null
          delivery_fee: number
          status: DeliveryStatus
        }
        Insert: Omit<Database["public"]["Tables"]["delivery_assignments"]["Row"], "id" | "assigned_at">
        Update: Partial<Database["public"]["Tables"]["delivery_assignments"]["Insert"]>
      }

      delivery_locations: {
        Row: {
          id: string
          delivery_partner_id: string
          lat: number
          lng: number
          is_online: boolean
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["delivery_locations"]["Row"], "id" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["delivery_locations"]["Insert"]>
      }

      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string
          type: NotificationType
          data: Json | null
          is_read: boolean
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>
      }

      payments: {
        Row: {
          id: string
          order_id: string
          razorpay_order_id: string
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          amount: number
          currency: string
          status: RazorpayStatus
          gateway_response: Json | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["payments"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>
      }

      commissions: {
        Row: {
          id: string
          shop_id: string
          order_id: string
          rate: number
          amount: number
          settled: boolean
          settled_at: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["commissions"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["commissions"]["Insert"]>
      }

      shop_analytics: {
        Row: {
          id: string
          shop_id: string
          date: string
          orders_count: number
          revenue: number
          cancelled: number
        }
        Insert: Omit<Database["public"]["Tables"]["shop_analytics"]["Row"], "id">
        Update: Partial<Database["public"]["Tables"]["shop_analytics"]["Insert"]>
      }
    }

    Functions: {
      nearby_shops: {
        Args: { p_lat: number; p_lng: number; p_radius_m?: number }
        Returns: Array<Database["public"]["Tables"]["shops"]["Row"] & { distance_m: number }>
      }
      check_delivery_availability: {
        Args: { p_shop_id: string; p_cust_lat: number; p_cust_lng: number }
        Returns: boolean
      }
      decrement_stock: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: number
      }
      restore_stock: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: number
      }
      generate_order_number: {
        Args: Record<string, never>
        Returns: string
      }
      get_shop_earnings: {
        Args: { p_shop_id: string; p_from: string; p_to: string }
        Returns: Array<{
          period_revenue: number
          commission_paid: number
          net_earning: number
          order_count: number
        }>
      }
      admin_platform_stats: {
        Args: { p_from?: string; p_to?: string }
        Returns: Json
      }
      custom_access_token_hook: {
        Args: { event: Json }
        Returns: Json
      }
    }
  }
}
