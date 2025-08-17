// src/components/community/CategoryTabs.tsx
import React from 'react'

interface Tab {
  label: string
  value: string
}

interface CategoryTabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (value: string) => void
}

export default function CategoryTabs({ tabs, activeTab, onTabChange }: CategoryTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className={`px-4 py-2 rounded-t-md transition-colors duration-200 ${
            tab.value === activeTab
              ? 'bg-indigo-600 text-white font-semibold'
              : 'bg-gray-100 text-gray-700 hover:bg-indigo-100'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
