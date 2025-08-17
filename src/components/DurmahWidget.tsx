import React, { useCallback, useContext } from 'react';
import { motion } from 'framer-motion';
import { useDurmah } from '@/context/DurmahContext';
import DurmahTranscriptModal from './DurmahTranscriptModal';
import DurmahVoiceDock from './voice/DurmahVoiceDock';
import { DurmahIcon } from './ui/DurmahLogo';
import { AuthContext } from '@/lib/supabase/AuthContext';

const DurmahWidget: React.FC = () => {
  const { user } = useContext(AuthContext) || {};
  const { state, isOpen, isVoiceModeOpen, openVoiceMode } = useDurmah();

  const handleOpenVoiceMode = useCallback(() => {
    if (!user) {
      // Gate when logged out
      alert('Please sign in to use the Durmah voice buddy.');
      return;
    }
    openVoiceMode();
  }, [user, openVoiceMode]);

  const gradient =
    state === 'listening'
      ? 'bg-gradient-to-br from-green-500 to-emerald-600'
      : state === 'speaking'
      ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
      : 'bg-gradient-to-br from-purple-600 to-indigo-700';

  return (
    <div>
      {!isOpen && !isVoiceModeOpen && (
        <div className="fixed bottom-6 right-6 z-[9997]">
          <motion.button
            onClick={handleOpenVoiceMode}
            whileHover={{ scale: 1.05 }}
            className={`flex flex-col items-center justify-center p-4 min-w-[120px] min-h-[80px] rounded-2xl shadow-2xl text-white font-bold transition-all duration-300 ${gradient}`}
          >
            <DurmahIcon size="lg" className="mb-2" />
            <div className="text-xs text-center">
              <div>Durmah</div>
              <div className="text-white/80">{user ? 'Legal Voice Buddy' : 'Sign in to use voice'}</div>
            </div>
          </motion.button>
        </div>
      )}

      {/* Only render voice dock if user is logged in */}
      {user && (
        <div data-testid="durmah-voice-dock" style={{ display: isVoiceModeOpen ? 'block' : 'none' }}>
          <DurmahVoiceDock />
        </div>
      )}

      <DurmahTranscriptModal />
    </div>
  );
};

export default DurmahWidget;
