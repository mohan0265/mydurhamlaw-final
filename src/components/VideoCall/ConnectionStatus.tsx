import React from 'react';

interface ConnectionStatusProps {
  isConnected: boolean;
  duration: number;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected, duration }) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-2 text-sm text-white">
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
      <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
      {isConnected && duration > 0 && (
        <span className="text-gray-300">• {formatDuration(duration)}</span>
      )}
    </div>
  );
};