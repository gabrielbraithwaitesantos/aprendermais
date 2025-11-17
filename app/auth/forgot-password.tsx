import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../../store/themeStore';
import { useRouter } from 'expo-router';
import { makeRedirectUri } from 'expo-auth-session';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';

export default function ForgotPassword() {
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const router = useRouter();
  const redirectTo = useMemo(() => makeRedirectUri({ scheme: 'meuapp', path: 'auth/callback' }), []);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    const routerAny = router as unknown as { canGoBack?: () => boolean };
    if (typeof routerAny?.canGoBack === 'function' && routerAny.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/auth/login');
  };

  async function handleReset() {
    try {
      setLoading(true);
      const trimmedEmail = email.trim();
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo,
      });
      if (error) throw error;
      Alert.alert('Enviado', 'Confira seu email para redefinir a senha.');
      router.replace('/auth/login');
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Tente novamente');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient colors={theme.gradient} style={{ flex: 1 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 48 }]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.box}>
              <TouchableOpacity onPress={handleBack} style={styles.backRow}>
                <View style={styles.backIcon}>
                  <Ionicons name="chevron-back" size={20} color="#1F2937" />
                </View>
                <Text style={styles.backLabel}>Voltar</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Redefinir senha</Text>
              <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="voce@email.com" />
              <Button title="Enviar link" onPress={handleReset} loading={loading} />
              <Button title="Voltar ao login" onPress={handleBack} variant="ghost" style={styles.backButton} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  box: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backLabel: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  backButton: { marginTop: 16 },
});
