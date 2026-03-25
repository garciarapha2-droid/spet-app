/**
 * NFC Scan Screen — Entry home. First screen after login.
 * Pulsing NFC animation + search + quick actions.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, fontSize } from '../../theme/themes';
import { useVenue } from '../../hooks/useVenue';
import TopNavbar from '../../components/TopNavbar';
import * as pulseService from '../../services/pulseService';

export default function NfcScanScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { venueId } = useVenue();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(useCallback(() => {
    loadGuests();
  }, []));

  const loadGuests = async () => {
    try {
      const data = await pulseService.getGuestsInside(venueId);
      setGuests(data || []);
    } catch {}
  };

  const handleSimulateNfc = () => {
    // Simulate an NFC scan — pick first guest or create mock
    if (guests.length > 0) {
      navigation.navigate('NfcResult', { guest: guests[0], source: 'nfc' });
    } else {
      Alert.alert('No Guests', 'Create a guest first or scan a real NFC tag.');
    }
  };

  const filteredGuests = guests.filter(g =>
    !search || (g.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopNavbar title="NFC Scan" />

      <View style={{ flex: 1, paddingHorizontal: spacing.lg }}>
        {/* NFC Animation */}
        <View style={{ alignItems: 'center', paddingVertical: 28 }}>
          <View style={{
            width: 112, height: 112, borderRadius: 56,
            backgroundColor: colors.primary + '15', borderWidth: 2, borderColor: colors.primary + '30',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Feather name="wifi" size={48} color={colors.primary} />
          </View>
          <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.foreground, marginTop: 12 }}>
            Ready to scan
          </Text>
          <Text style={{ fontSize: fontSize.tiny, color: colors.mutedForeground, marginTop: 4 }}>
            Hold NFC wristband near device
          </Text>
        </View>

        {/* Search */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          height: 52, borderRadius: 16, paddingHorizontal: 16,
          backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border + '50',
          marginBottom: 16,
        }}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            placeholder="Name or #tab..."
            placeholderTextColor={colors.placeholder}
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1, marginLeft: 12, color: colors.foreground, fontSize: fontSize.sm }}
          />
        </View>

        {/* Quick Actions */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          <TouchableOpacity
            onPress={handleSimulateNfc}
            style={{
              flex: 1, height: 52, borderRadius: 16,
              backgroundColor: colors.primary + '10', borderWidth: 1, borderColor: colors.primary + '25',
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <Feather name="zap" size={16} color={colors.primary} />
            <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: colors.primary }}>Simulate NFC</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('GuestIntake')}
            style={{
              flex: 1, height: 52, borderRadius: 16,
              backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border + '50',
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <Feather name="user-plus" size={16} color={colors.foreground} />
            <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: colors.foreground }}>New Guest</Text>
          </TouchableOpacity>
        </View>

        {/* Guest List */}
        <Text style={{ fontSize: 10, fontWeight: '700', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
          Guests Inside ({filteredGuests.length})
        </Text>
        <FlatList
          data={filteredGuests}
          keyExtractor={(item) => item.guest_id || item.id || Math.random().toString()}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('NfcResult', { guest: item, source: 'search' })}
              style={{
                flexDirection: 'row', alignItems: 'center', padding: 14,
                borderRadius: 16, backgroundColor: colors.card, borderWidth: 1,
                borderColor: colors.border + '40', marginBottom: 8,
              }}
            >
              <View style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: colors.primary + '15',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>
                  {(item.name || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.foreground }}>{item.name}</Text>
                <Text style={{ fontSize: fontSize.tiny, color: colors.mutedForeground }}>
                  {item.nfc_id ? `NFC: ${item.nfc_id}` : 'No NFC'}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: colors.mutedForeground, fontSize: fontSize.sm, paddingVertical: 24 }}>
              No guests inside
            </Text>
          }
        />
      </View>
    </View>
  );
}
