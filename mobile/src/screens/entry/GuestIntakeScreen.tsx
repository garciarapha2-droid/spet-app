/**
 * Guest Intake Screen — themed. Register new guest + photo + optional NFC binding.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, fontSize, radius } from '../../theme/themes';
import { Button, Input, SectionHeader } from '../../components/ui';
import { useVenue } from '../../hooks/useVenue';
import * as pulseService from '../../services/pulseService';

export default function GuestIntakeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const { venueId } = useVenue();
  const tagUid = route.params?.tagUid;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed to take guest photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        setPhoto(`data:image/jpeg;base64,${asset.base64}`);
      } else if (asset.uri) {
        setPhoto(asset.uri);
      }
    }
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Photo library access is needed.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        setPhoto(`data:image/jpeg;base64,${asset.base64}`);
      } else if (asset.uri) {
        setPhoto(asset.uri);
      }
    }
  };

  const handlePhotoAction = () => {
    Alert.alert('Guest Photo', 'Choose a source', [
      { text: 'Camera', onPress: takePhoto },
      { text: 'Photo Library', onPress: pickPhoto },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleCreate = async () => {
    if (!name.trim()) { Alert.alert('Required', 'Guest name is required'); return; }
    setLoading(true);
    try {
      const result = await pulseService.createGuest({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        venue_id: venueId,
        photo: photo || undefined,
      });
      Alert.alert('Guest Created', `${name.trim()} was registered successfully.\n\nWould you like to bind an NFC wristband?`, [
        { text: 'Skip', style: 'cancel', onPress: () => {
          navigation.navigate('EntryDecision', {
            guest: { id: result.guest_id, name: name.trim(), email: email.trim(), phone: phone.trim(), photo, visits: 0, spend_total: 0, flags: [], tags: [], risk_chips: [], value_chips: [] },
            tab: { number: null, total: 0, has_open_tab: false }, source: 'intake',
          });
        }},
        { text: 'Bind NFC', onPress: () => { navigation.navigate('NfcRegister', { guestId: result.guest_id, guestName: name.trim(), tagUid }); }},
      ]);
    } catch (err: any) { Alert.alert('Error', err.message || 'Failed to create guest'); }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xxl }}>
        <SectionHeader title="New Guest" subtitle="Register a new guest at your venue" />
        <View style={{ gap: spacing.lg }}>
          {/* Photo Section */}
          <View style={{ alignItems: 'center', marginBottom: spacing.sm }}>
            <TouchableOpacity
              onPress={handlePhotoAction}
              activeOpacity={0.7}
              data-testid="guest-photo-button"
              style={{
                width: 100, height: 100, borderRadius: 50,
                backgroundColor: colors.card, borderWidth: 2,
                borderColor: photo ? colors.primary : colors.border,
                borderStyle: photo ? 'solid' : 'dashed',
                alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {photo ? (
                <Image source={{ uri: photo }} style={{ width: 100, height: 100, borderRadius: 50 }} />
              ) : (
                <Feather name="camera" size={28} color={colors.mutedForeground} />
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePhotoAction} style={{ marginTop: spacing.sm }}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: colors.primary }}>
                {photo ? 'Change Photo' : 'Add Photo'}
              </Text>
            </TouchableOpacity>
            {photo && (
              <TouchableOpacity onPress={() => setPhoto(null)} style={{ marginTop: 4 }}>
                <Text style={{ fontSize: fontSize.tiny, color: colors.destructive }}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>

          <View>
            <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground, marginBottom: spacing.sm, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>Name *</Text>
            <Input placeholder="Guest name" value={name} onChangeText={setName} autoCapitalize="words" />
          </View>
          <View>
            <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground, marginBottom: spacing.sm, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>Phone</Text>
            <Input placeholder="+55 11 9xxxx-xxxx" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </View>
          <View>
            <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground, marginBottom: spacing.sm, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>Email</Text>
            <Input placeholder="guest@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
          </View>
          {tagUid && (
            <View style={{ borderRadius: 12, backgroundColor: colors.primaryBg, borderWidth: 1, borderColor: colors.primary + '30', padding: spacing.md }}>
              <Text style={{ fontSize: fontSize.sm, color: colors.primary }}>NFC Tag: <Text style={{ fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>{tagUid}</Text></Text>
            </View>
          )}
          <Button title="Register Guest" onPress={handleCreate} loading={loading} style={{ marginTop: spacing.lg }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
