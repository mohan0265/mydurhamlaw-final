'use client'

import React, { useState, useEffect, useContext, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import NextImage from 'next/image'
import { AuthContext } from '@/lib/supabase/AuthContext'
import { getSupabaseClient } from '@/lib/supabase/client'
import ModernSidebar from '@/components/layout/ModernSidebar'
import { getOrigin } from '@/lib/utils/getOrigin'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card'
import { 
  Upload, 
  CheckCircle, 
  Circle, 
  FileText, 
  Calendar, 
  Target, 
  BookOpen, 
  Clock,
  Award,
  ArrowRight,
  MessageSquare,
  Sparkles,
  Heart,
  User,
  Eye,
  Users
} from 'lucide-react'
// import { GoldScaleIcon } from '@/components/ui/GoldScaleIcon' // Removed
import { BrandTitle } from '@/components/ui/BrandTitle'
import toast from 'react-hot-toast'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  required: boolean
  completed: boolean
  fileUrl?: string
}

interface UploadedFile {
  name: string
  type: string
  url: string
  uploadedAt: string
}

const OnboardingPage = () => {
  const router = useRouter()
  const { session, userProfile } = useContext(AuthContext)
  const user = session?.user
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  const [currentStep, setCurrentStep] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [onboardingStatus, setOnboardingStatus] = useState<'incomplete' | 'partial' | 'complete'>('incomplete')
  const [academicGoal, setAcademicGoal] = useState('')
  const [uploadedDocs, setUploadedDocs] = useState<{ [key: string]: UploadedFile }>({})
  const [showDurmahTip, setShowDurmahTip] = useState(false)
  
  // Always With You settings
  const [showAlwaysWithYou, setShowAlwaysWithYou] = useState(false)
  const [alwaysWithYouSettings, setAlwaysWithYouSettings] = useState({
    parent1_email: '',
    parent1_relationship: '',
    parent1_display_name: '',
    parent2_email: '',
    parent2_relationship: '',
    parent2_display_name: '',
    sharing_settings: {
      show_live_status_to_parents: true,
      share_today_calendar: true,
      share_custom_notes: true,
      do_not_disturb: false,
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00'
    }
  })

  const academicGoals = [
    { value: 'pass', label: 'Pass (40%+)', description: 'Complete the degree successfully' },
    { value: '2-2', label: '2:2 (50-59%)', description: 'Lower second-class honours' },
    { value: '2-1', label: '2:1 (60-69%)', description: 'Upper second-class honours' },
    { value: 'first', label: 'First Class (70%+)', description: 'Highest undergraduate classification' }
  ]

  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'syllabus',
      title: 'Course Syllabus',
      description: 'Upload your course syllabus to unlock personalized study recommendations and topic analysis',
      icon: FileText,
      required: true,
      completed: false
    },
    {
      id: 'timetable',
      title: 'Weekly Timetable',
      description: 'Upload your class schedule to enable smart reminders and calendar syncing',
      icon: Calendar,
      required: true,
      completed: false
    },
    {
      id: 'assignments',
      title: 'Assignment Deadlines',
      description: 'Add assignment info to get deadline tracking and progress monitoring',
      icon: Target,
      required: true,
      completed: false
    },
    {
      id: 'exams',
      title: 'Exam Timetable',
      description: 'Upload exam schedule to create optimal study plans and revision reminders',
      icon: Clock,
      required: true,
      completed: false
    },
    {
      id: 'reading-list',
      title: 'Reading List',
      description: 'Upload reading list to get book recommendations and reading progress tracking (Optional)',
      icon: BookOpen,
      required: false,
      completed: false
    }
  ])

  const redirectToDashboard = useCallback(() => {
    const userType = userProfile?.user_type || userProfile?.year_group || user?.user_metadata?.year_group || 'year1'
    const dashboardPath = `/dashboard/${userType}`
    router.push(dashboardPath)
  }, [userProfile, user, router])

  const loadOnboardingData = useCallback(async () => {
    if (!user) return

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        console.error('Supabase client not available');
        return;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_status, uploaded_docs, academic_goal')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error loading onboarding data:', error)
        return
      }

      if (data) {
        setOnboardingStatus(data.onboarding_status || 'incomplete')
        setAcademicGoal(data.academic_goal || '')
        
        if (data.uploaded_docs) {
          const docs: { [key: string]: UploadedFile } = {}
          data.uploaded_docs.forEach((doc: any) => {
            docs[doc.stepId] = doc
          })
          setUploadedDocs(docs)
          
          // Update step completion status
          setSteps(prevSteps => 
            prevSteps.map(step => ({
              ...step,
              completed: !!docs[step.id]
            }))
          )
        }

        // If already complete, redirect to dashboard
        if (data.onboarding_status === 'complete') {
          toast.success('Welcome back! You\'ve already completed onboarding.')
          redirectToDashboard()
        }
      }
    } catch (error) {
      console.error('Error loading onboarding data:', error)
    }
  }, [user, redirectToDashboard])

  // Authentication check
  useEffect(() => {
    if (!user) {
      toast.error('Please log in to access onboarding')
      router.push('/login')
      return
    }

    // Load existing onboarding data
    loadOnboardingData()
  }, [user, router, loadOnboardingData])

  const handleFileUpload = async (stepId: string, file: File) => {
    if (!user) return

    setIsUploading(true)
    
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${stepId}-${Date.now()}.${fileExt}`
      const filePath = `onboarding-uploads/${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      const uploadedFile: UploadedFile = {
        name: file.name,
        type: file.type,
        url: publicUrl,
        uploadedAt: new Date().toISOString()
      }

      // Update local state
      setUploadedDocs(prev => ({
        ...prev,
        [stepId]: uploadedFile
      }))

      // Update step completion
      setSteps(prevSteps => 
        prevSteps.map(step => 
          step.id === stepId 
            ? { ...step, completed: true }
            : step
        )
      )

      // Save to database
      await updateOnboardingProgress(stepId, uploadedFile)

      toast.success(`${file.name} uploaded successfully!`)
      
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(`Upload failed: ${error.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  const updateOnboardingProgress = async (stepId: string, uploadedFile: UploadedFile) => {
    if (!user) return

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        console.error('Supabase client not available');
        return;
      }

      // Get current uploaded docs
      const currentDocs = Object.values(uploadedDocs)
      const newDocs = [...currentDocs, { ...uploadedFile, stepId }]

      // Calculate progress percentage
      const completedRequired = steps.filter(step => step.required && (step.completed || step.id === stepId)).length
      const totalRequired = steps.filter(step => step.required).length
      const completedOptional = steps.filter(step => !step.required && (step.completed || step.id === stepId)).length
      const totalOptional = steps.filter(step => !step.required).length
      
      // Progress: 70% for required steps, 30% for optional steps
      const requiredProgress = (completedRequired / totalRequired) * 70
      const optionalProgress = totalOptional > 0 ? (completedOptional / totalOptional) * 30 : 0
      const overallProgress = Math.round(requiredProgress + optionalProgress)
      
      const newStatus = completedRequired === totalRequired ? 'complete' : 'partial'

      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_status: newStatus,
          onboarding_progress: overallProgress,
          uploaded_docs: newDocs,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      setOnboardingStatus(newStatus)
      
    } catch (error) {
      console.error('Error updating onboarding progress:', error)
    }
  }

  const completeOnboarding = useCallback(async () => {
    if (!user) return

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        console.error('Supabase client not available');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_status: 'complete',
          onboarding_progress: 100,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      setOnboardingStatus('complete')
      toast.success('🎉 Onboarding completed successfully!')
      
      // Redirect after a short delay
      setTimeout(() => {
        redirectToDashboard()
      }, 2000)
      
    } catch (error: any) {
      console.error('Error completing onboarding:', error)
      toast.error(`Failed to complete onboarding: ${error.message}`)
    }
  }, [user, redirectToDashboard])

  const handleAlwaysWithYouSkip = () => {
    setShowAlwaysWithYou(false)
    completeOnboarding()
  }

  const handleAlwaysWithYouSave = async () => {
    if (!user) return

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        console.error('Supabase client not available');
        return;
      }

      // Save Always With You settings if any loved ones are configured
      const hasLovedOnes = alwaysWithYouSettings.parent1_email || alwaysWithYouSettings.parent2_email

      if (hasLovedOnes) {
        const { error } = await supabase
          .from('profiles')
          .update({
            parent1_email: alwaysWithYouSettings.parent1_email || null,
            parent1_relationship: alwaysWithYouSettings.parent1_relationship || null,
            parent1_display_name: alwaysWithYouSettings.parent1_display_name || null,
            parent2_email: alwaysWithYouSettings.parent2_email || null,
            parent2_relationship: alwaysWithYouSettings.parent2_relationship || null,
            parent2_display_name: alwaysWithYouSettings.parent2_display_name || null,
            sharing_settings: alwaysWithYouSettings.sharing_settings,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        if (error) throw error
        
        toast.success('💕 Always With You settings saved!')
      }

      completeOnboarding()
      
    } catch (error: any) {
      console.error('Error saving Always With You settings:', error)
      toast.error(`Failed to save settings: ${error.message}`)
    }
  }

  const handleAcademicGoalSubmit = async () => {
    if (!user || !academicGoal) {
      toast.error('Please select an academic goal')
      return
    }

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        console.error('Supabase client not available');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          academic_goal: academicGoal,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      // Complete onboarding directly - Always With You is optional
      completeOnboarding()
      
    } catch (error: any) {
      console.error('Error saving academic goal:', error)
      toast.error(`Failed to save academic goal: ${error.message}`)
    }
  }

  const getProgressPercentage = () => {
    const completedSteps = steps.filter(step => step.completed).length
    const totalSteps = steps.length + 1 // +1 for academic goals
    return Math.round((completedSteps / totalSteps) * 100)
  }

  const getCompletedRequiredSteps = () => {
    return steps.filter(step => step.required && step.completed).length
  }

  const getTotalRequiredSteps = () => {
    return steps.filter(step => step.required).length
  }

  const canProceedToGoals = () => {
    return getCompletedRequiredSteps() === getTotalRequiredSteps()
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-500"></div>
    </div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <ModernSidebar />
      
      <div className="lg:ml-64">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Welcome Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <NextImage
                  src="/brand/logo-icon.svg"
                  alt="MyDurhamLaw Logo"
                  width={80}
                  height={80}
                  className="animate-pulse object-contain"
                />
                <div className="absolute -inset-2 bg-gradient-to-r from-amber-400/20 to-yellow-500/20 rounded-full opacity-30 blur animate-pulse"></div>
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to <BrandTitle variant="light" size="4xl" as="span" />!
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
              🚀 <strong>Complete onboarding now to unlock smart reminders, personalized AI study tips, and full calendar syncing.</strong>
            </p>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Let&apos;s set up your personalized AI-powered law study companion to help you excel in your Durham Law journey.
            </p>
          </div>

          {/* Progress Tracker */}
          <Card className="mb-8 bg-gradient-to-r from-teal-50 to-blue-50 border-teal-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Onboarding Progress</h3>
                <span className="text-2xl font-bold text-teal-600">{getProgressPercentage()}%</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className="bg-gradient-to-r from-teal-500 to-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
              
              <p className="text-sm text-gray-600">
                {getCompletedRequiredSteps()} of {getTotalRequiredSteps()} required steps completed
              </p>
            </CardContent>
          </Card>

          {/* Upload Steps */}
          <div className="space-y-6 mb-8">
            {steps.map((step, index) => {
              const IconComponent = step.icon
              const isCompleted = step.completed
              const uploadedFile = uploadedDocs[step.id]

              return (
                <Card key={step.id} className={`transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-green-50 border-green-200 shadow-md' 
                    : 'bg-white border-gray-200 hover:shadow-lg'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      
                      {/* Step Icon */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                        isCompleted 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-teal-100 text-teal-600'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <IconComponent className="w-6 h-6" />
                        )}
                      </div>

                      {/* Step Content */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className={`text-lg font-semibold ${
                            isCompleted ? 'text-green-800' : 'text-gray-800'
                          }`}>
                            {step.title}
                            {step.required && <span className="text-red-500 ml-1">*</span>}
                          </h3>
                          
                          {isCompleted && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Completed
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-4">{step.description}</p>

                        {/* Upload Area */}
                        {!isCompleted ? (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-400 transition-colors">
                            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <div className="space-y-2">
                              <p className="text-sm text-gray-600">
                                Drag and drop your file here, or{' '}
                                <button
                                  onClick={() => fileInputRefs.current[step.id]?.click()}
                                  className="text-teal-600 hover:text-teal-700 font-medium"
                                  disabled={isUploading}
                                >
                                  browse
                                </button>
                              </p>
                              <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
                            </div>
                            
                            <input
                              ref={(el) => {
                                fileInputRefs.current[step.id] = el
                              }}
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  handleFileUpload(step.id, file)
                                }
                              }}
                              className="hidden"
                              disabled={isUploading}
                            />
                          </div>
                        ) : (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center space-x-3">
                              <FileText className="w-5 h-5 text-green-600" />
                              <div>
                                <p className="font-medium text-green-800">{uploadedFile?.name}</p>
                                <p className="text-sm text-green-600">
                                  Uploaded {new Date(uploadedFile?.uploadedAt || '').toLocaleDateString('en-GB', { timeZone: 'Europe/London' })}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Academic Goals Section */}
          {canProceedToGoals() && (
            <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3 text-blue-800">
                  <Award className="w-6 h-6" />
                  <span>Set Your Academic Goals</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-6">
                  What&apos;s your personal academic goal this year? This helps us personalize your study experience.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {academicGoals.map((goal) => (
                    <button
                      key={goal.value}
                      onClick={() => setAcademicGoal(goal.value)}
                      className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                        academicGoal === goal.value
                          ? 'border-teal-500 bg-teal-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-teal-300 hover:shadow-sm'
                      }`}
                    >
                      <h4 className={`font-semibold mb-1 ${
                        academicGoal === goal.value ? 'text-teal-800' : 'text-gray-800'
                      }`}>
                        {goal.label}
                      </h4>
                      <p className={`text-sm ${
                        academicGoal === goal.value ? 'text-teal-600' : 'text-gray-600'
                      }`}>
                        {goal.description}
                      </p>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleAcademicGoalSubmit}
                  disabled={!academicGoal}
                  className="w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-teal-600 hover:to-blue-600 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <span>Complete Onboarding</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </CardContent>
            </Card>
          )}

          {/* Always With You Setup */}
          {showAlwaysWithYou && (
            <Card className="mb-8 bg-gradient-to-r from-pink-50 to-red-50 border-pink-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3 text-pink-800">
                  <Heart className="w-6 h-6" />
                  <span>Always With You</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <p className="text-gray-700 mb-4">
                    💕 <strong>Stay connected with your loved ones during your law school journey.</strong> Set up secure access for up to 2 family members or close friends.
                  </p>
                  <div className="bg-pink-100 border border-pink-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <Heart className="w-5 h-5 text-pink-600 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-medium text-pink-800">Privacy First</h3>
                        <p className="text-sm text-pink-700 mt-1">
                          You have complete control over what information is shared. Your loved ones can only see what you explicitly choose to share. You can change these settings anytime.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Loved One 1 */}
                <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200 mb-4">
                  <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Loved One 1</span>
                  </h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={alwaysWithYouSettings.parent1_email}
                        onChange={(e) => setAlwaysWithYouSettings(prev => ({
                          ...prev,
                          parent1_email: e.target.value
                        }))}
                        placeholder="mum@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Relationship
                      </label>
                      <input
                        type="text"
                        value={alwaysWithYouSettings.parent1_relationship}
                        onChange={(e) => setAlwaysWithYouSettings(prev => ({
                          ...prev,
                          parent1_relationship: e.target.value
                        }))}
                        placeholder="Mum, Dad, Guardian..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={alwaysWithYouSettings.parent1_display_name}
                        onChange={(e) => setAlwaysWithYouSettings(prev => ({
                          ...prev,
                          parent1_display_name: e.target.value
                        }))}
                        placeholder="How they'll appear"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Loved One 2 */}
                <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200 mb-6">
                  <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Loved One 2 (Optional)</span>
                  </h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={alwaysWithYouSettings.parent2_email}
                        onChange={(e) => setAlwaysWithYouSettings(prev => ({
                          ...prev,
                          parent2_email: e.target.value
                        }))}
                        placeholder="dad@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Relationship
                      </label>
                      <input
                        type="text"
                        value={alwaysWithYouSettings.parent2_relationship}
                        onChange={(e) => setAlwaysWithYouSettings(prev => ({
                          ...prev,
                          parent2_relationship: e.target.value
                        }))}
                        placeholder="Dad, Partner, Friend..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={alwaysWithYouSettings.parent2_display_name}
                        onChange={(e) => setAlwaysWithYouSettings(prev => ({
                          ...prev,
                          parent2_display_name: e.target.value
                        }))}
                        placeholder="How they'll appear"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Sharing Settings */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-blue-800 mb-3 flex items-center space-x-2">
                    <Eye className="w-4 h-4" />
                    <span>Default Sharing Settings</span>
                  </h4>
                  <div className="space-y-2 text-sm text-blue-700">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="live-status"
                        checked={alwaysWithYouSettings.sharing_settings.show_live_status_to_parents}
                        onChange={(e) => setAlwaysWithYouSettings(prev => ({
                          ...prev,
                          sharing_settings: {
                            ...prev.sharing_settings,
                            show_live_status_to_parents: e.target.checked
                          }
                        }))}
                        className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                      />
                      <label htmlFor="live-status">Show when I&apos;m online and current activity</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="calendar"
                        checked={alwaysWithYouSettings.sharing_settings.share_today_calendar}
                        onChange={(e) => setAlwaysWithYouSettings(prev => ({
                          ...prev,
                          sharing_settings: {
                            ...prev.sharing_settings,
                            share_today_calendar: e.target.checked
                          }
                        }))}
                        className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                      />
                      <label htmlFor="calendar">Share my daily schedule (lectures, seminars)</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="notes"
                        checked={alwaysWithYouSettings.sharing_settings.share_custom_notes}
                        onChange={(e) => setAlwaysWithYouSettings(prev => ({
                          ...prev,
                          sharing_settings: {
                            ...prev.sharing_settings,
                            share_custom_notes: e.target.checked
                          }
                        }))}
                        className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                      />
                      <label htmlFor="notes">Share personal updates and study notes</label>
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 mt-3">
                    💡 You can change these settings anytime in your profile settings.
                  </p>
                </div>

                {/* Access Instructions */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-800 mb-3">How Your Loved Ones Will Access</h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 bg-pink-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</div>
                      <p>They visit <code className="bg-gray-200 px-2 py-1 rounded text-xs">{getOrigin().replace(/^https?:\/\//, '')}/loved-one-login</code></p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 bg-pink-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</div>
                      <p>Enter the email address you provided above</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 bg-pink-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</div>
                      <p>Access your dashboard and video call you when you&apos;re available</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAlwaysWithYouSave}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-pink-600 hover:to-red-600 transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <Heart className="w-5 h-5" />
                    <span>Set Up Always With You</span>
                  </button>
                  <button
                    onClick={handleAlwaysWithYouSkip}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <span>Skip for Now</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center mt-3">
                  You can always set this up later in your profile settings.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Privacy & Security Notice */}
          <Card className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 font-bold text-sm">🔒</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-800 mb-1">Privacy-First Onboarding</h3>
                  <p className="text-sm text-green-700">
                    <strong>Student-led & secure:</strong> Upload your own documents manually. We never ask for Durham login credentials or auto-scrape course portals. Your data stays private and under your control.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Durmah AI Tip */}
          {!showDurmahTip && getProgressPercentage() < 50 && (
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-purple-800 mb-2 flex items-center space-x-2">
                      <Sparkles className="w-4 h-4" />
                      <span>Durmah AI Assistant</span>
                    </h3>
                    <p className="text-purple-700 mb-3">
                      🧠 <strong>The more we know about your modules and schedule, the better we can help you study smarter, not harder.</strong> Need help finding your syllabus or organizing your documents?
                    </p>
                    <button
                      onClick={() => router.push('/wellbeing')}
                      className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                    >
                      Chat with Durmah →
                    </button>
                  </div>
                  <button
                    onClick={() => setShowDurmahTip(true)}
                    className="text-purple-400 hover:text-purple-600"
                  >
                    ×
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completion Badge */}
          {onboardingStatus === 'complete' && (
            <Card className="text-center bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardContent className="py-8">
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                    <Award className="w-10 h-10 text-green-600" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-green-800 mb-4">
                  🎉 You&apos;re Fully Onboarded!
                </h2>
                <p className="text-green-700 mb-6 max-w-md mx-auto">
                  Welcome to MyDurhamLaw! Your personalized AI study companion is ready to help you succeed.
                </p>
                <button
                  onClick={redirectToDashboard}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-8 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 flex items-center space-x-2 mx-auto"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </CardContent>
            </Card>
          )}

          {/* Loading Overlay */}
          {isUploading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                <span className="text-gray-700">Uploading file...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OnboardingPage
