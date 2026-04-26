-- Update expenses schema
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS participants jsonb DEFAULT '[]'::jsonb;

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_budgets ENABLE ROW LEVEL SECURITY;

-- Policies for expenses
DROP POLICY IF EXISTS "Trip owners and collaborators can view expenses" ON public.expenses;
CREATE POLICY "Trip owners and collaborators can view expenses"
ON public.expenses FOR SELECT
USING (
  public.is_trip_owner(trip_id, auth.uid()) OR public.is_trip_collaborator(trip_id, auth.uid())
);

DROP POLICY IF EXISTS "Trip owners and collaborators can insert expenses" ON public.expenses;
CREATE POLICY "Trip owners and collaborators can insert expenses"
ON public.expenses FOR INSERT
WITH CHECK (
  public.is_trip_owner(trip_id, auth.uid()) OR public.is_trip_collaborator(trip_id, auth.uid())
);

DROP POLICY IF EXISTS "Trip owners and collaborators can update expenses" ON public.expenses;
CREATE POLICY "Trip owners and collaborators can update expenses"
ON public.expenses FOR UPDATE
USING (
  public.is_trip_owner(trip_id, auth.uid()) OR public.is_trip_collaborator(trip_id, auth.uid())
);

DROP POLICY IF EXISTS "Trip owners and collaborators can delete expenses" ON public.expenses;
CREATE POLICY "Trip owners and collaborators can delete expenses"
ON public.expenses FOR DELETE
USING (
  public.is_trip_owner(trip_id, auth.uid()) OR public.is_trip_collaborator(trip_id, auth.uid())
);

-- Policies for trip_budgets
DROP POLICY IF EXISTS "Trip owners and collaborators can view budgets" ON public.trip_budgets;
CREATE POLICY "Trip owners and collaborators can view budgets"
ON public.trip_budgets FOR SELECT
USING (
  public.is_trip_owner(trip_id, auth.uid()) OR public.is_trip_collaborator(trip_id, auth.uid())
);

DROP POLICY IF EXISTS "Trip owners and collaborators can insert budgets" ON public.trip_budgets;
CREATE POLICY "Trip owners and collaborators can insert budgets"
ON public.trip_budgets FOR INSERT
WITH CHECK (
  public.is_trip_owner(trip_id, auth.uid()) OR public.is_trip_collaborator(trip_id, auth.uid())
);

DROP POLICY IF EXISTS "Trip owners and collaborators can update budgets" ON public.trip_budgets;
CREATE POLICY "Trip owners and collaborators can update budgets"
ON public.trip_budgets FOR UPDATE
USING (
  public.is_trip_owner(trip_id, auth.uid()) OR public.is_trip_collaborator(trip_id, auth.uid())
);

DROP POLICY IF EXISTS "Trip owners and collaborators can delete budgets" ON public.trip_budgets;
CREATE POLICY "Trip owners and collaborators can delete budgets"
ON public.trip_budgets FOR DELETE
USING (
  public.is_trip_owner(trip_id, auth.uid()) OR public.is_trip_collaborator(trip_id, auth.uid())
);
