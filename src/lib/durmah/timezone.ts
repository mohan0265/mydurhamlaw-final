/**
 * Durmah Timezone Helper - SINGLE SOURCE OF TRUTH
 * All date/time computations for Durmah must use these functions.
 * This ensures consistency across voice, text chat, and all contexts.
 */

export const DEFAULT_TZ = 'Europe/London';

export interface TZParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekdayShort: string;
  weekdayLong: string;
}

export interface NowPacket {
  isoUTC: string;
  dayKey: string;        // YYYY-MM-DD in timezone
  weekday: string;       // Full weekday name
  weekdayShort: string;  // Mon, Tue, etc
  dateHuman: string;     // "12 January 2026"
  timeHuman: string;     // "19:24"
  nowText: string;       // "Monday, 12 January 2026, 19:24"
}

/**
 * Get date parts in specified timezone
 */
export function getTZParts(date: Date, timeZone: string): TZParts {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      map[part.type] = part.value;
    }
  }
  
  // Also get long weekday
  const longFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'long',
  });
  const weekdayLong = longFormatter.format(date);
  
  return {
    year: parseInt(map.year || '2026', 10),
    month: parseInt(map.month || '01', 10),
    day: parseInt(map.day || '01', 10),
    hour: parseInt(map.hour || '00', 10),
    minute: parseInt(map.minute || '00', 10),
    weekdayShort: map.weekday || 'Mon',
    weekdayLong,
  };
}

/**
 * Build YYYY-MM-DD key from TZParts
 */
export function buildDayKey(parts: TZParts): string {
  const y = String(parts.year);
  const m = String(parts.month).padStart(2, '0');
  const d = String(parts.day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Build YYYY-MM-DD key directly from Date and timezone
 */
export function dateToDayKey(date: Date, timeZone: string): string {
  return buildDayKey(getTZParts(date, timeZone));
}

/**
 * Convert dayKey (YYYY-MM-DD) to serial number for date arithmetic
 * Uses UTC to avoid any timezone issues in the arithmetic
 */
export function dayKeyToSerial(dayKey: string): number {
  const [y, m, d] = dayKey.split('-').map(Number);
  return Math.floor(Date.UTC(y || 0, (m || 1) - 1, d || 1) / 86400000);
}

/**
 * Calculate days between two dayKeys
 * Positive = future, Negative = past
 */
export function daysBetween(fromKey: string, toKey: string): number {
  return dayKeyToSerial(toKey) - dayKeyToSerial(fromKey);
}

/**
 * Format the complete NOW packet for Durmah context
 */
export function formatNowPacket(date: Date, timeZone: string): NowPacket {
  const parts = getTZParts(date, timeZone);
  const dayKey = buildDayKey(parts);
  
  // Format human-readable date
  const dateFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const dateHuman = dateFormatter.format(date);
  
  // Format time
  const timeHuman = `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
  
  // Full now text for prompts
  const nowText = `${parts.weekdayLong}, ${dateHuman}, ${timeHuman}`;
  
  return {
    isoUTC: date.toISOString(),
    dayKey,
    weekday: parts.weekdayLong,
    weekdayShort: parts.weekdayShort,
    dateHuman,
    timeHuman,
    nowText,
  };
}

/**
 * Get daysLeft from today to a due date, computed in timezone
 * Returns: positive = future, negative = overdue, 0 = today
 */
export function getDaysLeft(
  nowDayKey: string, 
  dueDate: Date | string, 
  timeZone: string
): number {
  const dueDateObj = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const dueDayKey = dateToDayKey(dueDateObj, timeZone);
  return daysBetween(nowDayKey, dueDayKey);
}
