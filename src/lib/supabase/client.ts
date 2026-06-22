import "react-native-url-polyfill/auto";
import "./webcrypto-polyfill";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Surface misconfiguration loudly in dev; production builds should always have these set via EAS.
  // eslint-disable-next-line no-console
  console.warn(
    "[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. " +
      "Add them to .env.local and restart the dev server.",
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "", {
  // RN fetch can lose `this` context; binding avoids transport failures after OAuth.
  global: { fetch: fetch.bind(globalThis) },
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // React Native has no browser URL; we handle the PKCE callback manually.
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});
