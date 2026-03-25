/**
 * Tables Home — redesigned with spec-quality mobile styling.
 * Grid of tables with status, capacity, server info.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, fontSize, radius } from '../../theme/themes';
import TopNavbar from '../../components/TopNavbar';
import { useVenue } from '../../hooks/useVenue';
import { EmptyState, ErrorState, SkeletonList } from '../../components/ProductionUI';
import * as tableService from '../../services/tableService';
import type { Table } from '../../services/tableService';

export default function TablesHomeScreen() {
  const nav = useNavigation<any>();
  const { colors } = useTheme();
  const { venueId, selectedVenue } = useVenue();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const numColumns = width > 768 ? 3 : 2;

  const statusMap = (status: string) => {
    switch (status) {
      case 'available': return { bg: colors.successBg, border: colors.success, text: colors.success, icon: 'check-circle' };
      case 'occupied': return { bg: colors.primaryBg, border: colors.primary, text: colors.primary, icon: 'users' };
      case 'reserved': return { bg: colors.warningBg, border: colors.warning, text: colors.warning, icon: 'clock' };
      case 'closed': return { bg: colors.destructiveBg, border: colors.destructive, text: colors.destructive, icon: 'x-circle' };
      default: return { bg: colors.successBg, border: colors.success, text: colors.success, icon: 'check-circle' };
    }
  };

  const load = useCallback(async () => {
    if (!venueId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await tableService.listTables(venueId);
      setTables(data.tables || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load tables');
      setTables([]);
    }
    setLoading(false);
  }, [venueId]);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? tables : tables.filter(t => t.status === filter);
  const counts = {
    all: tables.length,
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
  };

  const renderTable = ({ item }: { item: Table }) => {
    const s = statusMap(item.status);
    const tableNum = item.table_number || item.number || item.name || '?';
    const tabTotal = item.session_total || item.current_tab_total || 0;
    return (
      <TouchableOpacity
        onPress={() => {
          if (item.status === 'occupied' && item.session_id) {
            // Occupied table → go directly to Menu with table context
            nav.navigate('Tabs', {
              screen: 'TabsMain',
              params: {
                activeSessionId: item.session_id,
                activeGuestName: item.session_guest || `Table #${tableNum}`,
                activeTabNumber: item.tab_number || tableNum,
              },
            });
          } else {
            nav.navigate('TableDetail', { tableId: item.id });
          }
        }}
        activeOpacity={0.7}
        style={{
          flex: 1, margin: spacing.xs, backgroundColor: colors.card,
          borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1,
          borderColor: s.border + '40', minHeight: 130,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: fontSize.xl, fontWeight: '800', color: colors.foreground }}>
            #{tableNum}
          </Text>
          <Feather name={s.icon as any} size={16} color={s.text} />
        </View>
        <View style={{ marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, backgroundColor: s.bg }}>
            <Text style={{ fontSize: fontSize.tiny, fontWeight: '600', color: s.text, textTransform: 'capitalize' }}>
              {item.status}
            </Text>
          </View>
        </View>
        {item.server_name && (
          <View style={{ marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Feather name="user" size={12} color={colors.mutedForeground} />
            <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground }}>{item.server_name}</Text>
          </View>
        )}
        <View style={{ marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Feather name="users" size={12} color={colors.mutedForeground} />
            <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground }}>{item.guest_count || 0}/{item.capacity}</Text>
          </View>
          {tabTotal > 0 && (
            <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.success, fontVariant: ['tabular-nums'] }}>
              ${tabTotal.toFixed(2)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} data-testid="tables-screen">
      {/* Top Navbar */}
      <TopNavbar
        title="Tables"
        rightContent={
          <View style={{ backgroundColor: colors.successBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full }}>
            <Text style={{ fontSize: fontSize.tiny, fontWeight: '600', color: colors.success }}>{counts.available} open</Text>
          </View>
        }
      />

      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm }}>
        {/* Filters */}
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {(['all', 'available', 'occupied', 'reserved'] as const).map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={{
                paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full,
                backgroundColor: filter === f ? colors.primary : colors.card,
                borderWidth: 1, borderColor: filter === f ? colors.primary : colors.border + '80',
              }}
            >
              <Text style={{
                fontSize: fontSize.xs, fontWeight: '600',
                color: filter === f ? colors.primaryForeground : colors.mutedForeground, textTransform: 'capitalize',
              }}>
                {f} {f === 'all' ? `(${counts.all})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        renderItem={renderTable}
        keyExtractor={item => item.id}
        numColumns={numColumns}
        key={numColumns}
        contentContainerStyle={{ padding: spacing.sm, paddingBottom: insets.bottom + 96 }}
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        ListEmptyComponent={
          error ? (
            <ErrorState message={error} onRetry={load} />
          ) : loading ? null : (
            <EmptyState icon="grid" title="No Tables" message="Tables will appear here once configured." />
          )
        }
      />
    </View>
  );
}
