import React from 'react'
import { Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/Badge'

import type {
  AcademicYearPlan,
  ModulePlan,
} from '@/data/durham/llb/academic_year_2025_26'
import {
  DURHAM_LLB_2025_26,
  getDefaultPlanByStudentYear,
} from '@/data/durham/llb'
import SemesterColumn from "@/components/calendar/SemesterColumn";


type YearViewProps = {
  /** 0 = Foundation, 1..3 = Y1..Y3 */
  userYearOfStudy: number
  /** optional props (kept for API parity with calling page) */
  yearOverview?: any
  multiYearData?: any
  moduleProgress?: any
  onModuleClick?: (idOrTitle: string) => void
  onEventClick?: (idOrTitle: string) => void
}

/** Decide which plan to show from the userYearOfStudy */
function resolvePlan(y: number): AcademicYearPlan {
  const key =
    y <= 0 ? 'foundation' : (`year${y}` as 'year1' | 'year2' | 'year3')
  return getDefaultPlanByStudentYear(key)
}

/** Filter modules by delivery term */
function forTerm(mods: ModulePlan[], term: 'Michaelmas' | 'Epiphany') {
  return mods.filter(
    (m) =>
      m.delivery === term ||
      m.delivery === 'Michaelmas+Epiphany' /* straddling shows in both */,
  )
}

export function YearView({
  userYearOfStudy,
  onModuleClick,
}: YearViewProps) {
  const plan = resolvePlan(userYearOfStudy)

  const micha = plan.termDates.michaelmas
  const epiph = plan.termDates.epiphany
  const eastr = plan.termDates.easter

  const mods = plan.modules
  const michaMods = forTerm(mods, 'Michaelmas')
  const epiphMods = forTerm(mods, 'Epiphany')
  // Easter: typically revision/exams; we don't list dedicated teaching modules

  return (
    <div className="space-y-6">
      {/* top banner */}
      <Card className="p-4 md:p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              {plan.academicYear} • {plan.yearLabel}
            </div>
            <h2 className="text-xl font-semibold">2025/26 Academic Year</h2>
            <div className="mt-1 text-sm text-gray-600">
              Overview of modules, weeks and key deadlines
            </div>
          </div>
          <Badge className="bg-purple-100 text-purple-800">
            <Calendar className="w-4 h-4 mr-1" />
            Eagle-eye view
          </Badge>
        </div>
      </Card>

      {/* three columns */}
      <div className="grid md:grid-cols-3 gap-4">
        <SemesterColumn
          termKey="michaelmas"
          title="Michaelmas"
          term={micha}
          modules={michaMods}
          allModules={mods}
          onModuleClick={onModuleClick}
        />

        <SemesterColumn
          termKey="epiphany"
          title="Epiphany"
          term={epiph}
          modules={epiphMods}
          allModules={mods}
          onModuleClick={onModuleClick}
        />

        <SemesterColumn
          termKey="easter"
          title="Easter (Revision & Exams)"
          term={eastr}
          modules={[]}          // usually no new teaching here
          allModules={mods}     // but we still show exam windows & due dates
          onModuleClick={onModuleClick}
        />
      </div>
    </div>
  )
}

export default YearView
