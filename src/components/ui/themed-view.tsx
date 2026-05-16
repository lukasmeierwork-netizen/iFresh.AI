import { View, type ViewProps } from 'react-native';
import { cssInterop } from 'nativewind';

import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
  className?: string;
};

function ThemedViewBase({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();

  return <View style={[{ backgroundColor: theme[type ?? 'background'] }, style]} {...otherProps} />;
}

export const ThemedView = cssInterop(ThemedViewBase, {
  className: {
    target: 'style',
  },
});
