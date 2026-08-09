-- NIKATO · Migration 010 · Partner Requests
CREATE TABLE IF NOT EXISTS public.partner_requests (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name      text        NOT NULL,
  owner_name     text        NOT NULL,
  phone          text        NOT NULL,
  city           text        NOT NULL,
  business_type  text        NOT NULL,
  message        text,
  status         text        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','contacted','approved','rejected')),
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit partner request"
  ON public.partner_requests FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can manage partner requests"
  ON public.partner_requests FOR ALL USING (true);
