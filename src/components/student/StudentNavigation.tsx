import React from 'react'
import { Button } from '../ui/button'
import { 
  Home, 
  User, 
  BookOpen, 
  FileText, 
  BarChart3, 
  Calendar, 
  MessageCircle, 
  Heart, 
  Brain,
  Bell,
  LogOut,
  GraduationCap
} from 'lucide-react'
import { logout } from '../../lib/auth'

interface StudentNavigationProps {
  activePage: string
  onNavigate: (page: string) => void
  onLogout: () => void
}

export default function StudentNavigation({ activePage, onNavigate, onLogout }: StudentNavigationProps) {
  const handleLogout = () => {
    logout()
    onLogout()
  }

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'library', label: 'Library', icon: BookOpen },
    { id: 'homework', label: 'Homework', icon: FileText },
    { id: 'results', label: 'Results', icon: BarChart3 },
    { id: 'tests', label: 'Tests', icon: FileText },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'chat', label: 'Class Chat', icon: MessageCircle },
    { id: 'voicelink', label: 'VoiceLink', icon: Heart },
    { id: 'ai-doubt', label: 'AI Doubt Solver', icon: Brain },
    { id: 'notices', label: 'Notices', icon: Bell },
  ]

  return (
    <div className="bg-white border-r border-gray-200 w-64 min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-bold text-gray-900">SOSE Portal</h1>
            <p className="text-sm text-gray-600">Student</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                activePage === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-5 w-5 mr-3" />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  )
}