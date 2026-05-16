import React from 'react';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { Brand } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type YesNoButtonsProps = {
  value?: boolean;
  onChange: (value: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
};

/** A pair of equal-width Yes / No selectors used by the binary question steps. */
export function YesNoButtons({
  value,
  onChange,
  yesLabel = 'Yes',
  noLabel = 'No',
}: YesNoButtonsProps) {
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <YesNoCell
        label={yesLabel}
        active={value === true}
        onPress={() => onChange(true)}
      />
      <YesNoCell
        label={noLabel}
        active={value === false}
        onPress={() => onChange(false)}
      />
    </View>
  );
}

function YesNoCell({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        borderRadius: 20,
        paddingVertical: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? Brand.primary : theme.backgroundElement,
        opacity: pressed ? 0.9 : 1,
      })}>
      <ThemedText
        className="text-[17px] font-semibold"
        style={{ color: active ? '#FFFFFF' : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}
