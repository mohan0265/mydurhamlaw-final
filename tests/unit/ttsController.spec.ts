import { test, expect, vi, describe, it, beforeEach } from 'vitest';
import { ttsController } from '../../src/lib/voice/ttsController';

// Mock AudioContext
const mockAudioContext = vi.fn(() => ({
    decodeAudioData: vi.fn(() => Promise.resolve(new AudioBuffer({
        length: 1, sampleRate: 44100
    }))),
    createBufferSource: vi.fn(() => ({
        connect: vi.fn(),
        start: vi.fn(),
        onended: vi.fn(),
    })),
}));

vi.stubGlobal('AudioContext', mockAudioContext);

vi.mock('../../src/lib/elevenlabs', () => ({
    elevenLabsTTS: vi.fn(() => Promise.resolve(new Blob())),
}));

describe('ttsController', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        vi.resetModules();
        const module = await import('../../src/lib/voice/ttsController');
        global.ttsController = module.ttsController;
    });

    it('should be a singleton', () => {
        const instance1 = global.ttsController;
        const instance2 = global.ttsController;
        expect(instance1).toBe(instance2);
    });

    it('should play sentences sequentially', async () => {
        const text = 'Hello world. This is a test.';
        await global.ttsController.speakSentences(text);
        expect(global.ttsController.isSpeaking()).toBe(true);
    });

    it('should stop all playback', async () => {
        const text = 'Hello world. This is a test.';
        global.ttsController.speakSentences(text);
        global.ttsController.stopAll();
        expect(global.ttsController.isSpeaking()).toBe(false);
    });
});
