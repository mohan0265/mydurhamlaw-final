'use client'

import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { Clock } from 'lucide-react'

interface UKTimeDisplayProps {
  className?: string
  showLabel?: boolean
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'inline' | 'card'
}

/**
 * UKTimeDisplay - Shows current UK time (GMT/BST) that updates every minute
 * Automatically handles GMT (winter) and BST (summer) transitions
 */
export const UKTimeDisplay: React.FC<UKTimeDisplayProps> = ({
  className = '',
  showLabel = true,
  showIcon = true,
  size = 'md',
  variant = 'inline'
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [isClient, setIsClient] = useState(false)

  // Handle client-side rendering
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Update time every minute
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date())
    }

    // Update immediately
    updateTime()

    // Set up interval to update every minute
    const interval = setInterval(updateTime, 60000)

    return () => clearInterval(interval)
  }, [])

  // Don't render on server to avoid hydration mismatch
  if (!isClient) {
    return null
  }

  const ukTimeZone = 'Europe/London'
  
  // Format the time in UK timezone (automatically handles GMT/BST)
  const formattedTime = formatInTimeZone(currentTime, ukTimeZone, 'HH:mm')
  const formattedDate = formatInTimeZone(currentTime, ukTimeZone, 'EEE, dd MMM yyyy')
  
  // Determine if we're in GMT or BST
  const isDST = formatInTimeZone(currentTime, ukTimeZone, 'zzz').includes('BST') || 
                formatInTimeZone(currentTime, ukTimeZone, 'zzz').includes('+01')
  const timeZoneLabel = isDST ? 'BST' : 'GMT'

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          time: 'text-sm',
          date: 'text-xs',
          icon: 'w-3 h-3'
        }
      case 'lg':
        return {
          time: 'text-lg',
          date: 'text-sm',
          icon: 'w-5 h-5'
        }
      default:
        return {
          time: 'text-base',
          date: 'text-xs',
          icon: 'w-4 h-4'
        }
    }
  }

  const sizeClasses = getSizeClasses()

  if (variant === 'card') {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-3 shadow-sm ${className}`}>
        <div className="flex items-center space-x-2">
          {showIcon && <Clock className={`${sizeClasses.icon} text-teal-600`} />}
          <div>
            {showLabel && (
              <div className="text-xs text-gray-500 font-medium">Current UK Time</div>
            )}
            <div className={`${sizeClasses.time} font-bold text-gray-900`}>
              {formattedTime} {timeZoneLabel}
            </div>
            <div className={`${sizeClasses.date} text-gray-600`}>
              {formattedDate}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showIcon && <Clock className={`${sizeClasses.icon} text-current opacity-75`} />}
      <div className="flex flex-col">
        {showLabel && (
          <span className="text-xs opacity-75 font-medium">Current UK Time</span>
        )}
        <div className="flex items-center space-x-2">
          <span className={`${sizeClasses.time} font-bold text-current`}>
            {formattedTime}
          </span>
          <span className={`${sizeClasses.date} text-current opacity-75`}>
            {timeZoneLabel}
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * Utility function to get current UK time as a formatted string
 * Used for backend operations and logging
 */
export const getCurrentUKTime = (): string => {
  const now = new Date()
  return formatInTimeZone(now, 'Europe/London', 'yyyy-MM-dd HH:mm:ss zzz')
}

/**
 * Utility function to get current UK time zone (GMT or BST)
 */
export const getCurrentUKTimeZone = (): 'GMT' | 'BST' => {
  const now = new Date()
  const isDST = formatInTimeZone(now, 'Europe/London', 'zzz').includes('BST') || 
                formatInTimeZone(now, 'Europe/London', 'zzz').includes('+01')
  return isDST ? 'BST' : 'GMT'
}

export default UKTimeDisplay