'use client'

import { AlertTriangle, BookOpen, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface AIDisclaimerProps {
  variant?: 'inline' | 'card' | 'banner'
  showFeedbackNote?: boolean
  customMessage?: string
  className?: string
}

export const AIDisclaimer: React.FC<AIDisclaimerProps> = ({
  variant = 'inline',
  showFeedbackNote = true,
  customMessage,
  className = ''
}) => {
  const defaultMessage = "This response is AI-generated for academic guidance only. Always consult official course materials or your lecturer."
  const message = customMessage || defaultMessage

  if (variant === 'banner') {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium text-blue-900 mb-1">Academic AI Assistant</div>
            <p className="text-blue-800 text-sm leading-relaxed">
              {message}
              {showFeedbackNote && (
                <span className="block mt-2">
                  Found something inaccurate? Use the 🛡️ feedback button to help us improve.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <BookOpen className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-gray-700 text-sm">
              <strong>Academic Guidance:</strong> {message}
            </p>
            {showFeedbackNote && (
              <p className="text-gray-600 text-xs mt-2">
                Help us improve accuracy by flagging any issues with the 🛡️ feedback button.
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Inline variant (default)
  return (
    <div className={`flex items-start gap-2 text-sm text-gray-600 bg-gray-50 rounded p-3 border-l-4 border-blue-400 ${className}`}>
      <AlertTriangle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
      <div>
        <p>
          <strong className="text-blue-700">AI Guidance:</strong> {message}
        </p>
        {showFeedbackNote && (
          <p className="text-gray-500 text-xs mt-1">
            Report inaccuracies using the 🛡️ feedback option to help maintain academic standards.
          </p>
        )}
      </div>
    </div>
  )
}

export const UniversityDisclaimer: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-orange-50 border border-orange-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <ExternalLink className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-orange-800 text-sm">
            <strong>Important:</strong> MyDurhamLaw is not affiliated with Durham University. 
            This platform provides AI-powered academic assistance for educational enrichment only.
          </p>
          <p className="text-orange-700 text-xs mt-2">
            <Link href="/ethics" className="underline hover:text-orange-900">
              Read our Ethics & Academic Integrity guidelines
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default AIDisclaimer