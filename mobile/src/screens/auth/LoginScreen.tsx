/**
 * Login Screen — themed, iPhone-first.
 * Brand: SPET — Power your venue. All in one place.
 *
 * Connection test and login both use direct fetch with identical patterns
 * to ensure consistency (if test works, login works).
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, KeyboardAvoidingView, Platform, Alert,
  TouchableOpacity, ScrollView, Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, fontSize } from '../../theme/themes';
import { Button, Input } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { API_BASE_URL, API_PREFIX } from '../../config/api';

type ConnStatus = 'idle' | 'testing' | 'ok' | 'fail';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connStatus, setConnStatus] = useState<ConnStatus>('idle');
  const [connDetail, setConnDetail] = useState('');
  const [showDebug, setShowDebug] = useState(false);

  const serverHost = API_BASE_URL ? (() => { try { return new URL(API_BASE_URL).hostname; } catch { return 'unknown'; } })() : 'NOT SET';

  useEffect(() => { testConnection(); }, []);

  const testConnection = async () => {
    setConnStatus('testing');
    setConnDetail('');
    const start = Date.now();
    const url = `${API_BASE_URL}${API_PREFIX}/auth/login?_cb=${Date.now()}`;
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache',
        },
        body: JSON.stringify({ email: 'healthcheck@test.com', password: 'x' }),
      });
      const elapsed = Date.now() - start;
      const ct = resp.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        setConnStatus('ok');
        setConnDetail(`JSON OK (HTTP ${resp.status}, ${elapsed}ms)`);
      } else {
        const text = await resp.text().catch(() => '');
        setConnStatus('fail');
        setConnDetail(`Non-JSON (HTTP ${resp.status}, ${elapsed}ms)\n${text.substring(0, 100)}`);
      }
    } catch (err: any) {
      const elapsed = Date.now() - start;
      setConnStatus('fail');
      setConnDetail(`${err.name === 'AbortError' ? 'Timeout' : err.message} (${elapsed}ms)`);
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
      Alert.alert('Login Failed', err.message || 'Unknown error');
    }
    setLoading(false);
  };

  const statusColor = connStatus === 'ok' ? colors.success : connStatus === 'fail' ? colors.destructive : colors.mutedForeground;
  const statusIcon = connStatus === 'ok' ? 'check-circle' : connStatus === 'fail' ? 'alert-circle' : 'loader';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Theme toggle */}
        <View style={{ position: 'absolute', top: 56, right: 24 }}>
          <ThemeToggle />
        </View>

        {/* Brand */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 18,
            backgroundColor: colors.primary + '15',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <Text style={{ fontSize: 32, fontWeight: '800', color: colors.primary }}>S</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.foreground, letterSpacing: -0.5 }}>
            spet.
          </Text>
          <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginTop: 6 }}>
            Sign in to your account
          </Text>
        </View>

        {/* Form */}
        <View style={{ gap: 16 }}>
          <View>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.primary, marginBottom: 8 }}>Email</Text>
            <Input
              placeholder="you@company.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={{ height: 52, borderRadius: 16, paddingHorizontal: 20 }}
            />
          </View>
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.primary }}>Password</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={{ fontSize: fontSize.tiny, color: colors.primary }}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
            <View>
              <Input
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={{ height: 52, borderRadius: 16, paddingHorizontal: 20, paddingRight: 48 }}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 16, top: 14 }}
              >
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>
          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={{ height: 48, borderRadius: 14, marginTop: 8 }}
          />
        </View>

        {/* Connection Status */}
        <View style={{ marginTop: 40, alignItems: 'center' }}>
          <TouchableOpacity onPress={testConnection} style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
            backgroundColor: connStatus === 'ok' ? colors.success + '10' : connStatus === 'fail' ? colors.destructive + '10' : colors.card,
          }}>
            <Feather name={statusIcon as any} size={12} color={statusColor} />
            <Text style={{ fontSize: 11, color: statusColor, fontWeight: '600' }}>
              {connStatus === 'idle' ? 'Test Connection' : connStatus === 'testing' ? 'Testing...' : connStatus === 'ok' ? 'Server Connected' : 'Connection Failed — Tap to retry'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowDebug(!showDebug)} style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 10, color: colors.mutedForeground + '40' }}>{serverHost}</Text>
          </TouchableOpacity>
        </View>

        {showDebug && (
          <View style={{
            marginTop: 12, padding: 16, borderRadius: 10,
            backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
          }}>
            <Text style={{
              fontSize: 10, color: colors.mutedForeground, lineHeight: 15,
              fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
            }}>
              {`Server: ${API_BASE_URL}\nPrefix: ${API_PREFIX}\nLogin: ${API_BASE_URL}${API_PREFIX}/auth/login\nConn: ${connDetail}\nPlatform: ${Platform.OS} ${Platform.Version}\nBuild: 2026-03-25-v4`}
            </Text>
          </View>
        )}

        {/* Footer */}
        <Text style={{
          textAlign: 'center', fontSize: fontSize.tiny, color: colors.mutedForeground,
          marginTop: 32, paddingBottom: 24,
        }}>
          Power your venue. All in one place.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ThemeToggle() {
  const { colors, isDark, setThemeMode, mode } = useTheme();
  const toggle = () => setThemeMode(isDark ? 'light' : 'dark');
  return (
    <TouchableOpacity
      onPress={toggle}
      style={{
        padding: 10, borderRadius: 14,
        backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border + '50',
      }}
    >
      <Feather
        name={isDark ? 'sun' : 'moon'}
        size={16}
        color={colors.foreground}
      />
    </TouchableOpacity>
  );
}
