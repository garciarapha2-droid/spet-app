/**
 * Production-ready reusable components for SPET Mobile.
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
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../theme/colors';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Screen Wrapper ─────────────────────────────────────
// Handles safe area, background, keyboard dismiss, pull-to-refresh.
interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  onRefresh?: () => Promise<void>;
  padHorizontal?: boolean;
  padTop?: boolean;
  testID?: string;
}

export function ScreenWrapper({
  children,
  scrollable = true,
  onRefresh,
  padHorizontal = true,
  padTop = true,
  testID,
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try { await onRefresh(); } catch {}
    setRefreshing(false);
  }, [onRefresh]);

  const style = {
    flex: 1,
    backgroundColor: colors.bg,
  };

  const contentStyle = {
    paddingTop: padTop ? insets.top + spacing.md : spacing.md,
    paddingBottom: insets.bottom + 20,
    paddingHorizontal: padHorizontal ? spacing.xxl : 0,
  };

  if (!scrollable) {
    return (
      <View style={style} data-testid={testID}>
        <View style={[contentStyle, { flex: 1 }]}>{children}</View>
      </View>
    );
  }

  return (
    <View style={style}>
      <ScrollView
        contentContainerStyle={contentStyle}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              progressViewOffset={insets.top}
            />
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
interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
}

export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  return (
    <View style={{ marginBottom: spacing.xxl }}>
      <Text
        style={{ fontSize: fontSize.title, fontWeight: '700', color: colors.text }}
        accessibilityRole="header"
      >
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

// ─── Error State ────────────────────────────────────────
interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong', onRetry }: ErrorStateProps) {
  return (
    <View
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxxl }}
      accessibilityRole="alert"
      data-testid="error-state"
    >
      <View style={{
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: colors.dangerBg, alignItems: 'center', justifyContent: 'center',
        marginBottom: spacing.xxl,
      }}>
        <Feather name="alert-circle" size={28} color={colors.danger} />
      </View>
      <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.text, textAlign: 'center' }}>
        Unable to load
      </Text>
      <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, maxWidth: 260 }}>
        {message}
      </Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          activeOpacity={0.7}
          accessibilityLabel="Retry loading"
          accessibilityRole="button"
          style={{
            flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
            marginTop: spacing.xxl, paddingHorizontal: 20, paddingVertical: 12,
            borderRadius: radius.lg, backgroundColor: colors.primaryBg,
            borderWidth: 1, borderColor: colors.primary + '30',
          }}
        >
          <Feather name="refresh-cw" size={16} color={colors.primary} />
          <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.primary }}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Empty State ────────────────────────────────────────
interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = 'inbox', title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View
      style={{ alignItems: 'center', padding: spacing.xxxl, paddingTop: 60 }}
      data-testid="empty-state"
    >
      <View style={{
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center',
        marginBottom: spacing.xxl,
      }}>
        <Feather name={icon as any} size={28} color={colors.textMuted} />
      </View>
      <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.text, textAlign: 'center' }}>
        {title}
      </Text>
      {message && (
        <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, maxWidth: 260 }}>
          {message}
        </Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.7}
          style={{
            marginTop: spacing.xxl, paddingHorizontal: 20, paddingVertical: 12,
            borderRadius: radius.lg, backgroundColor: colors.primary,
          }}
        >
          <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: '#FFF' }}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Skeleton Loader ────────────────────────────────────
function SkeletonPulse({ width: w, height: h, borderRadius: br = radius.md, style }: any) {
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

  return (
    <Animated.View style={[{
      width: w, height: h, borderRadius: br,
      backgroundColor: colors.bgElevated, opacity,
    }, style]} />
  );
}

export function SkeletonCard() {
  return (
    <View style={{
      backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg,
      borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm,
    }}>
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

export function SkeletonKPI() {
  return (
    <View style={{
      width: '48%', backgroundColor: colors.bgCard, borderRadius: radius.md,
      padding: spacing.md, borderWidth: 1, borderColor: colors.border,
    }}>
      <SkeletonPulse width={60} height={10} style={{ marginBottom: spacing.sm }} />
      <SkeletonPulse width={80} height={22} />
    </View>
  );
}

export function SkeletonDashboard() {
  return (
    <View style={{ padding: spacing.xxl, paddingTop: spacing.md }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xxl }}>
        <SkeletonKPI />
        <SkeletonKPI />
        <SkeletonKPI />
        <SkeletonKPI />
      </View>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <View style={{ padding: spacing.xxl, paddingTop: spacing.md }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

// ─── Horizontal Tab Bar (reusable for dashboards) ──────
interface TabDef {
  key: string;
  label: string;
  icon: string;
}

interface HorizontalTabBarProps {
  tabs: TabDef[];
  activeTab: string;
  onTabChange: (key: string) => void;
  accentColor?: string;
}

export function HorizontalTabBar({ tabs, activeTab, onTabChange, accentColor = colors.primary }: HorizontalTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
        paddingBottom: spacing.md,
      }}
    >
      {tabs.map(tab => {
        const active = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
              backgroundColor: active ? accentColor : colors.bgCard,
              borderWidth: 1, borderColor: active ? accentColor : colors.border,
            }}
          >
            <Feather name={tab.icon as any} size={14} color={active ? '#FFF' : colors.textSecondary} />
            <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: active ? '#FFF' : colors.textSecondary }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── Error Boundary ─────────────────────────────────────
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', padding: spacing.xxxl }}>
          <View style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: colors.dangerBg, alignItems: 'center', justifyContent: 'center',
            marginBottom: spacing.xxl,
          }}>
            <Feather name="alert-triangle" size={32} color={colors.danger} />
          </View>
          <Text style={{ fontSize: fontSize.xl, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
            Something went wrong
          </Text>
          <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md, maxWidth: 280 }}>
            The app encountered an unexpected error. Please try again.
          </Text>
          <TouchableOpacity
            onPress={this.resetError}
            activeOpacity={0.7}
            style={{
              marginTop: spacing.xxl, paddingHorizontal: 24, paddingVertical: 14,
              borderRadius: radius.lg, backgroundColor: colors.primary,
            }}
          >
            <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: '#FFF' }}>Restart</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

// ─── useAsyncData hook ──────────────────────────────────
// Reusable hook for all API calls with loading/error/retry.
type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: any[] = [],
): AsyncState<T> {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    }
    setLoading(false);
  }, deps);

  React.useEffect(() => { load(); }, [load]);

  return { data, loading, error, refresh: load };
}
