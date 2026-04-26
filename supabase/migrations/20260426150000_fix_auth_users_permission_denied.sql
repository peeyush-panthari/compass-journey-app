-- Fix "permission denied for table users" in trip_collaborators RLS policies.
-- Direct queries to auth.users are not allowed for the authenticated role.
-- We must use auth.jwt() ->> 'email' instead.

DROP POLICY IF EXISTS "Users can update own invitations" ON public.trip_collaborators;
DROP POLICY IF EXISTS "Users can view own collaborations" ON public.trip_collaborators;

CREATE POLICY "Users can update own invitations"
ON public.trip_collaborators
FOR UPDATE
USING (
  user_id = auth.uid() OR email = (auth.jwt() ->> 'email')
);

CREATE POLICY "Users can view own collaborations"
ON public.trip_collaborators
FOR SELECT
USING (
  user_id = auth.uid() OR email = (auth.jwt() ->> 'email')
);
