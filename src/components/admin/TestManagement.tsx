import React, { useState, useEffect } from 'react'
import { getCurrentUser } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { FileText, Plus, Clock, Users, BarChart3, CreditCard as Edit, Trash2, Eye } from 'lucide-react'
import type { Admin, Class, Test, TestAttempt } from '../../lib/supabase'

export default function TestManagement() {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [tests, setTests] = useState<Test[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [attempts, setAttempts] = useState<TestAttempt[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTest, setEditingTest] = useState<Test | null>(null)
  const [selectedTest, setSelectedTest] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    class_id: '',
    duration_minutes: '60',
    start_time: '',
    end_time: '',
    instructions: '',
    questions: [{ question: '', options: ['', '', '', ''], correct_answer: '' }]
  })

  useEffect(() => {
    const user = getCurrentUser()
    if (user && user.userType === 'admin') {
      setAdmin(user as Admin)
    }
    loadTests()
    loadClasses()
    loadAttempts()
  }, [])

  const loadTests = async () => {
    try {
      const { data, error } = await supabase
        .from('tests')
        .select(`
          *,
          class:classes(*)
        `)
        .order('created_at', { ascending: false })

      if (data && !error) {
        setTests(data)
      }
    } catch (error) {
      console.error('Error loading tests:', error)
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

  const loadAttempts = async () => {
    try {
      const { data, error } = await supabase
        .from('test_attempts')
        .select(`
          *,
          test:tests(*),
          student:students(*)
        `)
        .order('attempted_at', { ascending: false })

      if (data && !error) {
        setAttempts(data)
      }
    } catch (error) {
      console.error('Error loading attempts:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!admin) return

    try {
      const testData = {
        ...formData,
        duration_minutes: parseInt(formData.duration_minutes),
        questions: formData.questions.filter(q => q.question.trim()),
        created_by: admin.id
      }

      if (editingTest) {
        const { error } = await supabase
          .from('tests')
          .update(testData)
          .eq('id', editingTest.id)

        if (!error) {
          alert('Test updated successfully!')
        }
      } else {
        const { error } = await supabase
          .from('tests')
          .insert(testData)

        if (!error) {
          alert('Test created successfully!')
        }
      }

      resetForm()
      loadTests()
    } catch (error) {
      console.error('Error saving test:', error)
      alert('Failed to save test')
    }
  }

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, { question: '', options: ['', '', '', ''], correct_answer: '' }]
    })
  }

  const updateQuestion = (index: number, field: string, value: string | string[]) => {
    const updatedQuestions = [...formData.questions]
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value }
    setFormData({ ...formData, questions: updatedQuestions })
  }

  const removeQuestion = (index: number) => {
    const updatedQuestions = formData.questions.filter((_, i) => i !== index)
    setFormData({ ...formData, questions: updatedQuestions })
  }

  const resetForm = () => {
    setFormData({
      title: '',
      subject: '',
      class_id: '',
      duration_minutes: '60',
      start_time: '',
      end_time: '',
      instructions: '',
      questions: [{ question: '', options: ['', '', '', ''], correct_answer: '' }]
    })
    setEditingTest(null)
    setShowCreateForm(false)
  }

  const handleEdit = (test: Test) => {
    setEditingTest(test)
    setFormData({
      title: test.title,
      subject: test.subject,
      class_id: test.class_id,
      duration_minutes: test.duration_minutes.toString(),
      start_time: new Date(test.start_time).toISOString().slice(0, 16),
      end_time: new Date(test.end_time).toISOString().slice(0, 16),
      instructions: test.instructions || '',
      questions: test.questions || [{ question: '', options: ['', '', '', ''], correct_answer: '' }]
    })
    setShowCreateForm(true)
  }

  const handleDelete = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return

    try {
      const { error } = await supabase
        .from('tests')
        .delete()
        .eq('id', testId)

      if (!error) {
        alert('Test deleted successfully!')
        loadTests()
      }
    } catch (error) {
      console.error('Error deleting test:', error)
      alert('Failed to delete test')
    }
  }

  const filteredAttempts = selectedTest 
    ? attempts.filter(a => a.test_id === selectedTest)
    : attempts

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
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Test Management</h1>
        <p className="opacity-90">Create and manage online tests and assessments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tests</p>
                <p className="text-2xl font-bold text-gray-900">{tests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Tests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tests.filter(t => t.is_active && new Date() < new Date(t.end_time)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Attempts</p>
                <p className="text-2xl font-bold text-gray-900">{attempts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {attempts.length > 0 
                    ? Math.round(attempts.reduce((sum, a) => sum + (a.score / a.max_score * 100), 0) / attempts.length)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              All Tests ({tests.length})
            </CardTitle>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Test
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingTest ? 'Edit Test' : 'Create New Test'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Title *
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
                    Duration (minutes) *
                  </label>
                  <Input
                    type="number"
                    min="5"
                    max="180"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({...formData, duration_minutes: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructions
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md resize-none h-20"
                  value={formData.instructions}
                  onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                  placeholder="Test instructions for students..."
                />
              </div>

              {/* Questions */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium">Questions</h4>
                  <Button type="button" variant="outline" onClick={addQuestion}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>

                {formData.questions.map((question, qIndex) => (
                  <div key={qIndex} className="border rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium">Question {qIndex + 1}</h5>
                      {formData.questions.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeQuestion(qIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Question Text *
                        </label>
                        <Input
                          value={question.question}
                          onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                          placeholder="Enter your question..."
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Option {String.fromCharCode(65 + oIndex)} *
                            </label>
                            <Input
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...question.options]
                                newOptions[oIndex] = e.target.value
                                updateQuestion(qIndex, 'options', newOptions)
                              }}
                              placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                              required
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Correct Answer *
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                          value={question.correct_answer}
                          onChange={(e) => updateQuestion(qIndex, 'correct_answer', e.target.value)}
                          required
                        >
                          <option value="">Select correct answer</option>
                          {question.options.map((option, oIndex) => (
                            <option key={oIndex} value={option}>
                              {String.fromCharCode(65 + oIndex)}: {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingTest ? 'Update Test' : 'Create Test'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tests List */}
        <Card>
          <CardHeader>
            <CardTitle>All Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tests.map((test) => (
                <div key={test.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{test.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{test.subject} - {test.class?.name}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {test.duration_minutes} min
                        </div>
                        <div className="flex items-center">
                          <FileText className="h-3 w-3 mr-1" />
                          {test.questions?.length || 0} questions
                        </div>
                      </div>

                      <div className="text-xs text-gray-500">
                        <p>Start: {new Date(test.start_time).toLocaleString()}</p>
                        <p>End: {new Date(test.end_time).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(test)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(test.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {tests.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No tests created yet.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 text-purple-600 mr-2" />
                Test Results
              </CardTitle>
              <select
                className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                value={selectedTest}
                onChange={(e) => setSelectedTest(e.target.value)}
              >
                <option value="">All Tests</option>
                {tests.map(test => (
                  <option key={test.id} value={test.id}>{test.title}</option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredAttempts.map((attempt) => (
                <div key={attempt.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{attempt.test?.title}</h4>
                      <p className="text-sm text-gray-600">{attempt.student?.name} ({attempt.student?.student_id})</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                      (attempt.score / attempt.max_score) >= 0.8 
                        ? 'bg-green-100 text-green-800'
                        : (attempt.score / attempt.max_score) >= 0.6
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {attempt.score}/{attempt.max_score} ({Math.round((attempt.score / attempt.max_score) * 100)}%)
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div>Attempted: {new Date(attempt.attempted_at).toLocaleString()}</div>
                    <div>Time: {Math.floor(attempt.time_taken / 60)}:{(attempt.time_taken % 60).toString().padStart(2, '0')}</div>
                  </div>
                </div>
              ))}
              
              {filteredAttempts.length === 0 && (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No test attempts found.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}