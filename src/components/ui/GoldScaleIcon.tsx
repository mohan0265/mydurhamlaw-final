'use client'

import React from 'react'

interface GoldScaleIconProps {
  size?: number
  className?: string
}

// Optimized inline SVG component for the gold scale icon
export const GoldScaleIcon: React.FC<GoldScaleIconProps> = ({ 
  size = 40, 
  className = '' 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} drop-shadow-lg`}
    >
      {/* Gold Gradient Definition */}
      <defs>
        <linearGradient id={`goldGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:'#FFD700', stopOpacity:1}} />
          <stop offset="25%" style={{stopColor:'#FFA500', stopOpacity:1}} />
          <stop offset="50%" style={{stopColor:'#FF8C00', stopOpacity:1}} />
          <stop offset="75%" style={{stopColor:'#DAA520', stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:'#B8860B', stopOpacity:1}} />
        </linearGradient>
        <linearGradient id={`goldHighlight-${size}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{stopColor:'#FFFF99', stopOpacity:0.8}} />
          <stop offset="100%" style={{stopColor:'#FFD700', stopOpacity:0.2}} />
        </linearGradient>
        <filter id={`goldShadow-${size}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="1" stdDeviation="1" floodColor="#B8860B" floodOpacity="0.3"/>
        </filter>
      </defs>
      
      {/* Scale Base/Platform */}
      <rect x="8" y="32" width="32" height="4" rx="2" fill={`url(#goldGradient-${size})`} filter={`url(#goldShadow-${size})`} />
      <rect x="8" y="32" width="32" height="2" rx="1" fill={`url(#goldHighlight-${size})`} />
      
      {/* Scale Center Post */}
      <rect x="22" y="20" width="4" height="16" rx="2" fill={`url(#goldGradient-${size})`} />
      <rect x="22" y="20" width="2" height="16" rx="1" fill={`url(#goldHighlight-${size})`} />
      
      {/* Scale Beam */}
      <rect x="6" y="18" width="36" height="3" rx="1.5" fill={`url(#goldGradient-${size})`} />
      <rect x="6" y="18" width="36" height="1.5" rx="0.75" fill={`url(#goldHighlight-${size})`} />
      
      {/* Left Scale Pan */}
      <ellipse cx="12" cy="14" rx="8" ry="2" fill={`url(#goldGradient-${size})`} />
      <ellipse cx="12" cy="13.5" rx="8" ry="1" fill={`url(#goldHighlight-${size})`} />
      
      {/* Left Scale Pan Chains */}
      <rect x="11.5" y="12" width="1" height="6" fill={`url(#goldGradient-${size})`} />
      
      {/* Right Scale Pan */}
      <ellipse cx="36" cy="14" rx="8" ry="2" fill={`url(#goldGradient-${size})`} />
      <ellipse cx="36" cy="13.5" rx="8" ry="1" fill={`url(#goldHighlight-${size})`} />
      
      {/* Right Scale Pan Chains */}
      <rect x="35.5" y="12" width="1" height="6" fill={`url(#goldGradient-${size})`} />
      
      {/* Justice Symbol Elements */}
      <circle cx="12" cy="12" r="1" fill="#FFF8DC" opacity="0.8" />
      <circle cx="36" cy="12" r="1" fill="#FFF8DC" opacity="0.8" />
      
      {/* Base shadow for depth */}
      <ellipse cx="24" cy="38" rx="16" ry="2" fill="#B8860B" opacity="0.2" />
    </svg>
  )
}

export default GoldScaleIcon