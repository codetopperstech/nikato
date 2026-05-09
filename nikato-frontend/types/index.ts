// ============================================================
// NIKATO — types/index.ts
// Auto-aligned with Blueprint Section 03 (Database Schema)
// ============================================================

export type UserRole = 'customer' | 'shop_owner' | 'delivery' | 'admin';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'delivered'
  | 'cancelled'
  | 'rejected';

export type PaymentMethod = 'COD' | 'ONLINE';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type NotificationType = 'ORDER_UPDATE' | 'PROMO' | 'SYSTEM';

export type DeliveryAssignmentStatus =
  | 'assigned'
  | 'picked_up'
  | 'delivered'
  | 'failed';

export type PaymentGatewayStatus =
  | 'created'
  | 'captured'
  | 'failed'
  | 'refunded';

// ── Database Row Types ──────────────────────────────────────

export interface Profile {
  id: string;
  phone: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  fcm_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  address_line: string;
  city: string;
  pincode: string;
  lat: number;
  lng: number;
  is_default: boolean;
  created_at: string;
}

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  phone: string;
  address_line: string;
  city: string;
  pincode: string;
  lat: number;
  lng: number;
  delivery_radius_km: number;
  is_open: boolean;
  is_delivery_available: boolean;
  min_order_amount: number;
  avg_delivery_minutes: number;
  commission_rate: number;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  // Computed by nearby-shops Edge Fn
  distance_m?: number;
}

export interface Category {
  id: string;
  shop_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  shop_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  mrp: number | null;
  stock: number;
  unit: string;
  is_available: boolean;
  is_veg: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  shop_id: string;
  delivery_partner_id: string | null;
  delivery_address_id: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total_amount: number;
  commission_amount: number;
  shop_earning: number;
  delivery_earning: number;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  special_instructions: string | null;
  cancelled_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_name: string;
  product_image: string | null;
}

export interface DeliveryLocation {
  id: string;
  delivery_partner_id: string;
  lat: number;
  lng: number;
  is_online: boolean;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: NotificationType;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

// ── API Types (Section 06) ──────────────────────────────────

export interface ApiSuccess<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: {
    code: string;
    message: string;
  };
}

export interface ApiPaginated<T> {
  data: T[];
  count: number;
  page: number;
  per_page: number;
  error: null;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Edge Function request/response types

export interface NearbyShopsRequest {
  lat: number;
  lng: number;
  radius_km: number;
}

export interface NearbyShopsResponse {
  shops: Shop[];
}

export interface CreateOrderRequest {
  cart: Array<{ product_id: string; quantity: number }>;
  address_id: string;
  payment_method: PaymentMethod;
  special_instructions?: string;
}

export interface CreateOrderResponse {
  order_id: string;
  razorpay_order_id?: string;
}

export interface PaymentInitRequest {
  order_id: string;
}

export interface PaymentInitResponse {
  razorpay_order_id: string;
  key_id: string;
}

export interface PaymentVerifyRequest {
  order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentVerifyResponse {
  success: boolean;
}

// ── Frontend-only Types ──────────────────────────────────────

export interface CartItem {
  product_id: string;
  product_name: string;
  product_image: string | null;
  price: number;
  quantity: number;
  unit: string;
  is_veg: boolean;
}

export interface Coords {
  lat: number;
  lng: number;
}

export interface ProductsByCategory {
  category: Category;
  products: Product[];
}

// ── Error Codes (Section 21) ────────────────────────────────

export type ApiErrorCode =
  | 'SHOP_CLOSED'
  | 'NO_DELIVERY'
  | 'OUT_OF_STOCK'
  | 'MIN_ORDER'
  | 'CROSS_SHOP_CART'
  | 'PAYMENT_FAILED'
  | 'ORDER_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'VALIDATION_ERROR';
