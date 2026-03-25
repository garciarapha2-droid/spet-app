/**
 * NFC Scan Screen — reads real NFC tag.
 *
 * Flow:
 *   scan → tag read → backend lookup
 *     → found → EntryDecision (existing guest)
 *     → 404  → "Tag detected, not registered" → registration options
 *     → error → retry/manual search
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

type ScanState = 'idle' | 'scanning' | 'processing' | 'unregistered' | 'error';

export default function NfcScanScreen() {
  const navigation = useNavigation<any>();
  const { venueId } = useVenue();
  const [state, setState] = useState<ScanState>('idle');
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [scannedUid, setScannedUid] = useState<string | null>(null);

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
    setScannedUid(null);

    try {
      await NfcManager.requestTechnology(NfcTech.NfcA);
      const tag = await NfcManager.getTag();

      if (!tag?.id) {
        throw new Error('Could not read tag UID');
      }

      const tagUid = nfcService.normalizeTagUid(tag.id);
      await NfcManager.cancelTechnologyRequest();
      setScannedUid(tagUid);

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

      // Tag read succeeded but not registered in backend
      if (err.status === 404 || err.code === 'NOT_FOUND') {
        setState('unregistered');
        return;
      }

      setErrorMsg(err.message || 'NFC scan failed');
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
          <Feather name="alert-triangle" size={48} color={colors.warning} />
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

      {state === 'unregistered' && (
        <>
          <View
            style={{
              width: 160, height: 160, borderRadius: 80,
              backgroundColor: colors.successBg, justifyContent: 'center', alignItems: 'center',
              marginBottom: spacing.xxxl, borderWidth: 2, borderColor: colors.success,
            }}
          >
            <Feather name="check-circle" size={64} color={colors.success} />
          </View>
          <Text style={{ fontSize: fontSize.xl, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
            Tag Detected
          </Text>
          <Text style={{ fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md, paddingHorizontal: spacing.lg }}>
            This tag is not registered yet
          </Text>
          {scannedUid && (
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
              UID: {scannedUid}
            </Text>
          )}
          <View style={{ width: '100%', gap: spacing.md, marginTop: spacing.xxxl }}>
            <Button
              title="Register This Tag"
              onPress={() => navigation.navigate('NfcRegister', { tagUid: scannedUid })}
            />
            <Button
              title="Assign to Existing Guest"
              variant="outline"
              onPress={() => navigation.navigate('GuestSearch', { tagUid: scannedUid, mode: 'assign' })}
            />
            <Button
              title="Create New Guest"
              variant="outline"
              onPress={() => navigation.navigate('GuestIntake', { tagUid: scannedUid })}
            />
            <Button
              title="Scan Again"
              variant="ghost"
              onPress={() => { setState('idle'); setScannedUid(null); }}
            />
          </View>
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
            <Feather name="x-circle" size={64} color={colors.danger} />
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
