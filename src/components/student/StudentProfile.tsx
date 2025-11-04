import React, { useState, useEffect } from 'react'
import { getCurrentUser } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { User, Mail, Phone, MapPin, Calendar, BookOpen, Save, CreditCard as Edit } from 'lucide-react'
import type { Student } from '../../lib/supabase'

export default function StudentProfile() {
  const [student, setStudent] = useState<Student | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const user = getCurrentUser()
    if (user && user.userType === 'student') {
      setStudent(user as Student)
      setBio(user.bio || '')
      setEmail(user.email || '')
      setPhone(user.phone || '')
      setLoading(false)
    }
  }, [])

  const handleSave = async () => {
    if (!student) return
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from('students')
        .update({ bio, email, phone })
        .eq('id', student.id)

      if (!error) {
        // Update the current user in auth context
        const updatedStudent = { ...student, bio, email, phone }
        setStudent(updatedStudent)
        setCurrentUser({ ...updatedStudent, userType: 'student' })
        setIsEditing(false)
        alert('Profile updated successfully!')
      } else {
        alert('Failed to update profile. Please try again.')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('An error occurred while updating your profile.')
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !student) return

    setUploadingPhoto(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${student.id}-${Math.random()}.${fileExt}`
      const filePath = `profile-photos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath)

      const photoUrl = data.publicUrl

      const { error: updateError } = await supabase
        .from('students')
        .update({ profile_photo: photoUrl })
        .eq('id', student.id)

      if (!updateError) {
        setProfilePhoto(photoUrl)
        const updatedStudent = { ...student, profile_photo: photoUrl }
        setStudent(updatedStudent)
        setCurrentUser({ ...updatedStudent, userType: 'student' })
        alert('Profile photo updated successfully!')
      }
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Failed to upload photo. Please try again.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const requestProfileUpdate = async () => {
    if (!student) return

    try {
      const { error } = await supabase
        .from('profile_update_requests')
        .insert({
          student_id: student.id,
          requested_changes: 'Profile update assistance needed',
          status: 'pending'
        })

      if (!error) {
        alert('Profile update request sent to admin successfully!')
      } else {
        alert('Failed to send request. Please try again.')
      }
    } catch (error) {
      console.error('Error requesting profile update:', error)
      alert('An error occurred while sending the request.')
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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto h-24 w-24 bg-blue-600 rounded-full flex items-center justify-center mb-4 relative overflow-hidden">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="h-12 w-12 text-white" />
            )}
            <label className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
              <Upload className="h-6 w-6 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploadingPhoto}
              />
            </label>
          </div>
          {uploadingPhoto && <p className="text-sm text-blue-600">Uploading photo...</p>}
          <CardTitle className="text-2xl">{student?.name}</CardTitle>
          <p className="text-gray-600">
            Class: {student?.class?.name} | Roll No: {student?.roll_number}
          </p>
          <Button variant="outline" size="sm" onClick={requestProfileUpdate} className="mt-2">
            <MessageSquare className="h-4 w-4 mr-2" />
            Request Admin Help
          </Button>
        </CardHeader>
      </Card>

      {/* Profile Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 text-blue-600 mr-2" />
              Personal Information
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="h-4 w-4 mr-2" />
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student ID
              </label>
              <Input value={student?.student_id || ''} disabled />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              <Input value={student?.dob || ''} disabled />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isEditing}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <Input 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                disabled={!isEditing}
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md resize-none h-24 disabled:bg-gray-50"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={!isEditing}
                placeholder="Tell us about yourself..."
              />
            </div>

            {isEditing && (
              <Button onClick={handleSave} disabled={saving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Family Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 text-green-600 mr-2" />
              Family Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Father's Name
              </label>
              <Input value={student?.fathers_name || ''} disabled />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mother's Name
              </label>
              <Input value={student?.mothers_name || ''} disabled />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md resize-none h-20 bg-gray-50"
                value={student?.address || ''}
                disabled
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-800">
                To update family information, please contact the school administration.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Academic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 text-purple-600 mr-2" />
            Academic Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class
              </label>
              <Input value={student?.class?.name || ''} disabled />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Roll Number
              </label>
              <Input value={student?.roll_number?.toString() || ''} disabled />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class Teacher
              </label>
              <Input value={student?.class?.class_teacher || ''} disabled />
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Account Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-yellow-700">Account Created:</span>
                <span className="ml-2 font-medium">
                  {student?.created_at ? new Date(student.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-yellow-700">Last Login:</span>
                <span className="ml-2 font-medium">
                  {student?.last_login ? new Date(student.last_login).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}