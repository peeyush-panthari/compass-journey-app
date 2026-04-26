-- Fix infinite recursion in trip_collaborators RLS policies.
-- The policies "Users can view collaborators of their trips" and
-- "Trip owners and editors can insert collaborators" both referenced
-- the trip_collaborators table from within a trip_collaborators policy,
-- causing PostgreSQL to detect infinite recursion.

-- Remove the recursive policies
DROP POLICY IF EXISTS "Users can view collaborators of their trips" ON public.trip_collaborators;
DROP POLICY IF EXISTS "Trip owners and editors can insert collaborators" ON public.trip_collaborators;

-- Replace INSERT policy with a safe, non-recursive owner-only check
DROP POLICY IF EXISTS "Trip owners can insert collaborators" ON public.trip_collaborators;
CREATE POLICY "Trip owners can insert collaborators"
ON public.trip_collaborators
FOR INSERT
WITH CHECK (
  trip_id IN (
    SELECT id FROM public.trips WHERE user_id = auth.uid()
  )
);
-- Note: SELECT access for collaborators is already handled by the existing
-- "Users can view own collaborations" policy (auth.uid() = user_id OR email match),
-- which does not cause recursion.
