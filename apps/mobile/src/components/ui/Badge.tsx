import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function Badge({ children, variant = 'default', style }: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant], style]}>
      <Text style={[styles.text, styles[`text_${variant}`]]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
  default: { backgroundColor: '#f1f5f9' },
  success: { backgroundColor: '#dcfce7' },
  warning: { backgroundColor: '#fef3c7' },
  danger: { backgroundColor: '#fee2e2' },
  info: { backgroundColor: '#e0f2fe' },

  text: { fontSize: 12, fontWeight: '600' },
  text_default: { color: '#475569' },
  text_success: { color: '#166534' },
  text_warning: { color: '#92400e' },
  text_danger: { color: '#991b1b' },
  text_info: { color: '#0369a1' },
});
