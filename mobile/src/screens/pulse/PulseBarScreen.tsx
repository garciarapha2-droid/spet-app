/**
 * Pulse Bar — Production-ready. Guest search for bar operations.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../../theme/colors';
import { useVenue } from '../../hooks/useVenue';
import { Card } from '../../components/ui';
import { ScreenWrapper, ScreenHeader, EmptyState } from '../../components/ProductionUI';
import { api } from '../../services/api';

export default function PulseBarScreen() {
  const { venueId } = useVenue();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || !venueId) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    try {
      const data = await api.get(`/pulse/bar/search?venue_id=${venueId}&q=${encodeURIComponent(q)}`);
      setResults(data.guests || data.results || []);
    } catch { setResults([]); }
    setLoading(false);
  }, [venueId]);

  return (
    <ScreenWrapper>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: spacing.md,
        backgroundColor: colors.bgInput, borderRadius: radius.md, padding: spacing.md,
        borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xxl,
      }}>
        <Feather name="search" size={16} color={colors.textMuted} />
        <TextInput
          placeholder="Search guest by name..."
          placeholderTextColor={colors.textPlaceholder}
          value={search}
          onChangeText={t => { setSearch(t); doSearch(t); }}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Search guests"
          style={{ flex: 1, color: colors.text, fontSize: fontSize.md }}
        />
      </View>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginBottom: spacing.lg }} />}

      {results.map((guest: any, i: number) => (
        <Card key={guest.id || i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.primary }}>{(guest.name)?.[0] || '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.md, fontWeight: '500', color: colors.text }} numberOfLines={1}>{guest.name}</Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>
                {guest.tab_number ? `Tab #${guest.tab_number}` : 'No tab'} {guest.visits ? `- ${guest.visits} visits` : ''}
              </Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            {guest.spend_total > 0 && (
              <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.success, fontVariant: ['tabular-nums'] }}>
                ${guest.spend_total.toFixed(0)}
              </Text>
            )}
            {guest.tags?.includes('vip') && (
              <View style={{ backgroundColor: colors.warningBg, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, marginTop: 2 }}>
                <Text style={{ fontSize: 8, fontWeight: '700', color: colors.warning }}>VIP</Text>
              </View>
            )}
          </View>
        </Card>
      ))}

      {searched && !loading && results.length === 0 && (
        <EmptyState icon="search" title="No Results" message={`No guests found for "${search}"`} />
      )}

      {!searched && !loading && (
        <EmptyState icon="search" title="Search Guests" message="Type a guest name to find their profile and tab info." />
      )}
    </ScreenWrapper>
  );
}
