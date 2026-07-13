-- Create analyst-documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('analyst-documents', 'analyst-documents', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for analyst-documents bucket
DROP POLICY IF EXISTS "analyst_docs_public_select" ON storage.objects;
CREATE POLICY "analyst_docs_public_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'analyst-documents');

DROP POLICY IF EXISTS "analyst_docs_auth_insert" ON storage.objects;
CREATE POLICY "analyst_docs_auth_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'analyst-documents');

DROP POLICY IF EXISTS "analyst_docs_auth_update" ON storage.objects;
CREATE POLICY "analyst_docs_auth_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'analyst-documents');

DROP POLICY IF EXISTS "analyst_docs_auth_delete" ON storage.objects;
CREATE POLICY "analyst_docs_auth_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'analyst-documents');
