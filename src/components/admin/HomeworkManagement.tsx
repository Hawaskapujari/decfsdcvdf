import React, { useState, useEffect } from 'react'
import { getCurrentUser } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { FileText, Plus, Clock, CheckCircle, Eye, CreditCard as Edit, Trash2 } from 'lucide-react'
import type { Homework, Submission, Class, Admin } from '../../lib/supabase'

export default function HomeworkManagement() {
  const [activeTab, setActiveTab] = useState<'homework' | 'submissions'>('homework')
  const [homework, setHomework] = useState<Homework[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingHomework, setEditingHomework] = useState<Homework | null>(null)
  const [selectedHomework, setSelectedHomework] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [admin, setAdmin] = useState<Admin | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    class_id: '',
    deadline: '',
    attachment_url: ''
  })

  useEffect(() => {
    const user = getCurrentUser()
    if (user && user.userType === 'admin') {
      setAdmin(user as Admin)
    }
    loadHomework()
    loadClasses()
    loadSubmissions()
  }, [])

  const loadHomework = async () => {
    try {
      const { data, error } = await supabase
        .from('homework')
        .select(`
          *,
          class:classes(*)
        `)
        .order('deadline', { ascending: false })

      if (data && !error) {
        setHomework(data)
      }
    } catch (error) {
      console.error('Error loading homework:', error)
    } finally {
      setLoading(false)
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

  const loadSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          homework:homework(*),
          student:students(*)
        `)
        .order('submitted_at', { ascending: false })

      if (data && !error) {
        setSubmissions(data)
      }
    } catch (error) {
      console.error('Error loading submissions:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!admin) return

    try {
      const homeworkData = {
        ...formData,
        created_by: admin.id,
        deadline: new Date(formData.deadline).toISOString()
      }

      if (editingHomework) {
        const { error } = await supabase
          .from('homework')
          .update(homeworkData)
          .eq('id', editingHomework.id)

        if (!error) {
          alert('Homework updated successfully!')
        }
      } else {
        const { error } = await supabase
          .from('homework')
          .insert(homeworkData)

        if (!error) {
          alert('Homework created successfully!')
        }
      }

      resetForm()
      loadHomework()
    } catch (error) {
      console.error('Error saving homework:', error)
      alert('Failed to save homework')
    }
  }

  const handleEdit = (hw: Homework) => {
    setEditingHomework(hw)
    setFormData({
      title: hw.title,
      description: hw.description || '',
      subject: hw.subject,
      class_id: hw.class_id || '',
      deadline: new Date(hw.deadline).toISOString().slice(0, 16),
      attachment_url: hw.attachment_url || ''
    })
    setShowAddForm(true)
  }

  const handleDelete = async (homeworkId: string) => {
    if (!confirm('Are you sure you want to delete this homework?')) return

    try {
      const { error } = await supabase
        .from('homework')
        .delete()
        .eq('id', homeworkId)

      if (!error) {
        alert('Homework deleted successfully!')
        loadHomework()
      }
    } catch (error) {
      console.error('Error deleting homework:', error)
      alert('Failed to delete homework')
    }
  }

  const handleGradeSubmission = async (submissionId: string, grade: number, feedback: string) => {
    if (!admin) return

    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          grade,
          feedback,
          graded_by: admin.id,
          graded_at: new Date().toISOString()
        })
        .eq('id', submissionId)

      if (!error) {
        alert('Submission graded successfully!')
        loadSubmissions()
      }
    } catch (error) {
      console.error('Error grading submission:', error)
      alert('Failed to grade submission')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      subject: '',
      class_id: '',
      deadline: '',
      attachment_url: ''
    })
    setEditingHomework(null)
    setShowAddForm(false)
  }

  const filteredSubmissions = selectedHomework 
    ? submissions.filter(s => s.homework_id === selectedHomework)
    : submissions

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
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Homework Management</h1>
        <p className="opacity-90">Create assignments and review student submissions</p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg bg-gray-100 p-1">
        <button
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'homework'
              ? 'bg-white text-green-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('homework')}
        >
          <FileText className="h-4 w-4 inline mr-2" />
          All Homework ({homework.length})
        </button>
        <button
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'submissions'
              ? 'bg-white text-green-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('submissions')}
        >
          <CheckCircle className="h-4 w-4 inline mr-2" />
          Submissions ({submissions.length})
        </button>
      </div>

      {/* Homework Tab */}
      {activeTab === 'homework' && (
        <>
          {/* Actions Bar */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 text-green-600 mr-2" />
                  All Homework ({homework.length})
                </CardTitle>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Homework
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Add/Edit Form */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingHomework ? 'Edit Homework' : 'Create New Homework'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title *
                      </label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        required
                      />
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
                        Class *
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                        value={formData.class_id}
                        onChange={(e) => setFormData({...formData, class_id: e.target.value})}
                        required
                      >
                        <option value="">Select Class</option>
                        {classes.map(cls => (
                          <option key={cls.id} value={cls.id}>{cls.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Deadline *
                      </label>
                      <Input
                        type="datetime-local"
                        value={formData.deadline}
                        onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Attachment URL
                      </label>
                      <Input
                        type="url"
                        value={formData.attachment_url}
                        onChange={(e) => setFormData({...formData, attachment_url: e.target.value})}
                        placeholder="https://example.com/attachment.pdf"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-md resize-none h-24"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Homework instructions and requirements..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">
                      {editingHomework ? 'Update Homework' : 'Create Homework'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Homework List */}
          <div className="space-y-4">
            {homework.map((hw) => (
              <Card key={hw.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">{hw.title}</h4>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {hw.subject}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          hw.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {hw.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{hw.class?.name}</p>
                      
                      {hw.description && (
                        <p className="text-sm text-gray-700 mb-2 line-clamp-2">{hw.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Due: {new Date(hw.deadline).toLocaleString()}
                        </div>
                        <div>
                          Created: {new Date(hw.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(hw)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(hw.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {homework.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No homework created yet.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Submissions Tab */}
      {activeTab === 'submissions' && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-orange-600 mr-2" />
                  Student Submissions ({filteredSubmissions.length})
                </CardTitle>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                  value={selectedHomework}
                  onChange={(e) => setSelectedHomework(e.target.value)}
                >
                  <option value="">All Homework</option>
                  {homework.map(hw => (
                    <option key={hw.id} value={hw.id}>{hw.title}</option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredSubmissions.map((submission) => (
                  <div key={submission.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {submission.homework?.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Student:</strong> {submission.student?.name} ({submission.student?.student_id})
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Submitted:</strong> {new Date(submission.submitted_at).toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        {submission.grade > 0 ? (
                          <span className="px-2 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            Graded: {submission.grade}/{submission.max_grade}
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                            Pending Review
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded p-3 mb-3">
                      <h5 className="font-medium text-gray-900 mb-2">Submission:</h5>
                      <p className="text-sm text-gray-700">{submission.submission_text}</p>
                    </div>
                    
                    {submission.feedback && (
                      <div className="bg-blue-50 rounded p-3 mb-3">
                        <h5 className="font-medium text-blue-900 mb-2">Feedback:</h5>
                        <p className="text-sm text-blue-800">{submission.feedback}</p>
                      </div>
                    )}
                    
                    {submission.grade === 0 && (
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Grade (0-100)"
                          className="w-32"
                          id={`grade-${submission.id}`}
                        />
                        <Input
                          placeholder="Feedback"
                          className="flex-1"
                          id={`feedback-${submission.id}`}
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            const gradeInput = document.getElementById(`grade-${submission.id}`) as HTMLInputElement
                            const feedbackInput = document.getElementById(`feedback-${submission.id}`) as HTMLInputElement
                            const grade = parseInt(gradeInput.value)
                            const feedback = feedbackInput.value
                            
                            if (grade >= 0 && grade <= 100) {
                              handleGradeSubmission(submission.id, grade, feedback)
                            } else {
                              alert('Please enter a valid grade (0-100)')
                            }
                          }}
                        >
                          Grade
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                
                {filteredSubmissions.length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No submissions found.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}