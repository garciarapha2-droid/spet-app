/**
 * Owner Dashboard — mirrors web OwnerPage/OwnerLayout.
 * Sections: Overview, Performance, Finance, Customers, Growth, Insights, System.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../../theme/colors';
import { Card } from '../../components/ui';
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
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl, paddingBottom: spacing.md }}>
        <Text style={{ fontSize: fontSize.title, fontWeight: '700', color: colors.text }}>Owner</Text>
        <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs }}>Business Intelligence</Text>
      </View>

      {/* Tab Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.md }}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
              backgroundColor: activeTab === tab.key ? '#F59E0B' : colors.bgCard,
              borderWidth: 1, borderColor: activeTab === tab.key ? '#F59E0B' : colors.border,
            }}
          >
            <Feather name={tab.icon as any} size={14} color={activeTab === tab.key ? '#000' : colors.textSecondary} />
            <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: activeTab === tab.key ? '#000' : colors.textSecondary }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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

/* ─── OVERVIEW ─── */
function OwnerOverviewSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ownerService.getDashboard('business').then(d => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingView />;

  const dash = data || {};
  const kpis = dash.kpis || {};
  const venues = dash.venues || [];

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xxl, paddingTop: spacing.md }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xxl }}>
        <KPICard icon="dollar-sign" label="Revenue MTD" value={`$${(kpis.revenue_mtd || 0).toFixed(0)}`} color={colors.success} />
        <KPICard icon="trending-up" label="Growth" value={`${(kpis.growth_pct || 0).toFixed(1)}%`} color={colors.primary} />
        <KPICard icon="dollar-sign" label="Est. Profit" value={`$${(kpis.estimated_profit || 0).toFixed(0)}`} color="#10B981" />
        <KPICard icon="users" label="Guests (Month)" value={kpis.unique_guests_month || 0} color={colors.info} />
        <KPICard icon="file-text" label="Open Tabs" value={kpis.open_tabs || 0} color={colors.warning} />
        <KPICard icon="dollar-sign" label="ARPU" value={`$${(kpis.arpu || 0).toFixed(0)}`} color={colors.primaryLight} />
      </View>

      {/* Venues */}
      {venues.map((v: any, i: number) => (
        <Card key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
          <View>
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
            <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.success }}>${(v.revenue_today || 0).toFixed(0)}</Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>{v.open_tabs || 0} tabs, {v.guests_today || 0} guests</Text>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

/* ─── PERFORMANCE ─── */
function PerformanceSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ownerService.getDashboard('performance').then(d => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingView />;

  const perf = data || {};

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xxl, paddingTop: spacing.md }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xxl }}>
        <KPICard icon="dollar-sign" label="Revenue" value={`$${(perf.revenue || perf.total_revenue || 0).toFixed(0)}`} color={colors.success} />
        <KPICard icon="trending-up" label="Profit Margin" value={`${(perf.profit_margin || 0).toFixed(1)}%`} color={colors.primary} />
        <KPICard icon="users" label="Staff Count" value={perf.staff_count || 0} color={colors.info} />
        <KPICard icon="clock" label="Avg Service" value={`${(perf.avg_service_time || 0).toFixed(0)}m`} color={colors.warning} />
      </View>

      {/* Staff Performance */}
      {(perf.staff_performance || perf.staff || []).map((s: any, i: number) => (
        <Card key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.primary }}>{(s.name)?.[0] || '?'}</Text>
            </View>
            <View>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.text }}>{s.name}</Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>{s.role || 'Staff'}</Text>
            </View>
          </View>
          <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.success }}>${(s.revenue || s.sales || 0).toFixed(0)}</Text>
        </Card>
      ))}
    </ScrollView>
  );
}

/* ─── FINANCE ─── */
function FinanceSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ownerService.getFinance().then(d => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingView />;

  const fin = data || {};

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xxl, paddingTop: spacing.md }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xxl }}>
        <KPICard icon="dollar-sign" label="Revenue (Month)" value={`$${(fin.revenue_month || 0).toFixed(0)}`} color={colors.success} />
        <KPICard icon="alert-triangle" label="Chargebacks" value={fin.chargebacks || 0} color={colors.danger} />
        <KPICard icon="shield" label="Risk Score" value={fin.risk_score || 0} color={fin.risk_score > 50 ? colors.danger : colors.success} />
        <KPICard icon="percent" label="Refund Rate" value={`${(fin.refund_rate || 0).toFixed(1)}%`} color={colors.warning} />
      </View>

      {/* Payment Methods */}
      {(fin.payments || []).length > 0 && (
        <>
          <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md }}>
            Payment Methods
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xxl }}>
            {fin.payments.map((p: any, i: number) => (
              <Card key={i} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, textTransform: 'capitalize' }}>{p.method}</Text>
                <Text style={{ fontSize: fontSize.lg, fontWeight: '700', color: colors.success, marginTop: 4 }}>${(p.total || 0).toFixed(0)}</Text>
                <Text style={{ fontSize: 9, color: colors.textMuted }}>{p.count} txn</Text>
              </Card>
            ))}
          </View>
        </>
      )}

      {/* Voids Summary */}
      {fin.voids_summary && (
        <Card style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.md }}>Voids Summary</Text>
          <View style={{ flexDirection: 'row', gap: spacing.lg }}>
            <View>
              <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Count</Text>
              <Text style={{ fontSize: fontSize.lg, fontWeight: '700', color: colors.danger }}>{fin.voids_summary.count || 0}</Text>
            </View>
            <View>
              <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Amount</Text>
              <Text style={{ fontSize: fontSize.lg, fontWeight: '700', color: colors.danger }}>${(fin.voids_summary.amount || 0).toFixed(0)}</Text>
            </View>
            <View>
              <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Rate</Text>
              <Text style={{ fontSize: fontSize.lg, fontWeight: '700', color: colors.warning }}>{(fin.voids_summary.rate_pct || 0).toFixed(1)}%</Text>
            </View>
          </View>
        </Card>
      )}
    </ScrollView>
  );
}

/* ─── CUSTOMERS ─── */
function CustomersSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ownerService.getDashboard('customers').then(d => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingView />;

  const cust = data || {};

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xxl, paddingTop: spacing.md }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xxl }}>
        <KPICard icon="users" label="Total Customers" value={cust.total_customers || 0} color={colors.info} />
        <KPICard icon="user-plus" label="New This Month" value={cust.new_this_month || 0} color={colors.success} />
        <KPICard icon="repeat" label="Retention" value={`${(cust.retention_rate || 0).toFixed(0)}%`} color={colors.primary} />
        <KPICard icon="dollar-sign" label="LTV" value={`$${(cust.avg_ltv || 0).toFixed(0)}`} color={colors.warning} />
      </View>

      {/* Top Customers */}
      {(cust.top_customers || cust.segments || []).map((c: any, i: number) => (
        <Card key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.primary }}>{(c.name)?.[0] || '#'}</Text>
            </View>
            <View>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.text }}>{c.name}</Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>{c.visits || c.count || 0} visits</Text>
            </View>
          </View>
          <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.success }}>${(c.spend || c.value || 0).toFixed(0)}</Text>
        </Card>
      ))}
    </ScrollView>
  );
}

/* ─── GROWTH ─── */
function GrowthSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ownerService.getGrowth().then(d => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingView />;

  const growth = data || {};

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xxl, paddingTop: spacing.md }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xxl }}>
        <KPICard icon="zap" label="Growth Rate" value={`${(growth.growth_rate || 0).toFixed(1)}%`} color={colors.success} />
        <KPICard icon="gift" label="Loyalty Members" value={growth.loyalty_members || 0} color={colors.primary} />
        <KPICard icon="send" label="Campaigns" value={growth.active_campaigns || 0} color={colors.info} />
        <KPICard icon="target" label="Conversion" value={`${(growth.conversion_rate || 0).toFixed(1)}%`} color={colors.warning} />
      </View>

      {/* Campaigns */}
      {(growth.campaigns || []).map((c: any, i: number) => (
        <Card key={i} style={{ marginBottom: spacing.sm }}>
          <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text }}>{c.name}</Text>
          <View style={{ flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm }}>
            <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>Sent: {c.sent || 0}</Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.success }}>Conv: {c.conversions || 0}</Text>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

/* ─── INSIGHTS ─── */
function InsightsSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ownerService.getInsights().then(d => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingView />;

  const insights = data?.insights || data?.actions || data || [];
  const list = Array.isArray(insights) ? insights : [];

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xxl, paddingTop: spacing.md }}>
      {list.length === 0 && (
        <Card style={{ alignItems: 'center' }}>
          <Feather name="eye" size={32} color={colors.primary} />
          <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginTop: spacing.md }}>Smart Insights</Text>
          <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' }}>
            AI-powered insights will appear here as your business generates more data.
          </Text>
        </Card>
      )}
      {list.map((insight: any, i: number) => (
        <Card key={i} style={{ marginBottom: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
            <Feather name="zap" size={14} color={colors.warning} />
            <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text }}>{insight.title || `Insight ${i + 1}`}</Text>
          </View>
          <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>{insight.description || insight.message || JSON.stringify(insight)}</Text>
        </Card>
      ))}
    </ScrollView>
  );
}

/* ─── SYSTEM ─── */
function SystemSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ownerService.getSystem().then(d => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingView />;

  const sys = data || {};
  const venues = sys.venues || [];

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xxl, paddingTop: spacing.md }}>
      <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md }}>
        Venues ({venues.length})
      </Text>
      {venues.map((v: any, i: number) => (
        <Card key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.warningBg, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="map-pin" size={16} color={colors.warning} />
            </View>
            <View>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text }}>{v.name}</Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>{v.mode || v.type || 'Standard'}</Text>
            </View>
          </View>
          <View style={{
            backgroundColor: v.active !== false ? colors.successBg : colors.dangerBg,
            paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'center',
          }}>
            <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: v.active !== false ? colors.success : colors.danger }}>
              {v.active !== false ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </Card>
      ))}

      {/* Modules */}
      {(sys.modules || []).map((m: any, i: number) => (
        <View key={i} style={{
          flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md,
          borderBottomWidth: 1, borderBottomColor: colors.border + '30',
        }}>
          <Text style={{ fontSize: fontSize.sm, color: colors.text }}>{m.name || m.key}</Text>
          <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: m.enabled ? colors.success : colors.textMuted }}>
            {m.enabled ? 'Enabled' : 'Disabled'}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

/* ─── Shared Components ─── */
function KPICard({ icon, label, value, color }: { icon: string; label: string; value: any; color: string }) {
  return (
    <View style={{
      width: '48%', backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md,
      borderWidth: 1, borderColor: colors.border,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
        <Feather name={icon as any} size={14} color={color} />
        <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>{label}</Text>
      </View>
      <Text style={{ fontSize: fontSize.xl, fontWeight: '700', color }}>{value}</Text>
    </View>
  );
}

function LoadingView() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxxl }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
