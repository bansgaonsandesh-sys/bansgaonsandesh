-- Function to safely increment user points
CREATE OR REPLACE FUNCTION increment_user_points(
    p_user_id UUID,
    p_points INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE profiles
    SET points = points + p_points
    WHERE id = p_user_id;
END;
$$;
