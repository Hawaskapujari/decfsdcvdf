import React, { useState, useEffect } from 'react'
import { getCurrentUser } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { FileText, Clock, CheckCircle, Upload, Calendar, AlertCircle } from 'lucide-react'
import type { Homework, Submission, Student } from '../../lib/supabase'

export default function HomeworkModule() {
  const [homework, setHomework] = useState<Homework[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedHomework, setSelectedHomework] = useState<string | null>(null)
  const [submissionText, setSubmissionText] = useState('')
  const [submissionFile, setSubmissionFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [student, setStudent] = useState<Student | null>(null)

  useEffect(() => {
    const user = getCurrentUser()
    if (user && user.userType === 'student') {
      setStudent(user as Student)
      loadHomework(user.class_id)
      loadSubmissions(user.id)
    }
  }, [])

  const loadHomework = async (classId: string) => {
    try {
      const { data, error } = await supabase
        .from('homework')
        .select(`
          *,
          class:classes(*)
        `)
        .eq('class_id', classId)
        .eq('is_active', true)
        .order('deadline', { ascending: true })

      if (data && !error) {
        setHomework(data)
      }
    } catch (error) {
      console.error('Error loading homework:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSubmissions = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          homework:homework(*)
        `)
        .eq('student_id', studentId)

      if (data && !error) {
        setSubmissions(data)
      }
    } catch (error) {
      console.error('Error loading submissions:', error)
    }
  }

  const submitHomework = async () => {
    if (!student || !selectedHomework || (!submissionText.trim() && !submissionFile)) return

    setSubmitting(true)
    try {
      let attachmentUrl = ''
      
      // Upload file if provided
      if (submissionFile) {
        const fileExt = submissionFile.name.split('.').pop()
        const fileName = `${student.id}-${selectedHomework}-${Date.now()}.${fileExt}`
        const filePath = `homework-submissions/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('homework-submissions')
          .upload(filePath, submissionFile)

        if (uploadError) throw uploadError

        const { data } = supabase.storage
          .from('homework-submissions')
          .getPublicUrl(filePath)

        attachmentUrl = data.publicUrl
      }

      const { error } = await supabase
        .from('submissions')
        .insert({
          homework_id: selectedHomework,
          student_id: student.id,
          submission_text: submissionText,
          attachment_url: attachmentUrl
        })

      if (!error) {
        setSubmissionText('')
        setSubmissionFile(null)
        setSelectedHomework(null)
        loadSubmissions(student.id)
        alert('Homework submitted successfully!')
      }
    } catch (error) {
      console.error('Error submitting homework:', error)
      alert('Failed to submit homework')
    } finally {
      setSubmitting(false)
    }
  }

  const getSubmissionForHomework = (homeworkId: string) => {
    return submissions.find(sub => sub.homework_id === homeworkId)
  }

  const isOverdue = (deadline: string) => {
    return new Date() > new Date(deadline)
  }

  const getDaysUntilDeadline = (deadline: string) => {
    const now = new Date()
    const dueDate = new Date(deadline)
    const diffTime = dueDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
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
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Homework & Assignments</h1>
        <p className="opacity-90">Manage your assignments and submissions</p>
      </div>

      {/* Homework List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              All Assignments ({homework.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {homework.map((hw) => {
                const submission = getSubmissionForHomework(hw.id)
                const overdue = isOverdue(hw.deadline)
                const daysLeft = getDaysUntilDeadline(hw.deadline)
                
                return (
                  <div 
                    key={hw.id} 
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedHomework === hw.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedHomework(hw.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{hw.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{hw.subject}</p>
                        
                        {hw.description && (
                          <p className="text-sm text-gray-700 mb-2 line-clamp-2">{hw.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Due: {new Date(hw.deadline).toLocaleDateString()}
                          </div>
                          
                          {!overdue && daysLeft >= 0 && (
                            <div className={`flex items-center ${daysLeft <= 1 ? 'text-red-600' : daysLeft <= 3 ? 'text-orange-600' : 'text-green-600'}`}>
                              <Clock className="h-3 w-3 mr-1" />
                              {daysLeft === 0 ? 'Due today' : `${daysLeft} days left`}
                            </div>
                          )}
                          
                          {overdue && !submission && (
                            <div className="flex items-center text-red-600">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Overdue
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        {submission ? (
                          <div>
                            {submission.grade > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Graded: {submission.grade}/{submission.max_grade}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Submitted
                              </span>
                            )}
                          </div>
                        ) : overdue ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {homework.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No homework assigned yet.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submission Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 text-green-600 mr-2" />
              {selectedHomework ? 'Submit Assignment' : 'Select Assignment'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedHomework ? (
              <div className="space-y-4">
                {(() => {
                  const hw = homework.find(h => h.id === selectedHomework)
                  const submission = getSubmissionForHomework(selectedHomework)
                  
                  if (!hw) return null
                  
                  return (
                    <div>
                      <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-blue-900 mb-2">{hw.title}</h4>
                        <p className="text-sm text-blue-800 mb-2">{hw.subject}</p>
                        {hw.description && (
                          <p className="text-sm text-blue-700">{hw.description}</p>
                        )}
                        <p className="text-xs text-blue-600 mt-2">
                          Deadline: {new Date(hw.deadline).toLocaleString()}
                        </p>
                      </div>
                      
                      {submission ? (
                        <div className="space-y-4">
                          <div className="bg-green-50 rounded-lg p-4">
                            <h5 className="font-medium text-green-900 mb-2">Your Submission</h5>
                            <p className="text-sm text-green-800 mb-2">
                              Submitted on: {new Date(submission.submitted_at).toLocaleString()}
                            </p>
                            <div className="bg-white rounded p-3">
                              <p className="text-sm text-gray-700">{submission.submission_text}</p>
                            </div>
                            
                            {submission.grade > 0 && (
                              <div className="mt-3 p-3 bg-white rounded border-l-4 border-green-500">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-medium text-green-900">Grade</span>
                                  <span className="text-lg font-bold text-green-700">
                                    {submission.grade}/{submission.max_grade}
                                  </span>
                                </div>
                                {submission.feedback && (
                                  <div>
                                    <span className="font-medium text-green-900">Feedback:</span>
                                    <p className="text-sm text-green-800 mt-1">{submission.feedback}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Your Solution
                            </label>
                            <textarea
                              className="w-full p-3 border border-gray-300 rounded-md resize-none h-40"
                              value={submissionText}
                              onChange={(e) => setSubmissionText(e.target.value)}
                              placeholder="Write your solution here..."
                            />
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Input 
                              type="file" 
                              className="flex-1"
                              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                              onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                            />
                            <Button variant="outline" size="sm">
                              <Upload className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {submissionFile && (
                            <p className="text-sm text-green-600">
                              Selected: {submissionFile.name}
                            </p>
                          )}
                          
                          <Button 
                            onClick={submitHomework}
                            disabled={submitting || (!submissionText.trim() && !submissionFile) || isOverdue(hw.deadline)}
                            className="w-full"
                          >
                            {submitting ? 'Submitting...' : 
                             isOverdue(hw.deadline) ? 'Submission Closed' : 'Submit Assignment'}
                          </Button>
                          
                          {isOverdue(hw.deadline) && (
                            <p className="text-sm text-red-600 text-center">
                              This assignment is overdue and can no longer be submitted.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select an assignment from the list to view details or submit your work.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}