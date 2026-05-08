-- ============================================================
-- NIKATO · Migration 001 · Initial Schema
-- Run this FIRST before any other migration
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone       text        UNIQUE NOT NULL,
  full_name   text        NOT NULL DEFAULT '',
  email       text,
  avatar_url  text,
  role        text        NOT NULL DEFAULT 'customer'
                          CHECK (role IN ('customer','shop_owner','delivery','admin')),
  is_active   boolean     NOT NULL DEFAULT true,
  fcm_token   text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- ADDRESSES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.addresses (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label         text        NOT NULL DEFAULT 'Home',
  address_line  text        NOT NULL,
  city          text        NOT NULL,
  pincode       text        NOT NULL,
  lat           float8      NOT NULL,
  lng           float8      NOT NULL,
  is_default    boolean     NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- SHOPS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shops (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id              uuid        NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  name                  text        NOT NULL,
  description           text,
  logo_url              text,
  phone                 text        NOT NULL,
  address_line          text        NOT NULL,
  city                  text        NOT NULL,
  pincode               text        NOT NULL,
  lat                   float8      NOT NULL,
  lng                   float8      NOT NULL,
  -- location (geography) added in 002_postgis_setup.sql
  delivery_radius_km    float4      NOT NULL DEFAULT 5.0,
  is_open               boolean     NOT NULL DEFAULT false,
  is_delivery_available boolean     NOT NULL DEFAULT true,
  min_order_amount      numeric(10,2) NOT NULL DEFAULT 0,
  avg_delivery_minutes  integer     NOT NULL DEFAULT 30,
  commission_rate       float4      NOT NULL DEFAULT 0.10,
  is_approved           boolean     NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- CATEGORIES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     uuid        NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  sort_order  integer     NOT NULL DEFAULT 0,
  is_active   boolean     NOT NULL DEFAULT true
);

-- ─────────────────────────────────────────────────────────────
-- PRODUCTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id       uuid          NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  category_id   uuid          REFERENCES public.categories(id) ON DELETE SET NULL,
  name          text          NOT NULL,
  description   text,
  image_url     text,
  price         numeric(10,2) NOT NULL CHECK (price >= 0),
  mrp           numeric(10,2) CHECK (mrp >= 0),
  stock         integer       NOT NULL DEFAULT 0 CHECK (stock >= 0),
  unit          text          NOT NULL DEFAULT 'piece',
  is_available  boolean       NOT NULL DEFAULT true,
  is_veg        boolean       NOT NULL DEFAULT true,
  sort_order    integer       NOT NULL DEFAULT 0,
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- ORDERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number          text          UNIQUE NOT NULL,
  customer_id           uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shop_id               uuid          NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  delivery_partner_id   uuid          REFERENCES public.profiles(id) ON DELETE SET NULL,
  delivery_address_id   uuid          NOT NULL REFERENCES public.addresses(id) ON DELETE RESTRICT,
  status                text          NOT NULL DEFAULT 'pending'
                                      CHECK (status IN (
                                        'pending','confirmed','preparing','ready',
                                        'picked_up','delivered','cancelled','rejected'
                                      )),
  payment_method        text          NOT NULL CHECK (payment_method IN ('COD','ONLINE')),
  payment_status        text          NOT NULL DEFAULT 'pending'
                                      CHECK (payment_status IN ('pending','paid','failed','refunded')),
  subtotal              numeric(10,2) NOT NULL,
  delivery_fee          numeric(10,2) NOT NULL DEFAULT 0,
  discount              numeric(10,2) NOT NULL DEFAULT 0,
  total_amount          numeric(10,2) NOT NULL,
  commission_amount     numeric(10,2) NOT NULL,
  shop_earning          numeric(10,2) NOT NULL,
  delivery_earning      numeric(10,2) NOT NULL DEFAULT 0,
  razorpay_order_id     text,
  razorpay_payment_id   text,
  special_instructions  text,
  cancelled_reason      text,
  created_at            timestamptz   NOT NULL DEFAULT now(),
  updated_at            timestamptz   NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- ORDER ITEMS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       uuid          NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id     uuid          NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity       integer       NOT NULL CHECK (quantity > 0),
  unit_price     numeric(10,2) NOT NULL,
  total_price    numeric(10,2) NOT NULL,
  product_name   text          NOT NULL,
  product_image  text
);

-- ─────────────────────────────────────────────────────────────
-- DELIVERY ASSIGNMENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.delivery_assignments (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            uuid          NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  delivery_partner_id uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at         timestamptz   NOT NULL DEFAULT now(),
  picked_up_at        timestamptz,
  delivered_at        timestamptz,
  delivery_fee        numeric(10,2) NOT NULL,
  status              text          NOT NULL DEFAULT 'assigned'
                                    CHECK (status IN ('assigned','picked_up','delivered','failed'))
);

-- ─────────────────────────────────────────────────────────────
-- DELIVERY LOCATIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.delivery_locations (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_partner_id uuid        NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  lat                 float8      NOT NULL,
  lng                 float8      NOT NULL,
  is_online           boolean     NOT NULL DEFAULT false,
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  body        text        NOT NULL,
  type        text        NOT NULL DEFAULT 'SYSTEM'
                          CHECK (type IN ('ORDER_UPDATE','PROMO','SYSTEM')),
  data        jsonb,
  is_read     boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- PAYMENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id                   uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             uuid          NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  razorpay_order_id    text          NOT NULL,
  razorpay_payment_id  text,
  razorpay_signature   text,
  amount               numeric(10,2) NOT NULL,
  currency             text          NOT NULL DEFAULT 'INR',
  status               text          NOT NULL DEFAULT 'created'
                                     CHECK (status IN ('created','captured','failed','refunded')),
  gateway_response     jsonb,
  created_at           timestamptz   NOT NULL DEFAULT now(),
  updated_at           timestamptz   NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- COMMISSIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.commissions (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     uuid          NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  order_id    uuid          NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rate        float4        NOT NULL,
  amount      numeric(10,2) NOT NULL,
  settled     boolean       NOT NULL DEFAULT false,
  settled_at  timestamptz,
  created_at  timestamptz   NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- SHOP ANALYTICS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shop_analytics (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id       uuid          NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  date          date          NOT NULL,
  orders_count  integer       NOT NULL DEFAULT 0,
  revenue       numeric(10,2) NOT NULL DEFAULT 0,
  cancelled     integer       NOT NULL DEFAULT 0,
  UNIQUE (shop_id, date)
);

-- ─────────────────────────────────────────────────────────────
-- INDEXES (performance)
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_addresses_user_id          ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_products_shop_id           ON public.products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id       ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id         ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop_id             ON public.orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_partner_id ON public.orders(delivery_partner_id);
CREATE INDEX IF NOT EXISTS idx_orders_status              ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at          ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id       ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id      ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read      ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_commissions_shop_id        ON public.commissions(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_analytics_shop_date   ON public.shop_analytics(shop_id, date DESC);

-- ─────────────────────────────────────────────────────────────
-- ORDER NUMBER SEQUENCE
-- ─────────────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text LANGUAGE sql AS $$
  SELECT 'NKT-' || TO_CHAR(NOW(), 'YYYY') || LPAD(nextval('public.order_number_seq')::text, 4, '0');
$$;
