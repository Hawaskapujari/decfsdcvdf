import React, { useState, useEffect } from 'react'
import { getCurrentUser } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { BookOpen, Search, Download, Clock, CheckCircle, AlertCircle, Eye, ArrowLeft, Star, Calendar, User } from 'lucide-react'
import type { Book, BorrowRequest, Student } from '../../lib/supabase'

export default function LibraryModule() {
  const [books, setBooks] = useState<Book[]>([])
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowRequest[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<Student | null>(null)

  useEffect(() => {
    const user = getCurrentUser()
    if (user && user.userType === 'student') {
      setStudent(user as Student)
      loadBooks()
      loadBorrowedBooks(user.id)
    }
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

  const loadBorrowedBooks = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('borrow_requests')
        .select(`
          *,
          book:books(*)
        `)
        .eq('student_id', studentId)
        .in('status', ['pending', 'approved'])
        .order('request_date', { ascending: false })

      if (data && !error) {
        setBorrowedBooks(data)
      }
    } catch (error) {
      console.error('Error loading borrowed books:', error)
    }
  }

  const requestBook = async (bookId: string) => {
    if (!student) return

    try {
      const { error } = await supabase
        .from('borrow_requests')
        .insert({
          book_id: bookId,
          student_id: student.id,
          status: 'pending'
        })

      if (!error) {
        // Update available copies locally
        setBooks(books.map(book => 
          book.id === bookId 
            ? { ...book, available_copies: book.available_copies - 1 }
            : book
        ))
        
        // Reload borrowed books
        loadBorrowedBooks(student.id)
        
        alert('Book request submitted successfully!')
      }
    } catch (error) {
      console.error('Error requesting book:', error)
      alert('Failed to request book')
    }
  }

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = selectedSubject === 'all' || book.subject === selectedSubject
    return matchesSearch && matchesSubject
  })

  const subjects = ['all', ...Array.from(new Set(books.map(book => book.subject).filter(Boolean)))]

  if (selectedBook) {
    return (
      <div className="p-6 space-y-6">
        {/* Book Detail Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => setSelectedBook(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
        </div>

        {/* Book Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Book Cover and Actions */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg mb-4 flex items-center justify-center">
                  {selectedBook.cover_image ? (
                    <img src={selectedBook.cover_image} alt={selectedBook.title} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <BookOpen className="h-16 w-16 text-blue-600" />
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Availability</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedBook.available_copies > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedBook.available_copies}/{selectedBook.total_copies} Available
                    </span>
                  </div>
                  
                  <Button 
                    className="w-full"
                    disabled={selectedBook.available_copies === 0 || borrowedBooks.some(req => req.book_id === selectedBook.id)}
                    onClick={() => requestBook(selectedBook.id)}
                  >
                    {borrowedBooks.some(req => req.book_id === selectedBook.id) ? 'Already Requested' : 'Request Book'}
                  </Button>
                  
                  {selectedBook.pdf_url && (
                    <Button variant="outline" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview PDF
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Book Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">{selectedBook.title}</CardTitle>
                    <p className="text-lg text-gray-600 mb-2">by {selectedBook.author}</p>
                    {selectedBook.subject && (
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {selectedBook.subject}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <span className="text-sm text-gray-600">4.5</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <span className="text-sm font-medium text-gray-700">ISBN:</span>
                    <p className="text-sm text-gray-600">{selectedBook.isbn || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Total Copies:</span>
                    <p className="text-sm text-gray-600">{selectedBook.total_copies}</p>
                  </div>
                </div>
                
                {selectedBook.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-700 leading-relaxed">{selectedBook.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Book Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Added to Library:</span>
                      <p className="text-sm text-gray-600">{new Date(selectedBook.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Currently Borrowed:</span>
                      <p className="text-sm text-gray-600">{selectedBook.total_copies - selectedBook.available_copies} students</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
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
        <h1 className="text-2xl font-bold mb-2">Library</h1>
        <p className="opacity-90">Browse and request books from our collection</p>
      </div>

      {/* My Borrowed Books */}
      {borrowedBooks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 text-orange-600 mr-2" />
              My Books
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {borrowedBooks.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-1">{request.book?.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{request.book?.author}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {request.status === 'pending' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </span>
                      )}
                      {request.status === 'approved' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approved
                        </span>
                      )}
                    </div>
                    
                    {request.book?.pdf_url && request.status === 'approved' && (
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Read
                      </Button>
                    )}
                  </div>
                  
                  {request.return_date && (
                    <p className="text-xs text-gray-500 mt-2">
                      Return by: {new Date(request.return_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 text-blue-600 mr-2" />
            Search Books
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                placeholder="Search by title or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <select
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                {subjects.map(subject => (
                  <option key={subject} value={subject}>
                    {subject === 'all' ? 'All Subjects' : subject}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Books Catalog */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 text-green-600 mr-2" />
            Book Catalog ({filteredBooks.length} books)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => {
              const isAlreadyRequested = borrowedBooks.some(req => req.book_id === book.id)
              const canRequest = book.available_copies > 0 && !isAlreadyRequested
              
              return (
                <div key={book.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <div className="h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg mb-4 flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-blue-600" />
                  </div>
                  
                  <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">{book.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{book.author}</p>
                  
                  {book.subject && (
                    <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mb-2">
                      {book.subject}
                    </span>
                  )}
                  
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-gray-600">
                      Available: {book.available_copies}/{book.total_copies}
                    </span>
                    {book.available_copies > 0 ? (
                      <span className="text-green-600 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        In Stock
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Out of Stock
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      disabled={!canRequest}
                      onClick={() => setSelectedBook(book)}
                    >
                      View Details
                    </Button>
                    
                    {book.pdf_url && (
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {book.description && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{book.description}</p>
                  )}
                </div>
              )
            })}
          </div>
          
          {filteredBooks.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No books found matching your search.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}