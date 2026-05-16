import Constants from "expo-constants";
import { NativeModules } from "react-native";

/** Single local backend origin used by API helpers when no env override is set. */
export const DEFAULT_BACKEND_ORIGIN = "http://localhost:3001";

function getExpoHostIp(): string | null {
  const sourceCodeScriptUrl =
    (NativeModules as { SourceCode?: { scriptURL?: string } }).SourceCode?.scriptURL ?? null;
  const hostCandidates: Array<string | null | undefined> = [
    Constants.expoConfig?.hostUri,
    (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost,
    (Constants as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } })
      .manifest2?.extra?.expoGo?.debuggerHost,
    sourceCodeScriptUrl,
  ];

  for (const candidate of hostCandidates) {
    if (!candidate) continue;

    // Handle either `192.168.x.x:8081` or full URLs like `http://192.168.x.x:8081/...`.
    const trimmed = candidate.trim();
    if (!trimmed) continue;
    try {
      const normalized = trimmed.includes("://") ? trimmed : `http://${trimmed}`;
      const parsed = new URL(normalized);
      const host = parsed.hostname?.trim();
      if (host && host !== "localhost" && host !== "127.0.0.1") return host;
    } catch {
      const host = trimmed.split(":")[0]?.trim();
      if (host && host !== "localhost" && host !== "127.0.0.1") return host;
    }
  }

  return null;
}

/**
 * On physical devices, `localhost` points to the phone itself.
 * Replace localhost with Expo host IP so requests hit the dev machine backend.
 */
export function resolveBackendOriginForDevice(origin: string): string {
  const raw = origin.trim();
  if (!raw) return raw;
  try {
    const parsed = new URL(raw);
    if (parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
      return parsed.origin;
    }
    const expoHostIp = getExpoHostIp();
    if (!expoHostIp) return parsed.origin;
    parsed.hostname = expoHostIp;
    return parsed.origin;
  } catch {
    return raw;
  }
}

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

/** Apply localhost→Expo-host rewrite to a complete URL when needed. */
export function resolveBackendUrlForDevice(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const origin = resolveBackendOriginForDevice(parsed.origin);
    return `${origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return rawUrl;
  }
}

/** Build full backend URL from either env origin or the shared default origin. */
export function getBackendUrl(path: string, envOrigin?: string): string {
  const origin = resolveBackendOriginForDevice(
    envOrigin?.trim() || process.env.EXPO_PUBLIC_BACKEND_ORIGIN?.trim() || DEFAULT_BACKEND_ORIGIN
  );
  return `${origin}${normalizePath(path)}`;
}
