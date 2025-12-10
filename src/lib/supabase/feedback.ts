import { getSupabaseClient } from './client'

const supabase = getSupabaseClient()

export interface AIFeedback {
  id: string
  user_id: string
  module?: string
  timestamp: string
  ai_response: string
  student_comments: string
  feedback_type: 'inaccurate' | 'confusing' | 'helpful' | 'general'
  component_type: 'chat' | 'news_analysis' | 'writing_analysis' | 'wellbeing' | 'other'
  response_id?: string
  status: 'pending' | 'reviewed' | 'addressed'
  created_at: string
}

export interface SubmitFeedbackParams {
  userId: string
  aiResponse: string
  studentComments: string
  feedbackType: 'inaccurate' | 'confusing' | 'helpful' | 'general'
  componentType: 'chat' | 'news_analysis' | 'writing_analysis' | 'wellbeing' | 'other'
  module?: string
  responseId?: string
}

/**
 * Submit AI feedback to Supabase
 */
export async function submitAIFeedback(params: SubmitFeedbackParams): Promise<AIFeedback | null> {
  if (!supabase) return null
  
  try {
    const { data, error } = await supabase
      .from('ai_feedback')
      .insert({
        user_id: params.userId,
        module: params.module,
        timestamp: new Date().toISOString(),
        ai_response: params.aiResponse,
        student_comments: params.studentComments,
        feedback_type: params.feedbackType,
        component_type: params.componentType,
        response_id: params.responseId,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error submitting AI feedback:', error)
      return null
    }

    return data as AIFeedback
  } catch (error) {
    console.error('Unexpected error submitting feedback:', error)
    return null
  }
}

/**
 * Get user's feedback history
 */
export async function getUserFeedbackHistory(userId: string, limit: number = 50): Promise<AIFeedback[]> {
  if (!supabase) return []
  
  try {
    const { data, error } = await supabase
      .from('ai_feedback')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching feedback history:', error)
      return []
    }

    return data as AIFeedback[]
  } catch (error) {
    console.error('Unexpected error fetching feedback:', error)
    return []
  }
}

/**
 * Get feedback statistics for admin dashboard
 */
export async function getFeedbackStats() {
  if (!supabase) return { totalFeedback: 0, feedbackByType: {}, feedbackByComponent: {}, feedbackByStatus: {} }
  
  try {
    const { data, error } = await supabase
      .from('ai_feedback')
      .select('feedback_type, component_type, status')

    if (error) {
      console.error('Error fetching feedback stats:', error)
      return null
    }

    // Process statistics
    const stats = {
      total: data.length,
      byType: data.reduce((acc: any, item) => {
        acc[item.feedback_type] = (acc[item.feedback_type] || 0) + 1
        return acc
      }, {}),
      byComponent: data.reduce((acc: any, item) => {
        acc[item.component_type] = (acc[item.component_type] || 0) + 1
        return acc
      }, {}),
      byStatus: data.reduce((acc: any, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1
        return acc
      }, {}),
      pending: data.filter(item => item.status === 'pending').length
    }

    return stats
  } catch (error) {
    console.error('Unexpected error fetching stats:', error)
    return null
  }
}