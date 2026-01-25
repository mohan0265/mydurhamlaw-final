// Durham University Academic Calendar System
// Michaelmas Term 2025: October 6 - December 12

export interface DurhamTerm {
  name: string
  startDate: Date
  endDate: Date
  weekCount: number
  examPeriod?: { start: Date; end: Date }
}

export interface AcademicWeek {
  weekNumber: number
  startDate: Date
  endDate: Date
  isExamWeek: boolean
  isReadingWeek: boolean
  termWeek: number
}

export const DURHAM_TERMS_2024_25: Record<string, DurhamTerm> = {
  michaelmas: {
    name: 'Michaelmas Term',
    startDate: new Date('2024-10-06'),
    endDate: new Date('2024-12-12'),
    weekCount: 10,
    examPeriod: {
      start: new Date('2025-01-06'),
      end: new Date('2025-01-24')
    }
  },
  epiphany: {
    name: 'Epiphany Term',
    startDate: new Date('2025-01-27'),
    endDate: new Date('2025-03-14'),
    weekCount: 7,
    examPeriod: {
      start: new Date('2025-04-28'),
      end: new Date('2025-05-16')
    }
  },
  easter: {
    name: 'Easter Term',
    startDate: new Date('2025-04-21'),
    endDate: new Date('2025-06-06'),
    weekCount: 7,
    examPeriod: {
      start: new Date('2025-05-19'),
      end: new Date('2025-06-06')
    }
  }
}

export class DurhamAcademicCalendar {
  private currentDate: Date

  constructor(date: Date = new Date()) {
    this.currentDate = date
  }

  getCurrentTerm(): DurhamTerm | null {
    for (const term of Object.values(DURHAM_TERMS_2024_25)) {
      if (this.currentDate >= term.startDate && this.currentDate <= term.endDate) {
        return term
      }
    }
    return null
  }

  getCurrentWeek(): AcademicWeek | null {
    const currentTerm = this.getCurrentTerm()
    if (!currentTerm) return null

    const weeksSinceStart = Math.floor(
      (this.currentDate.getTime() - currentTerm.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
    )
    
    const termWeek = weeksSinceStart + 1
    
    if (termWeek < 1 || termWeek > currentTerm.weekCount) return null

    const weekStart = new Date(currentTerm.startDate)
    weekStart.setDate(weekStart.getDate() + (weeksSinceStart * 7))
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    return {
      weekNumber: this.getAcademicWeekNumber(),
      startDate: weekStart,
      endDate: weekEnd,
      isExamWeek: this.isExamPeriod(),
      isReadingWeek: termWeek === 6, // Reading week is typically week 6
      termWeek
    }
  }

  private getAcademicWeekNumber(): number {
    const michaelmasStart = DURHAM_TERMS_2024_25.michaelmas?.startDate
    if (!michaelmasStart) {
      // Fallback to current date if michaelmas term not found
      return 1
    }
    return Math.floor((this.currentDate.getTime() - michaelmasStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
  }

  isExamPeriod(): boolean {
    for (const term of Object.values(DURHAM_TERMS_2024_25)) {
      if (term.examPeriod) {
        if (this.currentDate >= term.examPeriod.start && this.currentDate <= term.examPeriod.end) {
          return true
        }
      }
    }
    return false
  }

  getTermProgress(): { current: number; total: number; percentage: number } | null {
    const currentTerm = this.getCurrentTerm()
    if (!currentTerm) return null

    const termStartTime = currentTerm.startDate.getTime()
    const termEndTime = currentTerm.endDate.getTime()
    const currentTime = this.currentDate.getTime()

    const totalDuration = termEndTime - termStartTime
    const completedDuration = currentTime - termStartTime

    const percentage = Math.max(0, Math.min(100, (completedDuration / totalDuration) * 100))

    const currentWeek = this.getCurrentWeek()
    return {
      current: currentWeek?.termWeek || 0,
      total: currentTerm.weekCount,
      percentage: Math.round(percentage)
    }
  }

  getUpcomingDeadlines(): Array<{ date: Date; title: string; type: 'exam' | 'assignment' | 'term_end' }> {
    const deadlines: Array<{ date: Date; title: string; type: 'exam' | 'assignment' | 'term_end' }> = []
    
    const currentTerm = this.getCurrentTerm()
    if (currentTerm) {
      // Add term end
      if (this.currentDate < currentTerm.endDate) {
        deadlines.push({
          date: currentTerm.endDate,
          title: `${currentTerm.name} ends`,
          type: 'term_end'
        })
      }

      // Add exam period
      if (currentTerm.examPeriod && this.currentDate < currentTerm.examPeriod.start) {
        deadlines.push({
          date: currentTerm.examPeriod.start,
          title: 'Exam period begins',
          type: 'exam'
        })
      }
    }

    // Add next term start
    const allTerms = Object.values(DURHAM_TERMS_2024_25)
    const upcomingTerm = allTerms.find(term => term.startDate > this.currentDate)
    if (upcomingTerm) {
      deadlines.push({
        date: upcomingTerm.startDate,
        title: `${upcomingTerm.name} begins`,
        type: 'term_end'
      })
    }

    return deadlines.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 3)
  }

  getMotivationalMessage(): string {
    const currentTerm = this.getCurrentTerm()
    const currentWeek = this.getCurrentWeek()
    
    if (!currentTerm || !currentWeek) {
      return "Welcome to Durham Law! Ready to excel in your legal studies? 📚⚖️"
    }

    const { termWeek } = currentWeek
    const termName = currentTerm.name

    if (termWeek <= 2) {
      return `Welcome to ${termName}! You're in Week ${termWeek} - a perfect time to establish good study routines. 🌟`
    } else if (termWeek <= 4) {
      return `${termName} Week ${termWeek} - you're building momentum! Keep up the excellent work. 💪`
    } else if (termWeek === 5) {
      return `Halfway through ${termName}! Week ${termWeek} is a great time to review and consolidate your learning. 🎯`
    } else if (termWeek === 6) {
      return `Reading Week! Perfect time to catch up, review, and prepare for the final stretch. 📖`
    } else if (termWeek <= 8) {
      return `${termName} Week ${termWeek} - you're in the final stretch! Stay focused and finish strong. 🏃♂️`
    } else {
      return `Final weeks of ${termName}! You've got this - channel all your hard work into these crucial weeks. 🔥`
    }
  }

  static formatDate(date: Date): string {
    return date.toLocaleDateString('en-GB', { timeZone: 'Europe/London', 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  static formatWeekRange(startDate: Date, endDate: Date): string {
    const start = startDate.toLocaleDateString('en-GB', { timeZone: 'Europe/London',  month: 'short', day: 'numeric' })
    const end = endDate.toLocaleDateString('en-GB', { timeZone: 'Europe/London',  month: 'short', day: 'numeric' })
    return `${start} - ${end}`
  }
}