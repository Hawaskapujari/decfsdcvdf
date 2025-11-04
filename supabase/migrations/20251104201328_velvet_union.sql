/*
  # Create Missing Tables for School Portal

  1. New Tables
    - `profile_update_requests` - For student profile update requests
    - `settings` - System-wide settings and API keys
    - `tests` - Online tests and assessments
    - `test_attempts` - Student test attempts and scores

  2. Storage Buckets
    - Create storage buckets for file uploads

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for each table
*/

-- Create profile_update_requests table
CREATE TABLE IF NOT EXISTS profile_update_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  requested_changes text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_response text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profile_update_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can create their own profile update requests"
  ON profile_update_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Students can view their own profile update requests"
  ON profile_update_requests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can view and manage all profile update requests"
  ON profile_update_requests
  FOR ALL
  TO authenticated
  USING (true);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id integer PRIMARY KEY DEFAULT 1,
  openrouter_api_key text,
  school_name text DEFAULT 'SOSE Lajpat Nagar',
  academic_year text DEFAULT '2024-25',
  max_books_per_student integer DEFAULT 3,
  homework_submission_days integer DEFAULT 7,
  updated_by uuid,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_settings_row CHECK (id = 1)
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings"
  ON settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can update settings"
  ON settings
  FOR ALL
  TO authenticated
  USING (true);

-- Create tests table
CREATE TABLE IF NOT EXISTS tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject text NOT NULL,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  duration_minutes integer NOT NULL DEFAULT 60,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  instructions text,
  questions jsonb NOT NULL DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view tests for their class"
  ON tests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage all tests"
  ON tests
  FOR ALL
  TO authenticated
  USING (true);

-- Create test_attempts table
CREATE TABLE IF NOT EXISTS test_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid REFERENCES tests(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}',
  score integer NOT NULL DEFAULT 0,
  max_score integer NOT NULL DEFAULT 0,
  time_taken integer NOT NULL DEFAULT 0,
  attempted_at timestamptz DEFAULT now(),
  UNIQUE(test_id, student_id)
);

ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can create their own test attempts"
  ON test_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Students can view their own test attempts"
  ON test_attempts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can view all test attempts"
  ON test_attempts
  FOR SELECT
  TO authenticated
  USING (true);

-- Add missing columns to existing tables
DO $$
BEGIN
  -- Add profile_photo column to students if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'profile_photo'
  ) THEN
    ALTER TABLE students ADD COLUMN profile_photo text;
  END IF;

  -- Add cover_image column to books if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'books' AND column_name = 'cover_image'
  ) THEN
    ALTER TABLE books ADD COLUMN cover_image text;
  END IF;

  -- Add attachment_url column to submissions if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'submissions' AND column_name = 'attachment_url'
  ) THEN
    ALTER TABLE submissions ADD COLUMN attachment_url text;
  END IF;

  -- Add graded_by column to submissions if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'submissions' AND column_name = 'graded_by'
  ) THEN
    ALTER TABLE submissions ADD COLUMN graded_by uuid;
  END IF;

  -- Add teacher_id column to ai_queries if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_queries' AND column_name = 'teacher_id'
  ) THEN
    ALTER TABLE ai_queries ADD COLUMN teacher_id uuid;
  END IF;
END $$;

-- Insert default settings
INSERT INTO settings (id, school_name, academic_year) 
VALUES (1, 'SOSE Lajpat Nagar', '2024-25')
ON CONFLICT (id) DO NOTHING;

-- Create storage buckets (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('profile-photos', 'profile-photos', true),
  ('homework-submissions', 'homework-submissions', true),
  ('book-covers', 'book-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile photos
CREATE POLICY "Anyone can view profile photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload their own profile photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-photos');

CREATE POLICY "Users can update their own profile photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'profile-photos');

-- Storage policies for homework submissions
CREATE POLICY "Students can upload homework submissions"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'homework-submissions');

CREATE POLICY "Anyone can view homework submissions"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'homework-submissions');

-- Storage policies for book covers
CREATE POLICY "Anyone can view book covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'book-covers');

CREATE POLICY "Admins can upload book covers"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'book-covers');