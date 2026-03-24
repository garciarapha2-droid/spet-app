/**
 * Safe NFC wrapper — prevents crash in Expo Go.
 *
 * In Expo Go: native NFC module doesn't exist → we export safe stubs.
 * In Dev Build: native module loads normally → full NFC functionality.
 *
 * Detection: expo-constants appOwnership === 'expo' means Expo Go.
 */
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

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

// Stub that returns graceful "not supported" for Expo Go
const NfcManagerStub: NfcManagerStub = {
  isSupported: async () => false,
  start: async () => {},
  requestTechnology: async () => {
    throw new Error('NFC is not available in Expo Go. Use a Development Build.');
  },
  getTag: async () => null,
  cancelTechnologyRequest: async () => {},
};

// Dynamically load the real module only in dev builds
let NfcManagerInstance: NfcManagerStub = NfcManagerStub;
let nfcAvailable = false;

if (!isExpoGo) {
  try {
    // require() instead of import to avoid bundler trying to resolve in Expo Go
    const realModule = require('react-native-nfc-manager');
    NfcManagerInstance = realModule.default || realModule;
    nfcAvailable = true;
  } catch {
    // Module not available — stay on stub
  }
}

export const NfcManager = NfcManagerInstance;
export { nfcAvailable, isExpoGo };
