/**
 * Tables Home — grid of tables with status, capacity, server info.
 * Mirrors web's table management view.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../../theme/colors';
import { useVenue } from '../../hooks/useVenue';
import { EmptyState, ErrorState, SkeletonList } from '../../components/ProductionUI';
import * as tableService from '../../services/tableService';
import type { Table } from '../../services/tableService';

const statusColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  available: { bg: colors.successBg, border: colors.success, text: colors.success, icon: 'check-circle' },
  occupied: { bg: colors.primaryBg, border: colors.primary, text: colors.primary, icon: 'users' },
  reserved: { bg: colors.warningBg, border: colors.warning, text: colors.warning, icon: 'clock' },
  closed: { bg: colors.dangerBg, border: colors.danger, text: colors.danger, icon: 'x-circle' },
};

export default function TablesHomeScreen() {
  const nav = useNavigation<any>();
  const { venueId, selectedVenue } = useVenue();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const numColumns = width > 768 ? 3 : 2;

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
    const s = statusColors[item.status] || statusColors.available;
    return (
      <TouchableOpacity
        onPress={() => nav.navigate('TableDetail', { tableId: item.id })}
        activeOpacity={0.7}
        style={{
          flex: 1, margin: spacing.xs, backgroundColor: colors.bgCard,
          borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1,
          borderColor: s.border + '40', minHeight: 130,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: fontSize.xl, fontWeight: '700', color: colors.text }}>
            #{item.number || item.name}
          </Text>
          <Feather name={s.icon as any} size={16} color={s.text} />
        </View>
        <View style={{ marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: s.bg }}>
            <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: s.text, textTransform: 'capitalize' }}>
              {item.status}
            </Text>
          </View>
        </View>
        {item.server_name && (
          <View style={{ marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Feather name="user" size={12} color={colors.textMuted} />
            <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>{item.server_name}</Text>
          </View>
        )}
        <View style={{ marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Feather name="users" size={12} color={colors.textMuted} />
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>{item.guest_count || 0}/{item.capacity}</Text>
          </View>
          {item.current_tab_total != null && item.current_tab_total > 0 && (
            <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.success }}>
              ${item.current_tab_total.toFixed(2)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: spacing.xxl, paddingBottom: spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: fontSize.title, fontWeight: '700', color: colors.text }}>Tables</Text>
            <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs }}>
              {selectedVenue?.name || 'No venue'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ backgroundColor: colors.successBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: colors.success }}>{counts.available} open</Text>
            </View>
            <View style={{ backgroundColor: colors.primaryBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: colors.primary }}>{counts.occupied} busy</Text>
            </View>
          </View>
        </View>

        {/* Filters */}
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
          {(['all', 'available', 'occupied', 'reserved'] as const).map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={{
                paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                backgroundColor: filter === f ? colors.primary : colors.bgCard,
                borderWidth: 1, borderColor: filter === f ? colors.primary : colors.border,
              }}
            >
              <Text style={{
                fontSize: fontSize.xs, fontWeight: '600',
                color: filter === f ? '#FFF' : colors.textSecondary, textTransform: 'capitalize',
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
        contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + 20 }}
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        ListEmptyComponent={
          error ? (
            <ErrorState message={error} onRetry={load} />
          ) : loading ? null : (
            <EmptyState icon="grid" title="No Tables" message="Tables will appear here once configured in your venue." />
          )
        }
      />
    </View>
  );
}
