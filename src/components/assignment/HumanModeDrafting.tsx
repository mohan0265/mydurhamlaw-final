'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { 
  Brain, 
  FileText, 
  Upload, 
  Trash2, 
  Eye, 
  EyeOff, 
  Sparkles, 
  TrendingUp,
  Clock,
  Target,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { CollapsibleText } from '@/components/ui/CollapsibleText'

interface WritingSample {
  id: string
  content: string
  title?: string
  context?: any
  word_count: number
  is_ai_generated: boolean
  confidence_score: number
  created_at: string
  updated_at: string
}

interface WritingStats {
  total_samples: number
  total_words: number
  avg_confidence: number
  human_mode_enabled: boolean
  last_sample_date: string
}

interface HumanModeDraftingProps {
  userId: string
  onStyleSamplesChange?: (samples: WritingSample[]) => void
  isEnabled: boolean
  onToggle: (enabled: boolean) => void
}

const HumanModeDrafting = ({ 
  userId, 
  onStyleSamplesChange, 
  isEnabled, 
  onToggle 
}: HumanModeDraftingProps) => {
  const [samples, setSamples] = useState<WritingSample[]>([])
  const [stats, setStats] = useState<WritingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [newSampleText, setNewSampleText] = useState('')
  const [newSampleTitle, setNewSampleTitle] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  // expandedSample state removed - now using CollapsibleText component
  const [error, setError] = useState<string | null>(null)

  const fetchSamples = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error('Supabase client not available')
      }
      
      const session = await supabase.auth.getSession()
      if (!session.data.session) {
        throw new Error('No authentication session')
      }

      const response = await fetch('/api/writing-samples?includeStats=true', {
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch writing samples')
      }

      const data = await response.json()
      setSamples(data.samples || [])
      setStats(data.stats || null)
      
      if (onStyleSamplesChange) {
        onStyleSamplesChange(data.samples || [])
      }
    } catch (error: any) {
      console.error('Error fetching samples:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [onStyleSamplesChange])

  useEffect(() => {
    fetchSamples()
  }, [userId, fetchSamples])

  const handleAddSample = async () => {
    if (!newSampleText.trim()) {
      setError('Please enter some text for the writing sample')
      return
    }

    if (newSampleText.trim().length < 50) {
      setError('Writing sample must be at least 50 characters long')
      return
    }

    try {
      setUploading(true)
      setError(null)

      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error('Supabase client not available')
      }
      
      const session = await supabase.auth.getSession()
      if (!session.data.session) {
        throw new Error('No authentication session')
      }

      const response = await fetch('/api/writing-samples', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newSampleText.trim(),
          title: newSampleTitle.trim() || null,
          context: {
            source: 'manual_upload',
            uploaded_at: new Date().toISOString()
          },
          isAiGenerated: false,
          confidenceScore: 1.0
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add writing sample')
      }

      // Reset form and refresh samples
      setNewSampleText('')
      setNewSampleTitle('')
      setShowAddForm(false)
      await fetchSamples()
    } catch (error: any) {
      console.error('Error adding sample:', error)
      setError(error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteSample = async (sampleId: string) => {
    if (!confirm('Are you sure you want to delete this writing sample? This will affect your personal style memory.')) {
      return
    }

    try {
      setError(null)

      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error('Supabase client not available')
      }
      
      const session = await supabase.auth.getSession()
      if (!session.data.session) {
        throw new Error('No authentication session')
      }

      const response = await fetch(`/api/writing-samples/${sampleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`,
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete writing sample')
      }

      await fetchSamples()
    } catch (error: any) {
      console.error('Error deleting sample:', error)
      setError(error.message)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { timeZone: 'Europe/London', 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50'
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getStyleStatus = (sampleCount: number) => {
    if (sampleCount >= 5) return { status: 'Excellent', color: 'text-green-600', icon: CheckCircle2 }
    if (sampleCount >= 3) return { status: 'Good', color: 'text-blue-600', icon: TrendingUp }
    if (sampleCount >= 1) return { status: 'Learning', color: 'text-yellow-600', icon: Target }
    return { status: 'No Samples', color: 'text-gray-600', icon: AlertCircle }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-y-4">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Loading your writing style...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const styleStatus = getStyleStatus(samples.length)
  const StatusIcon = styleStatus.icon

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Private Style Memory™
                  <Badge variant={isEnabled ? 'default' : 'secondary'}>
                    {isEnabled ? 'Active' : 'Disabled'}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-600">
                  We&apos;ll match how you write - every time. Your writing style is privately remembered and applied.
                </p>
              </div>
            </div>
            <Button
              onClick={() => onToggle(!isEnabled)}
              variant={isEnabled ? 'secondary' : 'primary'}
              size="sm"
            >
              {isEnabled ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {isEnabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Stats Row */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.total_samples}</div>
                <div className="text-xs text-gray-500">Writing Samples</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total_words.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Total Words</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{Math.round((stats.avg_confidence || 0) * 100)}%</div>
                <div className="text-xs text-gray-500">Avg Confidence</div>
              </div>
              <div className="text-center">
                <div className={`flex items-center justify-center gap-1 ${styleStatus.color}`}>
                  <StatusIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">{styleStatus.status}</span>
                </div>
                <div className="text-xs text-gray-500">Style Status</div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Error:</strong> {error}
                <button 
                  onClick={() => setError(null)}
                  className="ml-2 text-red-600 hover:text-red-800 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Add Sample Button */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {samples.length === 0 
                ? 'Add your first writing sample to personalize AI output'
                : `${samples.length} sample${samples.length !== 1 ? 's' : ''} ready for style matching`
              }
            </div>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Add Sample
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Sample Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Writing Sample</CardTitle>
            <p className="text-sm text-gray-600">
              Upload a sample of your writing to improve style matching. The more samples you add, the better we can match your unique voice.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title (optional)
              </label>
              <input
                type="text"
                value={newSampleTitle}
                onChange={(e) => setNewSampleTitle(e.target.value)}
                placeholder="e.g., Constitutional Law Essay, Contract Analysis..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Writing Content *
              </label>
              <Textarea
                value={newSampleText}
                onChange={(e) => setNewSampleText(e.target.value)}
                placeholder="Paste your writing here... (minimum 50 characters)"
                rows={6}
                className="resize-none"
              />
              <div className="text-xs text-gray-500 mt-1">
                {newSampleText.length} characters
                {newSampleText.length < 50 && ` (${50 - newSampleText.length} more needed)`}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                onClick={() => {
                  setShowAddForm(false)
                  setNewSampleText('')
                  setNewSampleTitle('')
                  setError(null)
                }}
                variant="outline"
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddSample}
                disabled={uploading || newSampleText.trim().length < 50}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Add Sample
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Samples List */}
      {samples.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Your Writing Samples
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {samples.map((sample) => (
                <div key={sample.id} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">
                          {sample.title || 'Untitled Sample'}
                        </h4>
                        <Badge 
                          className={`text-xs ${getConfidenceColor(sample.confidence_score)}`}
                        >
                          {Math.round(sample.confidence_score * 100)}% confidence
                        </Badge>
                        {sample.is_ai_generated && (
                          <Badge variant="secondary" className="text-xs">
                            AI-Generated
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        {sample.word_count} words • Added {formatDate(sample.created_at)}
                      </div>

                      <div className="mb-3">
                        <CollapsibleText
                          maxLines={4}
                          className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded border"
                          showMoreText="Show Full Sample"
                          showLessText="Show Less"
                          buttonClassName="text-purple-600 hover:text-purple-800 font-medium mt-2"
                          gradientClassName="from-gray-50 to-transparent"
                        >
                          {sample.content}
                        </CollapsibleText>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-2 border-t border-gray-100">
                    <Button
                      onClick={() => handleDeleteSample(sample.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[44px]"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete Sample
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {samples.length === 0 && !showAddForm && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Writing Samples Yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Add samples of your writing to enable Human-Mode Drafting™. The AI will learn your unique style and voice.
            </p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Add Your First Sample
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default HumanModeDrafting