// src/lib/elevenlabs.ts
import { validateEnv } from './env'

interface ElevenLabsVoiceSettings {
  stability: number
  similarity_boost: number
  style?: number
  use_speaker_boost?: boolean
}

interface ElevenLabsStreamOptions {
  text: string
  voice_id?: string
  voice_settings?: ElevenLabsVoiceSettings
  output_format?: 'mp3_44100_128' | 'pcm_16000' | 'pcm_22050' | 'pcm_24000' | 'pcm_44100'
  optimize_streaming_latency?: number
  model_id?: string
}

const DEFAULT_VOICE_SETTINGS: ElevenLabsVoiceSettings = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.2,
  use_speaker_boost: true
}

// Professional, clear voices suitable for educational content
const PODCAST_VOICES = {
  // British accents for Durham context
  'rachel': 'Rachel', // British female, professional
  'arthur': 'Arthur', // British male, authoritative  
  'george': 'George', // British male, warm
  'charlotte': 'Charlotte', // British female, friendly
  
  // American alternatives
  'jessica': 'Jessica', // American female, clear
  'michael': 'Michael', // American male, professional
} as const

export type PodcastVoice = keyof typeof PODCAST_VOICES

export class ElevenLabsClient {
  private apiKey: string
  private baseUrl = 'https://api.elevenlabs.io/v1'

  constructor() {
    const env = validateEnv()
    this.apiKey = env.ELEVENLABS_API_KEY
  }

  async generateSpeech(options: ElevenLabsStreamOptions): Promise<ArrayBuffer> {
    const {
      text,
      voice_id = 'pNInz6obpgDQGcFmaJgB', // Default to Adam voice
      voice_settings = DEFAULT_VOICE_SETTINGS,
      output_format = 'mp3_44100_128',
      optimize_streaming_latency = 0,
      model_id = 'eleven_monolingual_v1'
    } = options

    if (!text?.trim()) {
      throw new Error('Text content is required for speech generation')
    }

    if (text.length > 5000) {
      throw new Error('Text content is too long (max 5000 characters)')
    }

    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voice_id}/stream`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id,
          voice_settings,
          optimize_streaming_latency,
          output_format
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('ElevenLabs API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })
        
        if (response.status === 401) {
          throw new Error('Invalid ElevenLabs API key')
        } else if (response.status === 422) {
          throw new Error('Invalid request parameters for ElevenLabs API')
        } else if (response.status === 429) {
          throw new Error('ElevenLabs API rate limit exceeded')
        } else {
          throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`)
        }
      }

      const audioBuffer = await response.arrayBuffer()
      
      if (audioBuffer.byteLength === 0) {
        throw new Error('Received empty audio data from ElevenLabs')
      }

      console.log('✅ ElevenLabs TTS successful:', {
        textLength: text.length,
        audioSize: `${(audioBuffer.byteLength / 1024).toFixed(1)}KB`,
        voiceId: voice_id
      })

      return audioBuffer

    } catch (error) {
      console.error('🚨 ElevenLabs TTS error:', error)
      if (error instanceof Error) {
        throw error
      } else {
        throw new Error('Unknown error occurred during speech generation')
      }
    }
  }

  async getAvailableVoices(): Promise<Array<{id: string, name: string, category: string}>> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`)
      }

      const data = await response.json()
      return data.voices?.map((voice: any) => ({
        id: voice.voice_id,
        name: voice.name,
        category: voice.category || 'generated'
      })) || []

    } catch (error) {
      console.error('Error fetching ElevenLabs voices:', error)
      return []
    }
  }

  getPodcastVoiceId(voice: PodcastVoice = 'rachel'): string {
    // Map to actual ElevenLabs voice IDs (these would need to be configured)
    const voiceMapping: Record<PodcastVoice, string> = {
      'rachel': 'pNInz6obpgDQGcFmaJgB', // Placeholder - replace with actual voice IDs
      'arthur': 'ErXwobaYiN019PkySvjV',
      'george': 'JBFqnCBsd6RMkjVDRZzb', 
      'charlotte': 'XB0fDUnXU5powFXDhCwa',
      'jessica': 'cgSgspJ2msm6clMCkdW9',
      'michael': 'flq6f7yk4E4fJM5XTYuZ'
    }

    return voiceMapping[voice] || voiceMapping.rachel
  }

  async generatePodcastAudio(
    script: string, 
    voice: PodcastVoice = 'rachel'
  ): Promise<ArrayBuffer> {
    if (!script?.trim()) {
      throw new Error('Podcast script is required')
    }

    // Clean script for better TTS
    const cleanScript = this.cleanScriptForTTS(script)
    
    return this.generateSpeech({
      text: cleanScript,
      voice_id: this.getPodcastVoiceId(voice),
      voice_settings: {
        ...DEFAULT_VOICE_SETTINGS,
        stability: 0.6, // Slightly more stable for podcast content
        similarity_boost: 0.8, // Higher fidelity for educational content
      },
      output_format: 'mp3_44100_128', // Good quality for podcasts
      optimize_streaming_latency: 1, // Optimize for quality over speed
      model_id: 'eleven_monolingual_v1'
    })
  }

  private cleanScriptForTTS(script: string): string {
    return script
      // Remove markdown formatting
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      // Convert common abbreviations for better pronunciation
      .replace(/\bDr\./g, 'Doctor')
      .replace(/\bProf\./g, 'Professor') 
      .replace(/\bUK\b/g, 'United Kingdom')
      .replace(/\bvs\./g, 'versus')
      .replace(/\bv\./g, 'versus')
      .replace(/\be\.g\./g, 'for example')
      .replace(/\bi\.e\./g, 'that is')
      .replace(/\betc\./g, 'etcetera')
      // Add pauses for better flow
      .replace(/[.!?]/g, '$&.')
      .replace(/[:;]/g, '$&,')
      // Clean up extra spaces
      .replace(/\s+/g, ' ')
      .trim()
  }
}

// Export default instance
export const elevenLabsClient = new ElevenLabsClient()

// Utility function for quick podcast generation
export async function generatePodcastAudio(
  script: string,
  voice: PodcastVoice = 'rachel'
): Promise<Buffer> {
  const audioBuffer = await elevenLabsClient.generatePodcastAudio(script, voice)
  return Buffer.from(audioBuffer)
}

export const elevenLabsTTS = async (text: string, signal?: AbortSignal): Promise<Blob> => {
    const client = new ElevenLabsClient();
    const audioBuffer = await client.generateSpeech({ text });
    return new Blob([audioBuffer], { type: 'audio/mpeg' });
};