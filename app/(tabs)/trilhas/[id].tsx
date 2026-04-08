import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
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
    <SafeAreaView style={[styles.container, { backgroundColor: '#DCEAFE' }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
        <View style={styles.maxWidth}>
          <View style={[styles.hero, { backgroundColor: '#2563EB', borderColor: '#93C5FD' }]}>
            <View style={styles.heroHead}>
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
          </View>

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
                <View key={item.id} style={styles.stepCard}>
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
                </View>
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
                    style={[
                      styles.resourceCard,
                      { borderColor: accent + '44', backgroundColor: '#E3F2FF' },
                    ]}
                    onPress={() =>
                      router.push({ pathname: '/(tabs)/trilhas/recurso/[id]', params: { id: resource.id } })
                    }
                  >
                    <View style={[styles.resourceBadge, { backgroundColor: accent + '1A' }]}>
                      <Ionicons name="download-outline" size={14} color={accent} />
                      <Text style={[styles.resourceBadgeText, { color: accent }]}>Oficial</Text>
                    </View>
                    <Text style={[styles.resourceTitle, { color: '#0F172A' }]} numberOfLines={2}>
                      {resource.title}
                    </Text>
                    {resource.description ? (
                      <Text style={[styles.resourceDescription, { color: '#334155' }]} numberOfLines={2}>
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
    borderWidth: 1,
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
    borderColor: '#0F172A',
    backgroundColor: 'rgba(255,255,255,0.92)',
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
    paddingHorizontal: 4,
  },
  sectionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: '#E0F2FE',
    borderColor: '#BFDBFE',
  },
  sectionTagText: { fontSize: 12, fontWeight: '800' },
  cardSurface: {
    backgroundColor: '#EAF2FF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C7D8FF',
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
    borderColor: '#BFDBFE',
    backgroundColor: '#E3F2FF',
  },
  stepBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#D4E9FF',
    borderColor: '#93C5FD',
  },
  stepBadgeText: {
    color: '#1D4ED8',
    fontSize: 14,
    fontWeight: '700',
  },
  stepTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  stepSubtitle: {
    color: '#334155',
    fontSize: 12,
  },
  stepAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#93C5FD',
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
    backgroundColor: '#E3F2FF',
    borderColor: '#BFDBFE',
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
    backgroundColor: '#D4E9FF',
  },
  resourceBadgeText: {
    color: '#1D4ED8',
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
