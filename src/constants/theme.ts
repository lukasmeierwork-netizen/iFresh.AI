/**
 * App-wide design tokens. Keep anything reused across multiple screens
 * (colors, gradients, shadows, spacing) in this file so the product can be
 * re-skinned from a single source of truth.
 */

import "@/global.css";

import { type ViewStyle } from "react-native";

/**
 * Core surfaces + typography for standard (non–frosted-glass) screens.
 * `glass*` tokens back tab “glass” routes and chat chrome over the photo layer.
 */
export const Colors = {
  light: {
    text: "#0f172a",
    background: "#f4f7fc",
    backgroundElement: "#e8edf5",
    backgroundSelected: "#d8e0ed",
    textSecondary: "#5c6470",
    glassRoot: "#d4deef",
    glassImageOverlay: "#FFFFF988",
    glassTextPrimary: "#0f172a",
    glassTextSecondary: "rgba(15, 23, 42, 0.82)",
    glassTextMuted: "rgba(15, 23, 42, 0.58)",
    glassTextFaint: "rgba(15, 23, 42, 0.45)",
    glassBorder: "rgba(15, 23, 42, 0.11)",
    glassBorderMuted: "rgba(15, 23, 42, 0.07)",
    glassBorderStrong: "rgba(15, 23, 42, 0.18)",
    glassSurface: "#FFFFF899",
    glassSurfaceRaised: "rgba(255, 255, 255, 0.78)",
    glassSurfaceStrong: "rgba(0, 0, 0, 0.03)",
    glassIcon: "#0f172a",
    glassIconMuted: "rgba(15, 23, 42, 0.48)",
    glassPrimarySoft: "rgba(30, 136, 255, 0.16)",
    glassScrim: "rgba(15, 23, 42, 0.32)",
    glassHandle: "rgba(15, 23, 42, 0.22)",
    glassTrack: "rgba(15, 23, 42, 0.14)",
    /** Filled bars / meters on glass (non-brand accent). */
    glassMeterFill: "rgba(15, 23, 42, 0.45)",
    glassGrid: "rgba(15, 23, 42, 0.11)",
    glassWell: "rgba(15, 23, 42, 0.06)",
    shadow: "rgba(15, 23, 42, 0.22)",
    chatComposerTint: "rgba(255, 255, 255, 0.78)",
    chatComposerBorder: "rgba(15, 23, 42, 0.12)",
    chatHeaderIcon: "#0f172a",
    lightboxRoot: "#eef2f9",
    lightboxScrimTop: "rgba(15, 23, 42, 0.12)",
    lightboxScrimBottom: "rgba(15, 23, 42, 0.55)",
  },
  dark: {
    text: "#ffffff",
    background: "#000000",
    backgroundElement: "#212225",
    backgroundSelected: "#2E3135",
    textSecondary: "#B0B4BA",
    glassRoot: "#0b0d12",
    glassImageOverlay: "rgba(8, 12, 22, 0.18)",
    glassTextPrimary: "#ffffff",
    glassTextSecondary: "rgba(255, 255, 255, 0.86)",
    glassTextMuted: "rgba(255, 255, 255, 0.68)",
    glassTextFaint: "rgba(255, 255, 255, 0.52)",
    glassBorder: "rgba(255, 255, 255, 0.15)",
    glassBorderMuted: "rgba(255, 255, 255, 0.10)",
    glassBorderStrong: "rgba(255, 255, 255, 0.35)",
    glassSurface: "rgba(255, 255, 255, 0.05)",
    glassSurfaceRaised: "rgba(255, 255, 255, 0.10)",
    glassSurfaceStrong: "rgba(255, 255, 255, 0.12)",
    glassIcon: "#ffffff",
    glassIconMuted: "rgba(255, 255, 255, 0.62)",
    glassPrimarySoft: "rgba(30, 136, 255, 0.18)",
    glassScrim: "rgba(0, 0, 0, 0.35)",
    glassHandle: "rgba(255, 255, 255, 0.30)",
    glassTrack: "rgba(255, 255, 255, 0.20)",
    glassMeterFill: "rgba(255, 255, 255, 0.88)",
    glassGrid: "rgba(255, 255, 255, 0.14)",
    glassWell: "rgba(0, 0, 0, 0.28)",
    shadow: "#000000",
    chatComposerTint: "rgba(232, 238, 246, 0.52)",
    chatComposerBorder: "rgba(255, 255, 255, 0.30)",
    chatHeaderIcon: "#ffffff",
    lightboxRoot: "#030305",
    lightboxScrimTop: "rgba(0, 0, 0, 0.55)",
    lightboxScrimBottom: "rgba(0, 0, 0, 0.75)",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** Color tokens for one appearance; light and dark share the same keys. */
export type AppThemeTokens = (typeof Colors)["light"];

export const Fonts = {
  /** iOS `UIFontDescriptorSystemDesignDefault` */
  sans: "system-ui",
  /** iOS `UIFontDescriptorSystemDesignSerif` */
  serif: "ui-serif",
  /** iOS `UIFontDescriptorSystemDesignRounded` */
  rounded: "ui-rounded",
  /** iOS `UIFontDescriptorSystemDesignMonospaced` */
  mono: "ui-monospace",
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

// iOS native tabs can be slightly taller on compact devices; keep extra
// scroll padding so the last card never sits under the tab bar.
export const BottomTabInset = 100;
export const MaxContentWidth = 800;

/** @deprecated Use `useTheme().glassRoot` for scheme-aware root tint. */
export const AppGlassRootBackground = "#0b0d12";

/**
 * Brand palette. Hex values are shared by gradients + individual accents that
 * we use across home, schedule, and related screens.
 */
export const Brand = {
  primary: "#1E88FF",
  primaryDark: "#1578E8",
  primaryOn: "#167CFF",
  userBubbleTop: "#5E9AFF",
  userBubbleBottom: "#2A6ADB",
  userBubbleShadow: "rgba(36, 98, 210, 0.32)",
  sendShadow: "#4A9FFF",
  success: "#22C55E",
  warn: "#F97316",
  warnAmber: "#F59E0B",
  danger: "#EF4444",
  info: "#14B8A6",
  violet: "#8B5CF6",
  violetDark: "#7C3AED",
  indigo: "#2563EB",
  heroNavy: "#10244D",
  heroNavyDeep: "#0A1228",
  heroBlue: "#12305B",
  heroBlueDeep: "#0F172A",
} as const;

export const Gradients = {
  /** Send-button gradient (used while the composer is ready to send). */
  send: ["#A8D4FF", "#6EB4FF"] as const,
  /** Composer primary-action button (+ icon). */
  composerPrimary: [Brand.primary, Brand.primaryDark] as const,
  /** Lightbox cinematic backdrop (dark appearance). */
  lightboxBackdrop: ["#1c2230", "#0f1118", "#060709"] as const,
  /** Lightbox backdrop when the app is in light appearance. */
  lightboxBackdropLight: ["#dfe8f5", "#cfd9ea", "#b9c6dc"] as const,
} as const;

/**
 * Shared shadow recipes (iOS). `shadowColor` is merged from `useTheme().shadow` at call sites when needed.
 */
export const Shadows: Record<
  "assistantBubble" | "userBubble" | "composer",
  ViewStyle
> = {
  assistantBubble: {
    shadowColor: Brand.primary,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
  },
  userBubble: {
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  composer: {
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
};
