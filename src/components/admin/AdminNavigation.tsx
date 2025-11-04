import React from 'react'
import { Button } from '../ui/button'
import { 
  Home, 
  Users, 
  BookOpen, 
  FileText, 
  BarChart3, 
  Calendar, 
  MessageCircle, 
  Heart, 
  Brain,
  Bell,
  Settings,
  LogOut,
  GraduationCap,
  UserPlus,
  Plus,
  List,
  Clock
} from 'lucide-react'
import { logout } from '../../lib/auth'

interface AdminNavigationProps {
  activePage: string
  onNavigate: (page: string) => void
  onLogout: () => void
}

export default function AdminNavigation({ activePage, onNavigate, onLogout }: AdminNavigationProps) {
  const handleLogout = () => {
    logout()
    onLogout()
  }

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { 
      id: 'students', 
      label: 'Students', 
      icon: Users,
      children: [
        { id: 'students', label: 'All Students', icon: List },
        { id: 'students-add', label: 'Add Student', icon: UserPlus },
      ]
    },
    { 
      id: 'library', 
      label: 'Library', 
      icon: BookOpen,
      children: [
        { id: 'books', label: 'All Books', icon: List },
        { id: 'books-add', label: 'Add Book', icon: Plus },
        { id: 'library-requests', label: 'Book Requests', icon: Clock },
      ]
    },
    { 
      id: 'homework', 
      label: 'Homework', 
      icon: FileText,
      children: [
        { id: 'homework', label: 'All Homework', icon: List },
        { id: 'homework-create', label: 'Create Homework', icon: Plus },
        { id: 'submissions', label: 'Submissions', icon: FileText },
      ]
    },
    { id: 'results', label: 'Results', icon: BarChart3 },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { 
      id: 'notices', 
      label: 'Notices', 
      icon: Bell,
      children: [
        { id: 'notices', label: 'All Notices', icon: List },
        { id: 'notices-create', label: 'Create Notice', icon: Plus },
      ]
    },
    { id: 'voicelink', label: 'VoiceLink', icon: Heart },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'ai-queries', label: 'AI Queries', icon: Brain },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const renderNavigationItem = (item: any, isChild = false) => {
    const Icon = item.icon
    const isActive = activePage === item.id
    
    return (
      <div key={item.id}>
        <button
          onClick={() => onNavigate(item.id)}
          className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${isChild ? 'ml-4 text-sm' : ''} ${
            isActive
              ? 'bg-green-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Icon className={`${isChild ? 'h-4 w-4' : 'h-5 w-5'} mr-3`} />
          {item.label}
        </button>
        
        {item.children && (
          <div className="mt-1 space-y-1">
            {item.children.map((child: any) => renderNavigationItem(child, true))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white border-r border-gray-200 w-64 min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-bold text-gray-900">SOSE Portal</h1>
            <p className="text-sm text-gray-600">Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => renderNavigationItem(item))}
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