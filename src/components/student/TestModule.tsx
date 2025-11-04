import React, { useState, useEffect } from 'react'
import { getCurrentUser } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { FileText, Clock, Play, CheckCircle, AlertCircle, Award, Calendar } from 'lucide-react'
import type { Student, Test, TestAttempt } from '../../lib/supabase'

export default function TestModule() {
  const [student, setStudent] = useState<Student | null>(null)
  const [tests, setTests] = useState<Test[]>([])
  const [attempts, setAttempts] = useState<TestAttempt[]>([])
  const [activeTest, setActiveTest] = useState<Test | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<{[key: number]: string}>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [testStarted, setTestStarted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = getCurrentUser()
    if (user && user.userType === 'student') {
      setStudent(user as Student)
      loadTests(user.class_id)
      loadAttempts(user.id)
    }
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (testStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            submitTest()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [testStarted, timeLeft])

  const loadTests = async (classId: string) => {
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .eq('class_id', classId)
        .eq('is_active', true)
        .gte('end_time', new Date().toISOString())
        .order('start_time', { ascending: true })

      if (data && !error) {
        setTests(data)
      }
    } catch (error) {
      console.error('Error loading tests:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAttempts = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('test_attempts')
        .select(`
          *,
          test:tests(*)
        `)
        .eq('student_id', studentId)
        .order('attempted_at', { ascending: false })

      if (data && !error) {
        setAttempts(data)
      }
    } catch (error) {
      console.error('Error loading attempts:', error)
    }
  }

  const startTest = async (test: Test) => {
    if (!student) return

    try {
      // Check if already attempted
      const existingAttempt = attempts.find(a => a.test_id === test.id)
      if (existingAttempt) {
        alert('You have already attempted this test.')
        return
      }

      setActiveTest(test)
      setCurrentQuestion(0)
      setAnswers({})
      setTimeLeft(test.duration_minutes * 60)
      setTestStarted(true)
    } catch (error) {
      console.error('Error starting test:', error)
    }
  }

  const submitTest = async () => {
    if (!student || !activeTest) return

    try {
      const score = calculateScore()
      
      const { error } = await supabase
        .from('test_attempts')
        .insert({
          test_id: activeTest.id,
          student_id: student.id,
          answers: JSON.stringify(answers),
          score: score,
          max_score: activeTest.questions?.length || 0,
          time_taken: (activeTest.duration_minutes * 60) - timeLeft
        })

      if (!error) {
        setTestStarted(false)
        setActiveTest(null)
        setAnswers({})
        loadAttempts(student.id)
        alert(`Test submitted! Your score: ${score}/${activeTest.questions?.length || 0}`)
      }
    } catch (error) {
      console.error('Error submitting test:', error)
    }
  }

  const calculateScore = () => {
    if (!activeTest?.questions) return 0
    
    let score = 0
    activeTest.questions.forEach((question, index) => {
      if (answers[index] === question.correct_answer) {
        score++
      }
    })
    return score
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const isTestAvailable = (test: Test) => {
    const now = new Date()
    const startTime = new Date(test.start_time)
    const endTime = new Date(test.end_time)
    return now >= startTime && now <= endTime
  }

  const hasAttempted = (testId: string) => {
    return attempts.some(a => a.test_id === testId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Test Taking Interface
  if (testStarted && activeTest) {
    const question = activeTest.questions?.[currentQuestion]
    
    return (
      <div className="p-6 max-w-4xl mx-auto">
        {/* Test Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{activeTest.title}</CardTitle>
                <p className="text-gray-600">Question {currentQuestion + 1} of {activeTest.questions?.length}</p>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-blue-600'}`}>
                  {formatTime(timeLeft)}
                </div>
                <p className="text-sm text-gray-600">Time Remaining</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Question */}
        {question && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">{question.question}</h3>
              
              <div className="space-y-3">
                {question.options?.map((option, index) => (
                  <label key={index} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name={`question-${currentQuestion}`}
                      value={option}
                      checked={answers[currentQuestion] === option}
                      onChange={(e) => setAnswers({...answers, [currentQuestion]: e.target.value})}
                      className="mr-3"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          
          <div className="flex gap-2">
            {currentQuestion < (activeTest.questions?.length || 0) - 1 ? (
              <Button
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={submitTest}
                className="bg-green-600 hover:bg-green-700"
              >
                Submit Test
              </Button>
            )}
          </div>
        </div>

        {/* Question Navigator */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-10 gap-2">
              {activeTest.questions?.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`w-8 h-8 rounded text-sm font-medium ${
                    index === currentQuestion
                      ? 'bg-blue-600 text-white'
                      : answers[index]
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Tests & Assessments</h1>
        <p className="opacity-90">Take online tests and view your results</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Tests</p>
                <p className="text-2xl font-bold text-gray-900">{tests.length}</p>
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
                <p className="text-2xl font-bold text-gray-900">{attempts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Score</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Play className="h-5 w-5 text-green-600 mr-2" />
              Available Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tests.map((test) => (
                <div key={test.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{test.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{test.subject}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {test.duration_minutes} minutes
                        </div>
                        <div className="flex items-center">
                          <FileText className="h-3 w-3 mr-1" />
                          {test.questions?.length || 0} questions
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Due: {new Date(test.end_time).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      {hasAttempted(test.id) ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </span>
                      ) : isTestAvailable(test) ? (
                        <Button size="sm" onClick={() => startTest(test)}>
                          <Play className="h-4 w-4 mr-1" />
                          Start Test
                        </Button>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Not Available
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {tests.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No tests available at the moment.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 text-yellow-600 mr-2" />
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {attempts.map((attempt) => (
                <div key={attempt.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{attempt.test?.title}</h4>
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
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(attempt.attempted_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {Math.floor(attempt.time_taken / 60)}:{(attempt.time_taken % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                </div>
              ))}
              
              {attempts.length === 0 && (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No test results yet.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}