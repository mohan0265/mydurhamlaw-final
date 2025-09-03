'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase/client'
import { withAuthProtection } from '@/lib/withAuthProtection'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/Textarea'
import { 
  Users, 
  FileText, 
  Calendar, 
  Settings, 
  BarChart3, 
  MessageSquare,
  Shield,
  Brain,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  Target,
  TrendingUp,
  BookOpen,
  UserPlus,
  Database,
  Zap,
  RefreshCw
} from 'lucide-react'

interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: 'new' | 'in_progress' | 'resolved'
  created_at: string
  handled_by?: string
}

interface TriageResult {
  id: string
  risk_level: 'high' | 'moderate' | 'low'
  responses: any
  created_at: string
}

interface LeadCapture {
  id: string
  name: string
  email: string
  user_type: 'csr' | 'champion' | 'specialist'
  created_at: string
  follow_up_assigned?: string
}

interface ContentActivity {
  id: string
  title: string
  status: 'published' | 'draft' | 'archived'
  published_at: string
  views?: number
}

const SuperAdminDashboard: React.FC = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [lastSynced, setLastSynced] = useState(new Date())
  
  // Data states
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([])
  const [triageResults, setTriageResults] = useState<TriageResult[]>([])
  const [leads, setLeads] = useState<LeadCapture[]>([])
  const [contentActivity, setContentActivity] = useState<ContentActivity[]>([])
  const [users, setUsers] = useState<any[]>([])
  
  // AI Tools state
  const [aiInput, setAiInput] = useState('')
  const [aiOutput, setAiOutput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'crm', label: 'CRM Hub', icon: MessageSquare },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'ai-ops', label: 'AI Tools', icon: Brain },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'system', label: 'System', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  const fetchContactMessages = useCallback(async () => {
    if (!supabase) {
      console.warn('Supabase client not available')
      setContactMessages([])
      return
    }

    try {
      // First, check if table exists, create if not
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error && error.message.includes('does not exist')) {
        // Create table if it doesn't exist
        await createContactMessagesTable()
        setContactMessages([])
      } else if (data) {
        setContactMessages(data)
      }
    } catch (error) {
      console.error('Error fetching contact messages:', error)
      setContactMessages([])
    }
  }, [])

  const fetchTriageResults = useCallback(async () => {
    if (!supabase) {
      console.warn('Supabase client not available')
      setTriageResults([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('triage_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error && error.message.includes('does not exist')) {
        await createTriageResultsTable()
        setTriageResults([])
      } else if (data) {
        setTriageResults(data)
      }
    } catch (error) {
      console.error('Error fetching triage results:', error)
      setTriageResults([])
    }
  }, [])

  const fetchLeads = useCallback(async () => {
    if (!supabase) {
      console.warn('Supabase client not available')
      setLeads([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, user_type, created_at')
        .in('user_type', ['csr', 'champion', 'specialist'])
        .order('created_at', { ascending: false })
        .limit(50)

      if (data) {
        setLeads(data.map(item => ({
          ...item,
          name: item.name || 'Unknown'
        })))
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
      setLeads([])
    }
  }, [])

  const fetchContentActivity = useCallback(async () => {
    if (!supabase) {
      console.warn('Supabase client not available')
      setContentActivity([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('seo_pages')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(25)

      if (error && error.message.includes('does not exist')) {
        await createSeoPagesTable()
        setContentActivity([])
      } else if (data) {
        setContentActivity(data)
      }
    } catch (error) {
      console.error('Error fetching content activity:', error)
      setContentActivity([])
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    if (!supabase) {
      console.warn('Supabase client not available')
      setUsers([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, user_type, created_at')
        .order('created_at', { ascending: false })
        .limit(100)

      if (data) {
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }, [])

  // Database table creation functions
  const createContactMessagesTable = async () => {
    console.log('Contact messages table needs to be created via Supabase SQL')
  }

  const createTriageResultsTable = async () => {
    console.log('Triage results table needs to be created via Supabase SQL')
  }

  const createSeoPagesTable = async () => {
    console.log('SEO pages table needs to be created via Supabase SQL')
  }

  const updateContactStatus = async (id: string, status: string) => {
    if (!supabase) {
      console.warn('Supabase client not available')
      showToast('Database connection not available', 'error')
      return
    }

    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ 
          status, 
          handled_by: 'Admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (!error) {
        setContactMessages(prev => 
          prev.map(msg => msg.id === id ? { ...msg, status: status as any } : msg)
        )
        showToast(`Contact message marked as ${status}`, 'success')
      }
    } catch (error) {
      console.error('Error updating contact status:', error)
      showToast('Error updating contact status', 'error')
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    // Simple toast implementation - could be enhanced with a proper toast library
    console.log(`${type.toUpperCase()}: ${message}`)
  }

  const handleAiTest = async () => {
    if (!aiInput.trim()) return
    
    setAiLoading(true)
    try {
      // Placeholder for Hunyuan integration
      await new Promise(resolve => setTimeout(resolve, 2000))
      setAiOutput(`AI Summary: ${aiInput.slice(0, 100)}...`)
      showToast('AI processing complete', 'success')
    } catch (error) {
      showToast('AI processing failed', 'error')
    } finally {
      setAiLoading(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        await Promise.all([
          fetchContactMessages(),
          fetchTriageResults(),
          fetchLeads(),
          fetchContentActivity(),
          fetchUsers()
        ])
      } catch (error) {
        console.error('Error fetching admin data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(() => {
      setLastSynced(new Date())
      fetchData()
    }, 300000) // Refresh every 5 minutes

    return () => clearInterval(interval)
  }, [fetchContactMessages, fetchTriageResults, fetchLeads, fetchContentActivity, fetchUsers])

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New Messages</p>
                <p className="text-2xl font-bold text-blue-600">
                  {contactMessages.filter(msg => msg.status === 'new').length}
                </p>
              </div>
              <Mail className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Risk Triage</p>
                <p className="text-2xl font-bold text-red-600">
                  {triageResults.filter(t => t.risk_level === 'high').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New Leads</p>
                <p className="text-2xl font-bold text-green-600">
                  {leads.filter(l => {
                    const dayAgo = new Date()
                    dayAgo.setDate(dayAgo.getDate() - 1)
                    return new Date(l.created_at) > dayAgo
                  }).length}
                </p>
              </div>
              <UserPlus className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-purple-600">{users.length}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Form Submissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Recent Contact Form Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {contactMessages.slice(0, 5).map((message) => (
              <div key={message.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{message.name}</h4>
                      <span className="text-sm text-gray-600">{message.email}</span>
                      <span className={`px-2 py-1 rounded text-xs border ${
                        message.status === 'new' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                        message.status === 'in_progress' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                        'bg-green-50 text-green-600 border-green-200'
                      }`}>
                        {message.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="font-medium text-gray-800 mb-1">{message.subject}</p>
                    <p className="text-sm text-gray-600 mb-2">
                      {message.message.substring(0, 120)}...
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(message.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {message.status === 'new' && (
                      <Button 
                        size="sm" 
                        onClick={() => updateContactStatus(message.id, 'in_progress')}
                        className="min-h-[32px]"
                      >
                        Handle
                      </Button>
                    )}
                    {message.status === 'in_progress' && (
                      <Button 
                        size="sm" 
                        onClick={() => updateContactStatus(message.id, 'resolved')}
                        className="min-h-[32px]"
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {contactMessages.length === 0 && (
              <p className="text-gray-500 text-center py-8">No contact messages yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Triage Assessment Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Triage Risk Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['high', 'moderate', 'low'].map((risk) => {
                const count = triageResults.filter(t => t.risk_level === risk).length
                const percentage = triageResults.length > 0 ? (count / triageResults.length) * 100 : 0
                return (
                  <div key={risk} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-1 rounded text-sm border ${getRiskColor(risk)}`}>
                        {risk.charAt(0).toUpperCase() + risk.slice(1)} Risk
                      </span>
                      <span className="font-semibold">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          risk === 'high' ? 'bg-red-500' :
                          risk === 'moderate' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Lead Capture Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Recent Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {leads.slice(0, 6).map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{lead.name}</p>
                    <p className="text-sm text-gray-600">{lead.email}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs border ${
                      lead.user_type === 'csr' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                      lead.user_type === 'champion' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                      'bg-green-50 text-green-600 border-green-200'
                    }`}>
                      {lead.user_type.toUpperCase()}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {leads.length === 0 && (
                <p className="text-gray-500 text-center py-8">No leads yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderCRM = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>CRM & Engagement Hub</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contactMessages.map((message) => (
              <div key={message.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{message.name}</h4>
                      <span className="text-sm text-gray-600">{message.email}</span>
                      <span className={`px-2 py-1 rounded text-xs border ${
                        message.status === 'new' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                        message.status === 'in_progress' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                        'bg-green-50 text-green-600 border-green-200'
                      }`}>
                        {message.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h5 className="font-medium text-gray-800 mb-2">{message.subject}</h5>
                    <p className="text-gray-600 mb-3">{message.message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <select 
                      className="px-3 py-1 border rounded text-sm min-h-[32px]"
                      value={message.status}
                      onChange={(e) => updateContactStatus(message.id, e.target.value)}
                    >
                      <option value="new">New</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    <Button size="sm" variant="secondary" className="min-h-[32px]">
                      Add Note
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {contactMessages.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No CRM messages yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderAITools = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Operations (Hunyuan 7B Ready)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Text Summarization Test</h3>
              <Textarea
                placeholder="Enter text to summarize..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                rows={6}
              />
              <Button 
                onClick={handleAiTest}
                disabled={aiLoading || !aiInput.trim()}
                className="w-full min-h-[44px]"
              >
                {aiLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Generate Summary
                  </>
                )}
              </Button>
              {aiOutput && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800">{aiOutput}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">AI Monitoring Dashboard</h3>
              <div className="space-y-3">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Auto-Summary Queue</h4>
                  <p className="text-blue-700 text-sm">0 PubMed entries pending</p>
                </div>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">High-Risk Alerts</h4>
                  <p className="text-yellow-700 text-sm">
                    {triageResults.filter(t => t.risk_level === 'high').length} high-risk triage results flagged
                  </p>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-2">Content Suggestions</h4>
                  <p className="text-purple-700 text-sm">Clinical trends analysis ready</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderUsers = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 p-3 text-left">Name</th>
                  <th className="border border-gray-200 p-3 text-left">Email</th>
                  <th className="border border-gray-200 p-3 text-left">Type</th>
                  <th className="border border-gray-200 p-3 text-left">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 p-3">{user.name || 'N/A'}</td>
                    <td className="border border-gray-200 p-3">{user.email}</td>
                    <td className="border border-gray-200 p-3">
                      <span className={`px-2 py-1 rounded text-xs border ${
                        user.user_type === 'csr' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                        user.user_type === 'champion' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                        user.user_type === 'specialist' ? 'bg-green-50 text-green-600 border-green-200' :
                        'bg-gray-50 text-gray-600 border-gray-200'
                      }`}>
                        {user.user_type || 'student'}
                      </span>
                    </td>
                    <td className="border border-gray-200 p-3">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderContent = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Education Content Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {contentActivity.map((content) => (
              <div key={content.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{content.title}</h4>
                  <p className="text-sm text-gray-600">
                    Published: {new Date(content.published_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs border ${
                    content.status === 'published' ? 'bg-green-50 text-green-600 border-green-200' :
                    content.status === 'draft' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                    'bg-gray-50 text-gray-600 border-gray-200'
                  }`}>
                    {content.status}
                  </span>
                  {content.views && (
                    <span className="text-sm text-gray-600">{content.views} views</span>
                  )}
                </div>
              </div>
            ))}
            {contentActivity.length === 0 && (
              <p className="text-gray-500 text-center py-8">No content activity yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">COLONAiVE™ Admin Console</h1>
            <p className="text-gray-600">CRM-lite Dashboard & Operations</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Last synced: {lastSynced.toLocaleTimeString()}
            </span>
            <Button 
              onClick={() => {
                setLoading(true)
                Promise.all([
                  fetchContactMessages(),
                  fetchTriageResults(),
                  fetchLeads(),
                  fetchContentActivity(),
                  fetchUsers()
                ]).finally(() => setLoading(false))
              }} 
              variant="secondary" 
              size="sm"
              disabled={loading}
              className="min-h-[36px]"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6">
        <div className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors min-h-[44px] ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'crm' && renderCRM()}
        {activeTab === 'content' && renderContent()}
        {activeTab === 'ai-ops' && renderAITools()}
        {activeTab === 'events' && (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Events Management</h3>
              <p className="text-gray-600">Event tracking coming soon</p>
            </CardContent>
          </Card>
        )}
        {activeTab === 'system' && (
          <Card>
            <CardContent className="p-8 text-center">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">System Status</h3>
              <p className="text-gray-600">All systems operational</p>
            </CardContent>
          </Card>
        )}
        {activeTab === 'settings' && (
          <Card>
            <CardContent className="p-8 text-center">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Admin Settings</h3>
              <p className="text-gray-600">Configuration options coming soon</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default withAuthProtection(SuperAdminDashboard)