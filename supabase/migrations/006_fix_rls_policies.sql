-- ─────────────────────────────────────────────────────────────
-- FIX 1: Delivery partner can see 'ready' orders (no partner assigned yet)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "orders_select" ON public.orders;
CREATE POLICY "orders_select" ON public.orders
  FOR SELECT TO authenticated
  USING (
    customer_id = auth.uid()
    OR delivery_partner_id = auth.uid()
    OR public.get_my_role() = 'admin'
    OR public.get_my_role() = 'delivery'  -- ✅ delivery can see ready unassigned orders
    OR EXISTS (
      SELECT 1 FROM public.shops s
      WHERE s.id = shop_id AND s.owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- FIX 2: Shop owner can INSERT their own products (WITH CHECK was missing)
-- ─────────────────────────────────────────────────────────────
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
-- FIX 3: Shop owner can INSERT/UPDATE categories (WITH CHECK was missing)
-- ─────────────────────────────────────────────────────────────
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
-- FIX 4: Shop owner can UPDATE their own shop settings
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "shops_write" ON public.shops;
CREATE POLICY "shops_write" ON public.shops
  FOR ALL TO authenticated
  USING (
    owner_id = auth.uid()
    OR public.get_my_role() = 'admin'
  )
  WITH CHECK (
    owner_id = auth.uid()
    OR public.get_my_role() = 'admin'
  );

-- ─────────────────────────────────────────────────────────────
-- FIX 5: Admin can see ALL orders, profiles, shops
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.get_my_role() = 'admin'
    OR public.get_my_role() = 'shop_owner'  -- shop owner can see customer names
    OR public.get_my_role() = 'delivery'    -- delivery can see customer info
  );
