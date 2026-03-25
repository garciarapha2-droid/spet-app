/**
 * Pulse Inside — Production-ready. Shows guests currently inside venue.
 */
import React from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../../theme/colors';
import { useVenue } from '../../hooks/useVenue';
import { Card } from '../../components/ui';
import { ErrorState, EmptyState, SkeletonList, useAsyncData } from '../../components/ProductionUI';
import { api } from '../../services/api';

export default function PulseInsideScreen() {
  const { venueId } = useVenue();
  const { data, loading, error, refresh } = useAsyncData(
    () => api.get(`/pulse/inside?venue_id=${venueId}`),
    [venueId],
  );

  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const guests = data?.guests || data || [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {loading ? (
        <SkeletonList count={6} />
      ) : guests.length === 0 ? (
        <EmptyState icon="users" title="No Guests Inside" message="Guests will appear here after they check in." />
      ) : (
        <FlatList
          data={guests}
          keyExtractor={(item, i) => item.id || String(i)}
          contentContainerStyle={{ padding: spacing.xxl }}
          keyboardDismissMode="on-drag"
          refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.primary} />}
          ListHeaderComponent={
            <View style={{ marginBottom: spacing.xxl }}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>
                {guests.length} guests inside
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.primary }}>{(item.name)?.[0] || '?'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: fontSize.md, fontWeight: '500', color: colors.text }} numberOfLines={1}>{item.name || 'Guest'}</Text>
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
                {item.tab_status === 'open' && (
                  <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.success, fontVariant: ['tabular-nums'] }}>
                    ${(item.tab_total || 0).toFixed(0)}
                  </Text>
                )}
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}
