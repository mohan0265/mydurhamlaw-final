declare module 'elevenlabs-node' {
    interface ElevenLabsConfig {
        apiKey: string;
    }

    interface TextToSpeechOptions {
        textInput: string;
        voiceId: string;
        modelId?: string;
    }

    interface Voice {
        voice_id: string;
        name: string;
    }

    interface VoicesResponse {
        voices: Voice[];
    }

    class ElevenLabs {
        constructor(config: ElevenLabsConfig);
        textToSpeechStream(options: TextToSpeechOptions): Promise<any>; // This will return a Readable stream
        getVoices(): Promise<VoicesResponse>;
    }

    export default ElevenLabs;
}