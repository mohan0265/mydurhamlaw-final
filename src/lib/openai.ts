import { Message } from '@/types/chat'
import { buildUserSystemPrompt } from './buildUserSystemPrompt'
// Durmah prompts removed - using standard system prompts
import { AssistanceLevel } from '@/components/wellbeing/AssistanceLevelPopover'
import { buildSystemPrompt, getWindowMDLContext } from '@/lib/assist/systemPrompt'

export interface StreamResponse {
  fullText: string
  streamChunks: AsyncGenerator<string, void, unknown>;
  isComplete: boolean
}

let abortController = new AbortController();

export function interruptVoice() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  abortController.abort();
  abortController = new AbortController();
}

// Function to play assistant voice using SpeechSynthesis
export function playAssistantVoice(text: string) {
  if (!window.speechSynthesis) {
    console.warn("SpeechSynthesis not supported in this browser.");
    return;
  }

  // Filter out emojis from the text
  const textWithoutEmojis = text.replace(/\p{Emoji_Presentation}/gu, '').trim();

  if (!textWithoutEmojis) {
    return; // Don't speak if only emojis were present
  }

  const utterance = new SpeechSynthesisUtterance(textWithoutEmojis);
  utterance.lang = 'en-GB';
  utterance.rate = 1.0; // Adjust for natural pacing
  utterance.pitch = 1.0; // Adjust for natural tone

  // Optional: Choose a specific voice for better quality
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(voice => 
    voice.lang === 'en-GB' && (voice.name.includes('Google') || voice.name.includes('Microsoft'))
  );
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  // Event listener for when speech ends
  utterance.onend = () => {
    // Dispatch a custom event to signal that the assistant has finished speaking
    window.dispatchEvent(new CustomEvent('durmah-assistant-speech-end'));
  };

  window.speechSynthesis.speak(utterance);
}

const getAssistanceLevelPrompt = (level: AssistanceLevel) => {
  const basePrompt = "Under no circumstances should you produce text that appears ready for submission. Your goal is to be a teaching tool, not a ghostwriter. Always encourage the student to rewrite and synthesize information in their own words.";
  switch (level) {
    case 'L1':
      return `You are an academic assistant in 'L1 Self-Starter' mode. Provide minimal hints and ask Socratic questions. Do not provide direct answers or long explanations. Encourage the student to think for themselves. ${basePrompt}`;
    case 'L2':
      return `You are an academic assistant in 'L2 Guided' mode. You can provide outlines and scaffolds to guide the student. The student must provide a draft first. Your role is to help them structure their thoughts, not to write for them. ${basePrompt}`;
    case 'L3':
      return `You are an academic assistant in 'L3 Coach' mode. You can provide worked examples and more detailed explanations. However, you MUST always remind the student to paraphrase any provided examples in their own words and to cite appropriately. Never produce text that looks like it could be submitted directly. ${basePrompt}`;
    default:
      return basePrompt;
  }
}

export async function streamGPT4oResponse(
  messages: Message[], 
  userId: string,
  mode: 'general' | 'wellbeing' | 'academic' = 'general',
  metadata?: { assistanceLevel: AssistanceLevel; pledgedAt: string | null }
): Promise<StreamResponse> {
  
  const lastUserMessage = messages[messages.length - 1]?.content || ''
  const baseSystemPrompt = await buildUserSystemPrompt(userId)
  
  // Get MDL context for personalized responses
  const mdlContext = getWindowMDLContext()
  const mdlSystemPrompt = buildSystemPrompt(mdlContext || {})
  
  // Standard wellbeing prompt for voice interactions
  const wellbeingPrompt = 'You are a supportive AI companion for Durham Law students. Provide encouraging, helpful responses in a conversational tone.'
  const assistancePrompt = metadata ? getAssistanceLevelPrompt(metadata.assistanceLevel) : ''

  const apiMessages = [
    { role: 'system', content: `${baseSystemPrompt}\n\n${mdlSystemPrompt}\n\n${assistancePrompt}` },
    ...messages.map(msg => ({ role: msg.role, content: msg.content }))
  ]

  const response = await fetch('/api/stream/gpt4', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      messages: apiMessages,
      metadata,
    }),
    signal: abortController.signal,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  const streamChunks = (async function* () {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const json = JSON.parse(line.slice(6));
          const content = json.choices[0]?.delta?.content;
          if (content) {
            yield content;
          }
        }
      }
    }
  })();

  return {
    fullText: '',
    streamChunks,
    isComplete: false, // This will be updated by the consumer of the stream
  };
}