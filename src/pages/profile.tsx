'use client'

import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { User, BookOpen, GraduationCap, Heart, Mail, Plus, Trash2, Save, Loader2 } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import toast from 'react-hot-toast'
import { fetchAuthed } from '@/lib/fetchAuthed'

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // Profile State
  const [profile, setProfile] = useState({
    display_name: '',
    year_group: '',
    degree_type: 'LLB',
    modules: [] as string[],
    modulesInput: ''
  })

  // Loved Ones State
  const [connections, setConnections] = useState<any[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRelationship, setInviteRelationship] = useState('')
  const [isInviting, setIsInviting] = useState(false)

  // Fetch Data
  useEffect(() => {
    const loadData = async () => {
      const supabase = getSupabaseClient()
      if (!supabase) return

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)

      // Load Profile
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileData) {
          setProfile({
            display_name: profileData.display_name || '',
            year_group: profileData.year_group || profileData.year_of_study || '',
            degree_type: profileData.degree_type || 'LLB',
            modules: profileData.modules || [],
            modulesInput: (profileData.modules || []).join(', ')
          })
        }
      } catch (err) {
        console.error('Profile load error:', err)
      }

      // Load Connections
      loadConnections(session.user.id)
      setLoading(false)
    }

    loadData()
  }, [router])

  const loadConnections = async (userId: string) => {
    const supabase = getSupabaseClient()
    if (!supabase) return

    const { data } = await supabase
      .from('awy_connections')
      .select('*')
      .eq('student_id', userId)
      .in('status', ['active', 'accepted', 'pending', 'invited', 'granted'])
    
    setConnections(data || [])
  }

  const handleProfileSave = async () => {
    if (!user) return
    setSaving(true)

    try {
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error("Supabase client missing")

      const modulesArray = profile.modulesInput
        .split(',')
        .map(m => m.trim())
        .filter(Boolean)

      // Write to both year_group (legacy) and year_of_study (canonical)
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profile.display_name,
          year_group: profile.year_group,
          year_of_study: profile.year_group, // Sync both columns
          degree_type: profile.degree_type,
          modules: modulesArray,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      setProfile(prev => ({ ...prev, modules: modulesArray }))
      toast.success('Profile updated successfully')
    } catch (error: any) {
      console.error('Save error:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address')
      return
    }
    
    setIsInviting(true)
    try {
      const res = await fetchAuthed('/api/awy/add-loved-one', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          relationship: inviteRelationship || 'Loved One',
          nickname: inviteRelationship || null
        })
      })

      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to send invite')

      toast.success('Invitation sent!')
      setInviteEmail('')
      setInviteRelationship('')
      loadConnections(user.id)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsInviting(false)
    }
  }

  const handleRevoke = async (connectionId: string) => {
    if (!confirm('Are you sure you want to remove this loved one?')) return

    try {
      const res = await fetchAuthed('/api/awy/revoke-loved-one', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId })
      })

      if (!res.ok) throw new Error('Failed to revoke')
      
      toast.success('Access revoked')
      loadConnections(user.id)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      <main className="max-w-5xl mx-auto p-4 sm:p-8 pt-6">
        <Head>
          <title>My Profile - MyDurhamLaw</title>
        </Head>

        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-1">Manage your academic details and loved ones</p>
          </div>

          {/* Academic Profile */}
          <Card>
             <CardHeader className="border-b bg-white">
                <CardTitle className="flex items-center gap-2 text-indigo-700">
                   <GraduationCap className="w-5 h-5" />
                   Academic Details
                </CardTitle>
             </CardHeader>
             <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                      <input 
                         type="text" 
                         value={profile.display_name}
                         onChange={(e) => setProfile(prev => ({...prev, display_name: e.target.value}))}
                         className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                         placeholder="e.g. Priya"
                      />
                   </div>
                   
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year of Study</label>
                      <select 
                         value={profile.year_group}
                         onChange={(e) => setProfile(prev => ({...prev, year_group: e.target.value}))}
                         className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                      >
                         <option value="">Select Year...</option>
                         <option value="foundation">Foundation Year</option>
                         <option value="year1">Year 1</option>
                         <option value="year2">Year 2</option>
                         <option value="year3">Year 3</option>
                      </select>
                   </div>

                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Degree Type</label>
                      <select 
                         value={profile.degree_type}
                         onChange={(e) => setProfile(prev => ({...prev, degree_type: e.target.value}))}
                         className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                      >
                         <option value="LLB">LLB Law</option>
                         <option value="MLaw">MLaw</option>
                      </select>
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Modules <span className="text-gray-400 font-normal">(Comma separated)</span>
                   </label>
                   <textarea 
                      value={profile.modulesInput}
                      onChange={(e) => setProfile(prev => ({...prev, modulesInput: e.target.value}))}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24"
                      placeholder="e.g. Contract Law, Tort Law, EU Law..."
                   />
                </div>

                <div className="flex justify-end pt-2">
                   <button 
                      onClick={handleProfileSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
                   >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Changes
                   </button>
                </div>
             </CardContent>
          </Card>

          {/* Loved Ones Management */}
          <Card id="loved-ones">
             <CardHeader className="border-b bg-white">
                <CardTitle className="flex items-center gap-2 text-pink-600">
                   <Heart className="w-5 h-5 fill-pink-100" />
                   Manage Loved Ones
                </CardTitle>
             </CardHeader>
             <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-6">
                   People listed here can see your online status via the &quot;Always With You&quot; widget. You can revoke access at any time.
                </p>

                {/* Invite Form */}
                <div className="bg-pink-50/50 rounded-xl p-4 border border-pink-100 mb-8">
                   <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-pink-600" /> Invite New Connection
                   </h3>
                   <div className="flex flex-col md:flex-row gap-3">
                      <input 
                         type="email" 
                         value={inviteEmail}
                         onChange={(e) => setInviteEmail(e.target.value)}
                         placeholder="Email address"
                         className="flex-1 p-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                      />
                      <input 
                         type="text" 
                         value={inviteRelationship}
                         onChange={(e) => setInviteRelationship(e.target.value)}
                         placeholder="Relationship (e.g. Mum)"
                         className="flex-1 p-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                      />
                      <button 
                         onClick={handleInvite}
                         disabled={isInviting}
                         className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 whitespace-nowrap font-medium disabled:opacity-50"
                      >
                         {isInviting ? 'Sending...' : 'Send Invite'}
                      </button>
                   </div>
                </div>

                {/* Connections List */}
                <div className="space-y-4">
                   <h3 className="font-semibold text-gray-800">Your Connections</h3>
                   
                   {connections.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 border border-dashed rounded-xl text-gray-500">
                         No loved ones connected yet. Invite someone above!
                      </div>
                   ) : (
                      <div className="grid gap-3">
                         {connections.map((conn) => (
                            <div key={conn.id} className="flex items-center justify-between p-4 bg-white border rounded-xl hover:shadow-sm transition-shadow">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold">
                                     {(conn.nickname || conn.email || '?')[0].toUpperCase()}
                                  </div>
                                  <div>
                                     <p className="font-medium text-gray-900">{conn.nickname || conn.email}</p>
                                     <p className="text-xs text-gray-500">{conn.email} • {conn.status}</p>
                                  </div>
                               </div>
                               <button 
                                  onClick={() => handleRevoke(conn.id)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Revoke Access"
                               >
                                  <Trash2 className="w-4 h-4" />
                               </button>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
             </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
