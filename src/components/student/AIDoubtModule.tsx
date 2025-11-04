import React, { useState, useEffect, useRef } from 'react'
import { getCurrentUser } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Brain, Send, User, Bot, MessageSquare, HelpCircle, Lightbulb, ArrowRight } from 'lucide-react'
import type { Student, AIQuery } from '../../lib/supabase'

export default function AIDoubtModule() {
  const [student, setStudent] = useState<Student | null>(null)
  const [queries, setQueries] = useState<AIQuery[]>([])
  const [currentQuery, setCurrentQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const subjects = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Computer Science', 'General']

  useEffect(() => {
    const user = getCurrentUser()
    if (user && user.userType === 'student') {
      setStudent(user as Student)
      loadQueries(user.id)
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [queries])

  const loadQueries = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('ai_queries')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: true })
        .limit(50)

      if (data && !error) {
        setQueries(data)
      }
    } catch (error) {
      console.error('Error loading queries:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitQuery = async () => {
    if (!student || !currentQuery.trim()) return

    setProcessing(true)
    
    // Add user query to the list immediately
    const userQuery: AIQuery = {
      id: `temp-${Date.now()}`,
      student_id: student.id,
      query: currentQuery.trim(),
      ai_response: '',
      is_forwarded_to_teacher: false,
      teacher_response: '',
      subject: selectedSubject || 'General',
      created_at: new Date().toISOString()
    }
    
    setQueries(prev => [...prev, userQuery])
    const queryText = currentQuery.trim()
    setCurrentQuery('')

    try {
      // Simulate AI response (in real app, call OpenAI API)
      const aiResponse = await generateAIResponse(queryText, selectedSubject)
      
      const { data, error } = await supabase
        .from('ai_queries')
        .insert({
          student_id: student.id,
          query: queryText,
          ai_response: aiResponse,
          subject: selectedSubject || 'General'
        })
        .select()
        .single()

      if (data && !error) {
        // Replace temp query with real one
        setQueries(prev => prev.map(q => 
          q.id === userQuery.id ? data : q
        ))
      }
    } catch (error) {
      console.error('Error submitting query:', error)
    } finally {
      setProcessing(false)
    }
  }

  const generateAIResponse = async (query: string, subject: string): Promise<string> => {
    // In production, replace this with actual OpenAI API call
    // const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY
    // const openaiModel = import.meta.env.VITE_OPENAI_MODEL || 'gpt-3.5-turbo'
    
    // Example OpenAI API integration:
    // const response = await fetch('https://api.openai.com/v1/chat/completions', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${openaiApiKey}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     model: openaiModel,
    //     messages: [
    //       {
    //         role: 'system',
    //         content: `You are a helpful AI tutor for ${subject} subject. Provide clear, educational responses to student questions.`
    //       },
    //       {
    //         role: 'user',
    //         content: query
    //       }
    //     ],
    //     max_tokens: 500,
    //     temperature: 0.7
    //   })
    // })
    // const data = await response.json()
    // return data.choices[0].message.content
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Fallback response generation for demo
    const responses = {
      'Mathematics': [
        "Let me help you with this math problem. Here's a step-by-step approach:",
        "This is a great mathematical question! Let's break it down:",
        "For this math concept, I recommend starting with the basics:"
      ],
      'Science': [
        "This is an interesting scientific question! Let me explain:",
        "Science is fascinating! Here's what you need to know:",
        "Great scientific curiosity! Let me break this down for you:"
      ],
      'English': [
        "This is a good English language question. Here's my explanation:",
        "Let me help you understand this English concept:",
        "English can be tricky, but here's a clear explanation:"
      ],
      'General': [
        "That's a thoughtful question! Here's what I think:",
        "Let me help you understand this concept:",
        "Great question! Here's a comprehensive answer:"
      ]
    }
    
    const subjectResponses = responses[subject as keyof typeof responses] || responses['General']
    const randomResponse = subjectResponses[Math.floor(Math.random() * subjectResponses.length)]
    
    return `${randomResponse}\n\nBased on your query about "${query}", I'd suggest focusing on the fundamental concepts first. If you need more detailed explanation or have follow-up questions, feel free to ask!\n\nWould you like me to forward this to your subject teacher for additional guidance?`
  }

  const forwardToTeacher = async (queryId: string) => {
    try {
      const { error } = await supabase
        .from('ai_queries')
        .update({ is_forwarded_to_teacher: true })
        .eq('id', queryId)

      if (!error) {
        setQueries(prev => prev.map(q => 
          q.id === queryId ? { ...q, is_forwarded_to_teacher: true } : q
        ))
        alert('Question forwarded to teacher successfully!')
      }
    } catch (error) {
      console.error('Error forwarding to teacher:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white mb-6">
        <h1 className="text-2xl font-bold mb-2">AI Doubt Solver</h1>
        <p className="opacity-90">Get instant help with your academic questions using AI</p>
      </div>

      {/* Chat Container */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Brain className="h-5 w-5 text-indigo-600 mr-2" />
              AI Assistant
            </div>
            <div className="flex items-center gap-2">
              <select
                className="px-3 py-1 border border-gray-300 rounded-md bg-white text-sm"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">Select Subject</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
          </CardTitle>
        </CardHeader>

        {/* Messages Area */}
        <CardContent className="flex-1 flex flex-col p-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Welcome Message */}
            {queries.length === 0 && (
              <div className="text-center py-12">
                <Brain className="h-16 w-16 text-indigo-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome to AI Doubt Solver!</h3>
                <p className="text-gray-600 mb-6">Ask me any academic question and I'll help you understand it better.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  <div className="bg-blue-50 rounded-lg p-4 text-left">
                    <Lightbulb className="h-6 w-6 text-blue-600 mb-2" />
                    <h4 className="font-medium text-blue-900 mb-1">Quick Help</h4>
                    <p className="text-sm text-blue-800">Get instant explanations for concepts</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-left">
                    <MessageSquare className="h-6 w-6 text-green-600 mb-2" />
                    <h4 className="font-medium text-green-900 mb-1">Teacher Connect</h4>
                    <p className="text-sm text-green-800">Forward complex questions to teachers</p>
                  </div>
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {queries.map((query) => (
              <div key={query.id} className="space-y-4">
                {/* User Question */}
                <div className="flex justify-end">
                  <div className="max-w-xs lg:max-w-md">
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                      <div className="flex items-center mb-1">
                        <User className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">You</span>
                        {query.subject && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-500 rounded-full text-xs">
                            {query.subject}
                          </span>
                        )}
                      </div>
                      <p className="text-sm">{query.query}</p>
                      <div className="text-xs text-blue-100 mt-1">
                        {formatTime(query.created_at)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Response */}
                {query.ai_response && (
                  <div className="flex justify-start">
                    <div className="max-w-xs lg:max-w-md">
                      <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                        <div className="flex items-center mb-1">
                          <Bot className="h-4 w-4 mr-2 text-indigo-600" />
                          <span className="text-sm font-medium">AI Assistant</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{query.ai_response}</p>
                        
                        {!query.is_forwarded_to_teacher && (
                          <div className="mt-3 pt-2 border-t border-gray-200">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => forwardToTeacher(query.id)}
                              className="text-xs"
                            >
                              <ArrowRight className="h-3 w-3 mr-1" />
                              Ask Teacher
                            </Button>
                          </div>
                        )}
                        
                        {query.is_forwarded_to_teacher && (
                          <div className="mt-2 text-xs text-green-600 flex items-center">
                            <ArrowRight className="h-3 w-3 mr-1" />
                            Forwarded to teacher
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Teacher Response */}
                {query.teacher_response && (
                  <div className="flex justify-start">
                    <div className="max-w-xs lg:max-w-md">
                      <div className="bg-green-100 text-green-900 px-4 py-2 rounded-lg border border-green-200">
                        <div className="flex items-center mb-1">
                          <User className="h-4 w-4 mr-2 text-green-600" />
                          <span className="text-sm font-medium">Teacher</span>
                        </div>
                        <p className="text-sm">{query.teacher_response}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Processing Indicator */}
                {query.id.startsWith('temp-') && processing && (
                  <div className="flex justify-start">
                    <div className="max-w-xs lg:max-w-md">
                      <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg">
                        <div className="flex items-center">
                          <Bot className="h-4 w-4 mr-2 text-indigo-600" />
                          <span className="text-sm">AI is thinking...</span>
                          <div className="ml-2 flex space-x-1">
                            <div className="w-1 h-1 bg-indigo-600 rounded-full animate-bounce"></div>
                            <div className="w-1 h-1 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-1 h-1 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex gap-2">
                <Input
                  value={currentQuery}
                  onChange={(e) => setCurrentQuery(e.target.value)}
                  placeholder="Ask your question here..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      submitQuery()
                    }
                  }}
                  className="flex-1"
                  disabled={processing}
                />
                <Button 
                  onClick={submitQuery}
                  disabled={processing || !currentQuery.trim()}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>Press Enter to send • Select subject for better responses</span>
              <span>{currentQuery.length}/500</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}