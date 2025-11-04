import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface Student {
  id: string
  student_id: string
  name: string
  dob: string
  class_id: string
  roll_number: number
  fathers_name: string
  mothers_name: string
  address: string
  email: string
  phone: string
  bio: string
  profile_photo: string
  password_hash?: string
  created_at: string
  last_login?: string
  is_active: boolean
  class?: Class
}

export interface Admin {
  id: string
  email: string
  name: string
  role: string
  created_at: string
  last_login?: string
  is_active: boolean
}

export interface Class {
  id: string
  name: string
  class_number: number
  section: string
  class_teacher: string
  created_at: string
}

export interface Book {
  id: string
  title: string
  author: string
  subject: string
  isbn: string
  total_copies: number
  available_copies: number
  pdf_url: string
  description: string
  cover_image: string
  created_at: string
}

export interface BorrowRequest {
  id: string
  book_id: string
  student_id: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  request_date: string
  issue_date?: string
  return_date?: string
  actual_return_date?: string
  notes: string
  book?: Book
  student?: Student
}

export interface Homework {
  id: string
  title: string
  description: string
  subject: string
  class_id: string
  deadline: string
  attachment_url: string
  created_at: string
  is_active: boolean
  class?: Class
}

export interface Submission {
  id: string
  homework_id: string
  student_id: string
  submission_text: string
  attachment_url: string
  submitted_at: string
  grade: number
  max_grade: number
  feedback: string
  graded_at?: string
  homework?: Homework
}

export interface Notice {
  id: string
  title: string
  content: string
  file_url: string
  priority: string
  target_class: string
  publish_date: string
  expiry_date?: string
  is_active: boolean
}

export interface VoiceLinkRequest {
  id: string
  student_id: string
  type: 'academic' | 'personal' | 'emotional'
  subject: string
  description: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  scheduled_time?: string
  meeting_link: string
  notes: string
  created_at: string
  student?: Student
}

export interface Message {
  id: string
  sender_id: string
  sender_type: 'admin' | 'student'
  receiver_id?: string
  receiver_type?: 'admin' | 'student'
  class_id?: string
  message_type: 'personal' | 'group' | 'broadcast'
  content: string
  attachment_url: string
  sent_at: string
  is_read: boolean
}

export interface AIQuery {
  id: string
  student_id: string
  query: string
  ai_response: string
  is_forwarded_to_teacher: boolean
  teacher_response: string
  subject: string
  created_at: string
  resolved_at?: string
}