-- Create buckets for attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('claim_attachments', 'claim_attachments', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage.objects
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'claim_attachments');

DROP POLICY IF EXISTS "Auth Insert" ON storage.objects;
CREATE POLICY "Auth Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'claim_attachments');

DROP POLICY IF EXISTS "Auth Update" ON storage.objects;
CREATE POLICY "Auth Update" ON storage.objects FOR UPDATE USING (bucket_id = 'claim_attachments');

DROP POLICY IF EXISTS "Auth Delete" ON storage.objects;
CREATE POLICY "Auth Delete" ON storage.objects FOR DELETE USING (bucket_id = 'claim_attachments');
