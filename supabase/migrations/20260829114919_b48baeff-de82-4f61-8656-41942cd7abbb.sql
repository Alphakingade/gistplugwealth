-- Admins can read all role rows (needed to list administrators)
CREATE POLICY "Admins read all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Grant admin access to an existing account by email
CREATE OR REPLACE FUNCTION public.grant_admin_by_email(_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _target uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can grant admin access';
  END IF;

  SELECT id INTO _target FROM auth.users WHERE lower(email) = lower(btrim(_email)) LIMIT 1;

  IF _target IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'No account found with that email. Ask them to sign up first.');
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'message', 'Admin access granted.');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.grant_admin_by_email(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.grant_admin_by_email(text) TO authenticated;

-- Remove someone else's admin access
CREATE OR REPLACE FUNCTION public.revoke_admin(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can revoke admin access';
  END IF;

  IF _user_id = auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'message', 'You cannot remove your own admin access.');
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'admin';
  RETURN jsonb_build_object('ok', true, 'message', 'Admin access removed.');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.revoke_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revoke_admin(uuid) TO authenticated;

-- List administrators with their email addresses
CREATE OR REPLACE FUNCTION public.list_admin_users()
RETURNS TABLE (user_id uuid, email text, granted_at timestamptz, last_sign_in_at timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can list administrators';
  END IF;

  RETURN QUERY
  SELECT ur.user_id, u.email::text, ur.created_at, u.last_sign_in_at
  FROM public.user_roles ur
  JOIN auth.users u ON u.id = ur.user_id
  WHERE ur.role = 'admin'
  ORDER BY ur.created_at ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.list_admin_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_admin_users() TO authenticated;