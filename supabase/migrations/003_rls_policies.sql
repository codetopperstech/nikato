-- ============================================================
-- NIKATO · Migration 003 · Row Level Security Policies
-- Run AFTER 001 and 002. Enables RLS on all tables and sets
-- per-role policies exactly as defined in Blueprint Section 04.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- HELPER: extract user role from JWT custom claim
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'claims' ->> 'user_role'),
    (SELECT role FROM public.profiles WHERE id = auth.uid())
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- ENABLE RLS on every table
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_locations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_analytics       ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- service_role bypass (Edge Functions use service key, bypass RLS automatically)

-- ─────────────────────────────────────────────────────────────
-- ADDRESSES
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "addresses_all" ON public.addresses;
CREATE POLICY "addresses_all" ON public.addresses
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- SHOPS
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "shops_select_public" ON public.shops;
CREATE POLICY "shops_select_public" ON public.shops
  FOR SELECT TO anon, authenticated
  USING (is_approved = true);

-- shop owner can see their own shop even if not yet approved
DROP POLICY IF EXISTS "shops_select_owner" ON public.shops;
CREATE POLICY "shops_select_owner" ON public.shops
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "shops_update" ON public.shops;
CREATE POLICY "shops_update" ON public.shops
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.get_my_role() = 'admin')
  WITH CHECK (owner_id = auth.uid() OR public.get_my_role() = 'admin');

-- Only admin can INSERT shops (shop owner accounts created by admin)
DROP POLICY IF EXISTS "shops_insert_admin" ON public.shops;
CREATE POLICY "shops_insert_admin" ON public.shops
  FOR INSERT TO authenticated
  WITH CHECK (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "shops_delete_admin" ON public.shops;
CREATE POLICY "shops_delete_admin" ON public.shops
  FOR DELETE TO authenticated
  USING (public.get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- CATEGORIES
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "categories_select" ON public.categories;
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "categories_write" ON public.categories;
CREATE POLICY "categories_write" ON public.categories
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shops s
      WHERE s.id = shop_id AND s.owner_id = auth.uid()
    )
    OR public.get_my_role() = 'admin'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shops s
      WHERE s.id = shop_id AND s.owner_id = auth.uid()
    )
    OR public.get_my_role() = 'admin'
  );

-- ─────────────────────────────────────────────────────────────
-- PRODUCTS
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "products_select" ON public.products;
CREATE POLICY "products_select" ON public.products
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shops s
      WHERE s.id = shop_id AND s.is_approved = true
    )
    AND is_available = true
  );

-- Shop owners can see all their products (incl. unavailable)
DROP POLICY IF EXISTS "products_select_owner" ON public.products;
CREATE POLICY "products_select_owner" ON public.products
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shops s
      WHERE s.id = shop_id AND s.owner_id = auth.uid()
    )
    OR public.get_my_role() = 'admin'
  );

DROP POLICY IF EXISTS "products_write" ON public.products;
CREATE POLICY "products_write" ON public.products
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shops s
      WHERE s.id = shop_id AND s.owner_id = auth.uid()
    )
    OR public.get_my_role() = 'admin'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shops s
      WHERE s.id = shop_id AND s.owner_id = auth.uid()
    )
    OR public.get_my_role() = 'admin'
  );

-- ─────────────────────────────────────────────────────────────
-- ORDERS
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "orders_insert" ON public.orders;
CREATE POLICY "orders_insert" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "orders_select" ON public.orders;
CREATE POLICY "orders_select" ON public.orders
  FOR SELECT TO authenticated
  USING (
    customer_id = auth.uid()
    OR delivery_partner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.shops s
      WHERE s.id = shop_id AND s.owner_id = auth.uid()
    )
    OR public.get_my_role() = 'admin'
  );

DROP POLICY IF EXISTS "orders_update" ON public.orders;
CREATE POLICY "orders_update" ON public.orders
  FOR UPDATE TO authenticated
  USING (
    delivery_partner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.shops s
      WHERE s.id = shop_id AND s.owner_id = auth.uid()
    )
    OR public.get_my_role() = 'admin'
  )
  WITH CHECK (
    delivery_partner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.shops s
      WHERE s.id = shop_id AND s.owner_id = auth.uid()
    )
    OR public.get_my_role() = 'admin'
  );

-- ─────────────────────────────────────────────────────────────
-- ORDER ITEMS
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
CREATE POLICY "order_items_select" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND (
          o.customer_id = auth.uid()
          OR o.delivery_partner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.shops s
            WHERE s.id = o.shop_id AND s.owner_id = auth.uid()
          )
          OR public.get_my_role() = 'admin'
        )
    )
  );

-- INSERT via service_role only (Edge Function create-order)
DROP POLICY IF EXISTS "order_items_insert_service" ON public.order_items;
-- NOTE: service_role bypasses RLS; no explicit policy needed.
-- Customers cannot insert order_items directly.

-- ─────────────────────────────────────────────────────────────
-- DELIVERY ASSIGNMENTS
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "delivery_assignments_select" ON public.delivery_assignments;
CREATE POLICY "delivery_assignments_select" ON public.delivery_assignments
  FOR SELECT TO authenticated
  USING (
    delivery_partner_id = auth.uid()
    OR public.get_my_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.shops s ON s.id = o.shop_id
      WHERE o.id = order_id AND s.owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- DELIVERY LOCATIONS
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "delivery_locations_select" ON public.delivery_locations;
CREATE POLICY "delivery_locations_select" ON public.delivery_locations
  FOR SELECT TO authenticated
  USING (true); -- all authenticated users can see for map display

DROP POLICY IF EXISTS "delivery_locations_write" ON public.delivery_locations;
CREATE POLICY "delivery_locations_write" ON public.delivery_locations
  FOR ALL TO authenticated
  USING (delivery_partner_id = auth.uid())
  WITH CHECK (delivery_partner_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- INSERT via service_role only (Edge Function send-notification)

-- ─────────────────────────────────────────────────────────────
-- PAYMENTS
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "payments_select" ON public.payments;
CREATE POLICY "payments_select" ON public.payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND (
          o.customer_id = auth.uid()
          OR public.get_my_role() = 'admin'
        )
    )
  );

-- INSERT/UPDATE via service_role only

-- ─────────────────────────────────────────────────────────────
-- COMMISSIONS
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "commissions_select" ON public.commissions;
CREATE POLICY "commissions_select" ON public.commissions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shops s
      WHERE s.id = shop_id AND s.owner_id = auth.uid()
    )
    OR public.get_my_role() = 'admin'
  );

-- INSERT via service_role only

-- ─────────────────────────────────────────────────────────────
-- SHOP ANALYTICS
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "shop_analytics_select" ON public.shop_analytics;
CREATE POLICY "shop_analytics_select" ON public.shop_analytics
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shops s
      WHERE s.id = shop_id AND s.owner_id = auth.uid()
    )
    OR public.get_my_role() = 'admin'
  );
