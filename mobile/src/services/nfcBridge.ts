/**
 * Safe NFC wrapper — prevents crash in any environment.
 *
 * In Expo Go: native NFC module doesn't exist → safe stubs.
 * In Production: loads native module with full crash protection.
 *
 * CRITICAL: All top-level code is wrapped in try-catch to prevent
 * startup crashes if the native NFC module fails to initialize.
 */

// NFC tech types (safe to declare, they're just strings)
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

// Stub interface
interface NfcManagerStub {
  isSupported: () => Promise<boolean>;
  start: () => Promise<void>;
  requestTechnology: (tech: string) => Promise<void>;
  getTag: () => Promise<{ id: string } | null>;
  cancelTechnologyRequest: () => Promise<void>;
}

// Stub that returns graceful "not supported"
const NfcManagerStubImpl: NfcManagerStub = {
  isSupported: async () => false,
  start: async () => {},
  requestTechnology: async () => {
    throw new Error('NFC is not available on this device.');
  },
  getTag: async () => null,
  cancelTechnologyRequest: async () => {},
};

let NfcManagerInstance: NfcManagerStub = NfcManagerStubImpl;
let nfcAvailable = false;
let isExpoGo = false;

// Wrapped in top-level try-catch — a crash here must NEVER kill the app
try {
  const Constants = require('expo-constants');
  const ownership = Constants?.default?.appOwnership ?? Constants?.appOwnership;
  isExpoGo = ownership === 'expo';

  if (!isExpoGo) {
    try {
      const realModule = require('react-native-nfc-manager');
      const mgr = realModule?.default ?? realModule;
      if (mgr && typeof mgr.isSupported === 'function') {
        NfcManagerInstance = mgr;
        nfcAvailable = true;
      }
    } catch {
      // Native NFC module not available — stay on stub
    }
  }
} catch {
  // expo-constants or NFC module failed entirely — stay on stub
}

export const NfcManager = NfcManagerInstance;
export { nfcAvailable, isExpoGo };
