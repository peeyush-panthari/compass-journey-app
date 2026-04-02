# GlobeGenie — Backend Requirement Document

> **Version:** 1.0  
> **Date:** 2026-03-30  
> **App Type:** Progressive Web App (PWA) — React + Vite + TypeScript  
> **Current State:** Fully client-side with hardcoded data & localStorage auth  
> **Goal:** Replace all mock/local logic with a production backend to make the PWA fully functional

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Authentication & User Management](#2-authentication--user-management)
3. [Database Schema](#3-database-schema)
4. [AI Chat & Itinerary Generation](#4-ai-chat--itinerary-generation)
5. [Trip & Itinerary Management](#5-trip--itinerary-management)
6. [Reservations & Attachments](#6-reservations--attachments)
7. [Budget & Expense Tracking](#7-budget--expense-tracking)
8. [Journal / Notes](#8-journal--notes)
9. [Hotel Search & Booking](#9-hotel-search--booking)
10. [Explore / Content](#10-explore--content)
11. [Collaboration & Sharing](#11-collaboration--sharing)
12. [Push Notifications](#12-push-notifications)
13. [File Storage](#13-file-storage)
14. [Third-Party API Integrations](#14-third-party-api-integrations)
15. [Environment Variables / Secrets](#15-environment-variables--secrets)
16. [Row-Level Security (RLS) Policies](#16-row-level-security-rls-policies)
17. [Edge Functions Required](#17-edge-functions-required)
18. [PWA-Specific Backend Requirements](#18-pwa-specific-backend-requirements)
19. [Deployment & Infrastructure](#19-deployment--infrastructure)

---

## 1. Architecture Overview

**Recommended Stack:** Supabase (via GlobeGenie Cloud) or self-hosted Supabase

```
┌──────────────────────┐
│  React PWA (Vite)    │
│  ├─ Auth Context     │──→  Supabase Auth (Phone OTP, Google OAuth)
│  ├─ Trip Planner     │──→  Supabase DB + Edge Functions (AI)
│  ├─ Chat (AI)        │──→  Edge Function → OpenAI / Gemini API
│  ├─ Itinerary        │──→  Supabase DB (CRUD + RLS)
│  ├─ Hotels           │──→  Edge Function → Google Places / Booking API
│  ├─ Expenses         │──→  Supabase DB
│  ├─ Attachments      │──→  Supabase Storage
│  └─ Explore Content  │──→  Supabase DB (CMS-like)
└──────────────────────┘
```

---

## 2. Authentication & User Management

### Current State
- Auth is faked via `localStorage` with a hardcoded demo account
- Phone OTP flow is simulated (demo phone: `123456789`, demo OTP: `0987`)
- Google Sign-In shows a toast: "will be available once backend is connected"

### Backend Requirements

| Feature | Implementation |
|---------|---------------|
| **Phone OTP Login** | Supabase Auth with phone provider (Twilio / MessageBird) |
| **Google OAuth** | Supabase Auth with Google provider (OAuth 2.0) |
| **Apple Sign-In** | Supabase Auth with Apple provider (recommended for iOS PWA) |
| **Session Management** | Supabase handles JWT tokens, refresh rotation |
| **Password Reset** | Supabase Auth reset password flow (currently mocked in EditProfile) |

### Config Required
```
SUPABASE_URL=<project-url>
SUPABASE_ANON_KEY=<anon-key>
TWILIO_ACCOUNT_SID=<sid>           # For phone OTP
TWILIO_AUTH_TOKEN=<token>
TWILIO_PHONE_NUMBER=<number>
GOOGLE_CLIENT_ID=<client-id>       # For Google OAuth
GOOGLE_CLIENT_SECRET=<secret>
```

### User Profile Table
```sql
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
```

---

## 3. Database Schema

### Core Tables

```sql
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
  companion TEXT,              -- solo, partner, friends, family, kids, seniors
  purpose TEXT,                -- leisure, honeymoon, adventure, etc.
  experiences TEXT[] DEFAULT '{}',
  pace TEXT,                   -- relaxed, moderate, packed
  budget_tier TEXT,            -- budget, mid-range, luxury
  status TEXT DEFAULT 'draft', -- draft, generating, generated, archived
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
  time_of_day TEXT,            -- morning, afternoon, evening
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
  type TEXT NOT NULL,          -- Flight, Lodging, Rental car, Restaurant, Train, Bus, Ferry, Cruise, Other
  title TEXT NOT NULL,
  details TEXT,
  date DATE,
  confirmation_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ATTACHMENTS (metadata — files stored in Supabase Storage)
-- ============================================
CREATE TABLE public.attachments (
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
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT '$',   -- $, €, £, ₹, ¥
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
  email TEXT,                  -- for invited but not yet registered users
  role TEXT DEFAULT 'viewer',  -- owner, editor, viewer
  invited_by UUID REFERENCES auth.users(id),
  accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(trip_id, user_id),
  UNIQUE(trip_id, email)
);

-- ============================================
-- CHAT MESSAGES (AI conversation history)
-- ============================================
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  role TEXT NOT NULL,          -- user, assistant
  content TEXT NOT NULL,
  step_key TEXT,               -- destination, dates, group, purpose, etc.
  options JSONB,               -- available options for this step
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- SAVED / WISHLIST HOTELS
-- ============================================
CREATE TABLE public.saved_hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  hotel_external_id TEXT NOT NULL,  -- Google Place ID or API hotel ID
  hotel_name TEXT,
  hotel_data JSONB,           -- cached hotel info
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, hotel_external_id)
);

-- ============================================
-- EXPLORE CONTENT (CMS)
-- ============================================
CREATE TABLE public.explore_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,                -- full article body (markdown)
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
-- USER ROLES (security-critical, separate table)
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
```

---

## 4. AI Chat & Itinerary Generation

### Current State
- Chat uses a hardcoded `chatFlow` array with scripted questions
- No AI model is called; responses are pre-defined
- "Generate Itinerary" navigates to a page with hardcoded Paris/London data

### Backend Requirements

**Edge Function: `generate-itinerary`**

| Input | Description |
|-------|-------------|
| `destination` | Countries/cities selected |
| `dates` | Start date + num days |
| `companion` | Travel group type |
| `purpose` | Trip purpose |
| `experiences` | Preferred activity types |
| `pace` | Relaxed / moderate / packed |
| `budget` | Budget tier |

**Processing:**
1. Receive trip preferences from chat or plan wizard
2. Call OpenAI GPT-4 / Google Gemini API with structured prompt
3. Return JSON itinerary with day-by-day activities
4. Enrich each activity with Google Places API data (photos, ratings, hours, coordinates)
5. Save generated itinerary to DB
6. Return trip ID to frontend

**AI Response Schema:**
```json
{
  "days": [
    {
      "dayNumber": 1,
      "date": "2026-04-14",
      "city": "Paris",
      "country": "France",
      "activities": [
        {
          "name": "Eiffel Tower",
          "address": "Champ de Mars, Paris",
          "description": "...",
          "duration": "2h",
          "ticketPrice": "€26",
          "timeOfDay": "morning",
          "bestTimeToVisit": "Early morning",
          "googlePlaceId": "ChIJLU7jZClu5kcR..."
        }
      ]
    }
  ]
}
```

### Secrets Required
```
OPENAI_API_KEY=<key>           # or GOOGLE_GEMINI_API_KEY
GOOGLE_PLACES_API_KEY=<key>    # For activity enrichment
```

---

## 5. Trip & Itinerary Management

### API Endpoints (Supabase client or Edge Functions)

| Operation | Method | Description |
|-----------|--------|-------------|
| Create trip | `INSERT trips` | From plan wizard or chat |
| List user trips | `SELECT trips WHERE user_id` | Account page "Your Trips" |
| Get trip detail | `SELECT trips + days + activities` | Itinerary page |
| Update activity order | `UPDATE activities SET sort_order` | Drag-and-drop reorder |
| Move activity between days | `UPDATE activities SET day_id` | Cross-day drag |
| Add activity | `INSERT activities` | "Add Activity" dialog |
| Delete activity | `DELETE activities` | Remove from itinerary |
| Add day | `INSERT itinerary_days` | Add new day to trip |
| Delete day | `DELETE itinerary_days` | Remove day (cascade activities) |
| Update trip | `UPDATE trips` | Edit title, dates, etc. |
| Delete trip | `DELETE trips` | Remove trip (cascade all) |

---

## 6. Reservations & Attachments

### Reservations
- CRUD on `reservations` table
- Types: Flight, Lodging, Rental car, Restaurant, Train, Bus, Ferry, Cruise, Other
- Fields: title, details, date, confirmation number

### Attachments
- Upload files to **Supabase Storage** bucket: `trip-attachments`
- Store metadata in `attachments` table
- Supported: PDF, images, documents
- Max file size: 10MB recommended

### Storage Bucket Config
```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('trip-attachments', 'trip-attachments', false);

-- RLS: Users can access attachments for trips they own or collaborate on
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
```

---

## 7. Budget & Expense Tracking

### Current State
- Expenses stored in component state (lost on refresh)
- Budget is local state
- Currencies: $, €, £, ₹, ¥
- Categories: Flight, Lodging, Food, Transport, Activities, Shopping, Other
- Group balance splitting (equally)

### Backend Requirements
- CRUD on `expenses` table
- CRUD on `trip_budgets` table
- Real-time expense updates via Supabase Realtime (for collaborators)
- Aggregate queries: total spent, spent by category, group balances

**Useful Views:**
```sql
CREATE VIEW expense_summary AS
SELECT
  trip_id,
  currency,
  SUM(amount) as total_spent,
  category,
  SUM(amount) as category_total
FROM expenses
GROUP BY trip_id, currency, category;
```

---

## 8. Journal / Notes

### Current State
- Notes stored as local `useState("")` — lost on navigation/refresh

### Backend Requirements
- CRUD on `trip_notes` table
- One note per user per trip (or multiple entries as journal)
- Real-time sync for collaborative editing (Supabase Realtime)

---

## 9. Hotel Search & Booking

### Current State
- Hotels are hardcoded in `src/data/hotels.ts` (static mock data)
- Search, filter, sort all client-side against static data
- "Book Now" shows a toast: "Booking flow coming soon"
- Saved/wishlist is local `useState`

### Backend Requirements

**Edge Function: `search-hotels`**

| Input | Description |
|-------|-------------|
| `destination` | City or location name |
| `checkIn` | Check-in date |
| `checkOut` | Check-out date |
| `rooms` | Number of rooms |
| `guests` | Number of guests |
| `filters` | Price range, star rating, amenities, etc. |

**Integration Options:**
1. **Google Places API** — for hotel discovery, photos, reviews, ratings
2. **Booking.com Affiliate API** — for real availability & pricing
3. **Hotels.com / Expedia Rapid API** — alternative booking integration
4. **Amadeus Hotel API** — for enterprise-grade hotel search

**Booking Flow (if implementing direct booking):**
- Requires payment integration (Stripe)
- Requires booking confirmation emails (Resend / SendGrid)
- Alternatively: redirect to booking partner (affiliate model)

### Secrets Required
```
GOOGLE_PLACES_API_KEY=<key>
BOOKING_API_KEY=<key>          # If using Booking.com
STRIPE_SECRET_KEY=<key>        # If implementing payments
STRIPE_PUBLISHABLE_KEY=<key>
```

---

## 10. Explore / Content

### Current State
- Blog/video content hardcoded in `Explore.tsx` and `Account.tsx`
- Categories: destination, food, video
- Likes/views are static numbers

### Backend Requirements
- `explore_content` table acts as a simple CMS
- Admin panel or edge function for content management
- Increment `views` on page visit
- Toggle `likes` per user (needs a `content_likes` junction table)

```sql
CREATE TABLE public.content_likes (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES public.explore_content(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, content_id)
);
```

---

## 11. Collaboration & Sharing

### Current State
- "Share" shows an email input + copy link — no actual sharing logic
- "Invite travelers" dialog exists but is non-functional

### Backend Requirements
1. **Invite by email**: Insert into `trip_collaborators` with email
2. **Email notification**: Edge function sends invite email (Resend / SendGrid)
3. **Accept invite**: When invited user signs up/logs in, match email → accept
4. **Real-time sync**: Supabase Realtime channels per trip for live collaboration
5. **Permission levels**: owner (full control), editor (edit itinerary), viewer (read-only)

### Edge Function: `invite-collaborator`
```
Input: { tripId, email, role }
→ Insert trip_collaborators
→ Send invitation email
→ If user exists, auto-link user_id
```

### Secrets Required
```
RESEND_API_KEY=<key>           # or SENDGRID_API_KEY
APP_URL=<published-url>        # For invite links
```

---

## 12. Push Notifications

### Backend Requirements (for PWA push)
- **Web Push API** with VAPID keys
- Supabase Edge Function to send push notifications
- Use cases:
  - Trip shared with you
  - Collaborator made changes
  - Upcoming trip reminder (1 day before)
  - New explore content

### Secrets Required
```
VAPID_PUBLIC_KEY=<key>
VAPID_PRIVATE_KEY=<key>
VAPID_SUBJECT=mailto:hello@globegenie.app
```

### DB Table
```sql
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,          -- { p256dh, auth }
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);
```

---

## 13. File Storage

### Supabase Storage Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| `trip-attachments` | No | User-uploaded trip documents |
| `avatars` | Yes | User profile photos |
| `explore-images` | Yes | Blog/content images |

---

## 14. Third-Party API Integrations

| Service | Purpose | Required |
|---------|---------|----------|
| **OpenAI / Gemini** | AI itinerary generation, chat | ✅ Critical |
| **Google Places API** | Activity enrichment, hotel search, photos | ✅ Critical |
| **Google Maps JavaScript API** | Map display, directions | Recommended |
| **Twilio / MessageBird** | Phone OTP authentication | ✅ Critical |
| **Google OAuth** | Social sign-in | ✅ Critical |
| **Resend / SendGrid** | Transactional emails (invites, confirmations) | ✅ Critical |
| **Stripe** | Hotel booking payments (if direct) | Optional |
| **Booking.com / Amadeus** | Hotel availability & pricing | Optional |
| **Unsplash API** | Dynamic cover images | Nice to have |

---

## 15. Environment Variables / Secrets

### All Required Secrets (store in Supabase Edge Function secrets)

```env
# Supabase (auto-configured)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
OPENAI_API_KEY=
# or GOOGLE_GEMINI_API_KEY=

# Google APIs
GOOGLE_PLACES_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# SMS/OTP
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Email
RESEND_API_KEY=

# Push Notifications
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# Payments (optional)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=         # This one goes in frontend (publishable)

# App
APP_URL=https://globegenie.app  # For email links
```

---

## 16. Row-Level Security (RLS) Policies

```sql
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

-- PROFILES: users can read/update own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- TRIPS: owner + collaborators
CREATE POLICY "Owner can CRUD trips" ON public.trips FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Collaborators can view trips" ON public.trips FOR SELECT
  USING (id IN (SELECT trip_id FROM public.trip_collaborators WHERE user_id = auth.uid() AND accepted = true));

-- ITINERARY_DAYS & ACTIVITIES: via trip ownership/collaboration
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

-- EXPENSES, RESERVATIONS, NOTES, BUDGETS: similar trip-scoped policies
-- (follow same pattern as itinerary_days)

-- EXPLORE CONTENT: public read, admin write
CREATE POLICY "Anyone can read published content" ON public.explore_content FOR SELECT USING (published = true);
CREATE POLICY "Admins can manage content" ON public.explore_content FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- SAVED HOTELS: user-scoped
CREATE POLICY "Users manage own saved hotels" ON public.saved_hotels FOR ALL USING (auth.uid() = user_id);

-- PUSH SUBSCRIPTIONS: user-scoped
CREATE POLICY "Users manage own push subs" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id);
```

---

## 17. Edge Functions Required

| Function | Trigger | Description |
|----------|---------|-------------|
| `generate-itinerary` | POST from plan wizard / chat | Calls AI API, enriches with Google Places, saves to DB |
| `search-hotels` | POST from hotel search | Proxies to Google Places / Booking API |
| `invite-collaborator` | POST from share dialog | Sends invitation email, creates collaborator record |
| `send-push-notification` | Webhook / cron | Sends web push notifications |
| `handle-new-user` | DB trigger (auth.users insert) | Creates profile, matches pending invitations |
| `enrich-activity` | POST from add-activity | Fetches Google Places data for a manually added activity |
| `export-itinerary` | POST from export button | Generates PDF/image of itinerary |

---

## 18. PWA-Specific Backend Requirements

| Requirement | Details |
|-------------|---------|
| **Service Worker Caching** | Cache API responses for offline itinerary viewing |
| **Background Sync** | Queue expense/note updates when offline, sync when online |
| **Web Push** | VAPID-based push notifications via edge function |
| **App Manifest** | Already configured (`/manifest.json`) |
| **Offline Data** | Cache current trip data in IndexedDB for offline access |

---

## 19. Deployment & Infrastructure

### Recommended Setup

| Component | Service |
|-----------|---------|
| **Frontend Hosting** | Vercel/Netlify |
| **Backend (DB + Auth + Storage)** | Supabase (via GlobeGenie) |
| **Edge Functions** | Supabase Edge Functions (Deno) |
| **Domain** | Custom domain via GlobeGenie or DNS provider |
| **SSL** | Auto (included with GlobeGenie/Supabase) |
| **CDN** | Included with hosting provider |

### Supabase Project Size
- **Starter** (free) for development
- **Pro** ($25/mo) for production — needed for:
  - Phone auth (Twilio hook)
  - More than 500 active users
  - Daily backups
  - More storage

---

## Summary: What Needs to Change Per Page

| Page | Current | Needs |
|------|---------|-------|
| **Login** | Fake OTP + demo account | Supabase Auth (Phone OTP + Google) |
| **Signup** | localStorage | Supabase Auth |
| **AuthDialog** | Fake OTP | Supabase Auth |
| **AuthContext** | localStorage | Supabase `useSession` / `onAuthStateChange` |
| **Chat** | Hardcoded question flow | AI edge function + chat history DB |
| **PlanTrip** | Local state only | Save to `trips` table |
| **Itinerary** | Hardcoded Paris/London data | Load from DB, real-time updates |
| **Account** | Hardcoded saved/shared trips | Query `trips` + `trip_collaborators` |
| **EditProfile** | Toast-only saves | Update `profiles` table |
| **Hotels** | Static `hotels.ts` data | Google Places / Booking API |
| **HotelDetail** | Static data + mock booking | API data + real booking flow |
| **Explore** | Hardcoded blog data | `explore_content` table (CMS) |
| **Expenses** | Component state | `expenses` table |
| **Reservations** | Component state | `reservations` table |
| **Attachments** | Component state | Supabase Storage |
| **Notes/Journal** | Component state | `trip_notes` table |
| **Sharing** | UI only, no logic | `trip_collaborators` + email invites |

---

*This document should be used as the single source of truth for backend development. All database schemas, API integrations, and edge functions described here are required to make GlobeGenie a fully functional production PWA.*
