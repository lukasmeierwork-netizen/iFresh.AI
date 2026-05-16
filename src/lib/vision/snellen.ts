export type Eye = 'right' | 'left' | 'both';

export type NearAcuityResult = {
  eye: Eye;
  nSize: number;
  approxSnellen: string;
  decimalAcuity?: number;
};
export type NearVisionDisplayFormat = 'snellen' | 'decimal';

/** Font sizes (in typographic "N" units) used by the near-vision chart. */
export const TEST_SIZES_N = [48, 40, 32, 24, 19, 15, 12, 10, 8, 6, 5, 4, 3.3, 2.5] as const;

/** Approximate Snellen equivalents for each N size. */
export const N_TO_SNELLEN: Record<number, string> = {
  48: '20/200',
  40: '20/160',
  32: '20/125',
  24: '20/100',
  19: '20/80',
  15: '20/63',
  12: '20/50',
  10: '20/40',
  8: '20/32',
  6: '20/25',
  5: '20/20',
  4: '20/16',
  3.3: '20/13',
  2.5: '20/10',
};

/** Decimal acuity equivalent from Snellen denominator (20/x => 20/x). */
export const SNELLEN_TO_DECIMAL: Record<string, number> = {
  '20/200': 0.1,
  '20/160': 0.125,
  '20/125': 0.16,
  '20/100': 0.2,
  '20/80': 0.25,
  '20/63': 0.32,
  '20/50': 0.4,
  '20/40': 0.5,
  '20/32': 0.63,
  '20/25': 0.8,
  '20/20': 1,
  '20/16': 1.25,
  '20/13': 1.5,
  '20/10': 2,
};

export function getDecimalAcuity(result: NearAcuityResult): number | null {
  if (result.decimalAcuity != null) return result.decimalAcuity;
  return SNELLEN_TO_DECIMAL[result.approxSnellen] ?? null;
}

export function formatAcuityValue(
  result: NearAcuityResult | null,
  displayFormat: NearVisionDisplayFormat
): string {
  if (!result) return '—';
  if (displayFormat === 'snellen') return result.approxSnellen;
  const decimal = getDecimalAcuity(result);
  if (decimal == null) return '—';
  return decimal.toFixed(decimal % 1 === 0 ? 1 : 2);
}

export function formatResult(result: NearAcuityResult | null) {
  if (!result) return '—';
  const decimal =
    result.decimalAcuity ??
    (result.approxSnellen in SNELLEN_TO_DECIMAL
      ? SNELLEN_TO_DECIMAL[result.approxSnellen]
      : undefined);
  if (decimal == null) return `N${result.nSize} (≈ ${result.approxSnellen})`;
  return `N${result.nSize} (≈ ${result.approxSnellen}, ${decimal})`;
}

/** Compact line for UI summaries (e.g. home card). */
export function formatNearVisionSummary(result: NearAcuityResult | null) {
  if (!result) return '—';
  return `${result.approxSnellen} · N${result.nSize}`;
}
