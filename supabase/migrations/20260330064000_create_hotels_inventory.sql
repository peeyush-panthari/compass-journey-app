-- Migration: Create Hotels Inventory mapping to frontend Hotel Interface

-- Enable the pg_trgm extension for fuzzy searching (e.g. search "Rome" matches "Via Veneto, Rome")
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS public.hotels_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    awin_product_id BIGINT UNIQUE NOT NULL,
    advertiser_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    city TEXT NOT NULL,
    rating NUMERIC DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    price_per_night NUMERIC NOT NULL,
    currency TEXT DEFAULT '$',
    image TEXT,
    images TEXT[] DEFAULT '{}',
    amenities TEXT[] DEFAULT '{}',
    description TEXT,
    stars INTEGER DEFAULT 3,
    free_cancellation BOOLEAN DEFAULT false,
    breakfast_included BOOLEAN DEFAULT false,
    room_types JSONB DEFAULT '[]'::jsonb,
    reviews JSONB DEFAULT '[]'::jsonb,
    booking_link TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.hotels_inventory ENABLE ROW LEVEL SECURITY;

-- Allow public read access to hotels so the frontend UI can fetch them
CREATE POLICY "Enable public read access for hotels_inventory" ON public.hotels_inventory
    FOR SELECT USING (true);

-- Only service role (Edge function feed sync) can insert or update
CREATE POLICY "Enable service_role write access for hotels_inventory" ON public.hotels_inventory
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create a GIN index on location and city for fast fuzzy search matching
CREATE INDEX IF NOT EXISTS hotels_inventory_location_trgm_idx ON public.hotels_inventory USING GIN (location gin_trgm_ops);
CREATE INDEX IF NOT EXISTS hotels_inventory_city_trgm_idx ON public.hotels_inventory USING GIN (city gin_trgm_ops);
