import React, { useState, useEffect } from 'react'
import { getCurrentUser } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { MessageCircle, Send, Users, Bell, Eye } from 'lucide-react'
import type { Admin, Class, Message } from '../../lib/supabase'

export default function MessagesManagement() {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const user = getCurrentUser()
    if (user && user.userType === 'admin') {
      setAdmin(user as Admin)
    }
    loadClasses()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      loadMessages(selectedClass)
    }
  }, [selectedClass])

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('class_number', { ascending: true })

      if (data && !error) {
        setClasses(data)
        if (data.length > 0) {
          setSelectedClass(data[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading classes:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (classId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('class_id', classId)
        .eq('message_type', 'group')
        .order('sent_at', { ascending: true })
        .limit(50)

      if (data && !error) {
        setMessages(data)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const sendClassMessage = async () => {
    if (!admin || !selectedClass || !newMessage.trim()) return

    setSending(true)
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: admin.id,
          sender_type: 'admin',
          class_id: selectedClass,
          message_type: 'group',
          content: newMessage.trim()
        })

      if (!error) {
        setNewMessage('')
        await loadMessages(selectedClass)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const sendBroadcast = async () => {
    if (!admin || !broadcastMessage.trim()) return

    setSending(true)
    try {
      const broadcastPromises = classes.map(cls => 
        supabase
          .from('messages')
          .insert({
            sender_id: admin.id,
            sender_type: 'admin',
            class_id: cls.id,
            message_type: 'broadcast',
            content: broadcastMessage.trim()
          })
      )

      await Promise.all(broadcastPromises)
      setBroadcastMessage('')
      alert('Broadcast sent to all classes!')
    } catch (error) {
      console.error('Error sending broadcast:', error)
      alert('Failed to send broadcast')
    } finally {
      setSending(false)
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
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Messages & Communication</h1>
        <p className="opacity-90">Manage class chats and send broadcasts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Selection & Broadcast */}
        <div className="lg:col-span-1 space-y-6">
          {/* Class Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 text-blue-600 mr-2" />
                Select Class
              </CardTitle>
            </CardHeader>
            <CardContent>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">Select a class</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </CardContent>
          </Card>

          {/* Broadcast */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 text-orange-600 mr-2" />
                Broadcast Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md resize-none h-24"
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Send message to all classes..."
                />
                <Button
                  onClick={sendBroadcast}
                  disabled={sending || !broadcastMessage.trim()}
                  className="w-full"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Send Broadcast
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2">
          <Card className="h-96 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="h-5 w-5 text-green-600 mr-2" />
                {selectedClass ? `${classes.find(c => c.id === selectedClass)?.name} Chat` : 'Select a Class'}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              {selectedClass ? (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_type === 'admin'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <div className={`text-xs mt-1 ${
                            message.sender_type === 'admin' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {new Date(message.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            sendClassMessage()
                          }
                        }}
                        className="flex-1"
                      />
                      <Button 
                        onClick={sendClassMessage}
                        disabled={sending || !newMessage.trim()}
                        size="sm"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Select a class to view and manage chat</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}