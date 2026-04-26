-- ============================================
-- RLS POLICIES FOR TRIP_COLLABORATORS
-- ============================================

-- Drop existing policies if any (to avoid duplicates)
DROP POLICY IF EXISTS "Users can view own collaborations" ON public.trip_collaborators;
DROP POLICY IF EXISTS "Users can update own invitations" ON public.trip_collaborators;
DROP POLICY IF EXISTS "Owners can view trip collaborators" ON public.trip_collaborators;
DROP POLICY IF EXISTS "Owners can manage collaborators" ON public.trip_collaborators;

-- 1. Users can view their own collaborations (by user_id or email)
CREATE POLICY "Users can view own collaborations" ON public.trip_collaborators
FOR SELECT USING (
  auth.uid() = user_id OR 
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- 2. Users can update their own invitations (to accept them)
-- This allows them to link their user_id and set accepted = true
CREATE POLICY "Users can update own invitations" ON public.trip_collaborators
FOR UPDATE USING (
  auth.uid() = user_id OR 
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- 3. Trip owners can view all collaborators for their trips
CREATE POLICY "Owners can view trip collaborators" ON public.trip_collaborators
FOR SELECT USING (
  trip_id IN (SELECT id FROM public.trips WHERE user_id = auth.uid())
);

-- 4. Trip owners can manage collaborators (add/remove/update role)
CREATE POLICY "Owners can manage collaborators" ON public.trip_collaborators
FOR ALL USING (
  trip_id IN (SELECT id FROM public.trips WHERE user_id = auth.uid())
);

-- ============================================
-- UPDATE HANDLE_NEW_USER TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Insert into public.profiles
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    NEW.phone
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone;

  -- 2. Link pending invitations in trip_collaborators
  -- We set accepted = true automatically because they just joined via an invite
  UPDATE public.trip_collaborators
  SET user_id = NEW.id,
      accepted = true
  WHERE (email = NEW.email OR phone = NEW.phone) 
    AND user_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
