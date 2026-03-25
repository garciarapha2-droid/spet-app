/**
 * Login Screen — themed. email + password → JWT auth.
 * Shows server URL in debug to help diagnose connection issues.
 */
import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { Button, Input } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, fontSize } from '../../theme/themes';
import { useAuth } from '../../hooks/useAuth';
import { API_BASE_URL, API_PREFIX } from '../../config/api';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Enter email and password');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      const isNetwork = err.code === 'NETWORK_ERROR' || err.code === 'TIMEOUT';
      if (isNetwork) {
        Alert.alert(
          'Connection Error',
          `Could not reach the server.\n\n${err.message}`,
          [
            { text: 'OK' },
            { text: 'Show Server Info', onPress: () => setShowDebug(true) },
          ],
        );
      } else {
        Alert.alert('Login Failed', err.message || 'Invalid credentials');
      }
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View style={{ flex: 1, justifyContent: 'center', padding: spacing.xxl }}>
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <Text style={{ fontSize: 36, fontWeight: '800', color: colors.foreground, letterSpacing: -1 }}>
            SPET
          </Text>
          <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginTop: spacing.sm }}>
            Venue Operations
          </Text>
        </View>
        <View style={{ gap: spacing.lg }}>
          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            data-testid="login-email-input"
          />
          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            data-testid="login-password-input"
          />
          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={{ marginTop: spacing.sm }}
            data-testid="login-submit-button"
          />
        </View>

        {/* Server info — always visible as small text, tap for details */}
        <TouchableOpacity
          onPress={() => setShowDebug(!showDebug)}
          activeOpacity={0.6}
          style={{ marginTop: 48, alignItems: 'center' }}
        >
          <Text style={{ fontSize: fontSize.tiny, color: colors.mutedForeground + '60' }}>
            {API_BASE_URL ? new URL(API_BASE_URL).hostname : 'No server configured'}
          </Text>
        </TouchableOpacity>
        {showDebug && (
          <View style={{
            marginTop: spacing.sm,
            padding: spacing.md,
            borderRadius: 8,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            <Text style={{ fontSize: fontSize.tiny, color: colors.mutedForeground, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
              {`Server: ${API_BASE_URL || 'NOT SET'}\nPrefix: ${API_PREFIX}\nLogin: ${API_BASE_URL}${API_PREFIX}/auth/login\nPlatform: ${Platform.OS} ${Platform.Version}`}
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
