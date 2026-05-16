import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import type { StyleProp, TextStyle } from 'react-native';

type SymbolWeight = 'ultralight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black';

type SymbolViewProps = {
  name: string;
  size?: number;
  tintColor?: string;
  weight?: SymbolWeight;
  style?: StyleProp<TextStyle>;
};

const ICON_MAP: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  'apple.logo': 'apple',
  'arrow.clockwise': 'restore',
  'arrow.up.left.and.arrow.down.right.circle.fill': 'arrow-expand-all',
  'arrow.up.right.square': 'open-in-new',
  'brain.head.profile': 'brain',
  'bubble.left.and.bubble.right.fill': 'chat-processing',
  'bubble.left.fill': 'chat',
  calendar: 'calendar',
  'calendar.badge.clock': 'calendar-clock',
  'camera.fill': 'camera',
  'camera.viewfinder': 'camera',
  'chart.bar.fill': 'chart-bar',
  'chart.xyaxis.line': 'chart-line',
  'checkmark.circle.fill': 'check-circle',
  'checkmark.seal.fill': 'check-decagram',
  'checkmark.shield.fill': 'shield-check',
  checkmark: 'check',
  'chevron.down': 'chevron-down',
  'chevron.left': 'chevron-left',
  'chevron.right': 'chevron-right',
  'chevron.up': 'chevron-up',
  circle: 'checkbox-blank-circle-outline',
  'creditcard.fill': 'credit-card',
  'crown.fill': 'crown',
  'doc.fill': 'file-document',
  'doc.text.fill': 'file-document',
  'envelope.fill': 'email',
  exclamationmark: 'exclamation',
  eye: 'eye',
  'eye.fill': 'eye',
  'eye.slash': 'eye-off',
  'eye.circle': 'eye-circle-outline',
  globe: 'web',
  'hand.draw.fill': 'hand-back-right',
  'hand.thumbsup.fill': 'thumb-up',
  'heart.fill': 'heart',
  'lifepreserver.fill': 'lifebuoy',
  'lock.shield.fill': 'shield-lock',
  'megaphone.fill': 'bullhorn',
  minus: 'minus',
  'paintbrush.fill': 'palette',
  'person.crop.circle': 'account-circle',
  'person.crop.circle.badge.plus': 'account-plus',
  'person.crop.circle.fill': 'account-circle',
  'person.fill': 'account',
  'play.fill': 'play',
  plus: 'plus',
  'questionmark.circle.fill': 'help-circle',
  'rectangle.portrait.and.arrow.right': 'logout',
  'ruler.fill': 'ruler',
  'slider.horizontal.3': 'tune-variant',
  sparkles: 'star-four-points',
  'square.and.arrow.up': 'share-variant',
  star: 'star-outline',
  'star.bubble.fill': 'message-star',
  'star.fill': 'star',
  trash: 'trash-can-outline',
  'trash.fill': 'trash-can',
  trophy: 'trophy',
  waveform: 'waveform',
  xmark: 'close',
};

function resolveWeight(weight: SymbolWeight | undefined): TextStyle['fontWeight'] {
  switch (weight) {
    case 'ultralight':
    case 'thin':
      return '100';
    case 'light':
      return '300';
    case 'regular':
      return '400';
    case 'medium':
      return '500';
    case 'semibold':
      return '600';
    case 'bold':
      return '700';
    case 'heavy':
      return '800';
    case 'black':
      return '900';
    default:
      return undefined;
  }
}

const warnedMissing = new Set<string>();

export function SymbolView({ name, size = 16, tintColor, weight = 'regular', style }: SymbolViewProps) {
  const mapped = ICON_MAP[name];
  if (__DEV__ && !mapped && !warnedMissing.has(name)) {
    warnedMissing.add(name);
    console.warn(
      `[SymbolView polyfill] No MaterialCommunityIcons mapping for SF Symbol "${name}". ` +
        `Add it to ICON_MAP in src/lib/polyfills/expo-symbols.tsx to avoid the "?" fallback.`,
    );
  }
  const iconName = mapped ?? 'help-circle-outline';
  return (
    <MaterialCommunityIcons
      name={iconName}
      size={size}
      color={tintColor}
      style={[{ fontWeight: resolveWeight(weight) }, style]}
    />
  );
}

