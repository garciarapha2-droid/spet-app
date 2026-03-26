/**
 * NFC Scan Screen — Real iOS NFC reading with react-native-nfc-manager.
 *
 * Flow:
 *   1. Init NFC on mount
 *   2. User taps "Scan NFC" → iOS native "Ready to Scan" popup
 *   3. Tag detected → read UID + NDEF payload
 *   4. Call backend to resolve tag
 *   5. Navigate to NfcResult (guest found or unregistered)
 *
 * Debug panel shows NFC state for troubleshooting.
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, FlatList,
  Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, fontSize, radius } from '../../theme/themes';
import { useVenue } from '../../hooks/useVenue';
import TopNavbar from '../../components/TopNavbar';
import * as pulseService from '../../services/pulseService';
import * as nfcService from '../../services/nfcService';

type NfcStatus = 'init' | 'ready' | 'scanning' | 'processing' | 'success' | 'error' | 'unsupported';

export default function NfcScanScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { venueId } = useVenue();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [guests, setGuests] = useState<any[]>([]);

  // NFC state
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);
  const [nfcEnabled, setNfcEnabled] = useState<boolean | null>(null);
  const [nfcStatus, setNfcStatus] = useState<NfcStatus>('init');
  const [lastTagUid, setLastTagUid] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const scanningRef = useRef(false);

  // ── Init NFC on mount ──
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const supported = await NfcManager.isSupported();
        if (!mounted) return;
        setNfcSupported(supported);
        console.log(`[NFC] Supported: ${supported}`);

        if (supported) {
          await NfcManager.start();
          console.log('[NFC] Manager started');

          // Check if NFC is enabled (Android only, iOS always true if supported)
          if (Platform.OS === 'android') {
            const enabled = await NfcManager.isEnabled();
            if (!mounted) return;
            setNfcEnabled(enabled);
            console.log(`[NFC] Enabled: ${enabled}`);
          } else {
            setNfcEnabled(true);
          }
          setNfcStatus('ready');
        } else {
          setNfcStatus('unsupported');
          setNfcEnabled(false);
        }
      } catch (err: any) {
        console.log(`[NFC] Init error: ${err.message}`);
        if (!mounted) return;
        setNfcSupported(false);
        setNfcStatus('unsupported');
        setLastError(`Init: ${err.message}`);
      }
    })();

    return () => {
      mounted = false;
      cleanupNfc();
    };
  }, []);

  // ── Load guests ──
  useFocusEffect(useCallback(() => {
    loadGuests();
  }, []));

  const loadGuests = async () => {
    try {
      const data = await pulseService.getGuestsInside(venueId);
      setGuests(data || []);
    } catch {}
  };

  // ── Cleanup NFC session ──
  const cleanupNfc = async () => {
    try {
      await NfcManager.cancelTechnologyRequest();
    } catch {}
    scanningRef.current = false;
  };

  // ── Parse NDEF text record ──
  const parseNdefText = (record: any): string | null => {
    try {
      if (record.tnf === 1 && record.type) {
        // Well-known type
        const typeStr = String.fromCharCode(...record.type);
        if (typeStr === 'T') {
          // Text record: first byte is language code length
          const payload = record.payload;
          if (payload && payload.length > 1) {
            const langLen = payload[0];
            const textBytes = payload.slice(1 + langLen);
            return String.fromCharCode(...textBytes);
          }
        } else if (typeStr === 'U') {
          // URI record
          const payload = record.payload;
          if (payload && payload.length > 1) {
            const prefixByte = payload[0];
            const uriPrefixes: Record<number, string> = {
              0: '', 1: 'http://www.', 2: 'https://www.', 3: 'http://', 4: 'https://',
            };
            const prefix = uriPrefixes[prefixByte] || '';
            const rest = String.fromCharCode(...payload.slice(1));
            return prefix + rest;
          }
        }
      }
      // Try Ndef helper
      if (Ndef && Ndef.text && record.payload) {
        return Ndef.text.decodePayload(new Uint8Array(record.payload));
      }
    } catch (e: any) {
      console.log(`[NFC] NDEF parse error: ${e.message}`);
    }
    return null;
  };

  // ── Extract tag UID from raw tag object ──
  const extractTagUid = (tag: any): string => {
    // tag.id is the hardware UID as a byte array or hex string
    let rawId = tag.id || '';
    if (Array.isArray(rawId)) {
      rawId = rawId.map((b: number) => b.toString(16).padStart(2, '0')).join('');
    }
    return nfcService.normalizeTagUid(rawId);
  };

  // ── Start NFC NDEF scan ──
  const startNfcScan = async () => {
    if (scanningRef.current) return;
    if (nfcStatus === 'unsupported') {
      Alert.alert('NFC Not Supported', 'This device does not support NFC.');
      return;
    }

    scanningRef.current = true;
    setNfcStatus('scanning');
    setLastError(null);
    setLastTagUid(null);
    console.log('[NFC] Starting NDEF scan session...');

    try {
      // Request NDEF technology — this triggers iOS native "Ready to Scan" popup
      await NfcManager.requestTechnology(NfcTech.Ndef, {
        alertMessage: 'Hold your iPhone near the NFC wristband',
      });
      console.log('[NFC] Session started, waiting for tag...');

      // Get the tag
      const tag = await NfcManager.getTag();
      console.log('[NFC] Tag detected:', JSON.stringify(tag, null, 2));

      if (!tag) {
        setNfcStatus('error');
        setLastError('Tag detected but no data returned');
        return;
      }

      const tagUid = extractTagUid(tag);
      setLastTagUid(tagUid);
      console.log(`[NFC] Tag UID: ${tagUid}`);

      // Parse NDEF message if present
      let ndefPayload: string | null = null;
      if (tag.ndefMessage && tag.ndefMessage.length > 0) {
        console.log(`[NFC] NDEF records: ${tag.ndefMessage.length}`);
        for (const record of tag.ndefMessage) {
          const text = parseNdefText(record);
          if (text) {
            ndefPayload = text;
            console.log(`[NFC] NDEF payload: ${text}`);
            break;
          }
        }
      } else {
        console.log('[NFC] No NDEF message on tag (raw tag only)');
      }

      setNfcStatus('processing');

      // Call backend to resolve the tag
      try {
        const scanResult = await nfcService.scanNfcTag(tagUid, venueId);
        console.log(`[NFC] Backend resolved: guest=${scanResult.guest?.name}`);
        setNfcStatus('success');

        // Navigate to NfcResult with guest data
        navigation.navigate('NfcResult', {
          guest: {
            ...scanResult.guest,
            risk_chips: scanResult.guest?.risk_chips || [],
            value_chips: scanResult.guest?.value_chips || [],
          },
          source: 'nfc',
          tagUid,
        });
      } catch (apiErr: any) {
        console.log(`[NFC] Backend error: ${apiErr.message}`);
        // Tag not registered — navigate to NfcResult in unregistered mode
        if (apiErr.status === 404 || apiErr.code === 'NOT_FOUND' || apiErr.message?.includes('not found') || apiErr.message?.includes('not registered')) {
          setNfcStatus('success');
          navigation.navigate('NfcResult', {
            unregistered: true,
            tagUid,
            source: 'nfc',
          });
        } else {
          setNfcStatus('error');
          setLastError(`API: ${apiErr.message}`);
          Alert.alert('Scan Error', apiErr.message || 'Failed to resolve NFC tag');
        }
      }
    } catch (err: any) {
      console.log(`[NFC] Scan error: ${err.message}`);
      if (err.message?.includes('cancelled') || err.message?.includes('canceled') || err.message?.includes('invalidate')) {
        // User cancelled the scan — not an error
        console.log('[NFC] Session cancelled by user');
        setNfcStatus('ready');
      } else {
        setNfcStatus('error');
        setLastError(err.message || 'Unknown NFC error');

        // Check if tag is not NDEF formatted
        if (err.message?.includes('not NDEF') || err.message?.includes('unsupported')) {
          Alert.alert('Tag Not Supported', 'This NFC tag is not properly formatted.\nPlease use an NDEF-formatted tag.');
        }
      }
    } finally {
      await cleanupNfc();
      console.log('[NFC] Session invalidated/cleaned up');
    }
  };

  // ── Filtered guests ──
  const filteredGuests = guests.filter(g =>
    !search || (g.name || '').toLowerCase().includes(search.toLowerCase())
  );

  // ── Status indicator ──
  const statusConfig = () => {
    switch (nfcStatus) {
      case 'init': return { icon: 'loader', color: colors.mutedForeground, label: 'Initializing...', pulse: false };
      case 'ready': return { icon: 'wifi', color: colors.primary, label: 'Ready to scan', pulse: true };
      case 'scanning': return { icon: 'wifi', color: colors.warning, label: 'Scanning...', pulse: true };
      case 'processing': return { icon: 'loader', color: colors.primary, label: 'Processing tag...', pulse: false };
      case 'success': return { icon: 'check-circle', color: colors.emerald500, label: 'Tag read!', pulse: false };
      case 'error': return { icon: 'alert-circle', color: colors.destructive, label: 'Scan failed', pulse: false };
      case 'unsupported': return { icon: 'x-circle', color: colors.mutedForeground, label: 'NFC not available', pulse: false };
    }
  };

  const status = statusConfig();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopNavbar title="NFC Scan" />

      <View style={{ flex: 1, paddingHorizontal: spacing.lg }}>
        {/* NFC Status Indicator */}
        <TouchableOpacity
          onPress={startNfcScan}
          disabled={nfcStatus === 'scanning' || nfcStatus === 'processing'}
          activeOpacity={0.7}
          data-testid="nfc-scan-button"
          style={{ alignItems: 'center', paddingVertical: 24 }}
        >
          <View style={{
            width: 112, height: 112, borderRadius: 56,
            backgroundColor: status.color + '15',
            borderWidth: 2, borderColor: status.color + '30',
            alignItems: 'center', justifyContent: 'center',
          }}>
            {nfcStatus === 'scanning' || nfcStatus === 'processing' ? (
              <ActivityIndicator size="large" color={status.color} />
            ) : (
              <Feather name={status.icon as any} size={48} color={status.color} />
            )}
          </View>
          <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.foreground, marginTop: 12 }}>
            {status.label}
          </Text>
          <Text style={{ fontSize: fontSize.tiny, color: colors.mutedForeground, marginTop: 4, textAlign: 'center' }}>
            {nfcStatus === 'ready' || nfcStatus === 'success' || nfcStatus === 'error'
              ? 'Tap to start NFC scan'
              : nfcStatus === 'unsupported'
                ? 'Use search or manual entry instead'
                : 'Please wait...'}
          </Text>
        </TouchableOpacity>

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
            onPress={startNfcScan}
            disabled={nfcStatus === 'scanning' || nfcStatus === 'processing' || nfcStatus === 'unsupported'}
            data-testid="scan-nfc-action"
            style={{
              flex: 1, height: 52, borderRadius: 16,
              backgroundColor: nfcStatus === 'unsupported' ? colors.muted : colors.primary + '10',
              borderWidth: 1, borderColor: nfcStatus === 'unsupported' ? colors.border : colors.primary + '25',
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: nfcStatus === 'unsupported' ? 0.5 : 1,
            }}
          >
            <Feather name="wifi" size={16} color={nfcStatus === 'unsupported' ? colors.mutedForeground : colors.primary} />
            <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: nfcStatus === 'unsupported' ? colors.mutedForeground : colors.primary }}>
              Scan NFC
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('GuestIntake')}
            data-testid="new-guest-action"
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
          contentContainerStyle={{ paddingBottom: 200 }}
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

      {/* ═══ DEBUG PANEL ═══ */}
      <View style={{
        position: 'absolute', bottom: insets.bottom + 80, left: spacing.lg, right: spacing.lg,
      }}>
        <TouchableOpacity
          onPress={() => setShowDebug(!showDebug)}
          data-testid="toggle-debug-panel"
          style={{
            backgroundColor: colors.card, borderRadius: radius.xl,
            borderWidth: 1, borderColor: colors.border + '60',
            padding: spacing.md,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: fontSize.tiny, fontWeight: '700', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              NFC Debug
            </Text>
            <Feather name={showDebug ? 'chevron-down' : 'chevron-up'} size={14} color={colors.mutedForeground} />
          </View>

          {showDebug && (
            <View style={{ marginTop: spacing.sm, gap: 4 }}>
              <DebugRow colors={colors} label="NFC supported" value={nfcSupported === null ? '...' : nfcSupported ? 'YES' : 'NO'} ok={nfcSupported === true} />
              <DebugRow colors={colors} label="NFC enabled" value={nfcEnabled === null ? '...' : nfcEnabled ? 'YES' : 'NO'} ok={nfcEnabled === true} />
              <DebugRow colors={colors} label="Session status" value={nfcStatus} ok={nfcStatus === 'ready' || nfcStatus === 'success'} />
              <DebugRow colors={colors} label="Last tag UID" value={lastTagUid || '—'} ok={!!lastTagUid} />
              {lastError && <DebugRow colors={colors} label="Last error" value={lastError} ok={false} />}
              <DebugRow colors={colors} label="Platform" value={`${Platform.OS} ${Platform.Version}`} ok={true} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DebugRow({ colors, label, value, ok }: { colors: any; label: string; value: string; ok: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) }}>
        {label}
      </Text>
      <Text style={{
        fontSize: 11, fontWeight: '600', fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
        color: ok ? colors.emerald500 : colors.destructive,
      }}>
        {value}
      </Text>
    </View>
  );
}
