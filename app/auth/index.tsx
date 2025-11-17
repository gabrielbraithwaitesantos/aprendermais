import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../components/ui/Button';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../store/themeStore';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

const HIGHLIGHTS = [
  { icon: 'flash-outline', text: 'Planos semanais prontos' },
  { icon: 'book-outline', text: 'Materiais revisados por mentores' },
  { icon: 'chatbubble-ellipses-outline', text: 'Suporte em tempo real' },
];

export default function Onboarding() {
  const router = useRouter();
  const theme = useThemeColors();
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient colors={theme.gradient} style={styles.gradient}>
        <View pointerEvents="none" style={styles.blobs}>
          <LinearGradient colors={['rgba(255,255,255,0.65)', 'transparent']} style={[styles.blob, styles.blobOne]} />
          <LinearGradient colors={['rgba(124,58,237,0.35)', 'transparent']} style={[styles.blob, styles.blobTwo]} />
        </View>

        <View style={styles.content}>
          <View style={styles.badge}>
            <Ionicons name="sparkles-outline" size={16} color="#4338CA" />
            <Text style={styles.badgeText}>Estudar nunca foi tao facil</Text>
          </View>

          <Text style={styles.title}>Seu guia completo para o vestibular</Text>
          <Text style={styles.subtitle}>
            Trilhas inteligentes, revisoes e simulados para voce chegar confiante no dia da prova.
          </Text>

          <View style={styles.heroWrapper}>
            <Image
              source={{ uri: 'https://images.pexels.com/photos/4144222/pexels-photo-4144222.jpeg' }}
              style={styles.hero}
            />
            <View style={styles.heroOverlay}>
              <Text style={styles.overlayTitle}>+120 aulas premium</Text>
              <Text style={styles.overlaySubtitle}>Estude no horario ideal para voce</Text>
            </View>
          </View>

          <View style={styles.highlights}>
            {HIGHLIGHTS.map((item) => (
              <View key={item.text} style={styles.highlightItem}>
                <View style={styles.highlightIcon}>
                  <Ionicons name={item.icon as any} size={16} color="#111827" />
                </View>
                <Text style={styles.highlightText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.buttons}>
            <Button title="Entrar" onPress={() => router.push('/auth/login')} style={styles.primaryButton} />
            <Button
              title="Criar conta"
              onPress={() => router.push('/auth/signup')}
              variant="ghost"
              style={styles.secondaryButton}
            />
          </View>

          <Text style={styles.disclaimer}>
            Ao continuar voce concorda com os termos de uso. Nao possui cadastro?{' '}
            <Link href="/auth/signup" style={styles.disclaimerLink}>
              Cadastre-se aqui
            </Link>
          </Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1, paddingHorizontal: 28, paddingBottom: 32, justifyContent: 'center' },
  blobs: {
    position: 'absolute',
    inset: 0,
  },
  blob: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.6,
  },
  blobOne: {
    top: 40,
    left: -20,
  },
  blobTwo: {
    bottom: 60,
    right: -30,
  },
  content: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 32,
    padding: 24,
    gap: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  badgeText: {
    color: '#4338CA',
    fontWeight: '700',
    fontSize: 13,
  },
  title: { fontSize: 32, fontWeight: '800', color: '#fff', lineHeight: 38 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.85)', lineHeight: 23 },
  heroWrapper: {
    borderRadius: 26,
    overflow: 'hidden',
    position: 'relative',
  },
  hero: { width: '100%', height: height * 0.28 },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  overlayTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  overlaySubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
  },
  highlights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  highlightIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightText: { color: '#fff', fontWeight: '600' },
  buttons: { flexDirection: 'row', gap: 12 },
  primaryButton: { flex: 1 },
  secondaryButton: { flex: 1 },
  disclaimer: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center' },
  disclaimerLink: { color: '#fff', fontWeight: '700' },
});
