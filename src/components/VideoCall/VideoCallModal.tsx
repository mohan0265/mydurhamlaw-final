import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Video, VideoOff, Monitor, Phone } from 'lucide-react';
import { CallControls } from './CallControls';
import { ChatSidebar } from './ChatSidebar';
import { ConnectionStatus } from './ConnectionStatus';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  lovedOneName: string;
  lovedOneId: string;
  isInitiator: boolean;
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  isOpen,
  onClose,
  lovedOneName,
  lovedOneId,
  isInitiator
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // Initialize video call
      initializeCall();
    }
    return () => {
      // Cleanup
      cleanupCall();
    };
  }, [isOpen]);

  const initializeCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // TODO: Initialize WebRTC connection
      setIsConnected(true);
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const cleanupCall = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleEndCall = () => {
    cleanupCall();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 rounded-lg overflow-hidden w-full max-w-6xl h-full max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="bg-purple-600 p-4 flex justify-between items-center">
            <div>
              <h2 className="text-white text-xl font-semibold">Video Call with {lovedOneName}</h2>
              <ConnectionStatus isConnected={isConnected} duration={callDuration} />
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Video Area */}
          <div className="flex-1 flex">
            <div className="flex-1 relative bg-black">
              {/* Remote Video */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              
              {/* Local Video (Picture-in-Picture) */}
              <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Study Mode Indicator */}
              {isScreenSharing && (
                <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm">
                  📚 Study Together Mode
                </div>
              )}
            </div>

            {/* Chat Sidebar */}
            {showChat && (
              <ChatSidebar
                lovedOneName={lovedOneName}
                onClose={() => setShowChat(false)}
              />
            )}
          </div>

          {/* Call Controls */}
          <CallControls
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            isScreenSharing={isScreenSharing}
            showChat={showChat}
            onToggleMute={() => setIsMuted(!isMuted)}
            onToggleVideo={() => setIsVideoOff(!isVideoOff)}
            onToggleScreenShare={() => setIsScreenSharing(!isScreenSharing)}
            onToggleChat={() => setShowChat(!showChat)}
            onEndCall={handleEndCall}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};