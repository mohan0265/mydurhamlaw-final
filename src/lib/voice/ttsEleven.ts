/**
 * ElevenLabs TTS Client-Side Integration for Durmah Voice System
 * Uses server proxy to keep API keys secure
 */

import { queuePlayer } from './queuePlayer';

export interface TTSOptions {
  voiceId?: string;
}

export interface TTSResponse {
  success: boolean;
  error?: string;
  audioUrl?: string;
}

class ElevenLabsTTS {
  private defaultVoiceId: string = 'Rachel';

  constructor() {
    // No API key needed on client side - using server proxy
  }

  /**
   * Stream TTS audio via server proxy to queue player
   */
  public async stream(text: string, options: TTSOptions = {}): Promise<TTSResponse> {
    if (!text.trim()) {
      return { success: false, error: 'Empty text provided' };
    }

    const voiceId = options.voiceId || this.defaultVoiceId;
    
    try {
      console.log('DURMAH_TTS_START:', text.substring(0, 50) + '...');
      
      // Use server proxy to avoid exposing API keys
      const queryParams = new URLSearchParams({
        text: text.trim(),
        voice: voiceId
      });

      const response = await fetch(`/api/voice/tts?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'audio/mpeg',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('DURMAH_TTS_ERR:', response.status, errorData);
        return { 
          success: false, 
          error: errorData.error || `TTS proxy error: ${response.status}` 
        };
      }

      // Convert response to blob and create audio URL
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Queue the audio for playback
      await queuePlayer.enqueueFromUrl(audioUrl);
      
      console.log('DURMAH_TTS_OK:', text.length, 'chars queued');
      
      // Clean up blob URL after a delay (audio should be loaded by then)
      setTimeout(() => URL.revokeObjectURL(audioUrl), 30000);
      
      return { success: true, audioUrl };
      
    } catch (error) {
      console.error('DURMAH_TTS_ERR:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown TTS error' 
      };
    }
  }

  /**
   * Simple TTS play function for direct usage
   */
  public async playTTS(text: string, voiceId?: string): Promise<void> {
    if (!text.trim()) return;

    const queryParams = new URLSearchParams({
      text: text.trim(),
      ...(voiceId ? { voice: voiceId } : {})
    });

    const response = await fetch(`/api/voice/tts?${queryParams.toString()}`);
    if (!response.ok) throw new Error('TTS proxy failed');
    
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    await audio.play();
    audio.onended = () => URL.revokeObjectURL(audioUrl);
  }

  /**
   * Stream long text by breaking into sentences
   */
  public async streamLongText(text: string, options: TTSOptions = {}): Promise<TTSResponse[]> {
    // Split text into sentences while preserving punctuation
    const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [text];
    
    const results: TTSResponse[] = [];
    
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed) {
        const result = await this.stream(trimmed, options);
        results.push(result);
        
        // Small delay between sentences to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  /**
   * Test TTS proxy connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('/api/voice/tts?text=test');
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const ttsEleven = new ElevenLabsTTS();