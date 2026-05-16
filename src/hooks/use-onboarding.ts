import { useCallback, useMemo, useReducer } from 'react';

import { ONBOARDING_STEPS, TOTAL_ONBOARDING_STEPS } from '@/lib/onboarding/steps';
import type { OnboardingDraft, OnboardingStepId } from '@/lib/onboarding/types';

type State = {
  stepIndex: number;
  draft: OnboardingDraft;
};

type Action =
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'goto'; index: number }
  | { type: 'setAnswer'; patch: Partial<OnboardingDraft> }
  | { type: 'reset' };

const INITIAL_STATE: State = { stepIndex: 0, draft: {} };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'next':
      return {
        ...state,
        stepIndex: Math.min(state.stepIndex + 1, TOTAL_ONBOARDING_STEPS - 1),
      };
    case 'back':
      return { ...state, stepIndex: Math.max(state.stepIndex - 1, 0) };
    case 'goto':
      return {
        ...state,
        stepIndex: Math.max(0, Math.min(action.index, TOTAL_ONBOARDING_STEPS - 1)),
      };
    case 'setAnswer':
      return { ...state, draft: { ...state.draft, ...action.patch } };
    case 'reset':
      return INITIAL_STATE;
    default:
      return state;
  }
}

/**
 * In-memory onboarding state machine. Intentionally has NO persistence layer
 * (no AsyncStorage / SecureStore) — every remount starts from step 0 so the
 * flow is easy to iterate on while building UI.
 */
export function useOnboarding() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const currentStepId: OnboardingStepId = ONBOARDING_STEPS[state.stepIndex];
  const isFirst = state.stepIndex === 0;
  const isLast = state.stepIndex === TOTAL_ONBOARDING_STEPS - 1;

  const next = useCallback(() => dispatch({ type: 'next' }), []);
  const back = useCallback(() => dispatch({ type: 'back' }), []);
  const goto = useCallback((index: number) => dispatch({ type: 'goto', index }), []);
  const setAnswer = useCallback(
    (patch: Partial<OnboardingDraft>) => dispatch({ type: 'setAnswer', patch }),
    []
  );
  const reset = useCallback(() => dispatch({ type: 'reset' }), []);

  const progress = useMemo(
    () => (state.stepIndex + 1) / TOTAL_ONBOARDING_STEPS,
    [state.stepIndex]
  );

  return {
    stepIndex: state.stepIndex,
    totalSteps: TOTAL_ONBOARDING_STEPS,
    currentStepId,
    draft: state.draft,
    isFirst,
    isLast,
    progress,
    next,
    back,
    goto,
    setAnswer,
    reset,
  };
}

export type UseOnboarding = ReturnType<typeof useOnboarding>;
