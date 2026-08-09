-- NIKATO · Migration 011 · Service Providers & Prices

-- Admin-configurable price per service type
CREATE TABLE IF NOT EXISTS public.service_prices (
  service_type  text        PRIMARY KEY,
  base_price    numeric(10,2) NOT NULL DEFAULT 0,
  unit          text        NOT NULL DEFAULT 'visit',
  updated_at    timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.service_prices (service_type, base_price, unit) VALUES
  ('plumber',      299, 'visit'),
  ('electrician',  349, 'visit'),
  ('beautician',   499, 'session'),
  ('carpenter',    399, 'visit'),
  ('painter',      299, 'visit'),
  ('pest-control', 599, 'visit')
ON CONFLICT (service_type) DO NOTHING;

ALTER TABLE public.service_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read prices"  ON public.service_prices FOR SELECT USING (true);
CREATE POLICY "Admin can manage prices" ON public.service_prices FOR ALL  USING (true);

-- Service providers (added by admin)
CREATE TABLE IF NOT EXISTS public.service_providers (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL,
  phone            text        NOT NULL,
  service_type     text        NOT NULL,
  city             text        NOT NULL,
  experience_years int         NOT NULL DEFAULT 0,
  is_available     boolean     NOT NULL DEFAULT true,
  rating           numeric(3,2) NOT NULL DEFAULT 4.50,
  jobs_done        int         NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read providers"  ON public.service_providers FOR SELECT USING (true);
CREATE POLICY "Admin can manage providers" ON public.service_providers FOR ALL  USING (true);

-- Add provider and price to existing service_bookings
ALTER TABLE public.service_bookings
  ADD COLUMN IF NOT EXISTS provider_id  uuid        REFERENCES public.service_providers(id),
  ADD COLUMN IF NOT EXISTS price        numeric(10,2);
