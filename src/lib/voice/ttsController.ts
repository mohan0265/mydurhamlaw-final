// src/lib/voice/ttsController.ts
import { elevenLabsTTS } from '../elevenlabs';

interface TTSOptions {
    gapMs?: number;
    onSentencePlay?: (sentence: string) => void;
    onSentenceEnd?: (sentence: string) => void;
}

class TTSController {
  private static instance: TTSController;
  private audioContext: AudioContext;
  private sentenceQueue: { text: string, opts: TTSOptions }[] = [];
  private isPlaying = false;
  private abortController: AbortController | null = null;

  private constructor() {
    this.audioContext = new AudioContext();
  }

  public static getInstance(): TTSController {
    if (!TTSController.instance) {
      TTSController.instance = new TTSController();
    }
    return TTSController.instance;
  }

  public async speakSentences(text: string, opts: TTSOptions = {}): Promise<void> {
    console.log('[Durmah] TTS speak');
    this.stopAll(); // Barge-in

    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    this.sentenceQueue = sentences.map(s => ({ text: s, opts }));

    if (this.sentenceQueue.length > 0) {
      this.playNextSentence();
    }
  }

  public stopAll(): void {
    console.log('[Durmah] TTS stop all');
    this.isPlaying = false;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.sentenceQueue = [];
  }

  public isSpeaking(): boolean {
    return this.isPlaying;
  }

  private playNextSentence = async (): Promise<void> => {
    if (this.sentenceQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const { text, opts } = this.sentenceQueue.shift()!;

    try {
      if (!this.abortController) this.abortController = new AbortController();
      const { signal } = this.abortController;

      opts.onSentencePlay?.(text);
      console.log(`[Durmah] TTS playing: ${text}`);
      const audioBlob = await elevenLabsTTS(text, signal);
      if (signal.aborted) {
        return;
      }
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start();

      source.onended = () => {
        opts.onSentenceEnd?.(text);
        setTimeout(() => this.playNextSentence(), opts.gapMs || 350);
      };

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('[Durmah] TTS fetch aborted.');
      } else {
        console.error('[Durmah] Error playing TTS:', error);
      }
      this.isPlaying = false;
    }
  };
}

export const ttsController = TTSController.getInstance();
