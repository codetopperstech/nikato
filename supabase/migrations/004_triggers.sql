-- ============================================================
-- NIKATO · Migration 004 · Triggers & DB Functions
-- Run AFTER 001, 002, 003
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. AUTH HOOK: Create profile on new user sign-up
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.phone, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- 2. JWT CUSTOM CLAIMS HOOK
-- Injects user_role into access token claims
-- Register this in Supabase dashboard: Auth → Hooks → Custom access token
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  _role text;
BEGIN
  SELECT role INTO _role
  FROM public.profiles
  WHERE id = (event->>'user_id')::uuid;

  RETURN jsonb_set(event, '{claims,user_role}', to_jsonb(COALESCE(_role, 'customer')));
END;
$$;

-- Grant execute to supabase_auth_admin for the hook
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- ─────────────────────────────────────────────────────────────
-- 3. updated_at auto-update trigger (generic)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Apply to tables with updated_at
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS shops_updated_at ON public.shops;
CREATE TRIGGER shops_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS payments_updated_at ON public.payments;
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 4. PRODUCT STOCK: Auto disable/enable is_available
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.auto_disable_zero_stock()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.stock = 0 THEN
    NEW.is_available := false;
  ELSIF NEW.stock > 0 AND OLD.stock = 0 THEN
    NEW.is_available := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS product_stock_trigger ON public.products;
CREATE TRIGGER product_stock_trigger
  BEFORE UPDATE OF stock ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.auto_disable_zero_stock();

-- ─────────────────────────────────────────────────────────────
-- 5. ORDER STATUS CHANGE: Broadcast via pg_notify
-- Supabase Realtime picks this up and forwards to subscribed clients
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_order_change()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_notify(
    'order_updates',
    json_build_object(
      'order_id',           NEW.id,
      'order_number',       NEW.order_number,
      'status',             NEW.status,
      'payment_status',     NEW.payment_status,
      'shop_id',            NEW.shop_id,
      'customer_id',        NEW.customer_id,
      'delivery_partner_id',NEW.delivery_partner_id
    )::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS order_change_trigger ON public.orders;
CREATE TRIGGER order_change_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status
     OR OLD.payment_status IS DISTINCT FROM NEW.payment_status
     OR OLD.delivery_partner_id IS DISTINCT FROM NEW.delivery_partner_id)
  EXECUTE FUNCTION public.notify_order_change();

-- ─────────────────────────────────────────────────────────────
-- 6. SHOP ANALYTICS: Upsert daily stats when order is delivered
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_shop_analytics()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- When order becomes 'delivered', add to analytics
  IF NEW.status = 'delivered' AND OLD.status <> 'delivered' THEN
    INSERT INTO public.shop_analytics (shop_id, date, orders_count, revenue)
    VALUES (NEW.shop_id, CURRENT_DATE, 1, NEW.total_amount)
    ON CONFLICT (shop_id, date)
    DO UPDATE SET
      orders_count = shop_analytics.orders_count + 1,
      revenue      = shop_analytics.revenue + EXCLUDED.revenue;
  END IF;

  -- When order becomes 'cancelled' or 'rejected', increment cancelled
  IF NEW.status IN ('cancelled','rejected') AND OLD.status NOT IN ('cancelled','rejected') THEN
    INSERT INTO public.shop_analytics (shop_id, date, orders_count, revenue, cancelled)
    VALUES (NEW.shop_id, CURRENT_DATE, 0, 0, 1)
    ON CONFLICT (shop_id, date)
    DO UPDATE SET
      cancelled = shop_analytics.cancelled + 1;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS order_analytics_trigger ON public.orders;
CREATE TRIGGER order_analytics_trigger
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_shop_analytics();

-- ─────────────────────────────────────────────────────────────
-- 7. ENSURE SINGLE DEFAULT ADDRESS per user
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.ensure_single_default_address()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.addresses
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND id <> NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS single_default_address_trigger ON public.addresses;
CREATE TRIGGER single_default_address_trigger
  BEFORE INSERT OR UPDATE OF is_default ON public.addresses
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION public.ensure_single_default_address();

-- ─────────────────────────────────────────────────────────────
-- 8. COMMISSION RECORD: Auto-insert on order delivered
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.record_commission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status <> 'delivered' THEN
    INSERT INTO public.commissions (shop_id, order_id, rate, amount)
    VALUES (NEW.shop_id, NEW.id, NEW.commission_amount / NULLIF(NEW.subtotal, 0), NEW.commission_amount)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS order_commission_trigger ON public.orders;
CREATE TRIGGER order_commission_trigger
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.record_commission();

-- ─────────────────────────────────────────────────────────────
-- 9. COD PAYMENT: Auto-set payment_status=paid on delivered
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_cod_payment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'delivered'
    AND OLD.status <> 'delivered'
    AND NEW.payment_method = 'COD'
  THEN
    NEW.payment_status := 'paid';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cod_payment_trigger ON public.orders;
CREATE TRIGGER cod_payment_trigger
  BEFORE UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_cod_payment();
