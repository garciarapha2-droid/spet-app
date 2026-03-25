/**
 * NFC Bridge — Pure stubs for v1.0 release.
 *
 * NFC native module removed from iOS build to resolve Apple
 * entitlement rejection (NDEF disallowed on SDK 26.0, error 90778).
 *
 * All NFC screens will show "NFC not available" gracefully.
 * NFC will be re-added in a future update with correct entitlement config.
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

export const NfcManager = {
  isSupported: async () => false,
  start: async () => {},
  requestTechnology: async () => {
    throw new Error('NFC is not available in this version.');
  },
  getTag: async () => null,
  cancelTechnologyRequest: async () => {},
};

export const nfcAvailable = false;
export const isExpoGo = false;
