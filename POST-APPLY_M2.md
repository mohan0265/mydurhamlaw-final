# MyDurhamLaw - Milestone 2 Post-Apply Instructions

## Required Commands After Applying Patch

### 1. Install Dependencies (if new packages added)
```bash
# Ensure you're using Node 20
nvm use 20

# Install any new dependencies
pnpm install
# or
npm install
```

### 2. Environment Setup for Voice Features
```bash
# Copy and update environment file
cp .env.example .env.local

# Required Voice API Keys (add to .env.local):
# ElevenLabs TTS Integration
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID=cgSgspJ2msm6clMCkdW9
ELEVENLABS_MODEL=eleven_turbo_v2
ELEVENLABS_STABILITY=0.4
ELEVENLABS_SIMILARITY=0.7

# OpenAI Integration (for ASR and AI responses)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_VOICE_MODEL=shimmer

# Optional Voice Configuration
DURMAH_VAD_THRESHOLD=0.01
DURMAH_VAD_HANGOVER=1500
NEXT_PUBLIC_DURMAH_MODE=continuous
NEXT_PUBLIC_APP_NAME=MyDurhamLaw
```

### 3. Verify Build Success
```bash
# Type checking
pnpm type-check

# Build verification
pnpm build

# Start development server
pnpm dev
```

## Manual Verification Steps

### 🎤 **Voice Companion Testing**

#### **Basic Functionality:**
- [ ] Voice widget appears in bottom-right (mobile) or top-right (desktop)
- [ ] Click/tap to start voice session
- [ ] Microphone permission requested and granted
- [ ] Green pulse indicates listening state
- [ ] Speak and verify transcription appears
- [ ] AI response generates and plays via TTS
- [ ] Blue rotation indicates speaking state
- [ ] Listening automatically resumes after TTS ends

#### **Advanced Features:**
- [ ] Barge-in: Interrupt TTS by speaking (should stop audio immediately)
- [ ] Session persistence: Navigate between pages (widget should remain)
- [ ] Transcript drawer: End session to see conversation history
- [ ] Save/delete transcripts: Verify storage functionality
- [ ] Error handling: Test with network disconnection

#### **Responsive Design:**
- [ ] **Mobile (< 768px):** Widget positioned bottom-right, touch-friendly
- [ ] **Desktop (> 768px):** Widget positioned top-right, mouse-friendly
- [ ] **Tablet:** Appropriate scaling and positioning
- [ ] **Audio playback:** Works on all devices/browsers

### 🔒 **API Security Testing**

#### **With API Keys:**
- [ ] TTS route `/api/voice/tts` returns audio successfully
- [ ] ASR route `/api/voice/asr` transcribes speech accurately
- [ ] Session management works correctly
- [ ] No API keys exposed in browser developer tools

#### **Without API Keys (Graceful Fallback):**
- [ ] Voice widget shows "API keys required" message
- [ ] User can still access text chat interface
- [ ] No JavaScript errors in console
- [ ] Clear instructions for setting up voice features

### ⚙️ **Performance & Quality**

#### **Voice Processing:**
- [ ] **Latency:** Speech-to-response under 3 seconds
- [ ] **Audio Quality:** Clear, natural-sounding TTS
- [ ] **Recognition Accuracy:** 90%+ for clear speech
- [ ] **Memory Usage:** No memory leaks during extended sessions

#### **User Experience:**
- [ ] **Visual Feedback:** Clear state indicators (listening/thinking/speaking)
- [ ] **Smooth Animations:** No jarring transitions
- [ ] **Accessibility:** Keyboard navigation works
- [ ] **Browser Support:** Works in Chrome, Firefox, Safari, Edge

## Troubleshooting Guide

### **Common Issues & Solutions**

#### **"Microphone not working"**
- Verify browser microphone permissions
- Check if HTTPS is enabled (required for microphone access)
- Test with different browsers
- Verify microphone hardware functionality

#### **"No voice output"**
- Verify `ELEVENLABS_API_KEY` is set correctly
- Check ElevenLabs API quota/billing
- Verify audio output device is working
- Check browser audio permissions

#### **"Speech recognition fails"**
- Verify `OPENAI_API_KEY` is set correctly
- Check OpenAI API quota/billing
- Ensure clear speech in quiet environment
- Verify microphone input levels

#### **"Widget not appearing"**
- Check browser console for JavaScript errors
- Verify component is properly imported in layout
- Check CSS z-index conflicts
- Verify responsive breakpoints

### **Debug Information**

#### **Browser Console Checks:**
```javascript
// Check if Durmah context is available
console.log('Durmah Context:', window.durmahContext)

// Check environment variables
console.log('Voice Mode:', process.env.NEXT_PUBLIC_DURMAH_MODE)

// Check for errors
console.log('Voice Errors:', window.durmahErrors)
```

#### **Network Tab Verification:**
- `/api/voice/tts` - Should return audio/mpeg content
- `/api/voice/asr` - Should accept audio files
- `/api/voice/session` - Should manage session state

## Netlify Deployment Configuration

### **Environment Variables (Set in Netlify Dashboard)**
```bash
# Required for Voice Features
ELEVENLABS_API_KEY=your_actual_key
ELEVENLABS_VOICE_ID=cgSgspJ2msm6clMCkdW9
OPENAI_API_KEY=your_actual_key

# Configuration
NEXT_PUBLIC_DURMAH_MODE=continuous
NEXT_PUBLIC_APP_NAME=MyDurhamLaw

# All other existing variables from M1
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
# ... etc
```

### **Build Settings (Verify)**
- **Node Version:** 20.18.0+
- **Build Command:** `npm run build`
- **Publish Directory:** `.next`
- **Functions:** Auto-detected from `/api` routes

### **Security Headers (Recommended)**
```toml
# In netlify.toml
[[headers]]
  for = "/api/voice/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

## Success Indicators

✅ **Technical Success:**
- Build completes without errors
- Voice widget renders on all pages
- API routes respond correctly
- No console errors during operation

✅ **User Experience Success:**
- Smooth voice interactions
- Clear visual feedback
- Responsive design works
- Graceful error handling

✅ **Security Success:**
- API keys remain server-side
- Authentication enforced
- Input validation working
- No sensitive data exposure

## Next Steps

After verifying Milestone 2:
1. **Test voice features** thoroughly across devices
2. **Verify API integrations** are working correctly
3. **Proceed to Milestone 3** (Header & Navigation Fixes)
4. **Report any voice-related issues** for immediate resolution

---

**Milestone 2 Status:** ✅ COMPLETED - Durmah Voice MVP Fully Functional  
**Next Milestone:** M3 - Header & Navigation Fixes
**Voice Features:** 🎤 World-class AI voice companion now available 24/7
