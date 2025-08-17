/**
 * Audio Queue Player for Durmah Voice System
 * Manages sequential playback of TTS audio chunks with no overlap
 */

export interface QueuePlayerEvents {
  speaking: () => void;
  idle: () => void;
  error: (error: Error) => void;
}

export class QueuePlayer extends EventTarget {
  private audioQueue: AudioBuffer[] = [];
  private isPlaying: boolean = false;
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private volume: number = 0.8;

  constructor() {
    super();
    this.initializeAudioContext();
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = this.volume;
    } catch (error) {
      console.error('DURMAH_QUEUE_INIT_ERR:', error);
      this.dispatchEvent(new CustomEvent('error', { detail: error }));
    }
  }

  /**
   * Add audio buffer to the queue and start playing if not already playing
   */
  public async enqueue(audioBuffer: AudioBuffer): Promise<void> {
    if (!this.audioContext || !this.gainNode) {
      await this.initializeAudioContext();
    }

    this.audioQueue.push(audioBuffer);
    
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  /**
   * Add audio from URL/blob to queue
   */
  public async enqueueFromUrl(audioUrl: string): Promise<void> {
    try {
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
      await this.enqueue(audioBuffer);
    } catch (error) {
      console.error('DURMAH_QUEUE_URL_ERR:', error);
      this.dispatchEvent(new CustomEvent('error', { detail: error }));
    }
  }

  /**
   * Play next item in queue
   */
  private async playNext(): Promise<void> {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      this.dispatchEvent(new CustomEvent('idle'));
      return;
    }

    if (!this.audioContext || !this.gainNode) {
      return;
    }

    // Resume context if suspended (mobile Safari requirement)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const audioBuffer = this.audioQueue.shift()!;
    this.currentSource = this.audioContext.createBufferSource();
    this.currentSource.buffer = audioBuffer;
    this.currentSource.connect(this.gainNode);

    this.isPlaying = true;
    this.dispatchEvent(new CustomEvent('speaking'));

    // Set up completion handler
    this.currentSource.onended = () => {
      console.log('DURMAH_QUEUE_CHUNK_END');
      this.currentSource = null;
      this.playNext(); // Continue with next item
    };

    try {
      this.currentSource.start(0);
      console.log('DURMAH_QUEUE_START');
    } catch (error) {
      console.error('DURMAH_QUEUE_PLAY_ERR:', error);
      this.isPlaying = false;
      this.dispatchEvent(new CustomEvent('error', { detail: error }));
    }
  }

  /**
   * Stop current playback and clear queue
   */
  public stop(): void {
    console.log('DURMAH_QUEUE_STOP');
    
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch (error) {
        // Source might already be stopped
      }
      this.currentSource = null;
    }

    this.audioQueue = [];
    this.isPlaying = false;
    this.dispatchEvent(new CustomEvent('idle'));
  }

  /**
   * Stop all audio immediately (for barge-in functionality)
   */
  public stopAll(): void {
    console.log('DURMAH_QUEUE_STOP_ALL');
    
    // Stop current playback
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (error) {
        // Source might already be stopped
      }
      this.currentSource = null;
    }

    // Clear entire queue
    this.audioQueue = [];
    this.isPlaying = false;
    
    // Emit immediate idle state
    this.dispatchEvent(new CustomEvent('idle'));
    this.dispatchEvent(new CustomEvent('barge-in'));
  }

  /**
   * Pause current playback (resume not implemented yet)
   */
  public pause(): void {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }
    this.isPlaying = false;
    this.dispatchEvent(new CustomEvent('idle'));
  }

  /**
   * Set playback volume (0.0 to 1.0)
   */
  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }
  }

  /**
   * Check if currently playing
   */
  public get playing(): boolean {
    return this.isPlaying;
  }

  /**
   * Get current queue length
   */
  public get queueLength(): number {
    return this.audioQueue.length;
  }

  /**
   * Clear queue without stopping current playback
   */
  public clearQueue(): void {
    this.audioQueue = [];
  }
}

// Default singleton instance
export const queuePlayer = new QueuePlayer();