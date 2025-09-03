'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import HumanModeDrafting from './HumanModeDrafting'
import { 
  PenTool, 
  Wand2, 
  Copy, 
  Download, 
  ThumbsUp, 
  ThumbsDown,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Target,
  BookOpen
} from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Accordion } from '@/components/ui/Accordion'
import { CollapsibleText } from '@/components/ui/CollapsibleText'

interface WritingSample {
  id: string
  content: string
  title?: string
  word_count: number
  confidence_score: number
}

interface AssignmentGeneratorProps {
  userId: string
}

const AssignmentGenerator = ({ userId }: AssignmentGeneratorProps) => {
  const [prompt, setPrompt] = useState('')
  const [assignmentType, setAssignmentType] = useState('essay')
  const [wordCount, setWordCount] = useState(1000)
  const [generatedContent, setGeneratedContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [humanModeEnabled, setHumanModeEnabled] = useState(true)
  const [styleStrength, setStyleStrength] = useState(0.8)
  const [styleSamples, setStyleSamples] = useState<WritingSample[]>([])
  const [error, setError] = useState<string | null>(null)
  const [generationStats, setGenerationStats] = useState<any>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  
  const outputRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (generatedContent) {
      setEditedContent(generatedContent)
    }
  }, [generatedContent])

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter an assignment prompt')
      return
    }

    try {
      setIsGenerating(true)
      setError(null)
      setGeneratedContent('')
      setGenerationStats(null)
      setShowFeedback(false)

      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error('Supabase client not available')
      }
      
      const session = await supabase.auth.getSession()
      if (!session.data.session) {
        throw new Error('No authentication session')
      }

      const response = await fetch('/api/assignment-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          assignmentType,
          wordCount,
          useHumanMode: humanModeEnabled,
          styleStrength,
          userId
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(errorData || 'Failed to generate assignment')
      }

      // Extract generation stats from headers
      const stats = {
        humanModeEnabled: response.headers.get('X-Human-Mode-Enabled') === 'true',
        styleSamplesUsed: parseInt(response.headers.get('X-Style-Samples-Used') || '0'),
        assignmentType: response.headers.get('X-Assignment-Type') || assignmentType
      }
      setGenerationStats(stats)

      // Stream the response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let content = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value, { stream: true })
          content += chunk
          setGeneratedContent(content)
          
          // Auto-scroll to bottom
          if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight
          }
        }
      }

      setShowFeedback(true)
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return // Request was cancelled
      }
      console.error('Error generating assignment:', error)
      setError(error.message || 'Failed to generate assignment')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editedContent)
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const handleDownload = () => {
    const element = document.createElement('a')
    const file = new Blob([editedContent], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `assignment-${assignmentType}-${Date.now()}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleSaveAsStyle = async () => {
    if (!editedContent.trim()) {
      setError('No content to save as style sample')
      return
    }

    try {
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
          content: editedContent.trim(),
          title: `${assignmentType} - ${new Date().toLocaleDateString()}`,
          context: {
            source: 'assignment_generator',
            original_prompt: prompt,
            assignment_type: assignmentType,
            target_word_count: wordCount,
            human_mode_used: humanModeEnabled,
            generated_at: new Date().toISOString()
          },
          isAiGenerated: true, // This was AI-generated but then edited by user
          confidenceScore: 0.7 // Lower confidence since it was AI-generated first
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save as style sample')
      }

      // Could add a success notification here
      setShowFeedback(false)
    } catch (error: any) {
      console.error('Error saving as style:', error)
      setError(error.message)
    }
  }

  const handleFeedback = async (wasAccurate: boolean) => {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        return
      }
      
      const session = await supabase.auth.getSession()
      if (!session.data.session) {
        return
      }

      // Save feedback to help improve the system
      await supabase.from('writing_feedback').insert({
        user_id: userId,
        original_prompt: prompt,
        generated_content: generatedContent,
        final_content: editedContent !== generatedContent ? editedContent : null,
        samples_used: styleSamples.slice(0, 3).map(s => s.id),
        was_style_accurate: wasAccurate,
        created_at: new Date().toISOString()
      })

      setShowFeedback(false)
    } catch (error) {
      console.error('Error saving feedback:', error)
    }
  }

  const assignmentTypes = [
    { value: 'essay', label: 'Essay', icon: '📝' },
    { value: 'case-analysis', label: 'Case Analysis', icon: '⚖️' },
    { value: 'legal-memo', label: 'Legal Memorandum', icon: '📋' },
    { value: 'research-paper', label: 'Research Paper', icon: '🔍' },
    { value: 'problem-question', label: 'Problem Question', icon: '❓' }
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
            <Wand2 className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Assignment Generator</h1>
            <p className="text-sm sm:text-base text-gray-600">Powered by Human-Mode Drafting™</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        {/* Left Column - Input */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Generation Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="w-5 h-5" />
                Assignment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Assignment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Assignment Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {assignmentTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setAssignmentType(type.value)}
                      className={`p-3 min-h-[44px] rounded-lg border text-left transition-colors ${
                        assignmentType === type.value
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-base sm:text-lg mb-1">{type.icon}</div>
                      <div className="text-xs sm:text-sm font-medium">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Word Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Word Count
                </label>
                <select
                  value={wordCount}
                  onChange={(e) => setWordCount(parseInt(e.target.value))}
                  className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                >
                  <option value={500}>500 words</option>
                  <option value={750}>750 words</option>
                  <option value={1000}>1,000 words</option>
                  <option value={1500}>1,500 words</option>
                  <option value={2000}>2,000 words</option>
                  <option value={2500}>2,500 words</option>
                  <option value={3000}>3,000 words</option>
                </select>
              </div>

              {/* Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Prompt
                </label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter your assignment question or prompt here... e.g., 'Analyze the doctrine of consideration in English contract law, discussing its evolution and current application with reference to relevant case law.'"
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Human-Mode Settings */}
              {humanModeEnabled && (
                <Accordion
                  title="Human-Mode Drafting™ Settings"
                  icon={<CheckCircle2 className="w-5 h-5 text-purple-600" />}
                  defaultOpen={false}
                  variant="bordered"
                  className="border-l-purple-500 bg-purple-50/30"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-purple-800 text-sm">Style Samples Available</span>
                    <Badge className="bg-purple-100 text-purple-800 text-xs">
                      {styleSamples.length} samples ready
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-purple-700 mb-2">
                        Style Matching Strength: {Math.round(styleStrength * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.3"
                        max="1.0"
                        step="0.1"
                        value={styleStrength}
                        onChange={(e) => setStyleStrength(parseFloat(e.target.value))}
                        className="w-full accent-purple-600"
                      />
                      <div className="flex justify-between text-xs text-purple-600 mt-1">
                        <span>Subtle</span>
                        <span>Moderate</span>
                        <span>Strong</span>
                      </div>
                    </div>
                    <div className="text-xs text-purple-600 bg-purple-50 p-2 rounded">
                      💡 Higher strength means the AI will more closely match your writing style from uploaded samples.
                    </div>
                  </div>
                </Accordion>
              )}

              {/* Error Display */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs sm:text-sm flex items-start gap-2">
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

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 min-h-[44px] text-sm sm:text-base"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Generating Assignment...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    Generate Assignment
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Output */}
          {(generatedContent || isGenerating) && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Generated Assignment
                  </CardTitle>
                  {generationStats && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      {generationStats.humanModeEnabled && (
                        <Badge className="bg-purple-100 text-purple-800 text-xs">
                          Human-Mode: {generationStats.styleSamplesUsed} samples used
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {generationStats.assignmentType}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    ref={outputRef}
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    rows={20}
                    className="font-mono text-sm leading-relaxed resize-none"
                    placeholder={isGenerating ? "Generating your assignment..." : "Generated content will appear here..."}
                    readOnly={isGenerating}
                  />

                  {generatedContent && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 pt-4 border-t border-gray-200">
                      <div className="text-xs sm:text-sm text-gray-600">
                        {editedContent.split(' ').length} words • 
                        {editedContent !== generatedContent ? ' Edited' : ' Original'}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          onClick={handleCopyToClipboard}
                          variant="outline"
                          size="sm"
                          className="min-h-[36px] text-xs sm:text-sm"
                        >
                          <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          Copy
                        </Button>
                        <Button
                          onClick={handleDownload}
                          variant="outline"
                          size="sm"
                          className="min-h-[36px] text-xs sm:text-sm"
                        >
                          <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          Download
                        </Button>
                        <Button
                          onClick={handleSaveAsStyle}
                          variant="outline"
                          size="sm"
                          className="text-purple-600 border-purple-200 hover:bg-purple-50 min-h-[36px] text-xs sm:text-sm"
                        >
                          Save as My Style
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Feedback Section */}
          {showFeedback && generatedContent && (
            <Accordion
              title="Rate This Generation"
              icon={<Target className="w-5 h-5 text-gray-600" />}
              defaultOpen={true}
              variant="compact"
            >
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-xs sm:text-sm text-gray-600 mb-4">
                  Help us improve by rating how well the AI matched your writing style.
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                  <Button
                    onClick={() => handleFeedback(true)}
                    variant="outline"
                    className="flex items-center justify-center gap-2 text-green-600 border-green-200 hover:bg-green-50 min-h-[44px] text-sm"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Style was accurate
                  </Button>
                  <Button
                    onClick={() => handleFeedback(false)}
                    variant="outline"
                    className="flex items-center justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50 min-h-[44px] text-sm"
                  >
                    <ThumbsDown className="w-4 h-4" />
                    Needs improvement
                  </Button>
                </div>
              </div>
            </Accordion>
          )}
        </div>

        {/* Right Column - Style Memory */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <HumanModeDrafting
            userId={userId}
            onStyleSamplesChange={setStyleSamples}
            isEnabled={humanModeEnabled}
            onToggle={setHumanModeEnabled}
          />
        </div>
      </div>
    </div>
  )
}

export default AssignmentGenerator