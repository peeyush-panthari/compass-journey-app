-- Complete the blog CMS setup for in-app authoring and public rendering

ALTER TABLE public.explore_content
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE OR REPLACE FUNCTION public.increment_blog_views(blog_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.explore_content
  SET views = views + 1
  WHERE id = blog_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_blog_likes(blog_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.explore_content
  SET likes = likes + 1
  WHERE id = blog_id;
$$;

CREATE OR REPLACE FUNCTION public.decrement_blog_likes(blog_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.explore_content
  SET likes = GREATEST(likes - 1, 0)
  WHERE id = blog_id;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at ON public.explore_content;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.explore_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

INSERT INTO storage.buckets (id, name, public)
VALUES ('explore-images', 'explore-images', true)
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Public read explore images" ON storage.objects;
CREATE POLICY "Public read explore images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'explore-images');

DROP POLICY IF EXISTS "Admins can upload explore images" ON storage.objects;
CREATE POLICY "Admins can upload explore images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'explore-images'
    AND public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Admins can delete explore images" ON storage.objects;
CREATE POLICY "Admins can delete explore images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'explore-images'
    AND public.has_role(auth.uid(), 'admin')
  );
