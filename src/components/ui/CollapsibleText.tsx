'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface CollapsibleTextProps {
  children: React.ReactNode
  maxLines?: number
  showMoreText?: string
  showLessText?: string
  className?: string
  buttonClassName?: string
  gradientClassName?: string
  disabled?: boolean
}

export const CollapsibleText: React.FC<CollapsibleTextProps> = ({
  children,
  maxLines = 3,
  showMoreText = 'Show More',
  showLessText = 'Show Less',
  className = '',
  buttonClassName = '',
  gradientClassName = '',
  disabled = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [shouldShowToggle, setShouldShowToggle] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (contentRef.current && !disabled) {
      const lineHeight = parseFloat(getComputedStyle(contentRef.current).lineHeight)
      const maxHeight = lineHeight * maxLines
      const actualHeight = contentRef.current.scrollHeight
      
      setShouldShowToggle(actualHeight > maxHeight)
    }
  }, [children, maxLines, disabled])

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded)
  }

  if (disabled || !shouldShowToggle) {
    return <div className={className}>{children}</div>
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={contentRef}
        className={`overflow-hidden transition-all duration-300 ${
          isExpanded ? 'max-h-none' : ''
        }`}
        style={
          !isExpanded
            ? {
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: maxLines,
                overflow: 'hidden'
              }
            : {}
        }
      >
        {children}
      </div>
      
      {!isExpanded && shouldShowToggle && (
        <div
          className={`absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none ${gradientClassName}`}
        />
      )}
      
      {shouldShowToggle && (
        <button
          onClick={toggleExpansion}
          className={`mt-2 flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors min-h-[44px] py-2 px-2 -mx-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${buttonClassName}`}
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              {showLessText}
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              {showMoreText}
            </>
          )}
        </button>
      )}
    </div>
  )
}

export default CollapsibleText