/**
 * NFC Bridge — LAZY wrapper around react-native-nfc-manager.
 *
 * CRITICAL: The native module is NOT loaded at import time.
 * It is loaded on first METHOD CALL only (when user navigates to NFC screen).
 * This prevents startup crashes if the native module has initialization issues.
 */

export const NfcTech = {
  Ndef: 'Ndef',
  NfcA: 'NfcA',
  NfcB: 'NfcB',
  NfcF: 'NfcF',
  NfcV: 'NfcV',
  IsoDep: 'IsoDep',
  MifareClassic: 'MifareClassic',
  MifareUltralight: 'MifareUltralight',
  MifareIOS: 'MifareIOS',
  Iso15693IOS: 'Iso15693IOS',
  FelicaIOS: 'FelicaIOS',
} as const;

// ─── Lazy native module loader ──────────────────────────
// require('react-native-nfc-manager') is NEVER called at module level.
// It only runs when getNativeManager() is first invoked.

let _native: any = null;
let _resolved = false;
let _available = false;

function getNativeManager(): any {
  if (_resolved) return _native;
  _resolved = true;

  try {
    // Check if we're in Expo Go (native NFC doesn't exist there)
    const Constants = require('expo-constants');
    const ownership = Constants?.default?.appOwnership ?? Constants?.appOwnership;
    if (ownership === 'expo') {
      _native = null;
      return null;
    }
  } catch {
    // expo-constants failed — assume production, try NFC anyway
  }

  try {
    const mod = require('react-native-nfc-manager');
    const mgr = mod?.default ?? mod;
    if (mgr && typeof mgr.isSupported === 'function') {
      _native = mgr;
      _available = true;
    }
  } catch {
    _native = null;
  }

  return _native;
}

// ─── Public API (lazy proxy) ────────────────────────────
// Every method defers to the native module only when called.
// If native module is unavailable, returns safe fallback values.

export const NfcManager = {
  isSupported: async (): Promise<boolean> => {
    const mgr = getNativeManager();
    if (!mgr) return false;
    try {
      return await mgr.isSupported();
    } catch {
      return false;
    }
  },

  start: async (): Promise<void> => {
    const mgr = getNativeManager();
    if (!mgr) return;
    try {
      await mgr.start();
    } catch {
      // Swallow — NFC init failed, screens will show "not available"
    }
  },

  requestTechnology: async (tech: string): Promise<void> => {
    const mgr = getNativeManager();
    if (!mgr) throw new Error('NFC is not available on this device.');
    return mgr.requestTechnology(tech);
  },

  getTag: async (): Promise<{ id: string } | null> => {
    const mgr = getNativeManager();
    if (!mgr) return null;
    return mgr.getTag();
  },

  cancelTechnologyRequest: async (): Promise<void> => {
    const mgr = getNativeManager();
    if (!mgr) return;
    try {
      await mgr.cancelTechnologyRequest();
    } catch {}
  },
};

// These are also lazy — computed on first access via getter
export function isNfcAvailable(): boolean {
  getNativeManager(); // ensure resolved
  return _available;
}

// Kept for backwards compat with screens that read these
export const nfcAvailable = false; // Always false at import time
export const isExpoGo = false;     // Always false at import time

// Screens should use isNfcAvailable() instead of nfcAvailable for runtime check
