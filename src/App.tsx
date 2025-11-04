import React, { useState } from 'react'
import LoginPage from './components/auth/LoginPage'
import StudentDashboard from './components/student/StudentDashboard'
import StudentNavigation from './components/student/StudentNavigation'
import StudentProfile from './components/student/StudentProfile'
import LibraryModule from './components/student/LibraryModule'
import HomeworkModule from './components/student/HomeworkModule'
import ResultsModule from './components/student/ResultsModule'
import AttendanceModule from './components/student/AttendanceModule'
import NoticesModule from './components/student/NoticesModule'
import ChatModule from './components/student/ChatModule'
import VoiceLinkModule from './components/student/VoiceLinkModule'
import AIDoubtModule from './components/student/AIDoubtModule'
import AdminDashboard from './components/admin/AdminDashboard'
import AdminNavigation from './components/admin/AdminNavigation'
import StudentsManagement from './components/admin/StudentsManagement'
import LibraryManagement from './components/admin/LibraryManagement'
import HomeworkManagement from './components/admin/HomeworkManagement'
import ResultsManagement from './components/admin/ResultsManagement'
import AttendanceManagement from './components/admin/AttendanceManagement'
import NoticesManagement from './components/admin/NoticesManagement'
import VoiceLinkManagement from './components/admin/VoiceLinkManagement'
import AIQueriesManagement from './components/admin/AIQueriesManagement'
import type { Student, Admin } from './lib/supabase'

type UserType = 'student' | 'admin' | null

function App() {
  const [user, setUser] = useState<(Student | Admin) | null>(null)
  const [userType, setUserType] = useState<UserType>(null)
  const [activePage, setActivePage] = useState('dashboard')

  const handleLogin = (userData: Student | Admin, type: 'student' | 'admin') => {
    setUser(userData)
    setUserType(type)
    setActivePage('dashboard')
  }

  const handleLogout = () => {
    setUser(null)
    setUserType(null)
    setActivePage('dashboard')
  }

  const handleNavigate = (page: string) => {
    setActivePage(page)
  }

  // Show login page if not authenticated
  if (!user || !userType) {
    return <LoginPage onLogin={handleLogin} />
  }

  // Render student interface
  if (userType === 'student') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <StudentNavigation 
          activePage={activePage}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
        <div className="flex-1 overflow-hidden">
          {activePage === 'dashboard' && <StudentDashboard onNavigate={handleNavigate} />}
          {activePage === 'profile' && <StudentProfile />}
          {activePage === 'library' && <LibraryModule />}
          {activePage === 'homework' && <HomeworkModule />}
          {activePage === 'results' && <ResultsModule />}
          {activePage === 'attendance' && <AttendanceModule />}
          {activePage === 'chat' && <ChatModule />}
          {activePage === 'voicelink' && <VoiceLinkModule />}
          {activePage === 'ai-doubt' && <AIDoubtModule />}
          {activePage === 'notices' && <NoticesModule />}
        </div>
      </div>
    )
  }

  // Render admin interface
  if (userType === 'admin') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminNavigation 
          activePage={activePage}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
        <div className="flex-1 overflow-hidden">
          {activePage === 'dashboard' && <AdminDashboard onNavigate={handleNavigate} />}
          {activePage === 'students' && <StudentsManagement />}
          {activePage === 'students-add' && <StudentsManagement />}
          {activePage === 'library' && <LibraryManagement />}
          {activePage === 'books' && <LibraryManagement />}
          {activePage === 'books-add' && <LibraryManagement />}
          {activePage === 'library-requests' && <LibraryManagement />}
          {activePage === 'homework' && <HomeworkManagement />}
          {activePage === 'homework-create' && <HomeworkManagement />}
          {activePage === 'submissions' && <HomeworkManagement />}
          {activePage === 'results' && <ResultsManagement />}
          {activePage === 'attendance' && <AttendanceManagement />}
          {activePage === 'notices' && <NoticesManagement />}
          {activePage === 'notices-create' && <NoticesManagement />}
          {activePage === 'voicelink' && <VoiceLinkManagement />}
          {activePage === 'ai-queries' && <AIQueriesManagement />}
          {activePage === 'messages' && <div className="p-6"><div className="bg-blue-50 rounded-lg p-6"><h2 className="text-xl font-bold text-blue-900 mb-2">Messages Module</h2><p className="text-blue-800">Direct messaging system coming soon...</p></div></div>}
          {activePage === 'settings' && <div className="p-6"><div className="bg-purple-50 rounded-lg p-6"><h2 className="text-xl font-bold text-purple-900 mb-2">Settings Module</h2><p className="text-purple-800">System settings and configuration coming soon...</p></div></div>}
        </div>
      </div>
    )
  }

  return null
}

export default App