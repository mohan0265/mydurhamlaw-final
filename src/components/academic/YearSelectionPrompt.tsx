// src/components/academic/YearSelectionPrompt.tsx
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export type YearGroup = 'foundation' | 'year1' | 'year2' | 'year3'

type Props = {
  userId: string
  onYearSelected: (year: YearGroup) => void
}

const OPTIONS: Array<{
  value: YearGroup
  title: string
  description: string
  color: string
  badge: string
}> = [
  {
    value: 'foundation',
    title: 'Foundation Year',
    description: 'Introduction to legal studies and foundational skills',
    color: 'from-yellow-400 to-orange-500',
    badge: 'F',
  },
  {
    value: 'year1',
    title: 'Year 1',
    description: 'Core legal principles and fundamental modules',
    color: 'from-blue-400 to-blue-600',
    badge: '1',
  },
  {
    value: 'year2',
    title: 'Year 2',
    description: 'Advanced legal concepts and specialised areas',
    color: 'from-purple-400 to-purple-600',
    badge: '2',
  },
  {
    value: 'year3',
    title: 'Year 3',
    description: 'Final year with dissertation and optional modules',
    color: 'from-green-400 to-green-600',
    badge: '3',
  },
]

export default function YearSelectionPrompt({ userId, onYearSelected }: Props) {
  const [selected, setSelected] = useState<YearGroup | null>(null)
  const canContinue = Boolean(selected)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
          <CardTitle className="text-2xl text-gray-900">Select Your Academic Year</CardTitle>
          <p className="mt-2 text-gray-600">
            Choose your current year of study to see personalised modules and content.
          </p>
        </CardHeader>

        <CardContent>
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {OPTIONS.map((opt) => {
              const active = selected === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelected(opt.value)}
                  className={[
                    'rounded-xl border-2 p-6 text-left transition-all hover:scale-[1.01]',
                    active
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300',
                  ].join(' ')}
                  aria-pressed={active}
                >
                  <div
                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${opt.color} text-xl font-bold text-white`}
                  >
                    {opt.badge}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">{opt.title}</h3>
                  <p className="text-sm text-gray-600">{opt.description}</p>
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">User: {userId.slice(0, 6)}…</span>
            <Button
              onClick={() => selected && onYearSelected(selected)}
              disabled={!canContinue}
              className="px-8 py-3 text-lg"
            >
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
