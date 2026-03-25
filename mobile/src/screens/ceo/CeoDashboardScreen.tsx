/**
 * CEO Dashboard — mirrors web CEO pages.
 * Sections: Overview, Revenue, Pipeline, Users, Security, Reports.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../../theme/colors';
import { Card } from '../../components/ui';
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
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl, paddingBottom: spacing.md }}>
        <Text style={{ fontSize: fontSize.title, fontWeight: '700', color: colors.text }}>CEO</Text>
        <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs }}>Operating System</Text>
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
              backgroundColor: activeTab === tab.key ? '#8B5CF6' : colors.bgCard,
              borderWidth: 1, borderColor: activeTab === tab.key ? '#8B5CF6' : colors.border,
            }}
          >
            <Feather name={tab.icon as any} size={14} color={activeTab === tab.key ? '#FFF' : colors.textSecondary} />
            <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: activeTab === tab.key ? '#FFF' : colors.textSecondary }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {activeTab === 'overview' && <CeoOverviewSection />}
      {activeTab === 'revenue' && <CeoRevenueSection />}
      {activeTab === 'pipeline' && <CeoPipelineSection />}
      {activeTab === 'users' && <CeoUsersSection />}
      {activeTab === 'security' && <CeoSecuritySection />}
      {activeTab === 'reports' && <CeoReportsSection />}
    </View>
  );
}

/* ─── OVERVIEW ─── */
function CeoOverviewSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ceoService.getHealth().then(d => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingView />;

  const kpis = data?.kpis || {};

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xxl, paddingTop: spacing.md }}>
      {/* Health Status */}
      <Card style={{ marginBottom: spacing.xxl, alignItems: 'center' }}>
        <View style={{
          width: 48, height: 48, borderRadius: 24,
          backgroundColor: colors.successBg,
          alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
        }}>
          <Feather name="check-circle" size={24} color={colors.success} />
        </View>
        <Text style={{ fontSize: fontSize.lg, fontWeight: '700', color: colors.text }}>
          System Healthy
        </Text>
      </Card>

      {/* KPIs */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xxl }}>
        <KPICard icon="dollar-sign" label="MRR" value={`$${(kpis.mrr || 0).toFixed(0)}`} color={colors.success} />
        <KPICard icon="users" label="Active Companies" value={kpis.active_companies || 0} color={colors.info} />
        <KPICard icon="trending-up" label="Growth" value={`${(kpis.growth_pct || 0).toFixed(1)}%`} color={colors.primary} />
        <KPICard icon="activity" label="Active Venues" value={kpis.active_venues || 0} color={colors.warning} />
        <KPICard icon="dollar-sign" label="Revenue YTD" value={`$${(kpis.revenue_ytd || 0).toFixed(0)}`} color="#10B981" />
        <KPICard icon="percent" label="Activation" value={`${(kpis.activation_rate || 0).toFixed(1)}%`} color={colors.primaryLight} />
      </View>
    </ScrollView>
  );
}

/* ─── REVENUE ─── */
function CeoRevenueSection() {
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    ceoService.getRevenue(period).then(d => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, [period]);

  if (loading) return <LoadingView />;

  const chart = data?.chart || [];
  const totalRevenue = chart.reduce((s: number, c: any) => s + (c.revenue || 0), 0);
  const totalProfit = chart.reduce((s: number, c: any) => s + (c.profit || 0), 0);

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xxl, paddingTop: spacing.md }}>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xxl }}>
        {['week', 'month', 'quarter', 'year'].map(p => (
          <TouchableOpacity key={p} onPress={() => setPeriod(p)}
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
          <Text style={{ fontSize: fontSize.xl, fontWeight: '700', color: colors.success, marginTop: 4 }}>${totalRevenue.toFixed(0)}</Text>
        </Card>
        <Card style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>Profit</Text>
          <Text style={{ fontSize: fontSize.xl, fontWeight: '700', color: colors.primary, marginTop: 4 }}>${totalProfit.toFixed(0)}</Text>
        </Card>
      </View>

      {/* Revenue Chart (bar) */}
      {chart.length > 0 && (
        <Card style={{ marginBottom: spacing.xxl }}>
          <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.md }}>Daily Revenue</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 2 }}>
            {chart.slice(-14).map((d: any, i: number) => {
              const max = Math.max(...chart.map((x: any) => x.revenue || 0), 1);
              const day = d.period ? new Date(d.period).getDate() : '';
              return (
                <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                  <View style={{ width: '80%', backgroundColor: '#8B5CF6' + '80', borderTopLeftRadius: 3, borderTopRightRadius: 3, height: ((d.revenue || 0) / max) * 100 }} />
                  <Text style={{ fontSize: 7, color: colors.textMuted, marginTop: 2 }}>{day}</Text>
                </View>
              );
            })}
          </View>
        </Card>
      )}

      {/* Daily Breakdown */}
      {chart.slice(-7).reverse().map((d: any, i: number) => (
        <View key={i} style={{
          flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm,
          borderBottomWidth: 1, borderBottomColor: colors.border + '30',
        }}>
          <Text style={{ fontSize: fontSize.sm, color: colors.text }}>{d.period ? new Date(d.period).toLocaleDateString() : ''}</Text>
          <View style={{ flexDirection: 'row', gap: spacing.lg }}>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.success }}>${(d.revenue || 0).toFixed(0)}</Text>
            <Text style={{ fontSize: fontSize.sm, color: colors.textMuted }}>${(d.profit || 0).toFixed(0)} net</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

/* ─── PIPELINE ─── */
function CeoPipelineSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ceoService.getPipeline().then(d => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingView />;

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
    <ScrollView contentContainerStyle={{ padding: spacing.xxl, paddingTop: spacing.md }}>
      {/* Pipeline Funnel */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xxl }}>
        {stages.map((s, i) => (
          <View key={i} style={{
            width: '48%', backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.lg,
            borderWidth: 1, borderColor: colors.border, alignItems: 'center',
          }}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: s.color }}>{s.count}</Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 4 }}>{s.name}</Text>
          </View>
        ))}
      </View>

      {/* Conversion Funnel */}
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
    </ScrollView>
  );
}

/* ─── USERS ─── */
function CeoUsersSection() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ceoService.getUsers().then(d => setUsers(d.users || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingView />;

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xxl, paddingTop: spacing.md }}>
      <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md }}>
        All Users ({users.length})
      </Text>
      {users.map((u: any, i: number) => {
        const role = u.roles?.[0]?.role || 'user';
        return (
          <Card key={u.id || i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.primary }}>{(u.email || '?')[0].toUpperCase()}</Text>
              </View>
              <View>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.text }}>{u.email}</Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>{role}</Text>
              </View>
            </View>
            <View style={{
              backgroundColor: u.status === 'active' ? colors.successBg : u.status === 'pending_payment' ? colors.warningBg : colors.dangerBg,
              paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
            }}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: u.status === 'active' ? colors.success : u.status === 'pending_payment' ? colors.warning : colors.danger }}>
                {u.status}
              </Text>
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
}

/* ─── SECURITY ─── */
function CeoSecuritySection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('../services/analyticsService').then(mod => {
      mod.getSecurityAnalytics().then(d => setData(d)).catch(() => {}).finally(() => setLoading(false));
    });
  }, []);

  if (loading) return <LoadingView />;

  const sec = data || {};

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xxl, paddingTop: spacing.md }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xxl }}>
        <KPICard icon="users" label="Total Users" value={sec.total_users || 0} color={colors.info} />
        <KPICard icon="activity" label="Active Sessions" value={sec.active_sessions || 0} color={colors.success} />
        <KPICard icon="alert-triangle" label="Failed Logins (24h)" value={sec.failed_logins_24h || 0} color={colors.danger} />
        <KPICard icon="shield" label="MFA Enabled" value={`${(sec.mfa_enabled_pct || 0).toFixed(0)}%`} color={colors.primary} />
      </View>

      {sec.top_users?.map((u: any, i: number) => (
        <View key={i} style={{
          flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md,
          borderBottomWidth: 1, borderBottomColor: colors.border + '30',
        }}>
          <Text style={{ fontSize: fontSize.sm, color: colors.text }}>{u.name}</Text>
          <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>{u.logins} logins</Text>
        </View>
      ))}
    </ScrollView>
  );
}

/* ─── REPORTS ─── */
function CeoReportsSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('../services/analyticsService').then(mod => {
      mod.getReportsAnalytics().then(d => setData(d)).catch(() => {}).finally(() => setLoading(false));
    });
  }, []);

  if (loading) return <LoadingView />;

  const rep = data || {};

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xxl, paddingTop: spacing.md }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xxl }}>
        <KPICard icon="dollar-sign" label="Revenue" value={`$${(rep.total_revenue || 0).toFixed(0)}`} color={colors.success} />
        <KPICard icon="target" label="Deals" value={rep.total_deals || 0} color={colors.info} />
        <KPICard icon="percent" label="Conversion" value={`${(rep.conversion_rate || 0).toFixed(1)}%`} color={colors.primary} />
        <KPICard icon="trending-up" label="Avg Deal" value={`$${(rep.avg_deal_value || 0).toFixed(0)}`} color={colors.warning} />
      </View>

      {rep.top_products?.map((p: any, i: number) => (
        <View key={i} style={{
          flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md,
          borderBottomWidth: 1, borderBottomColor: colors.border + '30',
        }}>
          <Text style={{ fontSize: fontSize.sm, color: colors.text }}>{p.name}</Text>
          <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.success }}>${(p.revenue || 0).toFixed(0)}</Text>
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
