-- Schema from Backend-Requirement-Readme.md

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'non-binary', 'prefer-not')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    NEW.phone
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TRIPS
-- ============================================
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  countries TEXT[] DEFAULT '{}',
  cities TEXT[] DEFAULT '{}',
  start_date DATE,
  num_days INTEGER DEFAULT 7,
  companion TEXT,
  purpose TEXT,
  experiences TEXT[] DEFAULT '{}',
  pace TEXT,
  budget_tier TEXT,
  status TEXT DEFAULT 'draft',
  cover_image TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ITINERARY DAYS
-- ============================================
CREATE TABLE public.itinerary_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL,
  date DATE,
  city TEXT,
  country TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ACTIVITIES
-- ============================================
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID REFERENCES public.itinerary_days(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  description TEXT,
  rating NUMERIC(2,1),
  open_time TEXT,
  close_time TEXT,
  duration TEXT,
  ticket_price TEXT,
  time_of_day TEXT,
  best_time_to_visit TEXT,
  travel_time_from_previous TEXT,
  photo_url TEXT,
  photos TEXT[] DEFAULT '{}',
  google_maps_url TEXT,
  google_place_id TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RESERVATIONS
-- ============================================
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  details TEXT,
  date DATE,
  confirmation_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ATTACHMENTS
-- ============================================
CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_size TEXT,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- EXPENSES
-- ============================================
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT '$',
  category TEXT NOT NULL,
  paid_by TEXT,
  split TEXT,
  date DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TRIP BUDGETS
-- ============================================
CREATE TABLE public.trip_budgets (
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
CREATE TABLE public.trip_notes (
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
CREATE TABLE public.trip_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT DEFAULT 'viewer',
  invited_by UUID REFERENCES auth.users(id),
  accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(trip_id, user_id),
  UNIQUE(trip_id, email)
);

-- ============================================
-- CHAT MESSAGES
-- ============================================
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  step_key TEXT,
  options JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- SAVED / WISHLIST HOTELS
-- ============================================
CREATE TABLE public.saved_hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  hotel_external_id TEXT NOT NULL,
  hotel_name TEXT,
  hotel_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, hotel_external_id)
);

-- ============================================
-- EXPLORE CONTENT
-- ============================================
CREATE TABLE public.explore_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  image TEXT,
  author TEXT,
  author_avatar TEXT,
  category TEXT,
  type TEXT DEFAULT 'blog',
  video_url TEXT,
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.content_likes (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES public.explore_content(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, content_id)
);

-- ============================================
-- USER ROLES
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============================================
-- PUSH SUBSCRIPTIONS
-- ============================================
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- ============================================
-- STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('trip-attachments', 'trip-attachments', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('explore-images', 'explore-images', true) ON CONFLICT DO NOTHING;

-- Storage RLS Example
CREATE POLICY "Users can access own trip attachments"
ON storage.objects FOR ALL
USING (
  bucket_id = 'trip-attachments'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.trips
    WHERE user_id = auth.uid()
    UNION
    SELECT trip_id::text FROM public.trip_collaborators
    WHERE user_id = auth.uid() AND accepted = true
  )
);

-- ============================================
-- RLS POLICIES
-- ============================================
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

-- PROFILES
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- TRIPS
CREATE POLICY "Owner can CRUD trips" ON public.trips FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Collaborators can view trips" ON public.trips FOR SELECT
  USING (id IN (SELECT trip_id FROM public.trip_collaborators WHERE user_id = auth.uid() AND accepted = true));

-- ITINERARY DAYS & ACTIVITIES
CREATE POLICY "Trip members can access days" ON public.itinerary_days FOR ALL
  USING (trip_id IN (
    SELECT id FROM public.trips WHERE user_id = auth.uid()
    UNION
    SELECT trip_id FROM public.trip_collaborators WHERE user_id = auth.uid() AND accepted = true AND role IN ('owner', 'editor')
  ));

CREATE POLICY "Trip members can access activities" ON public.activities FOR ALL
  USING (day_id IN (
    SELECT id FROM public.itinerary_days WHERE trip_id IN (
      SELECT id FROM public.trips WHERE user_id = auth.uid()
      UNION
      SELECT trip_id FROM public.trip_collaborators WHERE user_id = auth.uid() AND accepted = true AND role IN ('owner', 'editor')
    )
  ));

-- SAVED HOTELS
CREATE POLICY "Users manage own saved hotels" ON public.saved_hotels FOR ALL USING (auth.uid() = user_id);

-- PUSH SUBSCRIPTIONS
CREATE POLICY "Users manage own push subs" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- EXPLORE CONTENT
CREATE POLICY "Anyone can read published content" ON public.explore_content FOR SELECT USING (published = true);
CREATE POLICY "Admins can manage content" ON public.explore_content FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
