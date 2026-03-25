/**
 * Guest Search Screen — themed. Manual guest lookup.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, fontSize, radius } from '../../theme/themes';
import { Input, Chip } from '../../components/ui';
import { useVenue } from '../../hooks/useVenue';
import * as pulseService from '../../services/pulseService';

export default function GuestSearchScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const { venueId } = useVenue();
  const tagUid = route.params?.tagUid;
  const assignMode = route.params?.mode === 'assign';

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<pulseService.SearchGuest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setSearched(false); return; }
    setLoading(true);
    try { setResults((await pulseService.searchGuests(venueId, q)).guests || []); setSearched(true); }
    catch { setResults([]); setSearched(true); }
    setLoading(false);
  }, [venueId]);

  const onChangeText = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(text), 400);
  };

  const onSelectGuest = async (guest: pulseService.SearchGuest) => {
    if (assignMode && tagUid) {
      navigation.navigate('NfcRegister', { guestId: guest.id, guestName: guest.name, tagUid });
      return;
    }
    try {
      const profile = await pulseService.getGuestProfile(guest.id, venueId);
      navigation.navigate('NfcResult', {
        guest: { ...profile, risk_chips: profile.risk_chips || [], value_chips: profile.value_chips || [] },
        source: 'search',
      });
    } catch {
      navigation.navigate('NfcResult', {
        guest: { id: guest.id, name: guest.name, email: guest.email, phone: guest.phone, visits: guest.visits, spend_total: guest.spend_total, flags: guest.flags || [], tags: guest.tags || [], risk_chips: [], value_chips: [] },
        source: 'search',
      });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.xxl }}>
      <Input placeholder="Search by name, phone, email..." value={query} onChangeText={onChangeText} style={{ marginBottom: spacing.lg }} />
      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.sm }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onSelectGuest(item)}
            activeOpacity={0.7}
            style={{ backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, minHeight: 64 }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.foreground }}>{item.name}</Text>
                {item.phone && <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginTop: 2 }}>{item.phone}</Text>}
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                {item.tags?.includes('vip') && <Chip label="VIP" color={colors.warning} bgColor={colors.warningBg} />}
                {item.tab_number && <Chip label={`Tab #${item.tab_number}`} color={colors.info} bgColor={colors.infoBg} />}
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm }}>
              <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground }}>{item.visits} visits</Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground }}>${item.spend_total} spent</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          searched && !loading ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: fontSize.md, color: colors.mutedForeground }}>No guests found</Text>
              <TouchableOpacity onPress={() => navigation.navigate('GuestIntake', { tagUid })} style={{ marginTop: spacing.lg }}>
                <Text style={{ fontSize: fontSize.md, color: colors.primary, fontWeight: '600' }}>+ Register New Guest</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </View>
  );
}
