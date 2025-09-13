'use client'

import React, { useContext, useState, useEffect, ReactNode } from 'react'
import { AuthContext } from '@/lib/supabase/AuthContext'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Lock, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface OnboardingGateProps {
  children: ReactNode
  feature: string
  requiredDocuments?: string[]
  blur?: boolean
  showTooltip?: boolean
  className?: string
}

export const OnboardingGate: React.FC<OnboardingGateProps> = ({
  children,
  feature,
  requiredDocuments = [],
  blur = true,
  showTooltip = true,
  className = ''
}) => {
  const { session } = useContext(AuthContext)
  const [onboardingStatus, setOnboardingStatus] = useState<string | null>(null)
  const [onboardingProgress, setOnboardingProgress] = useState<number>(0)
  const [documentsUploaded, setDocumentsUploaded] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOnboardingStatus = async () => {
      if (session?.user) {
        try {
          const supabase = getSupabaseClient()
          if (!supabase) {
            console.error('Supabase client not available')
            setLoading(false)
            return
          }

          const { data, error } = await supabase
            .from('profiles')
            .select('onboarding_status, onboarding_progress, uploaded_docs')
            .eq('id', session.user.id)
            .single()

          if (!error && data) {
            setOnboardingStatus(data.onboarding_status)
            setOnboardingProgress(data.onboarding_progress || 0)
            setDocumentsUploaded(data.uploaded_docs || [])
          }
        } catch (err) {
          console.error('Error fetching onboarding status:', err)
        }
      }
      setLoading(false)
    }

    fetchOnboardingStatus()
  }, [session])

  const isOnboardingComplete = () => {
    return onboardingStatus === 'complete'
  }

  const hasRequiredDocuments = () => {
    if (requiredDocuments.length === 0) return true
    
    const uploadedDocTypes = documentsUploaded.map(doc => doc.stepId)
    return requiredDocuments.every(docType => uploadedDocTypes.includes(docType))
  }

  const shouldShowGate = () => {
    return !loading && !isOnboardingComplete() && !hasRequiredDocuments()
  }

  const getMotivationalMessage = () => {
    if (requiredDocuments.length > 0) {
      const missingDocs = requiredDocuments.filter(docType => 
        !documentsUploaded.some(doc => doc.stepId === docType)
      )
      
      if (missingDocs.length > 0) {
        return `Upload your ${missingDocs.join(', ')} to unlock ${feature}.`
      }
    }
    
    return `Complete onboarding to unlock ${feature}.`
  }

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-100 rounded-lg ${className}`}>
        {children}
      </div>
    )
  }

  if (!shouldShowGate()) {
    return <div className={className}>{children}</div>
  }

  return (
    <div className={`relative ${className}`}>
      {/* Blurred/Dimmed Content */}
      <div className={`${blur ? 'filter blur-sm' : 'opacity-50'} pointer-events-none`}>
        {children}
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg">
        <div className="text-center p-6 max-w-xs">
          <div className="mb-4">
            <Lock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              🔒 {feature} Locked
            </h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            {getMotivationalMessage()}
          </p>
          
          <Link
            href="/onboarding/OnboardingPage"
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Complete Onboarding
          </Link>
          
          {onboardingProgress > 0 && (
            <div className="mt-3">
              <div className="text-xs text-gray-500 mb-1">
                {onboardingProgress}% Complete
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${onboardingProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-2 right-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
          🚨 Complete onboarding to activate
        </div>
      )}
    </div>
  )
}

export default OnboardingGate