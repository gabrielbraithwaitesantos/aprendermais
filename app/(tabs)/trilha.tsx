import React from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../store/themeStore';
import { useRouter } from 'expo-router';
import { useStudyTracks } from '../../hooks/useStudyTracks';

export default function TrilhaScreen() {
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const router = useRouter();
  const { tracks, loading, error } = useStudyTracks();

  const heroTrack = tracks[0];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={theme.gradient} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 140 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.maxWidth}>
            <View style={styles.header}>
              <Text style={styles.title}>Trilhas inteligentes</Text>
              <Text style={styles.subtitle}>Sequencias curtas alimentadas pelos dados reais do Supabase.</Text>
            </View>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#FFFFFF" />
                <Text style={styles.loadingText}>Carregando trilhas...</Text>
              </View>
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : tracks.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>Sem trilhas cadastradas</Text>
                <Text style={styles.emptySubtitle}>
                  Insira novas trilhas na tabela study_tracks do Supabase para que seus alunos vejam aqui.
                </Text>
              </View>
            ) : (
              <>
                {heroTrack ? (
                  <TouchableOpacity
                    style={[styles.heroCard, { backgroundColor: heroTrack.color_hex || '#4F46E5' }]}
                    activeOpacity={0.9}
                    onPress={() => router.push({ pathname: '/(tabs)/trilhas/[id]', params: { id: heroTrack.slug } })}
                  >
                    <View style={styles.heroBadge}>
                      <Ionicons name="map-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.heroBadgeText}>Trilha em destaque</Text>
                    </View>
                    <Text style={styles.heroTitle}>{heroTrack.title}</Text>
                    <Text style={styles.heroDescription} numberOfLines={2}>
                      {heroTrack.description || 'Plano dinamico com recursos oficiais.'}
                    </Text>
                    <View style={styles.heroMeta}>
                      <View>
                        <Text style={styles.heroMetaValue}>{heroTrack.exam?.toUpperCase() || 'GERAL'}</Text>
                        <Text style={styles.heroMetaLabel}>Prova alvo</Text>
                      </View>
                      <View>
                        <Text style={styles.heroMetaValue}>{heroTrack.items.length}</Text>
                        <Text style={styles.heroMetaLabel}>Etapas</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ) : null}

                <View style={styles.trackList}>
                  {tracks.map((track) => (
                    <TouchableOpacity
                      key={track.id}
                      style={styles.trackCard}
                      onPress={() => router.push({ pathname: '/(tabs)/trilhas/[id]', params: { id: track.slug } })}
                    >
                      <View style={[styles.trackIcon, { backgroundColor: track.color_hex + '33' }]}>
                        <Ionicons name="walk-outline" size={20} color={track.color_hex} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.trackName}>{track.title}</Text>
                        <Text style={styles.trackInfo}>
                          {`${track.exam?.toUpperCase() || 'EXAME'} - ${track.items.length} passos`}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 28,
    alignItems: 'center',
  },
  maxWidth: {
    width: '100%',
    maxWidth: 1000,
    gap: 24,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 20,
  },
  loadingBox: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  loadingText: {
    color: '#FFFFFF',
  },
  errorText: {
    color: '#FECACA',
    fontSize: 14,
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
    gap: 12,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  heroDescription: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginTop: 8,
  },
  heroMetaValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  heroMetaLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  trackList: {
    gap: 12,
  },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  trackIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  trackInfo: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  resourceCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  resourceBadge: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    backgroundColor: 'rgba(79,70,229,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  resourceBadgeText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '700',
  },
  resourceTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  resourceDescription: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
  },
  emptyBox: {
    padding: 20,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    gap: 8,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
});
