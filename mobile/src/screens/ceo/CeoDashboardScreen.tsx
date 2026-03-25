/**
 * CEO Dashboard — Production-ready.
 * SafeArea, pull-to-refresh, error/empty/skeleton states, accessibility.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../../theme/colors';
import { Card } from '../../components/ui';
import {
  ScreenWrapper, ErrorState, EmptyState,
  SkeletonDashboard, SkeletonList, HorizontalTabBar, useAsyncData,
} from '../../components/ProductionUI';
import * as ceoService from '../../services/ceoService';

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'activity' },
  { key: 'revenue', label: 'Revenue', icon: 'dollar-sign' },
  { key: 'pipeline', label: 'Pipeline', icon: 'git-pull-request' },
  { key: 'users', label: 'Users', icon: 'users' },
  { key: 'security', label: 'Security', icon: 'shield' },
  { key: 'reports', label: 'Reports', icon: 'file-text' },
];

export default function CeoDashboardScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: Platform.OS === 'ios' ? 0 : insets.top }}>
        <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.md, paddingBottom: spacing.md }}>
          <Text style={{ fontSize: fontSize.title, fontWeight: '700', color: colors.text }} accessibilityRole="header">
            CEO
          </Text>
          <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs }}>Operating System</Text>
        </View>
        <HorizontalTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} accentColor="#8B5CF6" />
      </View>

      {activeTab === 'overview' && <CeoOverviewSection />}
      {activeTab === 'revenue' && <CeoRevenueSection />}
      {activeTab === 'pipeline' && <CeoPipelineSection />}
      {activeTab === 'users' && <CeoUsersSection />}
      {activeTab === 'security' && <CeoSecuritySection />}
      {activeTab === 'reports' && <CeoReportsSection />}
    </View>
  );
}

function KPICard({ icon, label, value, color }: { icon: string; label: string; value: any; color: string }) {
  return (
    <View style={{
      width: '48%', backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md,
      borderWidth: 1, borderColor: colors.border,
    }} accessibilityLabel={`${label}: ${value}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
        <Feather name={icon as any} size={14} color={color} />
        <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>{label}</Text>
      </View>
      <Text style={{ fontSize: fontSize.xl, fontWeight: '700', color, fontVariant: ['tabular-nums'] }}>{value}</Text>
    </View>
  );
}

/* ─── OVERVIEW ─── */
function CeoOverviewSection() {
  const { data, loading, error, refresh } = useAsyncData(() => ceoService.getHealth(), []);

  if (loading) return <SkeletonDashboard />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const kpis = data?.kpis || {};

  return (
    <ScreenWrapper onRefresh={refresh} padTop={false}>
      <Card style={{ marginBottom: spacing.xxl, alignItems: 'center' }}>
        <View style={{
          width: 48, height: 48, borderRadius: 24, backgroundColor: colors.successBg,
          alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
        }}>
          <Feather name="check-circle" size={24} color={colors.success} />
        </View>
        <Text style={{ fontSize: fontSize.lg, fontWeight: '700', color: colors.text }}>System Healthy</Text>
      </Card>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xxl }}>
        <KPICard icon="dollar-sign" label="MRR" value={`$${(kpis.mrr || 0).toFixed(0)}`} color={colors.success} />
        <KPICard icon="users" label="Active Companies" value={kpis.active_companies || 0} color={colors.info} />
        <KPICard icon="trending-up" label="Growth" value={`${(kpis.growth_pct || 0).toFixed(1)}%`} color={colors.primary} />
        <KPICard icon="activity" label="Active Venues" value={kpis.active_venues || 0} color={colors.warning} />
        <KPICard icon="dollar-sign" label="Revenue YTD" value={`$${(kpis.revenue_ytd || 0).toFixed(0)}`} color="#10B981" />
        <KPICard icon="percent" label="Activation" value={`${(kpis.activation_rate || 0).toFixed(1)}%`} color={colors.primaryLight} />
      </View>
    </ScreenWrapper>
  );
}

/* ─── REVENUE ─── */
function CeoRevenueSection() {
  const [period, setPeriod] = useState('month');
  const { data, loading, error, refresh } = useAsyncData(() => ceoService.getRevenue(period), [period]);

  if (loading) return <SkeletonDashboard />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const chart = data?.chart || [];
  const totalRevenue = chart.reduce((s: number, c: any) => s + (c.revenue || 0), 0);
  const totalProfit = chart.reduce((s: number, c: any) => s + (c.profit || 0), 0);

  return (
    <ScreenWrapper onRefresh={refresh} padTop={false}>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xxl }}>
        {['week', 'month', 'quarter', 'year'].map(p => (
          <TouchableOpacity key={p} onPress={() => setPeriod(p)}
            accessibilityRole="button" accessibilityState={{ selected: period === p }}
            style={{
              paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
              backgroundColor: period === p ? '#8B5CF6' : colors.bgCard,
              borderWidth: 1, borderColor: period === p ? '#8B5CF6' : colors.border,
            }}>
            <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: period === p ? '#FFF' : colors.textSecondary, textTransform: 'capitalize' }}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xxl }}>
        <Card style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>Revenue</Text>
          <Text style={{ fontSize: fontSize.xl, fontWeight: '700', color: colors.success, marginTop: 4, fontVariant: ['tabular-nums'] }}>${totalRevenue.toFixed(0)}</Text>
        </Card>
        <Card style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>Profit</Text>
          <Text style={{ fontSize: fontSize.xl, fontWeight: '700', color: colors.primary, marginTop: 4, fontVariant: ['tabular-nums'] }}>${totalProfit.toFixed(0)}</Text>
        </Card>
      </View>

      {chart.length > 0 && (
        <Card style={{ marginBottom: spacing.xxl }}>
          <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.md }}>Daily Revenue</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 2 }}>
            {chart.slice(-14).map((d: any, i: number) => {
              const max = Math.max(...chart.map((x: any) => x.revenue || 0), 1);
              return (
                <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                  <View style={{ width: '80%', backgroundColor: '#8B5CF6' + '80', borderTopLeftRadius: 3, borderTopRightRadius: 3, height: ((d.revenue || 0) / max) * 100 }} />
                  <Text style={{ fontSize: 7, color: colors.textMuted, marginTop: 2 }}>
                    {d.period ? new Date(d.period).getDate() : ''}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>
      )}

      {chart.slice(-7).reverse().map((d: any, i: number) => (
        <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border + '30' }}>
          <Text style={{ fontSize: fontSize.sm, color: colors.text }}>{d.period ? new Date(d.period).toLocaleDateString() : ''}</Text>
          <View style={{ flexDirection: 'row', gap: spacing.lg }}>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.success, fontVariant: ['tabular-nums'] }}>${(d.revenue || 0).toFixed(0)}</Text>
            <Text style={{ fontSize: fontSize.sm, color: colors.textMuted, fontVariant: ['tabular-nums'] }}>${(d.profit || 0).toFixed(0)} net</Text>
          </View>
        </View>
      ))}
    </ScreenWrapper>
  );
}

/* ─── PIPELINE ─── */
function CeoPipelineSection() {
  const { data, loading, error, refresh } = useAsyncData(() => ceoService.getPipeline(), []);

  if (loading) return <SkeletonDashboard />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const pipeline = data?.pipeline || {};
  const stages = [
    { name: 'Leads', count: pipeline.leads || 0, color: colors.info },
    { name: 'Paid', count: pipeline.paid || 0, color: colors.success },
    { name: 'Activated', count: pipeline.activated || 0, color: colors.primary },
    { name: 'Active', count: pipeline.active || 0, color: '#10B981' },
    { name: 'At Risk', count: pipeline.at_risk || 0, color: colors.warning },
    { name: 'Cancelled', count: pipeline.cancelled || 0, color: colors.danger },
  ];

  return (
    <ScreenWrapper onRefresh={refresh} padTop={false}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xxl }}>
        {stages.map((s, i) => (
          <View key={i} style={{
            width: '48%', backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.lg,
            borderWidth: 1, borderColor: colors.border, alignItems: 'center',
          }} accessibilityLabel={`${s.name}: ${s.count}`}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: s.color, fontVariant: ['tabular-nums'] }}>{s.count}</Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 4 }}>{s.name}</Text>
          </View>
        ))}
      </View>

      <Card>
        <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.md }}>Conversion Funnel</Text>
        {stages.filter(s => s.count > 0).map((s, i) => {
          const maxCount = Math.max(...stages.map(st => st.count), 1);
          return (
            <View key={i} style={{ marginBottom: spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>{s.name}</Text>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: s.color }}>{s.count}</Text>
              </View>
              <View style={{ height: 8, backgroundColor: colors.bgElevated, borderRadius: 4, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${(s.count / maxCount) * 100}%`, backgroundColor: s.color, borderRadius: 4 }} />
              </View>
            </View>
          );
        })}
      </Card>
    </ScreenWrapper>
  );
}

/* ─── USERS ─── */
function CeoUsersSection() {
  const { data, loading, error, refresh } = useAsyncData(() => ceoService.getUsers(), []);

  if (loading) return <SkeletonList count={6} />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const users = data?.users || [];
  if (users.length === 0) return <EmptyState icon="users" title="No Users" message="No users found in the system." />;

  return (
    <ScreenWrapper onRefresh={refresh} padTop={false}>
      <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md }}>
        All Users ({users.length})
      </Text>
      {users.map((u: any, i: number) => {
        const role = u.roles?.[0]?.role || 'user';
        const statusColor = u.status === 'active' ? colors.success : u.status === 'pending_payment' ? colors.warning : colors.danger;
        const statusBg = u.status === 'active' ? colors.successBg : u.status === 'pending_payment' ? colors.warningBg : colors.dangerBg;
        return (
          <Card key={u.id || i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.primary }}>{(u.email || '?')[0].toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.text }} numberOfLines={1}>{u.email}</Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>{role}</Text>
              </View>
            </View>
            <View style={{ backgroundColor: statusBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: statusColor }}>{u.status}</Text>
            </View>
          </Card>
        );
      })}
    </ScreenWrapper>
  );
}

/* ─── SECURITY ─── */
function CeoSecuritySection() {
  const { data, loading, error, refresh } = useAsyncData(async () => {
    const mod = await import('../../services/analyticsService');
    return mod.getSecurityAnalytics();
  }, []);

  if (loading) return <SkeletonDashboard />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const sec = data || {};

  return (
    <ScreenWrapper onRefresh={refresh} padTop={false}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xxl }}>
        <KPICard icon="users" label="Total Users" value={sec.total_users || 0} color={colors.info} />
        <KPICard icon="activity" label="Active Sessions" value={sec.active_sessions || 0} color={colors.success} />
        <KPICard icon="alert-triangle" label="Failed Logins (24h)" value={sec.failed_logins_24h || 0} color={colors.danger} />
        <KPICard icon="shield" label="MFA Enabled" value={`${(sec.mfa_enabled_pct || 0).toFixed(0)}%`} color={colors.primary} />
      </View>
    </ScreenWrapper>
  );
}

/* ─── REPORTS ─── */
function CeoReportsSection() {
  const { data, loading, error, refresh } = useAsyncData(async () => {
    const mod = await import('../../services/analyticsService');
    return mod.getReportsAnalytics();
  }, []);

  if (loading) return <SkeletonDashboard />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const rep = data || {};

  return (
    <ScreenWrapper onRefresh={refresh} padTop={false}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xxl }}>
        <KPICard icon="dollar-sign" label="Revenue" value={`$${(rep.total_revenue || 0).toFixed(0)}`} color={colors.success} />
        <KPICard icon="target" label="Deals" value={rep.total_deals || 0} color={colors.info} />
        <KPICard icon="percent" label="Conversion" value={`${(rep.conversion_rate || 0).toFixed(1)}%`} color={colors.primary} />
        <KPICard icon="trending-up" label="Avg Deal" value={`$${(rep.avg_deal_value || 0).toFixed(0)}`} color={colors.warning} />
      </View>

      {rep.top_products?.map((p: any, i: number) => (
        <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border + '30' }}>
          <Text style={{ fontSize: fontSize.sm, color: colors.text }}>{p.name}</Text>
          <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.success, fontVariant: ['tabular-nums'] }}>${(p.revenue || 0).toFixed(0)}</Text>
        </View>
      ))}
    </ScreenWrapper>
  );
}
