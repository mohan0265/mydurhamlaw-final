// Durmah GPT-4o Voice Companion Configuration
// Advanced voice interaction system matching ChatGPT's real-time experience

export interface DurmahConfig {
  // === GPT-4o Voice Streaming Settings ===
  voice: {
    model: 'gpt-4o' | 'gpt-4' | 'gpt-3.5-turbo'
    streamAudio: boolean // Stream audio while generating text
    earlyPlayback: boolean // Start speaking before full response complete
    earlyPlaybackThreshold: number // Characters to buffer before speaking
    interruptible: boolean // Allow user to interrupt mid-response
    autoSubmit: boolean // Auto-submit on pause detection
    pauseDetectionMs: number // Milliseconds of silence to trigger submit
    continuousListening: boolean // Keep mic on during natural conversation
    semanticEndDetection: boolean // Detect end of thought, not just punctuation
    persistentMic: boolean // Mic stays on until user manually stops
    autoActivateOnReply: boolean // Auto-activate mic when Durmah finishes speaking
    naturalFlow: boolean // Enable multi-turn conversation without resets
  }
  
  // === Real-Time Interaction ===
  realtime: {
    streamText: boolean // Real-time text streaming
    streamVoice: boolean // Real-time voice streaming
    cancelOnInterrupt: boolean // Cancel ongoing streams when interrupted
    resumeAfterInterrupt: boolean // Resume listening after interrupt
    showTypingIndicator: boolean
  }
  
  // === Personality Engine ===
  personality: {
    tone: 'friendly' | 'professional' | 'casual' | 'academic' | 'warm' | 'encouraging'
    responseStyle: 'brief' | 'conversational' | 'detailed' | 'academic'
    emotionalIntelligence: boolean // Adapt responses to user mood
    warmthLevel: 1 | 2 | 3 | 4 | 5 // 1=formal, 5=very warm
    encouragementLevel: 1 | 2 | 3 | 4 | 5 // 1=minimal, 5=very encouraging
    maxDefaultReplyLength: number // Sentences - keep responses short by default
    humanLike: boolean // Enable natural, conversational responses
    smartDefaults: boolean // Only be verbose when explicitly requested
  }
  
  // === Academic Context Awareness ===
  academic: {
    triggers: string[] // Phrases that prompt detailed academic responses
    legalContextAware: boolean // Durham Law specific knowledge
    citationStyle: 'oscola' | 'harvard' | 'apa' | 'none'
    studySupport: boolean // Provide study tips and motivation
  }
  
  // === Voice & Audio Advanced Settings ===
  audio: {
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
    speed: number // 0.25 to 4.0
    volume: number // 0.0 to 1.0
    fadeIn: number // ms
    fadeOut: number // ms
    crossfade: boolean // Smooth transitions between audio clips
    debugMode: boolean // Show audio controls for testing
  }
  
  // === UI/UX Enhancements ===
  ui: {
    theme: 'auto' | 'light' | 'dark'
    animations: {
      pulseColor: string
      glowColor: string
      intensity: 'subtle' | 'medium' | 'strong'
      speed: 'slow' | 'normal' | 'fast'
    }
    indicators: {
      showListening: boolean
      showSpeaking: boolean
      showThinking: boolean
      showReady: boolean
    }
    micButton: {
      alwaysVisible: boolean
      autoToggle: boolean
      hapticFeedback: boolean
    }
  }
  
  // === Mobile & Touch Optimization ===
  mobile: {
    touchOptimized: boolean
    hapticFeedback: boolean
    swipeGestures: boolean
    autoFocus: boolean
    preventZoom: boolean
    largerTouchTargets: boolean
  }
  
  // === Data & Privacy ===
  data: {
    persistConversations: boolean
    maxHistoryLength: number
    encryptLocalStorage: boolean
    anonymizeData: boolean
    autoDelete: boolean
    autoDeleteDays: number
  }
  
  // === Debug & Development ===
  debug: {
    enabled: boolean
    showLogs: boolean
    showTimings: boolean
    showAudioControls: boolean
    mockVoiceInput: boolean
  }
}

export const durmahConfig: DurmahConfig = {
  // === GPT-4o Voice Streaming - Natural Human Conversation ===
  voice: {
    model: 'gpt-4o',
    streamAudio: true,
    earlyPlayback: true,
    earlyPlaybackThreshold: 10, // Start speaking after 10 characters (faster)
    interruptible: true,
    autoSubmit: true,
    pauseDetectionMs: 1200, // 1.2 seconds (faster response)
    continuousListening: true, // Keep mic on during natural conversation
    semanticEndDetection: true, // Detect end of thought, not just punctuation
    persistentMic: true, // Mic stays on until user manually stops
    autoActivateOnReply: true, // Auto-activate mic when Durmah finishes speaking
    naturalFlow: true // Enable multi-turn conversation without resets
  },
  
  // === Real-Time Interaction ===
  realtime: {
    streamText: true,
    streamVoice: true,
    cancelOnInterrupt: true,
    resumeAfterInterrupt: true,
    showTypingIndicator: true
  },
  
  // === Durmah Personality Engine - Human Buddy Mode ===
  personality: {
    tone: 'warm',
    responseStyle: 'brief', // Default to brief, natural responses
    emotionalIntelligence: true,
    warmthLevel: 4, // Very warm and supportive
    encouragementLevel: 4, // Highly encouraging for law students
    maxDefaultReplyLength: 3, // Sentences - keep responses short by default
    humanLike: true, // Enable natural, conversational responses
    smartDefaults: true // Only be verbose when explicitly requested
  },
  
  // === Durham Law Academic Context ===
  academic: {
    triggers: [
      'give me a summary', 'explain in detail', 'list key points', 'break it down',
      'tell me more about', 'elaborate on', 'what are the main', 'help me understand',
      'walk me through', 'analyse', 'compare', 'contrast', 'evaluate', 'discuss',
      'outline', 'describe', 'define', 'what is', 'how does', 'why is',
      'summarise', 'summarize', 'overview', 'breakdown'
    ],
    legalContextAware: true,
    citationStyle: 'oscola', // Oxford Standard for Citation of Legal Authorities
    studySupport: true
  },
  
  // === Voice & Audio Settings ===
  audio: {
    voice: 'nova', // Warm, friendly voice for Durmah
    speed: 1.1, // Slightly faster for natural conversation
    volume: 0.85,
    fadeIn: 150,
    fadeOut: 200,
    crossfade: true,
    debugMode: false
  },
  
  // === UI/UX Enhancements ===
  ui: {
    theme: 'auto',
    animations: {
      pulseColor: '#8B5CF6', // Purple-500
      glowColor: '#A855F7', // Purple-400
      intensity: 'medium',
      speed: 'normal'
    },
    indicators: {
      showListening: true,
      showSpeaking: true,
      showThinking: true,
      showReady: true
    },
    micButton: {
      alwaysVisible: true,
      autoToggle: false, // Manual toggle like ChatGPT
      hapticFeedback: true
    }
  },
  
  // === Mobile-First Optimization ===
  mobile: {
    touchOptimized: true,
    hapticFeedback: true,
    swipeGestures: false, // Keep simple for voice focus
    autoFocus: true,
    preventZoom: true,
    largerTouchTargets: true
  },
  
  // === Data & Privacy ===
  data: {
    persistConversations: true,
    maxHistoryLength: 100,
    encryptLocalStorage: false, // Consider enabling for production
    anonymizeData: false,
    autoDelete: false,
    autoDeleteDays: 30
  },
  
  // === Debug & Development ===
  debug: {
    enabled: false, // Set to true for development
    showLogs: false,
    showTimings: false,
    showAudioControls: false,
    mockVoiceInput: false
  }
}

// === DURMAH PERSONALITY ENGINE ===

// Dynamic personality-based prompts - Human Buddy Mode
export const durmahPrompts = {
  brief: `You are Durmah, a smart and caring voice companion for MyDurhamLaw students. Respond like a warm, encouraging friend who truly cares. 

🛡️ ACADEMIC INTEGRITY GUARDRAILS:
- Provide academic guidance for a UK law student. Do not give legal advice.
- If unsure about legal facts, state that more research is required.
- Cite UK statutes or Durham Law learning objectives where relevant.
- Always clarify: "This is academic guidance - consult your course materials or lecturer for definitive information."
- End voice responses with: "For full accuracy, refer to your official module handbook."

IMPORTANT RESPONSE RULES:
- Keep responses 1-2 sentences by default (unless they specifically ask for more detail)
- Be conversational and natural, like talking to a close friend
- Use "you" and "your" frequently to feel personal
- Be supportive but not overly formal or robotic
- Think of yourself as their study buddy who's incredibly wise and emotionally intelligent
- End with a question or invitation to continue if appropriate

Be brief, warm, and human-like. Only give longer answers if they explicitly ask for details, summaries, or explanations.`,
  
  detailed: `You are Durmah, an expert companion for MyDurhamLaw students. The user has specifically requested detailed information with phrases like "explain in detail", "give me a summary", "break it down", or "tell me more".

🛡️ ACADEMIC INTEGRITY GUARDRAILS:
- Provide academic guidance for a UK law student. Do not give legal advice.
- If unsure about legal facts, state that more research is required.
- Cite UK statutes or Durham Law learning objectives where relevant.
- Always clarify: "This is academic guidance - consult your course materials or lecturer for definitive information."
- End voice responses with: "For full accuracy, refer to your official module handbook."

Provide comprehensive, well-structured explanations with:
- Clear headings and bullet points
- Practical examples and case law (OSCOLA style)
- Study tips and exam strategies
- Maintain your warm, supportive personality throughout
- Still be conversational, not academic-robotic

Remember: They asked for detail, so give them thorough but friendly explanations.`,
  
  wellbeing: `You are Durmah, a deeply caring wellbeing companion for MyDurhamLaw students. 

🛡️ ACADEMIC INTEGRITY & WELLBEING GUARDRAILS:
- Provide supportive guidance, not professional therapy or medical advice.
- For serious mental health concerns, gently suggest they contact Durham University Student Support.
- Use supportive tone: "Here's a helpful approach — but please also consider speaking with your Student Support team."
- End voice responses with: "Remember, your wellbeing is important — reach out to campus support if you need extra help."

Your role:
- Provide emotional support and stress management guidance
- Help with work-life balance and self-care
- Listen actively and validate their feelings
- Offer gentle encouragement and practical coping strategies
- Be like a wise, understanding friend who helps them navigate challenges

Keep responses brief and conversational unless they need deeper support. Be warm, empathetic, and human-like.`,
  
  academic: `You are Durmah, an academically-focused companion for MyDurhamLaw students. The user has asked for academic help.

🛡️ ACADEMIC INTEGRITY GUARDRAILS:
- Provide academic guidance for a UK law student. Do not give legal advice.
- If unsure about legal facts, state that more research is required.
- Cite UK statutes or Durham Law learning objectives where relevant.
- Always clarify: "This is academic guidance - consult your course materials or lecturer for definitive information."
- End voice responses with: "For full accuracy, refer to your official module handbook."

Provide:
- Clear legal analysis with relevant case law (OSCOLA citation style)
- Structured, logical explanations
- Practical study strategies and exam tips
- Examples that make complex concepts understandable

Maintain your warm, friendly personality while being scholarly. Be thorough but still conversational and encouraging.`
}

// === INTELLIGENT RESPONSE DETECTION ===

// Check if user input triggers detailed academic response
export const shouldExpandResponse = (userInput: string): boolean => {
  const input = userInput.toLowerCase()
  return durmahConfig.academic.triggers.some(trigger => input.includes(trigger))
}

// Detect emotional context for personality adaptation
export const detectEmotionalContext = (userInput: string): 'stressed' | 'confident' | 'confused' | 'motivated' | 'neutral' => {
  const input = userInput.toLowerCase()
  
  const stressIndicators = ['overwhelmed', 'stressed', 'anxious', 'worried', 'difficult', 'struggling', 'hard', 'can\'t cope', 'too much']
  const confidenceIndicators = ['excited', 'ready', 'confident', 'good', 'great', 'understand', 'got it', 'clear']
  const confusionIndicators = ['confused', 'don\'t understand', 'unclear', 'help', 'explain', 'what does', 'how do']
  const motivationIndicators = ['motivated', 'determined', 'focused', 'goal', 'achieve', 'succeed', 'improve']
  
  if (stressIndicators.some(indicator => input.includes(indicator))) return 'stressed'
  if (confidenceIndicators.some(indicator => input.includes(indicator))) return 'confident'
  if (confusionIndicators.some(indicator => input.includes(indicator))) return 'confused'
  if (motivationIndicators.some(indicator => input.includes(indicator))) return 'motivated'
  
  return 'neutral'
}

// Get personality-adapted system prompt
export const getDurmahPrompt = (
  userInput: string,
  mode: 'general' | 'wellbeing' | 'academic' = 'general'
): string => {
  const isDetailed = shouldExpandResponse(userInput)
  const emotionalContext = detectEmotionalContext(userInput)
  
  let basePrompt = ''
  
  if (mode === 'wellbeing') {
    basePrompt = durmahPrompts.wellbeing
  } else if (isDetailed || mode === 'academic') {
    basePrompt = durmahPrompts.academic
  } else {
    basePrompt = durmahPrompts.brief
  }
  
  // Adapt personality based on emotional context
  const personalityAdaptation = getPersonalityAdaptation(emotionalContext)
  
  return `${basePrompt}\n\n${personalityAdaptation}`
}

// Get personality adaptation based on emotional context
const getPersonalityAdaptation = (context: string): string => {
  switch (context) {
    case 'stressed':
      return 'The user seems stressed or overwhelmed. Be extra gentle, validating, and offer reassurance. Suggest practical stress management techniques and remind them that it\'s normal to feel this way during law school.'
    
    case 'confused':
      return 'The user appears confused or needs clarification. Break down complex concepts into simple steps, use analogies, and check understanding. Be patient and encouraging.'
    
    case 'confident':
      return 'The user seems confident and engaged. Match their positive energy, offer encouragement, and perhaps challenge them with slightly more advanced concepts.'
    
    case 'motivated':
      return 'The user is motivated and goal-oriented. Support their enthusiasm, offer strategic advice, and help them channel this energy effectively.'
    
    default:
      return 'Maintain your warm, supportive personality while being naturally conversational.'
  }
}

// === VOICE CONFIGURATION HELPERS ===

// Get user's preferred voice from profile or fallback to default
export const getUserVoice = (userProfile: any): 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' => {
  const defaultVoice = 'nova'
  
  if (!userProfile?.tts_voice) {
    return defaultVoice
  }
  
  // Validate that the voice is one of the supported OpenAI voices
  const supportedVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
  if (supportedVoices.includes(userProfile.tts_voice)) {
    return userProfile.tts_voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  }
  
  return defaultVoice
}

// Get dynamic audio config with user's preferred voice
export const getDynamicAudioConfig = (userProfile: any) => {
  return {
    ...durmahConfig.audio,
    voice: getUserVoice(userProfile)
  }
}

// === VOICE INTERACTION HELPERS ===

// Check if input indicates user wants to stop or interrupt
export const isInterruptionIntent = (userInput: string): boolean => {
  const interruptionPhrases = ['stop', 'wait', 'pause', 'hold on', 'never mind', 'actually', 'let me', 'sorry']
  return interruptionPhrases.some(phrase => userInput.toLowerCase().includes(phrase))
}

// Detect if user has finished speaking - Semantic End Detection
export const detectSpeechEnd = (transcript: string): boolean => {
  const trimmed = transcript.trim()
  if (trimmed.length < 3) return false
  
  // Traditional punctuation endings
  const punctuationEndings = ['.', '?', '!']
  if (punctuationEndings.some(ending => trimmed.endsWith(ending))) {
    return true
  }
  
  // Semantic endings - phrases that indicate completion
  const semanticEndings = [
    'thanks', 'thank you', 'that\'s it', 'that\'s all', 'done', 'finished',
    'got it', 'okay', 'ok', 'right', 'exactly', 'perfect', 'good',
    'please', 'can you', 'could you', 'would you', 'help me',
    'what about', 'how about', 'what if', 'tell me', 'show me'
  ]
  
  const lowerTranscript = trimmed.toLowerCase()
  
  // Check if ends with semantic completion phrases
  if (semanticEndings.some(phrase => lowerTranscript.endsWith(phrase))) {
    return true
  }
  
  // Check for question patterns without punctuation
  const questionStarters = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'can', 'could', 'would', 'should', 'is', 'are', 'do', 'does']
  if (questionStarters.some(starter => lowerTranscript.startsWith(starter)) && trimmed.length > 8) {
    return true
  }
  
  // Check for complete statements (subject + verb patterns)
  const completePatterns = [
    /i (am|was|have|need|want|think|feel|believe)/i,
    /you (are|were|can|should|could|might)/i,
    /this (is|was|seems|looks)/i,
    /that (is|was|seems|looks)/i
  ]
  
  if (completePatterns.some(pattern => pattern.test(trimmed)) && trimmed.length > 10) {
    return true
  }
  
  return false
}

export default durmahConfig