-- ============================================================
-- NIKATO · Migration 005 · RPC Functions
-- Helper functions called by Edge Functions
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Atomic stock decrement (fails if insufficient stock)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.decrement_stock(
  p_product_id uuid,
  p_quantity    integer
)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  new_stock integer;
BEGIN
  UPDATE public.products
  SET stock = stock - p_quantity,
      updated_at = now()
  WHERE id = p_product_id
    AND stock >= p_quantity
  RETURNING stock INTO new_stock;

  IF new_stock IS NULL THEN
    RAISE EXCEPTION 'Insufficient stock for product %', p_product_id
      USING ERRCODE = 'P0001';
  END IF;

  RETURN new_stock;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- Atomic stock restore (on order cancel/reject)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.restore_stock(
  p_product_id uuid,
  p_quantity    integer
)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  new_stock integer;
BEGIN
  UPDATE public.products
  SET stock = stock + p_quantity,
      updated_at = now()
  WHERE id = p_product_id
  RETURNING stock INTO new_stock;

  RETURN COALESCE(new_stock, 0);
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- Generate order number (used in create-order Edge Fn)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text LANGUAGE sql AS $$
  SELECT 'NKT-' || TO_CHAR(NOW(), 'YYYY') ||
         LPAD(nextval('public.order_number_seq')::text, 4, '0');
$$;

-- ─────────────────────────────────────────────────────────────
-- RPC: get_shop_earnings — for shop earnings page
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_shop_earnings(
  p_shop_id uuid,
  p_from    date,
  p_to      date
)
RETURNS TABLE (
  period_revenue   numeric,
  commission_paid  numeric,
  net_earning      numeric,
  order_count      bigint
) LANGUAGE sql STABLE AS $$
  SELECT
    COALESCE(SUM(o.subtotal), 0)           AS period_revenue,
    COALESCE(SUM(o.commission_amount), 0)  AS commission_paid,
    COALESCE(SUM(o.shop_earning), 0)       AS net_earning,
    COUNT(*)                                AS order_count
  FROM public.orders o
  WHERE o.shop_id = p_shop_id
    AND o.status = 'delivered'
    AND o.created_at::date BETWEEN p_from AND p_to;
$$;

-- ─────────────────────────────────────────────────────────────
-- RPC: admin_platform_stats — for admin KPI dashboard
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_platform_stats(
  p_from date DEFAULT CURRENT_DATE - interval '30 days',
  p_to   date DEFAULT CURRENT_DATE
)
RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'gmv',              COALESCE(SUM(total_amount), 0),
    'total_orders',     COUNT(*),
    'delivered_orders', COUNT(*) FILTER (WHERE status = 'delivered'),
    'cancelled_orders', COUNT(*) FILTER (WHERE status IN ('cancelled','rejected')),
    'total_commission', COALESCE(SUM(commission_amount), 0)
  )
  INTO result
  FROM public.orders
  WHERE created_at::date BETWEEN p_from AND p_to;

  RETURN result;
END;
$$;
