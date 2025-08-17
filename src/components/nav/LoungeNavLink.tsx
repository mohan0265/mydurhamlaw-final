// src/components/nav/LoungeNavLink.tsx
import React from "react";
import Link from "next/link";
import Tooltip from "./Tooltip";

interface LoungeNavLinkProps {
  href?: string;
  active?: boolean;
  className?: string;
}

export default function LoungeNavLink({ 
  href = "/lounge", 
  active = false, 
  className = "" 
}: LoungeNavLinkProps) {
  return (
    <Tooltip content="Your Premier Student Lounge — Connect. Share. Grow.">
      <Link 
        href={href}
        className={`group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold 
                   rounded-xl transition-all duration-300 transform hover:scale-105 
                   min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-offset-2 
                   focus:ring-yellow-400 hover:shadow-lg hover:shadow-purple-500/25 
                   ${active 
                     ? 'bg-gradient-to-r from-purple-600/30 to-yellow-500/30 shadow-lg shadow-purple-500/20' 
                     : 'bg-gradient-to-r from-purple-600/20 to-yellow-500/20 hover:from-purple-600/30 hover:to-yellow-500/30'
                   } 
                   ${className}`}
        aria-label="Go to Premier Student Lounge"
        role="button"
      >
        {/* Icon */}
        <span className="text-lg group-hover:animate-pulse transition-transform duration-300 
                         group-hover:scale-110" 
              aria-hidden="true">
          🏛️
        </span>
        
        {/* Text with gradient */}
        <span className={`bg-gradient-to-r from-purple-600 to-yellow-600 bg-clip-text 
                         text-transparent font-bold transition-all duration-300 
                         group-hover:from-purple-500 group-hover:to-yellow-500
                         ${active ? 'from-purple-500 to-yellow-500' : ''}`}>
          Premier Student Lounge
        </span>
        
        {/* Glow effect overlay */}
        <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 
                        to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity 
                        duration-300 pointer-events-none
                        ${active ? 'opacity-50' : ''}`}></div>
        
        {/* Premium shine effect */}
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-white/20 rounded-full 
                          opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
          <div className="absolute top-1 left-1 w-2 h-2 bg-white/30 rounded-full 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100"></div>
        </div>
      </Link>
    </Tooltip>
  );
}