/**
 * NFC Scan Screen — reads real NFC tag.
 * Safe for Expo Go: shows fallback when NFC is unavailable.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { NfcManager, NfcTech, nfcAvailable, isExpoGo } from '../../services/nfcBridge';
import { colors, spacing, fontSize } from '../../theme/colors';
import { Button, LoadingOverlay } from '../../components/ui';
import { useVenue } from '../../hooks/useVenue';
import * as nfcService from '../../services/nfcService';

type ScanState = 'idle' | 'scanning' | 'processing' | 'error';

export default function NfcScanScreen() {
  const navigation = useNavigation<any>();
  const { venueId } = useVenue();
  const [state, setState] = useState<ScanState>('idle');
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    (async () => {
      if (isExpoGo) {
        setNfcSupported(false);
        return;
      }
      try {
        const supported = await NfcManager.isSupported();
        setNfcSupported(supported);
        if (supported) {
          await NfcManager.start();
        }
      } catch {
        setNfcSupported(false);
      }
    })();

    return () => {
      if (nfcAvailable) {
        NfcManager.cancelTechnologyRequest().catch(() => {});
      }
    };
  }, []);

  const startScan = useCallback(async () => {
    setState('scanning');
    setErrorMsg('');

    try {
      await NfcManager.requestTechnology(NfcTech.NfcA);
      const tag = await NfcManager.getTag();

      if (!tag?.id) {
        throw new Error('Could not read tag UID');
      }

      const tagUid = nfcService.normalizeTagUid(tag.id);
      await NfcManager.cancelTechnologyRequest();

      setState('processing');
      const result = await nfcService.scanNfcTag(tagUid, venueId);

      navigation.navigate('EntryDecision', {
        guest: result.guest,
        tab: result.tab,
        source: 'nfc',
        tagUid,
      });
      setState('idle');
    } catch (err: any) {
      if (nfcAvailable) {
        await NfcManager.cancelTechnologyRequest().catch(() => {});
      }

      if (err.message?.includes('cancelled') || err.message?.includes('canceled')) {
        setState('idle');
        return;
      }

      if (err.status === 404) {
        setErrorMsg('Tag not registered. Register it first or search manually.');
      } else {
        setErrorMsg(err.message || 'NFC scan failed');
      }
      setState('error');
    }
  }, [venueId, navigation]);

  // NFC not supported — show fallback
  if (nfcSupported === false) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl }}>
        <View
          style={{
            width: 120, height: 120, borderRadius: 60,
            backgroundColor: colors.warningBg, justifyContent: 'center', alignItems: 'center',
            marginBottom: spacing.xxl, borderWidth: 2, borderColor: colors.warning,
          }}
        >
          <Text style={{ fontSize: 48 }}>{'\u26A0'}</Text>
        </View>
        <Text style={{ fontSize: fontSize.xl, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
          NFC Not Available
        </Text>
        <Text style={{ fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md, paddingHorizontal: spacing.lg }}>
          {isExpoGo
            ? 'NFC requires a Development Build.\nUse manual search instead.'
            : Platform.OS === 'ios'
              ? 'This device does not support NFC.'
              : 'Enable NFC in device settings.'}
        </Text>
        <Button
          title="Search Manually"
          variant="ghost"
          onPress={() => navigation.replace('GuestSearch')}
          style={{ marginTop: spacing.xxl, width: '100%' }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl }}>
      <LoadingOverlay visible={state === 'processing'} message="Looking up guest..." />

      {state === 'idle' && (
        <>
          <View
            style={{
              width: 160, height: 160, borderRadius: 80,
              backgroundColor: colors.primaryBg, justifyContent: 'center', alignItems: 'center',
              marginBottom: spacing.xxxl, borderWidth: 2, borderColor: colors.primary,
            }}
          >
            <Feather name="wifi" size={64} color={colors.primary} />
          </View>
          <Text style={{ fontSize: fontSize.xl, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
            Ready to Scan
          </Text>
          <Text style={{ fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md }}>
            Hold the device near a guest wristband
          </Text>
          <Button title="Start NFC Scan" onPress={startScan} style={{ width: '100%', marginTop: spacing.xxxl }} />
        </>
      )}

      {state === 'scanning' && (
        <>
          <View
            style={{
              width: 160, height: 160, borderRadius: 80,
              backgroundColor: colors.infoBg, justifyContent: 'center', alignItems: 'center',
              marginBottom: spacing.xxxl, borderWidth: 2, borderColor: colors.info,
            }}
          >
            <Feather name="wifi" size={64} color={colors.info} />
          </View>
          <Text style={{ fontSize: fontSize.xl, fontWeight: '700', color: colors.info, textAlign: 'center' }}>
            Scanning...
          </Text>
          <Text style={{ fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md }}>
            {Platform.OS === 'ios'
              ? 'Hold your iPhone near the NFC tag'
              : 'Touch the wristband to the back of your phone'}
          </Text>
          <Button
            title="Cancel"
            variant="ghost"
            onPress={async () => {
              await NfcManager.cancelTechnologyRequest().catch(() => {});
              setState('idle');
            }}
            style={{ width: '100%', marginTop: spacing.xxxl }}
          />
        </>
      )}

      {state === 'error' && (
        <>
          <View
            style={{
              width: 160, height: 160, borderRadius: 80,
              backgroundColor: colors.dangerBg, justifyContent: 'center', alignItems: 'center',
              marginBottom: spacing.xxxl, borderWidth: 2, borderColor: colors.danger,
            }}
          >
            <Text style={{ fontSize: 64 }}>{'\u2716'}</Text>
          </View>
          <Text style={{ fontSize: fontSize.xl, fontWeight: '700', color: colors.danger, textAlign: 'center' }}>
            Scan Failed
          </Text>
          <Text style={{ fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md, paddingHorizontal: spacing.lg }}>
            {errorMsg}
          </Text>
          <View style={{ width: '100%', gap: spacing.md, marginTop: spacing.xxxl }}>
            <Button title="Try Again" onPress={startScan} />
            <Button title="Search Manually" variant="ghost" onPress={() => navigation.replace('GuestSearch')} />
          </View>
        </>
      )}
    </View>
  );
}
