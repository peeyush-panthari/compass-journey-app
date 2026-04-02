-- ============================================
-- TRIPS (Update to match requirement)
-- ============================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'cities') THEN
        ALTER TABLE public.trips ADD COLUMN cities TEXT[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'cover_image') THEN
        ALTER TABLE public.trips ADD COLUMN cover_image TEXT;
    END IF;
END $$;

-- ============================================
-- RESERVATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,          -- Flight, Lodging, Rental car, Restaurant, Train, Bus, Ferry, Cruise, Other
  title TEXT NOT NULL,
  details TEXT,
  date DATE,
  confirmation_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ATTACHMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_size TEXT,
  storage_path TEXT NOT NULL,  -- Supabase Storage path
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- EXPENSES
-- ============================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT '$',
  category TEXT NOT NULL,      -- Flight, Lodging, Food, Transport, Activities, Shopping, Other
  paid_by TEXT,
  split TEXT,                  -- equally, custom
  date DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TRIP BUDGETS
-- ============================================
CREATE TABLE IF NOT EXISTS public.trip_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_budget NUMERIC(12,2),
  currency TEXT DEFAULT '$',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- JOURNAL / NOTES
-- ============================================
CREATE TABLE IF NOT EXISTS public.trip_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TRIP SHARING / COLLABORATION
-- ============================================
CREATE TABLE IF NOT EXISTS public.trip_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'viewer',  -- owner, editor, viewer
  invited_by UUID REFERENCES auth.users(id),
  accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(trip_id, user_id),
  UNIQUE(trip_id, email),
  UNIQUE(trip_id, phone)
);

-- ============================================
-- CHAT MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  role TEXT NOT NULL,          -- user, assistant
  content TEXT NOT NULL,
  step_key TEXT,
  options JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- SAVED / WISHLIST HOTELS
-- ============================================
CREATE TABLE IF NOT EXISTS public.saved_hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  hotel_external_id TEXT NOT NULL,
  hotel_name TEXT,
  hotel_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, hotel_external_id)
);

-- ============================================
-- EXPLORE CONTENT (CMS)
-- ============================================
CREATE TABLE IF NOT EXISTS public.explore_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  image TEXT,
  author TEXT,
  author_avatar TEXT,
  category TEXT,               -- destination, food, video
  type TEXT DEFAULT 'blog',    -- blog, video
  video_url TEXT,
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- USER ROLES
-- ============================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- ============================================
-- CONTENT LIKES
-- ============================================
CREATE TABLE IF NOT EXISTS public.content_likes (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES public.explore_content(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, content_id)
);

-- ============================================
-- PUSH SUBSCRIPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.explore_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- PROFILES (Users can read/update own profile)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- TRIPS (Owner + Collaborators)
DROP POLICY IF EXISTS "Owner can CRUD trips" ON public.trips;
CREATE POLICY "Owner can CRUD trips" ON public.trips FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Collaborators can view trips" ON public.trips;
CREATE POLICY "Collaborators can view trips" ON public.trips FOR SELECT
  USING (id IN (SELECT trip_id FROM public.trip_collaborators WHERE user_id = auth.uid() AND accepted = true));

-- ITINERARY_DAYS (Trip members)
DROP POLICY IF EXISTS "Trip members can access days" ON public.itinerary_days;
CREATE POLICY "Trip members can access days" ON public.itinerary_days FOR ALL
  USING (trip_id IN (
    SELECT id FROM public.trips WHERE user_id = auth.uid()
    UNION
    SELECT trip_id FROM public.trip_collaborators WHERE user_id = auth.uid() AND accepted = true AND role IN ('owner', 'editor')
  ));

-- ACTIVITIES (Trip members)
DROP POLICY IF EXISTS "Trip members can access activities" ON public.activities;
CREATE POLICY "Trip members can access activities" ON public.activities FOR ALL
  USING (day_id IN (
    SELECT id FROM public.itinerary_days WHERE trip_id IN (
      SELECT id FROM public.trips WHERE user_id = auth.uid()
      UNION
      SELECT trip_id FROM public.trip_collaborators WHERE user_id = auth.uid() AND accepted = true AND role IN ('owner', 'editor')
    )
  ));

-- SAVED HOTELS
DROP POLICY IF EXISTS "Users manage own saved hotels" ON public.saved_hotels;
CREATE POLICY "Users manage own saved hotels" ON public.saved_hotels FOR ALL USING (auth.uid() = user_id);

-- EXPLORE CONTENT
DROP POLICY IF EXISTS "Anyone can read published content" ON public.explore_content;
CREATE POLICY "Anyone can read published content" ON public.explore_content FOR SELECT USING (published = true);
DROP POLICY IF EXISTS "Admins can manage content" ON public.explore_content;
CREATE POLICY "Admins can manage content" ON public.explore_content FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
