import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Tabs, Link } from 'expo-router';
import { BlurView } from 'expo-blur';
import {
  Platform,
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
  Easing,
  Text,
  BackHandler,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const isWeb = Platform.OS === 'web';
const tabBarShadow: ViewStyle = isWeb
  ? ({ boxShadow: '0 20px 45px rgba(15,23,42,0.2)' } as ViewStyle)
  : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 10,
    };
const popoverShadow: ViewStyle = isWeb
  ? ({ boxShadow: '0 20px 50px rgba(15,23,42,0.35)' } as ViewStyle)
  : {
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 50,
    };

export default function TabLayout() {
  const [moreOpen, setMoreOpen] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const popoverOpacity = useRef(new Animated.Value(0)).current;
  const popoverTranslate = useRef(new Animated.Value(8)).current;
  const moreScale = useRef(new Animated.Value(1)).current;
  const moreRotate = useRef(new Animated.Value(0)).current;

  const openMore = useCallback(() => {
    setMoreOpen(true);
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 1, duration: 150, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
      Animated.spring(popoverTranslate, { toValue: 0, useNativeDriver: true, friction: 7, tension: 120 }),
      Animated.timing(popoverOpacity, { toValue: 1, duration: 180, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
      Animated.spring(moreScale, { toValue: 1.08, useNativeDriver: true, friction: 4, tension: 120 }),
      Animated.timing(moreRotate, { toValue: 1, duration: 180, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
    ]).start(() => {
      Animated.spring(moreScale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 120 }).start();
    });
  }, [overlayOpacity, popoverTranslate, popoverOpacity, moreScale, moreRotate]);

  const closeMore = useCallback(() => {
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 0, duration: 150, useNativeDriver: true, easing: Easing.in(Easing.quad) }),
      Animated.timing(popoverOpacity, { toValue: 0, duration: 120, useNativeDriver: true, easing: Easing.in(Easing.quad) }),
      Animated.timing(popoverTranslate, { toValue: 8, duration: 120, useNativeDriver: true, easing: Easing.in(Easing.quad) }),
      Animated.timing(moreRotate, { toValue: 0, duration: 180, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
    ]).start(() => {
      setMoreOpen(false);
      moreScale.setValue(1);
    });
  }, [overlayOpacity, popoverOpacity, popoverTranslate, moreRotate, moreScale]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (moreOpen) {
        closeMore();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [closeMore, moreOpen]);

  // Web only: hide any fallback select/overflow rendered by the tablist
  useEffect(() => {
    if (!isWeb) return;
    const styleId = 'hide-tab-select';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = `
nav[role="tablist"] select,
nav[role="tablist"] option,
nav[role="tablist"] button[aria-label*="More"],
nav[role="tablist"] button[aria-label*="more"],
nav[role="tablist"] button[aria-label*="Dropdown"],
nav[role="tablist"] button[aria-label*="dropdown"],
nav[role="tablist"] [role="combobox"],
nav[role="tablist"] [aria-haspopup="listbox"] {
  display: none !important;
}
      `;
      document.head.appendChild(styleEl);
    }
    return () => {
      if (styleEl?.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
    };
  }, []);

  // Extra guard: remove any stray dropdown/arrow nodes created by the web Tabs renderer
  useEffect(() => {
    if (!isWeb) return;

    const arrowTexts = ['?', '?', '?', '?', '?', '?', '?'];
    const hideEl = (node: Element) => {
      const el = node as HTMLElement;
      el.style.display = 'none';
      el.style.width = '0px';
      el.style.height = '0px';
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
    };

    const hideDropdowns = () => {
      const selectors = [
        'nav[role="tablist"] select',
        'nav[role="tablist"] option',
        'nav[role="tablist"] button:not([role="tab"])',
        'nav[role="tablist"] summary',
        'nav[role="tablist"] details',
        'nav[role="tablist"] [role="combobox"]',
        'nav[role="tablist"] [aria-haspopup]',
        'nav[role="tablist"] .r-flex-13awgt0',
        'nav[role="tablist"] .css-view-g5y9jx.r-flex-13awgt0',
      ];
      document.querySelectorAll(selectors.join(',')).forEach(hideEl);

      document.querySelectorAll('nav[role="tablist"] *').forEach((el) => {
        const text = (el.textContent || '').trim();
        if (arrowTexts.includes(text)) {
          hideEl(el);
          if (el.parentElement) hideEl(el.parentElement);
        }
      });
    };

    hideDropdowns();
    const observer = new MutationObserver(hideDropdowns);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          tabBarStyle: {
            position: 'absolute',
            bottom: 20,
            left: 20,
            right: 20,
            height: 70,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 35,
            borderTopWidth: 0,
            overflow: 'hidden',
            ...tabBarShadow,
          },
          tabBarItemStyle: { paddingVertical: 6 },
          tabBarBackground: () =>
            Platform.OS === 'ios' ? (
              <BlurView intensity={80} style={StyleSheet.absoluteFill} />
            ) : null,
          tabBarActiveTintColor: '#4F46E5',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarShowLabel: false,
          tabBarIconStyle: { marginTop: 6 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="trilha"
          options={{
            title: 'Trilha',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                <Ionicons name={focused ? 'map' : 'map-outline'} size={24} color={color} />
              </View>
            ),
          }}
        />
        {/* Centro: botao Mais (abre popover, nao navega) */}
        <Tabs.Screen
          name="mais"
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              if (moreOpen) closeMore(); else openMore();
            },
          }}
          options={{
            title: 'Mais',
            tabBarIcon: ({ color, focused }) => (
              <Animated.View
                style={[
                  styles.iconContainer,
                  styles.iconAlignFix,
                  (moreOpen || focused) && styles.iconContainerActive,
                  {
                    transform: [
                      { scale: moreScale },
                      { rotate: moreRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] }) },
                    ],
                  },
                ]}
              >
                <Ionicons name="ellipsis-horizontal-circle-outline" size={24} color={moreOpen ? '#4F46E5' : color} />
              </Animated.View>
            ),
          }}
        />
        <Tabs.Screen
          name="quiz"
          options={{
            title: 'Quiz',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                <Ionicons name={focused ? 'help-circle' : 'help-circle-outline'} size={24} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="videos"
          options={{
            title: 'Videos',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                <Ionicons name={focused ? 'play-circle' : 'play-circle-outline'} size={24} color={color} />
              </View>
            ),
          }}
        />
        {/* Esconder rotas que nao devem aparecer como abas */}
        <Tabs.Screen name="biblioteca" options={{ href: null }} />
        <Tabs.Screen name="calendario" options={{ href: null }} />
        <Tabs.Screen name="perfil" options={{ href: null }} />
        <Tabs.Screen name="materias/[id]" options={{ href: null }} />
        <Tabs.Screen name="trilhas" options={{ href: null }} />
        <Tabs.Screen name="quiz/[year]" options={{ href: null }} />
      </Tabs>

      {/* Popover ancorado ao tab bar (sem navegar de pagina) */}
      {moreOpen && (
        <>
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
            <Pressable style={{ flex: 1 }} onPress={closeMore} />
          </Animated.View>
          <Animated.View style={[styles.popover, { opacity: popoverOpacity, transform: [{ translateY: popoverTranslate }] }]}>
            <Text style={styles.sheetTitle}>Mais opcoes</Text>

            <Link href="/(tabs)/calendario" asChild>
              <TouchableOpacity style={styles.sheetItem} onPress={closeMore}>
                <Ionicons name="calendar-outline" size={20} color="#111827" />
                <Text style={styles.sheetItemText}>Calendario</Text>
              </TouchableOpacity>
            </Link>

            <Link href="/(tabs)/biblioteca" asChild>
              <TouchableOpacity style={styles.sheetItem} onPress={closeMore}>
                <Ionicons name="library-outline" size={20} color="#111827" />
                <Text style={styles.sheetItemText}>Biblioteca</Text>
              </TouchableOpacity>
            </Link>

            <Link href="/(tabs)/quiz" asChild>
              <TouchableOpacity style={styles.sheetItem} onPress={closeMore}>
                <Ionicons name="document-text-outline" size={20} color="#111827" />
                <Text style={styles.sheetItemText}>Quiz & Provas</Text>
              </TouchableOpacity>
            </Link>

            <View style={styles.sheetGroupTitleWrap}>
              <Text style={styles.sheetGroupTitle}>Materias</Text>
            </View>
            <View style={styles.row}>
              <Link href="/(tabs)/materias/artes" asChild>
                <TouchableOpacity style={styles.pill} onPress={closeMore}>
                  <Ionicons name="color-palette-outline" size={16} color="#F59E0B" />
                  <Text style={styles.pillText}>Artes</Text>
                </TouchableOpacity>
              </Link>
              <Link href="/(tabs)/materias/ciencia" asChild>
                <TouchableOpacity style={styles.pill} onPress={closeMore}>
                  <Ionicons name="flask-outline" size={16} color="#3B82F6" />
                  <Text style={styles.pillText}>Ciencia</Text>
                </TouchableOpacity>
              </Link>
            </View>
            <View style={styles.row}>
              <Link href="/(tabs)/materias/matematica" asChild>
                <TouchableOpacity style={styles.pill} onPress={closeMore}>
                  <Ionicons name="calculator-outline" size={16} color="#10B981" />
                  <Text style={styles.pillText}>Matematica</Text>
                </TouchableOpacity>
              </Link>
              <Link href="/(tabs)/materias/letras" asChild>
                <TouchableOpacity style={styles.pill} onPress={closeMore}>
                  <Ionicons name="book-outline" size={16} color="#8B5CF6" />
                  <Text style={styles.pillText}>Letras</Text>
                </TouchableOpacity>
              </Link>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={closeMore}>
              <Ionicons name="close" size={20} color="#111827" />
              <Text style={styles.closeText}>Fechar</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  iconContainerActive: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  iconAlignFix: {},
  moreLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 999,
    elevation: 50,
  },
  popover: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    zIndex: 1000,
    ...popoverShadow,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  sheetItemText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  sheetGroupTitleWrap: { marginTop: 8 },
  sheetGroupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: { flexDirection: 'row', gap: 8, marginTop: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  pillText: { fontSize: 13, color: '#111827', fontWeight: '600' },
  closeBtn: {
    marginTop: 16,
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  closeText: { fontSize: 14, color: '#111827', fontWeight: '700' },
});
