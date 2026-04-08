import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../store/themeStore';
import { useLessons, type LessonWithMeta } from '../../hooks/useLessons';

const ICON_BY_SUBJECT: Record<string, keyof typeof Ionicons.glyphMap> = {
  matematica: 'calculator-outline',
  ciencias: 'flask-outline',
  humanas: 'book-outline',
  geral: 'play-circle-outline',
};

type SubjectLessonGroup = [string, LessonWithMeta[]];

export default function VideosScreen() {
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const { width } = useWindowDimensions();
  const isTablet = width > 640;
  const isWide = width > 900;
  const bottomSpace = insets.bottom + 140;
  const {
    featuredLessons,
    lessonsBySubject,
    subjectsMeta,
    loading,
    error,
    refresh,
    toggleLessonCompletion,
    togglingLessonId,
  } = useLessons();
  const [selectedSubject, setSelectedSubject] = useState('todos');
  const scrollRef = useRef<ScrollView | null>(null);
  const allLessons = useMemo(() => {
    const list: LessonWithMeta[] = [];
    lessonsBySubject.forEach((arr) => list.push(...arr));
    return list;
  }, [lessonsBySubject]);
  const completionStats = useMemo(() => {
    const total = allLessons.length || stateCount(lessonsBySubject);
    const done = allLessons.filter((l) => l.progress?.status === 'done').length;
    const subjects = subjectsMeta.length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { total, done, subjects, pct };
  }, [allLessons, lessonsBySubject, subjectsMeta]);
  const featuredCardWidth = Math.min(width * (isTablet ? 0.68 : 0.9), 520);
  const subjectCardWidth = isWide ? '48%' : '100%';

  const categories = useMemo(
    () => [
      {
        id: 'todos',
        name: 'Todos',
        color: '#4F46E5',
        icon: 'sparkles-outline' as const,
        lessons: featuredLessons.length || stateCount(lessonsBySubject),
      },
      ...subjectsMeta.map((meta) => ({
        id: meta.slug,
        name: meta.name,
        color: meta.color,
        icon: ICON_BY_SUBJECT[meta.slug] || 'book-outline',
        lessons: meta.lessons,
      })),
    ],
    [featuredLessons.length, lessonsBySubject, subjectsMeta]
  );

  const heroLessons = useMemo(() => {
    if (selectedSubject === 'todos') return featuredLessons;
    return lessonsBySubject.get(selectedSubject) ?? [];
  }, [featuredLessons, lessonsBySubject, selectedSubject]);

  const groupedLessons = useMemo<SubjectLessonGroup[]>(() => {
    if (selectedSubject === 'todos') {
      return Array.from(lessonsBySubject.entries());
    }
    return [[selectedSubject, lessonsBySubject.get(selectedSubject) ?? []]];
  }, [lessonsBySubject, selectedSubject]);

  const recommendedChannels = useMemo(
    () =>
      subjectsMeta.slice(0, 3).map((meta) => ({
        id: meta.slug,
        name: meta.name,
        lessons: meta.lessons,
        color: meta.color,
      })),
    [subjectsMeta]
  );
  const heroStatsData = useMemo(
    () => [
      { label: 'Aulas', value: completionStats.total || '–', icon: 'play-outline' as const },
      { label: 'Concluidas', value: completionStats.done || '–', icon: 'checkmark-done-outline' as const },
      { label: 'Materias', value: completionStats.subjects || '–', icon: 'color-filter-outline' as const },
      { label: 'Progresso', value: `${completionStats.pct}%`, icon: 'trending-up-outline' as const },
    ],
    [completionStats.done, completionStats.pct, completionStats.subjects, completionStats.total]
  );

  const openVideo = async (url?: string | null) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      // ignore
    }
  };

  const handleChannelPress = (slug: string) => {
    setSelectedSubject(slug);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const isEmpty = !loading && heroLessons.length === 0 && groupedLessons.every(([, list]) => list.length === 0);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={theme.gradient}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: bottomSpace, gap: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={{ flex: 1, gap: 8 }}>
                <View style={styles.heroBadge}>
                  <Ionicons name="sparkles-outline" size={14} color="#0B1224" />
                  <Text style={styles.heroBadgeText}>Trilha guiada</Text>
                </View>
                <Text style={styles.screenTitle}>Aulas em video</Text>
                <Text style={styles.screenSubtitle}>
                  Assista, marque como concluido e continue o progresso. Filtre por materia para focar.
                </Text>
                <View style={styles.heroActions}>
                  <TouchableOpacity onPress={() => refresh()} style={styles.refreshBtn} disabled={loading}>
                    <Ionicons name="refresh" size={16} color="#0B1224" />
                    <Text style={[styles.refreshText, { color: '#0B1224' }]}>Atualizar</Text>
                  </TouchableOpacity>
                  {error ? (
                    <View style={styles.heroErrorPill}>
                      <Ionicons name="warning-outline" size={14} color="#FACC15" />
                      <Text style={styles.heroErrorText}>Falha ao carregar. Tente novamente.</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <View style={[styles.heroStats, !isTablet && styles.heroStatsStack]}>
                {heroStatsData.map((stat) => (
                  <View key={stat.label} style={styles.statPill}>
                    <View style={styles.statPillIcon}>
                      <Ionicons name={stat.icon} size={14} color="#0B1224" />
                    </View>
                    <View>
                      <Text style={styles.statPillValue}>{stat.value}</Text>
                      <Text style={styles.statPillLabel}>{stat.label}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor:
                        selectedSubject === category.id ? category.color : 'rgba(255,255,255,0.08)',
                      borderColor: selectedSubject === category.id ? category.color : 'rgba(255,255,255,0.2)',
                    },
                  ]}
                  onPress={() => setSelectedSubject(category.id)}
                >
                  <Ionicons
                    name={category.icon}
                    size={16}
                    color={selectedSubject === category.id ? '#FFFFFF' : category.color}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      { color: selectedSubject === category.id ? '#FFFFFF' : '#E5E7EB' },
                    ]}
                  >
                    {category.name} ({category.lessons})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Destaques */}
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {selectedSubject === 'todos' ? 'Em destaque' : 'Para voce'}
              </Text>
              <TouchableOpacity onPress={() => refresh()} style={styles.sectionAction}>
                <Ionicons name="refresh" size={14} color="#FFFFFF" />
                <Text style={styles.sectionActionText}>Atualizar</Text>
              </TouchableOpacity>
            </View>
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#FFFFFF" />
                <Text style={styles.loadingText}>Carregando videos...</Text>
              </View>
            ) : heroLessons.length === 0 ? (
              <Text style={styles.emptyText}>Ainda nao temos videos para essa materia.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 16, paddingRight: 16 }}
              >
                {heroLessons.map((lesson) => (
                  <View key={lesson.id} style={[styles.featuredCard, { width: featuredCardWidth }]}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => openVideo(lesson.video_url)}
                      style={styles.thumbnailContainer}
                    >
                      {lesson.thumbnail_url ? (
                        <Image source={{ uri: lesson.thumbnail_url }} style={styles.thumbnail} />
                      ) : (
                        <View style={[styles.thumbnail, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
                      )}
                      <View style={styles.durationBadge}>
                        <Ionicons name="time-outline" size={12} color="#FFFFFF" />
                        <Text style={styles.durationText}>{lesson.duration_minutes} min</Text>
                      </View>
                      {lesson.progress?.status === 'done' ? (
                        <View style={styles.watchedBadge}>
                          <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                        </View>
                      ) : null}
                    </TouchableOpacity>
                    <View style={styles.videoInfo}>
                      <Text style={styles.videoTitle}>{lesson.title}</Text>
                      <Text style={styles.channelName}>{lesson.description || 'Aula estruturada.'}</Text>
                      <View style={styles.videoStats}>
                        <Text style={styles.viewsText}>
                          {lesson.subject?.name || lesson.subject_tag}
                        </Text>
                        <TouchableOpacity
                          onPress={() => toggleLessonCompletion(lesson.id)}
                          style={[
                            styles.tagButton,
                            lesson.progress?.status === 'done' && { backgroundColor: 'rgba(16,185,129,0.25)' },
                          ]}
                          disabled={loading || togglingLessonId === lesson.id}
                        >
                          {togglingLessonId === lesson.id ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Ionicons
                              name={lesson.progress?.status === 'done' ? 'refresh' : 'bookmark-outline'}
                              size={14}
                              color="#FFFFFF"
                            />
                          )}
                          <Text style={styles.tagButtonText}>
                            {lesson.progress?.status === 'done' ? 'Desfazer' : 'Marcar feito'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Materias */}
          {groupedLessons.map(([subjectSlug, lessons]) => {
            if (lessons.length === 0) return null;
            const meta = subjectsMeta.find((s) => s.slug === subjectSlug);
            return (
              <View key={subjectSlug} style={styles.subjectSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    {meta?.name || subjectSlug}
                  </Text>
                  <View style={styles.sectionTag}>
                    <Ionicons name="play" size={12} color="#FFFFFF" />
                    <Text style={styles.sectionTagText}>{lessons.length} aulas</Text>
                  </View>
                </View>
                <View style={[styles.subjectGrid, isWide && styles.subjectGridWide]}>
                  {lessons.map((lesson) => (
                    <View key={lesson.id} style={[styles.subjectCard, isWide && { width: subjectCardWidth }]}>
                      <View style={styles.subjectHeader}>
                        <View
                          style={[
                            styles.subjectIcon,
                            { backgroundColor: (meta?.color || '#4F46E5') + '33' },
                          ]}
                        >
                          <Ionicons
                            name={ICON_BY_SUBJECT[subjectSlug] || 'book-outline'}
                            size={20}
                            color={meta?.color || '#4F46E5'}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.subjectName}>{lesson.title}</Text>
                          <Text style={styles.subjectMeta}>
                            {lesson.module} - {lesson.duration_minutes} min
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.subjectDescription} numberOfLines={3}>
                        {lesson.description || 'Resumo disponivel dentro da aula.'}
                      </Text>
                      <View style={styles.subjectActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => openVideo(lesson.video_url || lesson.resource_url || undefined)}
                        >
                          <Ionicons name="play-outline" size={16} color="#FFFFFF" />
                          <Text style={styles.actionButtonText}>Assistir</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            lesson.progress?.status === 'done' && { backgroundColor: 'rgba(16,185,129,0.4)' },
                          ]}
                          onPress={() => toggleLessonCompletion(lesson.id)}
                          disabled={loading || togglingLessonId === lesson.id}
                        >
                          {togglingLessonId === lesson.id ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Ionicons
                              name={lesson.progress?.status === 'done' ? 'arrow-undo' : 'checkbox-outline'}
                              size={16}
                              color="#FFFFFF"
                            />
                          )}
                          <Text style={styles.actionButtonText}>
                            {lesson.progress?.status === 'done' ? 'Desfazer' : 'Concluir'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}

          {/* Canais recomendados */}
          <View>
            <Text style={styles.sectionTitle}>Canais recomendados</Text>
            {recommendedChannels.length === 0 ? (
              <Text style={styles.emptyText}>Adicione mais materias para ver recomendacoes.</Text>
            ) : (
              <View style={styles.channelsList}>
                {recommendedChannels.map((channel) => (
                  <View key={channel.id} style={styles.channelCard}>
                    <View
                      style={[
                        styles.channelAvatar,
                        { backgroundColor: channel.color + '33' },
                      ]}
                    >
                      <Ionicons name="school-outline" size={18} color={channel.color} />
                    </View>
                    <View style={styles.channelInfo}>
                      <Text style={styles.channelNameText}>{channel.name}</Text>
                      <Text style={styles.channelStats}>
                        {channel.lessons} aulas disponiveis nesta materia
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.subscribeButton}
                      onPress={() => handleChannelPress(channel.id)}
                    >
                      <Text style={styles.subscribeText}>Ver aulas</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Dicas */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>Dicas rapidas</Text>
            <View style={styles.tipItem}>
              <Ionicons name="timer-outline" size={18} color="#FFFFFF" />
              <Text style={styles.tipText}>
                Reserve blocos curtos de 25 minutos para assistir aulas sem distracoes.
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="color-wand-outline" size={18} color="#FFFFFF" />
              <Text style={styles.tipText}>
                Marque como concluido para atualizar seu progresso automaticamente.
              </Text>
            </View>
          </View>

          {error && !loading ? (
            <Text style={styles.errorText}>Erro: {error}</Text>
          ) : null}

          {isEmpty ? (
            <View style={styles.emptyStateBox}>
              <Text style={styles.emptyTitle}>Sem conteudo ainda</Text>
              <Text style={styles.emptySubtitle}>
                Cadastre novas aulas no Firebase (colecao lessons) para que aparecam aqui.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

function stateCount(map: Map<string, unknown[]>) {
  let total = 0;
  map.forEach((list) => {
    total += list.length;
  });
  return total;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  heroCard: {
    width: '100%',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  heroTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#A5E4FF',
  },
  heroBadgeText: {
    color: '#0B1224',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  heroErrorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(250,204,21,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.4)',
  },
  heroErrorText: {
    color: '#FACC15',
    fontSize: 12,
    fontWeight: '700',
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    flexWrap: 'wrap',
    minWidth: 220,
  },
  heroStatsStack: {
    width: '100%',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    flex: 1,
    minWidth: 140,
  },
  statPillIcon: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#A5E4FF',
  },
  statPillValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  statPillLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '700',
  },
  header: {
    gap: 8,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  screenSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    lineHeight: 20,
  },
  refreshBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#A5E4FF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  refreshText: {
    color: '#0B1224',
    fontSize: 12,
    fontWeight: '600',
  },
  categories: {
    gap: 12,
    paddingVertical: 12,
    paddingRight: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  sectionActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingBox: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.8)',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  featuredCard: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  thumbnailContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: 180,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  watchedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    padding: 2,
  },
  videoInfo: {
    padding: 16,
    gap: 8,
  },
  videoTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  channelName: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  videoStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewsText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  tagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  subjectSection: {
    gap: 12,
  },
  sectionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  sectionTagText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  subjectGrid: {
    gap: 12,
    flexDirection: 'column',
  },
  subjectGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  subjectCard: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  subjectHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  subjectIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  subjectMeta: {
    color: 'rgba(229,231,235,0.8)',
    fontSize: 12,
  },
  subjectDescription: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    marginBottom: 14,
  },
  subjectActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#2563EB',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  channelsList: {
    gap: 12,
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  channelAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  channelInfo: {
    flex: 1,
  },
  channelNameText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  channelStats: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  subscribeButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  subscribeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  tipsCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  tipsTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  tipItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  tipText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    flex: 1,
  },
  errorText: {
    color: '#FECACA',
    fontSize: 13,
  },
  emptyStateBox: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    gap: 6,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    lineHeight: 18,
  },
});
