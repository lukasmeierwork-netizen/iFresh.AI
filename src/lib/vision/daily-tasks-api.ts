import { getBackendUrl } from '@/lib/network/backend-origin';
import { supabase } from '@/lib/supabase/client';
import type { DailyTaskLocaleOverlay } from '@/lib/vision/daily-task-locale-cache';
import {
  normalizeTaskContentLocale,
  type TaskContentLocale,
} from '@/lib/vision/task-locales';

export type DailyTaskPeriod = 'morning' | 'afternoon' | 'evening' | 'night';

/**
 * Free-form kebab-case slug naming the specific technique the AI picked for
 * this task (e.g. `blink-drill`, `near-far-focus`, `palming`, `20-20-20`).
 * Visual styling is resolved from the slug by keyword matching with a
 * deterministic hash fallback — see `daily-task-card.tsx`.
 */
export type DailyTaskCategory = string;

export type TaskLocaleCopy = {
  title: string;
  description: string;
};

export type DailyTaskTranslations = Partial<Record<TaskContentLocale, TaskLocaleCopy>>;

export type DailyTask = {
  id: string;
  planDate: string; // YYYY-MM-DD
  period: DailyTaskPeriod;
  category: DailyTaskCategory;
  /** English fallback copy kept for legacy rows and quick display. */
  title: string;
  description: string;
  translations: DailyTaskTranslations;
  position: number;
  completed: boolean;
  completedAt: string | null;
  source: 'ai' | 'fallback' | 'manual';
};

type ApiTaskRow = {
  id: string;
  plan_date: string;
  period: string;
  category: string;
  title: string;
  description: string;
  translations?: DailyTaskTranslations | null;
  position: number;
  completed: boolean;
  completed_at: string | null;
  source: string;
};

type DailyTasksResponse = {
  ok: boolean;
  data?: ApiTaskRow[];
  error?: string;
};

type DailyTaskUpdateResponse = {
  ok: boolean;
  data?: ApiTaskRow;
  error?: string;
};

const PERIODS: readonly DailyTaskPeriod[] = ['morning', 'afternoon', 'evening', 'night'];

const CATEGORY_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

function normalizeCategorySlug(raw: string): DailyTaskCategory {
  const slug = raw
    .trim()
    .toLowerCase()
    .replace(/[\s_/]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (slug && CATEGORY_SLUG_PATTERN.test(slug)) return slug;
  return 'eye-exercise';
}

function parseTranslations(raw: unknown): DailyTaskTranslations {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: DailyTaskTranslations = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    const title =
      typeof (value as { title?: unknown }).title === 'string'
        ? (value as { title: string }).title.trim()
        : '';
    const description =
      typeof (value as { description?: unknown }).description === 'string'
        ? (value as { description: string }).description.trim()
        : '';
    if (!title || !description) continue;
    out[normalizeTaskContentLocale(key)] = { title, description };
  }
  return out;
}

function getDailyTasksUrl(): string {
  return getBackendUrl('/vision/daily-tasks');
}

function normalizeRow(row: ApiTaskRow): DailyTask | null {
  if (
    typeof row.id !== 'string' ||
    typeof row.plan_date !== 'string' ||
    typeof row.title !== 'string' ||
    typeof row.description !== 'string'
  ) {
    return null;
  }
  const period = PERIODS.includes(row.period as DailyTaskPeriod)
    ? (row.period as DailyTaskPeriod)
    : null;
  const category =
    typeof row.category === 'string' ? normalizeCategorySlug(row.category) : 'eye-exercise';
  if (!period) return null;
  const source: DailyTask['source'] =
    row.source === 'fallback' || row.source === 'manual' ? row.source : 'ai';

  const translations = parseTranslations(row.translations);
  const hasTranslations = Object.keys(translations).length > 0;
  const resolvedTranslations = hasTranslations
    ? translations
    : {
        en: { title: row.title, description: row.description },
      };

  const display =
    resolvedTranslations.en ??
    resolvedTranslations[normalizeTaskContentLocale(Object.keys(resolvedTranslations)[0])] ??
    { title: row.title, description: row.description };

  return {
    id: row.id,
    planDate: row.plan_date,
    period,
    category,
    title: display.title,
    description: display.description,
    translations: resolvedTranslations,
    position: typeof row.position === 'number' ? row.position : 0,
    completed: row.completed === true,
    completedAt: typeof row.completed_at === 'string' ? row.completed_at : null,
    source,
  };
}

async function getAuthorizationHeader(): Promise<Record<string, string> | null> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

type TranslateTasksResponse = {
  ok: boolean;
  data?: DailyTaskLocaleOverlay;
  error?: string;
};

function toLocalIsoDate(value: Date): string {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Fetch the canonical English task plan for a day. Auto-generation runs only
 * when `planDate` is the client's current calendar day.
 */
export async function fetchDailyTasksForDate(input: {
  planDate: string;
}): Promise<DailyTask[]> {
  const auth = await getAuthorizationHeader();
  if (!auth) return [];

  const params = new URLSearchParams({
    date: input.planDate,
    today: toLocalIsoDate(new Date()),
  });
  const url = `${getDailyTasksUrl()}?${params.toString()}`;

  let response: Response;
  try {
    response = await fetch(url, { method: 'GET', headers: auth });
  } catch (error) {
    const detail = error instanceof Error && error.message ? `: ${error.message}` : '';
    throw new Error(`Daily tasks fetch network error (${url})${detail}`);
  }

  if (!response.ok) {
    let message = `Daily tasks fetch failed (${response.status})`;
    try {
      const body = (await response.json()) as DailyTasksResponse;
      if (typeof body.error === 'string' && body.error.length > 0) message = body.error;
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  const body = (await response.json()) as DailyTasksResponse;
  if (!Array.isArray(body.data)) return [];

  return body.data
    .map(normalizeRow)
    .filter((row): row is DailyTask => row != null);
}

/** Translate English source tasks into the requested locale (lazy, cached on device). */
export async function translateDailyTasks(input: {
  locale: string;
  tasks: Array<Pick<DailyTask, 'id' | 'title' | 'description'>>;
}): Promise<DailyTaskLocaleOverlay> {
  const auth = await getAuthorizationHeader();
  if (!auth) return {};

  const url = `${getDailyTasksUrl()}/translate`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locale: input.locale,
        tasks: input.tasks.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
        })),
      }),
    });
  } catch (error) {
    const detail = error instanceof Error && error.message ? `: ${error.message}` : '';
    throw new Error(`Daily tasks translation network error (${url})${detail}`);
  }

  if (!response.ok) {
    let message = `Daily tasks translation failed (${response.status})`;
    try {
      const body = (await response.json()) as TranslateTasksResponse;
      if (typeof body.error === 'string' && body.error.length > 0) message = body.error;
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  const body = (await response.json()) as TranslateTasksResponse;
  return body.data ?? {};
}

export async function setDailyTaskCompletion(input: {
  taskId: string;
  completed: boolean;
}): Promise<DailyTask | null> {
  const auth = await getAuthorizationHeader();
  if (!auth) return null;

  const url = `${getDailyTasksUrl()}/${encodeURIComponent(input.taskId)}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'PATCH',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: input.completed }),
    });
  } catch (error) {
    const detail = error instanceof Error && error.message ? `: ${error.message}` : '';
    throw new Error(`Daily task update network error (${url})${detail}`);
  }

  if (!response.ok) {
    let message = `Daily task update failed (${response.status})`;
    try {
      const body = (await response.json()) as DailyTaskUpdateResponse;
      if (typeof body.error === 'string' && body.error.length > 0) message = body.error;
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  const body = (await response.json()) as DailyTaskUpdateResponse;
  if (!body.data) return null;
  return normalizeRow(body.data);
}
