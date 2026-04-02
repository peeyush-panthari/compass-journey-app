-- ============================================
-- SYSTEM LOGS (Final Fix for Observability)
-- ============================================
DROP TABLE IF EXISTS public.system_logs CASCADE;

CREATE TABLE public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT,
  user_id UUID,                     -- Removed foreign key to avoid issues during debugging
  event_type TEXT NOT NULL,         -- REQUEST_INBOUND, AI_TRIGGER, AI_RESPONSE, DB_PERSISTENCE, ERROR
  status TEXT,                      -- success, error, pending
  payload JSONB,                    -- Raw request or response data
  message TEXT,                     -- Human readable summary
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for traceability
CREATE INDEX idx_system_logs_request_id ON public.system_logs(request_id);
CREATE INDEX idx_system_logs_created_at ON public.system_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Access" ON public.system_logs FOR SELECT USING (true);
CREATE POLICY "Public Insert Access" ON public.system_logs FOR INSERT WITH CHECK (true);
