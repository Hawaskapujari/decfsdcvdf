import React, { useState, useEffect } from 'react'
import { getCurrentUser } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Bell, Plus, CreditCard as Edit, Trash2, Eye, Calendar, AlertCircle } from 'lucide-react'
import type { Notice, Admin } from '../../lib/supabase'

export default function NoticesManagement() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null)
  const [loading, setLoading] = useState(true)
  const [admin, setAdmin] = useState<Admin | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'medium',
    target_class: 'all',
    file_url: '',
    expiry_date: ''
  })

  useEffect(() => {
    const user = getCurrentUser()
    if (user && user.userType === 'admin') {
      setAdmin(user as Admin)
    }
    loadNotices()
  }, [])

  const loadNotices = async () => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!admin) return

    try {
      const noticeData = {
        ...formData,
        created_by: admin.id,
        expiry_date: formData.expiry_date ? new Date(formData.expiry_date).toISOString() : null
      }

      if (editingNotice) {
        const { error } = await supabase
          .from('notices')
          .update(noticeData)
          .eq('id', editingNotice.id)

        if (!error) {
          alert('Notice updated successfully!')
        }
      } else {
        const { error } = await supabase
          .from('notices')
          .insert(noticeData)

        if (!error) {
          alert('Notice created successfully!')
        }
      }

      resetForm()
      loadNotices()
    } catch (error) {
      console.error('Error saving notice:', error)
      alert('Failed to save notice')
    }
  }

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice)
    setFormData({
      title: notice.title,
      content: notice.content,
      priority: notice.priority || 'medium',
      target_class: notice.target_class || 'all',
      file_url: notice.file_url || '',
      expiry_date: notice.expiry_date ? new Date(notice.expiry_date).toISOString().slice(0, 16) : ''
    })
    setShowAddForm(true)
  }

  const handleDelete = async (noticeId: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return

    try {
      const { error } = await supabase
        .from('notices')
        .delete()
        .eq('id', noticeId)

      if (!error) {
        alert('Notice deleted successfully!')
        loadNotices()
      }
    } catch (error) {
      console.error('Error deleting notice:', error)
      alert('Failed to delete notice')
    }
  }

  const toggleNoticeStatus = async (noticeId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('notices')
        .update({ is_active: !isActive })
        .eq('id', noticeId)

      if (!error) {
        loadNotices()
      }
    } catch (error) {
      console.error('Error updating notice status:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'medium',
      target_class: 'all',
      file_url: '',
      expiry_date: ''
    })
    setEditingNotice(null)
    setShowAddForm(false)
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

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false
    return new Date() > new Date(expiryDate)
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
      <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Notices Management</h1>
        <p className="opacity-90">Create and manage school announcements and notices</p>
      </div>

      {/* Actions Bar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 text-yellow-600 mr-2" />
              All Notices ({notices.length})
            </CardTitle>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Notice
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingNotice ? 'Edit Notice' : 'Create New Notice'}
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
                    Priority
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Class
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                    value={formData.target_class}
                    onChange={(e) => setFormData({...formData, target_class: e.target.value})}
                  >
                    <option value="all">All Classes</option>
                    <option value="10th A">10th A</option>
                    <option value="10th B">10th B</option>
                    <option value="9th A">9th A</option>
                    <option value="9th B">9th B</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attachment URL
                  </label>
                  <Input
                    type="url"
                    value={formData.file_url}
                    onChange={(e) => setFormData({...formData, file_url: e.target.value})}
                    placeholder="https://example.com/attachment.pdf"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content *
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md resize-none h-32"
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="Notice content..."
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingNotice ? 'Update Notice' : 'Create Notice'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Notices List */}
      <div className="space-y-4">
        {notices.map((notice) => (
          <Card key={notice.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{notice.title}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(notice.priority)}`}>
                      {notice.priority?.toUpperCase()}
                    </span>
                    {notice.target_class !== 'all' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                        {notice.target_class}
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      notice.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {notice.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {isExpired(notice.expiry_date) && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Expired
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-3 line-clamp-3">{notice.content}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Published: {new Date(notice.publish_date).toLocaleDateString()}
                    </div>
                    {notice.expiry_date && (
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Expires: {new Date(notice.expiry_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => toggleNoticeStatus(notice.id, notice.is_active)}
                  >
                    {notice.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(notice)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(notice.id)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {notices.length === 0 && (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No notices created yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}