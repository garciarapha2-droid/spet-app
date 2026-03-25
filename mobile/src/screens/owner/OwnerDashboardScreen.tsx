/**
 * Owner Dashboard — Production-ready.
 * SafeArea, pull-to-refresh, error/empty/skeleton states, accessibility.
 */
import React, { useState } from 'react';
import { View, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../../theme/colors';
import { Card } from '../../components/ui';
import {
  ScreenWrapper, ErrorState, EmptyState,
  SkeletonDashboard, SkeletonList, HorizontalTabBar, useAsyncData,
} from '../../components/ProductionUI';
import * as ownerService from '../../services/ownerService';

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'home' },
  { key: 'performance', label: 'Performance', icon: 'trending-up' },
  { key: 'finance', label: 'Finance', icon: 'dollar-sign' },
  { key: 'customers', label: 'Customers', icon: 'users' },
  { key: 'growth', label: 'Growth', icon: 'zap' },
  { key: 'insights', label: 'Insights', icon: 'eye' },
  { key: 'system', label: 'System', icon: 'settings' },
];

export default function OwnerDashboardScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: Platform.OS === 'ios' ? 0 : insets.top }}>
        <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.md, paddingBottom: spacing.md }}>
          <Text style={{ fontSize: fontSize.title, fontWeight: '700', color: colors.text }} accessibilityRole="header">
            Owner
          </Text>
          <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs }}>Business Intelligence</Text>
        </View>
        <HorizontalTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} accentColor="#F59E0B" />
      </View>

      {activeTab === 'overview' && <OwnerOverviewSection />}
      {activeTab === 'performance' && <PerformanceSection />}
      {activeTab === 'finance' && <FinanceSection />}
      {activeTab === 'customers' && <CustomersSection />}
      {activeTab === 'growth' && <GrowthSection />}
      {activeTab === 'insights' && <InsightsSection />}
      {activeTab === 'system' && <SystemSection />}
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
function OwnerOverviewSection() {
  const { data, loading, error, refresh } = useAsyncData(() => ownerService.getDashboard('business'), []);

  if (loading) return <SkeletonDashboard />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const kpis = data?.kpis || {};
  const venues = data?.venues || [];

  return (
    <ScreenWrapper onRefresh={refresh} padTop={false}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xxl }}>
        <KPICard icon="dollar-sign" label="Revenue MTD" value={`$${(kpis.revenue_mtd || 0).toFixed(0)}`} color={colors.success} />
        <KPICard icon="trending-up" label="Growth" value={`${(kpis.growth_pct || 0).toFixed(1)}%`} color={colors.primary} />
        <KPICard icon="dollar-sign" label="Est. Profit" value={`$${(kpis.estimated_profit || 0).toFixed(0)}`} color="#10B981" />
        <KPICard icon="users" label="Guests (Month)" value={kpis.unique_guests_month || 0} color={colors.info} />
        <KPICard icon="file-text" label="Open Tabs" value={kpis.open_tabs || 0} color={colors.warning} />
        <KPICard icon="dollar-sign" label="ARPU" value={`$${(kpis.arpu || 0).toFixed(0)}`} color={colors.primaryLight} />
      </View>

      {venues.length > 0 && (
        <>
          <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md }}>
            Venues ({venues.length})
          </Text>
          {venues.map((v: any, i: number) => (
            <Card key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text }}>{v.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 }}>
                  <View style={{
                    width: 8, height: 8, borderRadius: 4,
                    backgroundColor: v.health === 'green' ? colors.success : v.health === 'yellow' ? colors.warning : colors.danger,
                  }} />
                  <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>{v.health || 'Active'}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.success, fontVariant: ['tabular-nums'] }}>
                  ${(v.revenue_today || 0).toFixed(0)}
                </Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>
                  {v.open_tabs || 0} tabs, {v.guests_today || 0} guests
                </Text>
              </View>
            </Card>
          ))}
        </>
      )}
    </ScreenWrapper>
  );
}

/* ─── PERFORMANCE ─── */
function PerformanceSection() {
  const { data, loading, error, refresh } = useAsyncData(() => ownerService.getDashboard('performance'), []);

  if (loading) return <SkeletonDashboard />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const perf = data || {};
  const kpis = perf.kpis || perf;

  return (
    <ScreenWrapper onRefresh={refresh} padTop={false}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xxl }}>
        <KPICard icon="dollar-sign" label="Revenue" value={`$${(kpis.revenue || kpis.revenue_mtd || 0).toFixed(0)}`} color={colors.success} />
        <KPICard icon="trending-up" label="Profit Margin" value={`${(kpis.profit_margin || 0).toFixed(1)}%`} color={colors.primary} />
        <KPICard icon="users" label="Staff Count" value={kpis.staff_count || 0} color={colors.info} />
        <KPICard icon="clock" label="Avg Service" value={`${(kpis.avg_service_time || 0).toFixed(0)}m`} color={colors.warning} />
      </View>

      {(perf.staff_performance || perf.staff || []).map((s: any, i: number) => (
        <Card key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.primary }}>{(s.name)?.[0] || '?'}</Text>
            </View>
            <View>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.text }}>{s.name}</Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>{s.role || 'Staff'}</Text>
            </View>
          </View>
          <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.success, fontVariant: ['tabular-nums'] }}>
            ${(s.revenue || s.sales || 0).toFixed(0)}
          </Text>
        </Card>
      ))}
    </ScreenWrapper>
  );
}

/* ─── FINANCE ─── */
function FinanceSection() {
  const { data, loading, error, refresh } = useAsyncData(() => ownerService.getFinance(), []);

  if (loading) return <SkeletonDashboard />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const fin = data || {};

  return (
    <ScreenWrapper onRefresh={refresh} padTop={false}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xxl }}>
        <KPICard icon="dollar-sign" label="Revenue (Month)" value={`$${(fin.revenue_month || 0).toFixed(0)}`} color={colors.success} />
        <KPICard icon="alert-triangle" label="Chargebacks" value={fin.chargebacks || 0} color={colors.danger} />
        <KPICard icon="shield" label="Risk Score" value={fin.risk_score || 0} color={fin.risk_score > 50 ? colors.danger : colors.success} />
        <KPICard icon="percent" label="Refund Rate" value={`${(fin.refund_rate || 0).toFixed(1)}%`} color={colors.warning} />
      </View>

      {(fin.payments || []).length > 0 && (
        <>
          <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md }}>
            Payment Methods
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xxl }}>
            {fin.payments.map((p: any, i: number) => (
              <Card key={i} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, textTransform: 'capitalize' }}>{p.method}</Text>
                <Text style={{ fontSize: fontSize.lg, fontWeight: '700', color: colors.success, marginTop: 4, fontVariant: ['tabular-nums'] }}>
                  ${(p.total || 0).toFixed(0)}
                </Text>
                <Text style={{ fontSize: 9, color: colors.textMuted }}>{p.count} txn</Text>
              </Card>
            ))}
          </View>
        </>
      )}

      {fin.voids_summary && (
        <Card>
          <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.md }}>Voids Summary</Text>
          <View style={{ flexDirection: 'row', gap: spacing.lg }}>
            <View>
              <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Count</Text>
              <Text style={{ fontSize: fontSize.lg, fontWeight: '700', color: colors.danger, fontVariant: ['tabular-nums'] }}>
                {fin.voids_summary.count || 0}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Amount</Text>
              <Text style={{ fontSize: fontSize.lg, fontWeight: '700', color: colors.danger, fontVariant: ['tabular-nums'] }}>
                ${(fin.voids_summary.amount || 0).toFixed(0)}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Rate</Text>
              <Text style={{ fontSize: fontSize.lg, fontWeight: '700', color: colors.warning, fontVariant: ['tabular-nums'] }}>
                {(fin.voids_summary.rate_pct || 0).toFixed(1)}%
              </Text>
            </View>
          </View>
        </Card>
      )}
    </ScreenWrapper>
  );
}

/* ─── CUSTOMERS ─── */
function CustomersSection() {
  const { data, loading, error, refresh } = useAsyncData(() => ownerService.getDashboard('customers'), []);

  if (loading) return <SkeletonDashboard />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const cust = data?.kpis || data || {};

  return (
    <ScreenWrapper onRefresh={refresh} padTop={false}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xxl }}>
        <KPICard icon="users" label="Total Customers" value={cust.total_customers || 0} color={colors.info} />
        <KPICard icon="user-plus" label="New This Month" value={cust.new_this_month || 0} color={colors.success} />
        <KPICard icon="repeat" label="Retention" value={`${(cust.retention_rate || 0).toFixed(0)}%`} color={colors.primary} />
        <KPICard icon="dollar-sign" label="LTV" value={`$${(cust.avg_ltv || 0).toFixed(0)}`} color={colors.warning} />
      </View>

      {(cust.top_customers || cust.segments || []).map((c: any, i: number) => (
        <Card key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.primary }}>{(c.name)?.[0] || '#'}</Text>
            </View>
            <View>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.text }}>{c.name}</Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>{c.visits || c.count || 0} visits</Text>
            </View>
          </View>
          <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.success, fontVariant: ['tabular-nums'] }}>
            ${(c.spend || c.value || 0).toFixed(0)}
          </Text>
        </Card>
      ))}
    </ScreenWrapper>
  );
}

/* ─── GROWTH ─── */
function GrowthSection() {
  const { data, loading, error, refresh } = useAsyncData(() => ownerService.getGrowth(), []);

  if (loading) return <SkeletonDashboard />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const growth = data || {};

  return (
    <ScreenWrapper onRefresh={refresh} padTop={false}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xxl }}>
        <KPICard icon="zap" label="Growth Rate" value={`${(growth.growth_rate || 0).toFixed(1)}%`} color={colors.success} />
        <KPICard icon="gift" label="Loyalty Members" value={growth.loyalty_members || 0} color={colors.primary} />
        <KPICard icon="send" label="Campaigns" value={growth.active_campaigns || 0} color={colors.info} />
        <KPICard icon="target" label="Conversion" value={`${(growth.conversion_rate || 0).toFixed(1)}%`} color={colors.warning} />
      </View>

      {(growth.campaigns || []).map((c: any, i: number) => (
        <Card key={i} style={{ marginBottom: spacing.sm }}>
          <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text }}>{c.name}</Text>
          <View style={{ flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm }}>
            <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>Sent: {c.sent || 0}</Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.success }}>Conv: {c.conversions || 0}</Text>
          </View>
        </Card>
      ))}
    </ScreenWrapper>
  );
}

/* ─── INSIGHTS ─── */
function InsightsSection() {
  const { data, loading, error, refresh } = useAsyncData(() => ownerService.getInsights(), []);

  if (loading) return <SkeletonList count={4} />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const list = Array.isArray(data?.insights || data?.actions || data) ? (data?.insights || data?.actions || data) : [];

  if (list.length === 0) {
    return (
      <EmptyState
        icon="eye"
        title="Smart Insights"
        message="AI-powered insights will appear here as your business generates more data."
      />
    );
  }

  return (
    <ScreenWrapper onRefresh={refresh} padTop={false}>
      {list.map((insight: any, i: number) => (
        <Card key={i} style={{ marginBottom: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
            <Feather name="zap" size={14} color={colors.warning} />
            <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text }}>{insight.title || `Insight ${i + 1}`}</Text>
          </View>
          <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>
            {insight.description || insight.message || JSON.stringify(insight)}
          </Text>
        </Card>
      ))}
    </ScreenWrapper>
  );
}

/* ─── SYSTEM ─── */
function SystemSection() {
  const { data, loading, error, refresh } = useAsyncData(() => ownerService.getSystem(), []);

  if (loading) return <SkeletonList count={4} />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const sys = data || {};
  const venues = sys.venues || [];

  if (venues.length === 0) {
    return <EmptyState icon="settings" title="No Venues" message="Venue configuration will appear here." />;
  }

  return (
    <ScreenWrapper onRefresh={refresh} padTop={false}>
      <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md }}>
        Venues ({venues.length})
      </Text>
      {venues.map((v: any, i: number) => (
        <Card key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.warningBg, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="map-pin" size={16} color={colors.warning} />
            </View>
            <View>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text }}>{v.name}</Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>{v.mode || v.type || 'Standard'}</Text>
            </View>
          </View>
          <View style={{
            backgroundColor: v.active !== false ? colors.successBg : colors.dangerBg,
            paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'center',
          }}>
            <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: v.active !== false ? colors.success : colors.danger }}>
              {v.active !== false ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </Card>
      ))}
    </ScreenWrapper>
  );
}
