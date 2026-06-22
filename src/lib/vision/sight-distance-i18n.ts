import type { SightDistanceStatus } from '@/lib/vision/near-vision-distance';

export type SightStatusTranslationKey =
  | 'hero.sightStatus.shortSighted'
  | 'hero.sightStatus.longSighted'
  | 'hero.sightStatus.normal';

export function sightStatusTranslationKey(
  status: SightDistanceStatus,
): SightStatusTranslationKey {
  switch (status) {
    case 'shortSighted':
      return 'hero.sightStatus.shortSighted';
    case 'longSighted':
      return 'hero.sightStatus.longSighted';
    case 'normal':
      return 'hero.sightStatus.normal';
  }
}
