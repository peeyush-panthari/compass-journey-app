-- Add youtube_videos column to activities for Visual Guides
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS youtube_videos JSONB DEFAULT '[]';

-- Note: This ensures the Activity Detail Dialog in the frontend can fetch 
-- and embed YouTube videos/shorts as requested.
