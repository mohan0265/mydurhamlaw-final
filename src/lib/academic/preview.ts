export type YearKey = 'foundation' | 'year_1' | 'year_2' | 'year_3';

/**
 * Sanitize and validate year parameter from URL or user input
 */
export function sanitizeYear(y?: string | null): YearKey | null {
  if (!y) return null;
  
  const yearKey = y.toLowerCase().trim();
  const validYears: YearKey[] = ['foundation', 'year_1', 'year_2', 'year_3'];
  
  return validYears.includes(yearKey as YearKey) ? (yearKey as YearKey) : null;
}

/**
 * Convert year key to URL path segment
 */
export function yearKeyToPath(year: YearKey): string {
  const pathMap: Record<YearKey, string> = {
    foundation: '/dashboard/foundation',
    year_1: '/dashboard/year1', 
    year_2: '/dashboard/year2',
    year_3: '/dashboard/year3'
  };
  
  return pathMap[year];
}

/**
 * Convert URL path to year key
 */
export function pathToYearKey(path: string): YearKey | null {
  const reverseMap: Record<string, YearKey> = {
    '/dashboard/foundation': 'foundation',
    '/dashboard/year1': 'year_1',
    '/dashboard/year2': 'year_2', 
    '/dashboard/year3': 'year_3'
  };
  
  return reverseMap[path] || null;
}

/**
 * Get display name for year key
 */
export function getYearDisplayName(year: YearKey): string {
  const displayMap: Record<YearKey, string> = {
    foundation: 'Foundation Year',
    year_1: 'Year 1',
    year_2: 'Year 2',
    year_3: 'Year 3'
  };
  
  return displayMap[year];
}

/**
 * Convert legacy user_type/year_group to new YearKey format
 */
export function legacyToYearKey(legacyYear?: string): YearKey | null {
  if (!legacyYear) return null;
  
  const legacyMap: Record<string, YearKey> = {
    foundation: 'foundation',
    year1: 'year_1',
    year2: 'year_2',
    year3: 'year_3'
  };
  
  return legacyMap[legacyYear.toLowerCase()] || null;
}

/**
 * Check if year key represents a valid academic year
 */
export function isValidYearKey(year: string): year is YearKey {
  return ['foundation', 'year_1', 'year_2', 'year_3'].includes(year);
}

/**
 * Get next academic year progression
 */
export function getNextYear(currentYear: YearKey): YearKey | null {
  const progression: Record<YearKey, YearKey | null> = {
    foundation: 'year_1',
    year_1: 'year_2',
    year_2: 'year_3',
    year_3: null // Final year
  };
  
  return progression[currentYear];
}

/**
 * Get previous academic year in progression
 */
export function getPreviousYear(currentYear: YearKey): YearKey | null {
  const regression: Record<YearKey, YearKey | null> = {
    foundation: null, // First year
    year_1: 'foundation',
    year_2: 'year_1', 
    year_3: 'year_2'
  };
  
  return regression[currentYear];
}

/**
 * Get all available years for preview
 */
export function getAllYearOptions(): Array<{ key: YearKey; display: string; path: string }> {
  const years: YearKey[] = ['foundation', 'year_1', 'year_2', 'year_3'];
  
  return years.map(year => ({
    key: year,
    display: getYearDisplayName(year),
    path: yearKeyToPath(year)
  }));
}