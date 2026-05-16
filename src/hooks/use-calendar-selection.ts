import { useCallback, useMemo, useState } from 'react';

import {
  buildMonthGrid,
  formatCalendarQuery,
  formatCalendarRange,
  startOfMonth,
} from '@/lib/calendar/date-utils';

type UseCalendarSelectionOptions = {
  initialDate?: Date;
  /** Called when the user's selection changes; receives the display string. */
  onQueryChange?: (next: string) => void;
};

/**
 * State machine for a date-range picker. Tracks the currently visible month,
 * the selected start/end, and exposes handlers that keep all of them in sync.
 */
export function useCalendarSelection({ initialDate, onQueryChange }: UseCalendarSelectionOptions = {}) {
  const seed = initialDate ?? new Date();

  const [selectedDate, setSelectedDate] = useState<Date>(seed);
  const [rangeStartDate, setRangeStartDate] = useState<Date | null>(seed);
  const [rangeEndDate, setRangeEndDate] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState<Date>(startOfMonth(seed));

  const calendarDays = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth]);

  const toggle = useCallback(() => setIsOpen((current) => !current), []);

  const goToPreviousMonth = useCallback(
    () => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1)),
    []
  );

  const goToNextMonth = useCallback(
    () => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1)),
    []
  );

  const selectDate = useCallback(
    (nextDate: Date) => {
      if (!rangeStartDate || (rangeStartDate && rangeEndDate)) {
        setRangeStartDate(nextDate);
        setRangeEndDate(null);
        onQueryChange?.(formatCalendarQuery(nextDate));
      } else if (nextDate < rangeStartDate) {
        setRangeStartDate(nextDate);
        setRangeEndDate(rangeStartDate);
        onQueryChange?.(formatCalendarRange(nextDate, rangeStartDate));
      } else {
        setRangeEndDate(nextDate);
        onQueryChange?.(formatCalendarRange(rangeStartDate, nextDate));
      }

      setSelectedDate(nextDate);
      setVisibleMonth(startOfMonth(nextDate));
    },
    [onQueryChange, rangeEndDate, rangeStartDate]
  );

  const clear = useCallback(() => {
    setRangeStartDate(null);
    setRangeEndDate(null);
    onQueryChange?.('');
    setIsOpen(false);
  }, [onQueryChange]);

  const close = useCallback(() => setIsOpen(false), []);

  return {
    selectedDate,
    rangeStartDate,
    rangeEndDate,
    isOpen,
    visibleMonth,
    calendarDays,
    toggle,
    goToPreviousMonth,
    goToNextMonth,
    selectDate,
    clear,
    close,
  };
}
