/**
 * Forgot Password Screen — minimal, premium.
 * Logo → title → email → send → back to login
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, fontSize } from '../../theme/themes';
import { Button, Input } from '../../components/ui';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) return;
    setLoading(true);
    // Simulate sending — real implementation would call the API
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setSent(true);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Back button */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ position: 'absolute', top: insets.top + 12, left: 16, zIndex: 10, padding: 8 }}
      >
        <Feather name="arrow-left" size={20} color={colors.foreground} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32 }} keyboardShouldPersistTaps="handled">
        {/* Brand */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 18,
            backgroundColor: colors.primary + '15',
            alignItems: 'center', justifyContent: 'center', marginBottom: 16,
          }}>
            <Text style={{ fontSize: 32, fontWeight: '800', color: colors.primary }}>S</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.foreground, letterSpacing: -0.5 }}>spet.</Text>
          <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginTop: 6 }}>
            {sent ? 'Check your email' : 'Reset your password'}
          </Text>
        </View>

        {sent ? (
          /* Sent confirmation */
          <View style={{ alignItems: 'center', gap: 16 }}>
            <View style={{
              width: 64, height: 64, borderRadius: 32,
              backgroundColor: colors.emerald500 + '15',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Feather name="check" size={28} color={colors.emerald500} />
            </View>
            <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, textAlign: 'center', lineHeight: 20 }}>
              We sent a reset link to{'\n'}
              <Text style={{ fontWeight: '600', color: colors.foreground }}>{email}</Text>
            </Text>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '500', color: colors.primary }}>Back to sign in</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Form */
          <View style={{ gap: 16 }}>
            <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, textAlign: 'center', lineHeight: 20 }}>
              Enter your email and we'll send you a link to reset your password.
            </Text>
            <Input placeholder="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" style={{ height: 52, borderRadius: 16, paddingHorizontal: 20 }} />
            <Button title="Send Reset Link" onPress={handleSend} loading={loading} icon={<Feather name="mail" size={16} color={colors.primaryForeground} />} style={{ height: 44, borderRadius: 14 }} size="md" />
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ alignItems: 'center', marginTop: 8 }}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '500', color: colors.primary }}>Back to sign in</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
