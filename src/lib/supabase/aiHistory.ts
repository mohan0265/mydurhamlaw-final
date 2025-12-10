import { getSupabaseClient } from './client'

const supabase = getSupabaseClient()

export interface AIHistoryEntry {
  id?: string
  user_id: string
  session_type: 'wellbeing' | 'legal_assistant' | 'assignment_help'
  interaction_type: 'voice' | 'text'
  user_message: string
  ai_response: string
  transcript_original?: string // Original voice transcript before editing
  transcript_edited?: string   // User-edited transcript
  created_at?: string
  metadata?: {
    voice_duration?: number
    confidence_score?: number
    error_details?: string
  }
}

export async function saveAIInteraction(entry: Omit<AIHistoryEntry, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase
      .from('ai_history')
      .insert([entry])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error saving AI interaction:', error)
    return { data: null, error }
  }
}

export async function getAIHistory(userId: string, sessionType?: string, limit: number = 50) {
  try {
    let query = supabase
      .from('ai_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (sessionType) {
      query = query.eq('session_type', sessionType)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching AI history:', error)
    return { data: null, error }
  }
}

export async function deleteAIHistory(id: string) {
  try {
    const { error } = await supabase
      .from('ai_history')
      .delete()
      .eq('id', id)

    return { error }
  } catch (error) {
    console.error('Error deleting AI history:', error)
    return { error }
  }
}