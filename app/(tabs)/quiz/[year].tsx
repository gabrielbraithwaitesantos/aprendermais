import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../../../store/themeStore';
import { useStudyTracks } from '../../../hooks/useStudyTracks';

export default function QuizYearScreen() {
  const { year, exam } = useLocalSearchParams<{ year?: string; exam?: string }>();
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { resources } = useStudyTracks();
  const examLabel = (exam || 'ENEM').toString().toUpperCase();
  const [filter, setFilter] = useState<'all' | 'day1' | 'day2' | 'gaba' | 'prova'>('all');
  const [colorFilter, setColorFilter] = useState<'none' | 'azul' | 'amarelo' | 'verde' | 'branco' | 'cinza'>('none');
  const [query, setQuery] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const lastScrollY = useRef(0);
  const listOffset = useRef(0);
  const contentHeightRef = useRef(0);
  const containerHeightRef = useRef(0);
  const freezeYRef = useRef<number | null>(null);
  const freezeGapRef = useRef(0);

  const COLOR_BY_LABEL: Record<string, string> = {
    azul: '#2563EB',
    amarelo: '#F59E0B',
    verde: '#16A34A',
    branco: '#E5E7EB',
    cinza: '#9CA3AF',
    roxo: '#8B5CF6',
    laranja: '#F97316',
  };
  const COLOR_OPTIONS: { id: 'azul' | 'amarelo' | 'verde' | 'branco' | 'cinza'; label: string; color: string; text?: string }[] =
    [
      { id: 'azul', label: 'Azul', color: '#2563EB' },
      { id: 'amarelo', label: 'Amarelo', color: '#F59E0B' },
      { id: 'verde', label: 'Verde', color: '#16A34A' },
      { id: 'branco', label: 'Branco', color: '#E5E7EB', text: '#0F172A' },
      { id: 'cinza', label: 'Cinza', color: '#9CA3AF', text: '#0F172A' },
    ];

  const rememberScroll = (y: number) => {
    lastScrollY.current = y;
  };

  const freezeToList = () => {
    const currentY = lastScrollY.current ?? 0;
    const containerH = containerHeightRef.current || 0;
    const maxY = Math.max(contentHeightRef.current - containerH, 0);
    freezeGapRef.current = Math.max(maxY - currentY, 0);
    freezeYRef.current = currentY;
  };

  const restoreIfPending = () => {
    if (freezeYRef.current == null) return;
    const gap = freezeGapRef.current;
    freezeYRef.current = null;
    freezeGapRef.current = 0;
    requestAnimationFrame(() => {
      const containerH = containerHeightRef.current || 0;
      const maxY = Math.max(contentHeightRef.current - containerH, 0);
      const target = Math.max(0, Math.min(maxY - gap, maxY));
      scrollRef.current?.scrollTo({ y: target, animated: false });
      lastScrollY.current = target;
    });
  };

  useEffect(() => {
    restoreIfPending();
  }, [filter, colorFilter, query, resources.length, year, exam]);

    const filtered = useMemo(() => {
    const result: Record<string, ReturnType<typeof useStudyTracks>['resources']> = {};
    resources.forEach((item) => {
      const title = item.title || '';
      const lower = title.toLowerCase();
      const hasYear = title.includes(year || '');
      const examOk = (item as any).trackExam
        ? String((item as any).trackExam).toUpperCase() === String(exam || 'ENEM').toUpperCase()
        : true;
      const isGabarito = lower.includes('gabarito');
      const isDay1 = /1(?:º)?\s+dia/i.test(title);
      const isDay2 = /2(?:º)?\s+dia/i.test(title);
            const matchesColor =
        colorFilter === 'none' ||
        lower.includes(colorFilter) ||
        (colorFilter === 'branco' && lower.includes('branca'));

      const matchesFilter =
        filter === 'all' ||
        (filter === 'gaba' && isGabarito) ||
        (filter === 'prova' && !isGabarito) ||
        (filter === 'day1' && isDay1) ||
        (filter === 'day2' && isDay2);
      const matchesQuery = query.trim().length === 0 || lower.includes(query.trim().toLowerCase());
      if (hasYear && examOk && matchesFilter && matchesQuery && matchesColor) {
        const dayMatch = /(1º\s+dia|2º\s+dia|1\s+dia|2\s+dia)/i.exec(title);
        const day = dayMatch?.[1] || 'Dia 1/2';
        if (!result[day]) result[day] = [];
        result[day].push(item);
      }
    });
    return result;
  }, [resources, year, exam, filter, query, colorFilter]);

  const days = Object.keys(filtered).sort();

  const dayStats = useMemo(() => {
    const stats = { day1: 0, day2: 0, others: 0 };
    Object.entries(filtered).forEach(([day, list]) => {
      if (/1/.test(day)) stats.day1 += list.length;
      else if (/2/.test(day)) stats.day2 += list.length;
      else stats.others += list.length;
    });
    return stats;
  }, [filtered]);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/quiz');
    }
  };

  const prettyDay = (label: string) => label;

  const dayColor = (title?: string | null, fallback?: string) => {
    if (!title) return fallback || '#4F46E5';
    const lowered = title.toLowerCase();
    const match = /(azul|amarelo|verde|branco|cinza|roxo|laranja)/.exec(lowered);
    if (match?.[1]) return COLOR_BY_LABEL[match[1]] || fallback || '#4F46E5';
    return fallback || '#4F46E5';
  };

  const totalCount = useMemo(
    () => Object.values(filtered).reduce((acc, list) => acc + list.length, 0),
    [filtered]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={theme.gradient}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
      />
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 140 }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onLayout={(event) => {
          containerHeightRef.current = event.nativeEvent.layout.height;
        }}
        onContentSizeChange={(_w, h) => {
          contentHeightRef.current = h;
          restoreIfPending();
        }}
        onScroll={(event) => rememberScroll(event.nativeEvent.contentOffset.y)}
        onMomentumScrollEnd={(event) => rememberScroll(event.nativeEvent.contentOffset.y)}
        onScrollEndDrag={(event) => rememberScroll(event.nativeEvent.contentOffset.y)}
      >
        <View style={styles.maxWidth}>
          <View style={styles.topRow}>
            <TouchableOpacity onPress={goBack} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={16} color={theme.text} />
              <Text style={[styles.backText, { color: theme.text }]}>Voltar</Text>
            </TouchableOpacity>
            <View style={[styles.examTag, { borderColor: 'rgba(255,255,255,0.18)' }]}>
              <Ionicons name="ribbon-outline" size={14} color="#FFFFFF" />
              <Text style={styles.examTagText}>{examLabel}</Text>
            </View>
          </View>

          <View style={[styles.heroCard, { borderColor: 'rgba(255,255,255,0.28)' }]}>
            <Text style={[styles.title, { color: theme.text }]}>{`${examLabel} ${year}`}</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              Provas e gabaritos organizados por caderno. Escolha abaixo o PDF para abrir.
            </Text>
            <View style={styles.heroStats}>
              <View style={[styles.statCard, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                <Ionicons name="document-text-outline" size={16} color="#2563EB" />
                <View>
                  <Text style={styles.statLabel}>Arquivos</Text>
                  <Text style={styles.statValue}>{totalCount}</Text>
                </View>
              </View>
              <View style={[styles.statCard, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
                <Ionicons name="calendar-outline" size={16} color="#10B981" />
                <View>
                  <Text style={styles.statLabel}>Dia 1</Text>
                  <Text style={styles.statValue}>{dayStats.day1}</Text>
                </View>
              </View>
              <View style={[styles.statCard, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
                <Ionicons name="calendar-outline" size={16} color="#3B82F6" />
                <View>
                  <Text style={styles.statLabel}>Dia 2</Text>
                  <Text style={styles.statValue}>{dayStats.day2}</Text>
                </View>
              </View>
            </View>
          </View>

          <View
            style={{ width: '100%' }}
            onLayout={(e) => {
              listOffset.current = e.nativeEvent.layout.y;
            }}
          >
          <View style={styles.filterRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={16} color={theme.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Filtrar por caderno ou palavra-chave"
                placeholderTextColor="rgba(255,255,255,0.6)"
                style={[styles.searchInput, { color: theme.text }]}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
              {(
                [
                  { id: 'day1', label: 'Dia 1' },
                  { id: 'day2', label: 'Dia 2' },
                  { id: 'gaba', label: 'Gabarito' },
                ] as const
              ).map((opt) => {
                const isActive = filter === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => {
                      freezeToList();
                      setFilter(isActive ? 'all' : opt.id);
                    }}
                  >
                    <Text style={styles.filterChipText}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
              {COLOR_OPTIONS.map((opt) => {
                const isActive = colorFilter === opt.id;
                const bg = isActive ? `${opt.color}33` : 'rgba(255,255,255,0.08)';
                const border = isActive ? opt.color : 'rgba(255,255,255,0.2)';
                const textColor = isActive ? opt.text || '#FFFFFF' : '#FFFFFF';
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.filterChip, { backgroundColor: bg, borderColor: border }]}
                    onPress={() => {
                      freezeToList();
                      setColorFilter(isActive ? 'none' : opt.id);
                    }}
                  >
                    <Text style={[styles.filterChipText, { color: textColor }]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {days.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              Nenhum PDF encontrado para {examLabel} {year}.
            </Text>
          ) : (
            days.map((day) => (
              <View key={day} style={styles.dayBlock}>
                <View
                  style={[
                    styles.dayHeader,
                    {
                      borderColor: `${dayColor(day)}55`,
                      backgroundColor: 'rgba(59,130,246,0.18)',
                      shadowColor: '#0F172A',
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 5 },
                      elevation: 3,
                    },
                  ]}
                >
                  <View style={styles.dayTitleRow}>
                    <Ionicons name="calendar-outline" size={16} color={dayColor(day)} />
                    <Text style={[styles.dayTitle, { color: '#FFFFFF' }]}>{prettyDay(day)}</Text>
                  </View>
                  <View style={[styles.dayBadge, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
                    <Ionicons name="document-text-outline" size={14} color={dayColor(day)} />
                    <Text style={[styles.dayBadgeText, { color: dayColor(day) }]}>
                      {filtered[day].length} arquivos
                    </Text>
                  </View>
                </View>

                <View style={styles.cards}>
                  {filtered[day].map((item) => {
                    const accent = dayColor(item.title, item.trackColor);
                    const isAnswerKey = (item.title || '').toLowerCase().includes('gabarito');
                    const minutes = item.estimated_minutes;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.card,
                          {
                            borderColor: `${accent}55`,
                            backgroundColor: 'rgba(59,130,246,0.2)',
                            shadowColor: '#0F172A',
                            shadowOpacity: 0.08,
                            shadowRadius: 8,
                            shadowOffset: { width: 0, height: 5 },
                            elevation: 3,
                          },
                        ]}
                        onPress={() =>
                          router.push({ pathname: '/(tabs)/trilhas/recurso/[id]', params: { id: item.id } })
                        }
                      >
                        <View style={[styles.badge, { backgroundColor: `${accent}55` }]}>
                          <Ionicons
                            name={isAnswerKey ? 'shield-checkmark-outline' : 'document-text-outline'}
                            size={16}
                            color={accent}
                          />
                          <Text style={styles.badgeText}>{isAnswerKey ? 'Gabarito' : 'Prova'}</Text>
                        </View>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
                        <Text style={[styles.cardSubtitle, { color: theme.textMuted }]} numberOfLines={2}>
                          {item.description || 'PDF oficial do exame.'}
                        </Text>
                        <View style={styles.cardFooter}>
                          <View style={styles.cardMeta}>
                            <Ionicons name="time-outline" size={14} color={theme.textMuted} />
                            <Text style={[styles.cardMetaText, { color: theme.textMuted }]}>
                              {minutes ? `${minutes} min` : item.trackExam || 'ENEM'}
                            </Text>
                          </View>
                          <View style={styles.cardAction}>
                            <Text style={[styles.cardActionText, { color: accent }]}>Abrir PDF</Text>
                            <Ionicons name="arrow-forward" size={14} color={accent} />
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))
          )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { ...StyleSheet.absoluteFillObject },
  content: { padding: 16, gap: 16, alignItems: 'stretch' },
  maxWidth: { width: '100%', maxWidth: 1080, gap: 16, alignSelf: 'center', paddingHorizontal: 8 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  backText: { fontWeight: '700' },
  examTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  examTagText: { fontWeight: '800', color: '#FFFFFF', fontSize: 12 },
  heroCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: 'rgba(59,130,246,0.24)',
    gap: 10,
    shadowColor: '#0F172A',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  subtitle: { fontSize: 13, color: '#E5E7EB' },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(59,130,246,0.24)',
    borderWidth: 1,
    borderColor: 'rgba(147,197,253,0.35)',
  },
  statLabel: { color: '#E5E7EB', fontSize: 11, fontWeight: '700' },
  statValue: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  filterRow: { flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 220,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    backgroundColor: 'rgba(59,130,246,0.18)',
  },
  searchInput: { flex: 1, paddingVertical: 0 },
  filterChips: { flexDirection: 'row', gap: 8 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    backgroundColor: 'rgba(59,130,246,0.18)',
  },
  filterChipActive: {
    borderColor: '#A5E4FF',
    backgroundColor: 'rgba(96,165,250,0.3)',
  },
  filterChipText: { fontWeight: '700', fontSize: 12 },
  emptyText: { fontSize: 14 },
  dayBlock: { gap: 10 },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(96,165,250,0.22)',
  },
  dayTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayTitle: { fontWeight: '800', fontSize: 14, color: '#FFFFFF' },
  dayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  dayBadgeText: { fontWeight: '700', fontSize: 12, color: '#FFFFFF' },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  card: {
    width: '48%',
    minWidth: 280,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    backgroundColor: 'rgba(96,165,250,0.22)',
    borderColor: 'rgba(191,219,254,0.55)',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { fontWeight: '700', fontSize: 12, color: '#FFFFFF' },
  cardTitle: { fontWeight: '800', fontSize: 14 },
  cardSubtitle: { fontSize: 12 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardMetaText: { fontWeight: '700', fontSize: 12 },
  cardAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardActionText: { fontWeight: '800', fontSize: 12 },
});
