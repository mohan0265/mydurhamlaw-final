// src/components/lounge/FirstPostCelebration.tsx
import React, { useEffect, useState } from "react";

interface FirstPostCelebrationProps {
  show: boolean;
  onComplete: () => void;
}

export default function FirstPostCelebration({ show, onComplete }: FirstPostCelebrationProps) {
  const [stage, setStage] = useState<'hidden' | 'entering' | 'celebrating' | 'exiting'>('hidden');

  useEffect(() => {
    if (show && stage === 'hidden') {
      setStage('entering');
      
      // Animation sequence
      const timer1 = setTimeout(() => setStage('celebrating'), 200);
      const timer2 = setTimeout(() => setStage('exiting'), 3000);
      const timer3 = setTimeout(() => {
        setStage('hidden');
        onComplete();
      }, 3500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [show, stage, onComplete]);

  if (stage === 'hidden') return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none transition-all duration-500 ${
      stage === 'entering' ? 'opacity-0' : 
      stage === 'celebrating' ? 'opacity-100' : 
      'opacity-0'
    }`}>
      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-sm"></div>
      
      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 50 }, (_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 rounded-full animate-bounce opacity-80 ${
              i % 6 === 0 ? 'bg-purple-400' :
              i % 6 === 1 ? 'bg-pink-400' :
              i % 6 === 2 ? 'bg-blue-400' :
              i % 6 === 3 ? 'bg-yellow-400' :
              i % 6 === 4 ? 'bg-green-400' :
              'bg-red-400'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Main celebration card */}
      <div className={`relative bg-white rounded-3xl shadow-2xl border border-purple-200 p-8 max-w-md mx-4 transform transition-all duration-700 ${
        stage === 'celebrating' ? 'scale-100 rotate-0' : 'scale-75 rotate-3'
      }`}>
        <div className="text-center">
          {/* Animated emoji */}
          <div className={`text-6xl mb-4 transition-transform duration-1000 ${
            stage === 'celebrating' ? 'animate-bounce' : ''
          }`}>
            🎉
          </div>
          
          {/* Celebration text */}
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            Welcome to the Lounge!
          </h2>
          
          <p className="text-gray-600 mb-4 leading-relaxed">
            Congratulations on your first post! You&apos;ve just joined a community of brilliant legal minds. 
            Your voice matters here. 💜
          </p>
          
          {/* Achievement badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-full px-4 py-2">
            <span className="text-lg">🏆</span>
            <span className="text-sm font-semibold text-purple-700">First Post Achievement</span>
          </div>
          
          {/* Sparkle effects */}
          <div className="absolute -top-2 -left-2 text-yellow-400 animate-pulse text-2xl">✨</div>
          <div className="absolute -top-1 -right-3 text-yellow-400 animate-pulse text-xl" style={{ animationDelay: '0.5s' }}>⭐</div>
          <div className="absolute -bottom-2 -left-1 text-yellow-400 animate-pulse text-lg" style={{ animationDelay: '1s' }}>💫</div>
          <div className="absolute -bottom-1 -right-2 text-yellow-400 animate-pulse text-xl" style={{ animationDelay: '1.5s' }}>🌟</div>
        </div>
      </div>
    </div>
  );
}