DROP POLICY IF EXISTS "Collaborators can view all trip collaborators" ON public.trip_collaborators;
CREATE POLICY "Collaborators can view all trip collaborators"
ON public.trip_collaborators FOR SELECT
USING (
  public.is_trip_collaborator(trip_id, auth.uid())
);
