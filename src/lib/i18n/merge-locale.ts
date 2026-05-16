/** Deep-merge plain objects for locale overrides (patch wins on leaves). */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends (infer U)[]
    ? U[]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

function isPlainRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function applyPatch(target: Record<string, unknown>, patch: Record<string, unknown>) {
  for (const key of Object.keys(patch)) {
    const pv = patch[key];
    if (pv === undefined) continue;
    const tv = target[key];
    if (isPlainRecord(tv) && isPlainRecord(pv)) {
      applyPatch(tv, pv as Record<string, unknown>);
    } else {
      target[key] = pv;
    }
  }
}

/** Returns a deep clone of `base` with `patch` applied recursively. */
export function mergeLocale<T extends Record<string, unknown>>(base: T, patch: DeepPartial<T>): T {
  const clone = deepClone(base);
  if (patch && Object.keys(patch).length > 0) {
    applyPatch(clone as Record<string, unknown>, patch as Record<string, unknown>);
  }
  return clone;
}

/**
 * Turns `{'a.b.c': 'x'}` into `{ a: { b: { c: 'x' } } }` for mergeLocale.
 */
export function unflattenStringMap(flat: Record<string, string>): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  for (const [path, value] of Object.entries(flat)) {
    const parts = path.split('.').filter(Boolean);
    if (parts.length === 0) continue;
    let cur: Record<string, unknown> = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i]!;
      const next = cur[p];
      if (!isPlainRecord(next)) {
        const created: Record<string, unknown> = {};
        cur[p] = created;
        cur = created;
      } else {
        cur = next;
      }
    }
    cur[parts[parts.length - 1]!] = value;
  }
  return root;
}
