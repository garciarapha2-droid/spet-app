/**
 * Login Screen — themed. email + password → JWT auth.
 * Includes connection test for debugging TLS/network issues on device.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button, Input } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, fontSize } from '../../theme/themes';
import { useAuth } from '../../hooks/useAuth';
import { API_BASE_URL, API_PREFIX } from '../../config/api';

type ConnStatus = 'idle' | 'testing' | 'ok' | 'fail';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [connStatus, setConnStatus] = useState<ConnStatus>('idle');
  const [connDetail, setConnDetail] = useState('');
  const [showDebug, setShowDebug] = useState(false);

  const serverUrl = API_BASE_URL || 'NOT CONFIGURED';
  const loginUrl = `${API_BASE_URL}${API_PREFIX}/auth/login`;

  // Auto-test connection on mount
  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setConnStatus('testing');
    setConnDetail('Testing...');
    const start = Date.now();

    try {
      // Step 1: Simple GET to check if server is reachable
      const healthUrl = `${API_BASE_URL}${API_PREFIX}/auth/login`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(healthUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: 'test' }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const elapsed = Date.now() - start;
      const body = await response.text();

      if (response.status === 401 || response.status === 422 || response.status === 200) {
        // Any of these means the server is reachable and responding
        setConnStatus('ok');
        setConnDetail(`OK (HTTP ${response.status}, ${elapsed}ms)`);
      } else {
        setConnStatus('fail');
        setConnDetail(`HTTP ${response.status} (${elapsed}ms)\n${body.substring(0, 200)}`);
      }
    } catch (err: any) {
      const elapsed = Date.now() - start;
      setConnStatus('fail');
      if (err.name === 'AbortError') {
        setConnDetail(`TIMEOUT after ${elapsed}ms\nServer unreachable at:\n${serverUrl}`);
      } else {
        setConnDetail(`${err.message || 'Unknown error'}\n(${elapsed}ms)\nURL: ${serverUrl}`);
      }
    }
  };

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
      Alert.alert(
        isNetwork ? 'Connection Error' : 'Login Failed',
        `${err.message || 'Unknown error'}${err.url ? '\n\nURL: ' + err.url : ''}`,
      );
    }
    setLoading(false);
  };

  const statusIcon = connStatus === 'ok' ? 'check-circle' : connStatus === 'fail' ? 'x-circle' : connStatus === 'testing' ? 'loader' : 'circle';
  const statusColor = connStatus === 'ok' ? colors.success : connStatus === 'fail' ? colors.destructive : colors.mutedForeground;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing.xxl }}>
        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <Text style={{ fontSize: 36, fontWeight: '800', color: colors.foreground, letterSpacing: -1 }}>
            SPET
          </Text>
          <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginTop: spacing.sm }}>
            Venue Operations
          </Text>
        </View>

        {/* Login Form */}
        <View style={{ gap: spacing.lg }}>
          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={{ marginTop: spacing.sm }}
          />
        </View>

        {/* Connection Status */}
        <View style={{ marginTop: 40, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={testConnection}
            activeOpacity={0.6}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.lg,
              borderRadius: 20,
              backgroundColor: connStatus === 'ok' ? colors.successBg : connStatus === 'fail' ? colors.destructiveBg : colors.card,
            }}
          >
            <Feather name={statusIcon as any} size={14} color={statusColor} />
            <Text style={{ fontSize: fontSize.xs, color: statusColor, fontWeight: '600' }}>
              {connStatus === 'idle' ? 'Test Connection' : connStatus === 'testing' ? 'Testing...' : connStatus === 'ok' ? 'Server Connected' : 'Connection Failed'}
            </Text>
          </TouchableOpacity>

          {/* Tap to show details */}
          <TouchableOpacity onPress={() => setShowDebug(!showDebug)} style={{ marginTop: spacing.sm }}>
            <Text style={{ fontSize: fontSize.tiny, color: colors.mutedForeground + '60' }}>
              {new URL(serverUrl).hostname}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Debug Panel */}
        {showDebug && (
          <View style={{
            marginTop: spacing.md,
            padding: spacing.md,
            borderRadius: 8,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            <Text style={{
              fontSize: fontSize.tiny,
              color: colors.mutedForeground,
              fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
              lineHeight: 16,
            }}>
              {`Server: ${serverUrl}\nPrefix: ${API_PREFIX}\nLogin endpoint:\n${loginUrl}\n\nConnection: ${connDetail}\n\nPlatform: ${Platform.OS} ${Platform.Version}\nCode version: 2026-03-25-v3`}
            </Text>
            <TouchableOpacity
              onPress={testConnection}
              style={{
                marginTop: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: 8,
                backgroundColor: colors.primaryBg,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: colors.primary }}>
                Re-test Connection
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
