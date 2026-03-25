/**
 * Pulse Inside — shows guests currently inside the venue.
 * Mirrors web PulseInsidePage.js.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../../theme/colors';
import { useVenue } from '../../hooks/useVenue';
import { Card } from '../../components/ui';
import { api } from '../../services/api';

export default function PulseInsideScreen() {
  const { venueId } = useVenue();
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!venueId) return;
    try {
      const data = await api.get(`/pulse/inside?venue_id=${venueId}`);
      setGuests(data.guests || data || []);
    } catch { setGuests([]); }
    setLoading(false);
  }, [venueId]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={guests}
        keyExtractor={(item, i) => item.id || String(i)}
        contentContainerStyle={{ padding: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.xxl }}>
            <Text style={{ fontSize: fontSize.title, fontWeight: '700', color: colors.text }}>Inside</Text>
            <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs }}>
              {guests.length} guests currently inside
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.primary }}>{(item.name)?.[0] || '?'}</Text>
              </View>
              <View>
                <Text style={{ fontSize: fontSize.md, fontWeight: '500', color: colors.text }}>{item.name || 'Guest'}</Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>
                  {item.entry_type || 'Standard'} {item.entered_at ? `- ${new Date(item.entered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              {item.tags?.includes('vip') && (
                <View style={{ backgroundColor: colors.warningBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: colors.warning }}>VIP</Text>
                </View>
              )}
              {item.wristband_blocked && (
                <View style={{ backgroundColor: colors.dangerBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: colors.danger }}>BLOCKED</Text>
                </View>
              )}
              {item.tab_status === 'open' && (
                <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.success }}>${(item.tab_total || 0).toFixed(0)}</Text>
              )}
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Feather name="users" size={40} color={colors.textMuted} />
            <Text style={{ fontSize: fontSize.md, color: colors.textMuted, marginTop: spacing.md }}>No guests inside</Text>
          </View>
        }
      />
    </View>
  );
}
