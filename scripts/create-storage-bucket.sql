-- Create a private storage bucket for project files
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to read files (for signed URL generation)
CREATE POLICY IF NOT EXISTS "Allow authenticated read access"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'project-files');

-- Allow service role to upload files (API routes use service role)
CREATE POLICY IF NOT EXISTS "Allow service role upload"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'project-files');

-- Allow service role to delete files
CREATE POLICY IF NOT EXISTS "Allow service role delete"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'project-files');
