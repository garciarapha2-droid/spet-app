/**
 * Reusable UI components for SPET Mobile.
 * All touch targets >= 44px. Dark theme. Premium feel.
 */
import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, radius, fontSize } from '../theme/colors';

// ─── Button ────────────────────────────────────────────

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'ghost' | 'success';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  size?: 'lg' | 'md';
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  size = 'lg',
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const bgMap = {
    primary: colors.primary,
    danger: colors.danger,
    ghost: 'transparent',
    success: colors.success,
  };

  const textColorMap = {
    primary: '#fff',
    danger: '#fff',
    ghost: colors.primary,
    success: '#fff',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        {
          backgroundColor: bgMap[variant],
          borderRadius: radius.lg,
          height: size === 'lg' ? 56 : 48,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: spacing.sm,
          opacity: isDisabled ? 0.5 : 1,
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColorMap[variant]} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={{
              color: textColorMap[variant],
              fontSize: size === 'lg' ? fontSize.lg : fontSize.md,
              fontWeight: '600',
            }}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ─── Input ─────────────────────────────────────────────

interface InputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function Input({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  autoCapitalize = 'none',
  keyboardType = 'default',
  icon,
  style,
}: InputProps) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.bgInput,
          borderRadius: radius.lg,
          height: 56,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          borderWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {icon && <View style={{ marginRight: spacing.md }}>{icon}</View>}
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.textPlaceholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        style={{
          flex: 1,
          color: colors.text,
          fontSize: fontSize.md,
        }}
      />
    </View>
  );
}

// ─── Card ──────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export function Card({ children, style, onPress }: CardProps) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        {
          backgroundColor: colors.bgCard,
          borderRadius: radius.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {children}
    </Wrapper>
  );
}

// ─── Chip ──────────────────────────────────────────────

interface ChipProps {
  label: string;
  color?: string;
  bgColor?: string;
}

export function Chip({ label, color = colors.text, bgColor = colors.bgElevated }: ChipProps) {
  return (
    <View
      style={{
        backgroundColor: bgColor,
        borderRadius: radius.full,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
      }}
    >
      <Text style={{ color, fontSize: fontSize.xs, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

// ─── StatusBadge ───────────────────────────────────────

export function StatusBadge({ severity }: { severity: 'critical' | 'warning' | 'info' | 'success' }) {
  const map = {
    critical: { bg: colors.dangerBg, color: colors.danger, label: 'Blocked' },
    warning: { bg: colors.warningBg, color: colors.warning, label: 'Flagged' },
    info: { bg: colors.infoBg, color: colors.info, label: 'Info' },
    success: { bg: colors.successBg, color: colors.success, label: 'OK' },
  };
  const cfg = map[severity] || map.info;
  return <Chip label={cfg.label} color={cfg.color} bgColor={cfg.bg} />;
}

// ─── Loading Overlay ───────────────────────────────────

export function LoadingOverlay({ visible, message }: { visible: boolean; message?: string }) {
  if (!visible) return null;
  return (
    <View
      style={{
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.bgOverlay,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      {message && (
        <Text style={{ color: colors.text, fontSize: fontSize.md, marginTop: spacing.lg }}>
          {message}
        </Text>
      )}
    </View>
  );
}

// ─── Stat Card ─────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  color?: string;
}

export function StatCard({ label, value, color = colors.primary }: StatCardProps) {
  return (
    <Card style={{ flex: 1, alignItems: 'center', padding: spacing.lg }}>
      <Text
        style={{
          fontSize: fontSize.xxl,
          fontWeight: '700',
          color,
          fontVariant: ['tabular-nums'],
        }}
      >
        {value}
      </Text>
      <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: spacing.xs }}>
        {label}
      </Text>
    </Card>
  );
}

// ─── Section Header ────────────────────────────────────

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={{ fontSize: fontSize.title, fontWeight: '700', color: colors.text }}>{title}</Text>
      {subtitle && (
        <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}
