import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const splashLogoSource = require('../assets/images/splash-logo.png');

export default function SplashGateScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const compact = width < 360 || height < 680;
  const logoSize = Math.max(150, Math.min(230, width * 0.62));
  // The source PNG has left/up transparent padding imbalance; compensate to keep optical center.
  const logoVisualOffsetX = Math.round(logoSize * 0.06);
  const logoVisualOffsetY = Math.round(logoSize * 0.012);
  const isNavigating = useRef(false);
  const [isLogoLoaded, setIsLogoLoaded] = useState(false);
  const logoReveal = useRef(new Animated.Value(0)).current;

  const appear = useRef(new Animated.Value(0)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;
  const hintPulse = useRef(new Animated.Value(0)).current;
  const exitProgress = useRef(new Animated.Value(0)).current;

  const sceneOpacity = exitProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const sceneScale = exitProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03],
  });
  const sceneTranslateY = exitProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  const glowOpacity = appear.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.2, 0.28],
  });
  const glowScale = appear.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1.08],
  });

  // Animate logo entrance only after image has fully loaded.
  const logoOpacity = logoReveal.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const logoScale = logoReveal.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });
  const logoEntranceY = logoReveal.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });

  const titleOpacity = appear.interpolate({
    inputRange: [0, 0.52, 1],
    outputRange: [0, 0, 1],
  });
  const titleEntranceY = appear.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });

  const hintBaseOpacity = appear.interpolate({
    inputRange: [0, 0.74, 1],
    outputRange: [0, 0, 1],
  });
  const hintPulseOpacity = hintPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1],
  });

  useEffect(() => {
    isNavigating.current = false;
    setIsLogoLoaded(false);
    logoReveal.setValue(0);
    appear.setValue(0);
    logoFloat.setValue(0);
    hintPulse.setValue(0);
    exitProgress.setValue(0);

    let cancelled = false;
    let rafId = 0;

    const entrance = Animated.timing(appear, {
      toValue: 1,
      duration: 980,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    });

    const logoDrift = Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, {
          toValue: -4,
          duration: 1700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(logoFloat, {
          toValue: 0,
          duration: 1700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(hintPulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(hintPulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    rafId = requestAnimationFrame(() => {
      if (cancelled) return;
      logoDrift.start();
      entrance.start(() => {
        if (cancelled) return;
        pulse.start();
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      pulse.stop();
      logoDrift.stop();
    };
  }, [appear, exitProgress, hintPulse, logoFloat, logoReveal]);

  useEffect(() => {
    if (!isLogoLoaded) return;

    const reveal = Animated.timing(logoReveal, {
      toValue: 1,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    reveal.start();

    return () => {
      reveal.stop();
    };
  }, [isLogoLoaded, logoReveal]);

  const handleGoToAuth = () => {
    if (isNavigating.current) return;
    isNavigating.current = true;

    Animated.timing(exitProgress, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        isNavigating.current = false;
        return;
      }
      router.replace('/auth');
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <Animated.View
        style={[
          styles.scene,
          {
            opacity: sceneOpacity,
            transform: [{ scale: sceneScale }, { translateY: sceneTranslateY }],
          },
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glow,
            {
              width: logoSize * 1.55,
              height: logoSize * 1.55,
              opacity: glowOpacity,
              transform: [{ translateY: -(logoSize * 0.52) }, { scale: glowScale }],
            },
          ]}
        />

        <Animated.View style={[styles.touchArea, compact && styles.touchAreaCompact]}>
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.logoTouch}
            onPress={handleGoToAuth}
            accessibilityRole="button"
            accessibilityLabel="Abrir autenticacao tocando na logo"
          >
            <Animated.View
              style={[
                styles.logoEntranceWrap,
                {
                  opacity: isLogoLoaded ? logoOpacity : 0,
                  transform: [
                    { translateX: logoVisualOffsetX },
                    { translateY: Animated.add(logoEntranceY, logoVisualOffsetY) },
                    { scale: logoScale },
                  ],
                },
              ]}
            >
              <Animated.View style={[styles.logoFloatWrap, { transform: [{ translateY: logoFloat }] }]}>
                <Animated.Image
                  source={splashLogoSource}
                  fadeDuration={0}
                  onLoadEnd={() => setIsLogoLoaded(true)}
                  onError={() => setIsLogoLoaded(true)}
                  resizeMode="contain"
                  style={[styles.logo, { width: logoSize, height: logoSize }]}
                />
              </Animated.View>
            </Animated.View>
          </TouchableOpacity>

          <Animated.Text
            style={[
              styles.appTitle,
              compact && styles.appTitleCompact,
              { opacity: titleOpacity, transform: [{ translateY: titleEntranceY }] },
            ]}
          >
            APRENDER +
          </Animated.Text>

          <Animated.View
            style={[
              styles.hintRow,
              compact && styles.hintRowCompact,
              { opacity: hintBaseOpacity },
            ]}
          >
            <Animated.View style={{ opacity: hintPulseOpacity, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="hand-left-outline" size={16} color="#FFFFFF" />
              <Text style={[styles.hintText, compact && styles.hintTextCompact]}>Toque na logo para continuar</Text>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#59B3FF',
  },
  scene: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  touchArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 4,
  },
  touchAreaCompact: {
    paddingHorizontal: 14,
    gap: 3,
  },
  logoTouch: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  logoEntranceWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFloatWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 230,
    height: 230,
  },
  appTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 0,
  },
  appTitleCompact: {
    fontSize: 21,
    marginTop: 0,
  },
  hintRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  hintRowCompact: {
    marginTop: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  hintText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  hintTextCompact: {
    fontSize: 12,
  },
});
