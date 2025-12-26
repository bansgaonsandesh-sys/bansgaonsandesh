-- Auto-cleanup system
-- Automatically deletes posts older than 2 months

-- Function to delete old posts and return their media URLs for storage cleanup
CREATE OR REPLACE FUNCTION public.cleanup_old_posts()
RETURNS TEXT[] AS $$
DECLARE
  v_deleted_urls TEXT[];
BEGIN
  -- Perform the delete and capture media_urls of deleted posts
  WITH deleted_posts AS (
    DELETE FROM public.posts
    WHERE created_at < NOW() - INTERVAL '2 months'
    RETURNING media_urls
  )
  SELECT array_agg(url) INTO v_deleted_urls
  FROM (
    SELECT unnest(media_urls) AS url
    FROM deleted_posts
    WHERE media_urls IS NOT NULL
  ) t;

  RETURN COALESCE(v_deleted_urls, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.cleanup_old_posts() TO authenticated, anon;

COMMENT ON FUNCTION public.cleanup_old_posts() IS 'Deletes posts older than 2 months and returns their media URLs for storage cleanup';
