/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, type AppThemeTokens } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export type AppTheme = AppThemeTokens & { scheme: "light" | "dark" };

export function useTheme(): AppTheme {
  const scheme = useColorScheme();
  const mode: "light" | "dark" = scheme === "dark" ? "dark" : "light";

  return { ...(Colors[mode] as AppThemeTokens), scheme: mode };
}
