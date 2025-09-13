// Durham University Law Student Activities and Societies

export interface DurhamActivity {
  id: string
  name: string
  type: 'society' | 'competition' | 'support_service' | 'career_event'
  description: string
  benefits: string[]
  timeCommitment: 'low' | 'medium' | 'high'
  yearSuitability: Array<1 | 2 | 3>
  applicationRequired: boolean
  contactInfo?: string
  website?: string
  nextEvents?: DurhamEvent[]
}

export interface DurhamEvent {
  id: string
  title: string
  date: Date
  location: string
  description: string
  registrationRequired: boolean
  registrationLink?: string
}

export interface ProBonoProject {
  id: string
  name: string
  description: string
  type: 'advice' | 'research' | 'education' | 'advocacy'
  timeCommitment: string
  skills_developed: string[]
  contact_supervisor: string
  application_deadline?: Date
}

export const DURHAM_ACTIVITIES: Record<string, DurhamActivity> = {
  law_society: {
    id: 'law_society',
    name: 'Durham Law Society',
    type: 'society',
    description: 'The premier society for all Durham law students, organizing social events, career talks, and networking opportunities',
    benefits: [
      'Career networking opportunities',
      'Legal profession insights',
      'Social events and ball',
      'CV building activities',
      'Mentorship programs'
    ],
    timeCommitment: 'low',
    yearSuitability: [1, 2, 3],
    applicationRequired: false,
    contactInfo: 'durhamlawsociety@durham.ac.uk',
    website: 'https://www.durhamlawsociety.co.uk'
  },

  mooting_society: {
    id: 'mooting_society',
    name: 'Durham Mooting Society',
    type: 'society',
    description: 'Competitive advocacy training through moot court competitions and workshops',
    benefits: [
      'Advocacy skills development',
      'Public speaking confidence',
      'Legal research skills',
      'Competition opportunities',
      'Barrister networking'
    ],
    timeCommitment: 'medium',
    yearSuitability: [1, 2, 3],
    applicationRequired: true,
    contactInfo: 'mooting@durham.ac.uk',
    nextEvents: [
      {
        id: 'novice_cup_2024',
        title: 'Novice Cup 2024',
        date: new Date('2024-11-15'),
        location: 'Durham Law School Moot Court',
        description: 'Annual competition for first-time mooters',
        registrationRequired: true,
        registrationLink: 'https://mooting.durham.ac.uk/novice-cup'
      }
    ]
  },

  pro_bono_society: {
    id: 'pro_bono_society',
    name: 'Durham University Pro Bono Society (DUPS)',
    type: 'society',
    description: 'Providing free legal services to the community while developing practical skills',
    benefits: [
      'Real client experience',
      'Community impact',
      'Practical legal skills',
      'Professional references',
      'Career advantage'
    ],
    timeCommitment: 'high',
    yearSuitability: [2, 3],
    applicationRequired: true,
    contactInfo: 'probono@durham.ac.uk'
  },

  counselling_service: {
    id: 'counselling_service',
    name: 'Durham University Counselling Service',
    type: 'support_service',
    description: 'Professional counselling and mental health support for students',
    benefits: [
      'Confidential support',
      'Stress management',
      'Academic pressure relief',
      'Personal development',
      'Crisis intervention'
    ],
    timeCommitment: 'low',
    yearSuitability: [1, 2, 3],
    applicationRequired: false,
    contactInfo: '0191 334 2200',
    website: 'https://www.durham.ac.uk/student-life/support/counselling/'
  },

  peer_support: {
    id: 'peer_support',
    name: 'Law School Peer Support Network',
    type: 'support_service',
    description: 'Student-led support network for academic and personal challenges',
    benefits: [
      'Peer mentoring',
      'Study groups',
      'Academic guidance',
      'Social connection',
      'Exam support'
    ],
    timeCommitment: 'low',
    yearSuitability: [1, 2, 3],
    applicationRequired: false,
    contactInfo: 'law.school@durham.ac.uk'
  },

  commercial_awareness: {
    id: 'commercial_awareness',
    name: 'Commercial Awareness Society',
    type: 'society',
    description: 'Developing business understanding crucial for commercial law careers',
    benefits: [
      'Business news analysis',
      'Commercial law insights',
      'City firm connections',
      'Interview preparation',
      'Market awareness'
    ],
    timeCommitment: 'medium',
    yearSuitability: [2, 3],
    applicationRequired: false,
    contactInfo: 'commercial@durham.ac.uk'
  }
}

export const PRO_BONO_PROJECTS: Record<string, ProBonoProject> = {
  citizens_advice: {
    id: 'citizens_advice',
    name: 'Citizens Advice Durham',
    description: 'Assist clients with housing, debt, benefits, and employment issues',
    type: 'advice',
    timeCommitment: '4 hours per week',
    skills_developed: ['Client interviewing', 'Legal research', 'Letter writing', 'Case management'],
    contact_supervisor: 'Sarah Johnson - sarah.johnson@citizensadvice.org.uk'
  },

  housing_law: {
    id: 'housing_law',
    name: 'Housing Rights Project',
    description: 'Support tenants facing eviction or housing disputes',
    type: 'advice',
    timeCommitment: '3 hours per week',
    skills_developed: ['Housing law', 'Negotiation', 'Court procedures', 'Client advocacy'],
    contact_supervisor: 'Mark Thompson - housing@dups.org.uk'
  },

  immigration_clinic: {
    id: 'immigration_clinic',
    name: 'Immigration Law Clinic',
    description: 'Assist asylum seekers and immigrants with legal documentation',
    type: 'advice',
    timeCommitment: '5 hours per week',
    skills_developed: ['Immigration law', 'Form completion', 'Document review', 'Cultural sensitivity'],
    contact_supervisor: 'Dr. Amira Hassan - immigration@durham.ac.uk',
    application_deadline: new Date('2024-09-30')
  },

  legal_education: {
    id: 'legal_education',
    name: 'Community Legal Education',
    description: 'Deliver legal awareness workshops to local schools and community groups',
    type: 'education',
    timeCommitment: '2 hours per week + events',
    skills_developed: ['Public speaking', 'Teaching skills', 'Legal knowledge transfer', 'Community engagement'],
    contact_supervisor: 'Emma Wilson - education@dups.org.uk'
  },

  prisoners_rights: {
    id: 'prisoners_rights',
    name: 'Prisoners\' Rights Advocacy',
    description: 'Research and advocate for prisoner welfare and rehabilitation',
    type: 'advocacy',
    timeCommitment: '3 hours per week',
    skills_developed: ['Criminal justice system', 'Policy research', 'Advocacy writing', 'Human rights'],
    contact_supervisor: 'Prof. James Mitchell - criminal.justice@durham.ac.uk'
  },

  environmental_law: {
    id: 'environmental_law',
    name: 'Environmental Justice Project',
    description: 'Support communities affected by environmental issues',
    type: 'research',
    timeCommitment: '4 hours per week',
    skills_developed: ['Environmental law', 'Research methods', 'Policy analysis', 'Community consultation'],
    contact_supervisor: 'Dr. Green Environmental - env.law@durham.ac.uk'
  },

  domestic_violence: {
    id: 'domestic_violence',
    name: 'Domestic Violence Support',
    description: 'Assist survivors with legal protection and court procedures (training provided)',
    type: 'advice',
    timeCommitment: '6 hours per week',
    skills_developed: ['Family law', 'Trauma-informed practice', 'Court applications', 'Support skills'],
    contact_supervisor: 'Rachel Adams - domestic.violence@durham.ac.uk',
    application_deadline: new Date('2024-10-15')
  },

  elder_law: {
    id: 'elder_law',
    name: 'Elder Law Clinic',
    description: 'Help elderly residents with wills, care arrangements, and benefits',
    type: 'advice',
    timeCommitment: '3 hours per week',
    skills_developed: ['Elder law', 'Will drafting', 'Care law', 'Patient advocacy'],
    contact_supervisor: 'Margaret Foster - elder.law@durham.ac.uk'
  },

  small_business: {
    id: 'small_business',
    name: 'Small Business Legal Clinic',
    description: 'Provide legal guidance to local small businesses and startups',
    type: 'advice',
    timeCommitment: '4 hours per week',
    skills_developed: ['Commercial law', 'Contract drafting', 'Business advice', 'Regulatory compliance'],
    contact_supervisor: 'David Brown - business.clinic@durham.ac.uk'
  },

  mental_health_law: {
    id: 'mental_health_law',
    name: 'Mental Health Law Project',
    description: 'Research mental health law reform and patient rights',
    type: 'research',
    timeCommitment: '3 hours per week',
    skills_developed: ['Mental health law', 'Policy research', 'Rights advocacy', 'Legal reform'],
    contact_supervisor: 'Dr. Lisa Parker - mental.health@durham.ac.uk'
  },

  street_law: {
    id: 'street_law',
    name: 'Street Law Initiative',
    description: 'Teach practical legal knowledge to disadvantaged communities',
    type: 'education',
    timeCommitment: '5 hours per week',
    skills_developed: ['Community education', 'Legal simplification', 'Public engagement', 'Social justice'],
    contact_supervisor: 'Tom Richards - street.law@durham.ac.uk'
  }
}

export class DurhamActivitiesManager {
  static getActivitiesByYear(year: 1 | 2 | 3): DurhamActivity[] {
    return Object.values(DURHAM_ACTIVITIES).filter(activity => 
      activity.yearSuitability.includes(year)
    )
  }

  static getActivitiesByType(type: DurhamActivity['type']): DurhamActivity[] {
    return Object.values(DURHAM_ACTIVITIES).filter(activity => activity.type === type)
  }

  static getRecommendedActivities(
    year: 1 | 2 | 3,
    careerPath: 'barrister' | 'solicitor' | 'academic' | 'other',
    timeAvailable: 'low' | 'medium' | 'high'
  ): DurhamActivity[] {
    const yearAppropriate = this.getActivitiesByYear(year)
    const timeFiltered = yearAppropriate.filter(activity => {
      if (timeAvailable === 'low') return activity.timeCommitment === 'low'
      if (timeAvailable === 'medium') return activity.timeCommitment !== 'high'
      return true // high time availability accepts all
    })

    // Career-specific prioritization
    return timeFiltered.sort((a, b) => {
      const aPriority = this.getCareerPriority(a, careerPath)
      const bPriority = this.getCareerPriority(b, careerPath)
      return bPriority - aPriority
    })
  }

  private static getCareerPriority(activity: DurhamActivity, careerPath: string): number {
    let priority = 1

    switch (careerPath) {
      case 'barrister':
        if (activity.id === 'mooting_society') priority += 5
        if (activity.id === 'pro_bono_society') priority += 3
        if (activity.benefits.some(b => b.includes('advocacy') || b.includes('speaking'))) priority += 2
        break
      case 'solicitor':
        if (activity.id === 'commercial_awareness') priority += 4
        if (activity.id === 'pro_bono_society') priority += 4
        if (activity.benefits.some(b => b.includes('commercial') || b.includes('business'))) priority += 3
        break
      case 'academic':
        if (activity.benefits.some(b => b.includes('research'))) priority += 4
        if (activity.id === 'law_society') priority += 2
        break
    }

    return priority
  }

  static getProBonoProjectsByType(type: ProBonoProject['type']): ProBonoProject[] {
    return Object.values(PRO_BONO_PROJECTS).filter(project => project.type === type)
  }

  static getAvailableProBonoProjects(): ProBonoProject[] {
    const now = new Date()
    return Object.values(PRO_BONO_PROJECTS).filter(project => 
      !project.application_deadline || project.application_deadline > now
    )
  }

  static getUpcomingEvents(daysAhead: number = 30): DurhamEvent[] {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead)

    const allEvents: DurhamEvent[] = []
    
    Object.values(DURHAM_ACTIVITIES).forEach(activity => {
      if (activity.nextEvents) {
        activity.nextEvents.forEach(event => {
          if (event.date <= cutoffDate) {
            allEvents.push(event)
          }
        })
      }
    })

    return allEvents.sort((a, b) => a.date.getTime() - b.date.getTime())
  }

  static getActivityRecommendation(studentProfile: {
    year: 1 | 2 | 3
    careerPath: 'barrister' | 'solicitor' | 'academic' | 'other'
    timeAvailable: 'low' | 'medium' | 'high'
    interests: string[]
  }): { activity: DurhamActivity; reason: string }[] {
    const recommended = this.getRecommendedActivities(
      studentProfile.year,
      studentProfile.careerPath,
      studentProfile.timeAvailable
    )

    return recommended.slice(0, 3).map(activity => ({
      activity,
      reason: this.generateRecommendationReason(activity, studentProfile)
    }))
  }

  private static generateRecommendationReason(
    activity: DurhamActivity,
    profile: { year: 1 | 2 | 3; careerPath: string; timeAvailable: string }
  ): string {
    const reasons: string[] = []

    if (activity.yearSuitability.includes(profile.year)) {
      reasons.push(`Perfect for Year ${profile.year} students`)
    }

    if (profile.careerPath === 'barrister' && activity.id === 'mooting_society') {
      reasons.push('Essential for developing advocacy skills needed at the Bar')
    }

    if (profile.careerPath === 'solicitor' && activity.id === 'commercial_awareness') {
      reasons.push('Crucial for understanding commercial law practice')
    }

    if (activity.timeCommitment === profile.timeAvailable) {
      reasons.push(`Matches your ${profile.timeAvailable} time availability`)
    }

    if (reasons.length === 0) {
      reasons.push('Enhances your legal education and career prospects')
    }

    return reasons.join('. ')
  }

  static generateMotivationalMessage(participatedActivities: string[]): string {
    const count = participatedActivities.length

    if (count === 0) {
      return "🌟 Durham offers incredible opportunities beyond the classroom! Join a society or volunteer project to enrich your legal education and build your network."
    } else if (count < 3) {
      return `🚀 Great start with ${count} activities! Consider adding mooting or pro bono work to further develop your practical skills.`
    } else if (count < 5) {
      return `💪 Excellent engagement with ${count} activities! You're building a strong foundation for your legal career.`
    } else {
      return `🏆 Outstanding involvement in ${count} activities! You're truly making the most of your Durham experience.`
    }
  }
}