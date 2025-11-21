import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { useRouter } from 'expo-router';
import { useThemeColors } from '../../store/themeStore';
import { useQuizBank } from '../../hooks/useQuizBank';
import { useStudyTracks } from '../../hooks/useStudyTracks';

type ResourceItem = ReturnType<typeof useStudyTracks>['resources'][number] & {
  trackExam?: string;
};

export default function QuizScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useThemeColors();
  const { width } = useWindowDimensions();
  const bottomSpace = insets.bottom + 140;
  const { questions, loading, error, exams, subjects, randomQuestion } = useQuizBank();
  const { resources } = useStudyTracks();
  const [currentQuestion, setCurrentQuestion] = useState(randomQuestion || null);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [selectedExam, setSelectedExam] = useState<string>('ENEM');

  useEffect(() => {
    if (!currentQuestion && randomQuestion) {
      setCurrentQuestion(randomQuestion);
    }
  }, [randomQuestion, currentQuestion]);

  const categories = useMemo(
    () =>
      exams.map((item) => ({
        id: item.exam,
        title: item.exam.toUpperCase(),
        questions: item.count,
      })),
    [exams]
  );

  const subjectStats = useMemo(
    () =>
      subjects.map((item) => ({
        id: item.subject,
        title: item.subject.toUpperCase(),
        accuracy: 70 + Math.round(Math.random() * 20),
        completed: Math.round(item.count * 0.4),
        total: item.count,
      })),
    [subjects]
  );

  const handleShuffle = () => {
    setCurrentQuestion((prev) => {
      const pool = questions.filter((q) => q.id !== prev?.id);
      if (pool.length === 0) return prev;
      return pool[Math.floor(Math.random() * pool.length)];
    });
    setSelected(null);
    setRevealed(false);
  };

  const handleSelect = (index: number) => {
    setSelected(index);
    setRevealed(true);
  };

  const examResources = useMemo(() => {
    const grouped: Record<string, ResourceItem[]> = {};
    resources.forEach((item) => {
      const examKey = (item as any).trackExam ? String((item as any).trackExam).toUpperCase() : 'GERAL';
      if (!grouped[examKey]) grouped[examKey] = [];
      grouped[examKey].push(item as ResourceItem);
    });
    return grouped;
  }, [resources]);

  const examList = useMemo(() => Object.keys(examResources), [examResources]);

  useEffect(() => {
    if (!examResources[selectedExam] && examList.length > 0) {
      setSelectedExam(examList.includes('ENEM') ? 'ENEM' : examList[0]);
    }
  }, [examList, examResources, selectedExam]);

  const activeResources = examResources[selectedExam] || [];
  const isWide = width > 760;
  const cardWidth = isWide ? '48%' : '100%';

  const yearsAvailable = useMemo(() => {
    const set = new Set<string>();
    activeResources.forEach((item) => {
      const match = /ENEM\s+(\d{4})/i.exec(item.title || '');
      if (match?.[1]) set.add(match[1]);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [activeResources]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={theme.gradient}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: bottomSpace,
            gap: 24,
            paddingTop: 16,
            alignItems: 'center',
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.maxWidth}>
            <View style={styles.header}>
              <Text style={styles.title}>Quiz & Provas</Text>
              <Text style={styles.subtitle}>Questoes reais alimentadas pelo Supabase.</Text>
            </View>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#FFFFFF" />
                <Text style={styles.loadingText}>Carregando banco de perguntas...</Text>
              </View>
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            {/* Categorias */}
            <View>
              <Text style={styles.sectionTitle}>Simulados por exame</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {categories.map((cat) => (
                  <TouchableOpacity key={cat.id} style={styles.examCard}>
                    <View style={styles.examIcon}>
                      <Ionicons name="ribbon-outline" size={18} color="#FFFFFF" />
                    </View>
                    <Text style={styles.examTitle}>{cat.title}</Text>
                    <Text style={styles.examSubtitle}>{cat.questions} questoes</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Questao destaque */}
            <View style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <View style={styles.questionBadge}>
                  <Ionicons name="flash-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.questionBadgeText}>{currentQuestion?.exam?.toUpperCase() || 'ENEM'}</Text>
                </View>
                <TouchableOpacity onPress={handleShuffle} style={styles.shuffleBtn}>
                  <Ionicons name="shuffle" size={16} color="#FFFFFF" />
                  <Text style={styles.shuffleText}>Nova questao</Text>
                </TouchableOpacity>
              </View>
              {currentQuestion ? (
                <>
                  <Text style={styles.questionText}>{currentQuestion.question}</Text>
                  <View style={{ gap: 8, marginTop: 12 }}>
                    {currentQuestion.options.map((option, index) => {
                      const isCorrect = revealed && currentQuestion.correct_option === index + 1;
                      const isSelected = selected === index + 1;
                      return (
                        <TouchableOpacity
                          key={option}
                          onPress={() => handleSelect(index + 1)}
                          style={[
                            styles.optionCard,
                            isSelected && { borderColor: '#60A5FA', backgroundColor: 'rgba(96,165,250,0.18)' },
                            isCorrect && { borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.15)' },
                          ]}
                        >
                          <Text style={styles.optionLetter}>{String.fromCharCode(65 + index)}</Text>
                          <Text style={styles.optionText}>{option}</Text>
                          {isCorrect ? <Ionicons name="checkmark" size={18} color="#10B981" /> : null}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {revealed && currentQuestion.explanation ? (
                    <View style={styles.explanation}>
                      <Text style={styles.explanationTitle}>Explicacao</Text>
                      <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
                    </View>
                  ) : null}
                </>
              ) : (
                <Text style={styles.emptyText}>Cadastre perguntas na tabela quiz_questions para praticar.</Text>
              )}
            </View>

            {/* Estatisticas por materia */}
            <View style={{ gap: 12 }}>
              <Text style={styles.sectionTitle}>Desempenho por materia</Text>
              {subjectStats.map((subject) => (
                <View key={subject.id} style={styles.subjectCard}>
                  <View>
                    <Text style={styles.subjectName}>{subject.title}</Text>
                    <Text style={styles.subjectInfo}>
                      {subject.completed}/{subject.total} questoes resolvidas
                    </Text>
                  </View>
                  <View style={styles.subjectAccuracy}>
                    <Text style={styles.subjectAccuracyScore}>{subject.accuracy}%</Text>
                    <Text style={styles.subjectAccuracyLabel}>Precisao</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Provas oficiais */}
            <View style={{ gap: 12 }}>
              <View style={{ gap: 4 }}>
                <Text style={styles.sectionTitle}>Provas e gabaritos oficiais</Text>
                <Text style={styles.subtitle}>Veja os PDFs do ENEM direto por aqui.</Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.examChips}>
                {examList.map((examKey) => (
                  <TouchableOpacity
                    key={examKey}
                    style={[
                      styles.examChip,
                      selectedExam === examKey && { backgroundColor: 'rgba(255,255,255,0.18)', borderColor: '#FFFFFF' },
                    ]}
                    onPress={() => setSelectedExam(examKey)}
                  >
                    <Text style={styles.examChipText}>{examKey}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {activeResources.length === 0 ? (
                <Text style={styles.emptyText}>
                  Adicione recursos (kind = resource) no Supabase para o exame {selectedExam}.
                </Text>
              ) : yearsAvailable.length === 0 ? (
                <Text style={styles.emptyText}>Nao encontramos provas com ano no titulo.</Text>
              ) : (
                <View style={{ gap: 10 }}>
                  {yearsAvailable.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={styles.yearHeader}
                      onPress={() =>
                        router.push({
                          pathname: '/(tabs)/quiz/[year]',
                          params: { year, exam: selectedExam },
                        })
                      }
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.yearTitle}>{`ENEM ${year}`}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
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
  },
  loadingBox: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  loadingText: {
    color: '#FFFFFF',
  },
  errorText: {
    color: '#FECACA',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  maxWidth: {
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
    gap: 24,
  },
  examCard: {
    width: 140,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  examIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  examTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  examSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  questionCard: {
    backgroundColor: 'rgba(15,23,42,0.3)',
    borderRadius: 22,
    padding: 20,
    gap: 12,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  questionBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  shuffleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shuffleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  questionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 14,
  },
  optionLetter: {
    color: '#FFFFFF',
    fontWeight: '700',
    width: 20,
  },
  optionText: {
    color: '#FFFFFF',
    flex: 1,
  },
  explanation: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    padding: 12,
    borderRadius: 14,
    marginTop: 10,
  },
  explanationTitle: {
    color: '#10B981',
    fontWeight: '700',
    marginBottom: 6,
  },
  explanationText: {
    color: '#0F172A',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.7)',
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  subjectName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  subjectInfo: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  subjectAccuracy: {
    alignItems: 'center',
  },
  subjectAccuracyScore: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  subjectAccuracyLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontWeight: '700',
  },
  resourceCard: {
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  resourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  resourceTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  resourceSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  examChips: {
    gap: 10,
    paddingRight: 6,
  },
  examChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginRight: 6,
  },
  examChipText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  yearTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  yearHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  resourceBadge: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  resourceBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  resourceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    opacity: 0.8,
  },
  resourceMetaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
