/**
 * Guest Intake Screen — register new guest + optional NFC binding.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize } from '../../theme/colors';
import { Button, Input, SectionHeader } from '../../components/ui';
import { useVenue } from '../../hooks/useVenue';
import * as pulseService from '../../services/pulseService';

export default function GuestIntakeScreen() {
  const navigation = useNavigation<any>();
  const { venueId } = useVenue();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Guest name is required');
      return;
    }

    setLoading(true);
    try {
      const result = await pulseService.createGuest({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        venue_id: venueId,
      });

      Alert.alert(
        'Guest Created',
        `${name.trim()} was registered successfully.\n\nWould you like to bind an NFC wristband?`,
        [
          {
            text: 'Skip',
            style: 'cancel',
            onPress: () => {
              // Navigate to entry decision for the new guest
              navigation.navigate('EntryDecision', {
                guest: {
                  id: result.guest_id,
                  name: name.trim(),
                  email: email.trim(),
                  phone: phone.trim(),
                  visits: 0,
                  spend_total: 0,
                  flags: [],
                  tags: [],
                  risk_chips: [],
                  value_chips: [],
                },
                tab: { number: null, total: 0, has_open_tab: false },
                source: 'intake',
              });
            },
          },
          {
            text: 'Bind NFC',
            onPress: () => {
              navigation.navigate('NfcRegister', {
                guestId: result.guest_id,
                guestName: name.trim(),
              });
            },
          },
        ],
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create guest');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <ScrollView contentContainerStyle={{ padding: spacing.xxl }}>
        <SectionHeader title="New Guest" subtitle="Register a new guest at your venue" />

        <View style={{ gap: spacing.lg }}>
          <View>
            <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: spacing.sm, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
              Name *
            </Text>
            <Input placeholder="Guest name" value={name} onChangeText={setName} autoCapitalize="words" />
          </View>

          <View>
            <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: spacing.sm, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
              Phone
            </Text>
            <Input placeholder="+55 11 9xxxx-xxxx" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </View>

          <View>
            <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: spacing.sm, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
              Email
            </Text>
            <Input placeholder="guest@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
          </View>

          <Button
            title="Register Guest"
            onPress={handleCreate}
            loading={loading}
            style={{ marginTop: spacing.lg }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
