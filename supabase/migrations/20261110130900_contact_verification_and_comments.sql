ALTER TABLE public.contact_messages
  DROP CONSTRAINT IF EXISTS contact_messages_student_id_length,
  DROP CONSTRAINT IF EXISTS contact_messages_dni_format;

ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS surname text,
  ADD COLUMN IF NOT EXISTS student_id text,
  ADD COLUMN IF NOT EXISTS dni text,
  ADD COLUMN IF NOT EXISTS student_verification_status text NOT NULL DEFAULT 'not_requested'
    CHECK (student_verification_status IN ('not_requested', 'pending', 'verified', 'not_found'));

ALTER TABLE public.contact_messages
  ADD CONSTRAINT contact_messages_student_id_length
    CHECK (student_id IS NULL OR length(student_id) BETWEEN 1 AND 30),
  ADD CONSTRAINT contact_messages_dni_format
    CHECK (dni IS NULL OR dni ~ '^[0-9]{7,8}$');

CREATE OR REPLACE FUNCTION public.cecid_set_contact_verification_pending()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.student_id IS NOT NULL AND NEW.dni IS NOT NULL THEN
    NEW.student_verification_status := 'pending';
  ELSE
    NEW.student_verification_status := 'not_requested';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cecid_contact_verification_pending ON public.contact_messages;
CREATE TRIGGER cecid_contact_verification_pending
  BEFORE INSERT ON public.contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.cecid_set_contact_verification_pending();

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.contact_messages FROM anon, authenticated;
GRANT INSERT ON public.contact_messages TO anon, authenticated;
-- Keep inbox and moderation access server-side; never expose the service-role key in the site.
GRANT SELECT, UPDATE, DELETE ON public.contact_messages TO service_role;

DROP POLICY IF EXISTS cecid_contact_messages_public_insert ON public.contact_messages;
CREATE POLICY cecid_contact_messages_public_insert
  ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (student_verification_status IN ('not_requested', 'pending'));

DROP POLICY IF EXISTS cecid_contact_messages_verification_guard ON public.contact_messages;
CREATE POLICY cecid_contact_messages_verification_guard
  ON public.contact_messages
  AS RESTRICTIVE
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (student_verification_status IN ('not_requested', 'pending'));

CREATE TABLE IF NOT EXISTS public.blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_slug text NOT NULL CHECK (length(post_slug) BETWEEN 1 AND 100),
  display_name text NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 80),
  body text NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 2000),
  author_type text NOT NULL DEFAULT 'public' CHECK (author_type IN ('public', 'student')),
  moderation_status text NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.cecid_set_blog_comment_pending()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.author_type := 'public';
  NEW.moderation_status := 'pending';
  NEW.created_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cecid_blog_comment_pending ON public.blog_comments;
CREATE TRIGGER cecid_blog_comment_pending
  BEFORE INSERT ON public.blog_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.cecid_set_blog_comment_pending();

ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.blog_comments FROM anon, authenticated;
GRANT SELECT, INSERT ON public.blog_comments TO anon, authenticated;
GRANT ALL ON public.blog_comments TO service_role;

DROP POLICY IF EXISTS cecid_blog_comments_public_read ON public.blog_comments;
CREATE POLICY cecid_blog_comments_public_read
  ON public.blog_comments
  FOR SELECT
  TO anon, authenticated
  USING (moderation_status = 'approved');

DROP POLICY IF EXISTS cecid_blog_comments_public_insert ON public.blog_comments;
CREATE POLICY cecid_blog_comments_public_insert
  ON public.blog_comments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (author_type = 'public' AND moderation_status = 'pending');

DROP POLICY IF EXISTS cecid_blog_comments_submission_guard ON public.blog_comments;
CREATE POLICY cecid_blog_comments_submission_guard
  ON public.blog_comments
  AS RESTRICTIVE
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (author_type = 'public' AND moderation_status = 'pending');

CREATE INDEX IF NOT EXISTS blog_comments_approved_post_created_idx
  ON public.blog_comments (post_slug, moderation_status, created_at DESC);
