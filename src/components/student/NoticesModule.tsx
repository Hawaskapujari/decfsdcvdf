import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Bell, Calendar, Download, Eye, AlertCircle, Clock, CheckCircle } from 'lucide-react'
import type { Notice } from '../../lib/supabase'

export default function NoticesModule() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotices()
  }, [])

  const loadNotices = async () => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('is_active', true)
        .order('publish_date', { ascending: false })

      if (data && !error) {
        setNotices(data)
      }
    } catch (error) {
      console.error('Error loading notices:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return <AlertCircle className="h-4 w-4" />
      case 'medium':
        return <Clock className="h-4 w-4" />
      case 'low':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false
    return new Date() > new Date(expiryDate)
  }

  const activeNotices = notices.filter(notice => !isExpired(notice.expiry_date))
  const expiredNotices = notices.filter(notice => isExpired(notice.expiry_date))

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
      <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Notices & Announcements</h1>
        <p className="opacity-90">Stay updated with school announcements and important notices</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notices List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Notices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 text-blue-600 mr-2" />
                Active Notices ({activeNotices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeNotices.map((notice) => (
                  <div
                    key={notice.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedNotice?.id === notice.id ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedNotice(notice)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(notice.priority)}`}>
                            {getPriorityIcon(notice.priority)}
                            <span className="ml-1">{notice.priority.toUpperCase()}</span>
                          </span>
                          {notice.target_class !== 'all' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                              Class: {notice.target_class}
                            </span>
                          )}
                        </div>
                        
                        <h4 className="font-medium text-gray-900 mb-1">{notice.title}</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">{notice.content}</p>
                        
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Published: {new Date(notice.publish_date).toLocaleDateString()}
                          </div>
                          {notice.expiry_date && (
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Expires: {new Date(notice.expiry_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4 flex items-center gap-2">
                        {notice.file_url && (
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {activeNotices.length === 0 && (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No active notices at the moment.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Expired Notices */}
          {expiredNotices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-600 mr-2" />
                  Expired Notices ({expiredNotices.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expiredNotices.slice(0, 5).map((notice) => (
                    <div
                      key={notice.id}
                      className="border rounded-lg p-4 opacity-60 cursor-pointer hover:opacity-80"
                      onClick={() => setSelectedNotice(notice)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-700 mb-1">{notice.title}</h4>
                          <p className="text-sm text-gray-500 line-clamp-1">{notice.content}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(notice.publish_date).toLocaleDateString()}
                            </div>
                            <span className="text-red-500">Expired</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Notice Details */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 text-green-600 mr-2" />
                Notice Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedNotice ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(selectedNotice.priority)}`}>
                        {getPriorityIcon(selectedNotice.priority)}
                        <span className="ml-1">{selectedNotice.priority.toUpperCase()}</span>
                      </span>
                      {isExpired(selectedNotice.expiry_date) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                          EXPIRED
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {selectedNotice.title}
                    </h3>
                    
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {selectedNotice.content}
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Published: {new Date(selectedNotice.publish_date).toLocaleDateString()}</span>
                    </div>
                    
                    {selectedNotice.expiry_date && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>Expires: {new Date(selectedNotice.expiry_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Bell className="h-4 w-4 mr-2" />
                      <span>Target: {selectedNotice.target_class === 'all' ? 'All Classes' : `Class ${selectedNotice.target_class}`}</span>
                    </div>
                  </div>

                  {selectedNotice.file_url && (
                    <div className="border-t pt-4">
                      <Button className="w-full" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download Attachment
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a notice to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}