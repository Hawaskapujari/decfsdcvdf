import React, { useState, useEffect } from 'react'
import { getCurrentUser } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Heart, Calendar, Clock, CheckCircle, AlertCircle, MessageSquare, Video } from 'lucide-react'
import type { Student, VoiceLinkRequest } from '../../lib/supabase'

export default function VoiceLinkModule() {
  const [student, setStudent] = useState<Student | null>(null)
  const [requests, setRequests] = useState<VoiceLinkRequest[]>([])
  const [showNewRequest, setShowNewRequest] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [requestType, setRequestType] = useState<'academic' | 'personal' | 'emotional'>('academic')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    const user = getCurrentUser()
    if (user && user.userType === 'student') {
      setStudent(user as Student)
      loadRequests(user.id)
    }
  }, [])

  const loadRequests = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('voicelink_requests')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })

      if (data && !error) {
        setRequests(data)
      }
    } catch (error) {
      console.error('Error loading requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitRequest = async () => {
    if (!student || !subject.trim() || !description.trim()) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('voicelink_requests')
        .insert({
          student_id: student.id,
          type: requestType,
          subject: subject.trim(),
          description: description.trim(),
          status: 'pending'
        })

      if (!error) {
        setSubject('')
        setDescription('')
        setShowNewRequest(false)
        loadRequests(student.id)
        alert('Counselling request submitted successfully!')
      }
    } catch (error) {
      console.error('Error submitting request:', error)
      alert('Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'academic':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'personal':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'emotional':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'approved':
        return <CheckCircle className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'rejected':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
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
      <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">VoiceLink Counselling</h1>
        <p className="opacity-90">Get support for academic, personal, and emotional wellbeing</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {requests.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {requests.filter(r => r.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Video className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">
                  {requests.filter(r => r.status === 'approved' && r.scheduled_time).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Request Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Heart className="h-5 w-5 text-red-600 mr-2" />
                  New Request
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewRequest(!showNewRequest)}
                >
                  {showNewRequest ? 'Cancel' : 'New Request'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showNewRequest ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Request Type
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                      value={requestType}
                      onChange={(e) => setRequestType(e.target.value as any)}
                    >
                      <option value="academic">Academic Support</option>
                      <option value="personal">Personal Guidance</option>
                      <option value="emotional">Emotional Support</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief subject of your concern"
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-md resize-none h-32"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Please describe your concern in detail..."
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 mt-1">{description.length}/500</p>
                  </div>

                  <Button
                    onClick={submitRequest}
                    disabled={submitting || !subject.trim() || !description.trim()}
                    className="w-full"
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-red-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">
                    Need someone to talk to? Our counsellors are here to help.
                  </p>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded mr-2"></div>
                      <span>Academic Support</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-100 border border-green-200 rounded mr-2"></div>
                      <span>Personal Guidance</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-purple-100 border border-purple-200 rounded mr-2"></div>
                      <span>Emotional Support</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Requests History */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 text-blue-600 mr-2" />
                My Requests ({requests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(request.type)}`}>
                          {request.type.charAt(0).toUpperCase() + request.type.slice(1)}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1">{request.status.toUpperCase()}</span>
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="font-medium text-gray-900 mb-2">{request.subject}</h4>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{request.description}</p>

                    {request.scheduled_time && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                        <div className="flex items-center text-green-800">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span className="text-sm font-medium">
                            Scheduled: {new Date(request.scheduled_time).toLocaleString()}
                          </span>
                        </div>
                        {request.meeting_link && (
                          <Button size="sm" className="mt-2" variant="outline">
                            <Video className="h-4 w-4 mr-2" />
                            Join Meeting
                          </Button>
                        )}
                      </div>
                    )}

                    {request.notes && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <h5 className="text-sm font-medium text-blue-900 mb-1">Counsellor Notes:</h5>
                        <p className="text-sm text-blue-800">{request.notes}</p>
                      </div>
                    )}
                  </div>
                ))}

                {requests.length === 0 && (
                  <div className="text-center py-12">
                    <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No counselling requests yet.</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Click "New Request" to get started.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}