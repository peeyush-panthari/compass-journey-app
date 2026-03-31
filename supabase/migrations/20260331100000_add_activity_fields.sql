-- Ported from GlobeGenie: Add richer metadata fields for AI-generated activities
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS why_visit TEXT,
ADD COLUMN IF NOT EXISTS food_suggestions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS hidden_gems TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS photo_spots TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS rest_stops TEXT[] DEFAULT '{}';

-- Optional: Update RLS if needed (already broad for activities in initial_schema)
