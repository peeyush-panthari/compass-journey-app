-- Enhance blog schema with SEO, distribution, and advanced media fields
ALTER TABLE public.explore_content
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS primary_keyword TEXT,
  ADD COLUMN IF NOT EXISTS secondary_keywords TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS seo JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS seo_cluster JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS distribution_strategy JSONB DEFAULT '{}'::jsonb;

-- Add GIN indexes for JSONB columns to support efficient querying
CREATE INDEX IF NOT EXISTS idx_explore_content_seo ON public.explore_content USING GIN (seo);
CREATE INDEX IF NOT EXISTS idx_explore_content_seo_cluster ON public.explore_content USING GIN (seo_cluster);
CREATE INDEX IF NOT EXISTS idx_explore_content_distribution ON public.explore_content USING GIN (distribution_strategy);

-- Add index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_explore_content_slug ON public.explore_content (slug);
