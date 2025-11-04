import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { loginStudent, loginAdmin, setCurrentUser } from '../../lib/auth'
import { GraduationCap, User, Calendar, Mail, Lock, AlertCircle } from 'lucide-react'

interface LoginPageProps {
  onLogin: (user: any, userType: 'student' | 'admin') => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Student login form
  const [studentId, setStudentId] = useState('')
  const [dob, setDob] = useState('')

  // Admin login form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (studentId.length !== 11) {
      setError('Student ID must be exactly 11 digits')
      setLoading(false)
      return
    }

    const result = await loginStudent(studentId, dob)
    setLoading(false)

    if (result.success && result.user) {
      setCurrentUser({ ...result.user, userType: 'student' })
      onLogin(result.user, 'student')
    } else {
      setError(result.error || 'Login failed')
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await loginAdmin(email, password)
    setLoading(false)

    if (result.success && result.user) {
      setCurrentUser({ ...result.user, userType: 'admin' })
      onLogin(result.user, 'admin')
    } else {
      setError(result.error || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* School Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">SOSE Lajpat Nagar</h1>
          <p className="text-gray-600 mt-2">School Web Portal</p>
        </div>

        {/* Login Tabs */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'student'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('student')}
          >
            <User className="h-4 w-4 inline mr-2" />
            Student
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'admin'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('admin')}
          >
            <GraduationCap className="h-4 w-4 inline mr-2" />
            Admin
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Student Login Form */}
        {activeTab === 'student' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Student Login</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStudentLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="h-4 w-4 inline mr-2" />
                    Student ID (11 digits)
                  </label>
                  <Input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Enter your 11-digit Student ID"
                    maxLength={11}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Date of Birth
                  </label>
                  <Input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
              
              {/* Sample Credentials */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800 font-medium mb-1">Sample Student Login:</p>
                <p className="text-xs text-blue-700">ID: 20230254457</p>
                <p className="text-xs text-blue-700">DOB: 01/01/2010 (2010-01-01)</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin Login Form */}
        {activeTab === 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Admin Login</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Lock className="h-4 w-4 inline mr-2" />
                    Password
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
              
              {/* Sample Credentials */}
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-800 font-medium mb-1">Sample Admin Login:</p>
                <p className="text-xs text-green-700">Email: admin@soselajpatnagar.edu</p>
                <p className="text-xs text-green-700">Password: Any password works</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>© 2024 SOSE Lajpat Nagar. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}