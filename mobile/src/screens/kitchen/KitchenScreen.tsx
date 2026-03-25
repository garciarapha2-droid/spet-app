/**
 * Kitchen Display Screen — KDS tickets with status management.
 * Mirrors web KitchenPage.js.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../../theme/colors';
import { useVenue } from '../../hooks/useVenue';
import { ErrorState, EmptyState } from '../../components/ProductionUI';
import * as kitchenService from '../../services/kitchenService';
import type { KitchenTicket } from '../../services/kitchenService';

const statusConfig: Record<string, { color: string; bg: string; icon: string; next: string; nextLabel: string }> = {
  pending:   { color: colors.warning, bg: colors.warningBg, icon: 'clock', next: 'preparing', nextLabel: 'Start' },
  preparing: { color: colors.info, bg: colors.infoBg, icon: 'loader', next: 'ready', nextLabel: 'Ready' },
  ready:     { color: colors.success, bg: colors.successBg, icon: 'check-circle', next: 'delivered', nextLabel: 'Deliver' },
  delivered: { color: colors.textMuted, bg: colors.bgCard, icon: 'check', next: '', nextLabel: '' },
};

export default function KitchenScreen() {
  const { venueId } = useVenue();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [tickets, setTickets] = useState<KitchenTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('active');

  const numColumns = width > 768 ? 3 : width > 500 ? 2 : 1;

  const load = useCallback(async () => {
    if (!venueId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await kitchenService.getTickets(venueId);
      setTickets(data.tickets || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load tickets');
      setTickets([]);
    }
    setLoading(false);
  }, [venueId]);

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);

  const filtered = filter === 'active'
    ? tickets.filter(t => t.status !== 'delivered')
    : tickets.filter(t => t.status === filter);

  const handleAdvance = async (ticket: KitchenTicket) => {
    const cfg = statusConfig[ticket.status];
    if (!cfg?.next) return;
    try {
      await kitchenService.updateTicketStatus(ticket.id, cfg.next);
      load();
    } catch (e: any) {
      // Silently refresh to sync state
      load();
    }
  };

  const renderTicket = ({ item }: { item: KitchenTicket }) => {
    const cfg = statusConfig[item.status] || statusConfig.pending;
    const elapsed = Math.floor((Date.now() - new Date(item.created_at).getTime()) / 60000);
    return (
      <View style={{
        flex: 1, margin: spacing.xs, backgroundColor: colors.bgCard,
        borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
        borderLeftWidth: 4, borderLeftColor: cfg.color, overflow: 'hidden',
      }}>
        <View style={{ padding: spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              {item.table_number != null && (
                <View style={{ backgroundColor: cfg.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: cfg.color }}>T{item.table_number}</Text>
                </View>
              )}
              {item.guest_name && (
                <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.textSecondary }} numberOfLines={1}>
                  {item.guest_name}
                </Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Feather name="clock" size={10} color={elapsed > 15 ? colors.danger : colors.textMuted} />
              <Text style={{ fontSize: fontSize.xs, color: elapsed > 15 ? colors.danger : colors.textMuted, fontWeight: '600' }}>
                {elapsed}m
              </Text>
            </View>
          </View>

          <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
            {item.items.map(i => (
              <View key={i.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
                <View style={{ backgroundColor: colors.primary, width: 20, height: 20, borderRadius: 4, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFF' }}>{i.quantity}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.text }}>{i.name}</Text>
                  {i.notes && <Text style={{ fontSize: fontSize.xs, color: colors.warning, marginTop: 1 }}>{i.notes}</Text>}
                  {i.modifiers?.length ? (
                    <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 }}>
                      {i.modifiers.join(', ')}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </View>

        {cfg.next && (
          <TouchableOpacity
            onPress={() => handleAdvance(item)}
            style={{ backgroundColor: cfg.color, paddingVertical: 10, alignItems: 'center' }}
          >
            <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: '#FFF' }}>{cfg.nextLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: spacing.xxl, paddingBottom: spacing.md }}>
        <Text style={{ fontSize: fontSize.title, fontWeight: '700', color: colors.text }}>Kitchen</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
          {['active', 'pending', 'preparing', 'ready'].map(f => (
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
                fontSize: fontSize.xs, fontWeight: '600', textTransform: 'capitalize',
                color: filter === f ? '#FFF' : colors.textSecondary,
              }}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        renderItem={renderTicket}
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
            <EmptyState icon="check-circle" title="All Caught Up!" message="No active tickets right now." />
          )
        }
      />
    </View>
  );
}
