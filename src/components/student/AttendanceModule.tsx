import React, { useState, useEffect } from 'react'
import { getCurrentUser } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Calendar, CheckCircle, XCircle, Clock, TrendingDown, AlertTriangle } from 'lucide-react'
import type { Student } from '../../lib/supabase'

interface Attendance {
  id: string
  student_id: string
  date: string
  subject: string
  is_present: boolean
  remarks: string
  created_at: string
}

export default function AttendanceModule() {
  const [student, setStudent] = useState<Student | null>(null)
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = getCurrentUser()
    if (user && user.userType === 'student') {
      setStudent(user as Student)
      loadAttendance(user.id)
    }
  }, [selectedMonth, selectedYear])

  const loadAttendance = async (studentId: string) => {
    try {
      const startDate = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0]
      const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', studentId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

      if (data && !error) {
        setAttendance(data)
      }
    } catch (error) {
      console.error('Error loading attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAttendanceStats = () => {
    const totalDays = attendance.length
    const presentDays = attendance.filter(a => a.is_present).length
    const absentDays = totalDays - presentDays
    const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0

    return { totalDays, presentDays, absentDays, percentage }
  }

  const getAttendanceBySubject = () => {
    const subjects = Array.from(new Set(attendance.map(a => a.subject)))
    return subjects.map(subject => {
      const subjectAttendance = attendance.filter(a => a.subject === subject)
      const present = subjectAttendance.filter(a => a.is_present).length
      const total = subjectAttendance.length
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0
      return { subject, present, total, percentage }
    })
  }

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getAttendanceForDate = (date: string) => {
    return attendance.filter(a => a.date === date)
  }

  const stats = calculateAttendanceStats()
  const subjectStats = getAttendanceBySubject()
  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth)

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Attendance Tracker</h1>
        <p className="opacity-90">Monitor your daily attendance and performance</p>
      </div>

      {/* Month/Year Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 text-blue-600 mr-2" />
            Select Month & Year
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <select
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            >
              {months.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {[2023, 2024, 2025].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Days</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDays}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Present</p>
                <p className="text-2xl font-bold text-gray-900">{stats.presentDays}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Absent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.absentDays}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingDown className={`h-8 w-8 ${stats.percentage >= 75 ? 'text-green-600' : 'text-red-600'}`} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Percentage</p>
                <p className={`text-2xl font-bold ${stats.percentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.percentage}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Alert */}
      {stats.percentage < 75 && stats.totalDays > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
              <div>
                <h4 className="font-medium text-red-900">Low Attendance Warning</h4>
                <p className="text-sm text-red-800 mt-1">
                  Your attendance is below 75%. Please improve your attendance to meet the minimum requirement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subject-wise Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            Subject-wise Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectStats.map((subject) => (
              <div key={subject.subject} className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{subject.subject}</h4>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    {subject.present}/{subject.total} days
                  </span>
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                    subject.percentage >= 75 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {subject.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      subject.percentage >= 75 ? 'bg-green-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${subject.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          {subjectStats.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No attendance records found for this month.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Attendance Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 text-purple-600 mr-2" />
            Daily Attendance - {months[selectedMonth]} {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const date = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const dayAttendance = getAttendanceForDate(date)
              const isPresent = dayAttendance.some(a => a.is_present)
              const isAbsent = dayAttendance.some(a => !a.is_present)
              const hasRecord = dayAttendance.length > 0
              
              return (
                <div
                  key={day}
                  className={`aspect-square flex items-center justify-center text-sm rounded-lg border-2 ${
                    !hasRecord 
                      ? 'border-gray-200 bg-gray-50 text-gray-400'
                      : isPresent && !isAbsent
                      ? 'border-green-200 bg-green-100 text-green-800'
                      : isAbsent && !isPresent
                      ? 'border-red-200 bg-red-100 text-red-800'
                      : 'border-yellow-200 bg-yellow-100 text-yellow-800'
                  }`}
                  title={
                    !hasRecord 
                      ? 'No record'
                      : `${dayAttendance.filter(a => a.is_present).length} present, ${dayAttendance.filter(a => !a.is_present).length} absent`
                  }
                >
                  {day}
                </div>
              )
            })}
          </div>
          
          <div className="flex items-center justify-center gap-6 mt-6 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-100 border-2 border-green-200 rounded mr-2"></div>
              <span className="text-gray-600">Present</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-100 border-2 border-red-200 rounded mr-2"></div>
              <span className="text-gray-600">Absent</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-200 rounded mr-2"></div>
              <span className="text-gray-600">Partial</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-50 border-2 border-gray-200 rounded mr-2"></div>
              <span className="text-gray-600">No Record</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}