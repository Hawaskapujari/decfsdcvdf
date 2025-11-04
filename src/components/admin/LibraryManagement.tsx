import React, { useState, useEffect } from 'react'
import { getCurrentUser } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { BookOpen, Plus, Search, CreditCard as Edit, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react'
import type { Book, BorrowRequest, Admin } from '../../lib/supabase'

export default function LibraryManagement() {
  const [activeTab, setActiveTab] = useState<'books' | 'requests'>('books')
  const [books, setBooks] = useState<Book[]>([])
  const [requests, setRequests] = useState<BorrowRequest[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [admin, setAdmin] = useState<Admin | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    subject: '',
    isbn: '',
    total_copies: '1',
    description: '',
    pdf_url: '',
    cover_image: ''
  })

  useEffect(() => {
    const user = getCurrentUser()
    if (user && user.userType === 'admin') {
      setAdmin(user as Admin)
    }
    loadBooks()
    loadRequests()
  }, [])

  const loadBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('title', { ascending: true })

      if (data && !error) {
        setBooks(data)
      }
    } catch (error) {
      console.error('Error loading books:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('borrow_requests')
        .select(`
          *,
          book:books(*),
          student:students(*)
        `)
        .order('request_date', { ascending: false })

      if (data && !error) {
        setRequests(data)
      }
    } catch (error) {
      console.error('Error loading requests:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!admin) return

    try {
      const bookData = {
        ...formData,
        total_copies: parseInt(formData.total_copies),
        available_copies: parseInt(formData.total_copies),
        created_by: admin.id
      }

      if (editingBook) {
        const { error } = await supabase
          .from('books')
          .update(bookData)
          .eq('id', editingBook.id)

        if (!error) {
          alert('Book updated successfully!')
        }
      } else {
        const { error } = await supabase
          .from('books')
          .insert(bookData)

        if (!error) {
          alert('Book added successfully!')
        }
      }

      resetForm()
      loadBooks()
    } catch (error) {
      console.error('Error saving book:', error)
      alert('Failed to save book')
    }
  }

  const handleEdit = (book: Book) => {
    setEditingBook(book)
    setFormData({
      title: book.title,
      author: book.author,
      subject: book.subject || '',
      isbn: book.isbn || '',
      total_copies: book.total_copies.toString(),
      description: book.description || '',
      pdf_url: book.pdf_url || ''
    })
    setShowAddForm(true)
  }

  const handleDelete = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return

    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId)

      if (!error) {
        alert('Book deleted successfully!')
        loadBooks()
      }
    } catch (error) {
      console.error('Error deleting book:', error)
      alert('Failed to delete book')
    }
  }

  const handleRequestAction = async (requestId: string, action: 'approve' | 'reject') => {
    if (!admin) return

    try {
      const updateData: any = {
        status: action === 'approve' ? 'approved' : 'rejected',
        approved_by: admin.id
      }

      if (action === 'approve') {
        updateData.issue_date = new Date().toISOString()
        // Set return date to 14 days from now
        const returnDate = new Date()
        returnDate.setDate(returnDate.getDate() + 14)
        updateData.return_date = returnDate.toISOString()
      }

      const { error } = await supabase
        .from('borrow_requests')
        .update(updateData)
        .eq('id', requestId)

      if (!error && action === 'approve') {
        // Update book available copies
        const request = requests.find(r => r.id === requestId)
        if (request?.book) {
          await supabase
            .from('books')
            .update({ 
              available_copies: request.book.available_copies - 1 
            })
            .eq('id', request.book.id)
        }
      }

      if (!error) {
        alert(`Request ${action}d successfully!`)
        loadRequests()
        loadBooks()
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error)
      alert(`Failed to ${action} request`)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      subject: '',
      isbn: '',
      total_copies: '1',
      description: '',
      pdf_url: '',
      cover_image: ''
    })
    setEditingBook(null)
    setShowAddForm(false)
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
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Library Management</h1>
        <p className="opacity-90">Manage books catalog and student borrow requests</p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg bg-gray-100 p-1">
        <button
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'books'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('books')}
        >
          <BookOpen className="h-4 w-4 inline mr-2" />
          Books Catalog ({books.length})
        </button>
        <button
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'requests'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('requests')}
        >
          <Clock className="h-4 w-4 inline mr-2" />
          Borrow Requests ({requests.filter(r => r.status === 'pending').length})
        </button>
      </div>

      {/* Books Tab */}
      {activeTab === 'books' && (
        <>
          {/* Actions Bar */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 text-purple-600 mr-2" />
                  Books Catalog ({books.length})
                </CardTitle>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Book
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Add/Edit Form */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingBook ? 'Edit Book' : 'Add New Book'}
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
                        Author *
                      </label>
                      <Input
                        value={formData.author}
                        onChange={(e) => setFormData({...formData, author: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject
                      </label>
                      <Input
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ISBN
                      </label>
                      <Input
                        value={formData.isbn}
                        onChange={(e) => setFormData({...formData, isbn: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Copies
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.total_copies}
                        onChange={(e) => setFormData({...formData, total_copies: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cover Image URL
                      </label>
                      <Input
                        type="url"
                        value={formData.cover_image}
                        onChange={(e) => setFormData({...formData, cover_image: e.target.value})}
                        placeholder="https://example.com/cover.jpg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        PDF URL
                      </label>
                      <Input
                        type="url"
                        value={formData.pdf_url}
                        onChange={(e) => setFormData({...formData, pdf_url: e.target.value})}
                        placeholder="https://example.com/book.pdf"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-md resize-none h-20"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">
                      {editingBook ? 'Update Book' : 'Add Book'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Books Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <Card key={book.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="h-32 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg mb-4 flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-purple-600" />
                  </div>
                  
                  <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">{book.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{book.author}</p>
                  
                  {book.subject && (
                    <span className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full mb-2">
                      {book.subject}
                    </span>
                  )}
                  
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-gray-600">
                      Available: {book.available_copies}/{book.total_copies}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      book.available_copies > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {book.available_copies > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(book)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(book.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 text-orange-600 mr-2" />
              Borrow Requests ({requests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">{request.book?.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {request.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Student:</strong> {request.student?.name} ({request.student?.student_id})
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Author:</strong> {request.book?.author}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Requested:</strong> {new Date(request.request_date).toLocaleDateString()}
                      </p>
                      
                      {request.return_date && (
                        <p className="text-sm text-gray-600">
                          <strong>Return by:</strong> {new Date(request.return_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    
                    {request.status === 'pending' && (
                      <div className="flex gap-2 ml-4">
                        <Button 
                          size="sm" 
                          onClick={() => handleRequestAction(request.id, 'approve')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRequestAction(request.id, 'reject')}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {requests.length === 0 && (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No borrow requests found.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}