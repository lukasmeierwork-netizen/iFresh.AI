import { Text, type TextProps } from 'react-native';
import { cssInterop } from 'nativewind';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
  className?: string;
};

function ThemedTextBase({
  style,
  type = 'default',
  themeColor,
  ...rest
}: ThemedTextProps) {
  const theme = useTheme();
  const typeClassName =
    type === 'default'
      ? 'text-base font-medium leading-6'
      : type === 'title'
        ? 'text-5xl font-semibold leading-[52px]'
        : type === 'small'
          ? 'text-sm font-medium leading-5'
          : type === 'smallBold'
            ? 'text-sm font-bold leading-5'
            : type === 'subtitle'
              ? 'text-[32px] font-semibold leading-[44px]'
              : type === 'link'
                ? 'text-sm leading-[30px]'
                : type === 'linkPrimary'
                  ? 'text-sm leading-[30px] text-[#3c87f7]'
                  : '';

  return (
    <Text
      className={typeClassName}
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'code' && {
          fontFamily: Fonts.mono,
          fontWeight: 500,
          fontSize: 12,
        },
        style,
      ]}
      {...rest}
    />
  );
}

export const ThemedText = cssInterop(ThemedTextBase, {
  className: {
    target: 'style',
  },
});
