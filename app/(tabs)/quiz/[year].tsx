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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={18} color={theme.text} />
            <Text style={[styles.backText, { color: theme.text }]}>Voltar</Text>
          </TouchableOpacity>
          <View style={{ gap: 4 }}>
            <Text style={[styles.title, { color: theme.text }]}>{`ENEM ${year}`}</Text>
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
              <View style={styles.dayHeader}>
                <Ionicons name="calendar-outline" size={16} color={theme.text} />
                <Text style={[styles.dayTitle, { color: theme.text }]}>{day}</Text>
              </View>
              <View style={styles.cards}>
                {filtered[day].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.card, { borderColor: `${item.trackColor}33` }]}
                    onPress={() =>
                      router.push({ pathname: '/(tabs)/trilhas/recurso/[id]', params: { id: item.id } })
                    }
                  >
                    <View style={[styles.badge, { backgroundColor: `${item.trackColor}22` }]}>
                      <Ionicons name="document-text-outline" size={16} color={item.trackColor} />
                      <Text style={[styles.badgeText, { color: item.trackColor }]}>{item.trackExam || 'ENEM'}</Text>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  header: { gap: 10 },
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
