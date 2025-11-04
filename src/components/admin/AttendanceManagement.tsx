import React, { useState, useEffect } from 'react'
import { getCurrentUser } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Calendar, Plus, CheckCircle, XCircle, Upload, Download } from 'lucide-react'
import type { Student, Class, Admin } from '../../lib/supabase'

interface Attendance {
  id: string
  student_id: string
  date: string
  subject: string
  is_present: boolean
  remarks: string
  student?: Student
}

export default function AttendanceManagement() {
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [admin, setAdmin] = useState<Admin | null>(null)

  const subjects = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Computer Science']

  useEffect(() => {
    const user = getCurrentUser()
    if (user && user.userType === 'admin') {
      setAdmin(user as Admin)
    }
    loadClasses()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      loadStudents()
      loadAttendance()
    }
  }, [selectedClass, selectedDate, selectedSubject])

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('class_number', { ascending: true })

      if (data && !error) {
        setClasses(data)
        if (data.length > 0) {
          setSelectedClass(data[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading classes:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', selectedClass)
        .eq('is_active', true)
        .order('roll_number', { ascending: true })

      if (data && !error) {
        setStudents(data)
      }
    } catch (error) {
      console.error('Error loading students:', error)
    }
  }

  const loadAttendance = async () => {
    if (!selectedClass || !selectedDate || !selectedSubject) return

    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          student:students(*)
        `)
        .eq('date', selectedDate)
        .eq('subject', selectedSubject)
        .in('student_id', students.map(s => s.id))

      if (data && !error) {
        setAttendance(data)
      }
    } catch (error) {
      console.error('Error loading attendance:', error)
    }
  }

  const getAttendanceForStudent = (studentId: string) => {
    return attendance.find(a => a.student_id === studentId)
  }

  const handleAttendanceChange = async (studentId: string, isPresent: boolean) => {
    if (!admin || !selectedDate || !selectedSubject) return

    setSaving(true)
    try {
      const existingAttendance = getAttendanceForStudent(studentId)
      
      if (existingAttendance) {
        // Update existing record
        const { error } = await supabase
          .from('attendance')
          .update({ 
            is_present: isPresent,
            marked_by: admin.id
          })
          .eq('id', existingAttendance.id)

        if (!error) {
          setAttendance(prev => prev.map(a => 
            a.id === existingAttendance.id 
              ? { ...a, is_present: isPresent }
              : a
          ))
        }
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('attendance')
          .insert({
            student_id: studentId,
            date: selectedDate,
            subject: selectedSubject,
            is_present: isPresent,
            marked_by: admin.id
          })
          .select(`
            *,
            student:students(*)
          `)
          .single()

        if (data && !error) {
          setAttendance(prev => [...prev, data])
        }
      }
    } catch (error) {
      console.error('Error updating attendance:', error)
    } finally {
      setSaving(false)
    }
  }

  const markAllPresent = async () => {
    if (!admin || !selectedDate || !selectedSubject) return

    setSaving(true)
    try {
      const attendanceData = students.map(student => ({
        student_id: student.id,
        date: selectedDate,
        subject: selectedSubject,
        is_present: true,
        marked_by: admin.id
      }))

      // Delete existing records for this date/subject
      await supabase
        .from('attendance')
        .delete()
        .eq('date', selectedDate)
        .eq('subject', selectedSubject)
        .in('student_id', students.map(s => s.id))

      // Insert new records
      const { error } = await supabase
        .from('attendance')
        .insert(attendanceData)

      if (!error) {
        loadAttendance()
        alert('All students marked present!')
      }
    } catch (error) {
      console.error('Error marking all present:', error)
    } finally {
      setSaving(false)
    }
  }

  const markAllAbsent = async () => {
    if (!admin || !selectedDate || !selectedSubject) return

    setSaving(true)
    try {
      const attendanceData = students.map(student => ({
        student_id: student.id,
        date: selectedDate,
        subject: selectedSubject,
        is_present: false,
        marked_by: admin.id
      }))

      // Delete existing records for this date/subject
      await supabase
        .from('attendance')
        .delete()
        .eq('date', selectedDate)
        .eq('subject', selectedSubject)
        .in('student_id', students.map(s => s.id))

      // Insert new records
      const { error } = await supabase
        .from('attendance')
        .insert(attendanceData)

      if (!error) {
        loadAttendance()
        alert('All students marked absent!')
      }
    } catch (error) {
      console.error('Error marking all absent:', error)
    } finally {
      setSaving(false)
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
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Attendance Management</h1>
        <p className="opacity-90">Mark and manage student attendance records</p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 text-orange-600 mr-2" />
              Mark Attendance
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">Select Class</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">Select Subject</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button 
                size="sm" 
                onClick={markAllPresent}
                disabled={!selectedClass || !selectedSubject || saving}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                All Present
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={markAllAbsent}
                disabled={!selectedClass || !selectedSubject || saving}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-1" />
                All Absent
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance List */}
      {selectedClass && selectedSubject && (
        <Card>
          <CardHeader>
            <CardTitle>
              {classes.find(c => c.id === selectedClass)?.name} - {selectedSubject}
              <span className="text-sm font-normal text-gray-600 ml-2">
                ({new Date(selectedDate).toLocaleDateString()})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {students.map((student) => {
                const studentAttendance = getAttendanceForStudent(student.id)
                const isPresent = studentAttendance?.is_present ?? null
                
                return (
                  <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-blue-800">
                          {student.roll_number}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-600">{student.student_id}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={isPresent === true ? "default" : "outline"}
                        onClick={() => handleAttendanceChange(student.id, true)}
                        disabled={saving}
                        className={isPresent === true ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Present
                      </Button>
                      <Button
                        size="sm"
                        variant={isPresent === false ? "default" : "outline"}
                        onClick={() => handleAttendanceChange(student.id, false)}
                        disabled={saving}
                        className={isPresent === false ? "bg-red-600 hover:bg-red-700" : ""}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Absent
                      </Button>
                    </div>
                  </div>
                )
              })}
              
              {students.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No students found in selected class.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {selectedClass && selectedSubject && students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{students.length}</div>
                <div className="text-sm text-gray-600">Total Students</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {attendance.filter(a => a.is_present).length}
                </div>
                <div className="text-sm text-gray-600">Present</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {attendance.filter(a => !a.is_present).length}
                </div>
                <div className="text-sm text-gray-600">Absent</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}