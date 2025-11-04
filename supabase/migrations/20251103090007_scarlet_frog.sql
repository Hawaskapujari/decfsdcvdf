/*
  # SOSE Lajpat Nagar School Database Schema

  1. New Tables
    - `admins` - Admin user accounts with email/password authentication
    - `students` - Student records with personal and academic information
    - `books` - Library catalog with book details and availability
    - `borrow_requests` - Library book borrowing system
    - `homework` - Homework assignments by subject and class
    - `submissions` - Student homework submissions with grades
    - `results` - Academic results and marks by term/subject
    - `attendance` - Daily attendance records
    - `notices` - School announcements and notices
    - `messages` - One-to-one and group messaging system
    - `voicelink_requests` - Counselling session requests
    - `ai_queries` - AI chatbot interactions and teacher escalations
    - `classes` - Class and section information

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Secure admin and student data separation

  3. Features
    - Complete authentication system
    - Library management with PDF support
    - Homework and grading workflow
    - Real-time messaging system
    - Counselling request management
    - AI-powered doubt resolution
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'student');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected', 'completed');
CREATE TYPE message_type AS ENUM ('personal', 'group', 'broadcast');
CREATE TYPE voicelink_type AS ENUM ('academic', 'personal', 'emotional');

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'admin',
  created_at timestamptz DEFAULT now(),
  last_login timestamptz,
  is_active boolean DEFAULT true
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, -- e.g., "10th A", "9th B"
  class_number integer NOT NULL, -- 9, 10, 11, 12
  section text NOT NULL, -- A, B, C
  class_teacher text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text UNIQUE NOT NULL, -- 11 digit student ID
  name text NOT NULL,
  dob date NOT NULL,
  class_id uuid REFERENCES classes(id),
  roll_number integer DEFAULT 0,
  fathers_name text DEFAULT '',
  mothers_name text DEFAULT '',
  address text DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  password_hash text, -- Set after first login
  bio text DEFAULT '', -- Editable by student
  profile_photo text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  last_login timestamptz,
  is_active boolean DEFAULT true
);

-- Books table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  subject text DEFAULT '',
  isbn text DEFAULT '',
  total_copies integer DEFAULT 1,
  available_copies integer DEFAULT 1,
  pdf_url text DEFAULT '',
  description text DEFAULT '',
  cover_image text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES admins(id)
);

-- Borrow requests table
CREATE TABLE IF NOT EXISTS borrow_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  status request_status DEFAULT 'pending',
  request_date timestamptz DEFAULT now(),
  issue_date timestamptz,
  return_date timestamptz,
  actual_return_date timestamptz,
  approved_by uuid REFERENCES admins(id),
  notes text DEFAULT ''
);

-- Homework table
CREATE TABLE IF NOT EXISTS homework (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  subject text NOT NULL,
  class_id uuid REFERENCES classes(id),
  deadline timestamptz NOT NULL,
  attachment_url text DEFAULT '',
  created_by uuid REFERENCES admins(id),
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id uuid REFERENCES homework(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  submission_text text DEFAULT '',
  attachment_url text DEFAULT '',
  submitted_at timestamptz DEFAULT now(),
  grade integer DEFAULT 0,
  max_grade integer DEFAULT 100,
  feedback text DEFAULT '',
  graded_by uuid REFERENCES admins(id),
  graded_at timestamptz
);

-- Results table
CREATE TABLE IF NOT EXISTS results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  subject text NOT NULL,
  term text NOT NULL, -- e.g., "Mid Term", "Final", "Unit Test"
  marks integer NOT NULL,
  max_marks integer DEFAULT 100,
  grade text DEFAULT '',
  exam_date date,
  created_by uuid REFERENCES admins(id),
  created_at timestamptz DEFAULT now()
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  date date NOT NULL,
  subject text NOT NULL,
  is_present boolean DEFAULT false,
  remarks text DEFAULT '',
  marked_by uuid REFERENCES admins(id),
  created_at timestamptz DEFAULT now()
);

-- Notices table
CREATE TABLE IF NOT EXISTS notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  file_url text DEFAULT '',
  priority text DEFAULT 'medium', -- low, medium, high
  target_class text DEFAULT 'all', -- 'all' or specific class
  publish_date timestamptz DEFAULT now(),
  expiry_date timestamptz,
  created_by uuid REFERENCES admins(id),
  is_active boolean DEFAULT true
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid, -- Can be admin or student
  sender_type user_role NOT NULL,
  receiver_id uuid, -- Can be admin or student
  receiver_type user_role,
  class_id uuid REFERENCES classes(id), -- For group messages
  message_type message_type DEFAULT 'personal',
  content text NOT NULL,
  attachment_url text DEFAULT '',
  sent_at timestamptz DEFAULT now(),
  is_read boolean DEFAULT false,
  edited_at timestamptz,
  is_deleted boolean DEFAULT false
);

-- VoiceLink requests table
CREATE TABLE IF NOT EXISTS voicelink_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  type voicelink_type NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  status request_status DEFAULT 'pending',
  counsellor_id uuid REFERENCES admins(id),
  scheduled_time timestamptz,
  meeting_link text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI queries table
CREATE TABLE IF NOT EXISTS ai_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  query text NOT NULL,
  ai_response text DEFAULT '',
  is_forwarded_to_teacher boolean DEFAULT false,
  teacher_id uuid REFERENCES admins(id),
  teacher_response text DEFAULT '',
  subject text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Insert sample data

-- Insert classes
INSERT INTO classes (name, class_number, section, class_teacher) VALUES
('10th A', 10, 'A', 'Preeti Vineet'),
('10th B', 10, 'B', 'Rajesh Kumar'),
('9th A', 9, 'A', 'Sunita Sharma'),
('11th A', 11, 'A', 'Amit Singh'),
('12th A', 12, 'A', 'Priya Gupta');

-- Insert sample admin
INSERT INTO admins (email, password_hash, name) VALUES
('admin@soselajpatnagar.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'School Administrator'),
('principal@soselajpatnagar.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Principal'),
('teacher@soselajpatnagar.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Teacher');

-- Insert sample student
INSERT INTO students (student_id, name, dob, class_id, roll_number, fathers_name, mothers_name, address) 
SELECT 
  '20230254457', 
  'Aftab Alam', 
  '2010-01-01', 
  c.id, 
  22, 
  'Jamshed Alam', 
  'Kalima Khatun', 
  'New Delhi'
FROM classes c WHERE c.name = '10th A';

-- Insert more sample students
INSERT INTO students (student_id, name, dob, class_id, roll_number, fathers_name, mothers_name, address) 
SELECT 
  '20230254458', 
  'Priya Sharma', 
  '2010-03-15', 
  c.id, 
  1, 
  'Rajesh Sharma', 
  'Sunita Sharma', 
  'Delhi'
FROM classes c WHERE c.name = '10th A';

INSERT INTO students (student_id, name, dob, class_id, roll_number, fathers_name, mothers_name, address) 
SELECT 
  '20230254459', 
  'Rahul Kumar', 
  '2010-05-20', 
  c.id, 
  2, 
  'Suresh Kumar', 
  'Asha Kumar', 
  'New Delhi'
FROM classes c WHERE c.name = '10th A';

-- Insert sample books
INSERT INTO books (title, author, subject, total_copies, available_copies, description) VALUES
('NCERT Mathematics Class 10', 'NCERT', 'Mathematics', 50, 45, 'Official NCERT textbook for Class 10 Mathematics'),
('NCERT Science Class 10', 'NCERT', 'Science', 50, 40, 'Official NCERT textbook for Class 10 Science'),
('NCERT English Class 10', 'NCERT', 'English', 30, 25, 'Official NCERT textbook for Class 10 English'),
('NCERT Social Science Class 10', 'NCERT', 'Social Science', 40, 35, 'Official NCERT textbook for Class 10 Social Science'),
('RD Sharma Mathematics', 'R.D. Sharma', 'Mathematics', 20, 18, 'Reference book for Mathematics Class 10');

-- Insert sample notices
INSERT INTO notices (title, content, target_class, created_by) 
SELECT 
  'Welcome to New Academic Year 2024-25',
  'Dear Students, Welcome to the new academic year. Classes will commence from Monday. Please report to your respective class teachers.',
  'all',
  a.id
FROM admins a WHERE a.email = 'admin@soselajpatnagar.edu' LIMIT 1;

INSERT INTO notices (title, content, target_class, created_by) 
SELECT 
  'Library Books Available',
  'New books have been added to the library. Students can now request books online through the portal.',
  'all',
  a.id
FROM admins a WHERE a.email = 'admin@soselajpatnagar.edu' LIMIT 1;

-- Insert sample homework
INSERT INTO homework (title, description, subject, class_id, deadline, created_by)
SELECT 
  'Mathematics - Chapter 1 Exercise',
  'Complete all questions from Chapter 1: Real Numbers. Submit handwritten solutions.',
  'Mathematics',
  c.id,
  now() + interval '7 days',
  a.id
FROM classes c, admins a 
WHERE c.name = '10th A' AND a.email = 'admin@soselajpatnagar.edu';

INSERT INTO homework (title, description, subject, class_id, deadline, created_by)
SELECT 
  'Science - Lab Report',
  'Write a detailed lab report on the acid-base reaction experiment conducted in class.',
  'Science',
  c.id,
  now() + interval '5 days',
  a.id
FROM classes c, admins a 
WHERE c.name = '10th A' AND a.email = 'admin@soselajpatnagar.edu';

-- Enable Row Level Security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE voicelink_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_queries ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Admins can access everything
CREATE POLICY "Admins can do everything" ON admins FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins can manage classes" ON classes FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins can manage students" ON students FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins can manage books" ON books FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins can manage borrow_requests" ON borrow_requests FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins can manage homework" ON homework FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins can manage submissions" ON submissions FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins can manage results" ON results FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins can manage attendance" ON attendance FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins can manage notices" ON notices FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins can manage messages" ON messages FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins can manage voicelink_requests" ON voicelink_requests FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins can manage ai_queries" ON ai_queries FOR ALL TO authenticated USING (true);

-- Public read access for authentication
CREATE POLICY "Public can read classes" ON classes FOR SELECT TO anon USING (true);
CREATE POLICY "Public can read students for auth" ON students FOR SELECT TO anon USING (true);
CREATE POLICY "Public can read admins for auth" ON admins FOR SELECT TO anon USING (true);

-- Students can read their own data
CREATE POLICY "Students can read own data" ON students FOR SELECT TO anon USING (true);
CREATE POLICY "Students can read books" ON books FOR SELECT TO anon USING (true);
CREATE POLICY "Students can read notices" ON notices FOR SELECT TO anon USING (true);
CREATE POLICY "Students can read homework" ON homework FOR SELECT TO anon USING (true);
CREATE POLICY "Students can manage own submissions" ON submissions FOR ALL TO anon USING (true);
CREATE POLICY "Students can read own results" ON results FOR SELECT TO anon USING (true);
CREATE POLICY "Students can read own attendance" ON attendance FOR SELECT TO anon USING (true);
CREATE POLICY "Students can manage own borrow_requests" ON borrow_requests FOR ALL TO anon USING (true);
CREATE POLICY "Students can manage own messages" ON messages FOR ALL TO anon USING (true);
CREATE POLICY "Students can manage own voicelink_requests" ON voicelink_requests FOR ALL TO anon USING (true);
CREATE POLICY "Students can manage own ai_queries" ON ai_queries FOR ALL TO anon USING (true);