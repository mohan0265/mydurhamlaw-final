/**
 * Parser for Durham Panopto video titles and metadata.
 * 
 * Target Format: "LAW1071_2025 - Contract Law (25/26) > 11/12/2025 : Lecture 1"
 */

export interface PanoptoMetadata {
  moduleCode: string | null;
  moduleName: string | null;
  lectureDate: string | null; // YYYY-MM-DD
  title: string | null;
}

export function parsePanoptoTitle(rawText: string): PanoptoMetadata {
  const result: PanoptoMetadata = {
    moduleCode: null,
    moduleName: null,
    lectureDate: null,
    title: null,
  };

  if (!rawText) return result;

  // 1. Extract Module Code (e.g., LAW1071_2025 -> LAW1071)
  // Allow leading whitespace. Match any CAPS+DIGITS pattern at start.
  const codeMatch = rawText.match(/^\s*([A-Z]+\d+)/i);
  if (codeMatch) {
    result.moduleCode = codeMatch[1].toUpperCase();
  }

  // 2. Extract Module Name
  // Between " - " and " (" or " >". Allow extra spaces.
  const nameMatch = rawText.match(/-\s+(.+?)\s+(?:\(|>)/);
  if (nameMatch) {
    result.moduleName = nameMatch[1].trim();
  }

  // 3. Extract Date (e.g., 11/12/2025)
  // Search anywhere for DD/MM/YYYY or DD-MM-YYYY
  const dateMatch = rawText.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
  if (dateMatch) {
    const [_, day, month, year] = dateMatch;
    result.lectureDate = `${year}-${month}-${day}`; // ISO format
  }

  // 4. Extract Real Title
  // Everything after the last " : "
  // If no " : ", use the whole text or fallback
  const titleParts = rawText.split(' : ');
  if (titleParts.length > 1) {
    result.title = titleParts[titleParts.length - 1].trim();
  } else {
    // Fallback: if no specific title part, use the raw text but maybe clean it up?
    // For now, let's leave it null to let the user decide, or defaults to raw
    // result.title = rawText; 
    // Actually, user likely prefers the specific title. If not found, better to fill nothing or let UI handle fallback.
  }

  return result;
}
