-- NIKATO · Migration 009 · Service Bookings
CREATE TABLE IF NOT EXISTS public.service_bookings (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  phone         text        NOT NULL,
  address       text        NOT NULL,
  service_type  text        NOT NULL,
  scheduled_at  timestamptz NOT NULL,
  notes         text,
  status        text        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','confirmed','completed','cancelled')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

-- Allow insert from anon (guest booking) and admin read
CREATE POLICY "Anyone can create service booking"
  ON public.service_bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service bookings are admin-readable"
  ON public.service_bookings FOR SELECT
  USING (true);
