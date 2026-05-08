-- ============================================================
-- NIKATO · Migration 002 · PostGIS Setup
-- Requires PostGIS extension. Run AFTER 001_initial_schema.sql
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- ENABLE EXTENSION
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;

-- ─────────────────────────────────────────────────────────────
-- ADD GEOGRAPHY COLUMN TO SHOPS
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

-- ─────────────────────────────────────────────────────────────
-- GIST INDEX FOR FAST RADIUS QUERIES
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS shops_location_gix
  ON public.shops USING GIST (location);

-- ─────────────────────────────────────────────────────────────
-- TRIGGER: Auto-sync location from lat/lng on INSERT or UPDATE
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_shop_location()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shop_location_trigger ON public.shops;
CREATE TRIGGER shop_location_trigger
  BEFORE INSERT OR UPDATE OF lat, lng ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.sync_shop_location();

-- ─────────────────────────────────────────────────────────────
-- BACKFILL: populate location for any existing rows
-- ─────────────────────────────────────────────────────────────
UPDATE public.shops
SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
WHERE location IS NULL;

-- ─────────────────────────────────────────────────────────────
-- RPC: nearby_shops
-- Called by Edge Function nearby-shops as a fallback / direct RPC
-- Parameters: p_lat float8, p_lng float8, p_radius_m float8
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.nearby_shops(
  p_lat      float8,
  p_lng      float8,
  p_radius_m float8 DEFAULT 5000
)
RETURNS TABLE (
  id                    uuid,
  owner_id              uuid,
  name                  text,
  description           text,
  logo_url              text,
  phone                 text,
  address_line          text,
  city                  text,
  pincode               text,
  lat                   float8,
  lng                   float8,
  delivery_radius_km    float4,
  is_open               boolean,
  is_delivery_available boolean,
  min_order_amount      numeric,
  avg_delivery_minutes  integer,
  commission_rate       float4,
  is_approved           boolean,
  created_at            timestamptz,
  updated_at            timestamptz,
  distance_m            float8
)
LANGUAGE sql STABLE AS $$
  SELECT
    s.id, s.owner_id, s.name, s.description, s.logo_url,
    s.phone, s.address_line, s.city, s.pincode,
    s.lat, s.lng,
    s.delivery_radius_km, s.is_open, s.is_delivery_available,
    s.min_order_amount, s.avg_delivery_minutes,
    s.commission_rate, s.is_approved,
    s.created_at, s.updated_at,
    ST_Distance(
      s.location,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    ) AS distance_m
  FROM public.shops s
  WHERE
    s.is_approved = true
    AND ST_DWithin(
      s.location,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      p_radius_m
    )
  ORDER BY distance_m ASC;
$$;

-- ─────────────────────────────────────────────────────────────
-- RPC: check_delivery_availability
-- Returns true if customer coords are within shop's delivery radius
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_delivery_availability(
  p_shop_id   uuid,
  p_cust_lat  float8,
  p_cust_lng  float8
)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT ST_DWithin(
    s.location,
    ST_SetSRID(ST_MakePoint(p_cust_lng, p_cust_lat), 4326)::geography,
    s.delivery_radius_km * 1000
  )
  FROM public.shops s
  WHERE s.id = p_shop_id;
$$;
