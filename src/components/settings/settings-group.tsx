import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { useTheme } from '@/hooks/use-theme';

/**
 * A grouped settings card that contains one or more rows separated by
 * thin hairline dividers (iOS-Settings style). Use with an optional uppercase
 * section header above and/or a description caption below.
 */
export function SettingsGroup({
  header,
  description,
  children,
}: {
  header?: string;
  description?: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const items = React.Children.toArray(children).filter(Boolean);

  return (
    <View className="gap-2">
      {header ? (
        <ThemedText
          type="small"
          className="px-1 font-semibold tracking-[1.2px]"
          style={{ color: theme.glassTextMuted }}>
          {header}
        </ThemedText>
      ) : null}
      <View
        className="overflow-hidden rounded-3xl border"
        style={{
          borderColor: theme.glassBorder,
          backgroundColor: theme.glassSurface,
        }}>
        {items.map((child, idx) => (
          <React.Fragment key={idx}>
            {child}
            {idx < items.length - 1 ? (
              <View
                className="ml-14 h-px"
                style={{ backgroundColor: theme.glassBorderMuted }}
              />
            ) : null}
          </React.Fragment>
        ))}
      </View>
      {description ? (
        <ThemedText
          className="px-1 text-[13px] leading-5"
          style={{ color: theme.glassTextMuted }}>
          {description}
        </ThemedText>
      ) : null}
    </View>
  );
}

type SettingsRowProps = {
  icon?: string;
  iconColor?: string;
  label: string;
  sublabel?: string;
  /** Right-aligned text shown next to the chevron (e.g. "Allowed"). */
  value?: string;
  /** Custom trailing widget — overrides the default chevron / value text. */
  trailing?: React.ReactNode;
  /** When true (default for pressable rows), shows a chevron on the right. */
  showChevron?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityState?: { expanded?: boolean; selected?: boolean; disabled?: boolean };
  /** Optional emphasis color applied to the label (e.g. destructive). */
  labelColor?: string;
  numberOfLines?: number;
};

/**
 * A single row inside a {@link SettingsGroup}. Mirrors the iOS Settings
 * grouped-row pattern: leading icon, label + optional sublabel, trailing
 * widget (chevron / status text / switch / etc.).
 */
export function SettingsRow({
  icon,
  iconColor,
  label,
  sublabel,
  value,
  trailing,
  showChevron,
  onPress,
  disabled,
  accessibilityLabel,
  accessibilityState,
  labelColor,
  numberOfLines,
}: SettingsRowProps) {
  const theme = useTheme();
  const shouldShowChevron = showChevron ?? Boolean(onPress);

  const inner = (
    <View className="flex-row items-center px-4 py-3.5">
      {icon ? (
        <View className="mr-3 h-7 w-7 items-center justify-center">
          <SymbolView
            tintColor={iconColor ?? theme.glassIcon}
            name={icon as any}
            size={20}
            weight="semibold"
          />
        </View>
      ) : null}
      <View className="min-w-0 flex-1 gap-0.5 pr-2">
        <ThemedText
          className="text-[15px] font-semibold leading-5"
          style={{ color: labelColor ?? theme.glassTextPrimary }}
          numberOfLines={numberOfLines}>
          {label}
        </ThemedText>
        {sublabel ? (
          <ThemedText
            className="text-[12px] leading-4"
            style={{ color: theme.glassTextMuted }}
            numberOfLines={numberOfLines}>
            {sublabel}
          </ThemedText>
        ) : null}
      </View>
      {trailing ? (
        <View className="ml-2 flex-row items-center gap-1.5">{trailing}</View>
      ) : (
        <View className="ml-2 flex-row items-center gap-1.5">
          {value ? (
            <ThemedText
              className="text-[13px] font-medium leading-5"
              style={{ color: theme.glassTextMuted }}>
              {value}
            </ThemedText>
          ) : null}
          {shouldShowChevron ? (
            <SymbolView
              tintColor={theme.glassIconMuted}
              name={'chevron.right' as any}
              size={13}
              weight="semibold"
            />
          ) : null}
        </View>
      )}
    </View>
  );

  if (!onPress) {
    return inner;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState ?? { disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: disabled ? 0.5 : pressed ? 0.65 : 1 })}>
      {inner}
    </Pressable>
  );
}
