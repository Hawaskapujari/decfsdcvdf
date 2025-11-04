import React, { useState, useEffect } from 'react'
import { getCurrentUser } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { BarChart3, TrendingUp, Award, Calendar, Download, Filter } from 'lucide-react'
import type { Student } from '../../lib/supabase'

interface Result {
  id: string
  student_id: string
  subject: string
  term: string
  marks: number
  max_marks: number
  grade: string
  exam_date: string
  created_at: string
}

export default function ResultsModule() {
  const [student, setStudent] = useState<Student | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const [selectedTerm, setSelectedTerm] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = getCurrentUser()
    if (user && user.userType === 'student') {
      setStudent(user as Student)
      loadResults(user.id)
    }
  }, [])

  const loadResults = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('results')
        .select('*')
        .eq('student_id', studentId)
        .order('exam_date', { ascending: false })

      if (data && !error) {
        setResults(data)
      }
    } catch (error) {
      console.error('Error loading results:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredResults = results.filter(result => 
    selectedTerm === 'all' || result.term === selectedTerm
  )

  const terms = ['all', ...Array.from(new Set(results.map(r => r.term)))]
  
  const calculateAverage = (termResults: Result[]) => {
    if (termResults.length === 0) return 0
    const total = termResults.reduce((sum, result) => sum + (result.marks / result.max_marks) * 100, 0)
    return Math.round(total / termResults.length)
  }

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100'
    if (percentage >= 80) return 'text-blue-600 bg-blue-100'
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100'
    if (percentage >= 60) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
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
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Results & Performance</h1>
        <p className="opacity-90">Track your academic progress and achievements</p>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overall Average</p>
                <p className="text-2xl font-bold text-gray-900">{calculateAverage(results)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Exams</p>
                <p className="text-2xl font-bold text-gray-900">{results.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Best Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {results.length > 0 ? Math.max(...results.map(r => Math.round((r.marks / r.max_marks) * 100))) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Terms</p>
                <p className="text-2xl font-bold text-gray-900">{terms.length - 1}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 text-blue-600 mr-2" />
              Filter Results
            </CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <select
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
            >
              {terms.map(term => (
                <option key={term} value={term}>
                  {term === 'all' ? 'All Terms' : term}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 text-green-600 mr-2" />
            Detailed Results ({filteredResults.length} records)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredResults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Subject</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Term</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Marks</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Percentage</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Grade</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((result) => {
                    const percentage = Math.round((result.marks / result.max_marks) * 100)
                    return (
                      <tr key={result.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{result.subject}</td>
                        <td className="py-3 px-4 text-gray-600">{result.term}</td>
                        <td className="py-3 px-4 text-gray-900">
                          {result.marks}/{result.max_marks}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-sm font-medium ${getGradeColor(percentage)}`}>
                            {percentage}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900">{result.grade}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(result.exam_date).toLocaleDateString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No results found for the selected term.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subject-wise Performance */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
              Subject-wise Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from(new Set(results.map(r => r.subject))).map(subject => {
                const subjectResults = results.filter(r => r.subject === subject)
                const average = calculateAverage(subjectResults)
                return (
                  <div key={subject} className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{subject}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Average</span>
                      <span className={`px-2 py-1 rounded-full text-sm font-medium ${getGradeColor(average)}`}>
                        {average}%
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${average}%` }}
                        ></div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{subjectResults.length} exams</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}