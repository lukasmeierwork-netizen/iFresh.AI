import { getBackendUrl } from '@/lib/network/backend-origin';
import { supabase } from '@/lib/supabase/client';

export type DailyTaskPeriod = 'morning' | 'afternoon' | 'evening' | 'night';

/**
 * Free-form kebab-case slug naming the specific technique the AI picked for
 * this task (e.g. `blink-drill`, `near-far-focus`, `palming`, `20-20-20`).
 * Visual styling is resolved from the slug by keyword matching with a
 * deterministic hash fallback — see `daily-task-card.tsx`.
 */
export type DailyTaskCategory = string;

export type DailyTask = {
  id: string;
  planDate: string; // YYYY-MM-DD
  period: DailyTaskPeriod;
  category: DailyTaskCategory;
  title: string;
  description: string;
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

  return {
    id: row.id,
    planDate: row.plan_date,
    period,
    category,
    title: row.title,
    description: row.description,
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

/**
 * Fetch the plan for a single day. The backend only invokes Gemini if no row
 * exists for `(user, planDate)`; subsequent calls just re-read the saved rows.
 */
export async function fetchDailyTasksForDate(input: {
  planDate: string;
  locale?: string;
}): Promise<DailyTask[]> {
  const auth = await getAuthorizationHeader();
  if (!auth) return [];

  const params = new URLSearchParams({ date: input.planDate });
  if (input.locale && input.locale.trim()) {
    params.set('locale', input.locale.trim());
  }

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
