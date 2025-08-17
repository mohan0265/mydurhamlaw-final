import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Mic, X, Settings, HelpCircle } from 'lucide-react';
import { useDurmah } from '@/context/DurmahContext';
import { useDurmahVoiceMode } from '@/lib/hooks/useDurmahVoiceMode';
import { ttsController } from '@/lib/voice/ttsController';

const DurmahVoiceDock: React.FC = () => {
  const { closeVoiceMode, displayMessages, openTranscript, pushMessage } = useDurmah();
  const [isMinimized, setIsMinimized] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragControls = useDragControls();
  const dockRef = useRef<HTMLDivElement>(null);
  const [volume, setVolume] = useState(0);

  const [voicePrefs, setVoicePrefs] = useState({
    voiceId: '',
    rate: 1,
    gapMs: 350,
    shortAnswers: true,
  });

  useEffect(() => {
    const savedPrefs = localStorage.getItem('durmah_voice_prefs_v1');
    if (savedPrefs) {
      setVoicePrefs(JSON.parse(savedPrefs));
    }
  }, []);

  const voiceMode = useDurmahVoiceMode({
    onError: (error) => console.error('[DurmahVoiceDock] Voice mode error:', error),
    onVolumeChange: (v) => setVolume(v),
  });

  useEffect(() => {
    const savedPosition = localStorage.getItem('durmah_dock_v1');
    if (savedPosition) {
        const pos = JSON.parse(savedPosition);
        setPosition(pos);
        setIsMinimized(pos.minimized);
    }
  }, []);

  const handleEndChat = useCallback(() => {
    console.info('[Durmah] end_chat');
    voiceMode.stopVoiceConversation();
    closeVoiceMode();
    if (displayMessages.length > 0) {
      console.info('[Durmah] transcript_opened');
      openTranscript();
    }
  }, [voiceMode, closeVoiceMode, displayMessages, openTranscript]);

  const handleHoldToTalk = (e: React.PointerEvent) => {
    e.preventDefault();
    console.info('[Durmah] PTT start');
    voiceMode.startVoiceConversation();
  };

  const handleReleaseTalk = (e: React.PointerEvent) => {
    e.preventDefault();
    console.info('[Durmah] PTT stop');
    voiceMode.stopVoiceConversation();
  };

  const getStatusText = () => {
    if (voiceMode.isProcessing) return 'Thinking...';
    if (voiceMode.isSpeaking) return 'Speaking...';
    if (voiceMode.isRunning()) return 'Listening...';
    return 'Ready';
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === ' ') {
        e.preventDefault();
        if(!voiceMode.isRunning()) {
            console.info('[Durmah] shortcut_used:toggle_mic');
            voiceMode.startVoiceConversation();
        }
    }
    if (e.key === 'm') {
        voiceMode.isRunning() ? voiceMode.stopVoiceConversation() : voiceMode.startVoiceConversation();
    }
    if (e.key === 'Escape') {
        console.info('[Durmah] shortcut_used:minimize_close');
        isMinimized ? handleEndChat() : setIsMinimized(true);
    }
    if (e.key.toLowerCase() === 'c') {
        console.info('[Durmah] shortcut_used:continue');
        pushMessage({role: 'user', content: 'Continue'});
    }
    if (e.key === '/') {
        setShowHelp(true);
    }
  }, [handleEndChat, voiceMode, isMinimized, pushMessage]);

  useEffect(() => {
    window.addEventListener('keyup', (e) => {
        if(e.key === ' ') {
            voiceMode.stopVoiceConversation();
        }
    });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', (e) => {
            if(e.key === ' ') {
                voiceMode.stopVoiceConversation();
            }
        });
    }
  }, [handleKeyDown, voiceMode]);

  return (
    <AnimatePresence>
      <motion.div
        ref={dockRef}
        drag
        dragListener={false}
        dragControls={dragControls}
        onDragStart={() => console.info('[Durmah] dock_drag_start')}
        onDragEnd={(_, info) => {
            console.info('[Durmah] dock_drag_end');
            const newPos = { x: info.offset.x, y: info.offset.y, minimized: isMinimized };
            setPosition(newPos);
            localStorage.setItem('durmah_dock_v1', JSON.stringify(newPos));
        }}
        style={{ x: position.x, y: position.y }}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className={`fixed bottom-4 right-4 z-[9999] rounded-2xl shadow-2xl bg-slate-900/80 backdrop-blur-lg text-white transition-all duration-300 ${isMinimized ? 'w-20 h-20 rounded-full' : 'w-[420px] h-[560px]'}`}>
        
        {isMinimized ? (
          <motion.button
              onPointerDown={handleHoldToTalk}
              onPointerUp={handleReleaseTalk}
              className="w-full h-full rounded-full flex items-center justify-center bg-purple-600">
              <Mic className="w-8 h-8" />
            </motion.button>
        ) : (
          <div className="flex flex-col h-full">
            {/* Header */}
            <motion.div onPointerDown={(e) => dragControls.start(e)} className="flex items-center justify-between p-4 border-b border-white/10 cursor-grab active:cursor-grabbing">
              <h2 className="font-bold text-lg">Durmah Voice</h2>
              <div className="flex items-center gap-2">
                <motion.button onClick={() => setShowSettings(true)} className="p-2 rounded-full hover:bg-white/20"><Settings className="w-5 h-5" /></motion.button>
                <motion.button onClick={() => setIsMinimized(true)} className="p-2 rounded-full hover:bg-white/20"><X className="w-5 h-5" /></motion.button>
              </div>
            </motion.div>

            {/* Body */}
            <div className="flex-grow flex flex-col items-center justify-center">
                <motion.div
                    className={`w-48 h-48 rounded-full shadow-2xl bg-gradient-to-br from-purple-500 to-indigo-600`}
                    animate={{
                        scale: voiceMode.isRunning() ? 1 + volume / 100 : 1,
                        filter: voiceMode.isSpeaking ? 'brightness(1.2)' : 'brightness(1)'
                    }}
                    transition={{ duration: 0.1 }}
                />
                <p className="mt-8 text-xl font-medium">{getStatusText()}</p>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 flex justify-between items-center">
                <motion.button 
                    onPointerDown={handleHoldToTalk}
                    onPointerUp={handleReleaseTalk}
                    className={`p-4 rounded-full text-white ${voiceMode.isRunning() ? 'bg-red-500' : 'bg-green-500'}`}>
                    <Mic className="w-6 h-6" />
                </motion.button>
                <motion.button onClick={handleEndChat} className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600">
                    End Chat
                </motion.button>
                <motion.button onClick={() => setShowHelp(!showHelp)} className="p-2 rounded-full hover:bg-white/20"><HelpCircle className="w-5 h-5" /></motion.button>
            </div>
          </div>
        )}
        {showHelp && <div className="absolute bottom-20 right-4 p-4 bg-slate-800 rounded-lg shadow-lg text-sm">
            <p><kbd>Space</kbd> - Hold to talk</p>
            <p><kbd>M</kbd> - Toggle Mic</p>
            <p><kbd>Esc</kbd> - Minimize/Close</p>
            <p><kbd>C</kbd> - Continue</p>
            <p><kbd>/</kbd> - Show Help</p>
            </div>}
        {showSettings && <div className="absolute inset-0 bg-slate-900/90 p-4">
            <h3 className="text-lg font-bold mb-4">Settings</h3>
            {/* Settings form here */}
            <button onClick={() => setShowSettings(false)}>Close</button>
            </div>}
      </motion.div>
    </AnimatePresence>
  );
};

export default DurmahVoiceDock;
