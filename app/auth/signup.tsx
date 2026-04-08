import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../store/themeStore';
import { useRouter, Link } from 'expo-router';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useT } from '../../lib/i18n';

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

const isWeb = Platform.OS === 'web';
const useNativeScrollDriver = !isWeb;
const heroCircleShadow: ViewStyle = isWeb
  ? ({ boxShadow: '0 28px 55px rgba(10,74,163,0.25)' } as ViewStyle)
  : {
      shadowColor: '#0A4AA3',
      shadowOpacity: 0.25,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 12 },
      elevation: 12,
    };

const heroPanelShadow: ViewStyle = isWeb
  ? ({ boxShadow: '0 24px 52px rgba(10, 39, 99, 0.26)' } as ViewStyle)
  : {
      shadowColor: '#0A2763',
      shadowOpacity: 0.25,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 10 },
      elevation: 11,
    };

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const theme = useThemeColors();
  const { signUp } = useAuthStore.getState();
  const t = useT();
  const scrollY = useRef(new Animated.Value(0)).current;
  const entry = useRef(new Animated.Value(0)).current;
  const compact = width < 360;
  const medium = width < 390;
  const atmosphereSlowY = scrollY.interpolate({
    inputRange: [0, 420],
    outputRange: [0, -76],
    extrapolate: 'clamp',
  });
  const atmosphereFastY = scrollY.interpolate({
    inputRange: [0, 420],
    outputRange: [0, -130],
    extrapolate: 'clamp',
  });
  const atmosphereX = scrollY.interpolate({
    inputRange: [0, 420],
    outputRange: [0, 24],
    extrapolate: 'clamp',
  });
  const cardParallaxY = scrollY.interpolate({
    inputRange: [0, 280],
    outputRange: [0, -10],
    extrapolate: 'clamp',
  });
  const heroParallaxY = scrollY.interpolate({
    inputRange: [0, 280],
    outputRange: [0, -18],
    extrapolate: 'clamp',
  });
  const heroParallaxScale = scrollY.interpolate({
    inputRange: [0, 280],
    outputRange: [1, 1.03],
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
  const entryCardOpacity = entry.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 0, 1],
  });
  const entryCardY = entry.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });
  const entryHeroOpacity = entry.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0, 0, 1],
  });
  const entryHeroY = entry.interpolate({
    inputRange: [0, 1],
    outputRange: [26, 0],
  });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  useEffect(() => {
    entry.setValue(0);
    const intro = Animated.timing(entry, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    intro.start();

    return () => {
      intro.stop();
    };
  }, [entry]);

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
              colors={['rgba(255,255,255,0.48)', 'rgba(255,255,255,0.02)']}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.orb,
              styles.orbTwo,
              {
                transform: [
                  { translateX: atmosphereX.interpolate({ inputRange: [0, 24], outputRange: [0, -24] }) },
                  { translateY: atmosphereSlowY },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(167,243,255,0.4)', 'rgba(167,243,255,0.02)']}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
          <Animated.View style={[styles.orb, styles.orbThree, { transform: [{ translateY: atmosphereFastY }] }]}>
            <LinearGradient
              colors={['rgba(125,211,252,0.34)', 'rgba(125,211,252,0.02)']}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
        </Animated.View>

        <Animated.View
          style={[
            styles.header,
            {
              paddingTop: insets.top + (compact ? 8 : 12),
              paddingHorizontal: compact ? 14 : 20,
              marginBottom: compact ? 8 : 12,
              opacity: entryHeaderOpacity,
              transform: [{ translateY: entryHeaderY }],
            },
          ]}
        >
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, compact && styles.headerTitleCompact]}>
            {t('auth_signup_title') ?? 'Criar conta'}
          </Text>
          <View style={styles.headerSpacer} />
        </Animated.View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <Animated.ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: useNativeScrollDriver }
            )}
            contentContainerStyle={[
              styles.content,
              {
                paddingHorizontal: compact ? 16 : 24,
                paddingBottom: insets.bottom + 80,
                gap: compact ? 10 : 12,
              },
            ]}
          >
            <View style={styles.langRow}>
              <LanguageSwitcher />
            </View>
            <View style={[styles.formWrapper, { gap: compact ? 20 : 28 }]}>
              <Animated.View
                style={{
                  width: '100%',
                  opacity: entryCardOpacity,
                  transform: [{ translateY: Animated.add(cardParallaxY, entryCardY) }],
                }}
              >
                <View style={styles.cardOuter}>
                <LinearGradient colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.72)']} style={styles.cardGradient}>
                  <View style={[styles.cardContent, compact && styles.cardContentCompact]}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardLabel}>{t('auth_signup_title') ?? 'Criar conta'}</Text>
                      <Text style={[styles.cardTitle, compact && styles.cardTitleCompact]}>
                        {t('auth_signup_title') ?? 'Criar conta'}
                      </Text>
                      <Text style={styles.cardDescription}>
                        {t('auth_signup_subtitle') ?? 'Informe os dados para criar sua conta.'}
                      </Text>
                    </View>

                    <View style={styles.inputGroup}>
                      <Input
                        label={t('auth_signup_name') ?? 'Nome completo'}
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
                        label={t('auth_signup_email') ?? 'Email'}
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
                        label={t('auth_signup_password') ?? 'Senha'}
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

                    <Button title={t('auth_signup_button') ?? 'Criar conta'} onPress={handleSignUp} loading={loading} style={styles.signupButton} />

                    <Text style={styles.termsText}>
                      {t('auth_signup_terms') ?? 'Ao continuar voce aceita nossos termos de uso e confirma que leu a politica de privacidade.'}
                    </Text>

                    <View style={styles.footer}>
                      <Text style={styles.footerText}>Ja possui conta?</Text>
                      <Link href="/auth/login" style={styles.footerLink}>
                        Entrar
                      </Link>
                    </View>
                  </View>
                </LinearGradient>
                </View>
              </Animated.View>

              <Animated.View
                style={{
                  width: '100%',
                  opacity: entryHeroOpacity,
                  transform: [{ translateY: Animated.add(heroParallaxY, entryHeroY) }, { scale: heroParallaxScale }],
                }}
              >
                <View
                  style={[
                    styles.heroSection,
                    {
                      padding: compact ? 16 : 24,
                      marginTop: compact ? 14 : 24,
                    },
                  ]}
                >
                  <View style={styles.heroLogoStack}>
                    <View style={[styles.heroCircle, compact && styles.heroCircleCompact]}>
                      <Image
                        source={require('../../assets/images/hero-logo.png')}
                        resizeMode='contain'
                        style={[styles.heroLogo, compact && styles.heroLogoCompact]}
                      />
                    </View>
                  </View>
                  <Text style={styles.heroEyebrow}>Comunidade Aprender+</Text>
                  <Text style={[styles.heroHeading, compact && styles.heroHeadingCompact]}>
                    Comece sua jornada com conteudos premium e mentorias ao vivo
                  </Text>
                  <Text style={[styles.heroSubtitle, compact && styles.heroSubtitleCompact]}>
                    Mais de 20 mil estudantes ja melhoraram a rotina de estudos com os planos personalizados do Aprender+.
                  </Text>

                  <View style={[styles.statsRow, medium && styles.statsRowWrap]}>
                    {HERO_STATS.map((stat) => (
                      <View key={stat.label} style={[styles.statCard, medium && styles.statCardWrap]}>
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
              </Animated.View>
            </View>
          </Animated.ScrollView>
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
    marginBottom: 12,
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
  headerTitleCompact: {
    fontSize: 16,
  },
  headerSpacer: {
    width: 42,
    height: 42,
  },
  content: {
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
    width: 270,
    height: 270,
    top: -58,
    left: -70,
  },
  orbTwo: {
    width: 300,
    height: 300,
    right: -92,
    bottom: 72,
  },
  orbThree: {
    width: 200,
    height: 200,
    left: 22,
    top: 260,
    opacity: 0.64,
  },
  langRow: {
    alignItems: 'flex-end',
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
    backgroundColor: 'rgba(9, 36, 87, 0.24)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    marginTop: 24,
    ...heroPanelShadow,
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
    ...heroCircleShadow,
  },
  heroCircleCompact: {
    width: 102,
    height: 102,
    borderRadius: 51,
  },
  heroLogo: {
    width: 70,
    height: 70,
  },
  heroLogoCompact: {
    width: 60,
    height: 60,
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
  heroHeadingCompact: {
    fontSize: 22,
    lineHeight: 28,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  heroSubtitleCompact: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  statsRowWrap: {
    flexWrap: 'wrap',
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
  statCardWrap: {
    flexBasis: '47%',
    minWidth: 132,
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
  cardContentCompact: {
    borderRadius: 24,
    padding: 16,
    gap: 14,
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
  cardTitleCompact: {
    fontSize: 20,
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



