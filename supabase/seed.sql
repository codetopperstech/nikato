-- ============================================================
-- NIKATO · supabase/seed.sql · Development Seed Data
-- Applied automatically by: supabase db reset
-- DO NOT run in production — dev data only
-- ============================================================

-- NOTE: These UUIDs must match actual auth.users rows.
-- For local dev, the test_otp entries in config.toml allow
-- signing in with these phones using OTP "000000".

-- ─────────────────────────────────────────────────────────────
-- Auth users (must exist before profiles FK can be satisfied)
-- ─────────────────────────────────────────────────────────────
INSERT INTO auth.users (instance_id, id, aud, role, phone, phone_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, encrypted_password)
VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', '+919000000001', now(), now(), now(), '{"provider":"phone","providers":["phone"]}', '{}', false, ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', '+919000000002', now(), now(), now(), '{"provider":"phone","providers":["phone"]}', '{}', false, ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', '+919000000003', now(), now(), now(), '{"provider":"phone","providers":["phone"]}', '{}', false, ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', '+919000000004', now(), now(), now(), '{"provider":"phone","providers":["phone"]}', '{}', false, '')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- Profiles
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.profiles (id, phone, full_name, role) VALUES
  ('00000000-0000-0000-0000-000000000001', '+919000000001', 'Nikato Admin',    'admin'),
  ('00000000-0000-0000-0000-000000000002', '+919000000002', 'Ravi Shop Owner', 'shop_owner'),
  ('00000000-0000-0000-0000-000000000003', '+919000000003', 'Priya Customer',  'customer'),
  ('00000000-0000-0000-0000-000000000004', '+919000000004', 'Arjun Delivery',  'delivery')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- Shop (Mumbai · Bandra West)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.shops (
  id, owner_id, name, description, phone,
  address_line, city, pincode, lat, lng,
  delivery_radius_km, is_open, is_approved, commission_rate, min_order_amount
) VALUES (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  'Ravi Kirana Store',
  'Fresh groceries and daily essentials delivered fast',
  '+919000000002',
  '14, Linking Road, Bandra West', 'Mumbai', '400050',
  19.0590, 72.8295, 5.0, true, true, 0.10, 100
) ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- Categories
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.categories (id, shop_id, name, sort_order) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Fruits & Vegetables', 1),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Dairy & Eggs',        2),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Snacks',              3)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- Products
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.products (id, shop_id, category_id, name, price, mrp, stock, unit, is_available, is_veg) VALUES
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Tomatoes',              25.00, 30.00,  50, 'kg',    true, true),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Onions',                30.00, 35.00,  40, 'kg',    true, true),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Amul Full Cream Milk', 28.00, 30.00,  30, '500ml', true, true),
  ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Farm Fresh Eggs',      72.00, 80.00,  20, '12pc',  true, true),
  ('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'Lays Classic',         20.00, 20.00, 100, 'piece', true, true)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- Customer address (within shop delivery radius)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.addresses (id, user_id, label, address_line, city, pincode, lat, lng, is_default) VALUES
  ('40000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000003',
   'Home', 'Flat 4B, Shanti Apartments, Hill Road, Bandra West',
   'Mumbai', '400050', 19.0570, 72.8310, true)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- Delivery partner location (online, near shop)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.delivery_locations (delivery_partner_id, lat, lng, is_online) VALUES
  ('00000000-0000-0000-0000-000000000004', 19.0580, 72.8300, true)
ON CONFLICT (delivery_partner_id) DO UPDATE SET
  lat = EXCLUDED.lat, lng = EXCLUDED.lng, is_online = EXCLUDED.is_online;
