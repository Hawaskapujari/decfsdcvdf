import React, { useState, useEffect } from 'react'
import { getCurrentUser } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Heart, Clock, CheckCircle, XCircle, Calendar, Video, MessageSquare } from 'lucide-react'
import type { VoiceLinkRequest, Admin } from '../../lib/supabase'

export default function VoiceLinkManagement() {
  const [requests, setRequests] = useState<VoiceLinkRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<VoiceLinkRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [admin, setAdmin] = useState<Admin | null>(null)

  // Form state for scheduling
  const [schedulingData, setSchedulingData] = useState({
    scheduled_time: '',
    meeting_link: '',
    notes: ''
  })

  useEffect(() => {
    const user = getCurrentUser()
    if (user && user.userType === 'admin') {
      setAdmin(user as Admin)
    }
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('voicelink_requests')
        .select(`
          *,
          student:students(*)
        `)
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

  const handleRequestAction = async (requestId: string, action: 'approve' | 'reject') => {
    if (!admin) return

    try {
      const updateData: any = {
        status: action === 'approve' ? 'approved' : 'rejected',
        counsellor_id: admin.id,
        updated_at: new Date().toISOString()
      }

      if (action === 'approve' && schedulingData.scheduled_time) {
        updateData.scheduled_time = new Date(schedulingData.scheduled_time).toISOString()
        updateData.meeting_link = schedulingData.meeting_link
        updateData.notes = schedulingData.notes
      }

      const { error } = await supabase
        .from('voicelink_requests')
        .update(updateData)
        .eq('id', requestId)

      if (!error) {
        alert(`Request ${action}d successfully!`)
        setSelectedRequest(null)
        setSchedulingData({ scheduled_time: '', meeting_link: '', notes: '' })
        loadRequests()
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error)
      alert(`Failed to ${action} request`)
    }
  }

  const markAsCompleted = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('voicelink_requests')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (!error) {
        alert('Session marked as completed!')
        loadRequests()
      }
    } catch (error) {
      console.error('Error marking as completed:', error)
      alert('Failed to mark as completed')
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
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const approvedRequests = requests.filter(r => r.status === 'approved')
  const completedRequests = requests.filter(r => r.status === 'completed')

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
        <h1 className="text-2xl font-bold mb-2">VoiceLink Management</h1>
        <p className="opacity-90">Manage student counselling requests and sessions</p>
      </div>

      {/* Stats */}
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
                <p className="text-2xl font-bold text-gray-900">{pendingRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Video className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">{approvedRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Requests List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="h-5 w-5 text-red-600 mr-2" />
                Counselling Requests ({requests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedRequest?.id === request.id ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedRequest(request)}
                  >
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

                    <h4 className="font-medium text-gray-900 mb-1">{request.subject}</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Student:</strong> {request.student?.name} ({request.student?.student_id})
                    </p>
                    <p className="text-sm text-gray-700 line-clamp-2">{request.description}</p>

                    {request.scheduled_time && (
                      <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                        <div className="flex items-center text-green-800 text-sm">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>Scheduled: {new Date(request.scheduled_time).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {requests.length === 0 && (
                  <div className="text-center py-12">
                    <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No counselling requests found.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Request Details */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 text-blue-600 mr-2" />
                Request Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedRequest ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(selectedRequest.type)}`}>
                        {selectedRequest.type.charAt(0).toUpperCase() + selectedRequest.type.slice(1)}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedRequest.status)}`}>
                        {getStatusIcon(selectedRequest.status)}
                        <span className="ml-1">{selectedRequest.status.toUpperCase()}</span>
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {selectedRequest.subject}
                    </h3>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <p><strong>Student:</strong> {selectedRequest.student?.name}</p>
                      <p><strong>Student ID:</strong> {selectedRequest.student?.student_id}</p>
                      <p><strong>Requested:</strong> {new Date(selectedRequest.created_at).toLocaleString()}</p>
                    </div>

                    <div className="bg-gray-50 rounded p-3 mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Description:</h4>
                      <p className="text-sm text-gray-700">{selectedRequest.description}</p>
                    </div>
                  </div>

                  {selectedRequest.status === 'pending' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Schedule Session
                        </label>
                        <Input
                          type="datetime-local"
                          value={schedulingData.scheduled_time}
                          onChange={(e) => setSchedulingData({...schedulingData, scheduled_time: e.target.value})}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Meeting Link
                        </label>
                        <Input
                          type="url"
                          value={schedulingData.meeting_link}
                          onChange={(e) => setSchedulingData({...schedulingData, meeting_link: e.target.value})}
                          placeholder="https://meet.google.com/..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notes
                        </label>
                        <textarea
                          className="w-full p-3 border border-gray-300 rounded-md resize-none h-20"
                          value={schedulingData.notes}
                          onChange={(e) => setSchedulingData({...schedulingData, notes: e.target.value})}
                          placeholder="Additional notes for the student..."
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleRequestAction(selectedRequest.id, 'approve')}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleRequestAction(selectedRequest.id, 'reject')}
                          className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedRequest.status === 'approved' && (
                    <div className="space-y-4">
                      {selectedRequest.scheduled_time && (
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                          <div className="flex items-center text-green-800 mb-2">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span className="font-medium">Scheduled Session</span>
                          </div>
                          <p className="text-sm text-green-700">
                            {new Date(selectedRequest.scheduled_time).toLocaleString()}
                          </p>
                          {selectedRequest.meeting_link && (
                            <a
                              href={selectedRequest.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline mt-2 block"
                            >
                              Join Meeting
                            </a>
                          )}
                        </div>
                      )}

                      <Button
                        onClick={() => markAsCompleted(selectedRequest.id)}
                        className="w-full"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Completed
                      </Button>
                    </div>
                  )}

                  {selectedRequest.notes && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <h4 className="font-medium text-blue-900 mb-2">Counsellor Notes:</h4>
                      <p className="text-sm text-blue-800">{selectedRequest.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a request to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}