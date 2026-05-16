/** Shared calendar / date helpers used by Assistant and other screens. */

export const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function isWithinRange(day: Date, start?: Date | null, end?: Date | null): boolean {
  if (!start || !end) {
    return false;
  }

  const current = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
  const rangeStart = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const rangeEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();

  return current > rangeStart && current < rangeEnd;
}

export function formatCalendarQuery(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatCalendarRange(start: Date, end?: Date | null): string {
  if (!end || isSameDay(start, end)) {
    return formatCalendarQuery(start);
  }

  return `${formatCalendarQuery(start)} - ${formatCalendarQuery(end)}`;
}

export function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

/** Build the 7xN grid cells for a given month; `null` entries are padding. */
export function buildMonthGrid(visibleMonth: Date): (Date | null)[] {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmptyDays = firstDay.getDay();
  const totalCells = Math.ceil((leadingEmptyDays + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - leadingEmptyDays + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      return null;
    }

    return new Date(year, month, dayNumber);
  });
}
