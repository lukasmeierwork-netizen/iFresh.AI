export type DailyTaskTheme =
  | 'eye-exercise'
  | 'screen-break'
  | 'vision-rest'
  | 'hydration'
  | 'posture'
  | 'nutrition'
  | 'sleep'
  | 'environment';

const THEME_KEYWORDS: Array<[DailyTaskTheme, readonly string[]]> = [
  ['screen-break', ['20-20-20', 'screen-break', 'device-detox', 'phone-break', 'screen-pause']],
  [
    'eye-exercise',
    [
      'blink',
      'saccade',
      'convergence',
      'focus-shift',
      'near-far',
      'figure-eight',
      'eye-roll',
      'exercise',
      'drill',
      'stretch',
      'gaze',
      'coffee',
    ],
  ],
  ['vision-rest', ['palm', 'compress', 'rest', 'relax', 'soothe', 'recovery']],
  ['hydration', ['hydra', 'water', 'drink', 'humidif', 'moistur']],
  ['posture', ['posture', 'ergonom', 'distance', 'reading-distance', 'screen-position', 'desk', 'monitor-height']],
  ['nutrition', ['nutri', 'food', 'meal', 'lutein', 'omega', 'vitamin', 'leafy', 'fish', 'carrot']],
  ['sleep', ['sleep', 'bed', 'wind-down', 'nap', 'night-routine']],
  [
    'environment',
    ['light', 'glare', 'environ', 'brightness', 'lamp', 'sun', 'outdoor', 'blue-light', 'ambient', 'contrast'],
  ],
];

const THEME_FALLBACK_ORDER: readonly DailyTaskTheme[] = [
  'eye-exercise',
  'screen-break',
  'vision-rest',
  'hydration',
  'posture',
  'nutrition',
  'sleep',
  'environment',
];

function hashSlug(slug: string): number {
  let h = 5381;
  for (let i = 0; i < slug.length; i++) {
    h = ((h << 5) + h + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function resolveDailyTaskTheme(slug: string): DailyTaskTheme {
  const lower = slug.toLowerCase();
  for (const [theme, keywords] of THEME_KEYWORDS) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return theme;
    }
  }
  return THEME_FALLBACK_ORDER[hashSlug(lower) % THEME_FALLBACK_ORDER.length] ?? 'eye-exercise';
}

export function dailyTaskSlotKey(task: {
  period: string;
  position: number;
  category: string;
}): string {
  return `${task.period}:${task.position}:${task.category}`;
}
