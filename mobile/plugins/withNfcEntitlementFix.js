/**
 * withNfcEntitlementFix — Expo config plugin
 *
 * Runs AFTER react-native-nfc-manager plugin and patches the iOS entitlements
 * to remove "NDEF" from com.apple.developer.nfc.readersession.formats.
 *
 * Required because:
 *   - react-native-nfc-manager plugin injects ["NDEF", "TAG"]
 *   - Xcode/SDK 26.0 disallows NDEF in this entitlement (Apple error 90778)
 *   - Only "TAG" is valid for our NFC Tag Reader usage
 */
const { withEntitlementsPlist } = require('expo/config-plugins');

module.exports = function withNfcEntitlementFix(config) {
  return withEntitlementsPlist(config, (mod) => {
    mod.modResults['com.apple.developer.nfc.readersession.formats'] = ['TAG'];
    return mod;
  });
};
