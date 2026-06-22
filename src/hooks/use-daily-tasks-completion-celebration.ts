import { useEffect, useRef, useState } from 'react';

type UseDailyTasksCompletionCelebrationInput = {
  planDateIso: string;
  completed: number;
  total: number;
  loading: boolean;
};

/**
 * Fires once when the user completes the final task for a day (crosses to 100%).
 * Does not fire when a day is already complete on load or when switching dates.
 */
export function useDailyTasksCompletionCelebration({
  planDateIso,
  completed,
  total,
  loading,
}: UseDailyTasksCompletionCelebrationInput) {
  const [visible, setVisible] = useState(false);
  const prevCompletedRef = useRef(0);
  const skipCelebrationCheckRef = useRef(false);

  useEffect(() => {
    skipCelebrationCheckRef.current = true;
    setVisible(false);
    prevCompletedRef.current = 0;
  }, [planDateIso]);

  useEffect(() => {
    if (loading || total === 0) return;

    if (skipCelebrationCheckRef.current) {
      skipCelebrationCheckRef.current = false;
      prevCompletedRef.current = completed;
      return;
    }

    const prev = prevCompletedRef.current;
    if (completed === total && prev < completed) {
      setVisible(true);
    }

    prevCompletedRef.current = completed;
  }, [completed, loading, total]);

  const dismiss = () => setVisible(false);

  return { visible, dismiss };
}
