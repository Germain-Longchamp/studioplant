CREATE TABLE IF NOT EXISTS public.admin_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  admin_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id   TEXT,
  metadata    JSONB DEFAULT '{}',
  ip_address  TEXT
);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aucun accès client"
  ON public.admin_logs
  FOR ALL
  USING (false);
