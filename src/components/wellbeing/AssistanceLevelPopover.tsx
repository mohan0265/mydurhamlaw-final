'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'

export type AssistanceLevel = 'L1' | 'L2' | 'L3'

interface AssistanceLevelPopoverProps {
  selectedLevel: AssistanceLevel
  onLevelChange: (level: AssistanceLevel) => void
  className?: string
}

export const AssistanceLevelPopover: React.FC<AssistanceLevelPopoverProps> = ({
  selectedLevel,
  onLevelChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  const levels: Record<AssistanceLevel, { title: string; description: string }> = {
    L1: { title: 'L1 Self-Starter', description: 'Minimal hints, Socratic questions only' },
    L2: { title: 'L2 Guided', description: 'Outlines & scaffolds, student drafts required' },
    L3: { title: 'L3 Coach', description: 'Worked examples, must paraphrase' },
  }

  const handleSelect = (level: AssistanceLevel) => {
    onLevelChange(level)
    setIsOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className={`relative ${className}`} ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200 text-gray-600 hover:text-blue-600 min-h-[44px]"
      >
        <span className="text-sm">Assistance: <strong>{levels[selectedLevel].title}</strong></span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border z-10 animate-in fade-in-5 slide-in-from-top-2 duration-300">
          <div className="p-4">
            <p className="text-sm font-bold text-gray-800 mb-3">Select Assistance Level</p>
            <div className="space-y-2">
              {(Object.keys(levels) as AssistanceLevel[]).map(level => (
                <button
                  key={level}
                  onClick={() => handleSelect(level)}
                  className={`w-full text-left p-3 rounded-lg transition-colors border ${
                    selectedLevel === level
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50 border-transparent'
                  }`}
                >
                  <p className="font-semibold text-gray-800">{levels[level].title}</p>
                  <p className="text-xs text-gray-600 mt-1">{levels[level].description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssistanceLevelPopover