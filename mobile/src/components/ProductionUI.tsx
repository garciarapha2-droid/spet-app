/**
 * Production-ready reusable components — themed.
 * Error states, empty states, skeleton loaders, screen wrapper.
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, fontSize, radius } from '../theme/themes';
import { darkTheme } from '../theme/themes';

// ─── Screen Wrapper ─────────────────────────────────────
interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  onRefresh?: () => Promise<void>;
  padHorizontal?: boolean;
  padTop?: boolean;
  testID?: string;
}

export function ScreenWrapper({
  children, scrollable = true, onRefresh,
  padHorizontal = true, padTop = true, testID,
}: ScreenWrapperProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try { await onRefresh(); } catch {}
    setRefreshing(false);
  }, [onRefresh]);

  const contentStyle = {
    paddingTop: padTop ? insets.top + spacing.md : spacing.md,
    paddingBottom: insets.bottom + 96,
    paddingHorizontal: padHorizontal ? spacing.xxl : 0,
  };

  if (!scrollable) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }} data-testid={testID}>
        <View style={[contentStyle, { flex: 1 }]}>{children}</View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={contentStyle}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} progressViewOffset={insets.top} />
          ) : undefined
        }
        data-testid={testID}
      >
        {children}
      </ScrollView>
    </View>
  );
}

// ─── Screen Header ──────────────────────────────────────
export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: spacing.xxl }}>
      <Text style={{ fontSize: fontSize.title, fontWeight: '800', color: colors.foreground }} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginTop: spacing.xs }}>{subtitle}</Text> : null}
    </View>
  );
}

// ─── Error State ────────────────────────────────────────
export function ErrorState({ message = 'Something went wrong', onRetry }: { message?: string; onRetry?: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxxl }} accessibilityRole="alert" data-testid="error-state">
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.destructiveBg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxl }}>
        <Feather name="alert-circle" size={28} color={colors.destructive} />
      </View>
      <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.foreground, textAlign: 'center' }}>Unable to load</Text>
      <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, textAlign: 'center', marginTop: spacing.sm, maxWidth: 260 }}>{message}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xxl, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.lg, backgroundColor: colors.primaryBg, borderWidth: 1, borderColor: colors.primary + '30' }}>
          <Feather name="refresh-cw" size={16} color={colors.primary} />
          <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.primary }}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Empty State ────────────────────────────────────────
export function EmptyState({ icon = 'inbox', title, message, actionLabel, onAction }: {
  icon?: string; title: string; message?: string; actionLabel?: string; onAction?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', padding: spacing.xxxl, paddingTop: 60 }} data-testid="empty-state">
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxl }}>
        <Feather name={icon as any} size={28} color={colors.mutedForeground} />
      </View>
      <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.foreground, textAlign: 'center' }}>{title}</Text>
      {message && <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, textAlign: 'center', marginTop: spacing.sm, maxWidth: 260 }}>{message}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7} style={{ marginTop: spacing.xxl, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.lg, backgroundColor: colors.primary }}>
          <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: '#FFF' }}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Skeleton Loader ────────────────────────────────────
function SkeletonPulse({ width: w, height: h, borderRadius: br = radius.md, style }: any) {
  const { colors } = useTheme();
  const opacity = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return <Animated.View style={[{ width: w, height: h, borderRadius: br, backgroundColor: colors.muted, opacity }, style]} />;
}

export function SkeletonCard() {
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <SkeletonPulse width={40} height={40} borderRadius={20} />
        <View style={{ flex: 1, gap: 6 }}>
          <SkeletonPulse width="70%" height={14} />
          <SkeletonPulse width="40%" height={10} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <View style={{ padding: spacing.xxl, paddingTop: spacing.md }}>
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </View>
  );
}

// ─── useAsyncData hook ──────────────────────────────────
type AsyncState<T> = { data: T | null; loading: boolean; error: string | null; refresh: () => Promise<void> };

export function useAsyncData<T>(fetcher: () => Promise<T>, deps: any[] = []): AsyncState<T> {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setData(await fetcher()); } catch (err: any) { setError(err.message || 'Failed to load data'); }
    setLoading(false);
  }, deps);

  React.useEffect(() => { load(); }, [load]);
  return { data, loading, error, refresh: load };
}

// ─── Stubs for backward compatibility (removed screens) ─
export function SkeletonDashboard() {
  return <SkeletonList count={4} />;
}

export function HorizontalTabBar({ tabs, activeTab, onTabChange }: {
  tabs: any[]; activeTab: string; onTabChange: (tab: string) => void; accentColor?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
      {tabs.map((tab: any) => {
        const key = typeof tab === 'string' ? tab : tab.key || tab.label;
        const label = typeof tab === 'string' ? tab : tab.label || tab.key;
        return (
          <TouchableOpacity
            key={key}
            onPress={() => onTabChange(key)}
            style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, backgroundColor: activeTab === key ? colors.primary : colors.card, borderWidth: 1, borderColor: activeTab === key ? colors.primary : colors.border }}
          >
            <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: activeTab === key ? colors.primaryForeground : colors.mutedForeground }}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Error Boundary ─────────────────────────────────────
interface ErrorBoundaryState { hasError: boolean; error: Error | null }

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }

  resetError = () => { this.setState({ hasError: false, error: null }); };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      const c = darkTheme;
      return (
        <View style={{ flex: 1, backgroundColor: c.background, justifyContent: 'center', alignItems: 'center', padding: spacing.xxxl }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: c.destructiveBg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxl }}>
            <Feather name="alert-triangle" size={32} color={c.destructive} />
          </View>
          <Text style={{ fontSize: fontSize.xl, fontWeight: '700', color: c.foreground, textAlign: 'center' }}>Something went wrong</Text>
          <Text style={{ fontSize: fontSize.sm, color: c.mutedForeground, textAlign: 'center', marginTop: spacing.md, maxWidth: 280 }}>
            The app encountered an unexpected error.
          </Text>
          <TouchableOpacity onPress={this.resetError} activeOpacity={0.7} style={{ marginTop: spacing.xxl, paddingHorizontal: 24, paddingVertical: 14, borderRadius: radius.lg, backgroundColor: c.primary }}>
            <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: '#FFF' }}>Restart</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
