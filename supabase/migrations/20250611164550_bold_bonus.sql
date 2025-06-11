/*
  # Create Storage Buckets for Asset Management

  1. New Storage Buckets
    - `asset-photos` - For storing asset photos/images
    - `asset-documents` - For storing asset documents (PDFs, DOCs, etc.)

  2. Security
    - Enable RLS on both buckets
    - Add policies for authenticated users to manage their own files
    - Allow public read access for asset photos (for QR code functionality)
    - Restrict document access to owners only

  3. Configuration
    - Set appropriate file size limits
    - Configure allowed file types
    - Enable public access where needed
*/

-- Create the asset-photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'asset-photos',
  'asset-photos',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create the asset-documents bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'asset-documents',
  'asset-documents',
  false,
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'text/plain'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for asset-photos: Users can upload their own photos
CREATE POLICY "Users can upload their own asset photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'asset-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy for asset-photos: Users can view their own photos
CREATE POLICY "Users can view their own asset photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'asset-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy for asset-photos: Public read access (for QR codes and public asset views)
CREATE POLICY "Public can view asset photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'asset-photos');

-- Policy for asset-photos: Users can update their own photos
CREATE POLICY "Users can update their own asset photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'asset-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy for asset-photos: Users can delete their own photos
CREATE POLICY "Users can delete their own asset photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'asset-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy for asset-documents: Users can upload their own documents
CREATE POLICY "Users can upload their own asset documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'asset-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy for asset-documents: Users can view their own documents
CREATE POLICY "Users can view their own asset documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'asset-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy for asset-documents: Users can update their own documents
CREATE POLICY "Users can update their own asset documents"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'asset-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy for asset-documents: Users can delete their own documents
CREATE POLICY "Users can delete their own asset documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'asset-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );