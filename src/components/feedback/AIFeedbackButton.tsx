'use client'

import { useState, useContext } from 'react'
import { Shield, Flag, MessageSquare, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/card'
import { AuthContext } from '@/lib/supabase/AuthContext'
import { submitAIFeedback } from '@/lib/supabase/feedback'
import toast from 'react-hot-toast'

interface AIFeedbackButtonProps {
  aiResponse: string
  componentType: 'chat' | 'news_analysis' | 'writing_analysis' | 'wellbeing' | 'other'
  responseId?: string
  module?: string
  className?: string
  compact?: boolean
}

export const AIFeedbackButton: React.FC<AIFeedbackButtonProps> = ({
  aiResponse,
  componentType,
  responseId,
  module,
  className = '',
  compact = false
}) => {
  const { session } = useContext(AuthContext)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [feedbackType, setFeedbackType] = useState<'inaccurate' | 'confusing' | 'helpful' | 'general'>('inaccurate')
  const [comments, setComments] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmitFeedback = async () => {
    if (!session?.user || !comments.trim()) return

    setIsSubmitting(true)
    try {
      const result = await submitAIFeedback({
        userId: session.user.id,
        aiResponse,
        studentComments: comments.trim(),
        feedbackType,
        componentType,
        module,
        responseId
      })

      if (result) {
        toast.success('Thank you for your feedback! This helps us improve our AI responses.')
        setSubmitted(true)
        setShowFeedbackForm(false)
        
        // Reset form after brief delay
        setTimeout(() => {
          setComments('')
          setSubmitted(false)
        }, 3000)
      } else {
        toast.error('Failed to submit feedback. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast.error('Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session?.user) {
    return null // Don't show feedback button for unauthenticated users
  }

  if (submitted) {
    return (
      <div className={`inline-flex items-center gap-2 text-green-600 text-sm ${className}`}>
        <Check className="w-4 h-4" />
        <span>Feedback submitted</span>
      </div>
    )
  }

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <Button
          onClick={() => setShowFeedbackForm(!showFeedbackForm)}
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-orange-600 p-1 h-auto"
          title="Flag inaccurate or confusing content"
        >
          <Shield className="w-4 h-4" />
        </Button>

        {showFeedbackForm && (
          <div className="absolute top-full right-0 mt-2 z-50">
            <Card className="w-80 shadow-lg border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Flag className="w-4 h-4 text-orange-600" />
                    Report Issue
                  </h4>
                  <Button
                    onClick={() => setShowFeedbackForm(false)}
                    variant="ghost"
                    size="sm"
                    className="p-1 h-auto text-gray-400"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Issue Type
                    </label>
                    <select
                      value={feedbackType}
                      onChange={(e) => setFeedbackType(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="inaccurate">Inaccurate Information</option>
                      <option value="confusing">Confusing or Unclear</option>
                      <option value="helpful">Actually Helpful</option>
                      <option value="general">General Feedback</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Details (Required)
                    </label>
                    <textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Please explain what seems incorrect or could be improved..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmitFeedback}
                      disabled={!comments.trim() || isSubmitting}
                      size="sm"
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit'}
                    </Button>
                    <Button
                      onClick={() => setShowFeedbackForm(false)}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }

  // Full feedback form view
  return (
    <div className={className}>
      {!showFeedbackForm ? (
        <Button
          onClick={() => setShowFeedbackForm(true)}
          variant="outline"
          size="sm"
          className="text-orange-600 border-orange-300 hover:bg-orange-50 flex items-center gap-2"
        >
          <Shield className="w-4 h-4" />
          🛡️ Flag Inaccurate / Confusing
        </Button>
      ) : (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-orange-600" />
              <h4 className="font-semibold text-orange-900">Help Us Improve AI Accuracy</h4>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-orange-900 mb-2">
                  What type of issue did you find?
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'inaccurate', label: 'Inaccurate Information', desc: 'The AI response contains factual errors' },
                    { value: 'confusing', label: 'Confusing or Unclear', desc: 'The response is hard to understand' },
                    { value: 'helpful', label: 'Actually Helpful', desc: 'This response was particularly good' },
                    { value: 'general', label: 'General Feedback', desc: 'Other comments or suggestions' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="feedbackType"
                        value={option.value}
                        checked={feedbackType === option.value}
                        onChange={(e) => setFeedbackType(e.target.value as any)}
                        className="mt-1 text-orange-600 focus:ring-orange-500"
                      />
                      <div>
                        <div className="font-medium text-orange-900">{option.label}</div>
                        <div className="text-sm text-orange-700">{option.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-orange-900 mb-2">
                  Please provide specific details *
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="What specifically seems incorrect or could be improved? Your feedback helps us maintain high academic standards."
                  rows={4}
                  className="w-full px-3 py-2 border border-orange-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSubmitFeedback}
                  disabled={!comments.trim() || isSubmitting}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {isSubmitting ? 'Submitting Feedback...' : 'Submit Feedback'}
                </Button>
                <Button
                  onClick={() => setShowFeedbackForm(false)}
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  Cancel
                </Button>
              </div>

              <p className="text-xs text-orange-700">
                Your feedback is reviewed by our academic team and helps improve AI accuracy for all Durham Law students.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}