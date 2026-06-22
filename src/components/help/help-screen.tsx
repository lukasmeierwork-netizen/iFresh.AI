import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  HelpBullet,
  HelpFaqItem,
  HelpSectionAccordion,
  HelpStep,
} from '@/components/help/help-section-accordion';
import { TabGlassScreenRoot } from '@/components/ui/glass-home-backdrop';
import { ThemedText } from '@/components/ui/themed-text';
import { Brand, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SUPPORT_EMAIL = 'cstar.dev929@gmail.com';

type SectionId =
  | 'overview'
  | 'home'
  | 'nearVision'
  | 'scan'
  | 'tasks'
  | 'privacy'
  | 'settings'
  | 'tips'
  | 'doctor'
  | 'faq';

type SectionConfig = {
  id: SectionId;
  icon: string;
  accent: string;
  titleKey: string;
};

const SECTIONS: SectionConfig[] = [
  { id: 'overview', icon: 'sparkles', accent: Brand.primary, titleKey: 'help.overview.title' },
  { id: 'home', icon: 'house.fill', accent: Brand.indigo, titleKey: 'help.home.title' },
  { id: 'nearVision', icon: 'eye.fill', accent: Brand.success, titleKey: 'help.nearVision.title' },
  { id: 'scan', icon: 'chart.line.uptrend.xyaxis', accent: Brand.info, titleKey: 'help.scan.title' },
  { id: 'tasks', icon: 'calendar', accent: Brand.violet, titleKey: 'help.tasks.title' },
  { id: 'privacy', icon: 'lock.shield.fill', accent: Brand.primaryDark, titleKey: 'help.privacy.title' },
  { id: 'settings', icon: 'gearshape.fill', accent: Brand.warnAmber, titleKey: 'help.settings.title' },
  { id: 'tips', icon: 'lightbulb.fill', accent: Brand.warn, titleKey: 'help.tips.title' },
  { id: 'doctor', icon: 'cross.case.fill', accent: Brand.danger, titleKey: 'help.doctor.title' },
  { id: 'faq', icon: 'questionmark.circle.fill', accent: Brand.primary, titleKey: 'help.faq.title' },
];

export function HelpScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const safeAreaInsets = useSafeAreaInsets();
  const [expandedId, setExpandedId] = useState<SectionId | null>('overview');

  const insets = useMemo(
    () => ({
      ...safeAreaInsets,
      bottom: safeAreaInsets.bottom + Spacing.three,
    }),
    [safeAreaInsets],
  );

  const toggleSection = useCallback((id: SectionId) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleContactSupport = useCallback(() => {
    void Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  }, []);

  const renderSectionBody = (id: SectionId) => {
    switch (id) {
      case 'overview':
        return (
          <View className="gap-3">
            <ThemedText className="text-[14px] leading-[21px]" style={{ color: theme.glassTextSecondary }}>
              {t('help.overview.intro')}
            </ThemedText>
            <View className="gap-2">
              <HelpBullet text={t('help.overview.bullet1')} accent={Brand.primary} />
              <HelpBullet text={t('help.overview.bullet2')} accent={Brand.primary} />
              <HelpBullet text={t('help.overview.bullet3')} accent={Brand.primary} />
            </View>
            <View
              className="rounded-2xl border px-3.5 py-3"
              style={{ borderColor: `${Brand.warnAmber}44`, backgroundColor: `${Brand.warnAmber}14` }}>
              <ThemedText className="text-[13px] leading-[19px]" style={{ color: theme.glassTextSecondary }}>
                {t('help.overview.disclaimer')}
              </ThemedText>
            </View>
          </View>
        );
      case 'home':
        return (
          <View className="gap-2">
            <ThemedText className="text-[14px] leading-[21px]" style={{ color: theme.glassTextSecondary }}>
              {t('help.home.body')}
            </ThemedText>
            <HelpBullet text={t('help.home.tip1')} />
            <HelpBullet text={t('help.home.tip2')} />
            <HelpBullet text={t('help.home.tip3')} />
          </View>
        );
      case 'nearVision':
        return (
          <View className="gap-2.5">
            <ThemedText className="text-[14px] leading-[21px]" style={{ color: theme.glassTextSecondary }}>
              {t('help.nearVision.intro')}
            </ThemedText>
            <HelpStep index={1} title={t('help.nearVision.step1Title')} body={t('help.nearVision.step1Body')} accent={Brand.success} />
            <HelpStep index={2} title={t('help.nearVision.step2Title')} body={t('help.nearVision.step2Body')} accent={Brand.success} />
            <HelpStep index={3} title={t('help.nearVision.step3Title')} body={t('help.nearVision.step3Body')} accent={Brand.success} />
            <HelpStep index={4} title={t('help.nearVision.step4Title')} body={t('help.nearVision.step4Body')} accent={Brand.success} />
            <HelpStep index={5} title={t('help.nearVision.step5Title')} body={t('help.nearVision.step5Body')} accent={Brand.success} />
          </View>
        );
      case 'scan':
        return (
          <View className="gap-2">
            <ThemedText className="text-[14px] leading-[21px]" style={{ color: theme.glassTextSecondary }}>
              {t('help.scan.body')}
            </ThemedText>
            <HelpBullet text={t('help.scan.tip')} accent={Brand.info} />
          </View>
        );
      case 'tasks':
        return (
          <View className="gap-2">
            <ThemedText className="text-[14px] leading-[21px]" style={{ color: theme.glassTextSecondary }}>
              {t('help.tasks.body')}
            </ThemedText>
            <HelpBullet text={t('help.tasks.howTo')} />
            <HelpBullet text={t('help.tasks.categories')} />
          </View>
        );
      case 'privacy':
        return (
          <View className="gap-2">
            <ThemedText className="text-[14px] leading-[21px]" style={{ color: theme.glassTextSecondary }}>
              {t('help.privacy.body')}
            </ThemedText>
            <HelpBullet text={t('help.privacy.onDevice')} accent={Brand.primary} />
            <HelpBullet text={t('help.privacy.neverUpload')} accent={Brand.primary} />
          </View>
        );
      case 'settings':
        return (
          <View className="gap-2">
            <ThemedText className="text-[14px] leading-[21px]" style={{ color: theme.glassTextSecondary }}>
              {t('help.settings.body')}
            </ThemedText>
            <HelpBullet text={t('help.settings.calibration')} />
            <HelpBullet text={t('help.settings.format')} />
          </View>
        );
      case 'tips':
        return (
          <View className="gap-2">
            <HelpBullet text={t('help.tips.tip1')} accent={Brand.warn} />
            <HelpBullet text={t('help.tips.tip2')} accent={Brand.warn} />
            <HelpBullet text={t('help.tips.tip3')} accent={Brand.warn} />
            <HelpBullet text={t('help.tips.tip4')} accent={Brand.warn} />
          </View>
        );
      case 'doctor':
        return (
          <ThemedText className="text-[14px] leading-[21px]" style={{ color: theme.glassTextSecondary }}>
            {t('help.doctor.body')}
          </ThemedText>
        );
      case 'faq':
        return (
          <View className="gap-2.5">
            <HelpFaqItem question={t('help.faq.q1')} answer={t('help.faq.a1')} />
            <HelpFaqItem question={t('help.faq.q2')} answer={t('help.faq.a2')} />
            <HelpFaqItem question={t('help.faq.q3')} answer={t('help.faq.a3')} />
            <HelpFaqItem question={t('help.faq.q4')} answer={t('help.faq.a4')} />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <TabGlassScreenRoot>
      <ScrollView
        className="flex-1"
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.three,
          paddingBottom: insets.bottom,
        }}>
        <SafeAreaView
          className="w-full items-center px-6"
          style={{ maxWidth: MaxContentWidth }}
          edges={['left', 'right']}>
          <View className="w-full max-w-[420px] gap-5">
            <View className="flex-row items-center justify-between gap-4 px-1">
              <View className="min-w-0 flex-1 gap-1.5">
                <ThemedText
                  type="small"
                  className="font-semibold tracking-[1.4px]"
                  style={{ color: theme.glassTextMuted }}>
                  {t('common.brand')}
                </ThemedText>
                <ThemedText className="text-[28px] font-bold leading-9" style={{ color: theme.glassTextPrimary }}>
                  {t('help.title')}
                </ThemedText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('help.backA11y')}
                onPress={() => router.back()}
                hitSlop={6}>
                {({ pressed }) => (
                  <View
                    className="h-11 w-11 items-center justify-center overflow-hidden rounded-full border"
                    style={{
                      opacity: pressed ? 0.88 : 1,
                      borderColor: theme.glassBorderStrong,
                      backgroundColor: theme.glassSurfaceRaised,
                    }}>
                    <SymbolView tintColor={theme.glassIcon} name={'chevron.left' as any} size={18} />
                  </View>
                )}
              </Pressable>
            </View>

            <View className="overflow-hidden rounded-3xl">
              <LinearGradient
                colors={[Brand.heroBlue, Brand.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingHorizontal: 20, paddingVertical: 22 }}>
                <View className="flex-row items-start gap-4">
                  <View
                    className="h-14 w-14 items-center justify-center rounded-[18px]"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.18)' }}>
                    <SymbolView tintColor="#FFFFFF" name={'book.fill' as any} size={26} weight="semibold" />
                  </View>
                  <View className="min-w-0 flex-1 gap-2">
                    <ThemedText
                      type="small"
                      className="font-bold tracking-[1.4px]"
                      style={{ color: 'rgba(255, 255, 255, 0.78)' }}>
                      {t('help.heroEyebrow')}
                    </ThemedText>
                    <ThemedText className="text-[17px] font-semibold leading-6" style={{ color: '#FFFFFF' }}>
                      {t('help.subtitle')}
                    </ThemedText>
                  </View>
                </View>
              </LinearGradient>
            </View>

            <View className="gap-3">
              {SECTIONS.map((section) => (
                <HelpSectionAccordion
                  key={section.id}
                  icon={section.icon}
                  accent={section.accent}
                  title={t(section.titleKey as any)}
                  expanded={expandedId === section.id}
                  onToggle={() => toggleSection(section.id)}
                  accessibilityLabel={
                    expandedId === section.id
                      ? t('help.sectionExpandedA11y', { title: t(section.titleKey as any) })
                      : t('help.sectionCollapsedA11y', { title: t(section.titleKey as any) })
                  }>
                  {renderSectionBody(section.id)}
                </HelpSectionAccordion>
              ))}
            </View>

            <View
              className="gap-4 overflow-hidden rounded-3xl border px-5 py-6"
              style={{ borderColor: theme.glassBorder, backgroundColor: theme.glassSurface }}>
              <View className="flex-row items-center gap-3">
                <View
                  className="h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: theme.glassPrimarySoft }}>
                  <SymbolView tintColor={Brand.primary} name={'envelope.fill' as any} size={18} />
                </View>
                <View className="min-w-0 flex-1 gap-1">
                  <ThemedText className="text-[16px] font-semibold leading-5" style={{ color: theme.glassTextPrimary }}>
                    {t('help.supportTitle')}
                  </ThemedText>
                  <ThemedText className="text-[13px] leading-[19px]" style={{ color: theme.glassTextSecondary }}>
                    {t('help.supportBody')}
                  </ThemedText>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('help.contactSupportA11y')}
                onPress={handleContactSupport}
                style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
                <LinearGradient
                  colors={[Brand.primary, Brand.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.supportButton}>
                  <SymbolView tintColor="#FFFFFF" name={'paperplane.fill' as any} size={14} />
                  <ThemedText className="text-[15px] font-semibold" style={{ color: '#FFFFFF' }}>
                    {t('help.contactSupport')}
                  </ThemedText>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </ScrollView>
    </TabGlassScreenRoot>
  );
}

const styles = StyleSheet.create({
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
});
