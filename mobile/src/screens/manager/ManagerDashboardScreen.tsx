/**
 * Manager Dashboard — Production-ready.
 * Features: SafeArea, pull-to-refresh, error states, skeleton loading, accessibility.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../../theme/colors';
import { useVenue } from '../../hooks/useVenue';
import { Card } from '../../components/ui';
import {
  ScreenWrapper, ScreenHeader, ErrorState, EmptyState,
  SkeletonDashboard, SkeletonList, HorizontalTabBar, useAsyncData,
} from '../../components/ProductionUI';
import * as managerService from '../../services/managerService';

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'activity' },
  { key: 'staff', label: 'Staff', icon: 'users' },
  { key: 'menu', label: 'Menu', icon: 'coffee' },
  { key: 'shifts', label: 'Shifts', icon: 'clock' },
  { key: 'tips', label: 'Tips', icon: 'dollar-sign' },
  { key: 'guests', label: 'Guests', icon: 'user' },
  { key: 'reports', label: 'Reports', icon: 'bar-chart-2' },
  { key: 'loyalty', label: 'Loyalty', icon: 'gift' },
];

export default function ManagerDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { venueId, selectedVenue } = useVenue();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Safe Area Header */}
      <View style={{ paddingTop: Platform.OS === 'ios' ? 0 : insets.top }}>
        <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.md, paddingBottom: spacing.md }}>
          <Text
            style={{ fontSize: fontSize.title, fontWeight: '700', color: colors.text }}
            accessibilityRole="header"
          >
            Manager
          </Text>
          <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs }}>
            {selectedVenue?.name || 'Dashboard'}
          </Text>
        </View>
        <HorizontalTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      </View>

      {activeTab === 'overview' && <OverviewSection venueId={venueId} />}
      {activeTab === 'staff' && <StaffSection venueId={venueId} />}
      {activeTab === 'menu' && <MenuSection venueId={venueId} />}
      {activeTab === 'shifts' && <ShiftsSection venueId={venueId} />}
      {activeTab === 'tips' && <TipsSection venueId={venueId} />}
      {activeTab === 'guests' && <GuestsSection venueId={venueId} />}
      {activeTab === 'reports' && <ReportsSection venueId={venueId} />}
      {activeTab === 'loyalty' && <LoyaltySection venueId={venueId} />}
    </View>
  );
}

/* ─── KPI Card ─── */
function KPICard({ icon, label, value, color }: { icon: string; label: string; value: any; color: string }) {
  return (
    <View style={{
      width: '48%', backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md,
      borderWidth: 1, borderColor: colors.border,
    }}
      accessibilityLabel={`${label}: ${value}`}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
        <Feather name={icon as any} size={14} color={color} />
        <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>{label}</Text>
      </View>
      <Text style={{ fontSize: fontSize.xl, fontWeight: '700', color, fontVariant: ['tabular-nums'] }}>{value}</Text>
    </View>
  );
}

/* ─── OVERVIEW ─── */
function OverviewSection({ venueId }: { venueId: string }) {
  const { data, loading, error, refresh } = useAsyncData(
    () => managerService.getOverview(venueId),
    [venueId],
  );

  if (loading) return <SkeletonDashboard />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};
  const alerts = data?.alerts || [];

  return (
    <ScreenWrapper onRefresh={refresh} padTop={false}>
      {/* KPI Grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xxl }}>
        <KPICard icon="dollar-sign" label="Revenue Today" value={`$${(kpis.revenue_today || 0).toFixed(0)}`} color={colors.success} />
        <KPICard icon="dollar-sign" label="Revenue Week" value={`$${(kpis.revenue_week || 0).toFixed(0)}`} color="#10B981" />
        <KPICard icon="trending-up" label="Avg Ticket" value={`$${(kpis.avg_ticket || 0).toFixed(2)}`} color={colors.info} />
        <KPICard icon="users" label="Guests" value={kpis.unique_guests || 0} color={colors.primary} />
        <KPICard icon="file-text" label="Open Tabs" value={kpis.open_tabs || 0} color={colors.warning} />
        <KPICard icon="check" label="Closed" value={kpis.closed_today || 0} color={colors.textSecondary} />
      </View>

      {/* Revenue by Hour */}
      {charts.revenue_by_hour?.length > 0 && (
        <Card style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.md }}>Revenue by Hour</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 2 }}>
            {charts.revenue_by_hour.map((h: any, i: number) => {
              const max = Math.max(...charts.revenue_by_hour.map((x: any) => x.total || 0), 1);
              return (
                <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                  <View style={{ width: '80%', backgroundColor: colors.success + '80', borderTopLeftRadius: 3, borderTopRightRadius: 3, height: ((h.total || 0) / max) * 80 }} />
                  <Text style={{ fontSize: 8, color: colors.textMuted, marginTop: 2 }}>{h.hour}h</Text>
                </View>
              );
            })}
          </View>
        </Card>
      )}

      {/* Top Items */}
      {charts.top_items?.length > 0 && (
        <Card style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.md }}>Top Items</Text>
          {charts.top_items.slice(0, 10).map((item: any, i: number) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs }}>
              <Text style={{ fontSize: fontSize.sm, color: colors.text }}>{i + 1}. {item.name}</Text>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.primary }}>${(item.revenue || 0).toFixed(0)} ({item.qty}x)</Text>
            </View>
          ))}
        </Card>
      )}

      {/* Guest Funnel */}
      {charts.guest_funnel && (
        <Card style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.md }}>Guest Funnel</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {[
              { label: 'Entries', val: charts.guest_funnel.entries },
              { label: 'Allowed', val: charts.guest_funnel.allowed },
              { label: 'Tabs Open', val: charts.guest_funnel.tabs_opened },
              { label: 'Closed', val: charts.guest_funnel.tabs_closed },
            ].map((step, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center', backgroundColor: colors.bgElevated, borderRadius: radius.sm, padding: spacing.sm }}>
                <Text style={{ fontSize: fontSize.xl, fontWeight: '700', color: colors.text }}>{step.val || 0}</Text>
                <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 2 }}>{step.label}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Alerts */}
      {alerts.map((a: any, i: number) => (
        <View key={i} style={{
          flexDirection: 'row', alignItems: 'center', gap: spacing.md,
          backgroundColor: a.type === 'warning' ? colors.warningBg : colors.infoBg,
          borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
          borderWidth: 1, borderColor: (a.type === 'warning' ? colors.warning : colors.info) + '30',
        }}>
          <Feather name="alert-triangle" size={16} color={a.type === 'warning' ? colors.warning : colors.info} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text }}>{a.title}</Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>{a.message}</Text>
          </View>
        </View>
      ))}
    </ScreenWrapper>
  );
}

/* ─── STAFF ─── */
function StaffSection({ venueId }: { venueId: string }) {
  const { data, loading, error, refresh } = useAsyncData(
    () => managerService.getStaff(venueId),
    [venueId],
  );

  if (loading) return <SkeletonList count={6} />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const staffList = data?.staff || [];

  if (staffList.length === 0) {
    return <EmptyState icon="users" title="No Staff" message="No staff members have been added to this venue yet." />;
  }

  return (
    <ScreenWrapper onRefresh={refresh} padTop={false}>
      <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md }}>
        Staff ({staffList.length})
      </Text>
      {staffList.map((s: any) => (
        <Card key={s.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.primary }}>
                {(s.email || '?')[0].toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.text }}>{s.email}</Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>{s.role}</Text>
            </View>
          </View>
          <View style={{
            backgroundColor: s.status === 'active' ? colors.successBg : colors.dangerBg,
            paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
          }}>
            <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: s.status === 'active' ? colors.success : colors.danger }}>
              {s.status}
            </Text>
          </View>
        </Card>
      ))}
    </ScreenWrapper>
  );
}

/* ─── MENU ─── */
function MenuSection({ venueId }: { venueId: string }) {
  const [search, setSearch] = useState('');
  const { data, loading, error, refresh } = useAsyncData(
    async () => {
      const tapMod = await import('../../services/tapService');
      return tapMod.getCatalog(venueId);
    },
    [venueId],
  );

  if (loading) return <SkeletonList count={8} />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const items = data?.items || [];
  const filtered = items.filter((i: any) => !search || i.name?.toLowerCase().includes(search.toLowerCase()));
  const categories = [...new Set(items.map((i: any) => i.category))] as string[];

  if (items.length === 0) {
    return <EmptyState icon="coffee" title="No Menu Items" message="The menu catalog is empty. Add items from the web dashboard." />;
  }

  return (
    <ScreenWrapper onRefresh={refresh} padTop={false}>
      <TextInput
        placeholder="Search menu..."
        placeholderTextColor={colors.textPlaceholder}
        value={search}
        onChangeText={setSearch}
        returnKeyType="search"
        accessibilityLabel="Search menu items"
        style={{
          backgroundColor: colors.bgInput, borderRadius: radius.md, padding: spacing.md,
          color: colors.text, fontSize: fontSize.sm, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg,
        }}
      />
      <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: spacing.md }}>
        {items.length} items across {categories.length} categories
      </Text>
      {categories.map(cat => {
        const catItems = filtered.filter((i: any) => i.category === cat);
        if (catItems.length === 0) return null;
        return (
          <View key={cat} style={{ marginBottom: spacing.xxl }}>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm }}>
              {cat} ({catItems.length})
            </Text>
            {catItems.map((item: any) => (
              <View key={item.id} style={{
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border + '40',
              }}>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.text, flex: 1 }}>{item.name}</Text>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.primary }}>${(item.price || 0).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        );
      })}
    </ScreenWrapper>
  );
}

/* ─── SHIFTS ─── */
function ShiftsSection({ venueId }: { venueId: string }) {
  const { data, loading, error, refresh } = useAsyncData(
    () => managerService.getShifts(venueId),
    [venueId],
  );

  if (loading) return <SkeletonList count={4} />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const shifts = data?.shifts || [];

  if (shifts.length === 0) {
    return <EmptyState icon="clock" title="No Shifts" message="No shifts have been closed yet." />;
  }

  return (
    <ScreenWrapper onRefresh={refresh} padTop={false}>
      <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md }}>
        Shift History ({shifts.length})
      </Text>
      {shifts.map((s: any) => (
        <Card key={s.id} style={{ marginBottom: spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.text }}>{s.shift_name}</Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>
              {s.created_at ? new Date(s.created_at).toLocaleDateString() : ''}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.lg }}>
            <View>
              <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Revenue</Text>
              <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.success }}>${(s.revenue || 0).toFixed(0)}</Text>
            </View>
            <View>
              <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Tabs</Text>
              <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.text }}>{s.tabs_closed || 0}</Text>
            </View>
            <View>
              <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>Voids</Text>
              <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.danger }}>{s.voids || 0}</Text>
            </View>
          </View>
        </Card>
      ))}
    </ScreenWrapper>
  );
}

/* ─── TIPS ─── */
function TipsSection({ venueId }: { venueId: string }) {
  const { data, loading, error, refresh } = useAsyncData(
    () => managerService.getTipsDetail(venueId),
    [venueId],
  );

  if (loading) return <SkeletonList count={5} />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const tips = data?.tips || data?.staff_tips || [];
  const total = data?.total_tips || tips.reduce((s: number, t: any) => s + (t.tips || t.total || 0), 0);

  if (tips.length === 0) {
    return <EmptyState icon="dollar-sign" title="No Tips Data" message="Tips information will appear here after transactions are processed." />;
  }

  return (
    <ScreenWrapper onRefresh={refresh} padTop={false}>
      <Card style={{ alignItems: 'center', marginBottom: spacing.xxl }}>
        <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, textTransform: 'uppercase' }}>Total Tips</Text>
        <Text style={{ fontSize: 32, fontWeight: '700', color: colors.success, marginTop: spacing.xs, fontVariant: ['tabular-nums'] }}>
          ${total.toFixed(2)}
        </Text>
      </Card>
      {tips.map((t: any, i: number) => (
        <View key={i} style={{
          flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border + '40',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.infoBg, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.info }}>
                {(t.name || t.staff_name)?.[0] || '?'}
              </Text>
            </View>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.text }}>{t.name || t.staff_name}</Text>
          </View>
          <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.success, fontVariant: ['tabular-nums'] }}>
            ${(t.tips || t.total || 0).toFixed(2)}
          </Text>
        </View>
      ))}
    </ScreenWrapper>
  );
}

/* ─── GUESTS ─── */
function GuestsSection({ venueId }: { venueId: string }) {
  const [search, setSearch] = useState('');
  const { data, loading, error, refresh } = useAsyncData(
    () => managerService.getGuests(venueId),
    [venueId],
  );

  if (loading) return <SkeletonList count={6} />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const guests = data?.guests || [];
  const total = data?.total || guests.length;
  const filtered = guests.filter((g: any) => !search || g.name?.toLowerCase().includes(search.toLowerCase()));

  if (guests.length === 0) {
    return <EmptyState icon="user" title="No Guests" message="Guest data will appear after check-ins." />;
  }

  return (
    <ScreenWrapper onRefresh={refresh} padTop={false}>
      <TextInput
        placeholder="Search guests..."
        placeholderTextColor={colors.textPlaceholder}
        value={search}
        onChangeText={setSearch}
        returnKeyType="search"
        accessibilityLabel="Search guests"
        style={{
          backgroundColor: colors.bgInput, borderRadius: radius.md, padding: spacing.md,
          color: colors.text, fontSize: fontSize.sm, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg,
        }}
      />
      <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: spacing.md }}>{total} guests total</Text>
      {filtered.map((g: any, idx: number) => (
        <View key={g.id || idx} style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border + '40',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.primary }}>{g.name?.[0] || '?'}</Text>
            </View>
            <View>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.text }}>{g.name}</Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>{g.visits || 0} visits</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            {g.tags?.includes('vip') && (
              <View style={{ backgroundColor: colors.warningBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: colors.warning }}>VIP</Text>
              </View>
            )}
            <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.success, fontVariant: ['tabular-nums'] }}>
              ${(g.spend_total || 0).toFixed(0)}
            </Text>
          </View>
        </View>
      ))}
    </ScreenWrapper>
  );
}

/* ─── REPORTS ─── */
function ReportsSection({ venueId }: { venueId: string }) {
  const { data, loading, error, refresh } = useAsyncData(
    () => managerService.getReports(venueId),
    [venueId],
  );

  if (loading) return <SkeletonDashboard />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const report = data || {};
  const hasData = (report.by_item?.length > 0) || (report.by_method?.length > 0);

  if (!hasData) {
    return <EmptyState icon="bar-chart-2" title="No Sales Data" message="Sales data will appear here after orders are processed." />;
  }

  return (
    <ScreenWrapper onRefresh={refresh} padTop={false}>
      {report.by_method?.length > 0 && (
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xxl }}>
          {report.by_method.map((m: any) => (
            <Card key={m.method} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, textTransform: 'capitalize' }}>{m.method}</Text>
              <Text style={{ fontSize: fontSize.lg, fontWeight: '700', color: colors.success, marginTop: 4, fontVariant: ['tabular-nums'] }}>
                ${(m.total || 0).toFixed(0)}
              </Text>
              <Text style={{ fontSize: 9, color: colors.textMuted }}>{m.count} txn</Text>
            </Card>
          ))}
        </View>
      )}
      {report.by_item?.length > 0 && (
        <>
          <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md }}>
            Items Sold
          </Text>
          {report.by_item.slice(0, 15).map((item: any, i: number) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border + '30' }}>
              <Text style={{ fontSize: fontSize.sm, color: colors.text, flex: 1 }}>{i + 1}. {item.name} (x{item.qty})</Text>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.primary, fontVariant: ['tabular-nums'] }}>
                ${(item.revenue || 0).toFixed(0)}
              </Text>
            </View>
          ))}
        </>
      )}
    </ScreenWrapper>
  );
}

/* ─── LOYALTY ─── */
function LoyaltySection({ venueId }: { venueId: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <EmptyState
        icon="gift"
        title="Loyalty Program"
        message="Configure rewards, tiers, and points from the Manager dashboard on web."
      />
    </View>
  );
}
