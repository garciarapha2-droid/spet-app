/**
 * Themed reusable UI components for SPET Mobile.
 * All components use useTheme() — no hardcoded colors.
 * Touch targets >= 44px. Premium feel.
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
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, radius, fontSize } from '../theme/themes';

// ─── Button ────────────────────────────────────────────

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'ghost' | 'success' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  size?: 'lg' | 'md';
  style?: ViewStyle;
}

export function Button({
  title, onPress, variant = 'primary', loading = false,
  disabled = false, icon, size = 'lg', style,
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const bgMap: Record<string, string> = {
    primary: colors.primary,
    danger: colors.destructive,
    ghost: 'transparent',
    success: colors.emerald500,
    outline: 'transparent',
  };
  const textColorMap: Record<string, string> = {
    primary: colors.primaryForeground,
    danger: '#fff',
    ghost: colors.primary,
    success: '#000',
    outline: colors.foreground,
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
          borderWidth: variant === 'ghost' || variant === 'outline' ? 1 : 0,
          borderColor: variant === 'outline' ? colors.border : colors.border,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColorMap[variant]} size="small" />
      ) : (
        <>
          {icon}
          <Text style={{ color: textColorMap[variant], fontSize: size === 'lg' ? fontSize.lg : fontSize.md, fontWeight: '600' }}>
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
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  icon?: React.ReactNode;
  style?: ViewStyle;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function Input({
  placeholder, value, onChangeText, secureTextEntry,
  autoCapitalize = 'none', keyboardType = 'default', icon, style,
  onFocus, onBlur,
}: InputProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
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
        placeholderTextColor={colors.placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        onFocus={onFocus}
        onBlur={onBlur}
        style={{ flex: 1, color: colors.foreground, fontSize: fontSize.sm }}
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
  const { colors } = useTheme();
  const Wrapper: any = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.border + '80',
        },
        style,
      ]}
    >
      {children}
    </Wrapper>
  );
}

// ─── Chip ──────────────────────────────────────────────

export function Chip({ label, color, bgColor }: { label: string; color?: string; bgColor?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: bgColor || colors.muted, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs }}>
      <Text style={{ color: color || colors.foreground, fontSize: fontSize.tiny, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

// ─── StatusBadge ───────────────────────────────────────

export function StatusBadge({ severity }: { severity: 'critical' | 'warning' | 'info' | 'success' }) {
  const { colors } = useTheme();
  const map = {
    critical: { bg: colors.destructiveBg, color: colors.destructive, label: 'Blocked' },
    warning: { bg: colors.warningBg, color: colors.warning, label: 'Flagged' },
    info: { bg: colors.infoBg, color: colors.info, label: 'Info' },
    success: { bg: colors.successBg, color: colors.success, label: 'OK' },
  };
  const cfg = map[severity] || map.info;
  return <Chip label={cfg.label} color={cfg.color} bgColor={cfg.bg} />;
}

// ─── Loading Overlay ───────────────────────────────────

export function LoadingOverlay({ visible, message }: { visible: boolean; message?: string }) {
  const { colors } = useTheme();
  if (!visible) return null;
  return (
    <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message && <Text style={{ color: colors.foreground, fontSize: fontSize.md, marginTop: spacing.lg }}>{message}</Text>}
    </View>
  );
}

// ─── Stat Card ─────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  color?: string;
  barColor?: string;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, color, barColor, icon }: StatCardProps) {
  const { colors } = useTheme();
  const accentColor = color || colors.primary;
  return (
    <Card style={{ flex: 1, flexDirection: 'row', alignItems: 'center', padding: spacing.md }}>
      <View style={{ width: 3, height: 32, borderRadius: 2, backgroundColor: barColor || accentColor, marginRight: spacing.md }} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {icon}
          <Text style={{ fontSize: fontSize.micro, fontWeight: '700', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1 }} numberOfLines={1}>
            {label}
          </Text>
        </View>
        <Text style={{ fontSize: fontSize['2xl'], fontWeight: '800', color: colors.foreground, fontVariant: ['tabular-nums'], marginTop: 2 }}>
          {value}
        </Text>
      </View>
    </Card>
  );
}

// ─── Section Header ────────────────────────────────────

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={{ fontSize: fontSize.title, fontWeight: '800', color: colors.foreground }}>{title}</Text>
      {subtitle && <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginTop: spacing.xs }}>{subtitle}</Text>}
    </View>
  );
}
