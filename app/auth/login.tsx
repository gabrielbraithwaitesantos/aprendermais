import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useThemeColors } from '../../store/themeStore';
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useThemeColors();
  const { signIn, resendConfirmationEmail } = useAuthStore.getState();

  const googleConfigured = useMemo(() => {
    const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
    return Boolean(
      extra?.googleClientId ||
        extra?.googleOAuthEnabled ||
        process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID ||
        process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_SECRET
    );
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [feedback, setFeedback] = useState<{
    type: 'info' | 'success' | 'error';
    message: string;
  } | null>(null);
  const { isReady: googleReady, loading: oauthLoading, error: googleError, signInWithGoogle } = useGoogleSignIn();
  const googleAvailable = googleConfigured && googleReady;

  useEffect(() => {
    if (googleError) {
      Alert.alert('Login com Google', googleError);
      setFeedback({
        type: 'error',
        message: googleError,
      });
    }
  }, [googleError]);

  const validateEmail = (value: string) => {
    if (!value.trim()) return 'Informe seu email';
    if (!EMAIL_REGEX.test(value.trim())) return 'Email invalido';
    return undefined;
  };

  const handlePasswordSignIn = async () => {
    const emailError = validateEmail(email);
    const passwordError = password ? undefined : 'Informe sua senha';

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      Alert.alert('Complete os campos', 'Corrija as informacoes antes de continuar.');
      return;
    }

    try {
      setLoading(true);
      setFeedback(null);
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (error: any) {
      if (error?.message?.includes('Email not confirmed')) {
        setShowResendButton(true);
        setFeedback({
          type: 'info',
          message: 'Enviamos um email de confirmação quando você criou a conta. Verifique sua caixa de entrada (e spam).',
        });
        Alert.alert('Email nao confirmado', 'Confirme o endereco de email antes de fazer login.');
      } else {
        Alert.alert('Nao foi possivel entrar', error?.message ?? 'Verifique suas credenciais.');
      }
    } finally {
      setLoading(false);
    }
  };


  const handleResendConfirmation = async () => {
    try {
      setLoading(true);
      await resendConfirmationEmail(email.trim());
      Alert.alert('Email reenviado', 'Confira sua caixa de entrada.');
      setFeedback({
        type: 'success',
        message: `Reenviamos a confirmação para ${email.trim()}.`,
      });
    } catch (error: any) {
      Alert.alert('Erro', error?.message ?? 'Nao foi possivel reenviar o email.');
      setFeedback({
        type: 'error',
        message: 'Não conseguimos reenviar agora. Tente mais tarde.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={theme.gradient} style={styles.gradient}>
        <View pointerEvents="none" style={styles.decorations}>
          <LinearGradient
            colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.05)']}
            style={[styles.blob, styles.blobTopLeft]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <LinearGradient
            colors={['rgba(14,165,233,0.35)', 'transparent']}
            style={[styles.blob, styles.blobCenter]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <LinearGradient
            colors={['rgba(139,92,246,0.45)', 'rgba(59,130,246,0.1)']}
            style={[styles.blob, styles.blobBottomRight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.8, y: 1 }}
          />
        </View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 48 }]}
          >
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.headerTextBlock}>
                <Text style={styles.appName}>MeuApp</Text>
                <Text style={styles.headerSubtitle}>Bem-vindo de volta!</Text>
              </View>
            </View>

            <View style={styles.heroWrapper}>
              <View style={styles.heroCircle}>
                <Image
                  source={require('../../assets/images/hero-logo.png')}
                  style={styles.heroImage}
                />
              </View>
              <Text style={styles.heroTitle}>Estude no seu ritmo</Text>
              <Text style={styles.heroDescription}>
                Acesse aulas, trilhas e desafios em poucos segundos. Utilize um email válido, pois a confirmação é enviada para sua caixa de entrada.
              </Text>
            </View>
            <LinearGradient
              colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0.05)']}
              style={styles.cardOuter}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <BlurView intensity={45} tint="light" style={styles.card}>
                <View style={styles.badgeRow}>
                  <View style={[styles.badge, styles.badgeSecondary]}>
                    <Ionicons name="shield-checkmark-outline" size={16} color="#0EA5E9" />
                    <Text style={styles.badgeText}>Login seguro</Text>
                  </View>
                </View>

                <Input
                  label="Email"
                  value={email}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="voce@email.com"
                  onChangeText={(value) => {
                    setEmail(value);
                    if (errors.email) {
                      setErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }}
                  error={errors.email}
                  style={styles.inputSpacing}
                />

                <Input
                  label="Senha"
                  value={password}
                  placeholder="********"
                  secureTextEntry
                  onChangeText={(value) => {
                    setPassword(value);
                    if (errors.password) {
                      setErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                  error={errors.password}
                  style={styles.inputSpacing}
                />

                <Button
                  title="Entrar com senha"
                  onPress={handlePasswordSignIn}
                  loading={loading}
                />


              {showResendButton ? (
                <Button
                  title="Reenviar email de confirmacao"
                  onPress={handleResendConfirmation}
                  variant="ghost"
                  style={styles.secondaryButton}
                />
              ) : null}

              {feedback ? (
                <View
                  style={[
                    styles.feedbackCard,
                    feedback.type === 'success' && styles.feedbackSuccess,
                    feedback.type === 'error' && styles.feedbackError,
                    feedback.type === 'info' && styles.feedbackInfo,
                  ]}
                >
                  <Ionicons
                    name={
                      feedback.type === 'success'
                        ? 'mail-open-outline'
                        : feedback.type === 'error'
                        ? 'alert-circle-outline'
                        : 'information-circle-outline'
                    }
                    size={18}
                    color={
                      feedback.type === 'error'
                        ? '#B91C1C'
                        : feedback.type === 'success'
                        ? '#065F46'
                        : '#1E3A8A'
                    }
                  />
                  <Text
                    style={[
                      styles.feedbackText,
                      feedback.type === 'error' && { color: '#991B1B' },
                      feedback.type === 'success' && { color: '#065F46' },
                    ]}
                  >
                    {feedback.message}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.notice}>
                Depois de criar uma conta, confirme o cadastro pelo link enviado ao seu email antes de tentar entrar.
              </Text>

                <View style={styles.linksRow}>
                  <Link href="/auth/forgot-password" style={styles.linkText}>
                    Esqueci minha senha
                  </Link>
                  <Text style={styles.dot}>•</Text>
                  <Link href="/auth/signup" style={styles.linkText}>
                    Criar conta
                  </Link>
                </View>

                {googleAvailable ? (
                  <View style={styles.oauthBlock}>
                    <Text style={styles.oauthLabel}>Ou continue com</Text>
                    <Button
                      title="Entrar com Google"
                      onPress={signInWithGoogle}
                      loading={oauthLoading}
                      variant="ghost"
                      disabled={!googleAvailable}
                    />
                  </View>
                ) : null}
              </BlurView>
            </LinearGradient>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#1E40AF',
  },
  gradient: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 24,
  },
  decorations: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: 240,
    transform: [{ rotate: '12deg' }],
  },
  blobTopLeft: {
    width: 260,
    height: 260,
    top: -120,
    left: -80,
  },
  blobCenter: {
    width: 220,
    height: 220,
    top: 160,
    right: -60,
  },
  blobBottomRight: {
    width: 280,
    height: 280,
    bottom: -140,
    left: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextBlock: {
    flex: 1,
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  heroWrapper: {
    alignItems: 'center',
    gap: 16,
  },
  heroCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A4AA3',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  heroImage: {
    width: 82,
    height: 82,
    resizeMode: 'contain',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  heroDescription: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  cardOuter: {
    borderRadius: 28,
    padding: 1,
  },
  card: {
    borderRadius: 27,
    padding: 24,
    gap: 20,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  badgeSecondary: {
    backgroundColor: 'rgba(14,165,233,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.35)',
  },
  badgeText: {
    fontSize: 13,
    color: '#1E293B',
  },
  inputSpacing: {
    marginBottom: 12,
  },
  secondaryButton: {
    marginTop: -4,
  },
  linksRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  linkText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  dot: {
    color: '#D1D5DB',
  },
  oauthBlock: {
    marginTop: 12,
    gap: 12,
  },
  oauthLabel: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
  },
  notice: {
    marginTop: 8,
    fontSize: 13,
    color: '#4B5563',
    textAlign: 'center',
  },
  feedbackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 4,
    backgroundColor: 'rgba(59,130,246,0.14)',
  },
  feedbackSuccess: {
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  feedbackError: {
    backgroundColor: 'rgba(248,113,113,0.2)',
  },
  feedbackInfo: {
    backgroundColor: 'rgba(59,130,246,0.14)',
  },
  feedbackText: {
    flex: 1,
    fontSize: 13,
    color: '#1E3A8A',
  },
});
