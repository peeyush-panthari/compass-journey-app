-- Ensure the live reservations table has the JSON-backed fields used by the Trip page.
-- Earlier columns were added to an already-applied migration, so Supabase did not rerun them.

ALTER TABLE public.reservations
ADD COLUMN IF NOT EXISTS fields jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE public.reservations
SET
  fields = COALESCE(
    fields,
    CASE
      WHEN details IS NOT NULL AND details ~ '^\s*\{' THEN details::jsonb
      ELSE '{}'::jsonb
    END
  ),
  attachments = COALESCE(attachments, '[]'::jsonb),
  updated_at = COALESCE(updated_at, created_at, now());

ALTER TABLE public.reservations
ALTER COLUMN fields SET DEFAULT '{}'::jsonb,
ALTER COLUMN fields SET NOT NULL,
ALTER COLUMN attachments SET DEFAULT '[]'::jsonb,
ALTER COLUMN attachments SET NOT NULL,
ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trip members can access reservations" ON public.reservations;
DROP POLICY IF EXISTS "Trip owners and collaborators can view reservations" ON public.reservations;
DROP POLICY IF EXISTS "Trip owners and collaborators can insert reservations" ON public.reservations;
DROP POLICY IF EXISTS "Trip owners and collaborators can update reservations" ON public.reservations;
DROP POLICY IF EXISTS "Trip owners and collaborators can delete reservations" ON public.reservations;

CREATE POLICY "Trip owners and collaborators can view reservations"
ON public.reservations FOR SELECT
USING (
  public.is_trip_owner(trip_id, auth.uid()) OR public.is_trip_collaborator(trip_id, auth.uid())
);

CREATE POLICY "Trip owners and collaborators can insert reservations"
ON public.reservations FOR INSERT
WITH CHECK (
  public.is_trip_owner(trip_id, auth.uid()) OR public.is_trip_collaborator(trip_id, auth.uid())
);

CREATE POLICY "Trip owners and collaborators can update reservations"
ON public.reservations FOR UPDATE
USING (
  public.is_trip_owner(trip_id, auth.uid()) OR public.is_trip_collaborator(trip_id, auth.uid())
)
WITH CHECK (
  public.is_trip_owner(trip_id, auth.uid()) OR public.is_trip_collaborator(trip_id, auth.uid())
);

CREATE POLICY "Trip owners and collaborators can delete reservations"
ON public.reservations FOR DELETE
USING (
  public.is_trip_owner(trip_id, auth.uid()) OR public.is_trip_collaborator(trip_id, auth.uid())
);

NOTIFY pgrst, 'reload schema';
