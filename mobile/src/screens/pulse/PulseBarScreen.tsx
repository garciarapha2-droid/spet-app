/**
 * Pulse Bar — bar-focused guest search and NFC flow.
 * Mirrors web PulseBarPage.js.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../../theme/colors';
import { useVenue } from '../../hooks/useVenue';
import { Card } from '../../components/ui';
import { api } from '../../services/api';

export default function PulseBarScreen() {
  const { venueId } = useVenue();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || !venueId) { setResults([]); return; }
    setLoading(true);
    try {
      const data = await api.get(`/pulse/bar/search?venue_id=${venueId}&q=${encodeURIComponent(q)}`);
      setResults(data.guests || data.results || []);
    } catch { setResults([]); }
    setLoading(false);
  }, [venueId]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xxl }}>
        <Text style={{ fontSize: fontSize.title, fontWeight: '700', color: colors.text }}>Bar</Text>
        <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.xxl }}>
          Search guests by name or NFC
        </Text>

        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: spacing.md,
          backgroundColor: colors.bgInput, borderRadius: radius.md, padding: spacing.md,
          borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xxl,
        }}>
          <Feather name="search" size={16} color={colors.textMuted} />
          <TextInput
            placeholder="Search guest..."
            placeholderTextColor={colors.textPlaceholder}
            value={search}
            onChangeText={t => { setSearch(t); doSearch(t); }}
            style={{ flex: 1, color: colors.text, fontSize: fontSize.md }}
            returnKeyType="search"
          />
        </View>

        {loading && <ActivityIndicator color={colors.primary} style={{ marginBottom: spacing.lg }} />}

        {results.map((guest: any, i: number) => (
          <Card key={guest.id || i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.primary }}>{(guest.name)?.[0] || '?'}</Text>
              </View>
              <View>
                <Text style={{ fontSize: fontSize.md, fontWeight: '500', color: colors.text }}>{guest.name}</Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>
                  {guest.tab_number ? `Tab #${guest.tab_number}` : 'No tab'} {guest.visits ? `- ${guest.visits} visits` : ''}
                </Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              {guest.spend_total > 0 && (
                <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.success }}>${guest.spend_total.toFixed(0)}</Text>
              )}
              {guest.tags?.includes('vip') && (
                <View style={{ backgroundColor: colors.warningBg, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, marginTop: 2 }}>
                  <Text style={{ fontSize: 8, fontWeight: '700', color: colors.warning }}>VIP</Text>
                </View>
              )}
            </View>
          </Card>
        ))}

        {search.trim() && !loading && results.length === 0 && (
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Feather name="search" size={32} color={colors.textMuted} />
            <Text style={{ fontSize: fontSize.md, color: colors.textMuted, marginTop: spacing.md }}>No results</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
