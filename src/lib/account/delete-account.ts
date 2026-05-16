import { getBackendUrl } from "@/lib/network/backend-origin";
import { supabase } from "@/lib/supabase/client";

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; message: string };

type DeleteAccountResponse = {
  ok: boolean;
  data?: { deleted: boolean };
  error?: { code?: string; message?: string } | string;
};

function extractErrorMessage(body: DeleteAccountResponse | null, status: number): string {
  if (body?.error) {
    if (typeof body.error === "string") return body.error;
    if (typeof body.error.message === "string" && body.error.message.length > 0) {
      return body.error.message;
    }
  }
  return `Account delete failed (${status})`;
}

/**
 * Permanently delete the signed-in user's account on the backend.
 *
 * The backend wipes app rows owned by the user (best-effort) and then calls
 * Supabase Auth admin to drop the auth row. Caller is responsible for
 * signing out locally after a successful response so the auth listener
 * triggers the redirect to onboarding.
 */
export async function deleteAccount(): Promise<DeleteAccountResult> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    return { ok: false, message: "Not signed in." };
  }

  const url = getBackendUrl("/account");
  let response: Response;
  try {
    response = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    const detail =
      error instanceof Error && error.message ? `: ${error.message}` : "";
    return { ok: false, message: `Network error${detail}` };
  }

  let body: DeleteAccountResponse | null = null;
  try {
    body = (await response.json()) as DeleteAccountResponse;
  } catch {
    body = null;
  }

  if (!response.ok || !body?.ok) {
    return { ok: false, message: extractErrorMessage(body, response.status) };
  }

  return { ok: true };
}
