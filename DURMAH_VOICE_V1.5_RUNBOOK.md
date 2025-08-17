# Durmah Voice v1.5 - Hands-Free Voice Buddy 🎙️✨

## 🚀 What's New in v1.5

### Minimal UI & Hands-Free Experience
- **No Chat Bubbles**: Clean, minimal interface during conversation
- **Auto-Start Listening**: Opens directly into listening mode
- **Continuous Mode**: VAD-based hands-free operation
- **Barge-In**: Tap mic while speaking to interrupt and start listening
- **Post-Chat Transcripts**: Full session review after ending chat

### Visual Enhancements
- **Pulsing Glow**: Blue pulse ring during listening
- **EQ Bars**: Animated bars when speaking
- **Audio Level**: Real-time visual feedback
- **Status Colors**: Blue (listening), Green (speaking), Purple (thinking)

## ⚙️ Environment Setup

### Required Variables
```bash
# Core APIs
OPENAI_API_KEY=sk-your_openai_key_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here
ELEVENLABS_VOICE_ID=Rachel

# v1.5 Configuration
NEXT_PUBLIC_DURMAH_MODE=continuous

# Optional VAD Tuning
DURMAH_VAD_THRESHOLD=0.01
DURMAH_VAD_HANGOVER=1500
```

## 🎯 New User Experience Flow

### 1. Widget Opening
- Click purple Durmah FAB
- Panel opens and **immediately starts listening**
- Blue pulsing glow indicates active listening
- No "Hold to Talk" button needed

### 2. Continuous Conversation
```
User speaks → VAD detects silence → Auto-transcribe → LLM response → TTS plays → Auto-rearm listening
```

### 3. Barge-In Feature
- While Durmah is speaking (green EQ bars)
- Tap the mic button to interrupt
- Immediately stops TTS and starts listening

### 4. End Session
- Click "End Chat" button
- **Transcript modal opens automatically**
- Shows full conversation with timestamps
- Options: Copy All, Save HTML, Delete Session

## 🔧 Technical Architecture

### Voice Activity Detection (VAD)
- Uses WebAudio API for real-time audio analysis
- RMS threshold detection with hangover timeout
- Automatically stops recording after silence
- Visual audio level feedback

### State Machine
```
idle → listening → processing → thinking → speaking → listening (loop)
```

### Barge-In System
- `queuePlayer.stopAll()` immediately halts TTS
- State transitions to listening without user action
- Seamless interruption of AI responses

### Animation System
- CSS keyframe animations for pulse and bars
- Tailwind classes: `animate-[pulseRing_1.6s_ease-out_infinite]`
- Responsive visual feedback based on audio levels

## ✅ Testing Checklist

### Basic Hands-Free Flow
- [ ] **Open Widget**: Click FAB → Panel opens with blue pulse
- [ ] **Auto-Listen**: No button press needed, immediately listening
- [ ] **Speak**: Say "Hello Durmah, explain contract law"
- [ ] **VAD Detection**: Stops recording after 1.5s silence
- [ ] **Processing**: Yellow status, "Processing..."
- [ ] **Thinking**: Purple status, "Thinking..."  
- [ ] **Speaking**: Green EQ bars, audio plays
- [ ] **Auto-Rearm**: Returns to blue listening state

### Barge-In Testing
- [ ] While Durmah is speaking (green EQ bars)
- [ ] Tap the central mic button
- [ ] TTS immediately stops
- [ ] Status changes to blue "Listening..."
- [ ] Can speak new question immediately

### Transcript Modal
- [ ] Click "End Chat" → Modal opens automatically
- [ ] Shows timestamped conversation history
- [ ] "Copy All" works (clipboard)
- [ ] "Save HTML" downloads file
- [ ] "Delete Session" removes from database
- [ ] Close modal returns to main app

### Visual Feedback
- [ ] **Blue Pulse**: During listening state
- [ ] **Audio Level**: Bar fills based on voice volume
- [ ] **EQ Bars**: Three animated bars when speaking
- [ ] **Status Colors**: Correct colors for each state
- [ ] **Smooth Transitions**: No jarring state changes

### Error Handling
- [ ] No microphone access: Clear error message
- [ ] Network issues: Retry suggestions
- [ ] Empty transcription: Helpful hints
- [ ] VAD not detecting: Audio level shows activity

## 🎨 UI Components

### Floating FAB
- Purple gradient with Durmah logo
- Status-based color changes
- Scale animation on hover
- Pulse ring during listening

### Voice Panel
```
┌─ Header: Durmah · Status Dot · Status Text · Settings ─┐
│                                                        │
│               ⭕ Large Mic Button                      │
│                 (Blue pulse when listening)            │
│                 (EQ bars when speaking)               │
│                                                        │
│             "Hands-free mode. Say 'Durmah?'          │
│              to wake if idle."                         │
│                                                        │
└─              [End Chat]                              ─┘
```

### Transcript Modal
- Full-screen overlay with conversation history
- Timestamped messages with role indicators
- Export and management actions
- Clean, readable typography

## 🔄 Migration from v1.0

### Breaking Changes
- `startRecording`/`stopRecording` → `startContinuous`/`stopContinuous`
- No chat bubbles during session
- Transcript only shown post-chat
- Auto-listening behavior

### Backward Compatibility
- Push mode still available via `NEXT_PUBLIC_DURMAH_MODE=push`
- All existing API endpoints remain functional
- Database schema unchanged

## 🚀 Production Deployment

### Environment
```bash
# Set continuous mode
NEXT_PUBLIC_DURMAH_MODE=continuous

# Tune VAD for your environment
DURMAH_VAD_THRESHOLD=0.01  # Lower = more sensitive
DURMAH_VAD_HANGOVER=1500   # ms silence before stopping
```

### Performance Notes
- VAD runs on animation frames (60fps)
- Minimal CPU impact with optimized RMS calculation
- Audio context cleanup on widget close
- Memory management for long conversations

---

## 🎉 Ready to Ship!

Durmah Voice v1.5 transforms the experience into a true **hands-free voice companion**:

✅ **Minimal** - Clean UI without distracting chat bubbles  
✅ **Hands-Free** - Auto-listen, VAD, continuous conversation  
✅ **Responsive** - Visual feedback with pulsing and animations  
✅ **Interruptible** - Barge-in functionality for natural flow  
✅ **Comprehensive** - Full transcript review after sessions  

*The purple circle now truly listens and responds like a natural voice buddy!* 🟣✨🎙️