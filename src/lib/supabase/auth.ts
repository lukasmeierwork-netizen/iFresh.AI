import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import { supabase } from "./client";

export type OAuthProvider = "google" | "apple";

export type SignInResult =
  | { status: "success" }
  | { status: "cancelled" }
  | { status: "error"; message: string };

// Must match a redirect URL configured in Supabase > Authentication > URL Configuration.
// `Linking.createURL('auth-callback')` resolves to `eyefreshai://auth-callback` in
// standalone/dev client builds and `exp://.../--/auth-callback` in Expo Go.
function getRedirectUrl(): string {
  return Linking.createURL("auth-callback");
}

function extractCode(url: string): string | null {
  try {
    const { queryParams } = Linking.parse(url);
    const code = queryParams?.code;
    if (typeof code === "string" && code.length > 0) return code;
    return null;
  } catch {
    return null;
  }
}

function extractOAuthError(url: string): string | null {
  try {
    const { queryParams } = Linking.parse(url);
    const description = queryParams?.error_description ?? queryParams?.error;
    if (typeof description === "string" && description.length > 0)
      return description;
    return null;
  } catch {
    return null;
  }
}

function devLog(step: string, detail?: unknown) {
  if (!__DEV__) return;
  // eslint-disable-next-line no-console
  console.log(`[auth] ${step}`, detail ?? "");
}

function formatAuthError(message: string): string {
  if (/network request failed/i.test(message)) {
    return (
      "Could not reach Supabase. Check your internet connection and restart the app. " +
      "If you use Expo Go, add the redirect URL from Metro logs to Supabase → Authentication → URL Configuration."
    );
  }
  return message;
}

function assertSupabaseConfigured(): SignInResult | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (url && key) return null;

  devLog("config missing", { url: url ?? "(empty)", keyPresent: Boolean(key) });
  return {
    status: "error",
    message:
      "Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env, then restart Metro with: npx expo start -c",
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableExchangeError(error: { message?: string; name?: string }): boolean {
  if (error.name === "AuthRetryableFetchError") return true;
  return /network request failed/i.test(error.message ?? "");
}

/**
 * After ASWebAuthenticationSession returns, RN fetch can fail briefly while the
 * network stack resumes. Retry transport errors with backoff before giving up.
 */
async function exchangeCodeForSessionWithRetry(code: string) {
  const retryDelaysMs = [300, 800, 1500];
  let lastError: { message?: string; name?: string } | null = null;

  for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
    if (attempt > 0) {
      const delayMs = retryDelaysMs[attempt - 1] ?? 1500;
      devLog("retrying code exchange", { attempt, delayMs });
      await sleep(delayMs);
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return null;

    lastError = error;
    if (!isRetryableExchangeError(error)) {
      return error;
    }
  }

  return lastError;
}

/**
 * Start a Supabase OAuth PKCE flow for Google or Apple.
 *
 * Opens an in-app browser session (ASWebAuthenticationSession on iOS), waits for
 * the provider to redirect back to our app scheme, then exchanges the returned
 * `code` for a session. The session is persisted by the Supabase client.
 */
export async function signInWithProvider(
  provider: OAuthProvider,
): Promise<SignInResult> {
  const configError = assertSupabaseConfigured();
  if (configError) return configError;

  const redirectTo = getRedirectUrl();
  devLog("starting OAuth", { provider, redirectTo });
  devLog(
    "add this redirect URL in Supabase → Authentication → URL Configuration",
    redirectTo,
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data?.url) {
    devLog("signInWithOAuth failed", error?.message ?? "no url");
    return {
      status: "error",
      message: formatAuthError(error?.message ?? "Failed to start sign-in."),
    };
  }

  devLog("opening auth session");
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
    showInRecents: false,
  });

  if (result.type === "cancel" || result.type === "dismiss") {
    devLog("auth session cancelled", result.type);
    return { status: "cancelled" };
  }

  if (result.type !== "success" || !result.url) {
    devLog("auth session incomplete", result.type);
    return { status: "error", message: "Sign-in did not complete." };
  }

  devLog("auth session returned", result.url.split("?")[0]);

  const oauthError = extractOAuthError(result.url);
  if (oauthError) {
    devLog("OAuth provider error", oauthError);
    return { status: "error", message: oauthError };
  }

  const code = extractCode(result.url);
  if (!code) {
    devLog("missing code in redirect", result.url);
    return {
      status: "error",
      message:
        "Missing authorization code in redirect. Add this redirect URL in Supabase: " +
        redirectTo,
    };
  }

  // Give the app network stack a moment to resume after the auth sheet closes.
  await sleep(150);

  devLog("exchanging code for session");
  const exchangeError = await exchangeCodeForSessionWithRetry(code);
  if (exchangeError) {
    devLog("exchangeCodeForSession failed", exchangeError.message);
    return {
      status: "error",
      message: formatAuthError(exchangeError.message ?? "Sign-in failed."),
    };
  }

  devLog("sign-in success");
  return { status: "success" };
}

export type SignOutResult = { ok: true } | { ok: false; message: string };

export async function signOutUser(): Promise<SignOutResult> {
  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}
