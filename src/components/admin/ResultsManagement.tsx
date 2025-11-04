import React, { useState, useEffect } from 'react'
import { getCurrentUser } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { BarChart3, Plus, Upload, Download, Search, CreditCard as Edit, Trash2 } from 'lucide-react'
import type { Student, Class, Admin } from '../../lib/supabase'

interface Result {
  id: string
  student_id: string
  subject: string
  term: string
  marks: number
  max_marks: number
  grade: string
  exam_date: string
  created_at: string
  student?: Student
}

export default function ResultsManagement() {
  const [results, setResults] = useState<Result[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingResult, setEditingResult] = useState<Result | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClass, setSelectedClass] = useState('all')
  const [selectedTerm, setSelectedTerm] = useState('all')
  const [loading, setLoading] = useState(true)
  const [admin, setAdmin] = useState<Admin | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    student_id: '',
    subject: '',
    term: '',
    marks: '',
    max_marks: '100',
    grade: '',
    exam_date: ''
  })

  useEffect(() => {
    const user = getCurrentUser()
    if (user && user.userType === 'admin') {
      setAdmin(user as Admin)
    }
    loadResults()
    loadStudents()
    loadClasses()
  }, [])

  const loadResults = async () => {
    try {
      const { data, error } = await supabase
        .from('results')
        .select(`
          *,
          student:students(*)
        `)
        .order('exam_date', { ascending: false })

      if (data && !error) {
        setResults(data)
      }
    } catch (error) {
      console.error('Error loading results:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          class:classes(*)
        `)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (data && !error) {
        setStudents(data)
      }
    } catch (error) {
      console.error('Error loading students:', error)
    }
  }

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('class_number', { ascending: true })

      if (data && !error) {
        setClasses(data)
      }
    } catch (error) {
      console.error('Error loading classes:', error)
    }
  }

  const calculateGrade = (marks: number, maxMarks: number) => {
    const percentage = (marks / maxMarks) * 100
    if (percentage >= 90) return 'A+'
    if (percentage >= 80) return 'A'
    if (percentage >= 70) return 'B+'
    if (percentage >= 60) return 'B'
    if (percentage >= 50) return 'C+'
    if (percentage >= 40) return 'C'
    if (percentage >= 33) return 'D'
    return 'F'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!admin) return

    try {
      const marks = parseInt(formData.marks)
      const maxMarks = parseInt(formData.max_marks)
      const grade = formData.grade || calculateGrade(marks, maxMarks)

      const resultData = {
        student_id: formData.student_id,
        subject: formData.subject,
        term: formData.term,
        marks,
        max_marks: maxMarks,
        grade,
        exam_date: formData.exam_date,
        created_by: admin.id
      }

      if (editingResult) {
        const { error } = await supabase
          .from('results')
          .update(resultData)
          .eq('id', editingResult.id)

        if (!error) {
          alert('Result updated successfully!')
        }
      } else {
        const { error } = await supabase
          .from('results')
          .insert(resultData)

        if (!error) {
          alert('Result added successfully!')
        }
      }

      resetForm()
      loadResults()
    } catch (error) {
      console.error('Error saving result:', error)
      alert('Failed to save result')
    }
  }

  const handleEdit = (result: Result) => {
    setEditingResult(result)
    setFormData({
      student_id: result.student_id,
      subject: result.subject,
      term: result.term,
      marks: result.marks.toString(),
      max_marks: result.max_marks.toString(),
      grade: result.grade,
      exam_date: result.exam_date
    })
    setShowAddForm(true)
  }

  const handleDelete = async (resultId: string) => {
    if (!confirm('Are you sure you want to delete this result?')) return

    try {
      const { error } = await supabase
        .from('results')
        .delete()
        .eq('id', resultId)

      if (!error) {
        alert('Result deleted successfully!')
        loadResults()
      }
    } catch (error) {
      console.error('Error deleting result:', error)
      alert('Failed to delete result')
    }
  }

  const resetForm = () => {
    setFormData({
      student_id: '',
      subject: '',
      term: '',
      marks: '',
      max_marks: '100',
      grade: '',
      exam_date: ''
    })
    setEditingResult(null)
    setShowAddForm(false)
  }

  const filteredResults = results.filter(result => {
    const matchesSearch = result.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClass = selectedClass === 'all' || result.student?.class_id === selectedClass
    const matchesTerm = selectedTerm === 'all' || result.term === selectedTerm
    return matchesSearch && matchesClass && matchesTerm
  })

  const terms = ['all', ...Array.from(new Set(results.map(r => r.term)))]

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
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Results Management</h1>
        <p className="opacity-90">Manage student exam results and academic performance</p>
      </div>

      {/* Actions Bar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 text-purple-600 mr-2" />
              All Results ({filteredResults.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Result
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search by student or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="all">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
            >
              {terms.map(term => (
                <option key={term} value={term}>
                  {term === 'all' ? 'All Terms' : term}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingResult ? 'Edit Result' : 'Add New Result'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student *
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                    value={formData.student_id}
                    onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                    required
                  >
                    <option value="">Select Student</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.student_id}) - {student.class?.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Term *
                  </label>
                  <Input
                    value={formData.term}
                    onChange={(e) => setFormData({...formData, term: e.target.value})}
                    placeholder="e.g., Mid Term 1, Final Exam"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exam Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.exam_date}
                    onChange={(e) => setFormData({...formData, exam_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marks Obtained *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.marks}
                    onChange={(e) => {
                      const marks = e.target.value
                      const grade = marks && formData.max_marks 
                        ? calculateGrade(parseInt(marks), parseInt(formData.max_marks))
                        : ''
                      setFormData({...formData, marks, grade})
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Marks *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.max_marks}
                    onChange={(e) => {
                      const maxMarks = e.target.value
                      const grade = formData.marks && maxMarks 
                        ? calculateGrade(parseInt(formData.marks), parseInt(maxMarks))
                        : ''
                      setFormData({...formData, max_marks: maxMarks, grade})
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade
                  </label>
                  <Input
                    value={formData.grade}
                    onChange={(e) => setFormData({...formData, grade: e.target.value})}
                    placeholder="Auto-calculated"
                    readOnly
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingResult ? 'Update Result' : 'Add Result'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Results Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Student</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Subject</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Term</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Marks</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Percentage</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Grade</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((result) => {
                  const percentage = Math.round((result.marks / result.max_marks) * 100)
                  return (
                    <tr key={result.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{result.student?.name}</div>
                          <div className="text-sm text-gray-600">{result.student?.student_id}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">{result.subject}</td>
                      <td className="py-3 px-4">{result.term}</td>
                      <td className="py-3 px-4">
                        {result.marks}/{result.max_marks}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                          percentage >= 90 ? 'bg-green-100 text-green-800' :
                          percentage >= 80 ? 'bg-blue-100 text-blue-800' :
                          percentage >= 70 ? 'bg-yellow-100 text-yellow-800' :
                          percentage >= 60 ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {percentage}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">{result.grade}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(result.exam_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(result)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(result.id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {filteredResults.length === 0 && (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No results found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}