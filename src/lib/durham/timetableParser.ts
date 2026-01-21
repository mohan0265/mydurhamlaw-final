
export interface ParsedTimetableEvent {
  title: string;
  day: string; // "Monday", "Tuesday", etc.
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  location?: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function parseTimetableText(text: string): ParsedTimetableEvent[] {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const events: ParsedTimetableEvent[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Simple heuristic regex:
    // Look for Day (optional, might be implied if not present, but let's require it for now or try to find it)
    // Look for Time range: \d{1,2}:\d{2}\s?[–-]\s?\d{1,2}:\d{2}
    
    // Example: "Contract Law Lecture – Monday 9:00–11:00, Elvet Riverside 2"
    
    // 1. Find time range
    const timeMatch = trimmed.match(/(\d{1,2}:\d{2})\s?[–-]\s?(\d{1,2}:\d{2})/);
    if (!timeMatch || !timeMatch[1] || !timeMatch[2]) continue; // Skip lines without time

    const startTime = timeMatch[1];
    const endTime = timeMatch[2];
    
    // 2. Find day
    const dayMatch = DAYS.find(d => new RegExp(d, 'i').test(trimmed));
    if (!dayMatch) continue; // Skip if no day found

    // 3. Extract title and location
    // Remove day and time from string to see what's left
    let remaining = trimmed
      .replace(timeMatch[0], '')
      .replace(new RegExp(dayMatch, 'i'), '')
      .replace(/[–-]/g, '') // Remove dashes
      .trim();

    // Heuristic: Split by comma for location?
    // "Contract Law Lecture , Elvet Riverside 2"
    let title = remaining;
    let location = "";

    if (remaining.includes(',')) {
      const parts = remaining.split(',');
      title = (parts[0] || '').trim();
      location = parts.slice(1).join(',').trim();
    } else {
        // Fallback: if ends with typical location indicators or just take the last part? 
        // For now, let's assume everything else is title.
        title = remaining;
    }
    
    // Clean up title
    title = title.replace(/^[,.\s]+|[,.\s]+$/g, '');

    events.push({
      title,
      day: dayMatch,
      startTime,
      endTime,
      location
    });
  }

  return events;
}
