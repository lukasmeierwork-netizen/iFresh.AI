# Supabase auth setup (Google + Apple)

This app uses Supabase's OAuth PKCE flow for **Continue with Google** and **Continue with Apple**. The mobile client opens a Safari auth sheet, the provider redirects back to our iOS URL scheme, and the Supabase client exchanges the returned code for a session that is persisted with `AsyncStorage`.

No native Google or Apple SDKs are installed; everything goes through Supabase.

## 1. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-OR-PUBLISHABLE-KEY
```

Only `EXPO_PUBLIC_*` variables are inlined into the client bundle. Restart `expo start` after changes.

For EAS builds, also add the same variables via `eas env:create` (or `eas.json`'s `build.*.env`).

## 2. Supabase dashboard: redirect URL

In **Authentication → URL Configuration**:

- **Site URL**: pick any value — it is not used by the mobile client (you can point it at your marketing site).
- **Redirect URLs**: add this entry exactly:

  ```
  eyefreshai://auth-callback
  ```

  This matches `app.json`'s `"scheme": "eyefreshai"` and `Linking.createURL('auth-callback')` in [`src/lib/supabase/auth.ts`](../src/lib/supabase/auth.ts).

If you also want to use Expo Go during development, add the Expo Go redirect too (it looks like `exp://192.168.x.x:8081/--/auth-callback`). You can add a wildcard form like `exp://*/**` if your dashboard allows it.

## 3. Google provider

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials) create an **OAuth 2.0 Client ID** of type **Web application**.
   - Authorized redirect URI: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
2. Copy the **Client ID** and **Client secret**.
3. In Supabase → **Authentication → Providers → Google**:
   - Toggle **Enable Sign in with Google**.
   - Paste **Client ID** and **Client secret**.
   - Save.

No iOS/Android OAuth client IDs are needed because the flow runs in the browser and Supabase handles the token exchange server-side.

## 4. Apple provider

1. In the [Apple Developer portal](https://developer.apple.com/account/resources/identifiers/list):
   - Create (or reuse) an **App ID** for `com.ss.eyefreshAI` and enable **Sign in with Apple**.
   - Create a **Services ID** (for example, `com.ss.eyefreshAI.web`) and enable **Sign in with Apple** for it.
     - Configure the Services ID:
       - **Primary App ID**: the App ID above.
       - **Domains and Subdomains**: `YOUR-PROJECT-REF.supabase.co`
       - **Return URLs**: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
   - Create a **Sign in with Apple key** and download the `.p8` file. Note the **Key ID** and **Team ID**.
2. In Supabase → **Authentication → Providers → Apple**:
   - Toggle **Enable Sign in with Apple**.
   - **Client ID (Services ID)**: the Services ID you created.
   - **Secret Key (.p8 contents)**, **Key ID**, **Team ID**: paste the values from Apple.
   - Save.

## 5. How the app wires it up

- Supabase client: [`src/lib/supabase/client.ts`](../src/lib/supabase/client.ts)
  - `flowType: 'pkce'`, sessions persisted in `AsyncStorage`.
- OAuth helper: [`src/lib/supabase/auth.ts`](../src/lib/supabase/auth.ts)
  - `signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } })`
  - Opens the provider URL with `WebBrowser.openAuthSessionAsync`.
  - Parses the `code` from the redirect and calls `exchangeCodeForSession`.
- Session state: [`src/hooks/use-auth.tsx`](../src/hooks/use-auth.tsx)
  - `AuthProvider` subscribes to `supabase.auth.onAuthStateChange`.
- Routing gate: [`src/app/_layout.tsx`](../src/app/_layout.tsx)
  - Signed-out users are sent to `onboarding`.
  - Signed-in users skip onboarding and land on `(tabs)`.
- UI entry point: [`src/components/onboarding/steps/step-create-account.tsx`](../src/components/onboarding/steps/step-create-account.tsx)

## 6. Manual verification

1. `yarn ios` (or `npx expo run:ios`) to launch a dev client that honors the `eyefreshai://` scheme. Expo Go works too if you added its redirect URL in step 2.
2. Progress through onboarding to **Create your account**.
3. Tap **Continue with Google** → Safari sheet → sign in → returns to app → lands on the tabs screen.
4. Tap **Continue with Apple** → Safari sheet → sign in → returns to app → lands on the tabs screen.
5. Force-quit the app and relaunch → stays signed in, skips onboarding.
6. Dismiss the browser sheet mid-flow → returns to the Create Account step with no error banner; tapping again works.

## 7. Troubleshooting

- **Stuck on "Sign-in did not complete."** — the redirect URL registered in Supabase does not match `eyefreshai://auth-callback`. Double-check spelling in Authentication → URL Configuration.
- **Google error: `redirect_uri_mismatch`** — the **Authorized redirect URI** in Google Cloud must be the Supabase callback (`https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`), *not* the app scheme.
- **Apple error: `invalid_client`** — the Services ID, Team ID, Key ID, or `.p8` pasted into Supabase is wrong, or the Services ID's Return URL does not point at the Supabase callback.
- **Session doesn't persist** — make sure `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set before the app starts; the client logs a warning otherwise.
