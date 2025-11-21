import React, { useMemo } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../../store/themeStore';
import { useStudyTracks } from '../../../hooks/useStudyTracks';

export default function QuizYearScreen() {
  const { year, exam } = useLocalSearchParams<{ year?: string; exam?: string }>();
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { resources } = useStudyTracks();

  const COLOR_BY_LABEL: Record<string, string> = {
    azul: '#2563EB',
    amarelo: '#F59E0B',
    verde: '#16A34A',
    branco: '#E5E7EB',
    cinza: '#9CA3AF',
    roxo: '#8B5CF6',
    laranja: '#F97316',
  };

  const filtered = useMemo(() => {
    const result: Record<string, ReturnType<typeof useStudyTracks>['resources']> = {};
    resources.forEach((item) => {
      const title = item.title || '';
      const hasYear = title.includes(year || '');
      const examOk = (item as any).trackExam
        ? String((item as any).trackExam).toUpperCase() === String(exam || 'ENEM').toUpperCase()
        : true;
      if (hasYear && examOk) {
        const dayMatch = /(1º dia|2º dia)/i.exec(title);
        const day = dayMatch?.[1] || 'Dia 1/2';
        if (!result[day]) result[day] = [];
        result[day].push(item);
      }
    });
    return result;
  }, [resources, year, exam]);

  const days = Object.keys(filtered).sort();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/quiz');
  };

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
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.maxWidth}>
          <View style={styles.header}>
            <TouchableOpacity onPress={goBack} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={18} color={theme.text} />
              <Text style={[styles.backText, { color: theme.text }]}>Voltar</Text>
            </TouchableOpacity>
            <View style={styles.headerCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[styles.title, { color: theme.text }]}>{`ENEM ${year}`}</Text>
                <View style={styles.countBadge}>
                  <Ionicons name="document-text-outline" size={14} color="#111827" />
                  <Text style={styles.countBadgeText}>{totalCount}</Text>
                </View>
              </View>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                Provas e gabaritos separados por dia e caderno.
              </Text>
            </View>
          </View>

          {days.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              Nenhum PDF encontrado para ENEM {year}.
            </Text>
          ) : (
            days.map((day) => (
              <View key={day} style={styles.dayBlock}>
                <View
                  style={[
                    styles.dayHeader,
                    { backgroundColor: `${dayColor(day)}22`, borderColor: `${dayColor(day)}33` },
                  ]}
                >
                  <Ionicons name="calendar-outline" size={16} color={dayColor(day)} />
                  <Text style={[styles.dayTitle, { color: theme.text }]}>{day}</Text>
                </View>
                <View style={styles.cards}>
                  {filtered[day].map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.card,
                        {
                          borderColor: `${dayColor(item.title, item.trackColor)}33`,
                          backgroundColor: `${dayColor(item.title, item.trackColor)}10`,
                        },
                      ]}
                      onPress={() =>
                        router.push({ pathname: '/(tabs)/trilhas/recurso/[id]', params: { id: item.id } })
                      }
                    >
                      <View style={[styles.badge, { backgroundColor: `${dayColor(item.title, item.trackColor)}22` }]}>
                        <Ionicons name="document-text-outline" size={16} color={dayColor(item.title, item.trackColor)} />
                        <Text style={[styles.badgeText, { color: dayColor(item.title, item.trackColor) }]}>
                          {item.trackExam || 'ENEM'}
                        </Text>
                      </View>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardSubtitle} numberOfLines={2}>
                        {item.description || 'PDF oficial do exame.'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16, alignItems: 'center' },
  maxWidth: { width: '100%', maxWidth: 1080, gap: 16 },
  header: { gap: 10 },
  headerCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    gap: 6,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  countBadgeText: { color: '#111827', fontWeight: '800', fontSize: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  backText: { fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 13 },
  emptyText: { fontSize: 14 },
  dayBlock: { gap: 10 },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dayTitle: { fontWeight: '800', fontSize: 13 },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { fontWeight: '700', fontSize: 12 },
  cardTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  cardSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
});
