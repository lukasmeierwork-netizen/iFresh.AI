import React from 'react';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { Brand } from '@/constants/theme';
import { type CalendarAuthorizationStatus } from '@/lib/calendar-events';

function formatPermissionLabel(status: CalendarAuthorizationStatus) {
  return status === 'authorized'
    ? 'Calendar access enabled'
    : status === 'denied'
      ? 'Calendar access denied'
      : status === 'restricted'
        ? 'Calendar access restricted'
        : 'Calendar access not requested';
}

type CalendarStatusCardProps = {
  isCalendarAvailable: boolean;
  permissionStatus: CalendarAuthorizationStatus;
  onRequestAccess: () => void;
};

/** Dark hero card that surfaces calendar permission state and a CTA. */
export function CalendarStatusCard({
  isCalendarAvailable,
  permissionStatus,
  onRequestAccess,
}: CalendarStatusCardProps) {
  const disabled = !isCalendarAvailable;

  return (
    <View style={{ overflow: 'hidden', borderRadius: 28, backgroundColor: Brand.heroNavy, padding: 24 }}>
      <View pointerEvents="none" style={{ position: 'absolute', inset: 0, backgroundColor: Brand.heroNavyDeep }} />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          right: -48,
          top: -32,
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: 'rgba(30,136,255,0.42)',
        }}
      />
      <View className="gap-5">
        <View className="gap-2">
          <ThemedText type="small" className="tracking-[0.8px]" style={{ color: 'rgba(255,255,255,0.72)' }}>
            CALENDAR STATUS
          </ThemedText>
          <ThemedText className="text-[22px] font-semibold leading-7" style={{ color: '#FFFFFF' }}>
            {isCalendarAvailable ? formatPermissionLabel(permissionStatus) : 'Calendar module unavailable'}
          </ThemedText>
          <ThemedText className="text-[14px] leading-5" style={{ color: 'rgba(255,255,255,0.82)' }}>
            {isCalendarAvailable
              ? 'Enable access once, then add recurring eye-care reminders to the local calendar.'
              : 'This runtime does not include the native calendar module yet, so reminders cannot be saved from here.'}
          </ThemedText>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enable calendar access"
          onPress={onRequestAccess}
          disabled={disabled}
          style={({ pressed }) => [
            {
              borderRadius: 18,
              backgroundColor: '#FFFFFF',
              paddingVertical: 14,
              paddingHorizontal: 16,
              opacity: pressed || disabled ? 0.82 : 1,
            },
          ]}>
          <ThemedText className="text-center text-[15px] font-semibold" style={{ color: Brand.primary }}>
            Enable calendar access
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}
