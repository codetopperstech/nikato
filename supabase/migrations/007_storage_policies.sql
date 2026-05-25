-- ─────────────────────────────────────────────────────────────
-- Storage RLS: only shop_owner + admin can upload images
-- ─────────────────────────────────────────────────────────────

-- Drop existing loose policies if any
DROP POLICY IF EXISTS "product_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_images_select" ON storage.objects;
DROP POLICY IF EXISTS "shop_images_insert"   ON storage.objects;
DROP POLICY IF EXISTS "shop_images_select"   ON storage.objects;

-- Product images: only shop_owner or admin can upload
CREATE POLICY "product_images_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (public.get_my_role() = 'shop_owner' OR public.get_my_role() = 'admin')
  );

-- Product images: public read
CREATE POLICY "product_images_select" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'product-images');

-- Product images: owner can delete their own
CREATE POLICY "product_images_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (public.get_my_role() = 'shop_owner' OR public.get_my_role() = 'admin')
  );

-- Shop images: only shop_owner or admin can upload
CREATE POLICY "shop_images_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'shop-images'
    AND (public.get_my_role() = 'shop_owner' OR public.get_my_role() = 'admin')
  );

-- Shop images: public read
CREATE POLICY "shop_images_select" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'shop-images');

-- Shop images: owner can delete
CREATE POLICY "shop_images_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'shop-images'
    AND (public.get_my_role() = 'shop_owner' OR public.get_my_role() = 'admin')
  );
