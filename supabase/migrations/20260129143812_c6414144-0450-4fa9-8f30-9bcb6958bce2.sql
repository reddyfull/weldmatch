-- Create a function to get user emails for admin users only
CREATE OR REPLACE FUNCTION public.get_users_with_email()
RETURNS TABLE (
  user_id uuid,
  email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, email::text
  FROM auth.users
  WHERE public.has_role(auth.uid(), 'admin')
$$;