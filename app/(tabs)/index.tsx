import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useThemeColors } from '../../store/themeStore';
import { Link, useRouter } from 'expo-router';
import { useProgress } from '../../hooks/useProgress';

const { width } = Dimensions.get('window');



export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuthStore();
  const theme = useThemeColors();
  const router = useRouter();
  const {
    loading: progressLoading,
    subjects: subjectProgress,
    activities,
    overview,
    refresh,
    error: progressError,
  } = useProgress();

  const subjectMetaMap = useMemo(() => {
    const map = new Map<string, { color: string; icon?: string | null; slug?: string }>();
    subjectProgress.forEach((subject) => {
      map.set(subject.subject_name, {
        color: subject.color_hex,
        icon: subject.icon,
        slug: subject.subject_slug ?? subject.subject_id,
      });
    });
    return map;
  }, [subjectProgress]);

  const formatRelativeTime = (value?: string | null) => {
    if (!value) return 'agora';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'agora';
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.max(0, Math.floor(diffMs / 60000));
    if (minutes < 1) return 'agora';
    if (minutes < 60) return `${minutes}m atras`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atras`;
    const days = Math.floor(hours / 24);
    return `${days}d atras`;
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'done':
        return 'Concluido';
      case 'in_progress':
        return 'Em progresso';
      default:
        return 'Nao iniciado';
    }
  };

  const overallPercent = Math.min(100, Math.max(0, overview.overallPercent || 0));
  const hasSubjects = subjectProgress.length > 0;
  const hasActivities = activities.length > 0;
  const quickActions = useMemo(
    () => [
      {
        id: 'continue',
        label: 'Continuar',
        icon: 'play-circle' as const,
        color: '#10B981',
        path: '/(tabs)/videos',
      },
      {
        id: 'explore',
        label: 'Explorar',
        icon: 'search' as const,
        color: '#F59E0B',
        path: '/(tabs)/biblioteca',
      },
      {
        id: 'achievements',
        label: 'Conquistas',
        icon: 'trophy' as const,
        color: '#8B5CF6',
        path: '/(tabs)/mais',
      },
      {
        id: 'settings',
        label: 'Configurações',
        icon: 'settings' as const,
        color: '#3B82F6',
        path: '/(tabs)/perfil',
      },
    ],
    []
  );

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={theme.gradient}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/images/hero-logo.png')}
                resizeMode='contain'
                style={styles.heroLogo}
              />
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.greeting}>Ola, {user?.user_metadata?.name || 'Estudante'}!</Text>
              <Text style={styles.subtitle}>Continue aprendendo</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress Overview */}
          <View style={styles.progressSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Seu progresso</Text>
              <TouchableOpacity
                style={styles.sectionAction}
                onPress={refresh}
                disabled={progressLoading}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={progressLoading ? 'time-outline' : 'refresh-outline'}
                  size={16}
                  color="white"
                />
                <Text style={styles.sectionActionText}>
                  {progressLoading ? 'Atualizando' : 'Atualizar'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.progressCard}>
              {progressError ? (
                <Text style={styles.progressError}>{progressError}</Text>
              ) : null}
              {progressLoading ? (
                <View style={styles.progressLoading}>
                  <ActivityIndicator color="#FFFFFF" />
                  <Text style={styles.progressLoadingText}>Buscando seus dados...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressTitle}>Progresso geral</Text>
                    <Text style={styles.progressPercentage}>{overallPercent}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${overallPercent}%` }]} />
                  </View>
                  <Text style={styles.progressText}>
                    {overview.totalLessons > 0
                      ? `${overview.completedLessons} de ${overview.totalLessons} aulas concluidas`
                      : 'Cadastre aulas e materias no Supabase para liberar este grafico.'}
                  </Text>
                  <View style={styles.progressStats}>
                    <View style={styles.progressStat}>
                      <Text style={styles.progressStatLabel}>Hoje</Text>
                      <Text style={styles.progressStatValue}>{overview.todayMinutes} min</Text>
                    </View>
                    <View style={styles.progressStat}>
                      <Text style={styles.progressStatLabel}>Semana</Text>
                      <Text style={styles.progressStatValue}>{overview.weeklyMinutes} min</Text>
                    </View>
                    <View style={styles.progressStat}>
                      <Text style={styles.progressStatLabel}>Streak</Text>
                      <Text style={styles.progressStatValue}>{overview.streak} dias</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Subjects Grid */}
          <View style={styles.subjectsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Suas materias</Text>
              {progressLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
            </View>
            {hasSubjects ? (
              <View style={styles.subjectsGrid}>
                {subjectProgress.map((subject) => {
                  const widthPercent = Math.min(100, Math.max(0, subject.percent));
                  const iconName = (subject.icon as any) || 'book-outline';
                  return (
                    <Link
                      key={subject.subject_id}
                      href={{
                        pathname: '/(tabs)/materias/[id]',
                        params: {
                          id: subject.subject_slug ?? subject.subject_id,
                          name: subject.subject_name,
                          color: subject.color_hex,
                        },
                      }}
                      asChild
                    >
                      <TouchableOpacity style={styles.subjectCard} activeOpacity={0.9}>
                        <View style={[styles.subjectIcon, { backgroundColor: subject.color_hex }]}>
                          <Ionicons name={iconName} size={26} color="#FFFFFF" />
                        </View>
                        <Text style={styles.subjectName}>{subject.subject_name}</Text>
                        <View style={styles.subjectProgress}>
                          <View style={styles.subjectProgressBar}>
                            <View
                              style={[
                                styles.subjectProgressFill,
                                { width: `${widthPercent}%`, backgroundColor: subject.color_hex },
                              ]}
                            />
                          </View>
                          <Text style={styles.subjectProgressText}>
                            {subject.completed_lessons} / {subject.total_lessons} aulas
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </Link>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.emptyText}>
                Nenhuma materia cadastrada ainda. Cadastre materias e aulas no Supabase para destravar essa area.
              </Text>
            )}
          </View>

          {/* Recent Activities */}
          <View style={styles.activitiesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Atividades recentes</Text>
            </View>
            {progressLoading ? (
              <View style={styles.progressLoading}>
                <ActivityIndicator color="#FFFFFF" />
              </View>
            ) : hasActivities ? (
              <View style={styles.activitiesList}>
                {activities.map((activity) => {
                  const meta = subjectMetaMap.get(activity.subject_name);
                  const color = meta?.color ?? 'rgba(255,255,255,0.2)';
                  const iconName = (meta?.icon as any) || 'book-outline';
                  const subjectId = meta?.slug ?? activity.subject_name.toLowerCase();
                  return (
                    <Link
                      key={activity.id}
                      href={{
                        pathname: '/(tabs)/materias/[id]',
                        params: {
                          id: subjectId,
                          name: activity.subject_name,
                          color,
                        },
                      }}
                      asChild
                    >
                      <TouchableOpacity style={styles.activityCard} activeOpacity={0.9}>
                        <View style={[styles.activityIcon, { backgroundColor: color }]}>
                          <Ionicons name={iconName} size={20} color="#FFFFFF" />
                        </View>
                        <View style={styles.activityContent}>
                          <Text style={styles.activitySubject}>{activity.subject_name}</Text>
                          <Text style={styles.activityText}>{activity.lesson_title}</Text>
                          <Text style={styles.activityTime}>
                            {statusLabel(activity.status)} - {formatRelativeTime(activity.updated_at)}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
                      </TouchableOpacity>
                    </Link>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.emptyText}>
                Ainda nao temos atividades para mostrar. Inicie uma aula ou revisao para ver o historico aqui.
              </Text>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsSection}>
            <Text style={[styles.sectionTitle, styles.sectionStandaloneTitle]}>Acoes Rapidas</Text>
            <View style={styles.actionsGrid}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.actionCard}
                  onPress={() => router.push(action.path)}
                >
                  <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                    <Ionicons name={action.icon} size={24} color="white" />
                  </View>
                  <Text style={styles.actionText}>{action.label}</Text>
                </TouchableOpacity>
              ))}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
    minWidth: 0,
    marginTop: 4,
  },
  logoContainer: {
    alignItems: 'center',
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  heroLogo: {
    width: 46,
    height: 46,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    alignSelf: 'flex-start',
    marginTop: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  sectionActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionStandaloneTitle: {
    marginBottom: 16,
  },
  progressSection: {
    marginBottom: 32,
  },
  progressCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    gap: 12,
  },
  progressStat: {
    flex: 1,
  },
  progressStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  progressStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  progressError: {
    marginBottom: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(248,113,113,0.2)',
    color: '#FEE2E2',
    fontSize: 13,
  },
  progressLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  progressLoadingText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  subjectsSection: {
    marginBottom: 32,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 12,
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  subjectCard: {
    width: (width - 72) / 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  subjectIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectIconText: {
    fontSize: 28,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  subjectProgress: {
    width: '100%',
    alignItems: 'center',
  },
  subjectProgressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    marginBottom: 8,
  },
  subjectProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  subjectProgressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  activitiesSection: {
    marginBottom: 32,
  },
  activitiesList: {
    gap: 12,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activitySubject: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  activityText: {
    fontSize: 16,
    color: 'white',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  actionsSection: {
    marginBottom: 40,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  actionCard: {
    width: (width - 72) / 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
});
