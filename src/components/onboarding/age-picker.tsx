import React, { useEffect, useMemo, useRef } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
} from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { Brand } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const ITEM_HEIGHT = 56;
const VISIBLE_ITEMS = 5;

type AgePickerProps = {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
};

/**
 * Vertical snap-to-item age picker implemented with a `ScrollView` so we don't
 * need a native-only picker dependency. The centered row is highlighted in
 * brand colors to mimic an iOS UIWheel-style control.
 */
export function AgePicker({ min, max, value, onChange }: AgePickerProps) {
  const theme = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  const items = useMemo(() => {
    const list: number[] = [];
    for (let i = min; i <= max; i += 1) list.push(i);
    return list;
  }, [min, max]);

  useEffect(() => {
    const index = items.indexOf(value);
    if (index >= 0 && scrollRef.current) {
      scrollRef.current.scrollTo({ y: index * ITEM_HEIGHT, animated: false });
    }
  }, [items, value]);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(items.length - 1, index));
    const next = items[clamped];
    if (next !== value) onChange(next);
  };

  const containerHeight = ITEM_HEIGHT * VISIBLE_ITEMS;
  const centerTop = (containerHeight - ITEM_HEIGHT) / 2;

  return (
    <View
      style={{
        height: containerHeight,
        borderRadius: 28,
        backgroundColor: theme.backgroundElement,
        overflow: 'hidden',
      }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          top: centerTop,
          height: ITEM_HEIGHT,
          borderRadius: 18,
          backgroundColor: `${Brand.primary}22`,
          borderWidth: 1,
          borderColor: `${Brand.primary}55`,
        }}
      />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={onMomentumEnd}
        contentContainerStyle={{
          paddingVertical: (containerHeight - ITEM_HEIGHT) / 2,
        }}>
        {items.map((n) => {
          const active = n === value;
          return (
            <View
              key={n}
              style={{
                height: ITEM_HEIGHT,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <ThemedText
                className="font-semibold"
                style={{
                  fontSize: active ? 28 : 20,
                  color: active ? Brand.primary : theme.textSecondary,
                  opacity: active ? 1 : 0.6,
                }}>
                {n}
              </ThemedText>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
