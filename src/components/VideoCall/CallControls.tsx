import React from 'react';
import { Mic, MicOff, Video, VideoOff, Monitor, MessageCircle, Phone } from 'lucide-react';

interface CallControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  showChat: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onEndCall: () => void;
}

export const CallControls: React.FC<CallControlsProps> = ({
  isMuted,
  isVideoOff,
  isScreenSharing,
  showChat,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  onEndCall
}) => {
  return (
    <div className="bg-gray-800 p-4 flex justify-center items-center space-x-4">
      {/* Mute Button */}
      <button
        onClick={onToggleMute}
        className={`p-3 rounded-full transition-colors ${
          isMuted 
            ? 'bg-red-600 hover:bg-red-700' 
            : 'bg-gray-600 hover:bg-gray-700'
        }`}
      >
        {isMuted ? <MicOff className="text-white" size={20} /> : <Mic className="text-white" size={20} />}
      </button>

      {/* Video Button */}
      <button
        onClick={onToggleVideo}
        className={`p-3 rounded-full transition-colors ${
          isVideoOff 
            ? 'bg-red-600 hover:bg-red-700' 
            : 'bg-gray-600 hover:bg-gray-700'
        }`}
      >
        {isVideoOff ? <VideoOff className="text-white" size={20} /> : <Video className="text-white" size={20} />}
      </button>

      {/* Screen Share Button */}
      <button
        onClick={onToggleScreenShare}
        className={`p-3 rounded-full transition-colors ${
          isScreenSharing 
            ? 'bg-green-600 hover:bg-green-700' 
            : 'bg-gray-600 hover:bg-gray-700'
        }`}
      >
        <Monitor className="text-white" size={20} />
      </button>

      {/* Chat Button */}
      <button
        onClick={onToggleChat}
        className={`p-3 rounded-full transition-colors ${
          showChat 
            ? 'bg-blue-600 hover:bg-blue-700' 
            : 'bg-gray-600 hover:bg-gray-700'
        }`}
      >
        <MessageCircle className="text-white" size={20} />
      </button>

      {/* End Call Button */}
      <button
        onClick={onEndCall}
        className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
      >
        <Phone className="text-white transform rotate-[135deg]" size={20} />
      </button>
    </div>
  );
};