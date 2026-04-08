import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import {
  getDailyStudyStats,
  getLessonProgressForUser,
  getLessons,
  getSubjects,
  subscribeToLessonProgress,
} from '../lib/firebaseData';
import { useAuthStore } from '../store/authStore';
import type {
  Lesson,
  LessonProgress,
  Subject,
  SubjectProgressSummary,
  RecentActivity,
  DailyStudyStat,
} from '../types/database';

export type ProgressOverview = {
  overallPercent: number;
  completedLessons: number;
  totalLessons: number;
  todayMinutes: number;
  weeklyMinutes: number;
  streak: number;
};

type ProgressState = {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  subjects: SubjectProgressSummary[];
  activities: RecentActivity[];
  overview: ProgressOverview;
};

const initialOverview: ProgressOverview = {
  overallPercent: 0,
  completedLessons: 0,
  totalLessons: 0,
  todayMinutes: 0,
  weeklyMinutes: 0,
  streak: 0,
};

const initialState: ProgressState = {
  loading: true,
  refreshing: false,
  error: null,
  subjects: [],
  activities: [],
  overview: initialOverview,
};

type LessonProgressRow = LessonProgress & {
  lesson: Lesson | null;
};

export function useProgress() {
  const user = useAuthStore((state) => state.user);
  const userId = user?.uid;
  const [state, setState] = useState<ProgressState>(initialState);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!userId) {
        setState((prev) => ({
          ...prev,
          loading: false,
          refreshing: false,
          subjects: [],
          activities: [],
          overview: initialOverview,
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        loading: opts?.silent ? prev.loading : true,
        refreshing: opts?.silent ? true : prev.refreshing,
        error: null,
      }));

      try {
        const [subjectsData, lessonsData, progressData, statsData] = await Promise.all([
          getSubjects(),
          getLessons(),
          getLessonProgressForUser(userId),
          getDailyStudyStats(userId),
        ]);

        const subjects = subjectsData as Subject[];
        const lessons = lessonsData as Lesson[];
        const lessonMap = new Map<string, Lesson>(lessons.map((lesson) => [lesson.id, lesson]));
        const progressRows = (progressData ?? []).map((item) => ({
          ...item,
          lesson: lessonMap.get(item.lesson_id) ?? null,
        })) as LessonProgressRow[];
        const stats = (statsData as DailyStudyStat[]) ?? [];

        const subjectsMap = new Map<string, Subject>(
          subjects.map((subject) => [subject.id, subject as Subject])
        );

        const progressMap = new Map<string, LessonProgressRow>();
        progressRows.forEach((row) => {
          if (row.lesson_id) {
            progressMap.set(row.lesson_id, row);
          }
        });

        type Acc = {
          subject: Subject;
          totalLessons: number;
          completedLessons: number;
          accumulatedPercent: number;
        };
        const subjectAccumulator = new Map<string, Acc>();

        lessons.forEach((lesson) => {
          const subject = subjectsMap.get(lesson.subject_id);
          if (!subject) return;

          const progress = progressMap.get(lesson.id);
          const percent = progress?.percent_complete ?? 0;
          const isDone = (progress?.status ?? 'todo') === 'done' || percent >= 100;

          if (!subjectAccumulator.has(subject.id)) {
            subjectAccumulator.set(subject.id, {
              subject,
              totalLessons: 0,
              completedLessons: 0,
              accumulatedPercent: 0,
            });
          }

          const acc = subjectAccumulator.get(subject.id)!;
          acc.totalLessons += 1;
          acc.accumulatedPercent += percent;
          if (isDone) acc.completedLessons += 1;
        });

        const subjectSummaries: SubjectProgressSummary[] = Array.from(
          subjectAccumulator.values()
        ).map((entry) => ({
          subject_id: entry.subject.id,
          subject_name: entry.subject.name,
          subject_slug: entry.subject.slug,
          color_hex: entry.subject.color_hex,
          icon: entry.subject.icon,
          completed_lessons: entry.completedLessons,
          total_lessons: entry.totalLessons,
          percent:
            entry.totalLessons > 0
              ? Math.round(entry.accumulatedPercent / entry.totalLessons)
              : 0,
        }));

        const completedLessons = subjectSummaries.reduce(
          (sum, item) => sum + item.completed_lessons,
          0
        );
        const totalLessons = subjectSummaries.reduce(
          (sum, item) => sum + item.total_lessons,
          0
        );

        const overview: ProgressOverview = {
          overallPercent:
            subjectSummaries.length > 0
              ? Math.round(
                  subjectSummaries.reduce((sum, item) => sum + item.percent, 0) /
                    subjectSummaries.length
                )
              : 0,
          completedLessons,
          totalLessons,
          todayMinutes: stats[0]?.minutes ?? 0,
          weeklyMinutes: stats.reduce((sum, item) => sum + (item.minutes ?? 0), 0),
          streak: stats[0]?.streak ?? 0,
        };

        const activities: RecentActivity[] = progressRows
          .filter((row) => row.lesson)
          .sort((a, b) => {
            const dateA = new Date(a.updated_at ?? a.created_at ?? '').getTime();
            const dateB = new Date(b.updated_at ?? b.created_at ?? '').getTime();
            return dateB - dateA;
          })
          .slice(0, 5)
          .map((row) => {
            const lesson = row.lesson!;
            const subjectName =
              subjectsMap.get(lesson.subject_id)?.name ?? 'Conteudo';
            return {
              id: row.id,
              lesson_title: lesson.title,
              subject_name: subjectName,
              status: row.status,
              updated_at: row.updated_at,
            };
          });

        setState({
          loading: false,
          refreshing: false,
          error: null,
          subjects: subjectSummaries,
          activities,
          overview,
        });
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          loading: false,
          refreshing: false,
          error: error?.message ?? 'Nao foi possivel carregar o progresso.',
        }));
      }
    },
    [userId]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = subscribeToLessonProgress(userId, () => fetchData({ silent: true }));
    return () => unsubscribe();
  }, [userId, fetchData]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('lesson-progress-sync', () => {
      fetchData({ silent: true });
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => fetchData({ silent: true }), 450);
    });
    return () => {
      sub.remove();
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [fetchData]);

  const refresh = useCallback(() => fetchData({ silent: true }), [fetchData]);

  return useMemo(
    () => ({
      ...state,
      refresh,
    }),
    [state, refresh]
  );
}
