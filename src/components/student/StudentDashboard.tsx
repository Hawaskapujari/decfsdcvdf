import React, { useState, useEffect } from 'react'
import { getCurrentUser } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { 
  User, 
  BookOpen, 
  FileText, 
  BarChart3, 
  Calendar, 
  MessageCircle, 
  Heart, 
  Brain,
  Bell,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import type { Student, Notice, Homework, BorrowRequest } from '../../lib/supabase'

interface StudentDashboardProps {
  onNavigate: (page: string) => void
}

export default function StudentDashboard({ onNavigate }: StudentDashboardProps) {
  const [student, setStudent] = useState<Student | null>(null)
  const [notices, setNotices] = useState<Notice[]>([])
  const [homework, setHomework] = useState<Homework[]>([])
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = getCurrentUser()
    if (user && user.userType === 'student') {
      setStudent(user as Student)
      loadDashboardData(user.id)
    }
  }, [])

  const loadDashboardData = async (studentId: string) => {
    try {
      // Load notices
      const { data: noticesData } = await supabase
        .from('notices')
        .select('*')
        .eq('is_active', true)
        .order('publish_date', { ascending: false })
        .limit(3)

      if (noticesData) setNotices(noticesData)

      // Load homework
      const { data: homeworkData } = await supabase
        .from('homework')
        .select(`
          *,
          class:classes(*)
        `)
        .eq('is_active', true)
        .gte('deadline', new Date().toISOString())
        .order('deadline', { ascending: true })
        .limit(3)

      if (homeworkData) setHomework(homeworkData)

      // Load borrowed books
      const { data: borrowData } = await supabase
        .from('borrow_requests')
        .select(`
          *,
          book:books(*)
        `)
        .eq('student_id', studentId)
        .eq('status', 'approved')
        .is('actual_return_date', null)

      if (borrowData) setBorrowedBooks(borrowData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {student?.name}!</h1>
        <p className="opacity-90">
          Class: {student?.class?.name} | Roll No: {student?.roll_number}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onNavigate('homework')}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Homework</p>
                <p className="text-2xl font-bold text-gray-900">{homework.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onNavigate('library')}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Borrowed Books</p>
                <p className="text-2xl font-bold text-gray-900">{borrowedBooks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onNavigate('results')}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Latest Results</p>
                <p className="text-2xl font-bold text-gray-900">View</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onNavigate('attendance')}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Attendance</p>
                <p className="text-2xl font-bold text-gray-900">85%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Notices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 text-blue-600 mr-2" />
              Latest Notices
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('notices')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notices.length > 0 ? (
                notices.map((notice) => (
                  <div key={notice.id} className="border-l-4 border-blue-600 pl-4">
                    <h4 className="font-medium text-gray-900">{notice.title}</h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notice.content}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(notice.publish_date).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No notices available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Homework */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 text-green-600 mr-2" />
              Upcoming Homework
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('homework')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {homework.length > 0 ? (
                homework.map((hw) => (
                  <div key={hw.id} className="border rounded-lg p-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{hw.title}</h4>
                        <p className="text-sm text-gray-600">{hw.subject}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-600">
                          Due: {new Date(hw.deadline).toLocaleDateString()}
                        </p>
                        <Clock className="h-4 w-4 text-red-600 inline ml-1" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No pending homework</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="p-6 h-auto flex-col"
              onClick={() => onNavigate('chat')}
            >
              <MessageCircle className="h-6 w-6 mb-2" />
              Class Chat
            </Button>
            <Button 
              variant="outline" 
              className="p-6 h-auto flex-col"
              onClick={() => onNavigate('voicelink')}
            >
              <Heart className="h-6 w-6 mb-2" />
              VoiceLink
            </Button>
            <Button 
              variant="outline" 
              className="p-6 h-auto flex-col"
              onClick={() => onNavigate('ai-doubt')}
            >
              <Brain className="h-6 w-6 mb-2" />
              AI Doubt Solver
            </Button>
            <Button 
              variant="outline" 
              className="p-6 h-auto flex-col"
              onClick={() => onNavigate('profile')}
            >
              <User className="h-6 w-6 mb-2" />
              Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Borrowed Books */}
      {borrowedBooks.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 text-purple-600 mr-2" />
              Borrowed Books
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('library')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {borrowedBooks.map((request) => (
                <div key={request.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{request.book?.title}</h4>
                    <p className="text-sm text-gray-600">{request.book?.author}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-orange-600">
                      Return by: {request.return_date ? new Date(request.return_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}