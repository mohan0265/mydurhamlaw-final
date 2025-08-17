'use client'

import { useState, useCallback, useEffect } from 'react'
import { Brain, BookOpen, MessageSquare, AlertTriangle, Tag, Sparkles } from 'lucide-react'
import { AIDisclaimer } from '@/components/ethics/AIDisclaimer'
import { AIFeedbackButton } from '@/components/feedback/AIFeedbackButton'
import { Accordion } from '@/components/ui/Accordion'

interface NewsArticle {
  id: string
  title: string
  summary: string
  url: string
  publishedAt: string
  source: string
  content?: string
}

interface SmartAnalysis {
  claudeSummary: string
  relevantModules: string[]
  discussionPrompts: string[]
  alertTags: string[]
  studyRelevance: 'high' | 'medium' | 'low'
  essayAngles: string[]
}

interface SmartNewsAgentProps {
  article: NewsArticle
  onAnalysisComplete?: (analysis: SmartAnalysis) => void
  className?: string
  autoAnalyze?: boolean
}

export const SmartNewsAgent: React.FC<SmartNewsAgentProps> = ({ 
  article, 
  onAnalysisComplete,
  className = '',
  autoAnalyze = true
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<SmartAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)

  const analyzeArticle = useCallback(async () => {
    if (!article.title || isAnalyzing) return

    setIsAnalyzing(true)
    setError(null)

    try {
      console.log('🧠 SmartNewsAgent analyzing:', article.title)
      
      // Call our AI analysis endpoint
      const response = await fetch('/api/news/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: article.title,
          summary: article.summary,
          content: article.content || article.summary,
          source: article.source,
          url: article.url
        }),
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`)
      }

      const result = await response.json()
      
      const smartAnalysis: SmartAnalysis = {
        claudeSummary: result.summary || 'Unable to generate summary',
        relevantModules: result.modules || [],
        discussionPrompts: result.discussionPrompts || [],
        alertTags: result.alertTags || [],
        studyRelevance: result.relevance || 'medium',
        essayAngles: result.essayAngles || []
      }

      setAnalysis(smartAnalysis)
      onAnalysisComplete?.(smartAnalysis)

    } catch (error: any) {
      console.error('❌ SmartNewsAgent analysis error:', error)
      setError(error.message || 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }, [article, isAnalyzing, onAnalysisComplete])

  // Auto-trigger analysis when article changes (if enabled)
  useEffect(() => {
    if (autoAnalyze && article && !analysis && !isAnalyzing && !error) {
      console.log('🤖 Auto-triggering AI analysis for:', article.title)
      analyzeArticle()
    }
  }, [article, autoAnalyze, analysis, isAnalyzing, error, analyzeArticle])

  const getRelevanceColor = (relevance: string) => {
    switch (relevance) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  const getAlertTagColor = (tag: string) => {
    const tagColors: Record<string, string> = {
      'Human Rights': 'bg-red-100 text-red-800',
      'Constitutional': 'bg-blue-100 text-blue-800',
      'Criminal Law': 'bg-purple-100 text-purple-800',
      'Civil Rights': 'bg-green-100 text-green-800',
      'Judicial Reform': 'bg-indigo-100 text-indigo-800',
      'Brexit Impact': 'bg-orange-100 text-orange-800',
      'Legal Tech': 'bg-cyan-100 text-cyan-800',
      'Data Protection': 'bg-pink-100 text-pink-800'
    }
    return tagColors[tag] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${className}`}>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 sm:w-10 h-8 sm:h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Brain className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm sm:text-base">AI Legal Analysis</h3>
              <p className="text-purple-100 text-xs sm:text-sm">Powered by GPT-4o – summarising legal news for student learning</p>
            </div>
          </div>
          {!autoAnalyze && !analysis && !isAnalyzing && (
            <button
              onClick={analyzeArticle}
              className="w-full sm:w-auto px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors min-h-[44px] flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Analyze</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        
        {/* Loading State */}
        {isAnalyzing && (
          <div className="text-center py-6 sm:py-8">
            <div className="w-6 sm:w-8 h-6 sm:h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">Analyzing legal significance...</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Claude is examining connections to law modules</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
            <p className="text-red-800 font-medium text-sm sm:text-base">Analysis Failed</p>
            <p className="text-red-600 text-xs sm:text-sm mt-1">{error}</p>
            <button
              onClick={analyzeArticle}
              className="mt-3 w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors min-h-[44px] text-sm sm:text-base"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-4 sm:space-y-6">
            
            {/* AI Disclaimer */}
            <AIDisclaimer 
              variant="card" 
              customMessage="This AI analysis provides academic guidance for law students. Always verify information with official sources and course materials."
            />
            
            {/* Study Relevance */}
            <div className={`p-3 rounded-lg border ${getRelevanceColor(analysis.studyRelevance)}`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium text-sm sm:text-base">Study Relevance: {analysis.studyRelevance.toUpperCase()}</span>
              </div>
            </div>

            {/* Claude Summary */}
            <Accordion
              title="Intelligent Summary"
              icon={<BookOpen className="w-4 sm:w-5 h-4 sm:h-5 text-purple-600" />}
              defaultOpen={true}
              variant="bordered"
              className="border-l-purple-500"
            >
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4">
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{analysis.claudeSummary}</p>
              </div>
            </Accordion>

            {/* Relevant Modules */}
            {analysis.relevantModules.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-800 text-sm sm:text-base">Relevant Law Modules</h4>
                </div>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {analysis.relevantModules.map((module, index) => (
                    <span
                      key={index}
                      className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium"
                    >
                      {module}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Alert Tags */}
            {analysis.alertTags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 sm:w-5 h-4 sm:h-5 text-orange-600" />
                  <h4 className="font-semibold text-gray-800 text-sm sm:text-base">Legal Alert Tags</h4>
                </div>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {analysis.alertTags.map((tag, index) => (
                    <span
                      key={index}
                      className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getAlertTagColor(tag)}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Discussion Prompts */}
            {analysis.discussionPrompts.length > 0 && (
              <Accordion
                title={`Discussion Questions (${analysis.discussionPrompts.length})`}
                icon={<MessageSquare className="w-4 sm:w-5 h-4 sm:h-5 text-green-600" />}
                defaultOpen={false}
                variant="default"
              >
                <div className="space-y-2">
                  {analysis.discussionPrompts.map((prompt, index) => (
                    <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-green-800 text-xs sm:text-sm">{prompt}</p>
                    </div>
                  ))}
                </div>
              </Accordion>
            )}

            {/* Essay Angles */}
            {analysis.essayAngles.length > 0 && (
              <Accordion
                title={`Essay & Research Angles (${analysis.essayAngles.length})`}
                icon={<BookOpen className="w-4 sm:w-5 h-4 sm:h-5 text-indigo-600" />}
                defaultOpen={false}
                variant="default"
              >
                <div className="space-y-2">
                  {analysis.essayAngles.map((angle, index) => (
                    <div key={index} className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                      <p className="text-indigo-800 text-xs sm:text-sm">{angle}</p>
                    </div>
                  ))}
                </div>
              </Accordion>
            )}

            {/* Feedback Button */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <p className="text-xs sm:text-sm text-gray-600">
                  Found an issue with this AI analysis?
                </p>
                <AIFeedbackButton
                  aiResponse={JSON.stringify(analysis, null, 2)}
                  componentType="news_analysis"
                  responseId={article.id}
                  module="Legal News Analysis"
                  compact={true}
                />
              </div>
            </div>

          </div>
        )}

        {/* Call to Action */}
        {!analysis && !isAnalyzing && !error && (
          <div className="text-center py-6 sm:py-8">
            <Brain className="w-10 sm:w-12 h-10 sm:h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4 text-sm sm:text-base">Click &quot;Analyze&quot; to get AI-powered insights</p>
            <p className="text-xs sm:text-sm text-gray-500">
              Our intelligent agent will identify relevant law modules, generate discussion questions, and suggest essay angles
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

export default SmartNewsAgent