import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../../store/themeStore';
import { useStudyTracks } from '../../../hooks/useStudyTracks';

export default function TrilhaDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useThemeColors();
  const router = useRouter();
  const { trackMap, loading, error } = useStudyTracks();
  const trilha = id ? trackMap.get(id) : undefined;
  const accent = trilha?.color_hex || '#4F46E5';

  const lessons = useMemo(
    () => trilha?.items.filter((item) => item.kind === 'lesson') ?? [],
    [trilha?.items]
  );
  const resources = useMemo(
    () => trilha?.items.filter((item) => item.kind === 'resource') ?? [],
    [trilha?.items]
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.center}>
          <Text style={[styles.loadingText, { color: theme.text }]}>Carregando trilha...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !trilha) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: theme.text }]}>{error || 'Trilha nao encontrada.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40, alignItems: 'center' }}>
        <View style={styles.maxWidth}>
          <LinearGradient
            colors={[accent, '#111827']}
            style={styles.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroHead}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={18} color="#0B1224" />
              </TouchableOpacity>
              <Text style={styles.heroTitle}>{trilha.title}</Text>
            </View>
            <Text style={styles.heroDescription}>{trilha.description || 'Sequencia de estudo personalizada.'}</Text>
            <View style={styles.heroChips}>
              {[trilha.exam?.toUpperCase() || 'GERAL', `${trilha.items.length} passos`, `${lessons.length} aulas`].map(
                (chip) => (
                  <View key={chip} style={[styles.heroChip, { borderColor: accent + '55' }]}>
                    <Text style={styles.heroChipText}>{chip}</Text>
                  </View>
                )
              )}
            </View>
          </LinearGradient>

          <View style={styles.cardSurface}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Passos da trilha</Text>
              <View style={[styles.sectionTag, { borderColor: accent + '55', backgroundColor: accent + '22' }]}>
                <Ionicons name="pulse-outline" size={14} color={accent} />
                <Text style={[styles.sectionTagText, { color: accent }]}>Sugestao</Text>
              </View>
            </View>
            <View style={styles.stepGrid}>
              {lessons.map((item, index) => (
                <LinearGradient
                  key={item.id}
                  colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                  style={styles.stepCard}
                >
                  <View style={[styles.stepBadge, { backgroundColor: accent + '22', borderColor: accent + '55' }]}>
                    <Text style={[styles.stepBadgeText, { color: accent }]}>{index + 1}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.stepTitle}>{item.lesson?.title || item.title || 'Aula'}</Text>
                    <Text style={styles.stepSubtitle}>
                      {item.lesson?.module
                        ? `${item.lesson.module} · ${item.estimated_minutes || 20} min`
                        : `${item.estimated_minutes || 20} min estimados`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.stepAction, { borderColor: accent + '66' }]}
                    onPress={() => router.push({ pathname: '/(tabs)/videos' })}
                  >
                    <Ionicons name="play-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.stepActionText}>Ver aula</Text>
                  </TouchableOpacity>
                </LinearGradient>
              ))}
              {lessons.length === 0 ? <Text style={styles.emptyText}>Nenhuma aula listada.</Text> : null}
            </View>
          </View>

          <View style={styles.cardSurface}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Recursos oficiais</Text>
              <View style={[styles.sectionTag, { borderColor: accent + '55', backgroundColor: accent + '22' }]}>
                <Ionicons name="document-text-outline" size={14} color={accent} />
                <Text style={[styles.sectionTagText, { color: accent }]}>PDF</Text>
              </View>
            </View>
            {resources.length === 0 ? (
              <Text style={styles.emptyText}>Essa trilha ainda nao possui materiais extras.</Text>
            ) : (
              <View style={styles.resourceGrid}>
                {resources.map((resource) => (
                  <TouchableOpacity
                    key={resource.id}
                    style={[styles.resourceCard, { borderColor: accent + '33', backgroundColor: 'rgba(15,23,42,0.3)' }]}
                    onPress={() =>
                      router.push({ pathname: '/(tabs)/trilhas/recurso/[id]', params: { id: resource.id } })
                    }
                  >
                    <View style={[styles.resourceBadge, { backgroundColor: accent + '22' }]}>
                      <Ionicons name="download-outline" size={14} color={accent} />
                      <Text style={[styles.resourceBadgeText, { color: accent }]}>Oficial</Text>
                    </View>
                    <Text style={[styles.resourceTitle, { color: theme.text }]} numberOfLines={2}>
                      {resource.title}
                    </Text>
                    {resource.description ? (
                      <Text style={[styles.resourceDescription, { color: theme.textMuted }]} numberOfLines={2}>
                        {resource.description}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  maxWidth: { width: '100%', maxWidth: 1080, alignSelf: 'center', gap: 20 },
  hero: {
    padding: 24,
    paddingTop: 44,
    gap: 14,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
  },
  heroDescription: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 20,
  },
  heroChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  heroChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroChipText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
  sectionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  sectionTagText: { fontSize: 12, fontWeight: '800' },
  cardSurface: {
    backgroundColor: 'rgba(15,23,42,0.35)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    gap: 12,
  },
  stepGrid: { gap: 12 },
  stepCard: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  stepBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  stepTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  stepSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  stepAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15,23,42,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  stepActionText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  resourceCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 6,
  },
  resourceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  resourceCardInner: {
    flex: 1,
  },
  resourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  resourceBadgeText: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  resourceTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  resourceDescription: {
    fontSize: 13,
  },
  emptyText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
  },
});
