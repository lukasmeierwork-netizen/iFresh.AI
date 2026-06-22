import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { Brand } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type HelpSectionAccordionProps = {
  icon: string;
  accent: string;
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  accessibilityLabel: string;
};

export function HelpSectionAccordion({
  icon,
  accent,
  title,
  expanded,
  onToggle,
  children,
  accessibilityLabel,
}: HelpSectionAccordionProps) {
  const theme = useTheme();

  return (
    <View
      className="overflow-hidden rounded-3xl border"
      style={{ borderColor: theme.glassBorder, backgroundColor: theme.glassSurface }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}>
        <View className="flex-row items-center gap-3 px-4 py-4">
          <View
            className="h-10 w-10 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${accent}22`, borderWidth: 1, borderColor: `${accent}33` }}>
            <SymbolView tintColor={accent} name={icon as any} size={18} weight="semibold" />
          </View>
          <ThemedText
            className="min-w-0 flex-1 text-[16px] font-semibold leading-5"
            style={{ color: theme.glassTextPrimary }}>
            {title}
          </ThemedText>
          <SymbolView
            tintColor={theme.glassIconMuted}
            name={(expanded ? 'chevron.up' : 'chevron.down') as any}
            size={14}
            weight="semibold"
          />
        </View>
      </Pressable>

      {expanded ? (
        <View
          className="gap-3 border-t px-4 pb-5 pt-1"
          style={{ borderTopColor: theme.glassBorderMuted }}>
          {children}
        </View>
      ) : null}
    </View>
  );
}

type HelpBulletProps = {
  text: string;
  accent?: string;
};

export function HelpBullet({ text, accent }: HelpBulletProps) {
  const theme = useTheme();
  const dot = accent ?? Brand.primary;

  return (
    <View className="flex-row items-start gap-2.5">
      <View className="mt-[7px] h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dot }} />
      <ThemedText className="min-w-0 flex-1 text-[14px] leading-[21px]" style={{ color: theme.glassTextSecondary }}>
        {text}
      </ThemedText>
    </View>
  );
}

type HelpStepProps = {
  index: number;
  title: string;
  body: string;
  accent: string;
};

export function HelpStep({ index, title, body, accent }: HelpStepProps) {
  const theme = useTheme();

  return (
    <View
      className="flex-row gap-3 rounded-2xl border px-3.5 py-3"
      style={{ borderColor: theme.glassBorderMuted, backgroundColor: theme.glassSurfaceRaised }}>
      <View
        className="h-7 w-7 items-center justify-center rounded-full"
        style={{ backgroundColor: `${accent}22` }}>
        <ThemedText className="text-[12px] font-bold tabular-nums" style={{ color: accent }}>
          {index}
        </ThemedText>
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <ThemedText className="text-[14px] font-semibold leading-5" style={{ color: theme.glassTextPrimary }}>
          {title}
        </ThemedText>
        <ThemedText className="text-[13px] leading-[19px]" style={{ color: theme.glassTextSecondary }}>
          {body}
        </ThemedText>
      </View>
    </View>
  );
}

type HelpFaqItemProps = {
  question: string;
  answer: string;
};

export function HelpFaqItem({ question, answer }: HelpFaqItemProps) {
  const theme = useTheme();

  return (
    <View
      className="gap-1.5 rounded-2xl border px-3.5 py-3"
      style={{ borderColor: theme.glassBorderMuted, backgroundColor: theme.glassSurfaceRaised }}>
      <ThemedText className="text-[14px] font-semibold leading-5" style={{ color: theme.glassTextPrimary }}>
        {question}
      </ThemedText>
      <ThemedText className="text-[13px] leading-[19px]" style={{ color: theme.glassTextSecondary }}>
        {answer}
      </ThemedText>
    </View>
  );
}
