/**
 * NFC Register Screen — bind a physical NFC tag to a guest.
 * Reads real tag via react-native-nfc-manager, calls POST /api/nfc/register.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Alert, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import { colors, spacing, fontSize, radius } from '../../theme/colors';
import { Button, Input, LoadingOverlay } from '../../components/ui';
import { useVenue } from '../../hooks/useVenue';
import * as nfcService from '../../services/nfcService';

export default function NfcRegisterScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { venueId } = useVenue();

  const guestId: string = route.params?.guestId;
  const guestName: string = route.params?.guestName || 'Guest';

  const [state, setState] = useState<'idle' | 'scanning' | 'registering'>('idle');
  const [label, setLabel] = useState('');
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const supported = await NfcManager.isSupported();
        setNfcSupported(supported);
        if (supported) await NfcManager.start();
      } catch {
        setNfcSupported(false);
      }
    })();
    return () => {
      NfcManager.cancelTechnologyRequest().catch(() => {});
    };
  }, []);

  const startScan = useCallback(async () => {
    setState('scanning');
    try {
      await NfcManager.requestTechnology(NfcTech.NfcA);
      const tag = await NfcManager.getTag();
      await NfcManager.cancelTechnologyRequest();

      if (!tag?.id) throw new Error('Could not read tag');

      const tagUid = nfcService.normalizeTagUid(tag.id);

      setState('registering');
      const result = await nfcService.registerNfcTag(tagUid, guestId, venueId, label || undefined);

      Alert.alert(
        'NFC Registered',
        `Tag ${tagUid} bound to ${guestName}.\n${result.message}`,
        [
          {
            text: 'Continue to Entry',
            onPress: () => {
              navigation.navigate('EntryDecision', {
                guest: {
                  id: guestId,
                  name: guestName,
                  visits: 0,
                  spend_total: 0,
                  flags: [],
                  tags: [],
                  risk_chips: [],
                  value_chips: [],
                },
                tab: { number: null, total: 0, has_open_tab: false },
                source: 'nfc_register',
              });
            },
          },
        ],
      );
      setState('idle');
    } catch (err: any) {
      await NfcManager.cancelTechnologyRequest().catch(() => {});

      if (err.message?.includes('cancelled') || err.message?.includes('canceled')) {
        setState('idle');
        return;
      }

      const msg = err.status === 409
        ? 'This tag is already assigned to another guest. Unlink it first.'
        : err.message || 'Registration failed';

      Alert.alert('Error', msg);
      setState('idle');
    }
  }, [guestId, guestName, venueId, label, navigation]);

  if (nfcSupported === false) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: spacing.xxl }}>
        <Text style={{ fontSize: fontSize.xl, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
          NFC Not Available
        </Text>
        <Button
          title="Skip NFC Registration"
          variant="ghost"
          onPress={() => navigation.goBack()}
          style={{ marginTop: spacing.xxl }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.xxl }}>
      <LoadingOverlay visible={state === 'registering'} message="Registering tag..." />

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: state === 'scanning' ? colors.infoBg : colors.primaryBg,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: spacing.xxl,
            borderWidth: 2,
            borderColor: state === 'scanning' ? colors.info : colors.primary,
          }}
        >
          <Text style={{ fontSize: 48 }}>{'\u{1F4F6}'}</Text>
        </View>

        <Text style={{ fontSize: fontSize.xl, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
          {state === 'scanning' ? 'Tap Wristband...' : 'Register NFC Tag'}
        </Text>
        <Text style={{ fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm }}>
          Binding to: {guestName}
        </Text>

        {state === 'idle' && (
          <View style={{ width: '100%', marginTop: spacing.xxxl, gap: spacing.lg }}>
            <Input
              placeholder="Label (e.g. Wristband Blue 001)"
              value={label}
              onChangeText={setLabel}
              autoCapitalize="sentences"
            />
            <Button title="Scan & Register" onPress={startScan} />
            <Button
              title="Skip"
              variant="ghost"
              onPress={() => navigation.goBack()}
            />
          </View>
        )}

        {state === 'scanning' && (
          <Button
            title="Cancel"
            variant="ghost"
            onPress={async () => {
              await NfcManager.cancelTechnologyRequest().catch(() => {});
              setState('idle');
            }}
            style={{ width: '100%', marginTop: spacing.xxxl }}
          />
        )}
      </View>
    </View>
  );
}
