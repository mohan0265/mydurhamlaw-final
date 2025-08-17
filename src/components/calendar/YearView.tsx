import React, { useState } from 'react'
import { YearOverview, ModuleProgress, MultiYearData, CalendarEvent } from '@/types/calendar'
import { useAcademicCalendar, useYearNavigation } from '@/lib/hooks/useCalendarData'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SemesterColumn } from './SemesterColumn'
import { ChevronLeft, ChevronRight, Calendar, Clock, CheckCircle, AlertTriangle, RotateCcw, Eye } from 'lucide-react'
import { format } from 'date-fns'

interface YearViewProps {
  yearOverview?: YearOverview
  multiYearData?: MultiYearData
  moduleProgress: ModuleProgress[]
  userYearOfStudy: number
  onModuleClick: (moduleId: string) => void
  onEventClick: (eventId: string) => void
}

export const YearView: React.FC<YearViewProps> = ({
  yearOverview,
  multiYearData,
  moduleProgress,
  userYearOfStudy,
  onModuleClick,
  onEventClick
}) => {
  // Use multi-year navigation
  const navigation = useYearNavigation(userYearOfStudy, multiYearData)
  
  // Get the selected year's data (fallback to single year data for backwards compatibility)
  const selectedYearData = navigation.getSelectedYearData() || yearOverview
  
  const { currentTerm, getTermProgress, isInTerm } = useAcademicCalendar(
    selectedYearData?.academic_year || '2025/26'
  )
  const [expandedTerm, setExpandedTerm] = useState<number | null>(
    typeof currentTerm === 'number' ? currentTerm : 1
  )

  if (!selectedYearData) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Year Overview</h3>
        <p className="text-gray-600">Please wait while we load your academic year data...</p>
      </div>
    )
  }

  const getModuleProgressData = (moduleId: string) => {
    return moduleProgress.find(p => p.module_id === moduleId)
  }

  const getTermStatusColor = (termNumber: 1 | 2 | 3) => {
    const progress = getTermProgress(termNumber)
    if (progress === 0) return 'text-gray-500'
    if (progress < 50) return 'text-blue-600'
    if (progress < 100) return 'text-orange-600'
    return 'text-green-600'
  }

  const getTermStatusIcon = (termNumber: 1 | 2 | 3) => {
    const progress = getTermProgress(termNumber)
    if (progress === 100) return <CheckCircle className="w-5 h-5 text-green-600" />
    if (progress > 0) return <Clock className="w-5 h-5 text-blue-600" />
    return <Calendar className="w-5 h-5 text-gray-400" />
  }

  return (
    <div className="space-y-8">
      {/* Year Navigation Header */}
      {multiYearData && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Button
                onClick={navigation.navigatePrevious}
                disabled={!navigation.canNavigatePrevious}
                variant="outline"
                size="lg"
                className="flex items-center space-x-2 w-full sm:w-auto"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="hidden sm:inline">
                  {navigation.getPreviousYearLabel() ? `View ${navigation.getPreviousYearLabel()}` : 'Previous'}
                </span>
                <span className="sm:hidden">Previous</span>
              </Button>

              <div className="text-center px-4 lg:px-6">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">{navigation.getCurrentYearLabel()}</h2>
                <p className="text-xs lg:text-sm text-gray-600 flex items-center justify-center space-x-2 mt-1">
                  {navigation.isViewingCurrentYear ? (
                    <>
                      <Eye className="w-3 h-3 lg:w-4 lg:h-4 text-green-600" />
                      <span className="text-green-600 font-medium">Your Current Year</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-3 h-3 lg:w-4 lg:h-4 text-gray-500" />
                      <span>Academic Journey View</span>
                    </>
                  )}
                </p>
              </div>

              <Button
                onClick={navigation.navigateNext}
                disabled={!navigation.canNavigateNext}
                variant="outline"
                size="lg"
                className="flex items-center space-x-2 w-full sm:w-auto"
              >
                <span className="hidden sm:inline">
                  {navigation.getNextYearLabel() ? `View ${navigation.getNextYearLabel()}` : 'Next'}
                </span>
                <span className="sm:hidden">Next</span>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {!navigation.isViewingCurrentYear && (
              <Button
                onClick={navigation.resetToCurrentYear}
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 w-full lg:w-auto justify-center lg:justify-start"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Back to Current Year</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Header Overview */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">{selectedYearData.academic_year} Academic Year</h1>
            <p className="text-purple-200">
              {selectedYearData.programme} {navigation.getCurrentYearLabel() || `Year ${selectedYearData.year_of_study}`}
            </p>
            {!navigation.isViewingCurrentYear && (
              <div className="mt-2 flex items-center space-x-2">
                <Badge variant="secondary" size="sm" className="bg-blue-100 text-blue-800">
                  Preview Mode
                </Badge>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{Math.round(selectedYearData.overall_progress)}%</div>
            <div className="text-sm text-purple-200">Overall Progress</div>
          </div>
        </div>
        
        <ProgressBar 
          progress={selectedYearData.overall_progress} 
          className="mb-4 bg-purple-500/30"
        />

        {/* Current Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-purple-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Current Term</span>
            </div>
            <div className="text-lg font-bold">
              {isInTerm ? `Term ${currentTerm}` : 'Vacation Period'}
            </div>
          </div>

          {selectedYearData.next_deadline && (
            <div className="bg-orange-500/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Next Deadline</span>
              </div>
              <div className="text-lg font-bold truncate">
                {selectedYearData.next_deadline.title}
              </div>
              <div className="text-xs text-purple-200">
                {format(new Date((selectedYearData.next_deadline as any).due_at || (selectedYearData.next_deadline as any).date), 'MMM dd, yyyy')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Three-Column Term Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Term 1 */}
        <SemesterColumn
          term={selectedYearData.term_1}
          termNumber={1}
          isExpanded={expandedTerm === 1}
          onToggle={() => setExpandedTerm(expandedTerm === 1 ? null : 1)}
          isCurrentTerm={currentTerm === 1 && navigation.isViewingCurrentYear}
          progress={getTermProgress(1)}
          moduleProgress={moduleProgress}
          onModuleClick={onModuleClick}
          statusColor={getTermStatusColor(1)}
          statusIcon={getTermStatusIcon(1)}
        />

        {/* Term 2 */}
        <SemesterColumn
          term={selectedYearData.term_2}
          termNumber={2}
          isExpanded={expandedTerm === 2}
          onToggle={() => setExpandedTerm(expandedTerm === 2 ? null : 2)}
          isCurrentTerm={currentTerm === 2 && navigation.isViewingCurrentYear}
          progress={getTermProgress(2)}
          moduleProgress={moduleProgress}
          onModuleClick={onModuleClick}
          statusColor={getTermStatusColor(2)}
          statusIcon={getTermStatusIcon(2)}
        />

        {/* Term 3 */}
        <SemesterColumn
          term={selectedYearData.term_3}
          termNumber={3}
          isExpanded={expandedTerm === 3}
          onToggle={() => setExpandedTerm(expandedTerm === 3 ? null : 3)}
          isCurrentTerm={currentTerm === 3 && navigation.isViewingCurrentYear}
          progress={getTermProgress(3)}
          moduleProgress={moduleProgress}
          onModuleClick={onModuleClick}
          statusColor={getTermStatusColor(3)}
          statusIcon={getTermStatusIcon(3)}
        />
      </div>

      {/* Upcoming Events Preview */}
      {selectedYearData.upcoming_events.length > 0 && navigation.isViewingCurrentYear && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Upcoming This Week</h3>
            <button className="text-purple-600 hover:text-purple-800 flex items-center space-x-1 text-sm font-medium transition-colors duration-200">
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {selectedYearData.upcoming_events.slice(0, 5).map((event: CalendarEvent) => (
              <div 
                key={event.id}
                onClick={() => onEventClick(event.id)}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    event.type === 'exam' ? 'bg-red-500' :
                    event.type === 'assessment' ? 'bg-orange-500' :
                    event.type === 'lecture' ? 'bg-blue-500' :
                    'bg-gray-500'
                  }`} />
                  <div>
                    <div className="font-medium text-gray-900">{event.title}</div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(event.start_at), 'EEE, MMM dd • h:mm a')}
                    </div>
                  </div>
                </div>
                
                <Badge 
                  variant={
                    event.type === 'exam' ? 'warning' :
                    event.type === 'assessment' ? 'warning' :
                    'secondary'
                  }
                  size="sm"
                >
                  {event.type}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Motivation Section */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-800">You&apos;re Making Great Progress!</h3>
            <p className="text-green-600 text-sm">Keep up the excellent work this academic year.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="text-center p-3 bg-white rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">
              {moduleProgress.filter(m => m.percentage > 75).length}
            </div>
            <div className="text-sm text-gray-600">Modules 75%+ Complete</div>
          </div>
          
          <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(selectedYearData.overall_progress)}%
            </div>
            <div className="text-sm text-gray-600">Year Progress</div>
          </div>
          
          <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">
              {selectedYearData.upcoming_events.length}
            </div>
            <div className="text-sm text-gray-600">Upcoming Events</div>
          </div>
        </div>
      </Card>
    </div>
  )
}