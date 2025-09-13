// Durham Employability and Legal Skills Award (DELSA) System
// 16 milestones for comprehensive career development

export interface DELSAMilestone {
  id: number
  title: string
  description: string
  category: 'legal_skills' | 'employability' | 'practical_experience' | 'personal_development'
  yearRecommended: 1 | 2 | 3 | 'any'
  estimatedHours: number
  prerequisites?: number[]
  resources: string[]
  evidenceRequired: string[]
}

export interface DELSAProgress {
  milestoneId: number
  completed: boolean
  completedDate?: Date
  evidence?: string
  reflectionNotes?: string
}

export const DELSA_MILESTONES: Record<number, DELSAMilestone> = {
  1: {
    id: 1,
    title: 'Legal Research Skills Workshop',
    description: 'Master legal databases, citation methods, and research strategies',
    category: 'legal_skills',
    yearRecommended: 1,
    estimatedHours: 4,
    resources: [
      'Durham Law Library resources',
      'Westlaw and LexisNexis training',
      'OSCOLA citation guide'
    ],
    evidenceRequired: ['Certificate of completion', 'Research portfolio']
  },
  2: {
    id: 2,
    title: 'CV and Cover Letter Development',
    description: 'Create professional applications for legal careers',
    category: 'employability',
    yearRecommended: 1,
    estimatedHours: 6,
    resources: [
      'Durham Careers Service',
      'Legal CV templates',
      'Industry-specific guidance'
    ],
    evidenceRequired: ['Completed CV', 'Sample cover letter', 'Careers advisor feedback']
  },
  3: {
    id: 3,
    title: 'Court Visit and Observation',
    description: 'Observe real legal proceedings to understand practice',
    category: 'practical_experience',
    yearRecommended: 1,
    estimatedHours: 8,
    resources: [
      'Durham Crown Court',
      'Newcastle Combined Court',
      'Durham Magistrates Court'
    ],
    evidenceRequired: ['Court visit report', 'Reflection on observations']
  },
  4: {
    id: 4,
    title: 'Networking Event Participation',
    description: 'Attend legal profession networking events',
    category: 'employability',
    yearRecommended: 'any',
    estimatedHours: 3,
    resources: [
      'Durham Law Society events',
      'Local law firm open days',
      'Legal profession talks'
    ],
    evidenceRequired: ['Event attendance confirmation', 'Professional contact log']
  },
  5: {
    id: 5,
    title: 'Mooting Competition Entry',
    description: 'Participate in competitive mooting to develop advocacy skills',
    category: 'legal_skills',
    yearRecommended: 2,
    estimatedHours: 20,
    prerequisites: [1],
    resources: [
      'Durham Mooting Society',
      'Moot court facilities',
      'Advocacy training sessions'
    ],
    evidenceRequired: ['Moot competition certificate', 'Performance feedback']
  },
  6: {
    id: 6,
    title: 'Pro Bono Legal Work',
    description: 'Contribute to community legal services',
    category: 'practical_experience',
    yearRecommended: 2,
    estimatedHours: 15,
    resources: [
      'Durham University Pro Bono Society (DUPS)',
      'Local Citizens Advice',
      'Legal clinic opportunities'
    ],
    evidenceRequired: ['Pro bono hours log', 'Supervisor confirmation', 'Reflection essay']
  },
  7: {
    id: 7,
    title: 'Legal Internship or Work Experience',
    description: 'Gain practical experience in legal environment',
    category: 'practical_experience',
    yearRecommended: 2,
    estimatedHours: 40,
    resources: [
      'Durham Careers Service placement database',
      'Local law firm opportunities',
      'Government legal departments'
    ],
    evidenceRequired: ['Employer reference', 'Work diary', 'Skills reflection']
  },
  8: {
    id: 8,
    title: 'Legal Writing Competition',
    description: 'Enter academic or professional writing competitions',
    category: 'legal_skills',
    yearRecommended: 2,
    estimatedHours: 25,
    prerequisites: [1],
    resources: [
      'National essay competitions',
      'Legal journals call for papers',
      'Durham Law Review submissions'
    ],
    evidenceRequired: ['Submitted essay', 'Competition entry confirmation']
  },
  9: {
    id: 9,
    title: 'Interview Skills Workshop',
    description: 'Develop interview techniques for legal careers',
    category: 'employability',
    yearRecommended: 2,
    estimatedHours: 4,
    prerequisites: [2],
    resources: [
      'Durham Careers Service workshops',
      'Mock interview sessions',
      'Legal profession interview guides'
    ],
    evidenceRequired: ['Workshop certificate', 'Mock interview feedback']
  },
  10: {
    id: 10,
    title: 'Leadership Role in Student Organization',
    description: 'Take leadership position in law-related society',
    category: 'personal_development',
    yearRecommended: 2,
    estimatedHours: 30,
    resources: [
      'Durham Law Society',
      'Durham Mooting Society',
      'Student representative positions'
    ],
    evidenceRequired: ['Role confirmation', 'Achievement summary', 'Leadership reflection']
  },
  11: {
    id: 11,
    title: 'Legal Technology Workshop',
    description: 'Learn modern legal technology and practice management',
    category: 'legal_skills',
    yearRecommended: 3,
    estimatedHours: 6,
    resources: [
      'Legal tech vendors',
      'Practice management software',
      'AI in law workshops'
    ],
    evidenceRequired: ['Technology skills certificate', 'Practical demonstration']
  },
  12: {
    id: 12,
    title: 'Training Contract or Pupillage Application',
    description: 'Complete professional qualification applications',
    category: 'employability',
    yearRecommended: 3,
    estimatedHours: 40,
    prerequisites: [2, 9],
    resources: [
      'Training contract database',
      'Pupillage Gateway',
      'Application support services'
    ],
    evidenceRequired: ['Application submissions', 'Application strategy document']
  },
  13: {
    id: 13,
    title: 'Legal Dissertation or Research Project',
    description: 'Complete substantial independent legal research',
    category: 'legal_skills',
    yearRecommended: 3,
    estimatedHours: 100,
    prerequisites: [1, 8],
    resources: [
      'Academic supervisors',
      'Research methodologies',
      'Legal databases and archives'
    ],
    evidenceRequired: ['Completed dissertation', 'Research methodology reflection']
  },
  14: {
    id: 14,
    title: 'Professional Mentorship Program',
    description: 'Engage with legal professional as mentor',
    category: 'employability',
    yearRecommended: 3,
    estimatedHours: 20,
    resources: [
      'Durham Law Alumni network',
      'Professional mentorship schemes',
      'Career guidance sessions'
    ],
    evidenceRequired: ['Mentorship agreement', 'Regular meeting logs', 'Career plan']
  },
  15: {
    id: 15,
    title: 'Public Speaking or Presentation',
    description: 'Deliver legal presentation to public audience',
    category: 'personal_development',
    yearRecommended: 3,
    estimatedHours: 10,
    prerequisites: [5],
    resources: [
      'Academic conferences',
      'Public legal education events',
      'Student presentation opportunities'
    ],
    evidenceRequired: ['Presentation materials', 'Audience feedback', 'Video evidence']
  },
  16: {
    id: 16,
    title: 'DELSA Portfolio Completion',
    description: 'Compile comprehensive portfolio of achievements',
    category: 'personal_development',
    yearRecommended: 3,
    estimatedHours: 15,
    prerequisites: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    resources: [
      'Portfolio templates',
      'Reflection frameworks',
      'Presentation guidelines'
    ],
    evidenceRequired: ['Complete DELSA portfolio', 'Final reflection essay', 'Skills audit']
  }
}

export class DELSATracker {
  static getMilestonesByYear(year: 1 | 2 | 3): DELSAMilestone[] {
    return Object.values(DELSA_MILESTONES).filter(
      milestone => milestone.yearRecommended === year || milestone.yearRecommended === 'any'
    )
  }

  static getMilestonesByCategory(category: DELSAMilestone['category']): DELSAMilestone[] {
    return Object.values(DELSA_MILESTONES).filter(milestone => milestone.category === category)
  }

  static getCompletionPercentage(progress: DELSAProgress[]): number {
    const completedCount = progress.filter(p => p.completed).length
    return Math.round((completedCount / 16) * 100)
  }

  static getNextMilestones(progress: DELSAProgress[], count: number = 3): DELSAMilestone[] {
    const completedIds = progress.filter(p => p.completed).map(p => p.milestoneId)
    
    return Object.values(DELSA_MILESTONES)
      .filter(milestone => {
        // Not completed yet
        if (completedIds.includes(milestone.id)) return false
        
        // Prerequisites met
        if (milestone.prerequisites) {
          return milestone.prerequisites.every(prereqId => completedIds.includes(prereqId))
        }
        
        return true
      })
      .sort((a, b) => a.id - b.id)
      .slice(0, count)
  }

  static getEstimatedTimeToCompletion(progress: DELSAProgress[]): number {
    const completedIds = progress.filter(p => p.completed).map(p => p.milestoneId)
    const remainingMilestones = Object.values(DELSA_MILESTONES).filter(
      milestone => !completedIds.includes(milestone.id)
    )
    
    return remainingMilestones.reduce((total, milestone) => total + milestone.estimatedHours, 0)
  }

  static generatePersonalizedPlan(
    academicYear: 1 | 2 | 3,
    careerPath: 'barrister' | 'solicitor' | 'academic' | 'other',
    progress: DELSAProgress[]
  ): DELSAMilestone[] {
    const completedIds = progress.filter(p => p.completed).map(p => p.milestoneId)
    const yearMilestones = this.getMilestonesByYear(academicYear)
    
    // Filter out completed milestones
    const availableMilestones = yearMilestones.filter(
      milestone => !completedIds.includes(milestone.id)
    )

    // Prioritize based on career path
    const prioritized = availableMilestones.sort((a, b) => {
      const aPriority = this.getCareerPriority(a, careerPath)
      const bPriority = this.getCareerPriority(b, careerPath)
      return bPriority - aPriority
    })

    return prioritized.slice(0, 5) // Return top 5 recommendations
  }

  private static getCareerPriority(milestone: DELSAMilestone, careerPath: string): number {
    let basePriority = 1

    switch (careerPath) {
      case 'barrister':
        if (milestone.category === 'legal_skills') basePriority += 3
        if (milestone.title.includes('Mooting')) basePriority += 5
        if (milestone.title.includes('Public Speaking')) basePriority += 4
        break
      case 'solicitor':
        if (milestone.category === 'practical_experience') basePriority += 3
        if (milestone.title.includes('Internship')) basePriority += 5
        if (milestone.title.includes('Training Contract')) basePriority += 5
        break
      case 'academic':
        if (milestone.category === 'legal_skills') basePriority += 4
        if (milestone.title.includes('Research') || milestone.title.includes('Writing')) basePriority += 5
        break
    }

    return basePriority
  }

  static getMotivationalMessage(progress: DELSAProgress[]): string {
    const completionPercentage = this.getCompletionPercentage(progress)
    const completedCount = progress.filter(p => p.completed).length

    if (completedCount === 0) {
      return "🌟 Welcome to DELSA! Your journey to legal excellence starts here. Complete your first milestone to build momentum!"
    } else if (completionPercentage < 25) {
      return `🚀 Great start! You've completed ${completedCount}/16 milestones. Keep building those essential legal skills!`
    } else if (completionPercentage < 50) {
      return `💪 Excellent progress! You're ${completionPercentage}% complete. Your dedication to professional development is showing!`
    } else if (completionPercentage < 75) {
      return `🎯 Outstanding work! With ${completedCount} milestones complete, you're well on your way to DELSA success!`
    } else if (completionPercentage < 100) {
      return `🏆 Almost there! You've completed ${completedCount}/16 milestones. The finish line is in sight!`
    } else {
      return `🎉 DELSA COMPLETE! Congratulations on achieving all 16 milestones. You're truly prepared for legal practice!`
    }
  }

  static validateEvidence(milestoneId: number, evidence: string): { valid: boolean; feedback: string } {
    const milestone = DELSA_MILESTONES[milestoneId]
    if (!milestone) {
      return { valid: false, feedback: 'Invalid milestone ID' }
    }

    if (!evidence || evidence.trim().length < 50) {
      return { 
        valid: false, 
        feedback: 'Evidence description must be at least 50 characters long and demonstrate completion of the milestone requirements.'
      }
    }

    // Check for required evidence types
    const requiredEvidence = milestone.evidenceRequired
    const evidenceLower = evidence.toLowerCase()
    
    let missingElements: string[] = []
    
    requiredEvidence.forEach(requirement => {
      const keywords = requirement.toLowerCase().split(' ')
      const hasKeyword = keywords.some(keyword => evidenceLower.includes(keyword))
      if (!hasKeyword) {
        missingElements.push(requirement)
      }
    })

    if (missingElements.length > 0) {
      return {
        valid: false,
        feedback: `Evidence should mention: ${missingElements.join(', ')}`
      }
    }

    return { valid: true, feedback: 'Evidence looks comprehensive!' }
  }
}