-- Fix circular dependency between trips and trip_collaborators RLS policies.
-- Using SECURITY DEFINER functions prevents infinite recursion because the functions bypass RLS when querying the tables.

DROP POLICY IF EXISTS "Collaborators can view trips" ON public.trips;
DROP POLICY IF EXISTS "Owners can manage collaborators" ON public.trip_collaborators;
DROP POLICY IF EXISTS "Owners can view trip collaborators" ON public.trip_collaborators;

CREATE OR REPLACE FUNCTION public.is_trip_owner(check_trip_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM trips WHERE id = check_trip_id AND user_id = check_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_trip_collaborator(check_trip_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_collaborators WHERE trip_id = check_trip_id AND user_id = check_user_id AND accepted = true
  );
$$;

CREATE POLICY "Collaborators can view trips"
ON public.trips
FOR SELECT
USING ( public.is_trip_collaborator(id, auth.uid()) );

CREATE POLICY "Owners can manage collaborators"
ON public.trip_collaborators
FOR ALL
USING ( public.is_trip_owner(trip_id, auth.uid()) );

CREATE POLICY "Owners can view trip collaborators"
ON public.trip_collaborators
FOR SELECT
USING ( public.is_trip_owner(trip_id, auth.uid()) );
