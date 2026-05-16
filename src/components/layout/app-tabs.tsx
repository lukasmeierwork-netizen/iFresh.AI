import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useColorScheme, View } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View style={styles.root}>
      <NativeTabs
        backgroundColor={colors.glassRoot}
      // indicatorColor={colors.backgroundElement}
      // labelStyle={{ selected: { color: colors.text } }}
      >
        <NativeTabs.Trigger name="index">
          <Icon src={<VectorIcon family={MaterialCommunityIcons} name="home" />} />
          <Label>{t('tabs.home')}</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="scan">
          <Icon src={<VectorIcon family={MaterialCommunityIcons} name="camera-outline" />} />
          <Label>{t('tabs.scan')}</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="task">
          <Icon src={<VectorIcon family={MaterialCommunityIcons} name="calendar-outline" />} />
          <Label>{t('tabs.task')}</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="settings">
          <Icon src={<VectorIcon family={MaterialCommunityIcons} name="cog-outline" />} />
          <Label>{t('tabs.settings')}</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
