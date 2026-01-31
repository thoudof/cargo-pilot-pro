-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 
  'documents', 
  true,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
);

-- RLS policies for documents bucket
-- Allow authenticated users to view all documents
CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- Allow users with edit_documents permission to upload
CREATE POLICY "Users with permission can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' 
  AND public.has_permission(auth.uid(), 'edit_documents'::public.app_permission)
);

-- Allow users with delete_documents permission to delete
CREATE POLICY "Users with permission can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND public.has_permission(auth.uid(), 'delete_documents'::public.app_permission)
);

-- Allow users with edit_documents permission to update
CREATE POLICY "Users with permission can update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND public.has_permission(auth.uid(), 'edit_documents'::public.app_permission)
);