/**
 * NFC Bridge — Safe wrapper around react-native-nfc-manager.
 *
 * Loads the native module in production builds.
 * Falls back to stubs in Expo Go or if native module fails to load.
 * All access is guarded — never crashes the app.
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

interface NfcManagerType {
  isSupported: () => Promise<boolean>;
  start: () => Promise<void>;
  requestTechnology: (tech: string) => Promise<void>;
  getTag: () => Promise<{ id: string } | null>;
  cancelTechnologyRequest: () => Promise<void>;
}

const NfcStub: NfcManagerType = {
  isSupported: async () => false,
  start: async () => {},
  requestTechnology: async () => {
    throw new Error('NFC is not available on this device.');
  },
  getTag: async () => null,
  cancelTechnologyRequest: async () => {},
};

let NfcManagerInstance: NfcManagerType = NfcStub;
let nfcAvailable = false;
let isExpoGo = false;

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
  // expo-constants failed — stay on stub
}

export const NfcManager = NfcManagerInstance;
export { nfcAvailable, isExpoGo };
