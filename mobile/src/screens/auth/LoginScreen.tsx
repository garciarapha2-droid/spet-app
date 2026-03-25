/**
 * Login Screen — themed. email + password → JWT auth.
 */
import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Button, Input } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, fontSize } from '../../theme/themes';
import { useAuth } from '../../hooks/useAuth';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Enter email and password');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials');
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
          <Input placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Input placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
          <Button title="Sign In" onPress={handleLogin} loading={loading} style={{ marginTop: spacing.sm }} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
