/**
 * NFC Register Screen — themed. Bind a physical NFC tag to a guest.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { NfcManager, NfcTech, nfcAvailable, isExpoGo } from '../../services/nfcBridge';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, fontSize } from '../../theme/themes';
import { Button, Input, LoadingOverlay } from '../../components/ui';
import { useVenue } from '../../hooks/useVenue';
import * as nfcService from '../../services/nfcService';

export default function NfcRegisterScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const { venueId } = useVenue();

  const guestId: string = route.params?.guestId;
  const guestName: string = route.params?.guestName || 'Guest';

  const [state, setState] = useState<'idle' | 'scanning' | 'registering'>('idle');
  const [label, setLabel] = useState('');
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);

  useEffect(() => {
    if (isExpoGo) { setNfcSupported(false); return; }
    (async () => {
      try {
        const supported = await NfcManager.isSupported();
        setNfcSupported(supported);
        if (supported) await NfcManager.start();
      } catch { setNfcSupported(false); }
    })();
    return () => { if (nfcAvailable) NfcManager.cancelTechnologyRequest().catch(() => {}); };
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
      Alert.alert('NFC Registered', `Tag ${tagUid} bound to ${guestName}.\n${result.message}`, [{
        text: 'Continue', onPress: () => {
          navigation.navigate('NfcResult', {
            guest: { id: guestId, name: guestName, visits: 0, spend_total: 0, flags: [], tags: [], risk_chips: [], value_chips: [] },
            source: 'nfc_register',
            tagUid,
          });
        },
      }]);
      setState('idle');
    } catch (err: any) {
      if (nfcAvailable) await NfcManager.cancelTechnologyRequest().catch(() => {});
      if (err.message?.includes('cancelled') || err.message?.includes('canceled')) { setState('idle'); return; }
      const msg = err.status === 409 ? 'This tag is already assigned to another guest.' : err.message || 'Registration failed';
      Alert.alert('Error', msg);
      setState('idle');
    }
  }, [guestId, guestName, venueId, label, navigation]);

  if (nfcSupported === false) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: spacing.xxl, alignItems: 'center' }}>
        <Text style={{ fontSize: fontSize.xl, fontWeight: '700', color: colors.foreground, textAlign: 'center' }}>NFC Not Available</Text>
        <Text style={{ fontSize: fontSize.md, color: colors.mutedForeground, textAlign: 'center', marginTop: spacing.md }}>
          {isExpoGo ? 'NFC requires a Development Build.' : 'This device does not support NFC.'}
        </Text>
        <Button title="Go Back" variant="ghost" onPress={() => navigation.goBack()} style={{ marginTop: spacing.xxl, width: '100%' }} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.xxl }}>
      <LoadingOverlay visible={state === 'registering'} message="Registering tag..." />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{
          width: 120, height: 120, borderRadius: 60,
          backgroundColor: state === 'scanning' ? colors.infoBg : colors.primaryBg,
          justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xxl,
          borderWidth: 2, borderColor: state === 'scanning' ? colors.info : colors.primary,
        }}>
          <Feather name="wifi" size={48} color={state === 'scanning' ? colors.info : colors.primary} />
        </View>
        <Text style={{ fontSize: fontSize.xl, fontWeight: '700', color: colors.foreground, textAlign: 'center' }}>
          {state === 'scanning' ? 'Tap Wristband...' : 'Register NFC Tag'}
        </Text>
        <Text style={{ fontSize: fontSize.md, color: colors.mutedForeground, textAlign: 'center', marginTop: spacing.sm }}>
          Binding to: {guestName}
        </Text>
        {state === 'idle' && (
          <View style={{ width: '100%', marginTop: spacing.xxxl, gap: spacing.lg }}>
            <Input placeholder="Label (e.g. Wristband Blue 001)" value={label} onChangeText={setLabel} autoCapitalize="sentences" />
            <Button title="Scan & Register" onPress={startScan} />
            <Button title="Skip" variant="ghost" onPress={() => navigation.goBack()} />
          </View>
        )}
        {state === 'scanning' && (
          <Button title="Cancel" variant="ghost" onPress={async () => { await NfcManager.cancelTechnologyRequest().catch(() => {}); setState('idle'); }} style={{ width: '100%', marginTop: spacing.xxxl }} />
        )}
      </View>
    </View>
  );
}
