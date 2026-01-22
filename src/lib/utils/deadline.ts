import { differenceInMinutes, differenceInHours, formatDistance, differenceInDays } from 'date-fns';

export interface DeadlineStatus {
  text: string;
  colorClass: string; // Tailwind class component (e.g. 'text-red-600')
  bgClass: string;    // Tailwind bg (e.g. 'bg-red-50')
  isUrgent: boolean;
  isOverdue: boolean;
}

/**
 * Calculates a precise, human-readable deadline string.
 * Logic:
 * - Overdue: "Overdue by X"
 * - < 24 Hours: "Xh Ym" (Precise)
 * - < 7 Days: "X days" (Short)
 * - > 7 Days: "X days"
 * 
 * Note: Input dates are expected to be ISO strings or Date objects.
 * Comparisons are done against client local time (Relative), which is correct for countdowns.
 * (e.g. "Due in 5 hours" is true regardless of timezone, as long as both points are absolute moments in time).
 */
export function calculateDeadlineStatus(dueDate: string | Date): DeadlineStatus {
  const now = new Date();
  const due = new Date(dueDate);

  // Difference in milliseconds
  const diffMs = due.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // 1. Overdue
  if (diffMs < 0) {
    const absMinutes = Math.abs(diffMinutes);
    let overdueText = "Overdue";
    
    if (absMinutes < 60) overdueText = `Overdue by ${absMinutes}m`;
    else if (absMinutes < 24 * 60) overdueText = `Overdue by ${Math.floor(absMinutes / 60)}h`;
    else overdueText = `Overdue by ${Math.abs(diffDays)}d`;

    return {
      text: overdueText,
      colorClass: 'text-red-700',
      bgClass: 'bg-red-50 border-red-100',
      isUrgent: true,
      isOverdue: true
    };
  }

  // 2. Urgent (< 24 Hours) - SHOW PRECISE TIMER
  if (diffHours < 24) {
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    
    return {
      text: `${hours}h ${mins}m`,
      colorClass: 'text-orange-700',
      bgClass: 'bg-orange-50 border-orange-100',
      isUrgent: true,
      isOverdue: false
    };
  }

  // 3. Warning (< 3 Days)
  if (diffDays < 3) {
    return {
      text: `${diffDays} days`,
      colorClass: 'text-amber-700',
      bgClass: 'bg-amber-50 border-amber-100',
      isUrgent: true,
      isOverdue: false
    };
  }

  // 4. Safe (> 3 Days)
  return {
    text: `${diffDays} days`,
    colorClass: 'text-blue-700',
    bgClass: 'bg-blue-50 border-blue-100',
    isUrgent: false,
    isOverdue: false
  };
}
