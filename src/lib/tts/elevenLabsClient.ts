let audio: HTMLAudioElement | null = null;

export const speakWithElevenLabs = async (text: string, opts?: { voiceId?: string }) => {
    const res = await fetch('/api/tts/elevenlabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId: opts?.voiceId }),
    });

    if (!res.ok) {
        throw new Error('TTS stream failed');
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    audio = new Audio(url);
    audio.play();
};

export const stop = () => {
    if (audio) {
        audio.pause();
        audio = null;
    }
};

export const isSpeaking = () => {
    return audio?.paused === false;
};
