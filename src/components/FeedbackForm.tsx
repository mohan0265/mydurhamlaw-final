// components/FeedbackForm.tsx

'use client'

import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'

export default function FeedbackForm({ userId, moduleName, aiResponse }: {
  userId: string
  moduleName: string
  aiResponse: string
}) {
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const submitFeedback = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('Supabase client not available');
      return;
    }
    
    const { error } = await supabase.rpc('insert_ai_feedback', {
      user_id: userId,
      module_name: moduleName,
      ai_response: aiResponse,
      student_comments: comment,
      rating: null
    })
    if (!error) setSubmitted(true)
  }

  if (submitted) return <p className="text-green-600">✅ Thank you for your feedback!</p>

  return (
    <div className="mt-2">
      <textarea
        className="w-full p-2 border rounded text-sm"
        placeholder="Was this answer helpful? Any comments..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button
        className="mt-1 bg-blue-600 text-white px-3 py-1 rounded text-sm"
        onClick={submitFeedback}
      >
        Submit Feedback
      </button>
    </div>
  )
}
