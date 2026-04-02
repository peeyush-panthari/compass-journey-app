-- Add missing curation columns to activities table for 100% parity with AI response
-- These columns are required for the premium Detail Dialog UI

ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS why_visit TEXT,
ADD COLUMN IF NOT EXISTS food_suggestions JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS hidden_gems JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS photo_spots JSONB DEFAULT '[]';

-- Verify the column additions
COMMENT ON COLUMN public.activities.why_visit IS 'Insider secret tip from the curator';
COMMENT ON COLUMN public.activities.food_suggestions IS 'Nearby dining and drink recommendations';
COMMENT ON COLUMN public.activities.hidden_gems IS 'Nearby hidden gems or locations';
COMMENT ON COLUMN public.activities.photo_spots IS 'Best viewpoints or photographic locations';
