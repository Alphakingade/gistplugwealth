-- Trigger-only helpers must never be callable through the API.
REVOKE ALL ON FUNCTION public.grant_owner_admin() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;

-- Admin-guarded helpers stay callable by signed-in users only.
REVOKE ALL ON FUNCTION public.grant_admin_by_email(text) FROM anon, public;
REVOKE ALL ON FUNCTION public.revoke_admin(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.list_admin_users() FROM anon, public;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.grant_admin_by_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_admin_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;