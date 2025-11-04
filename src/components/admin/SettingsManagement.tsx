import React, { useState, useEffect } from 'react'
import { getCurrentUser } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Settings, Key, Save, Eye, EyeOff } from 'lucide-react'
import type { Admin } from '../../lib/supabase'

export default function SettingsManagement() {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [settings, setSettings] = useState({
    openrouter_api_key: '',
    school_name: 'SOSE Lajpat Nagar',
    academic_year: '2024-25',
    max_books_per_student: '3',
    homework_submission_days: '7'
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const user = getCurrentUser()
    if (user && user.userType === 'admin') {
      setAdmin(user as Admin)
    }
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single()

      if (data && !error) {
        setSettings({
          openrouter_api_key: data.openrouter_api_key || '',
          school_name: data.school_name || 'SOSE Lajpat Nagar',
          academic_year: data.academic_year || '2024-25',
          max_books_per_student: data.max_books_per_student?.toString() || '3',
          homework_submission_days: data.homework_submission_days?.toString() || '7'
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!admin) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          id: 1, // Single settings record
          openrouter_api_key: settings.openrouter_api_key,
          school_name: settings.school_name,
          academic_year: settings.academic_year,
          max_books_per_student: parseInt(settings.max_books_per_student),
          homework_submission_days: parseInt(settings.homework_submission_days),
          updated_by: admin.id,
          updated_at: new Date().toISOString()
        })

      if (!error) {
        alert('Settings saved successfully!')
      } else {
        alert('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('An error occurred while saving settings')
    } finally {
      setSaving(false)
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
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">System Settings</h1>
        <p className="opacity-90">Configure system-wide settings and API keys</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="h-5 w-5 text-blue-600 mr-2" />
              API Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OpenRouter API Key
              </label>
              <div className="relative">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.openrouter_api_key}
                  onChange={(e) => setSettings({...settings, openrouter_api_key: e.target.value})}
                  placeholder="Enter your OpenRouter API key"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Used for AI Doubt Solver functionality
              </p>
            </div>
          </CardContent>
        </Card>

        {/* School Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 text-green-600 mr-2" />
              School Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Name
              </label>
              <Input
                value={settings.school_name}
                onChange={(e) => setSettings({...settings, school_name: e.target.value})}
                placeholder="School name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year
              </label>
              <Input
                value={settings.academic_year}
                onChange={(e) => setSettings({...settings, academic_year: e.target.value})}
                placeholder="2024-25"
              />
            </div>
          </CardContent>
        </Card>

        {/* Library Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Library Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Books Per Student
              </label>
              <Input
                type="number"
                min="1"
                max="10"
                value={settings.max_books_per_student}
                onChange={(e) => setSettings({...settings, max_books_per_student: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Homework Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Homework Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Submission Days (Default)
              </label>
              <Input
                type="number"
                min="1"
                max="30"
                value={settings.homework_submission_days}
                onChange={(e) => setSettings({...settings, homework_submission_days: e.target.value})}
              />
              <p className="text-xs text-gray-500 mt-1">
                Default number of days for homework submission
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving} className="px-8">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}