import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../store/themeStore';
import { useRouter, Link } from 'expo-router';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn';

const HERO_STATS = [
  { value: '120+', label: 'aulas guiadas' },
  { value: '4.9/5', label: 'avaliacao dos alunos' },
  { value: '24/7', label: 'mentoria e suporte' },
];

const BENEFIT_TAGS = [
  { icon: 'sparkles-outline' as const, label: 'Projetos reais' },
  { icon: 'flash-outline' as const, label: 'Planos personalizados' },
  { icon: 'chatbubble-ellipses-outline' as const, label: 'Comunidade ativa' },
];

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const { signUp } = useAuthStore.getState();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const googleConfigured = useMemo(() => {
    const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
    return Boolean(
      extra?.googleClientId ||
      extra?.googleOAuthEnabled ||
      process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID ||
      process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_SECRET
    );
  }, []);

  const { isReady: googleReady, loading: oauthLoading, error: googleError, signInWithGoogle } = useGoogleSignIn();
  const googleAvailable = googleConfigured && googleReady;

  useEffect(() => {
    if (googleError) {
      Alert.alert('Entrar com Google', googleError);
    }
  }, [googleError]);

  const handleBack = () => {
    const routerAny = router as unknown as { canGoBack?: () => boolean };
    if (typeof routerAny?.canGoBack === 'function' && routerAny.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/auth/login');
  };

  async function handleSignUp() {
    try {
      const nextErrors: { name?: string; email?: string; password?: string } = {};
      if (!name.trim()) nextErrors.name = 'Informe seu nome';
      if (!email.trim()) nextErrors.email = 'Informe seu email';
      if (!password) nextErrors.password = 'Informe uma senha';

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email && !emailRegex.test(email)) nextErrors.email = 'Email invalido';

      if (password && password.length < 6) nextErrors.password = 'Minimo 6 caracteres';

      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        Alert.alert('Complete os campos', 'Corrija os campos destacados.');
        return;
      }

      setLoading(true);
      await signUp(email.trim(), password, name.trim());
      Alert.alert('Pronto!', 'Verifique seu email para confirmar a conta.', [
        { text: 'OK', onPress: () => router.push('/auth/login') },
      ]);
    } catch (e: any) {
      let errorMessage = 'Tente novamente';

      if (e.message?.includes('Email address')) {
        errorMessage = 'Email invalido ou nao permitido. Tente com outro email.';
      } else if (e.message?.includes('password')) {
        errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres.';
      }

      Alert.alert('Erro ao criar conta', errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={theme.gradient} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Criar conta</Text>
          <View style={styles.headerSpacer} />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
          >
            <View style={styles.formWrapper}>
              <View style={styles.heroSection}>
                <View style={styles.heroLogoStack}>
                  <View style={styles.heroCircle}>
                    <Image source={require('../../assets/images/hero-logo.png')} style={styles.heroLogo} />
                  </View>
                </View>
                <Text style={styles.heroEyebrow}>Comunidade MeuApp</Text>
                <Text style={styles.heroHeading}>Comece sua jornada com conteudos premium e mentorias ao vivo</Text>
                <Text style={styles.heroSubtitle}>
                  Mais de 20 mil estudantes ja melhoraram a rotina de estudos com os planos personalizados do MeuApp.
                </Text>

                <View style={styles.statsRow}>
                  {HERO_STATS.map((stat) => (
                    <View key={stat.label} style={styles.statCard}>
                      <Text style={styles.statValue}>{stat.value}</Text>
                      <Text style={styles.statLabel}>{stat.label}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.badgesRow}>
                  {BENEFIT_TAGS.map((item) => (
                    <View key={item.label} style={styles.badgePill}>
                      <Ionicons name={item.icon} size={16} color="#FFFFFF" />
                      <Text style={styles.badgePillText}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.cardOuter}>
                <LinearGradient colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.72)']} style={styles.cardGradient}>
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardLabel}>Passo 1</Text>
                      <Text style={styles.cardTitle}>Seus dados essenciais</Text>
                      <Text style={styles.cardDescription}>
                        Informe os dados abaixo para montarmos seu perfil personalizado dentro do aplicativo.
                      </Text>
                    </View>

                    <View style={styles.inputGroup}>
                      <Input
                        label="Nome completo"
                        value={name}
                        onChangeText={(t) => {
                          setName(t);
                          if (errors.name) setErrors({ ...errors, name: undefined });
                        }}
                        placeholder="Seu nome"
                        style={styles.input}
                        error={errors.name}
                      />
                      <Input
                        label="Email"
                        value={email}
                        onChangeText={(t) => {
                          setEmail(t);
                          if (errors.email) setErrors({ ...errors, email: undefined });
                        }}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        placeholder="voce@email.com"
                        style={styles.input}
                        error={errors.email}
                      />
                      <Input
                        label="Senha"
                        value={password}
                        onChangeText={(t) => {
                          setPassword(t);
                          if (errors.password) setErrors({ ...errors, password: undefined });
                        }}
                        secureTextEntry
                        placeholder="********"
                        style={styles.input}
                        error={errors.password}
                      />
                    </View>

                    <View style={styles.tipCard}>
                      <Ionicons name="shield-checkmark-outline" size={18} color="#2563EB" />
                      <Text style={styles.tipText}>
                        Depois de criar uma conta, confirme o cadastro pelo link enviado ao seu email para liberar o acesso completo.
                      </Text>
                    </View>

                    <Button title="Criar conta" onPress={handleSignUp} loading={loading} style={styles.signupButton} />

                    <Text style={styles.termsText}>
                      Ao continuar voce aceita nossos termos de uso e confirma que leu a politica de privacidade.
                    </Text>

                    <View style={styles.divider}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>ou continue com</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    {googleAvailable ? (
                      <TouchableOpacity
                        style={[styles.googleButton, oauthLoading && styles.googleButtonDisabled]}
                        activeOpacity={0.85}
                        onPress={signInWithGoogle}
                        disabled={oauthLoading || !googleAvailable}
                      >
                        {oauthLoading ? (
                          <ActivityIndicator size="small" color="#111827" />
                        ) : (
                          <Ionicons name="logo-google" size={20} color="#111827" />
                        )}
                        <Text style={styles.googleButtonText}>
                          {oauthLoading ? 'Conectando...' : 'Criar conta com Google'}
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    <View style={styles.footer}>
                      <Text style={styles.footerText}>Ja tem conta?</Text>
                      <Link href="/auth/login" style={styles.footerLink}>
                        Entrar
                      </Link>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 42,
    height: 42,
  },
  content: {
    paddingHorizontal: 24,
    flexGrow: 1,
  },
  formWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: 28,
  },
  heroSection: {
    width: '100%',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroLogoStack: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    alignSelf: 'center',
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
    elevation: 12,
  },
  heroLogo: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  heroHeading: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 12,
    lineHeight: 32,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(15,23,42,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    gap: 6,
  },
  badgePillText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  cardOuter: {
    width: '100%',
    borderRadius: 32,
    padding: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  cardGradient: {
    borderRadius: 31,
    padding: 1,
  },
  cardContent: {
    borderRadius: 30,
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.96)',
    gap: 18,
  },
  cardHeader: {
    gap: 6,
  },
  cardLabel: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  cardDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  inputGroup: {
    gap: 14,
  },
  input: {
    marginBottom: 0,
  },
  tipCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(37,99,235,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.25)',
  },
  tipText: {
    flex: 1,
    color: '#1E3A8A',
    fontSize: 13,
    lineHeight: 18,
  },
  signupButton: {
    marginTop: 4,
  },
  termsText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 13,
    color: '#6B7280',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  googleButtonDisabled: {
    opacity: 0.7,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  footerText: {
    color: '#4B5563',
    fontSize: 14,
  },
  footerLink: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 14,
  },
});



