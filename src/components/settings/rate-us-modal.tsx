import { SymbolView } from 'expo-symbols';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import { GradientButton } from '@/components/ui/gradient-button';
import { ThemedText } from '@/components/ui/themed-text';
import { Gradients, MaxContentWidth, Spacing } from '@/constants/theme';

type RateUsModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, feedback: string) => void | Promise<void>;
};

/** Light card tokens — matches the clean feedback-style modal regardless of app theme. */
const ModalSurface = {
  card: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  placeholder: '#9CA3AF',
  disabledButton: '#F3F4F6',
  disabledButtonText: '#D1D5DB',
  scrim: 'rgba(0, 0, 0, 0.4)',
  starEmpty: '#D1D5DB',
  starFilled: '#F59E0B', // awesome gold color
} as const;

const inputStyle = {
  borderWidth: 1,
  borderColor: ModalSurface.border,
  borderRadius: 12,
  paddingHorizontal: Spacing.three,
  paddingVertical: Spacing.three,
  fontSize: 15,
  lineHeight: 22,
  color: ModalSurface.text,
} as const;

export function RateUsModal({ visible, onClose, onSubmit }: RateUsModalProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cardWidth = Math.min(width - Spacing.four * 2, MaxContentWidth, 360);
  const canSubmit = rating > 0 && !isSubmitting;

  const resetForm = useCallback(() => {
    setRating(0);
    setFeedback('');
    setIsSubmitting(false);
  }, []);

  useEffect(() => {
    if (!visible) resetForm();
  }, [resetForm, visible]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await onSubmit(rating, feedback.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, rating, feedback, onClose, onSubmit]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('settings.rateUsModalCloseA11y')}
          onPress={handleClose}
          style={{
            flex: 1,
            backgroundColor: ModalSurface.scrim,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: Spacing.four,
          }}>
          <View
            onStartShouldSetResponder={() => true}
            style={{
              width: cardWidth,
              borderRadius: 24,
              backgroundColor: ModalSurface.card,
              padding: Spacing.four,
              gap: Spacing.four,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 5,
            }}>
            
            <ThemedText
              className="text-[16px] font-semibold text-center"
              style={{ color: ModalSurface.text }}>
              {t('settings.rateUsModalTitle', 'How would you rate your experience?')}
            </ThemedText>

            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: Spacing.one }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => setRating(star)}
                  hitSlop={8}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  })}>
                  <SymbolView
                    name={rating >= star ? 'star.fill' : 'star'}
                    size={38}
                    tintColor={rating >= star ? ModalSurface.starFilled : ModalSurface.starEmpty}
                  />
                </Pressable>
              ))}
            </View>

            <View style={{ gap: Spacing.one }}>
              <ThemedText className="text-[14px] font-medium" style={{ color: ModalSurface.text }}>
                {t('settings.rateUsModalFeedbackLabelOptional', 'Please tell us more (optional)')}
              </ThemedText>
              <TextInput
                value={feedback}
                onChangeText={setFeedback}
                placeholder={t('settings.rateUsModalFeedbackPlaceholder')}
                placeholderTextColor={ModalSurface.placeholder}
                multiline
                textAlignVertical="top"
                editable={!isSubmitting}
                style={{
                  ...inputStyle,
                  minHeight: 100,
                }}
              />
            </View>

            <GradientButton
              label={t('settings.rateUsModalSubmit')}
              onPress={handleSubmit}
              disabled={!canSubmit}
              colors={canSubmit ? Gradients.composerPrimary : undefined}
              solidColor={canSubmit ? undefined : ModalSurface.disabledButton}
              textColor={canSubmit ? '#FFFFFF' : ModalSurface.disabledButtonText}
              radius={12}
              paddingVertical={14}
            />
          </View>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
