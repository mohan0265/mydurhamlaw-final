
import { createClient } from '@supabase/supabase-js';

// Robust configuration access
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o'; // Default to smart model

/**
 * Call OpenAI Chat Completion (Robust Implementation)
 */
export async function callOpenAI(messages: any[]) {
    if (!OPENAI_API_KEY) {
        throw new Error('Missing OPENAI_API_KEY environment variable');
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        console.warn('[callOpenAI] Empty messages array passed');
        return "I'm sorry, I didn't catch that. Could you repeat?";
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: OPENAI_MODEL,
                messages: messages.map(m => ({
                    role: m.role,
                    content: m.content
                })),
                temperature: 0.7,
                max_tokens: 1000,
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('[callOpenAI] API Error:', response.status, errText);
            throw new Error(`OpenAI API Error: ${response.status} ${errText}`);
        }

        const data = await response.json();
        
        if (!data.choices || data.choices.length === 0) {
            console.error('[callOpenAI] No choices returned');
            return "Thinking..."; // Fallback
        }

        return data.choices[0].message.content;

    } catch (error: any) {
        console.error('[callOpenAI] Exception:', error);
        throw new Error(error.message || 'Failed to contact AI service');
    }
}
