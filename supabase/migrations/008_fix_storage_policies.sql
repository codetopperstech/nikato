-- Fix: replace get_my_role() with direct subquery in storage policies
-- get_my_role() causes stack depth exceeded (54001) in storage context

DROP POLICY IF EXISTS "product_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_images_delete" ON storage.objects;
DROP POLICY IF EXISTS "shop_images_insert"    ON storage.objects;
DROP POLICY IF EXISTS "shop_images_delete"    ON storage.objects;

-- ✅ Use direct subquery instead of get_my_role()
CREATE POLICY "product_images_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('shop_owner', 'admin')
    )
  );

CREATE POLICY "product_images_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('shop_owner', 'admin')
    )
  );

CREATE POLICY "shop_images_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'shop-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('shop_owner', 'admin')
    )
  );

CREATE POLICY "shop_images_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'shop-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('shop_owner', 'admin')
    )
  );
