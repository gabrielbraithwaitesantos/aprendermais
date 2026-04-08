import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Platform,
  TouchableOpacity,
  useWindowDimensions,
  Animated,
  Easing,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '../../store/themeStore';

const isWeb = Platform.OS === 'web';
const webPointerBlock = isWeb ? ({ pointerEvents: 'none' } as ViewStyle) : null;
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const panelShadow: ViewStyle = isWeb
  ? ({ boxShadow: '0 30px 70px rgba(8, 44, 110, 0.28)' } as ViewStyle)
  : {
      shadowColor: '#0A2E75',
      shadowOpacity: 0.28,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 14 },
      elevation: 18,
    };

const heroShadow: ViewStyle = isWeb
  ? ({ boxShadow: '0 20px 44px rgba(12, 33, 78, 0.24)' } as ViewStyle)
  : {
      shadowColor: '#122C63',
      shadowOpacity: 0.24,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 10 },
      elevation: 12,
    };

const primaryCtaShadow: ViewStyle = isWeb
  ? ({ boxShadow: '0 14px 30px rgba(96, 165, 250, 0.48)' } as ViewStyle)
  : {
      shadowColor: '#60A5FA',
      shadowOpacity: 0.46,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 7 },
      elevation: 10,
    };

const FEATURES = [
  { icon: 'flash-outline' as const, text: 'Planos semanais prontos' },
  { icon: 'book-outline' as const, text: 'Materiais revisados por mentores' },
  { icon: 'chatbubble-ellipses-outline' as const, text: 'Suporte em tempo real' },
];

export default function Onboarding() {
  const router = useRouter();
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const scrollY = useRef(new Animated.Value(0)).current;
  const entry = useRef(new Animated.Value(0)).current;
  const enterCtaPulse = useRef(new Animated.Value(0)).current;

  const compact = width < 380;
  const extraCompact = width < 340;
  const isLandscape = width > height;
  const scrollSlack = isLandscape ? 32 : 56;

  const ctaStacked = extraCompact || (isLandscape && width < 720);
  const heroHeight = Math.max(
    isLandscape ? 118 : 150,
    Math.min(isLandscape ? 170 : 226, height * (isLandscape ? 0.28 : 0.24))
  );
  const heroLogoSize = Math.max(72, Math.min(132, heroHeight * 0.52));

  const atmosphereSlowY = scrollY.interpolate({
    inputRange: [0, 420],
    outputRange: [0, -80],
    extrapolate: 'clamp',
  });

  const atmosphereFastY = scrollY.interpolate({
    inputRange: [0, 420],
    outputRange: [0, -130],
    extrapolate: 'clamp',
  });

  const atmosphereX = scrollY.interpolate({
    inputRange: [0, 420],
    outputRange: [0, 26],
    extrapolate: 'clamp',
  });

  const panelLift = scrollY.interpolate({
    inputRange: [0, 260],
    outputRange: [0, -12],
    extrapolate: 'clamp',
  });

  const panelScale = scrollY.interpolate({
    inputRange: [0, 260],
    outputRange: [1, 0.986],
    extrapolate: 'clamp',
  });

  const heroY = scrollY.interpolate({
    inputRange: [0, 280],
    outputRange: [0, -30],
    extrapolate: 'clamp',
  });

  const heroScale = scrollY.interpolate({
    inputRange: [0, 280],
    outputRange: [1, 1.035],
    extrapolate: 'clamp',
  });

  const titleY = scrollY.interpolate({
    inputRange: [0, 180],
    outputRange: [0, -10],
    extrapolate: 'clamp',
  });

  const entryOpacity = entry.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const entryPanelY = entry.interpolate({
    inputRange: [0, 1],
    outputRange: [22, 0],
  });

  const entryPanelScale = entry.interpolate({
    inputRange: [0, 1],
    outputRange: [0.97, 1],
  });

  const entryCtaOpacity = entry.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0, 0, 1],
  });

  const entryCtaY = entry.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  const enterCtaPulseScale = enterCtaPulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.035, 1],
  });

  const enterCtaPulseOpacity = enterCtaPulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.96, 1, 0.96],
  });

  useEffect(() => {
    entry.setValue(0);
    Animated.timing(entry, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entry]);

  useEffect(() => {
    enterCtaPulse.setValue(0);
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(enterCtaPulse, {
          toValue: 1,
          duration: 1050,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(enterCtaPulse, {
          toValue: 0,
          duration: 1050,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();

    return () => {
      pulse.stop();
    };
  }, [enterCtaPulse]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.gradient[1] }]}> 
      <LinearGradient colors={theme.gradient} style={styles.gradient}>
        <Animated.View
          pointerEvents={!isWeb ? 'none' : undefined}
          style={[
            styles.atmosphere,
            webPointerBlock,
            {
              transform: [{ translateY: atmosphereSlowY }],
            },
          ]}
        >
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
              colors={['rgba(255, 234, 167, 0.58)', 'rgba(255, 234, 167, 0.02)']}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.orb,
              styles.orbTwo,
              {
                transform: [{ translateX: atmosphereX.interpolate({ inputRange: [0, 26], outputRange: [0, -22] }) }, { translateY: atmosphereSlowY }],
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(167, 243, 255, 0.44)', 'rgba(167, 243, 255, 0.02)']}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
        </Animated.View>

        <Animated.ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {
              minHeight: height + scrollSlack,
              paddingHorizontal: compact ? 14 : 22,
              paddingTop: compact ? 16 : 20,
              paddingBottom: insets.bottom + (compact ? 14 : 18),
            },
          ]}
          bounces
          alwaysBounceVertical
          overScrollMode="always"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
        >
          <Animated.View
            style={[
              styles.panel,
              {
                borderRadius: compact ? 24 : 32,
                padding: compact ? 16 : 22,
                gap: compact ? 12 : 16,
                opacity: entryOpacity,
                transform: [
                  { translateY: entryPanelY },
                  { translateY: panelLift },
                  { scale: entryPanelScale },
                  { scale: panelScale },
                ],
              },
            ]}
          >
            <View style={styles.kickerRow}>
              <View style={styles.kickerBubble}>
                <Ionicons name="sparkles-outline" size={15} color="#1E40AF" />
                <Text style={styles.kickerText}>Estudar nunca foi tao facil</Text>
              </View>
            </View>

            <Animated.Text
              style={[
                styles.title,
                {
                  fontSize: compact ? 32 : 36,
                  lineHeight: compact ? 36 : 40,
                  transform: [{ translateY: titleY }],
                },
              ]}
            >
              Seu guia completo para o vestibular
            </Animated.Text>

            <Text
              style={[
                styles.subtitle,
                {
                  fontSize: compact ? 15 : 16,
                  lineHeight: compact ? 22 : 24,
                },
              ]}
            >
              Trilhas inteligentes, revisoes e simulados para voce chegar confiante no dia da prova.
            </Text>

            <Animated.View
              style={{
                opacity: entryCtaOpacity,
                transform: [{ translateY: entryCtaY }],
              }}
            >
              <View style={[styles.ctaRow, ctaStacked && styles.ctaRowStacked]}>
                <AnimatedTouchable
                  activeOpacity={0.88}
                  onPress={() => router.push('/auth/login')}
                  style={[
                    styles.ctaButtonBase,
                    styles.enterCta,
                    ctaStacked && styles.ctaStacked,
                    compact && styles.ctaButtonBaseCompact,
                    {
                      opacity: enterCtaPulseOpacity,
                      transform: [{ scale: enterCtaPulseScale }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#8FD0FF', '#5CB5FF', '#3B82F6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.ctaButtonFill}
                  >
                    <View style={styles.ctaPrimaryLabelRow}>
                      <Ionicons name="log-in-outline" size={17} color="#FFFFFF" />
                      <Text style={[styles.ctaTextBase, styles.enterCtaText, compact && styles.ctaTextCompact]}>Entrar</Text>
                    </View>
                  </LinearGradient>
                </AnimatedTouchable>

                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => router.push('/auth/signup')}
                  style={[
                    styles.ctaButtonBase,
                    styles.signupCta,
                    ctaStacked && styles.ctaStacked,
                    compact && styles.ctaButtonBaseCompact,
                  ]}
                >
                  <View style={styles.ctaButtonFill}>
                    <Text style={[styles.ctaTextBase, styles.signupCtaText, compact && styles.ctaTextCompact]}>Criar conta</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </Animated.View>

            <Text style={[styles.legalText, compact && styles.legalTextCompact]}>
              Ao continuar voce concorda com os termos de uso. Nao possui cadastro?{' '}
              <Text style={styles.legalLink} onPress={() => router.push('/auth/signup')}>
                Cadastre-se aqui
              </Text>
            </Text>

            <Animated.View
              style={[
                styles.hero,
                {
                  height: heroHeight,
                  transform: [{ translateY: heroY }, { scale: heroScale }],
                },
              ]}
            >
              <LinearGradient colors={['#E9F3FF', '#CEE3FF']} style={styles.heroBase}>
                <Image
                  source={require('../../assets/images/hero-logo.png')}
                  resizeMode="contain"
                  style={{ width: heroLogoSize, height: heroLogoSize }}
                />
              </LinearGradient>
              <View style={styles.heroOverlay}>
                <Text style={styles.heroOverlayTitle}>+120 aulas premium</Text>
                <Text style={styles.heroOverlaySubtitle}>Estude no horario ideal para voce</Text>
              </View>
            </Animated.View>

            <View style={styles.featureList}>
              {FEATURES.map((item) => (
                <View key={item.text} style={styles.featureItem}>
                  <View style={styles.featureIconWrap}>
                    <Ionicons name={item.icon} size={15} color="#0F172A" />
                  </View>
                  <Text style={styles.featureText}>{item.text}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </Animated.ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  atmosphere: {
    position: 'absolute',
    inset: 0,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.72,
  },
  orbOne: {
    width: 280,
    height: 280,
    top: -40,
    left: -54,
  },
  orbTwo: {
    width: 300,
    height: 300,
    right: -90,
    bottom: 28,
  },
  panel: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    ...panelShadow,
  },
  kickerRow: {
    alignItems: 'flex-start',
  },
  kickerBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.82)',
  },
  kickerText: {
    color: '#1E40AF',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    color: '#F8FAFC',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: 'rgba(247,250,255,0.88)',
    fontWeight: '400',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  ctaRowStacked: {
    flexDirection: 'column',
  },
  ctaStacked: {
    width: '100%',
    flex: 0,
  },
  ctaButtonBase: {
    flex: 1,
    minHeight: 56,
    borderRadius: 16,
    overflow: 'visible',
  },
  ctaButtonBaseCompact: {
    minHeight: 52,
  },
  ctaButtonFill: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPrimaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  ctaTextBase: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  ctaTextCompact: {
    fontSize: 15,
  },
  enterCta: {
    flex: 1.2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.98)',
    ...primaryCtaShadow,
  },
  enterCtaText: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  signupCta: {
    flex: 0.95,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.68)',
  },
  signupCtaText: {
    color: '#EAF4FF',
  },
  legalText: {
    color: 'rgba(235,245,255,0.76)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  legalTextCompact: {
    fontSize: 11,
    lineHeight: 16,
  },
  legalLink: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  hero: {
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    ...heroShadow,
  },
  heroBase: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.36)',
  },
  heroOverlayTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
  },
  heroOverlaySubtitle: {
    color: 'rgba(244, 249, 255, 0.86)',
    fontSize: 12,
    marginTop: 2,
  },
  featureList: {
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  featureIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    color: '#F8FBFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
