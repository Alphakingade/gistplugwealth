-- Public read for article images; admin-only writes.
DROP POLICY IF EXISTS "Article images are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload article images" ON storage.objects;
DROP POLICY IF EXISTS "Admins update article images" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete article images" ON storage.objects;

CREATE POLICY "Article images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-images');

CREATE POLICY "Admins upload article images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'article-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update article images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'article-images' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'article-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete article images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'article-images' AND public.has_role(auth.uid(), 'admin'));

-- Owner allowlist: these accounts always hold the admin role.
CREATE OR REPLACE FUNCTION public.grant_owner_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF lower(COALESCE(NEW.email, '')) IN ('dadebimpe46@gmail.com', 'gistplugwealth@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_owner_admin_insert ON auth.users;
CREATE TRIGGER on_auth_user_owner_admin_insert
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_owner_admin();

DROP TRIGGER IF EXISTS on_auth_user_owner_admin_update ON auth.users;
CREATE TRIGGER on_auth_user_owner_admin_update
AFTER UPDATE OF email, email_confirmed_at ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_owner_admin();

-- Backfill any existing accounts.
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
WHERE lower(u.email) IN ('dadebimpe46@gmail.com', 'gistplugwealth@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;