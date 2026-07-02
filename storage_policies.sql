-- Run this in your Supabase SQL Editor to allow file uploads to your bucket

-- 1. Allow anyone to view the images and videos (Select)
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'reach_media' );

-- 2. Allow the application to upload files (Insert)
CREATE POLICY "Public Uploads" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'reach_media' );
