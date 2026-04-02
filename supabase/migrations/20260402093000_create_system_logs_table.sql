-- ============================================
-- SYSTEM LOGS (Upgraded for observability)
-- ============================================
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  status TEXT,
  payload JSONB,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist if table was pre-existing
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_logs' AND column_name = 'request_id') THEN
        ALTER TABLE public.system_logs ADD COLUMN request_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_logs' AND column_name = 'payload') THEN
        ALTER TABLE public.system_logs ADD COLUMN payload JSONB;
    END IF;
END $$;

-- Index for traceability
CREATE INDEX IF NOT EXISTS idx_system_logs_request_id ON public.system_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON public.system_logs(user_id);

-- RLS: Only admins can view logs
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view all logs" ON public.system_logs;
CREATE POLICY "Admins can view all logs" ON public.system_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
