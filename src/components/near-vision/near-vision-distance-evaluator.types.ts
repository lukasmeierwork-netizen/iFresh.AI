export type NearVisionDistanceEvaluatorProps = {
  active: boolean;
  targetDistanceCm?: number;
  toleranceCm?: number;
  onDistanceEstimate?: (estimate: { distanceCm: number } | null) => void;
};
