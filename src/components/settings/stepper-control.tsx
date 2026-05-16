import { SymbolView } from 'expo-symbols';
import React, { useCallback, useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { useTheme } from '@/hooks/use-theme';

type StepperControlProps = {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (next: number) => void;
  /** Caption shown directly under the value (e.g. unit / range). */
  caption?: string;
  decrementA11y?: string;
  incrementA11y?: string;
};

const HOLD_DELAY_MS = 220;
const HOLD_INTERVAL_MS = 90;

/**
 * −/+ stepper with a large center value. Supports tap and press-and-hold
 * (the hold delay matches iOS' native UIStepper repeat cadence).
 */
export function StepperControl({
  value,
  min,
  max,
  step = 1,
  onChange,
  caption,
  decrementA11y,
  incrementA11y,
}: StepperControlProps) {
  const theme = useTheme();
  const valueRef = useRef(value);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTriggeredRef = useRef(false);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const adjust = useCallback(
    (delta: number) => {
      const next = Math.max(min, Math.min(max, valueRef.current + delta));
      if (next !== valueRef.current) {
        valueRef.current = next;
        onChange(next);
      }
    },
    [max, min, onChange],
  );

  const stopHold = useCallback(() => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    holdTriggeredRef.current = false;
  }, []);

  const startHold = useCallback(
    (delta: number) => {
      stopHold();
      holdTimeoutRef.current = setTimeout(() => {
        holdTriggeredRef.current = true;
        adjust(delta);
        holdIntervalRef.current = setInterval(() => {
          adjust(delta);
        }, HOLD_INTERVAL_MS);
      }, HOLD_DELAY_MS);
    },
    [adjust, stopHold],
  );

  useEffect(() => stopHold, [stopHold]);

  const renderButton = (delta: -1 | 1) => {
    const disabled = delta < 0 ? value <= min : value >= max;
    const a11yLabel = delta < 0 ? decrementA11y : incrementA11y;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        onPressIn={() => startHold(delta * step)}
        onPressOut={stopHold}
        onPress={() => {
          if (!holdTriggeredRef.current) adjust(delta * step);
        }}
        disabled={disabled}
        hitSlop={10}
        style={({ pressed }) => ({
          opacity: disabled ? 0.35 : pressed ? 0.78 : 1,
        })}>
        <View
          className="h-12 w-12 items-center justify-center rounded-full border"
          style={{
            borderColor: theme.glassBorderStrong,
            backgroundColor: theme.glassSurfaceRaised,
          }}>
          <SymbolView
            tintColor={theme.glassIcon}
            name={(delta < 0 ? 'minus' : 'plus') as any}
            size={14}
            weight="semibold"
          />
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-row items-center justify-between">
      {renderButton(-1)}
      <View className="items-center">
        <ThemedText
          className="text-[32px] font-semibold leading-9 tabular-nums"
          style={{ color: theme.glassTextPrimary }}>
          {value}
        </ThemedText>
        {caption ? (
          <ThemedText
            className="text-[11px] font-medium uppercase tracking-[0.9px] leading-4"
            style={{ color: theme.glassTextMuted }}>
            {caption}
          </ThemedText>
        ) : null}
      </View>
      {renderButton(1)}
    </View>
  );
}
