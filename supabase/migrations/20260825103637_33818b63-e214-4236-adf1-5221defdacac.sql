CREATE POLICY "Admins manage article images" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'article-images' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'article-images' AND public.has_role(auth.uid(), 'admin'));