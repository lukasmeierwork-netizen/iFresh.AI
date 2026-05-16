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
  const redirectTo = getRedirectUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data?.url) {
    return {
      status: "error",
      message: error?.message ?? "Failed to start sign-in.",
    };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
    showInRecents: false,
  });

  if (result.type === "cancel" || result.type === "dismiss") {
    return { status: "cancelled" };
  }

  if (result.type !== "success" || !result.url) {
    return { status: "error", message: "Sign-in did not complete." };
  }

  const oauthError = extractOAuthError(result.url);
  if (oauthError) {
    return { status: "error", message: oauthError };
  }

  const code = extractCode(result.url);
  if (!code) {
    return {
      status: "error",
      message: "Missing authorization code in redirect.",
    };
  }

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return { status: "error", message: exchangeError.message };
  }

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
