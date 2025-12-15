// Stubbed ElevenLabs client: no external calls; safe no-ops.
let audio: HTMLAudioElement | null = null;

export const speakWithElevenLabs = async (_text: string, _opts?: { voiceId?: string }) => {
  console.info('[tts] ElevenLabs disabled; skipping playback.');
  audio = null;
  return null;
};

export const stop = () => {
  audio = null;
};

export const isSpeaking = () => false;
