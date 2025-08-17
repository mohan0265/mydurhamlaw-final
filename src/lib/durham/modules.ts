// Durham University Law Modules System

export interface DurhamModule {
  code: string
  name: string
  credits: number
  year: 1 | 2 | 3
  compulsory: boolean
  description: string
  assessmentMethods: string[]
  prerequisites?: string[]
}

export interface StudentProfile {
  academicYear: 1 | 2 | 3
  selectedModules: string[]
  delsa_progress: number
  mooting_interest: boolean
  pro_bono_interest: boolean
  career_path?: 'barrister' | 'solicitor' | 'academic' | 'other'
  college?: string
}

export const DURHAM_LAW_MODULES: Record<string, DurhamModule> = {
  // First Year Modules
  LAW1121: {
    code: 'LAW1121',
    name: 'Contract Law',
    credits: 20,
    year: 1,
    compulsory: true,
    description: 'Fundamental principles of contract formation, terms, breach, and remedies in English law',
    assessmentMethods: ['Exam (70%)', 'Coursework (30%)']
  },
  LAW1051: {
    code: 'LAW1051',
    name: 'Tort Law',
    credits: 20,
    year: 1,
    compulsory: true,
    description: 'Civil wrongs including negligence, nuisance, defamation, and occupiers\' liability',
    assessmentMethods: ['Exam (70%)', 'Coursework (30%)']
  },
  LAW1071: {
    code: 'LAW1071',
    name: 'Criminal Law',
    credits: 20,
    year: 1,
    compulsory: true,
    description: 'Principles of criminal liability, offences against the person, property offences, and defences',
    assessmentMethods: ['Exam (70%)', 'Coursework (30%)']
  },
  LAW1061: {
    code: 'LAW1061',
    name: 'Public Law',
    credits: 20,
    year: 1,
    compulsory: true,
    description: 'Constitutional and administrative law including judicial review and human rights',
    assessmentMethods: ['Exam (70%)', 'Coursework (30%)']
  },
  LAW1091: {
    code: 'LAW1091',
    name: 'Legal Skills and Methods',
    credits: 20,
    year: 1,
    compulsory: true,
    description: 'Legal research, writing, citation, and foundational legal reasoning skills',
    assessmentMethods: ['Coursework (100%)']
  },
  LAW1081: {
    code: 'LAW1081',
    name: 'Jurisprudence',
    credits: 20,
    year: 1,
    compulsory: true,
    description: 'Philosophy of law, natural law, legal positivism, and contemporary legal theory',
    assessmentMethods: ['Exam (70%)', 'Coursework (30%)']
  },

  // Second Year Core Modules
  LAW2221: {
    code: 'LAW2221',
    name: 'European Union Law',
    credits: 20,
    year: 2,
    compulsory: true,
    description: 'EU institutional law, fundamental freedoms, and the relationship between EU and national law',
    assessmentMethods: ['Exam (70%)', 'Coursework (30%)'],
    prerequisites: ['LAW1061']
  },
  LAW2011: {
    code: 'LAW2011',
    name: 'Land Law',
    credits: 20,
    year: 2,
    compulsory: true,
    description: 'Property rights, ownership, leases, easements, covenants, and registered land',
    assessmentMethods: ['Exam (70%)', 'Coursework (30%)']
  },
  LAW2211: {
    code: 'LAW2211',
    name: 'Equity and Trusts',
    credits: 20,
    year: 2,
    compulsory: true,
    description: 'Equitable principles, creation and management of trusts, and fiduciary duties',
    assessmentMethods: ['Exam (70%)', 'Coursework (30%)']
  },

  // Second Year Optional Modules
  LAW2131: {
    code: 'LAW2131',
    name: 'Employment Law',
    credits: 20,
    year: 2,
    compulsory: false,
    description: 'Individual and collective employment rights, discrimination, and workplace regulation',
    assessmentMethods: ['Exam (70%)', 'Coursework (30%)']
  },
  LAW2241: {
    code: 'LAW2241',
    name: 'Commercial Law',
    credits: 20,
    year: 2,
    compulsory: false,
    description: 'Sales of goods, commercial transactions, and business relationships',
    assessmentMethods: ['Exam (70%)', 'Coursework (30%)'],
    prerequisites: ['LAW1121']
  },
  LAW2251: {
    code: 'LAW2251',
    name: 'Public International Law',
    credits: 20,
    year: 2,
    compulsory: false,
    description: 'Sources of international law, state responsibility, and international dispute resolution',
    assessmentMethods: ['Exam (70%)', 'Coursework (30%)']
  },

  // Third Year Modules
  LAW3000: {
    code: 'LAW3000',
    name: 'Dissertation',
    credits: 40,
    year: 3,
    compulsory: true,
    description: 'Independent research project on a legal topic of your choice',
    assessmentMethods: ['Dissertation (100%)']
  },
  LAW3141: {
    code: 'LAW3141',
    name: 'Company Law',
    credits: 20,
    year: 3,
    compulsory: false,
    description: 'Corporate governance, directors\' duties, shareholder rights, and corporate finance',
    assessmentMethods: ['Exam (70%)', 'Coursework (30%)']
  },
  LAW3151: {
    code: 'LAW3151',
    name: 'Intellectual Property Law',
    credits: 20,
    year: 3,
    compulsory: false,
    description: 'Copyright, patents, trademarks, and confidential information',
    assessmentMethods: ['Exam (70%)', 'Coursework (30%)']
  },
  LAW3161: {
    code: 'LAW3161',
    name: 'Human Rights Law',
    credits: 20,
    year: 3,
    compulsory: false,
    description: 'European Convention on Human Rights and fundamental rights protection',
    assessmentMethods: ['Exam (70%)', 'Coursework (30%)'],
    prerequisites: ['LAW1061']
  },
  LAW3171: {
    code: 'LAW3171',
    name: 'Media Law',
    credits: 20,
    year: 3,
    compulsory: false,
    description: 'Press regulation, broadcasting law, privacy, and freedom of expression',
    assessmentMethods: ['Exam (70%)', 'Coursework (30%)']
  },
  LAW3181: {
    code: 'LAW3181',
    name: 'Advanced Mooting',
    credits: 20,
    year: 3,
    compulsory: false,
    description: 'Intensive advocacy training through competitive mooting',
    assessmentMethods: ['Moot Performance (60%)', 'Reflection Essay (40%)']
  }
}

export class DurhamModuleManager {
  static getModulesByYear(year: 1 | 2 | 3): DurhamModule[] {
    return Object.values(DURHAM_LAW_MODULES).filter(module => module.year === year)
  }

  static getCompulsoryModulesByYear(year: 1 | 2 | 3): DurhamModule[] {
    return this.getModulesByYear(year).filter(module => module.compulsory)
  }

  static getOptionalModulesByYear(year: 1 | 2 | 3): DurhamModule[] {
    return this.getModulesByYear(year).filter(module => !module.compulsory)
  }

  static getModule(code: string): DurhamModule | undefined {
    return DURHAM_LAW_MODULES[code]
  }

  static getTotalCredits(moduleCodes: string[]): number {
    return moduleCodes.reduce((total, code) => {
      const moduleInfo = this.getModule(code)
      return total + (moduleInfo?.credits || 0)
    }, 0)
  }

  static validateModuleSelection(year: 1 | 2 | 3, selectedModules: string[]): {
    valid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Check all compulsory modules are selected
    const compulsoryModules = this.getCompulsoryModulesByYear(year)
    const missingCompulsory = compulsoryModules.filter(
      module => !selectedModules.includes(module.code)
    )

    if (missingCompulsory.length > 0) {
      errors.push(`Missing compulsory modules: ${missingCompulsory.map(m => m.name).join(', ')}`)
    }

    // Check total credits
    const totalCredits = this.getTotalCredits(selectedModules)
    const expectedCredits = year === 3 ? 120 : 120 // All years should have 120 credits

    if (totalCredits < expectedCredits) {
      errors.push(`Insufficient credits: ${totalCredits}/${expectedCredits}`)
    } else if (totalCredits > expectedCredits) {
      warnings.push(`Excess credits: ${totalCredits}/${expectedCredits}`)
    }

    // Check prerequisites
    for (const moduleCode of selectedModules) {
      const moduleInfo = this.getModule(moduleCode)
      if (moduleInfo?.prerequisites) {
        const missingPrereqs = moduleInfo.prerequisites.filter(
          prereq => !selectedModules.includes(prereq)
        )
        if (missingPrereqs.length > 0) {
          warnings.push(`${moduleInfo.name} requires: ${missingPrereqs.join(', ')}`)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  static getCareerRecommendations(careerPath: string, year: 1 | 2 | 3): DurhamModule[] {
    const allModules = this.getOptionalModulesByYear(year)
    
    switch (careerPath) {
      case 'barrister':
        return allModules.filter(module => 
          ['Criminal Law', 'Human Rights Law', 'Advanced Mooting', 'Public International Law'].some(
            keyword => module.name.includes(keyword)
          )
        )
      case 'solicitor':
        return allModules.filter(module => 
          ['Commercial Law', 'Company Law', 'Employment Law', 'Intellectual Property Law'].some(
            keyword => module.name.includes(keyword)
          )
        )
      case 'academic':
        return allModules.filter(module => 
          ['Jurisprudence', 'Human Rights Law', 'Public International Law'].some(
            keyword => module.name.includes(keyword)
          )
        )
      default:
        return allModules
    }
  }

  static getStudyTips(moduleCode: string): string[] {
    const moduleInfo = this.getModule(moduleCode)
    if (!moduleInfo) return []

    const baseTips = [
      'Create a study schedule and stick to it',
      'Attend all lectures and tutorials',
      'Form study groups with classmates',
      'Use past papers for exam preparation'
    ]

    switch (moduleCode) {
      case 'LAW1121': // Contract Law
        return [...baseTips, 'Master the four elements of contract formation', 'Practice problem questions daily', 'Create flowcharts for complex topics']
      case 'LAW1051': // Tort Law
        return [...baseTips, 'Understand the negligence test thoroughly', 'Learn key cases by heart', 'Practice applying tests to fact patterns']
      case 'LAW1071': // Criminal Law
        return [...baseTips, 'Focus on mens rea and actus reus', 'Study defences systematically', 'Use case law to illustrate principles']
      case 'LAW2011': // Land Law
        return [...baseTips, 'Draw diagrams for complex transactions', 'Understand registered vs unregistered land', 'Practice land registration scenarios']
      case 'LAW3000': // Dissertation
        return ['Choose a topic you\'re passionate about', 'Start research early', 'Meet regularly with your supervisor', 'Keep detailed research notes']
      default:
        return baseTips
    }
  }
}