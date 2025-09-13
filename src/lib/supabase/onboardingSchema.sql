-- Onboarding Schema for MyDurhamLaw
-- Add onboarding-related columns to the existing profiles table

-- Add onboarding columns to profiles table if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_status text DEFAULT 'incomplete' CHECK (onboarding_status IN ('incomplete', 'partial', 'complete')),
ADD COLUMN IF NOT EXISTS uploaded_docs jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS academic_goal text,
ADD COLUMN IF NOT EXISTS syllabus_summary text;

-- Create index for onboarding status queries
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_status ON profiles(onboarding_status);

-- Create storage bucket for onboarding documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for onboarding documents
CREATE POLICY IF NOT EXISTS "Users can upload their own onboarding documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = 'onboarding-uploads' AND (storage.foldername(name))[2] = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "Users can view their own onboarding documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = 'onboarding-uploads' AND (storage.foldername(name))[2] = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "Users can update their own onboarding documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = 'onboarding-uploads' AND (storage.foldername(name))[2] = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "Users can delete their own onboarding documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = 'onboarding-uploads' AND (storage.foldername(name))[2] = auth.uid()::text);

-- Add comments for documentation
COMMENT ON COLUMN profiles.onboarding_status IS 'Track user onboarding completion status';
COMMENT ON COLUMN profiles.uploaded_docs IS 'JSON array of uploaded onboarding documents with metadata';
COMMENT ON COLUMN profiles.academic_goal IS 'User selected academic goal (pass, 2-2, 2-1, first)';
COMMENT ON COLUMN profiles.syllabus_summary IS 'AI-generated summary of uploaded syllabus (optional)';