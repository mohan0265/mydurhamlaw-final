'use client'

import React, { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardContent, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { AlertTriangle, CheckCircle, Activity } from 'lucide-react'

interface TriageQuestion {
  id: string
  question: string
  options: Array<{
    value: string
    label: string
    riskScore: number
  }>
}

const triageQuestions: TriageQuestion[] = [
  {
    id: 'symptoms',
    question: 'Which symptoms are you experiencing?',
    options: [
      { value: 'none', label: 'No symptoms', riskScore: 0 },
      { value: 'mild_discomfort', label: 'Mild abdominal discomfort', riskScore: 2 },
      { value: 'persistent_pain', label: 'Persistent abdominal pain', riskScore: 5 },
      { value: 'severe_pain', label: 'Severe pain with bleeding', riskScore: 10 }
    ]
  },
  {
    id: 'duration',
    question: 'How long have you experienced these symptoms?',
    options: [
      { value: 'recent', label: 'Less than 1 week', riskScore: 1 },
      { value: 'short_term', label: '1-4 weeks', riskScore: 3 },
      { value: 'ongoing', label: '1-3 months', riskScore: 6 },
      { value: 'chronic', label: 'More than 3 months', riskScore: 8 }
    ]
  },
  {
    id: 'family_history',
    question: 'Do you have a family history of colorectal cancer?',
    options: [
      { value: 'no', label: 'No family history', riskScore: 0 },
      { value: 'distant', label: 'Distant relative had colorectal cancer', riskScore: 2 },
      { value: 'close', label: 'Parent or sibling had colorectal cancer', riskScore: 5 },
      { value: 'multiple', label: 'Multiple family members affected', riskScore: 8 }
    ]
  },
  {
    id: 'age',
    question: 'What is your age group?',
    options: [
      { value: 'under_30', label: 'Under 30', riskScore: 0 },
      { value: '30_45', label: '30-45', riskScore: 2 },
      { value: '45_60', label: '45-60', riskScore: 4 },
      { value: 'over_60', label: 'Over 60', riskScore: 6 }
    ]
  }
]

interface TriageAssessmentProps {
  className?: string
  onComplete?: (result: any) => void
}

const TriageAssessment: React.FC<TriageAssessmentProps> = ({ 
  className = '',
  onComplete
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [result, setResult] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAnswer = (questionId: string, answer: any) => {
    setResponses(prev => ({ ...prev, [questionId]: answer }))
  }

  const calculateRisk = (allResponses: Record<string, any>) => {
    let totalScore = 0
    const selectedResponses = []

    for (const question of triageQuestions) {
      const response = allResponses[question.id]
      if (response) {
        totalScore += response.riskScore
        selectedResponses.push({
          question: question.question,
          answer: response.label,
          riskScore: response.riskScore
        })
      }
    }

    let riskLevel: 'low' | 'moderate' | 'high'
    if (totalScore <= 5) {
      riskLevel = 'low'
    } else if (totalScore <= 15) {
      riskLevel = 'moderate'
    } else {
      riskLevel = 'high'
    }

    return {
      totalScore,
      riskLevel,
      responses: selectedResponses,
      recommendations: getRecommendations(riskLevel)
    }
  }

  const getRecommendations = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return [
          'Consult with a healthcare provider immediately',
          'Consider urgent screening or diagnostic tests',
          'Monitor symptoms closely and seek immediate care if they worsen'
        ]
      case 'moderate':
        return [
          'Schedule an appointment with your doctor within 2-4 weeks',
          'Keep a symptom diary',
          'Consider lifestyle modifications and screening options'
        ]
      case 'low':
        return [
          'Maintain regular health checkups',
          'Follow general screening guidelines for your age',
          'Focus on healthy lifestyle choices'
        ]
      default:
        return []
    }
  }

  const handleNext = () => {
    if (currentQuestion < triageQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = async () => {
    setIsSubmitting(true)
    const assessmentResult = calculateRisk(responses)
    
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        console.warn('Supabase client not available - assessment completed without saving');
        setResult(assessmentResult);
        onComplete?.(assessmentResult);
        return;
      }

      // Save to database
      const { error } = await supabase
        .from('triage_results')
        .insert([{
          risk_level: assessmentResult.riskLevel,
          responses: {
            answers: assessmentResult.responses,
            totalScore: assessmentResult.totalScore,
            recommendations: assessmentResult.recommendations
          }
        }])

      if (error) {
        console.error('Error saving triage result:', error)
      }

      setResult(assessmentResult)
      onComplete?.(assessmentResult)
    } catch (error) {
      console.error('Error completing triage assessment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (result) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {result.riskLevel === 'high' ? (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            ) : result.riskLevel === 'moderate' ? (
              <Activity className="w-5 h-5 text-yellow-500" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            Assessment Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`p-4 rounded-lg border ${getRiskColor(result.riskLevel)}`}>
            <h3 className="font-semibold text-lg mb-2">
              Risk Level: {result.riskLevel.charAt(0).toUpperCase() + result.riskLevel.slice(1)}
            </h3>
            <p className="text-sm">
              Based on your responses, your risk assessment score is {result.totalScore}/32.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Recommendations:</h4>
            <ul className="space-y-2">
              {result.recommendations.map((rec: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-xs flex items-center justify-center mt-0.5 flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              <strong>Important:</strong> This assessment is for informational purposes only and does not replace professional medical advice. Please consult with a healthcare provider for proper diagnosis and treatment.
            </p>
          </div>

          <Button 
            onClick={() => {
              setCurrentQuestion(0)
              setResponses({})
              setResult(null)
            }}
            variant="secondary"
            className="w-full min-h-[44px]"
          >
            Take Assessment Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  const currentQ = triageQuestions[currentQuestion]
  const progress = ((currentQuestion + 1) / triageQuestions.length) * 100

  // Safety check for currentQ
  if (!currentQ) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Assessment Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Invalid question state. Please refresh and try again.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Health Triage Assessment
        </CardTitle>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-600">
          Question {currentQuestion + 1} of {triageQuestions.length}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">{currentQ.question}</h3>
          <div className="space-y-3">
            {currentQ.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(currentQ.id, option)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors min-h-[56px] ${
                  responses[currentQ.id]?.value === option.value
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    responses[currentQ.id]?.value === option.value
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {responses[currentQ.id]?.value === option.value && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                  <span>{option.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          {currentQuestion > 0 && (
            <Button
              onClick={() => setCurrentQuestion(currentQuestion - 1)}
              variant="secondary"
              className="flex-1 min-h-[44px]"
            >
              Previous
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!responses[currentQ.id] || isSubmitting}
            className="flex-1 min-h-[44px]"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : currentQuestion === triageQuestions.length - 1 ? (
              'Complete Assessment'
            ) : (
              'Next Question'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default TriageAssessment