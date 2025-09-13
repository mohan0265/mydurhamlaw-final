'use client'

import React from 'react'

interface BrandTitleProps {
  variant?: 'light' | 'dark'
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span' | 'div'
}

/**
 * Reusable BrandTitle component for consistent MyDurhamLaw styling
 * 
 * Usage:
 * - variant="light" for white/light backgrounds (black My/Law, teal Durham)
 * - variant="dark" for dark backgrounds (white My/Law, teal Durham)
 */
export const BrandTitle: React.FC<BrandTitleProps> = ({
  variant = 'light',
  size = 'md',
  className = '',
  as: Component = 'span'
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm'
      case 'md':
        return 'text-base'
      case 'lg':
        return 'text-lg'
      case 'xl':
        return 'text-xl'
      case '2xl':
        return 'text-2xl'
      case '3xl':
        return 'text-3xl'
      case '4xl':
        return 'text-4xl'
      default:
        return 'text-base'
    }
  }

  const getColorClasses = () => {
    if (variant === 'dark') {
      return {
        my: 'text-white',
        durham: 'text-teal-400',
        law: 'text-white'
      }
    } else {
      return {
        my: 'text-black',
        durham: 'text-teal-500', // Using teal-500 for better contrast on light backgrounds
        law: 'text-black'
      }
    }
  }

  const sizeClasses = getSizeClasses()
  const colorClasses = getColorClasses()

  return (
    <Component className={`${sizeClasses} font-bold tracking-wide ${className}`}>
      <span className={colorClasses.my}>My</span>
      <span className={colorClasses.durham}>Durham</span>
      <span className={colorClasses.law}>Law</span>
    </Component>
  )
}

export default BrandTitle