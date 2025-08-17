'use client'

interface ProgressBarProps {
  progress: number
  className?: string
  color?: 'blue' | 'green' | 'purple' | 'amber'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  label?: string
}

export function ProgressBar({ 
  progress, 
  className = '', 
  color = 'blue',
  size = 'md',
  showLabel = false,
  label
}: ProgressBarProps) {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500'
  }

  const sizes = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{label || 'Progress'}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizes[size]}`}>
        <div 
          className={`${colors[color]} ${sizes[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  )
}