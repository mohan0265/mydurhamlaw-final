'use client'

import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  gradient?: boolean
  style?: React.CSSProperties
}

export function Card({ children, className = '', hover = false, gradient = false, style }: CardProps) {
  return (
    <div 
      className={`
        bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20
        ${hover ? 'hover:shadow-xl hover:scale-[1.02] transition-all duration-300' : ''}
        ${gradient ? 'bg-gradient-to-br from-white/95 to-blue-50/80' : ''}
        ${className}
      `}
      style={style}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`p-6 border-b border-gray-100/50 ${className}`}>
      {children}
    </div>
  )
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: ReactNode
  className?: string
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h3 className={`text-xl font-semibold text-gray-800 ${className}`}>
      {children}
    </h3>
  )
}