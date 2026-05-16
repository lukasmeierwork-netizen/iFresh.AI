import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Pressable, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type StarRatingProps = {
  value: number;
  max?: number;
  onChange: (value: number) => void;
  size?: number;
};

/** Tappable 1-to-`max` star rating row. */
export function StarRating({ value, max = 5, onChange, size = 40 }: StarRatingProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
      }}>
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1;
        const active = starValue <= value;
        return (
          <Pressable
            key={starValue}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
            onPress={() => onChange(starValue)}
            hitSlop={8}
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              padding: 4,
            })}>
            <SymbolView
              name={(active ? 'star.fill' : 'star') as any}
              size={size}
              tintColor={active ? Brand.warnAmber : theme.textSecondary}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
