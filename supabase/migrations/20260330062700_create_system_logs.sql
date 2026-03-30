-- Migration: Create System Logs Table for debugging

CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
    source TEXT NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Grant permissions for service_role only (Edge functions with service key)
GRANT ALL ON public.system_logs TO service_role;

-- We intentionally DO NOT create any policies for 'anon' or 'authenticated' roles 
-- so that users cannot view or manipulate the internal system logs. 
-- Only Supabase dashboard admins and edge functions (via Service Role) can access this.
