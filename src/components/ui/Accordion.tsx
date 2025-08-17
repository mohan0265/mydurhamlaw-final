'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface AccordionProps {
  children: React.ReactNode
  title: string
  defaultOpen?: boolean
  isOpen?: boolean
  onToggle?: () => void
  className?: string
  titleClassName?: string
  contentClassName?: string
  icon?: React.ReactNode
  variant?: 'default' | 'compact' | 'bordered'
}

export const Accordion: React.FC<AccordionProps> = ({
  children,
  title,
  defaultOpen = false,
  isOpen: controlledIsOpen,
  onToggle: controlledOnToggle,
  className = '',
  titleClassName = '',
  contentClassName = '',
  icon,
  variant = 'default'
}) => {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(defaultOpen)
  const contentRef = useRef<HTMLDivElement>(null)

  const isControlled = controlledIsOpen !== undefined
  const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen

  const [height, setHeight] = useState<string | number>(isOpen ? 'auto' : 0)

  useEffect(() => {
    if (contentRef.current) {
      if (isOpen) {
        setHeight(contentRef.current.scrollHeight)
      } else {
        setHeight(0)
      }
    }
  }, [isOpen, children])

  const handleToggle = () => {
    if (isControlled) {
      controlledOnToggle?.()
    } else {
      setUncontrolledIsOpen(!uncontrolledIsOpen)
    }
  }

  const variantClasses = {
    default: 'bg-white border border-gray-200 rounded-lg shadow-sm',
    compact: 'bg-gray-50 border border-gray-100 rounded-md',
    bordered: 'border-l-4 border-l-purple-500 bg-purple-50/30 rounded-r-lg'
  }

  return (
    <div className={`overflow-hidden transition-all duration-300 ${variantClasses[variant]} ${className}`}>
      <button
        onClick={handleToggle}
        className={`w-full flex items-center justify-between p-3 sm:p-4 text-left hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-inset min-h-[44px] ${titleClassName}`}
        aria-expanded={isOpen}
        aria-controls="accordion-content"
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-1">
          {icon && (
            <div className="flex-shrink-0 text-gray-600">
              {icon}
            </div>
          )}
          <span className="font-medium text-sm sm:text-base text-gray-800 leading-tight">
            {title}
          </span>
        </div>
        <div className="flex-shrink-0 ml-2">
          {isOpen ? (
            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transition-transform duration-200" />
          ) : (
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transition-transform duration-200" />
          )}
        </div>
      </button>
      
      <div
        id="accordion-content"
        ref={contentRef}
        style={{ height }}
        className="transition-all duration-300 ease-in-out overflow-hidden"
      >
        <div className={`p-3 sm:p-4 pt-0 border-t border-gray-100 ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>
  )
}

interface AccordionGroupProps {
  children: React.ReactNode
  className?: string
  allowMultiple?: boolean
}

export const AccordionGroup: React.FC<AccordionGroupProps> = ({
  children,
  className = '',
  allowMultiple = true
}) => {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())

  const handleToggle = (index: number) => {
    const newOpenItems = new Set(openItems)
    
    if (allowMultiple) {
      if (newOpenItems.has(index)) {
        newOpenItems.delete(index)
      } else {
        newOpenItems.add(index)
      }
    } else {
      // Single accordion behavior
      if (newOpenItems.has(index)) {
        newOpenItems.clear()
      } else {
        newOpenItems.clear()
        newOpenItems.add(index)
      }
    }
    
    setOpenItems(newOpenItems)
  }

  return (
    <div className={`space-y-2 sm:space-y-3 ${className}`}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child) && child.type === Accordion) {
          return React.cloneElement(child as React.ReactElement<AccordionProps>, {
            key: index,
            isOpen: openItems.has(index),
            onToggle: () => handleToggle(index),
          })
        }
        return child
      })}
    </div>
  )
}

export default Accordion