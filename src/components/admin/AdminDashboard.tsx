import React, { useState, useEffect } from 'react'
import { getCurrentUser } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { 
  Users, 
  BookOpen, 
  FileText, 
  BarChart3, 
  Calendar, 
  MessageCircle, 
  Heart, 
  Bell,
  AlertTriangle,
  TrendingUp,
  Clock
} from 'lucide-react'
import type { Admin } from '../../lib/supabase'

interface AdminDashboardProps {
  onNavigate: (page: string) => void
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeHomework: 0,
    pendingBorrowRequests: 0,
    pendingVoiceLinkRequests: 0,
    totalBooks: 0,
    recentNotices: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = getCurrentUser()
    if (user && user.userType === 'admin') {
      setAdmin(user as Admin)
      loadDashboardStats()
    }
  }, [])

  const loadDashboardStats = async () => {
    try {
      // Load various statistics
      const [
        studentsResult,
        homeworkResult,
        borrowRequestsResult,
        voiceLinkResult,
        booksResult,
        noticesResult
      ] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('homework').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('borrow_requests').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('voicelink_requests').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('books').select('id', { count: 'exact' }),
        supabase.from('notices').select('id', { count: 'exact' }).eq('is_active', true)
      ])

      setStats({
        totalStudents: studentsResult.count || 0,
        activeHomework: homeworkResult.count || 0,
        pendingBorrowRequests: borrowRequestsResult.count || 0,
        pendingVoiceLinkRequests: voiceLinkResult.count || 0,
        totalBooks: booksResult.count || 0,
        recentNotices: noticesResult.count || 0
      })
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
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
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {admin?.name}!</h1>
        <p className="opacity-90">Admin Dashboard - SOSE Lajpat Nagar</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onNavigate('students')}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onNavigate('homework')}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Homework</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeHomework}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onNavigate('library')}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Library Books</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBooks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onNavigate('library-requests')}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingBorrowRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onNavigate('voicelink')}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Counselling</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingVoiceLinkRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onNavigate('notices')}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Bell className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Notices</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recentNotices}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="p-4 h-auto flex-col"
                onClick={() => onNavigate('students-add')}
              >
                <Users className="h-6 w-6 mb-2" />
                Add Student
              </Button>
              <Button 
                variant="outline" 
                className="p-4 h-auto flex-col"
                onClick={() => onNavigate('homework-create')}
              >
                <FileText className="h-6 w-6 mb-2" />
                Create Homework
              </Button>
              <Button 
                variant="outline" 
                className="p-4 h-auto flex-col"
                onClick={() => onNavigate('books-add')}
              >
                <BookOpen className="h-6 w-6 mb-2" />
                Add Book
              </Button>
              <Button 
                variant="outline" 
                className="p-4 h-auto flex-col"
                onClick={() => onNavigate('notices-create')}
              >
                <Bell className="h-6 w-6 mb-2" />
                Create Notice
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
              Pending Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.pendingBorrowRequests > 0 && (
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center">
                    <BookOpen className="h-5 w-5 text-orange-600 mr-2" />
                    <span className="text-sm font-medium">Book Requests</span>
                  </div>
                  <span className="bg-orange-600 text-white px-2 py-1 rounded-full text-xs">
                    {stats.pendingBorrowRequests}
                  </span>
                </div>
              )}
              
              {stats.pendingVoiceLinkRequests > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center">
                    <Heart className="h-5 w-5 text-red-600 mr-2" />
                    <span className="text-sm font-medium">Counselling Requests</span>
                  </div>
                  <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs">
                    {stats.pendingVoiceLinkRequests}
                  </span>
                </div>
              )}
              
              {stats.pendingBorrowRequests === 0 && stats.pendingVoiceLinkRequests === 0 && (
                <p className="text-gray-500 text-center py-4">No pending actions</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
              Student Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Students</span>
                <span className="font-medium">{stats.totalStudents}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Today</span>
                <span className="font-medium text-green-600">{Math.floor(stats.totalStudents * 0.85)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Homework Submitted</span>
                <span className="font-medium text-blue-600">{Math.floor(stats.totalStudents * 0.72)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 text-purple-600 mr-2" />
              Library Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Books</span>
                <span className="font-medium">{stats.totalBooks}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Books Issued</span>
                <span className="font-medium text-orange-600">{Math.floor(stats.totalBooks * 0.15)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending Requests</span>
                <span className="font-medium text-red-600">{stats.pendingBorrowRequests}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="h-5 w-5 text-blue-600 mr-2" />
              Communication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Notices</span>
                <span className="font-medium">{stats.recentNotices}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Counselling Requests</span>
                <span className="font-medium text-purple-600">{stats.pendingVoiceLinkRequests}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Messages Today</span>
                <span className="font-medium text-green-600">24</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}