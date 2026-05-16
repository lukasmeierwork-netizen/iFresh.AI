import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/ui/themed-text';
import { Brand, Fonts, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export const AHA_PLAN_VARIANT_IDS = [
  'timeline',
  'beforeAfter',
  'lensStack',
  'pulse',
  'receipt',
  'meter',
  'chat',
  'poster',
] as const;

export type AhaPlanVariantId = (typeof AHA_PLAN_VARIANT_IDS)[number];

export const AHA_PLAN_VARIANT_LABELS: Record<AhaPlanVariantId, string> = {
  timeline: '1 · Day rail',
  beforeAfter: '2 · Before / after',
  lensStack: '3 · Lens stack',
  pulse: '4 · Pulse',
  receipt: '5 · Rx slip',
  meter: '6 · Meter',
  chat: '7 · Coach',
  poster: '8 · Poster',
};

/** Change this to ship your chosen concept. */
export const DEFAULT_AHA_PLAN_VARIANT: AhaPlanVariantId = 'poster';

const enterDown = FadeInDown.duration(380);

const ON_COMPLETE_AFTER_MS = 420;

/** End beat index (inclusive). Steps 0…7; former tail beats 8–10 (AI close / + daily / disclaimer) removed. */
export const LAST_STEP = 7;
const STEP_DELAYS_MS = [520, 560, 2400, 720, 680, 880, 720];

function useAhaPlanSequence(
  onSequenceComplete: (() => void) | undefined,
  lastStep: number = LAST_STEP,
) {
  const [step, setStep] = useState(0);
  const completeSentRef = useRef(false);

  useEffect(() => {
    if (step >= lastStep) return;
    const delay = STEP_DELAYS_MS[step] ?? 600;
    const t = setTimeout(() => setStep((s) => s + 1), delay);
    return () => clearTimeout(t);
  }, [step, lastStep]);

  useEffect(() => {
    if (step < lastStep) return;
    if (completeSentRef.current) return;
    const t = setTimeout(() => {
      if (completeSentRef.current) return;
      completeSentRef.current = true;
      onSequenceComplete?.();
    }, ON_COMPLETE_AFTER_MS);
    return () => clearTimeout(t);
  }, [step, lastStep, onSequenceComplete]);

  return step;
}

export function CountUp({
  from,
  to,
  durationMs,
  size = 56,
}: {
  from: number;
  to: number;
  durationMs: number;
  size?: number;
}) {
  const [v, setV] = useState(from);
  useEffect(() => {
    const startedAt = Date.now();
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - startedAt) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      setV(Math.round(from + (to - from) * eased));
      if (t >= 1) clearInterval(id);
    }, 20);
    return () => clearInterval(id);
  }, [from, to, durationMs]);
  return (
    <ThemedText
      style={{
        fontSize: size,
        fontWeight: '800',
        letterSpacing: -2,
        lineHeight: size + 4,
        color: Brand.primary,
      }}
      numberOfLines={1}>
      {v}+
    </ThemedText>
  );
}

function SectionRule() {
  const theme = useTheme();
  return (
    <View style={{ height: 1, marginVertical: 4, backgroundColor: theme.glassBorder, opacity: 0.9 }} />
  );
}

function HeroPanel({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 20,
        backgroundColor: `${Brand.primary}12`,
        borderWidth: 1,
        borderColor: `${Brand.primary}28`,
        ...Shadows.assistantBubble,
        shadowColor: Brand.primary,
        shadowOpacity: 0.06,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      }}>
      {children}
    </View>
  );
}

const bodyClass = 'text-[18px] font-medium leading-[28px]';
const bridgeClass = 'text-[15px] font-semibold leading-6';

export function AhaPlanVariantPoster({ onSequenceComplete }: { onSequenceComplete?: () => void }) {
  const theme = useTheme();
  const step = useAhaPlanSequence(onSequenceComplete);

  return (
    <View style={{ gap: 16, paddingBottom: Spacing.two }}>
      {step >= 0 ? (
        <Animated.View key="s0" entering={enterDown}>
          <View
            style={{
              alignSelf: 'flex-start',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 8,
              backgroundColor: theme.backgroundElement,
            }}>
            <ThemedText themeColor="textSecondary" className="text-[10px] font-bold uppercase tracking-[2.2px]">
              AHA MOMENT
            </ThemedText>
          </View>
        </Animated.View>
      ) : null}
      {step >= 1 ? (
        <Animated.View key="s1" entering={enterDown}>
          <ThemedText className={bodyClass}>The average day can hold</ThemedText>
        </Animated.View>
      ) : null}
      {step >= 2 ? (
        <Animated.View key="s2" entering={enterDown} style={{ marginTop: 4 }}>
          <HeroPanel>
            <CountUp from={0} to={8} durationMs={2200} />
          </HeroPanel>
        </Animated.View>
      ) : null}
      {step >= 3 ? (
        <Animated.View key="s3" entering={enterDown}>
          <ThemedText className={bodyClass}>hours of near focus—with no real plan.</ThemedText>
        </Animated.View>
      ) : null}
      {step >= 4 ? (
        <Animated.View key="s4" entering={enterDown} style={{ marginTop: Spacing.two, gap: 10 }}>
          <SectionRule />
          <ThemedText className={bridgeClass}>Yep. Your eyes still need relief.</ThemedText>
        </Animated.View>
      ) : null}
      {step >= 5 ? (
        <Animated.View key="s5" entering={enterDown}>
          <HeroPanel>
            <ThemedText
              className="text-[50px] font-extrabold leading-[54px]"
              style={{ color: Brand.primary, letterSpacing: -1.5 }}>
              Zero
            </ThemedText>
          </HeroPanel>
        </Animated.View>
      ) : null}
      {step >= 6 ? (
        <Animated.View key="s6" entering={enterDown}>
          <ThemedText className={bodyClass}>planned relief—unless you add it.</ThemedText>
        </Animated.View>
      ) : null}
      {step >= 7 ? (
        <Animated.View key="s7" entering={enterDown} style={{ marginTop: Spacing.three, gap: 10 }}>
          <SectionRule />
          <ThemedText className={bridgeClass}>EyeFresh closes it with</ThemedText>
        </Animated.View>
      ) : null}
    </View>
  );
}

export function AhaPlanVariantTimeline({ onSequenceComplete }: { onSequenceComplete?: () => void }) {
  const theme = useTheme();
  const step = useAhaPlanSequence(onSequenceComplete);
  const pins = [
    { t: 'AM', sub: 'near work' },
    { t: 'DAY', sub: 'no recovery' },
    { t: 'PM', sub: 'still straining' },
  ];

  return (
    <View style={{ paddingBottom: Spacing.two }}>
      {step >= 0 ? (
        <Animated.View entering={enterDown} style={{ marginBottom: 12 }}>
          <ThemedText themeColor="textSecondary" className="text-[10px] font-bold uppercase tracking-[2px]">
            AHA MOMENT · YOUR DAY AS A RAIL
          </ThemedText>
        </Animated.View>
      ) : null}

      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: 36, paddingTop: 8 }}>
          <View style={{ flex: 1, width: 2, backgroundColor: theme.glassBorder, borderRadius: 2, minHeight: 220 }} />
        </View>
        <View style={{ flex: 1, gap: 20, paddingLeft: 8 }}>
          {pins.map((p, i) =>
            step >= i + 1 ? (
              <Animated.View key={p.t} entering={enterDown} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: Brand.primary,
                    marginTop: 4,
                    marginLeft: -22,
                  }}
                />
                <View>
                  <ThemedText className="text-[12px] font-bold uppercase tracking-wider" style={{ color: Brand.primary }}>
                    {p.t}
                  </ThemedText>
                  <ThemedText themeColor="textSecondary" className="text-[12px]">
                    {p.sub}
                  </ThemedText>
                </View>
              </Animated.View>
            ) : null,
          )}
          {step >= 4 ? (
            <Animated.View entering={enterDown}>
              <ThemedText className={bodyClass}>The average day can hold</ThemedText>
            </Animated.View>
          ) : null}
          {step >= 5 ? (
            <Animated.View entering={enterDown}>
              <HeroPanel>
                <CountUp from={0} to={8} durationMs={2200} size={52} />
              </HeroPanel>
            </Animated.View>
          ) : null}
          {step >= 6 ? (
            <Animated.View entering={enterDown}>
              <ThemedText className={bodyClass}>hours of near focus—with no real plan.</ThemedText>
            </Animated.View>
          ) : null}
          {step >= 7 ? (
            <Animated.View entering={enterDown} style={{ gap: 8 }}>
              <ThemedText className={bridgeClass}>Yep. Your eyes still need relief.</ThemedText>
              <HeroPanel>
                <ThemedText className="text-[44px] font-extrabold leading-[48px]" style={{ color: Brand.primary }}>
                  Zero
                </ThemedText>
              </HeroPanel>
              <ThemedText className={bodyClass}>planned relief—unless you add it.</ThemedText>
            </Animated.View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function AhaPlanVariantBeforeAfter({ onSequenceComplete }: { onSequenceComplete?: () => void }) {
  const theme = useTheme();
  const step = useAhaPlanSequence(onSequenceComplete);

  return (
    <View style={{ gap: 16, paddingBottom: Spacing.two }}>
      {step >= 0 ? (
        <Animated.View entering={enterDown}>
          <ThemedText themeColor="textSecondary" className="text-[10px] font-bold uppercase tracking-[2px]">
            AHA MOMENT · STRUCTURE VS CHAOS
          </ThemedText>
        </Animated.View>
      ) : null}

      {step >= 1 ? (
        <Animated.View entering={enterDown} style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, padding: 12, borderRadius: 14, backgroundColor: theme.backgroundElement }}>
            <ThemedText className="text-[11px] font-bold uppercase" themeColor="textSecondary">
              Without a plan
            </ThemedText>
            <View style={{ gap: 6, marginTop: 10, opacity: 0.55 }}>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.textSecondary, width: '90%' }} />
              <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.textSecondary, width: '60%' }} />
              <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.textSecondary, width: '75%' }} />
            </View>
            <ThemedText className="text-[12px] mt-3" themeColor="textSecondary">
              Random scrolling · no recovery
            </ThemedText>
          </View>
          <View
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: `${Brand.primary}35`,
              backgroundColor: `${Brand.primary}08`,
            }}>
            <ThemedText className="text-[11px] font-bold uppercase" style={{ color: Brand.primary }}>
              With EyeFresh
            </ThemedText>
            <View style={{ gap: 8, marginTop: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: Brand.primary }} />
                <ThemedText className="text-[12px] font-medium">Checks</ThemedText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: Brand.primary }} />
                <ThemedText className="text-[12px] font-medium">Breaks</ThemedText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: Brand.primary }} />
                <ThemedText className="text-[12px] font-medium">Outdoor resets</ThemedText>
              </View>
            </View>
          </View>
        </Animated.View>
      ) : null}

      {step >= 3 ? (
        <Animated.View entering={enterDown}>
          <ThemedText className={bodyClass}>The average day can hold</ThemedText>
        </Animated.View>
      ) : null}
      {step >= 4 ? (
        <Animated.View entering={enterDown}>
          <HeroPanel>
            <CountUp from={0} to={8} durationMs={2200} />
          </HeroPanel>
        </Animated.View>
      ) : null}
      {step >= 5 ? (
        <Animated.View entering={enterDown}>
          <ThemedText className={bodyClass}>hours of near focus—with no real plan.</ThemedText>
        </Animated.View>
      ) : null}
      {step >= 6 ? (
        <Animated.View entering={enterDown}>
          <ThemedText className={bridgeClass}>Yep. Your eyes still need relief.</ThemedText>
        </Animated.View>
      ) : null}
      {step >= 7 ? (
        <Animated.View entering={enterDown} style={{ gap: 10 }}>
          <HeroPanel>
            <ThemedText className="text-[50px] font-extrabold leading-[54px]" style={{ color: Brand.primary }}>
              Zero
            </ThemedText>
          </HeroPanel>
          <ThemedText className={bodyClass}>planned relief—unless you add it.</ThemedText>
        </Animated.View>
      ) : null}
    </View>
  );
}

export function AhaPlanVariantLensStack({ onSequenceComplete }: { onSequenceComplete?: () => void }) {
  const step = useAhaPlanSequence(onSequenceComplete);

  const layers = [
    { label: 'DETECT', sub: 'strain signals' },
    { label: 'GUIDE', sub: 'what to do next' },
    { label: 'PROTECT', sub: 'daily rhythm' },
  ];

  return (
    <View style={{ gap: 18, paddingBottom: Spacing.two }}>
      {step >= 0 ? (
        <Animated.View entering={enterDown}>
          <ThemedText themeColor="textSecondary" className="text-[10px] font-bold uppercase tracking-[2px]">
            AHA MOMENT · YOUR EYE STACK
          </ThemedText>
        </Animated.View>
      ) : null}

      {step >= 1 ? (
        <Animated.View entering={FadeIn.duration(400)} style={{ marginTop: 8, height: 140, position: 'relative' }}>
          {layers.map((L, i) =>
            step >= 1 + i ? (
              <Animated.View
                key={L.label}
                entering={enterDown}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: i * 22,
                  padding: 14,
                  borderRadius: 16,
                  backgroundColor: `${Brand.primary}${i === 0 ? '18' : i === 1 ? '14' : '10'}`,
                  borderWidth: 1,
                  borderColor: `${Brand.primary}38`,
                  ...Shadows.assistantBubble,
                  shadowOpacity: 0.05,
                }}>
                <ThemedText className="text-[13px] font-bold uppercase tracking-wide" style={{ color: Brand.primary }}>
                  {L.label}
                </ThemedText>
                <ThemedText themeColor="textSecondary" className="text-[12px] mt-1">
                  {L.sub}
                </ThemedText>
              </Animated.View>
            ) : null,
          )}
        </Animated.View>
      ) : null}

      {step >= 4 ? (
        <Animated.View entering={enterDown} style={{ marginTop: 56 }}>
          <ThemedText className={bodyClass}>The average day can hold</ThemedText>
        </Animated.View>
      ) : null}
      {step >= 5 ? (
        <Animated.View entering={enterDown}>
          <HeroPanel>
            <CountUp from={0} to={8} durationMs={2200} />
          </HeroPanel>
        </Animated.View>
      ) : null}
      {step >= 6 ? (
        <Animated.View entering={enterDown}>
          <ThemedText className={bodyClass}>hours of near focus—with no real plan.</ThemedText>
        </Animated.View>
      ) : null}
      {step >= 7 ? (
        <Animated.View entering={enterDown} style={{ gap: 8 }}>
          <ThemedText className={bridgeClass}>Yep. Your eyes still need relief.</ThemedText>
          <HeroPanel>
            <ThemedText className="text-[44px] font-extrabold" style={{ color: Brand.primary }}>
              Zero
            </ThemedText>
          </HeroPanel>
          <ThemedText className={bodyClass}>planned relief—unless you add it.</ThemedText>
        </Animated.View>
      ) : null}
    </View>
  );
}

function BreathingCircle() {
  const s = useSharedValue(0);
  useEffect(() => {
    s.value = withRepeat(
      withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => cancelAnimation(s);
  }, [s]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 0.92 + s.value * 0.1 }],
    opacity: 0.35 + s.value * 0.25,
  }));

  return (
    <Animated.View
      style={[
        {
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: `${Brand.primary}20`,
          borderWidth: 2,
          borderColor: `${Brand.primary}55`,
        },
        style,
      ]}
    />
  );
}

export function AhaPlanVariantPulse({ onSequenceComplete }: { onSequenceComplete?: () => void }) {
  const step = useAhaPlanSequence(onSequenceComplete);

  return (
    <View style={{ gap: 16, paddingBottom: Spacing.two, alignItems: 'flex-start' }}>
      {step >= 0 ? (
        <Animated.View entering={enterDown}>
          <ThemedText themeColor="textSecondary" className="text-[10px] font-bold uppercase tracking-[2px]">
            AHA MOMENT · BREATHE WITH YOUR EYES
          </ThemedText>
        </Animated.View>
      ) : null}
      {step >= 1 ? (
        <Animated.View entering={enterDown} style={{ alignSelf: 'center', marginVertical: 12 }}>
          <BreathingCircle />
        </Animated.View>
      ) : null}
      {step >= 2 ? (
        <Animated.View entering={enterDown} style={{ width: '100%' }}>
          <ThemedText className={bodyClass}>The average day can hold</ThemedText>
        </Animated.View>
      ) : null}
      {step >= 3 ? (
        <Animated.View entering={enterDown}>
          <HeroPanel>
            <CountUp from={0} to={8} durationMs={2200} />
          </HeroPanel>
        </Animated.View>
      ) : null}
      {step >= 4 ? (
        <Animated.View entering={enterDown}>
          <ThemedText className={bodyClass}>hours of near focus—with no real plan.</ThemedText>
        </Animated.View>
      ) : null}
      {step >= 5 ? (
        <Animated.View entering={enterDown}>
          <ThemedText className={bridgeClass}>Yep. Your eyes still need relief.</ThemedText>
        </Animated.View>
      ) : null}
      {step >= 6 ? (
        <Animated.View entering={enterDown}>
          <HeroPanel>
            <ThemedText className="text-[48px] font-extrabold" style={{ color: Brand.primary }}>
              Zero
            </ThemedText>
          </HeroPanel>
        </Animated.View>
      ) : null}
      {step >= 7 ? (
        <Animated.View entering={enterDown}>
          <ThemedText className={bodyClass}>planned relief—unless you add it.</ThemedText>
        </Animated.View>
      ) : null}
    </View>
  );
}

export function AhaPlanVariantReceipt({ onSequenceComplete }: { onSequenceComplete?: () => void }) {
  const theme = useTheme();
  const step = useAhaPlanSequence(onSequenceComplete);

  return (
    <View style={{ paddingBottom: Spacing.two }}>
      {step >= 0 ? (
        <Animated.View entering={enterDown} style={{ marginBottom: 10 }}>
          <ThemedText themeColor="textSecondary" className="text-[10px] font-bold uppercase tracking-[2px]">
            AHA MOMENT · DAILY RX
          </ThemedText>
        </Animated.View>
      ) : null}
      {step >= 1 ? (
        <Animated.View
          entering={enterDown}
          style={{
            transform: [{ rotate: '-0.8deg' }],
            backgroundColor: theme.scheme === 'dark' ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: theme.glassBorder,
            ...Shadows.assistantBubble,
          }}>
          <ThemedText style={{ fontFamily: Fonts.mono, fontSize: 11 }} themeColor="textSecondary">
            EYEFRESH COACH
          </ThemedText>
          <View style={{ height: 1, backgroundColor: theme.glassBorder, marginVertical: 10 }} />
          {step >= 2 ? (
            <Animated.View entering={enterDown}>
              <ThemedText style={{ fontFamily: Fonts.mono, fontSize: 12 }} className="leading-5">
                LINE 01 · near focus / day
              </ThemedText>
              <ThemedText style={{ fontFamily: Fonts.mono, fontSize: 20, fontWeight: '700', marginTop: 6, color: Brand.primary }}>
                8+ hrs typical
              </ThemedText>
            </Animated.View>
          ) : null}
          {step >= 4 ? (
            <Animated.View entering={enterDown} style={{ marginTop: 12 }}>
              <ThemedText style={{ fontFamily: Fonts.mono, fontSize: 12 }} className="leading-5">
                LINE 02 · planned relief
              </ThemedText>
              <ThemedText style={{ fontFamily: Fonts.mono, fontSize: 20, fontWeight: '700', marginTop: 6, color: Brand.primary }}>
                Zero until you schedule it
              </ThemedText>
            </Animated.View>
          ) : null}
          {step >= 6 ? (
            <Animated.View entering={enterDown} style={{ marginTop: 12 }}>
              <ThemedText style={{ fontFamily: Fonts.mono, fontSize: 12 }} className="leading-5">
                RX · take as directed
              </ThemedText>
              <ThemedText style={{ fontFamily: Fonts.mono, fontSize: 14, fontWeight: '600', marginTop: 6, color: Brand.primary }}>
                AI guidance + daily tasks
              </ThemedText>
            </Animated.View>
          ) : null}
          {step >= 7 ? (
            <Animated.View entering={enterDown} style={{ marginTop: 14, flexDirection: 'row', justifyContent: 'space-between' }}>
              <ThemedText style={{ fontFamily: Fonts.mono, fontSize: 10 }} themeColor="textSecondary">
                THANK YOU
              </ThemedText>
              <ThemedText style={{ fontFamily: Fonts.mono, fontSize: 10 }} themeColor="textSecondary">
                NEXT: YOUR PLAN
              </ThemedText>
            </Animated.View>
          ) : null}
        </Animated.View>
      ) : null}
    </View>
  );
}

export function AhaPlanVariantMeter({ onSequenceComplete }: { onSequenceComplete?: () => void }) {
  const theme = useTheme();
  const step = useAhaPlanSequence(onSequenceComplete);
  const progress = Math.min(1, step / LAST_STEP + (step >= LAST_STEP ? 0 : 0.04));

  return (
    <View style={{ gap: 14, paddingBottom: Spacing.two }}>
      {step >= 0 ? (
        <Animated.View entering={enterDown}>
          <ThemedText themeColor="textSecondary" className="text-[10px] font-bold uppercase tracking-[2px]">
            AHA MOMENT · READINESS
          </ThemedText>
        </Animated.View>
      ) : null}
      {step >= 0 ? (
        <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.backgroundSelected, overflow: 'hidden' }}>
          <LinearGradient
            colors={[Brand.primary, Brand.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: `${Math.max(6, progress * 100)}%`, height: '100%', borderRadius: 4 }}
          />
        </View>
      ) : null}
      {step >= 1 ? (
        <Animated.View entering={enterDown}>
          <ThemedText className={bodyClass}>The average day can hold</ThemedText>
        </Animated.View>
      ) : null}
      {step >= 2 ? (
        <Animated.View entering={enterDown}>
          <HeroPanel>
            <CountUp from={0} to={8} durationMs={2200} />
          </HeroPanel>
        </Animated.View>
      ) : null}
      {step >= 3 ? (
        <Animated.View entering={enterDown}>
          <ThemedText className={bodyClass}>hours of near focus—with no real plan.</ThemedText>
        </Animated.View>
      ) : null}
      {step >= 4 ? (
        <Animated.View entering={enterDown}>
          <ThemedText className={bridgeClass}>Yep. Your eyes still need relief.</ThemedText>
        </Animated.View>
      ) : null}
      {step >= 5 ? (
        <Animated.View entering={enterDown}>
          <HeroPanel>
            <ThemedText className="text-[46px] font-extrabold" style={{ color: Brand.primary }}>
              Zero
            </ThemedText>
          </HeroPanel>
        </Animated.View>
      ) : null}
      {step >= 6 ? (
        <Animated.View entering={enterDown}>
          <ThemedText className={bodyClass}>planned relief—unless you add it.</ThemedText>
        </Animated.View>
      ) : null}
      {step >= 7 ? (
        <Animated.View entering={enterDown}>
          <ThemedText className={bridgeClass}>EyeFresh closes it with</ThemedText>
        </Animated.View>
      ) : null}
    </View>
  );
}

export function AhaPlanVariantChat({ onSequenceComplete }: { onSequenceComplete?: () => void }) {
  const theme = useTheme();
  const step = useAhaPlanSequence(onSequenceComplete);

  const bubble = (child: React.ReactNode, k: string) => (
    <View
      style={{
        alignSelf: 'flex-start',
        maxWidth: '92%',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 18,
        borderBottomLeftRadius: 6,
        backgroundColor: theme.backgroundElement,
      }}>
      {child}
    </View>
  );

  return (
    <View style={{ gap: 12, paddingBottom: Spacing.two }}>
      {step >= 0 ? (
        <Animated.View entering={enterDown}>
          {bubble(
            <ThemedText className="text-[13px] font-semibold leading-5">EyeFresh · your coach</ThemedText>,
            'h',
          )}
        </Animated.View>
      ) : null}
      {step >= 2 ? (
        <Animated.View entering={enterDown}>
          {bubble(
            <>
              <ThemedText className="text-[15px] leading-[22px]">
                Most days stack <ThemedText style={{ color: Brand.primary, fontWeight: '800' }}>8+ hours</ThemedText> of
                near focus—with no real plan.
              </ThemedText>
            </>,
            'a',
          )}
        </Animated.View>
      ) : null}
      {step >= 5 ? (
        <Animated.View entering={enterDown}>
          {bubble(
            <>
              <ThemedText className="text-[15px] leading-[22px]">
                Without a system you get <ThemedText style={{ color: Brand.primary, fontWeight: '800' }}>zero</ThemedText>{' '}
                planned relief until you add it.
              </ThemedText>
            </>,
            'b',
          )}
        </Animated.View>
      ) : null}
      {step >= 7 ? (
        <Animated.View entering={enterDown}>
          {bubble(
            <>
              <ThemedText className="text-[15px] leading-[22px]">We close the loop with:</ThemedText>
              <ThemedText className="text-[17px] font-extrabold mt-2" style={{ color: Brand.primary }}>
                AI guidance + daily tasks
              </ThemedText>
            </>,
            'c',
          )}
        </Animated.View>
      ) : null}
    </View>
  );
}

export function renderAhaPlanVariant(id: AhaPlanVariantId, onSequenceComplete?: () => void) {
  switch (id) {
    case 'timeline':
      return <AhaPlanVariantTimeline onSequenceComplete={onSequenceComplete} />;
    case 'beforeAfter':
      return <AhaPlanVariantBeforeAfter onSequenceComplete={onSequenceComplete} />;
    case 'lensStack':
      return <AhaPlanVariantLensStack onSequenceComplete={onSequenceComplete} />;
    case 'pulse':
      return <AhaPlanVariantPulse onSequenceComplete={onSequenceComplete} />;
    case 'receipt':
      return <AhaPlanVariantReceipt onSequenceComplete={onSequenceComplete} />;
    case 'meter':
      return <AhaPlanVariantMeter onSequenceComplete={onSequenceComplete} />;
    case 'chat':
      return <AhaPlanVariantChat onSequenceComplete={onSequenceComplete} />;
    case 'poster':
      return <AhaPlanVariantPoster onSequenceComplete={onSequenceComplete} />;
    default:
      return <AhaPlanVariantPoster onSequenceComplete={onSequenceComplete} />;
  }
}
