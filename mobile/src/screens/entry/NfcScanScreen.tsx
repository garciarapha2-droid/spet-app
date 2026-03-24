/**
 * NFC Scan Screen — reads real NFC tag via react-native-nfc-manager.
 * Sends tag_uid to POST /api/nfc/scan, navigates to EntryDecision.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import { colors, spacing, fontSize, radius } from '../../theme/colors';
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

  // Check NFC support on mount
  useEffect(() => {
    (async () => {
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
      NfcManager.cancelTechnologyRequest().catch(() => {});
    };
  }, []);

  const startScan = useCallback(async () => {
    setState('scanning');
    setErrorMsg('');

    try {
      // Request NFC technology
      await NfcManager.requestTechnology(NfcTech.NfcA);
      const tag = await NfcManager.getTag();

      if (!tag?.id) {
        throw new Error('Could not read tag UID');
      }

      // Normalize UID
      const tagUid = nfcService.normalizeTagUid(tag.id);

      // Release NFC
      await NfcManager.cancelTechnologyRequest();

      // Process scan against backend
      setState('processing');
      const result = await nfcService.scanNfcTag(tagUid, venueId);

      // Navigate to decision screen with scan result
      navigation.navigate('EntryDecision', {
        guest: result.guest,
        tab: result.tab,
        source: 'nfc',
        tagUid,
      });
      setState('idle');
    } catch (err: any) {
      await NfcManager.cancelTechnologyRequest().catch(() => {});

      if (err.status === 404) {
        setErrorMsg('Tag not registered. Register it first or search manually.');
      } else if (err.message?.includes('cancelled') || err.message?.includes('canceled')) {
        // User cancelled — just go back to idle
        setState('idle');
        return;
      } else {
        setErrorMsg(err.message || 'NFC scan failed');
      }
      setState('error');
    }
  }, [venueId, navigation]);

  // NFC not supported
  if (nfcSupported === false) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl }}>
        <Text style={{ fontSize: 48, marginBottom: spacing.lg }}>{'\u26A0\uFE0F'}</Text>
        <Text style={{ fontSize: fontSize.xl, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
          NFC Not Available
        </Text>
        <Text style={{ fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md }}>
          {Platform.OS === 'ios'
            ? 'This device does not support NFC or NFC is disabled.'
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
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: colors.primaryBg,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: spacing.xxxl,
              borderWidth: 2,
              borderColor: colors.primary,
            }}
          >
            <Text style={{ fontSize: 64 }}>{'\u{1F4F6}'}</Text>
          </View>

          <Text style={{ fontSize: fontSize.xl, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
            Ready to Scan
          </Text>
          <Text style={{ fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md }}>
            Hold the device near a guest wristband
          </Text>

          <Button
            title="Start NFC Scan"
            onPress={startScan}
            style={{ width: '100%', marginTop: spacing.xxxl }}
          />
        </>
      )}

      {state === 'scanning' && (
        <>
          <View
            style={{
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: colors.infoBg,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: spacing.xxxl,
              borderWidth: 2,
              borderColor: colors.info,
            }}
          >
            <Text style={{ fontSize: 64 }}>{'\u{1F4F6}'}</Text>
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
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: colors.dangerBg,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: spacing.xxxl,
              borderWidth: 2,
              borderColor: colors.danger,
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
            <Button
              title="Search Manually"
              variant="ghost"
              onPress={() => navigation.replace('GuestSearch')}
            />
          </View>
        </>
      )}
    </View>
  );
}
