import React from 'react';
import { X, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface PremiumLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  description?: string;
}

export const PremiumLockModal: React.FC<PremiumLockModalProps> = ({ 
  isOpen, 
  onClose,
  featureName = "AI Analysis",
  description = "Get intelligent insights, summaries, and legal connections for any article."
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200 border-2 border-purple-100">
        
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 p-8 text-center relative overflow-hidden">
          {/* Background sparkles/glow */}
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-500 rounded-full blur-[80px] opacity-20"></div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-white/20">
              <Lock className="w-8 h-8 text-purple-200" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Member Only Feature</h2>
            <p className="text-purple-200 text-sm">Unlock the full power of Durmah AI</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <h3 className="text-gray-900 font-semibold text-lg mb-2">{featureName}</h3>
            <p className="text-gray-500 leading-relaxed">{description}</p>
          </div>

          <div className="space-y-4">
            <Link href="/request-access" className="block">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 rounded-xl shadow-lg shadow-purple-200 font-semibold flex items-center justify-center gap-2 group">
                <Sparkles className="w-5 h-5" />
                Start Free Trial
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            
            <p className="text-center text-xs text-gray-400">
              No credit card required for trial
            </p>
            
            <div className="pt-4 border-t border-gray-100 mt-4 text-center">
              <span className="text-sm text-gray-500">Already a member? </span>
              <Link href="/login" className="text-sm font-semibold text-purple-600 hover:text-purple-700">
                Log in here
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
