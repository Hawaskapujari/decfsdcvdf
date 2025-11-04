import { supabase } from './supabase'
import type { Student, Admin } from './supabase'

export interface AuthResponse {
  success: boolean
  user?: Student | Admin
  error?: string
  userType?: 'student' | 'admin'
}

// Student login with Student ID and DOB
export async function loginStudent(studentId: string, dob: string): Promise<AuthResponse> {
  try {
    const { data: student, error } = await supabase
      .from('students')
      .select(`
        *,
        class:classes(*)
      `)
      .eq('student_id', studentId)
      .eq('dob', dob)
      .single()

    if (error || !student) {
      return { success: false, error: 'Invalid Student ID or Date of Birth' }
    }

    if (!student.is_active) {
      return { success: false, error: 'Account is inactive. Please contact administration.' }
    }

    // Update last login
    await supabase
      .from('students')
      .update({ last_login: new Date().toISOString() })
      .eq('id', student.id)

    return { success: true, user: student, userType: 'student' }
  } catch (error) {
    console.error('Student login error:', error)
    return { success: false, error: 'An error occurred during login' }
  }
}

// Admin login with email and password
export async function loginAdmin(email: string, password: string): Promise<AuthResponse> {
  try {
    // In a real app, you'd hash the password and compare
    // For demo purposes, we'll use simple comparison
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (error || !admin) {
      return { success: false, error: 'Invalid email or password' }
    }

    if (!admin.is_active) {
      return { success: false, error: 'Account is inactive. Please contact system administrator.' }
    }

    // In production, use proper password hashing (bcrypt)
    // For demo, we'll accept any password for admin accounts
    
    // Update last login
    await supabase
      .from('admins')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id)

    return { success: true, user: admin, userType: 'admin' }
  } catch (error) {
    console.error('Admin login error:', error)
    return { success: false, error: 'An error occurred during login' }
  }
}

// Set password for first-time student login
export async function setStudentPassword(studentId: string, password: string): Promise<boolean> {
  try {
    // In production, hash the password properly
    const { error } = await supabase
      .from('students')
      .update({ password_hash: password }) // Should be hashed
      .eq('student_id', studentId)

    return !error
  } catch (error) {
    console.error('Set password error:', error)
    return false
  }
}

// Storage for current user (in production, use proper session management)
let currentUser: (Student | Admin) & { userType: 'student' | 'admin' } | null = null

export function getCurrentUser() {
  return currentUser
}

export function setCurrentUser(user: (Student | Admin) & { userType: 'student' | 'admin' } | null) {
  currentUser = user
}

export function logout() {
  currentUser = null
}

export function isStudent(): boolean {
  return currentUser?.userType === 'student'
}

export function isAdmin(): boolean {
  return currentUser?.userType === 'admin'
}