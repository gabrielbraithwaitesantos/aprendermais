import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn';
import { useThemeColors } from '../../store/themeStore';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useT } from '../../lib/i18n';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEST_ACCOUNT_EMAIL = 'teste@gmail.com';
const TEST_ACCOUNT_PASSWORD = 'teste123';
const isWeb = Platform.OS === 'web';
const useNativeScrollDriver = !isWeb;
const heroSurfaceShadow: ViewStyle = isWeb
  ? ({ boxShadow: '0 30px 60px rgba(15,23,42,0.25)' } as ViewStyle)
  : {
      shadowColor: '#0F172A',
      shadowOpacity: 0.18,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 14 },
      elevation: 10,
    };
const formCardShadow: ViewStyle = isWeb
  ? ({ boxShadow: '0 20px 48px rgba(15,23,42,0.25)' } as ViewStyle)
  : {
      shadowColor: '#0F172A',
      shadowOpacity: 0.25,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 12 },
      elevation: 14,
    };

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const theme = useThemeColors();
  const t = useT();
  const compact = width < 360;
  const isLandscape = width > height;
  const stackedActions = isLandscape || height < 640;
  const denseButtons = compact || width < 430;
  const horizontalPadding = compact ? 16 : 24;
  const scrollY = useRef(new Animated.Value(0)).current;
  const entry = useRef(new Animated.Value(0)).current;
  const atmosphereSlowY = scrollY.interpolate({
    inputRange: [0, 420],
    outputRange: [0, -82],
    extrapolate: 'clamp',
  });
  const atmosphereFastY = scrollY.interpolate({
    inputRange: [0, 420],
    outputRange: [0, -132],
    extrapolate: 'clamp',
  });
  const atmosphereX = scrollY.interpolate({
    inputRange: [0, 420],
    outputRange: [0, 22],
    extrapolate: 'clamp',
  });
  const heroParallaxY = scrollY.interpolate({
    inputRange: [0, 260],
    outputRange: [0, -16],
    extrapolate: 'clamp',
  });
  const heroParallaxScale = scrollY.interpolate({
    inputRange: [0, 260],
    outputRange: [1, 1.035],
    extrapolate: 'clamp',
  });
  const cardParallaxY = scrollY.interpolate({
    inputRange: [0, 260],
    outputRange: [0, -10],
    extrapolate: 'clamp',
  });
  const entryHeaderOpacity = entry.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const entryHeaderY = entry.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });
  const entryHeroOpacity = entry.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 0, 1],
  });
  const entryHeroY = entry.interpolate({
    inputRange: [0, 1],
    outputRange: [26, 0],
  });
  const entryCardOpacity = entry.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0, 1],
  });
  const entryCardY = entry.interpolate({
    inputRange: [0, 1],
    outputRange: [34, 0],
  });
  const { signIn, resendConfirmationEmail, quickSignInTestUser } = useAuthStore.getState();
  const {
    signInWithGoogle,
    loading: googleLoading,
    error: googleError,
    isReady: isGoogleReady,
  } = useGoogleSignIn();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [feedback, setFeedback] = useState<{
    type: 'info' | 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    entry.setValue(0);
    const intro = Animated.timing(entry, {
      toValue: 1,
      duration: 680,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    intro.start();

    return () => {
      intro.stop();
    };
  }, [entry]);

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
      if (error?.code === 'auth/email-not-verified' || error?.message?.includes('Email not confirmed')) {
        setShowResendButton(true);
        setFeedback({
          type: 'info',
          message: 'Enviamos um email de confirmacao quando voce criou a conta. Verifique sua caixa de entrada (e spam).',
        });
        Alert.alert('Email nao confirmado', 'Confirme o endereco de email antes de fazer login.');
      } else {
        Alert.alert('Nao foi possivel entrar', error?.message ?? 'Verifique suas credenciais.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const success = await signInWithGoogle();
    if (success) {
      router.replace('/(tabs)');
    }
  };

  const handleQuickTestLogin = async () => {
    setEmail(TEST_ACCOUNT_EMAIL);
    setPassword(TEST_ACCOUNT_PASSWORD);
    setErrors({});
    setShowResendButton(false);

    try {
      setLoading(true);
      setFeedback(null);
      await quickSignInTestUser();
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Nao foi possivel usar a conta de teste', error?.message ?? 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  };


  const handleResendConfirmation = async () => {
    try {
      setLoading(true);
      await resendConfirmationEmail(email.trim(), password);
      Alert.alert('Email reenviado', 'Confira sua caixa de entrada.');
      setFeedback({
        type: 'success',
        message: `Reenviamos a confirmacao para ${email.trim()}.`,
      });
    } catch (error: any) {
      Alert.alert('Erro', error?.message ?? 'Nao foi possivel reenviar o email.');
      setFeedback({
        type: 'error',
        message: 'Nao conseguimos reenviar agora. Tente mais tarde.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={theme.gradient} style={styles.gradient}>
        <Animated.View pointerEvents="none" style={[styles.atmosphere, { transform: [{ translateY: atmosphereSlowY }] }]}>
          <Animated.View
            style={[
              styles.orb,
              styles.orbOne,
              {
                transform: [{ translateX: atmosphereX }, { translateY: atmosphereFastY }],
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.48)', 'rgba(255,255,255,0.03)']}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.orb,
              styles.orbTwo,
              {
                transform: [
                  { translateX: atmosphereX.interpolate({ inputRange: [0, 22], outputRange: [0, -26] }) },
                  { translateY: atmosphereSlowY },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(191,227,255,0.44)', 'rgba(191,227,255,0.02)']}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.orb,
              styles.orbThree,
              {
                transform: [{ translateY: atmosphereFastY.interpolate({ inputRange: [-132, 0], outputRange: [-34, 0] }) }],
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(56,189,248,0.34)', 'rgba(56,189,248,0.02)']}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <Animated.ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.scroll,
              {
                paddingHorizontal: horizontalPadding,
                paddingTop: compact ? 18 : 24,
                paddingBottom: insets.bottom + 48,
                gap: compact ? 18 : 24,
              },
            ]}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: useNativeScrollDriver }
            )}
          >
            <View style={styles.langRow}>
              <LanguageSwitcher />
            </View>
            <Animated.View
              style={[
                styles.header,
                compact && styles.headerCompact,
                {
                  opacity: entryHeaderOpacity,
                  transform: [{ translateY: entryHeaderY }],
                },
              ]}
            >
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.headerTextBlock}>
                <Text style={styles.appName}>Aprender+</Text>
                <Text style={styles.headerSubtitle}>{t('auth_login_subtitle') ?? 'Bem-vindo de volta!'}</Text>
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.heroWrapper,
                compact && styles.heroWrapperCompact,
                {
                  opacity: entryHeroOpacity,
                  transform: [{ translateY: Animated.add(heroParallaxY, entryHeroY) }, { scale: heroParallaxScale }],
                },
              ]}
            >
              <View style={[styles.heroCircle, compact && styles.heroCircleCompact]}>
                <Image
                  source={require('../../assets/images/hero-logo.png')}
                  resizeMode='contain'
                  style={[styles.heroImage, compact && styles.heroImageCompact]}
                />
              </View>
              <Text style={[styles.heroTitle, compact && styles.heroTitleCompact]}>
                {t('auth_login_title') ?? 'Fazer login'}
              </Text>
              <Text style={[styles.heroDescription, compact && styles.heroDescriptionCompact]}>
                {t('auth_login_subtitle') ?? 'Entre com seus dados.'}
              </Text>
            </Animated.View>
            <Animated.View
              style={{
                opacity: entryCardOpacity,
                transform: [{ translateY: Animated.add(cardParallaxY, entryCardY) }],
              }}
            >
              <View style={[styles.card, compact && styles.cardCompact]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardEyebrow}>Acesso</Text>
                <Text style={styles.cardTitle}>{t('auth_login_title') ?? 'Fazer login'}</Text>
                <Text style={styles.cardSubtitle}>{t('auth_login_subtitle') ?? 'Entre com seus dados.'}</Text>
              </View>

              <Input
                label={t('auth_login_email') ?? 'Email'}
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
                label={t('auth_login_password') ?? 'Senha'}
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

              <View style={[styles.authActions, stackedActions && styles.authActionsStacked]}>
                <Button
                  title="Entrar"
                  onPress={handlePasswordSignIn}
                  loading={loading}
                  disabled={googleLoading}
                  style={[styles.authActionButton, stackedActions && styles.authActionButtonStacked, denseButtons && styles.authActionButtonDense]}
                />
                <Button
                  title={t('auth_login_create') ?? 'Criar conta'}
                  onPress={() => router.push('/auth/signup')}
                  variant="ghost"
                  disabled={loading || googleLoading}
                  style={[styles.authActionButton, stackedActions && styles.authActionButtonStacked, denseButtons && styles.authActionButtonDense]}
                />
              </View>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                onPress={handleGoogleSignIn}
                disabled={!isGoogleReady || loading || googleLoading}
                style={[
                  styles.googleButton,
                  (!isGoogleReady || loading || googleLoading) && styles.googleButtonDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Entrar com Google"
              >
                <Ionicons name="logo-google" size={20} color="#EA4335" />
                <Text style={styles.googleButtonText}>
                  {googleLoading ? 'Conectando com Google...' : 'Entrar com Google'}
                </Text>
              </TouchableOpacity>

              {googleError ? <Text style={styles.googleErrorText}>{googleError}</Text> : null}


              {showResendButton ? (
                <Button
                  title="Reenviar email de confirmacao"
                  onPress={handleResendConfirmation}
                  variant="ghost"
                  disabled={googleLoading}
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

              {__DEV__ ? (
                <View style={styles.quickTestCard}>
                  <Text style={styles.quickTestTitle}>Acesso rapido de teste</Text>
                  <Text style={styles.quickTestHint}>{TEST_ACCOUNT_EMAIL} / {TEST_ACCOUNT_PASSWORD}</Text>
                  <Button
                    title="Entrar com conta de teste"
                    onPress={handleQuickTestLogin}
                    disabled={googleLoading || loading}
                    style={styles.quickTestButton}
                  />
                </View>
              ) : null}

              <Text style={styles.notice}>
                Depois de criar uma conta, confirme o cadastro pelo link enviado ao seu email antes de tentar entrar.
              </Text>

              <View style={styles.linksRow}>
                <Link href="/auth/forgot-password" style={styles.linkText}>
                  {t('auth_login_forgot') ?? 'Esqueci minha senha'}
                </Link>
              </View>
              </View>
            </Animated.View>
          </Animated.ScrollView>
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
  },
  atmosphere: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    overflow: 'hidden',
    opacity: 0.78,
  },
  orbOne: {
    width: 250,
    height: 250,
    top: -52,
    left: -64,
  },
  orbTwo: {
    width: 290,
    height: 290,
    right: -90,
    bottom: 110,
  },
  orbThree: {
    width: 190,
    height: 190,
    top: 220,
    left: 32,
    opacity: 0.62,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerCompact: {
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langRow: {
    alignItems: 'flex-end',
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
  heroWrapperCompact: {
    gap: 12,
  },
  heroCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    ...heroSurfaceShadow,
  },
  heroCircleCompact: {
    width: 102,
    height: 102,
    borderRadius: 51,
  },
  heroImage: {
    width: 82,
    height: 82,
  },
  heroImageCompact: {
    width: 68,
    height: 68,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  heroTitleCompact: {
    fontSize: 22,
  },
  heroDescription: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  heroDescriptionCompact: {
    paddingHorizontal: 12,
  },
  card: {
    width: '100%',
    borderRadius: 30,
    padding: 24,
    gap: 20,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.28)',
    ...formCardShadow,
  },
  cardCompact: {
    borderRadius: 22,
    padding: 16,
    gap: 16,
  },
  cardHeader: {
    gap: 6,
  },
  cardEyebrow: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#2563EB',
    backgroundColor: '#DBEAFE',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  inputSpacing: {
    marginBottom: 12,
  },
  authActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  authActionsStacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  authActionButton: {
    flex: 1,
  },
  authActionButtonStacked: {
    width: '100%',
    flex: 0,
  },
  authActionButtonDense: {
    minHeight: 48,
    zIndex: 10,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: -2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    minHeight: 54,
    paddingHorizontal: 16,
  },
  googleButtonDisabled: {
    opacity: 0.55,
  },
  googleButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  googleErrorText: {
    color: '#B91C1C',
    fontSize: 13,
    marginTop: -8,
    textAlign: 'center',
  },
  secondaryButton: {
    marginTop: -4,
  },
  linksRow: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  linkText: {
    color: '#2563EB',
    fontWeight: '600',
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
  quickTestCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: '#EFF6FF',
    padding: 12,
    gap: 8,
  },
  quickTestTitle: {
    color: '#1E3A8A',
    fontWeight: '700',
    fontSize: 14,
  },
  quickTestHint: {
    color: '#1D4ED8',
    fontSize: 12,
  },
  quickTestButton: {
    marginTop: 4,
  },
});
