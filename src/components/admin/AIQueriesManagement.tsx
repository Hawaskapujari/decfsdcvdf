import React, { useState, useEffect } from 'react'
import { getCurrentUser } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Brain, MessageSquare, User, Bot, ArrowRight, CheckCircle, Clock } from 'lucide-react'
import type { AIQuery, Admin } from '../../lib/supabase'

export default function AIQueriesManagement() {
  const [queries, setQueries] = useState<AIQuery[]>([])
  const [selectedQuery, setSelectedQuery] = useState<AIQuery | null>(null)
  const [teacherResponse, setTeacherResponse] = useState('')
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState(false)
  const [admin, setAdmin] = useState<Admin | null>(null)

  useEffect(() => {
    const user = getCurrentUser()
    if (user && user.userType === 'admin') {
      setAdmin(user as Admin)
    }
    loadQueries()
  }, [])

  const loadQueries = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_queries')
        .select(`
          *,
          student:students(*)
        `)
        .order('created_at', { ascending: false })

      if (data && !error) {
        setQueries(data)
      }
    } catch (error) {
      console.error('Error loading queries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTeacherResponse = async () => {
    if (!admin || !selectedQuery || !teacherResponse.trim()) return

    setResponding(true)
    try {
      const { error } = await supabase
        .from('ai_queries')
        .update({
          teacher_response: teacherResponse.trim(),
          teacher_id: admin.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', selectedQuery.id)

      if (!error) {
        alert('Response sent successfully!')
        setTeacherResponse('')
        setSelectedQuery(null)
        loadQueries()
      }
    } catch (error) {
      console.error('Error sending response:', error)
      alert('Failed to send response')
    } finally {
      setResponding(false)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  const pendingQueries = queries.filter(q => q.is_forwarded_to_teacher && !q.teacher_response)
  const resolvedQueries = queries.filter(q => q.teacher_response)
  const aiOnlyQueries = queries.filter(q => !q.is_forwarded_to_teacher)

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
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">AI Queries Management</h1>
        <p className="opacity-90">Review student questions and provide teacher responses</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Queries</p>
                <p className="text-2xl font-bold text-gray-900">{queries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Response</p>
                <p className="text-2xl font-bold text-gray-900">{pendingQueries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">{resolvedQueries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Bot className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">AI Only</p>
                <p className="text-2xl font-bold text-gray-900">{aiOnlyQueries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queries List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 text-indigo-600 mr-2" />
                Student Queries ({queries.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {queries.map((query) => (
                  <div
                    key={query.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedQuery?.id === query.id ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedQuery(query)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {query.subject && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {query.subject}
                          </span>
                        )}
                        {query.is_forwarded_to_teacher && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            query.teacher_response 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            <ArrowRight className="h-3 w-3 mr-1" />
                            {query.teacher_response ? 'Resolved' : 'Pending'}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(query.created_at)} {formatTime(query.created_at)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Student:</strong> {query.student?.name} ({query.student?.student_id})
                    </p>
                    <p className="text-sm text-gray-900 line-clamp-2">{query.query}</p>
                  </div>
                ))}

                {queries.length === 0 && (
                  <div className="text-center py-12">
                    <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No AI queries found.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Query Details */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 text-green-600 mr-2" />
                Query Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedQuery ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      {selectedQuery.subject && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {selectedQuery.subject}
                        </span>
                      )}
                      {selectedQuery.is_forwarded_to_teacher && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedQuery.teacher_response 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          <ArrowRight className="h-3 w-3 mr-1" />
                          {selectedQuery.teacher_response ? 'Resolved' : 'Needs Response'}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <p><strong>Student:</strong> {selectedQuery.student?.name}</p>
                      <p><strong>Student ID:</strong> {selectedQuery.student?.student_id}</p>
                      <p><strong>Asked:</strong> {new Date(selectedQuery.created_at).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Student Question */}
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <User className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Student Question</span>
                    </div>
                    <p className="text-sm text-blue-800">{selectedQuery.query}</p>
                  </div>

                  {/* AI Response */}
                  {selectedQuery.ai_response && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center mb-2">
                        <Bot className="h-4 w-4 mr-2 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">AI Response</span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedQuery.ai_response}</p>
                    </div>
                  )}

                  {/* Teacher Response */}
                  {selectedQuery.teacher_response ? (
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-center mb-2">
                        <User className="h-4 w-4 mr-2 text-green-600" />
                        <span className="text-sm font-medium text-green-900">Teacher Response</span>
                      </div>
                      <p className="text-sm text-green-800">{selectedQuery.teacher_response}</p>
                      {selectedQuery.resolved_at && (
                        <p className="text-xs text-green-600 mt-2">
                          Resolved: {new Date(selectedQuery.resolved_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ) : selectedQuery.is_forwarded_to_teacher ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Your Response
                        </label>
                        <textarea
                          className="w-full p-3 border border-gray-300 rounded-md resize-none h-24"
                          value={teacherResponse}
                          onChange={(e) => setTeacherResponse(e.target.value)}
                          placeholder="Provide a detailed response to help the student..."
                        />
                      </div>
                      <Button
                        onClick={handleTeacherResponse}
                        disabled={responding || !teacherResponse.trim()}
                        className="w-full"
                      >
                        {responding ? 'Sending...' : 'Send Response'}
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <p className="text-sm text-yellow-800">
                        This query was handled by AI only and wasn't forwarded to a teacher.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a query to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}