# Durmah Voice v1.0 - Setup & Testing Guide

## 🚀 Quick Start

### 1. Environment Setup
Add to your `.env.local`:
```bash
# Required for Voice System
OPENAI_API_KEY=sk-your_openai_key_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here
ELEVENLABS_VOICE_ID=Rachel

# Optional customization
ELEVENLABS_MODEL=eleven_turbo_v2
ELEVENLABS_STABILITY=0.4
ELEVENLABS_SIMILARITY=0.7
ANTHROPIC_API_KEY=your_anthropic_key_here
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development
```bash
npm run dev
```

## ✅ Testing Checklist

### Voice Widget Appearance
- [ ] Purple floating button appears bottom-right on all pages
- [ ] Button shows status ring (Ready/Listening/Thinking/Speaking)
- [ ] Click to expand shows full interface panel

### Push-to-Talk Flow
1. **Start Recording**: Click "Hold to Talk" button
   - [ ] Status changes to "Listening..." (blue ring)
   - [ ] Recording indicator appears (red dot)

2. **Speak**: Say something like "Hello Durmah, what is contract law?"
   - [ ] Audio is being captured (check browser permissions)

3. **Stop Recording**: Click "Stop Recording" 
   - [ ] Status changes to "Processing..." (yellow ring)
   - [ ] Network tab shows POST to `/api/voice/transcribe`

4. **Transcription**: 
   - [ ] Your text appears in transcript area as "You: [your words]"
   - [ ] Status changes to "Thinking..." (purple ring)
   - [ ] Network tab shows POST to `/api/voice/chat`

5. **Response**:
   - [ ] Status changes to "Speaking..." (green ring)
   - [ ] Network tab shows GET to `/api/voice/tts?text=...`
   - [ ] **Audio plays** with Durmah's voice response
   - [ ] Response appears in transcript as "Durmah: [response]"

### Error Handling
- [ ] No microphone permission: Helpful error message
- [ ] API key missing: Clear configuration error
- [ ] Network issues: Retry suggestions
- [ ] Short/empty recordings: Hint to speak closer to mic

## 🔧 Troubleshooting

### "TTS key not found" Error
✅ **Fixed** - Now uses server proxy (`/api/voice/tts`)

### No audio/transcription
- Check browser console for `DURMAH_*` log messages
- Verify microphone permissions granted
- Check Network tab for API call responses

### Debug Console Commands
```javascript
// Test TTS proxy
fetch('/api/voice/tts?text=Hello world').then(r => console.log(r.status))

// Check audio support
console.log('WebM:', MediaRecorder.isTypeSupported('audio/webm;codecs=opus'))
```

## 🎯 Expected User Experience

1. **Natural Conversation**: Push-to-talk → speak → hear response
2. **Academic Integrity**: Refuses to write assignments, provides ethical guidance
3. **Durham Context**: Knows OSCOLA, module system, academic calendar
4. **Smooth Audio**: No overlapping playback, queued responses
5. **Visual Feedback**: Clear status indicators and transcript

## 🔄 Switching to Anthropic

To use Anthropic Claude instead of OpenAI:
```bash
# Add to .env.local
ANTHROPIC_API_KEY=your_key_here
```

The system will auto-detect and prefer Anthropic if configured.

## 📊 Architecture Overview

- **Frontend**: React hook (`useDurmahVoice`) + floating widget
- **Recording**: MediaRecorder → FormData → `/api/voice/transcribe` (Whisper)
- **Chat**: Session context → `/api/voice/chat` (OpenAI/Anthropic + guardrails)
- **TTS**: Server proxy `/api/voice/tts` → ElevenLabs → audio queue
- **Storage**: Supabase (`durmah_sessions` + `durmah_messages`)

## 🚀 Ready for Production

The system includes:
- ✅ Proper error handling and user feedback
- ✅ Academic integrity guardrails
- ✅ Secure API key management (server-side only)
- ✅ Session persistence and conversation memory
- ✅ TypeScript safety and ESLint compliance
- ✅ Responsive design and accessibility features

---
*Durmah Voice v1.0 - Your ethical AI study companion for Durham Law* 🎓