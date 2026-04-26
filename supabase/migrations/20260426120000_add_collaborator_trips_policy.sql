-- Add the missing collaborator SELECT policy on the trips table.
-- Without this, users with accepted trip_collaborators entries could not
-- fetch trip details — the trips_select_own policy only allows owners.
DROP POLICY IF EXISTS "Collaborators can view trips" ON public.trips;
CREATE POLICY "Collaborators can view trips"
ON public.trips
FOR SELECT
USING (
  id IN (
    SELECT trip_id FROM public.trip_collaborators
    WHERE user_id = auth.uid() AND accepted = true
  )
);
