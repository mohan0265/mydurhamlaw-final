export const buildTimetableLink = (dateISO: string) => `/study-schedule?date=${encodeURIComponent(dateISO)}`;
export const buildAssignmentLink = (moduleCode: string, weekNo: number) =>
  `/assignments?module=${encodeURIComponent(moduleCode)}&week=${weekNo}`;
export const buildExamLink = (moduleCode: string, topicSlug?: string) =>
  `/references?module=${encodeURIComponent(moduleCode)}${topicSlug ? `&topic=${encodeURIComponent(topicSlug)}` : ''}`;