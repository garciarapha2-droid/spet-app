/**
 * Pulse Home — tab management dashboard.
 * Shows stats, lists open tabs.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../../theme/colors';
import { StatCard, Card, SectionHeader } from '../../components/ui';
import { useVenue } from '../../hooks/useVenue';
import { useWebSocket } from '../../hooks/useWebSocket';
import * as tapService from '../../services/tapService';

export default function PulseHomeScreen() {
  const navigation = useNavigation<any>();
  const { venueId, selectedVenue } = useVenue();
  const [stats, setStats] = useState<tapService.TapStats | null>(null);
  const [tabs, setTabs] = useState<tapService.TabSession[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!venueId) return;
    try {
      const [statsData, tabsData] = await Promise.all([
        tapService.getTapStats(venueId),
        tapService.getOpenTabs(venueId),
      ]);
      setStats(statsData);
      setTabs(tabsData.sessions || []);
    } catch {
      // silent
    }
  }, [venueId]);

  // Load on focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  // WebSocket for real-time
  useWebSocket(venueId, useCallback((event: any) => {
    if (event.type === 'tab_updated' || event.type === 'tab_closed' || event.type === 'guest_entered') {
      loadData();
    }
  }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={tabs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xxl }}>
              <View>
                <Text style={{ fontSize: fontSize.title, fontWeight: '700', color: colors.text }}>
                  Tabs
                </Text>
                <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs }}>
                  {selectedVenue?.name}
                </Text>
              </View>
            </View>

            {/* Quick Nav */}
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xxl }}>
              {[
                { screen: 'PulseInside', icon: 'users', label: 'Inside' },
                { screen: 'PulseExit', icon: 'log-out', label: 'Exits' },
                { screen: 'PulseBar', icon: 'search', label: 'Bar' },
                { screen: 'PulseRewards', icon: 'gift', label: 'Rewards' },
              ].map(item => (
                <TouchableOpacity
                  key={item.screen}
                  onPress={() => navigation.navigate(item.screen)}
                  activeOpacity={0.7}
                  style={{
                    flex: 1, alignItems: 'center', paddingVertical: spacing.md,
                    backgroundColor: colors.bgCard, borderRadius: radius.md,
                    borderWidth: 1, borderColor: colors.border,
                  }}
                >
                  <Feather name={item.icon as any} size={16} color={colors.primary} />
                  <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 4 }}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Stats Row */}
            {stats && (
              <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xxl }}>
                <StatCard label="Open" value={stats.open_tabs} color={colors.info} />
                <StatCard label="Running" value={`$${stats.running_total.toFixed(0)}`} color={colors.primary} />
                <StatCard label="Revenue" value={`$${stats.revenue_today.toFixed(0)}`} color={colors.success} />
              </View>
            )}

            {/* Section label */}
            <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md }}>
              Open Tabs ({tabs.length})
            </Text>
          </>
        }
        renderItem={({ item }) => {
          const meta = item.meta || {};
          const tabNum = meta.tab_number || item.tab_number;
          return (
            <TouchableOpacity
              onPress={() => navigation.navigate('TabDetail', { session: item })}
              activeOpacity={0.7}
              style={{ marginBottom: spacing.sm }}
            >
              <Card style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.text }}>
                    {item.guest_name || `Tab ${tabNum || '?'}`}
                  </Text>
                  {tabNum && (
                    <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 }}>
                      Tab #{tabNum}
                    </Text>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: fontSize.xl, fontWeight: '700', color: colors.primary, fontVariant: ['tabular-nums'] }}>
                    ${Number(item.total).toFixed(2)}
                  </Text>
                  <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 }}>
                    {item.items_count || 0} items
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Text style={{ fontSize: fontSize.md, color: colors.textSecondary }}>No open tabs</Text>
          </View>
        }
      />
    </View>
  );
}
