/**
 * Pulse Exit — register guest exits.
 * Mirrors web PulseExitPage.js.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../../theme/colors';
import { useVenue } from '../../hooks/useVenue';
import { Card } from '../../components/ui';
import { api } from '../../services/api';

export default function PulseExitScreen() {
  const { venueId } = useVenue();
  const [exits, setExits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!venueId) return;
    try {
      const data = await api.get(`/pulse/exits/today?venue_id=${venueId}`);
      setExits(data.exits || data || []);
    } catch { setExits([]); }
    setLoading(false);
  }, [venueId]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={exits}
        keyExtractor={(item, i) => item.id || String(i)}
        contentContainerStyle={{ padding: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.xxl }}>
            <Text style={{ fontSize: fontSize.title, fontWeight: '700', color: colors.text }}>Exits</Text>
            <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs }}>
              {exits.length} exits today
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.dangerBg, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="log-out" size={16} color={colors.danger} />
              </View>
              <View>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.text }}>{item.guest_name || 'Guest'}</Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>
                  {item.exited_at ? new Date(item.exited_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </Text>
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Feather name="log-out" size={40} color={colors.textMuted} />
            <Text style={{ fontSize: fontSize.md, color: colors.textMuted, marginTop: spacing.md }}>No exits today</Text>
          </View>
        }
      />
    </View>
  );
}
