import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
import { useT } from '../../lib/i18n';
import { useQuizBank } from '../../hooks/useQuizBank';
import { useStudyTracks } from '../../hooks/useStudyTracks';
import { useProgress } from '../../hooks/useProgress';

type ResourceItem = ReturnType<typeof useStudyTracks>['resources'][number] & {
  trackExam?: string;
};

const ACCENT_COLORS = ['#22D3EE', '#F97316', '#34D399', '#60A5FA', '#F472B6', '#A3E635'];

export default function QuizScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useThemeColors();
  const t = useT();
  const { width } = useWindowDimensions();
  const isWide = width > 760;
  const isTablet = width > 640;
  const bottomSpace = insets.bottom + 140;
  const examCardWidth = isTablet ? 180 : 160;
  const { questions, loading, error, exams, subjects: quizSubjects, randomQuestion } = useQuizBank();
  const { resources } = useStudyTracks();
  const { subjects: progressSubjects } = useProgress();
  const scrollRef = useRef<ScrollView>(null);
  const resourcesOffset = useRef(0);
  const lastScrollY = useRef(0);
  const contentHeightRef = useRef(0);
  const containerHeightRef = useRef(0);
  const freezeYRef = useRef<number | null>(null);
  const freezeGapRef = useRef(0);
  const hasQuestions = questions.length > 0;
  const [currentQuestion, setCurrentQuestion] = useState(randomQuestion || null);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [selectedExam, setSelectedExam] = useState('ENEM');

  useEffect(() => {
    if (!currentQuestion && randomQuestion) {
      setCurrentQuestion(randomQuestion);
    }
  }, [randomQuestion, currentQuestion]);

  useEffect(() => {
    if (!currentQuestion && questions.length > 0) {
      setCurrentQuestion(questions[0]);
    }
  }, [questions, currentQuestion]);

  const categories = useMemo(
    () =>
      exams.map((item) => ({
        id: item.exam,
        title: item.exam.toUpperCase(),
        questions: item.count,
      })),
    [exams]
  );
  const maxExamQuestions = useMemo(
    () => categories.reduce((max, item) => Math.max(max, item.questions || 0), 1),
    [categories]
  );

  const subjectStats = useMemo(() => {
    if (progressSubjects.length > 0) {
      return progressSubjects.map((item, idx) => ({
        id: item.subject_slug || item.subject_id || `progress-${idx}`,
        title: item.subject_name.toUpperCase(),
        accuracy: Math.min(100, Math.max(0, item.percent ?? 0)),
        completed: item.completed_lessons || 0,
        total: item.total_lessons || 0,
        color: item.color_hex || ACCENT_COLORS[idx % ACCENT_COLORS.length],
        source: 'progress' as const,
      }));
    }

    return quizSubjects.map((item, idx) => ({
      id: item.subject,
      title: item.subject.toUpperCase(),
      accuracy: 70 + Math.round(Math.random() * 20),
      completed: Math.round(item.count * 0.4),
      total: item.count,
      color: ACCENT_COLORS[idx % ACCENT_COLORS.length],
      source: 'quiz' as const,
    }));
  }, [progressSubjects, quizSubjects]);

  const handleShuffle = () => {
    if (questions.length === 0) return;
    setCurrentQuestion((prev) => {
      const pool = questions.filter((q) => q.id !== prev?.id);
      if (pool.length === 0) return prev ?? questions[0];
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
    if (examList.length === 0) return;
    if (!examList.includes(selectedExam)) {
      setSelectedExam(examList.includes('ENEM') ? 'ENEM' : examList[0]);
    }
  }, [examList, selectedExam]);

  const activeResources = examResources[selectedExam] || [];
  const displayResources = activeResources;

  const handleOpenResources = (exam?: string, shouldScroll?: boolean) => {
    if (exam) setSelectedExam(exam);
    if (!shouldScroll) return;
    const targetY = Math.max(resourcesOffset.current - 12, 0);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: targetY, animated: true });
    });
  };

  const rememberScroll = (y: number) => {
    lastScrollY.current = y;
  };

  const restoreIfPending = () => {
    if (freezeYRef.current == null) return;
    const containerH = containerHeightRef.current || 0;
    const maxY = Math.max(contentHeightRef.current - containerH, 0);
    const target = Math.max(0, maxY - freezeGapRef.current);
    freezeYRef.current = null;
    freezeGapRef.current = 0;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: target, animated: false });
      lastScrollY.current = target;
    });
  };
  

  const yearsAvailable = useMemo(() => {
    const set = new Set<string>();
    displayResources.forEach((item) => {
      const title = item.title || '';
      const match = /ENEM\s+(\d{4})/i.exec(title) || /(\d{4})/.exec(title);
      if (match?.[1]) set.add(match[1]);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [displayResources]);

  const yearMeta = useMemo(() => {
    const map = new Map<string, { color: string; count: number }>();
    displayResources.forEach((item) => {
      const title = item.title || '';
      const match = /ENEM\s+(\d{4})/i.exec(title) || /(\d{4})/.exec(title);
      if (!match?.[1]) return;
      const year = match[1];
      if (!map.has(year)) map.set(year, { color: item.trackColor, count: 0 });
      const entry = map.get(year)!;
      entry.count += 1;
      if (!entry.color && item.trackColor) entry.color = item.trackColor;
    });
    return map;
  }, [displayResources]);

  const heroStats = useMemo(
    () => [
      { label: 'Questoes', value: questions.length, icon: 'sparkles-outline' as const },
      { label: 'Exames', value: exams.length, icon: 'trophy-outline' as const },
      { label: 'Recursos', value: resources.length, icon: 'document-text-outline' as const },
    ],
    [questions.length, exams.length, resources.length]
  );
  useLayoutEffect(() => {
    restoreIfPending();
  }, [selectedExam, displayResources.length]);

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
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: bottomSpace,
            gap: 24,
            paddingTop: 16,
            alignItems: 'center',
          }}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          onLayout={(event) => {
            containerHeightRef.current = event.nativeEvent.layout.height;
          }}
          onContentSizeChange={(_w, h) => {
            contentHeightRef.current = h;
            restoreIfPending();
          }}
          onScroll={(event) => {
            rememberScroll(event.nativeEvent.contentOffset.y);
          }}
          onMomentumScrollEnd={(event) => rememberScroll(event.nativeEvent.contentOffset.y)}
          onScrollEndDrag={(event) => rememberScroll(event.nativeEvent.contentOffset.y)}
        >
          <View style={styles.maxWidth}>
            <View style={styles.heroCard}>
              <View style={styles.heroLeft}>
                <View style={styles.heroBadge}>
                  <Ionicons name="flash-outline" size={14} color="#0B1224" />
                  <Text style={styles.heroBadgeText}>Modo turbo ENEM</Text>
                </View>
                <Text style={styles.heroTitle}>Quiz & Provas</Text>
                <Text style={styles.heroSubtitle}>Revisao rapida com questoes reais e filtros para encontrar o caderno certo.</Text>
                <View style={styles.heroActions}>
                  <TouchableOpacity
                    onPress={handleShuffle}
                    style={[styles.primaryBtn, !hasQuestions && styles.btnDisabled]}
                    disabled={!hasQuestions}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="shuffle" size={16} color="#0B1224" />
                    <Text style={styles.primaryBtnText}>Nova questao</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.secondaryBtn, examList.length === 0 && styles.btnDisabled]}
                    onPress={() => {
                      if (examList.length > 0) {
                        setSelectedExam(examList.includes('ENEM') ? 'ENEM' : examList[0]);
                      }
                      handleOpenResources(undefined, true);
                    }}
                    disabled={examList.length === 0}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="folder-open-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.secondaryBtnText}>Abrir provas</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.heroChips}>
                  {examList.slice(0, 3).map((examKey) => (
                    <View key={examKey} style={styles.heroChip}>
                      <Text style={styles.heroChipText}>{examKey}</Text>
                    </View>
                  ))}
                  {examList.length === 0 ? (
                    <View style={styles.heroChip}>
                      <Text style={styles.heroChipText}>Cadastre exames</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <View style={[styles.heroStatsGrid, !isTablet && styles.heroStatsGridStacked]}>
                {heroStats.map((stat) => (
                  <View key={stat.label} style={styles.statCard}>
                    <View style={styles.statIcon}>
                      <Ionicons name={stat.icon} size={18} color="#0B1224" />
                    </View>
                    <Text style={styles.statValue}>{stat.value || '-'}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#FFFFFF" />
                <Text style={styles.loadingText}>Carregando banco de perguntas...</Text>
              </View>
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            {/* Questao destaque + materias */}
            <View style={[styles.splitRow, isWide && styles.splitRowWide]}>
              <View style={[styles.questionCard, isWide && styles.splitCol]}>
                <View style={styles.questionHeader}>
                  <View style={styles.questionBadge}>
                    <Ionicons name="flash-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.questionBadgeText}>{currentQuestion?.exam?.toUpperCase() || 'ENEM'}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleShuffle}
                    style={[styles.shuffleBtn, !hasQuestions && styles.btnDisabled]}
                    disabled={!hasQuestions}
                    activeOpacity={0.85}
                  >
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
              <View style={[styles.subjectPanel, isWide && styles.splitCol]}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Radar de materias</Text>
                  <View style={styles.sectionTag}>
                    <Ionicons name="pulse-outline" size={14} color="#0B1224" />
                    <Text style={styles.sectionTagText}>Priorize revisao</Text>
                  </View>
                </View>
                <View style={{ gap: 12 }}>
                  {subjectStats.map((subject) => (
                    <View key={subject.id} style={styles.subjectCard}>
                      <View style={{ flex: 1, gap: 6 }}>
                        <Text style={styles.subjectName}>{subject.title}</Text>
                        <Text style={styles.subjectInfo}>
                          {subject.source === 'progress'
                            ? `${subject.completed}/${subject.total || 0} aulas concluidas`
                            : `${subject.completed}/${subject.total} questoes resolvidas`}
                        </Text>
                        <View style={styles.progressTrack}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${Math.min(subject.accuracy, 100)}%`,
                                backgroundColor: subject.color || '#60A5FA',
                              },
                            ]}
                          />
                        </View>
                      </View>
                      <View style={styles.subjectAccuracy}>
                        <Text style={styles.subjectAccuracyScore}>
                          {Math.round(Math.min(100, Math.max(0, subject.accuracy)))}%
                        </Text>
                        <Text style={styles.subjectAccuracyLabel}>
                          {subject.source === 'progress' ? 'Progresso' : 'Precisao'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Categorias */}
            <View style={styles.panelCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderText}>
                  <Text style={styles.sectionTitle}>Rotas de simulados</Text>
                  <Text style={styles.subtitle}>Escolha um exame e veja quantas questoes ja temos prontas.</Text>
                </View>
                <View style={styles.sectionTag}>
                  <Ionicons name="bar-chart-outline" size={14} color="#0B1224" />
                  <Text style={styles.sectionTagText}>Auto-gerado</Text>
                </View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {categories.length === 0 ? (
                  <View style={styles.emptyPill}>
                    <Text style={styles.emptyText}>Nenhum exame cadastrado ainda.</Text>
                  </View>
                ) : (
                  categories.map((cat, idx) => {
                    const color = ACCENT_COLORS[idx % ACCENT_COLORS.length];
                    const ratio = Math.min(100, Math.round((cat.questions / maxExamQuestions) * 100));
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.examCard,
                          { width: examCardWidth, borderColor: `${color}33`, backgroundColor: 'rgba(255,255,255,0.08)' },
                        ]}
                        onPress={() => handleOpenResources(cat.title, true)}
                      >
                        <View style={[styles.examIcon, { backgroundColor: `${color}1A` }]}>
                          <Ionicons name="ribbon-outline" size={18} color={color} />
                        </View>
                        <View style={styles.examCardBody}>
                          <Text style={styles.examTitle}>{cat.title}</Text>
                          <Text style={[styles.examSubtitle, { color }]}>{cat.questions} questoes</Text>
                        </View>
                        <View style={styles.examBar}>
                          <View style={[styles.examBarFill, { width: `${ratio}%`, backgroundColor: color }]} />
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </View>

            {/* Provas oficiais */}
            <View
              style={[styles.panelCard, { gap: 12 }]}
              onLayout={(e) => {
                resourcesOffset.current = e.nativeEvent.layout.y;
              }}
            >
              <View style={styles.sectionHeader}>
                <View style={{ gap: 4 }}>
                  <Text style={styles.sectionTitle}>Provas e gabaritos oficiais</Text>
                  <Text style={styles.subtitle}>Veja os PDFs do ENEM direto por aqui.</Text>
                </View>
                <View style={styles.sectionTag}>
                  <Ionicons name="download-outline" size={14} color="#0B1224" />
                  <Text style={styles.sectionTagText}>PDF</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.enemCta}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/quiz/[year]',
                    params: { year: '2025', exam: 'ENEM' },
                  })
                }
                activeOpacity={0.88}
              >
                <View style={styles.enemCtaIcon}>
                  <Ionicons name="ribbon-outline" size={18} color="#0B1224" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.enemCtaTitle}>{t('quiz_cta_enem') ?? 'ENEM 2025'}</Text>
                  <Text style={styles.enemCtaSubtitle}>{t('quiz_cta_subtitle') ?? 'Provas e gabaritos oficiais'}</Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color="#0B1224" />
              </TouchableOpacity>

              {activeResources.length === 0 ? (
                <Text style={styles.emptyText}>
                  Adicione recursos (kind = resource) no Firebase para o exame {selectedExam}.
                </Text>
              ) : displayResources.length === 0 ? (
                <Text style={styles.emptyText}>
                  Nenhum PDF encontrado para este exame.
                </Text>
              ) : yearsAvailable.length === 0 ? (
                <Text style={styles.emptyText}>
                  Nao encontramos ano no titulo usando ENEM 2025 ou qualquer 4 digitos.
                </Text>
              ) : (
                <View style={{ gap: 10 }}>
                  {yearsAvailable.map((year) => {
                    const info = yearMeta.get(year);
                    const color = info?.color || '#FFFFFF';
                    return (
                      <TouchableOpacity
                        key={year}
                        style={[styles.yearHeader, { borderColor: `${color}33`, backgroundColor: `${color}12` }]}
                        onPress={() =>
                          router.push({
                            pathname: '/(tabs)/quiz/[year]',
                            params: { year, exam: selectedExam },
                          })
                        }
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View style={[styles.yearDot, { backgroundColor: color }]} />
                          <View>
                            <Text style={styles.yearTitle}>{`ENEM ${year}`}</Text>
                            <Text style={styles.yearSubtitle}>
                              {info?.count ? `${info.count} PDFs` : 'Provas e gabaritos'}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.yearBullet}>
                          <Text style={styles.yearBulletText}>{info?.count || 1}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
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
  heroCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row',
    gap: 18,
    alignItems: 'stretch',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  heroLeft: {
    flex: 1,
    gap: 10,
    minWidth: 260,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#A5E4FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  heroBadgeText: {
    color: '#0B1224',
    fontWeight: '800',
    letterSpacing: 0.4,
    fontSize: 12,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 560,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  primaryBtn: {
    backgroundColor: '#A5E4FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#0B1224',
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.55,
  },
  secondaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  heroChips: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  heroChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  heroChipText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  heroStatsGrid: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    minWidth: 220,
    justifyContent: 'flex-end',
    flex: 1,
  },
  heroStatsGridStacked: {
    width: '100%',
    justifyContent: 'flex-start',
  },
  statCard: {
    flexGrow: 1,
    minWidth: 110,
    maxWidth: 140,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: 8,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#A5E4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  panelCard: {
    gap: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    width: '100%',
    alignSelf: 'stretch',
  },
  sectionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#A5E4FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  sectionTagText: {
    color: '#0B1224',
    fontWeight: '800',
    fontSize: 12,
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
    maxWidth: 1080,
    alignSelf: 'center',
    gap: 24,
  },
  examCard: {
    width: 180,
    borderRadius: 18,
    padding: 14,
    gap: 10,
    borderWidth: 1,
  },
  examIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  examCardBody: {
    gap: 4,
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
  examBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  examBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  questionCard: {
    backgroundColor: 'rgba(15,23,42,0.3)',
    borderRadius: 22,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
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
  splitRow: {
    width: '100%',
    gap: 16,
  },
  splitRowWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  splitCol: {
    flex: 1,
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
    color: '#0B1224',
    fontWeight: '800',
    fontSize: 12,
    width: 28,
    height: 28,
    lineHeight: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(165,228,255,0.9)',
    textAlign: 'center',
    textAlignVertical: 'center',
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
  emptyPill: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  subjectPanel: {
    gap: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 10,
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
  progressTrack: {
    height: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#A5E4FF',
    borderRadius: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionHeaderText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
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
  filterSurface: {
    width: '100%',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.14)',
    gap: 10,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    width: '100%',
  },
  filterRowStacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 200,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  searchInput: { color: '#FFFFFF', flex: 1, paddingVertical: 0 },
  filterChips: { flexDirection: 'row', gap: 8, paddingLeft: 4 },
  filterWrap: {
    flexWrap: 'wrap',
    gap: 8,
    rowGap: 8 as any,
    flexGrow: 1,
    width: '100%',
  },
  filterChipText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#A5E4FF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  clearBtnText: {
    color: '#0B1224',
    fontWeight: '700',
    fontSize: 12,
  },
  fullWidth: { width: '100%' },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  filterChipActive: {
    borderColor: '#A5E4FF',
    backgroundColor: 'rgba(165,228,255,0.22)',
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
  yearDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  enemCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  enemCtaIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enemCtaTitle: { color: '#0B1224', fontSize: 16, fontWeight: '800' },
  enemCtaSubtitle: { color: '#475569', fontSize: 12 },
  yearSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  yearBullet: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  yearBulletText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
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
