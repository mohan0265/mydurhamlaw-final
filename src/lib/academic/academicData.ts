import academicDataJson from '../../../public/data/academic_data.json';

export interface AcademicModule {
  name: string;
  description: string;
  assessment: string;
}

export interface YearData {
  modules: AcademicModule[];
}

export type AcademicYear = 'foundation_year' | 'year_1' | 'year_2' | 'year_3';

export interface AcademicData {
  foundation_year: YearData;
  year_1: YearData;
  year_2: YearData;
  year_3: YearData;
}

// Type-safe access to the JSON data
const academicData: AcademicData = academicDataJson as AcademicData;

/**
 * Get academic data for a specific year
 */
export function getYearData(year: AcademicYear): YearData {
  return academicData[year];
}

/**
 * Get all modules for a specific year
 */
export function getModulesForYear(year: AcademicYear): AcademicModule[] {
  return academicData[year]?.modules || [];
}

/**
 * Convert user's academic_year field to our AcademicYear type
 */
export function getUserAcademicYear(userYear: string): AcademicYear | null {
  const yearMap: Record<string, AcademicYear> = {
    'foundation': 'foundation_year',
    'year1': 'year_1',
    'year2': 'year_2',
    'year3': 'year_3',
  };
  
  return yearMap[userYear] || null;
}

/**
 * Get all available academic years
 */
export function getAllAcademicYears(): AcademicYear[] {
  return Object.keys(academicData) as AcademicYear[];
}

/**
 * Get display name for academic year
 */
export function getYearDisplayName(year: AcademicYear): string {
  const displayNames: Record<AcademicYear, string> = {
    'foundation_year': 'Foundation Year',
    'year_1': 'Year 1',
    'year_2': 'Year 2',
    'year_3': 'Year 3',
  };
  
  return displayNames[year];
}

/**
 * Check if a year has modules
 */
export function hasModulesForYear(year: AcademicYear): boolean {
  return academicData[year]?.modules?.length > 0;
}

/**
 * Get module by name for a specific year
 */
export function getModuleByName(year: AcademicYear, moduleName: string): AcademicModule | null {
  const modules = getModulesForYear(year);
  return modules.find(module => module.name === moduleName) || null;
}