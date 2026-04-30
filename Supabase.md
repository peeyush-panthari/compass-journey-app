# Supabase Setup for GlobeGenie

This document captures the Supabase configuration, schema, policies, storage, edge functions, and auth/email setup used by this project.

Use it as a blueprint to recreate the same backend in another project.

## 1) Project Configuration

Current local Supabase CLI config lives in [`supabase/config.toml`](./supabase/config.toml).

### Core settings

- `project_id = "compass-journey-app"`
- API port: `54321`
- DB port: `54322`
- Studio port: `54323`
- Inbucket port: `54324`
- Realtime: enabled
- Storage: enabled
- Auth: enabled
- Database major version: `17`

### API exposure

- Exposed schemas:
  - `public`
  - `graphql_public`
- Extra search path:
  - `public`
  - `extensions`
- Max rows: `1000`

### Auth settings

- Site URL: `http://127.0.0.1:3000`
- Additional redirect URLs:
  - `https://127.0.0.1:3000`
- Signup enabled: yes
- Anonymous sign-ins: no
- Email confirmations: disabled locally
- Password minimum length: `6`

> If your frontend runs on a different port in another project, update `site_url` and the redirect URLs accordingly.

### Storage settings

- File size limit: `50MiB`
- S3 protocol support: enabled

## 2) Required Environment Variables

These are used by the backend, edge functions, or both:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_PLACES_API_KEY=
YOUTUBE_API_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-flash-latest
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_BACKEND_URL=
```

## 3) Storage Buckets

Buckets created by migrations:

| Bucket | Public | Purpose |
|---|---:|---|
| `trip-attachments` | No | Private attachments for reservations and trip docs |
| `avatars` | Yes | User avatars |
| `explore-images` | Yes | Blog / explore CMS images |

### Storage policies

#### `trip-attachments`

- Policy: `Users can access own trip attachments`
- Applies to `storage.objects`
- Access is allowed when:
  - object is in bucket `trip-attachments`
  - folder name matches a trip the user owns, or a trip where they are an accepted collaborator

#### `explore-images`

- `SELECT`: public read access
- `INSERT`: admin only
- `DELETE`: admin only

## 4) Database Schema

Below is the current schema as defined by the migrations. The schema evolved over time, so this is the consolidated version you should recreate.

### `profiles`

User profile mirror for `auth.users`.

Columns:

- `id uuid` primary key, references `auth.users(id)` on delete cascade
- `full_name text`
- `email text`
- `phone text`
- `age integer`
- `gender text`
- `avatar_url text`
- `created_at timestamptz`
- `updated_at timestamptz`

### `trips`

Trip shell created at plan time.

Columns:

- `id uuid` primary key
- `user_id uuid` references `auth.users(id)` on delete cascade
- `title text`
- `countries text[]`
- `cities text[]`
- `start_date date`
- `num_days integer`
- `companion text`
- `purpose text`
- `experiences text[]`
- `pace text`
- `budget_tier text`
- `status text`
- `cover_image text`
- `created_at timestamptz`
- `updated_at timestamptz`

### `itinerary_days`

One row per trip day.

Columns:

- `id uuid` primary key
- `trip_id uuid` references `trips(id)` on delete cascade
- `day_number integer`
- `date date`
- `city text`
- `country text`
- `sort_order integer`
- `created_at timestamptz`

### `activities`

Trip activities / places to visit.

Columns:

- `id uuid` primary key
- `day_id uuid` references `itinerary_days(id)` on delete cascade
- `name text`
- `address text`
- `description text`
- `rating numeric(2,1)`
- `open_time text`
- `close_time text`
- `duration text`
- `ticket_price text`
- `time_of_day text`
- `best_time_to_visit text`
- `travel_time_from_previous text`
- `photo_url text`
- `photos text[]`
- `google_maps_url text`
- `google_place_id text`
- `why_visit text`
- `food_suggestions jsonb`
- `hidden_gems jsonb`
- `photo_spots jsonb`
- `youtube_videos jsonb`
- `sort_order integer`
- `created_at timestamptz`

### `reservations`

Saved trip reservations and attachments.

Columns:

- `id uuid` primary key
- `trip_id uuid` references `trips(id)` on delete cascade
- `type text`
- `title text`
- `details text`
- `date date`
- `confirmation_number text`
- `fields jsonb`
- `attachments jsonb`
- `updated_at timestamptz`
- `created_at timestamptz`

### `attachments`

Legacy / general trip attachment metadata.

Columns:

- `id uuid` primary key
- `trip_id uuid`
- `file_name text`
- `file_size text`
- `storage_path text`
- `mime_type text`
- `uploaded_by uuid`
- `created_at timestamptz`

### `expenses`

Budget and expense tracking.

Columns:

- `id uuid` primary key
- `trip_id uuid`
- `amount numeric(12,2)`
- `currency text`
- `category text`
- `title text`
- `paid_by text`
- `split text`
- `participants jsonb`
- `date date`
- `note text`
- `created_at timestamptz`

### `trip_budgets`

One budget row per trip.

Columns:

- `id uuid` primary key
- `trip_id uuid` unique
- `total_budget numeric(12,2)`
- `currency text`
- `created_at timestamptz`
- `updated_at timestamptz`

### `trip_notes`

Journal / notes per trip.

Columns:

- `id uuid` primary key
- `trip_id uuid`
- `user_id uuid`
- `content text`
- `created_at timestamptz`
- `updated_at timestamptz`

### `trip_collaborators`

Trip sharing / tripmates.

Columns:

- `id uuid` primary key
- `trip_id uuid`
- `user_id uuid`
- `email text`
- `phone text`
- `role text`
- `invited_by uuid`
- `accepted boolean`
- `created_at timestamptz`

Unique constraints:

- `(trip_id, user_id)`
- `(trip_id, email)`
- `(trip_id, phone)`

### `chat_messages`

Trip assistant / chat history.

Columns:

- `id uuid` primary key
- `trip_id uuid`
- `user_id uuid`
- `role text`
- `content text`
- `step_key text`
- `options jsonb`
- `created_at timestamptz`

### `saved_hotels`

Wishlist / saved hotels.

Columns:

- `id uuid` primary key
- `user_id uuid`
- `hotel_external_id text`
- `hotel_name text`
- `hotel_data jsonb`
- `created_at timestamptz`

Unique constraint:

- `(user_id, hotel_external_id)`

### `explore_content`

Blog / CMS content used in Explore and Trip pages.

Columns:

- `id uuid` primary key
- `title text`
- `excerpt text`
- `content text`
- `image text`
- `images text[]`
- `author text`
- `author_avatar text`
- `category text`
- `type text`
- `video_url text`
- `slug text`
- `primary_keyword text`
- `secondary_keywords text[]`
- `seo jsonb`
- `seo_cluster jsonb`
- `distribution_strategy jsonb`
- `likes integer`
- `views integer`
- `published boolean`
- `updated_at timestamptz`
- `created_at timestamptz`

### `content_likes`

Many-to-many likes for Explore content.

Columns:

- `user_id uuid`
- `content_id uuid`
- `created_at timestamptz`

Primary key:

- `(user_id, content_id)`

### `push_subscriptions`

Web push subscriptions.

Columns:

- `id uuid` primary key
- `user_id uuid`
- `endpoint text`
- `keys jsonb`
- `created_at timestamptz`

Unique constraint:

- `(user_id, endpoint)`

### `system_logs`

Application diagnostics / observability table.

Columns:

- `id uuid` primary key
- `request_id text`
- `user_id uuid`
- `event_type text`
- `status text`
- `payload jsonb`
- `message text`
- `created_at timestamptz`

### `hotels_inventory`

Hotel search inventory for the Hotels page.

Columns:

- `id uuid` primary key
- `awin_product_id bigint`
- `advertiser_id bigint`
- `name text`
- `location text`
- `city text`
- `rating numeric`
- `review_count integer`
- `price_per_night numeric`
- `currency text`
- `image text`
- `images text[]`
- `amenities text[]`
- `description text`
- `stars integer`
- `free_cancellation boolean`
- `breakfast_included boolean`
- `room_types jsonb`
- `reviews jsonb`
- `booking_link text`
- `created_at timestamptz`
- `updated_at timestamptz`

### `user_roles`

Admin / moderator role management.

Columns:

- `id uuid` primary key
- `user_id uuid`
- `role app_role`

Enum:

- `app_role = ('admin', 'moderator', 'user')`

## 5) Helper Functions / Triggers

### Profile bootstrap

- `public.handle_new_user()`
  - Creates or upserts a `profiles` row when a user signs up.
  - Also links pending collaborator invites by matching `email` / `phone`.

Trigger:

- `on_auth_user_created` on `auth.users`

### Role helper

- `public.has_role(_user_id uuid, _role app_role)`

### Trip collaborator helpers

- `public.is_trip_owner(check_trip_id uuid, check_user_id uuid)`
- `public.is_trip_collaborator(check_trip_id uuid, check_user_id uuid)`

These are `SECURITY DEFINER` helpers used by RLS policies to avoid recursion.

### Blog CMS helpers

- `public.increment_blog_views(blog_id uuid)`
- `public.increment_blog_likes(blog_id uuid)`
- `public.decrement_blog_likes(blog_id uuid)`
- `public.update_updated_at()`

Trigger:

- `set_updated_at` on `explore_content`

## 6) RLS Policy Summary

### Profiles

- View own profile
- Update own profile

### Trips

- Owner can CRUD own trips
- Accepted collaborators can view trips

### Itinerary days / activities

- Trip owners and accepted editors can access all days and activities

### Reservations

- Trip owners and accepted editors can view / insert / update / delete reservations

### Expenses / budgets

- Trip owners and accepted collaborators can view / insert / update / delete

### Trip notes

- In the current backend flow, notes are trip-scoped and user-authored. If you recreate this from scratch, keep access aligned with trip membership.

### Trip collaborators

Policies currently in use:

- Users can view own collaborations
- Users can update own invitations
- Collaborators can view all trip collaborators
- Trip owners can insert collaborators
- Owners can manage collaborators
- Owners can view trip collaborators

### Saved hotels

- Users manage own saved hotels

### Explore content

- Anyone can read published content
- Admins manage content

### Push subscriptions

- Users manage own push subscriptions

### System logs

- Public read access
- Public insert access

### Hotels inventory

- Public read access
- Service role write access

## 7) Edge Functions

The project currently includes these Supabase Edge Functions:

| Function | Purpose |
|---|---|
| `generate-itinerary` | Generates the trip plan from the AI prompt and saves trips / itinerary / activities |
| `enrich-trip` | Enriches activities with Google Places data, photos, and YouTube videos |
| `enrich-activity` | Standalone Google Places enrichment helper for a single activity |
| `invite-collaborator` | Sends trip invitation emails and links tripmates |
| `search-hotels` | Hotel search flow for the Hotels page |

### Required secrets for functions

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_PLACES_API_KEY`
- `YOUTUBE_API_KEY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (optional; defaults to `gemini-flash-latest`)

### Notes

- `generate-itinerary` now persists the trip first, then saves days and activities.
- `enrich-trip` backfills `photo_url`, `photos`, `google_place_id`, `google_maps_url`, `rating`, `youtube_videos`, and missing addresses.
- `enrich-activity` returns a Google Places `photoReference` used for one-off activity enrichment.
- `invite-collaborator` is used by the Trip page share / tripmate flow.

## 8) Email Templates

The project uses custom invite and magic-link templates.

Files:

- [`supabase/templates/invite-trip.html`](./supabase/templates/invite-trip.html)
- [`supabase/templates/magic-link-trip.html`](./supabase/templates/magic-link-trip.html)
- [`supabase/templates/README.md`](./supabase/templates/README.md)

Recommended redirect URLs:

- `http://127.0.0.1:8080/invite`
- `http://127.0.0.1:8080/invite/accept`
- `http://127.0.0.1:8080/login`
- `http://127.0.0.1:8080/signup`
- `http://127.0.0.1:8080/trip/*`

Behavior:

- Existing users get a magic-link flow to sign in.
- New invitees get an invite flow to sign up.
- After auth, both land back on the shared trip and the trip appears in `Trips Shared with You`.

## 9) Replication Checklist

To recreate this Supabase project in another app:

1. Create a new Supabase project.
2. Apply the migrations in `supabase/migrations` in chronological order.
3. Create the storage buckets:
   - `trip-attachments`
   - `avatars`
   - `explore-images`
4. Deploy the edge functions:
   - `generate-itinerary`
   - `enrich-trip`
   - `enrich-activity`
   - `invite-collaborator`
   - `search-hotels`
5. Set all environment variables / secrets listed above.
6. Configure auth redirect URLs and email templates.
7. Verify RLS policies on all tables.
8. Seed or sync the hotels inventory and explore/blog content if needed.

## 10) Migration Files In This Repo

These migrations define the current state:

- `20260330053642_initial_schema.sql`
- `20260330062700_create_system_logs.sql`
- `20260330064000_create_hotels_inventory.sql`
- `20260331100000_add_activity_fields.sql`
- `20260401000001_remote_auto_fix.sql`
- `20260401120000_definitive_backend_schema.sql`
- `20260402082200_add_youtube_videos_column.sql`
- `20260402090000_add_curation_columns.sql`
- `20260402093000_create_system_logs_table.sql`
- `20260403000000_fix_system_logs_schema.sql`
- `20260424150000_blog_cms_completion.sql`
- `20260426000000_fix_trip_sharing.sql`
- `20260426120000_add_collaborator_trips_policy.sql`
- `20260426130000_fix_recursive_rls_policies.sql`
- `20260426140000_fix_circular_rls_dependency.sql`
- `20260426150000_fix_auth_users_permission_denied.sql`
- `20260426160000_expenses_budget_schema_rls.sql`
- `20260426170000_collaborators_view_each_other.sql`
- `20260428113500_enhance_blog_schema.sql`
- `20260429133000_fix_reservations_persistence.sql`

## 11) Important Notes

- Secrets are intentionally not included in this document.
- The app depends heavily on RLS helpers (`is_trip_owner`, `is_trip_collaborator`, `has_role`) to keep policies non-recursive.
- Reservations, expenses, and budgets are trip-member scoped.
- Blog media is stored in `explore-images`.
- Trip attachments are private and live in `trip-attachments`.

