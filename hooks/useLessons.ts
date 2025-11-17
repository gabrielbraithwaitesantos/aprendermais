import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import type { Lesson, LessonProgress, Subject } from '../types/database';

type LessonRow = Lesson & {
  subject?: Pick<Subject, 'id' | 'slug' | 'name' | 'color_hex'>;
};

export type LessonWithMeta = LessonRow & {
  progress?: LessonProgress | null;
};

type LessonState = {
  loading: boolean;
  error: string | null;
  lessons: LessonWithMeta[];
};

const initialState: LessonState = {
  loading: true,
  error: null,
  lessons: [],
};

export function useLessons() {
  const user = useAuthStore((state) => state.user);
  const [state, setState] = useState<LessonState>(initialState);

  const fetchLessons = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase
        .from('lessons')
        .select('*, subject:subjects(id, name, slug, color_hex)')
        .order('is_featured', { ascending: false })
        .order('order_index', { ascending: true });

      if (error) throw error;

      const rows = (data ?? []) as LessonRow[];
      let progressMap = new Map<string, LessonProgress>();

      if (user?.id && rows.length > 0) {
        const lessonIds = rows.map((row) => row.id);
        const { data: progressData, error: progressError } = await supabase
          .from('lesson_progress')
          .select('*')
          .eq('user_id', user.id)
          .in('lesson_id', lessonIds);

        if (progressError) throw progressError;
        (progressData ?? []).forEach((item) => {
          progressMap.set(item.lesson_id, item);
        });
      }

      const lessons: LessonWithMeta[] = rows.map((row) => ({
        ...row,
        progress: progressMap.get(row.id),
      }));

      setState({ lessons, loading: false, error: null });
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error?.message ?? 'Nao foi possivel carregar as aulas.',
      }));
    }
  }, [user?.id]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const featured = useMemo(
    () => state.lessons.filter((lesson) => lesson.is_featured),
    [state.lessons]
  );

  const subjectsMeta = useMemo(() => {
    const map = new Map<
      string,
      { slug: string; name: string; color: string; lessons: number }
    >();
    state.lessons.forEach((lesson) => {
      const slug = lesson.subject_tag || lesson.subject?.slug || 'geral';
      const existing = map.get(slug);
      const label =
        lesson.subject?.name ||
        lesson.subject_tag.charAt(0).toUpperCase() + lesson.subject_tag.slice(1);
      const color = lesson.subject?.color_hex || '#4F46E5';
      if (existing) {
        existing.lessons += 1;
      } else {
        map.set(slug, { slug, name: label, color, lessons: 1 });
      }
    });
    return Array.from(map.values());
  }, [state.lessons]);

  const lessonsBySubject = useMemo(() => {
    const grouped = new Map<string, LessonWithMeta[]>();
    state.lessons.forEach((lesson) => {
      const key = lesson.subject_tag || lesson.subject?.slug || 'geral';
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(lesson);
    });
    return grouped;
  }, [state.lessons]);

  const toggleLessonCompletion = useCallback(
    async (lessonId: string) => {
      if (!user?.id) return;
      const lesson = state.lessons.find((item) => item.id === lessonId);
      const current = lesson?.progress;

      if (current?.status === 'done') {
        await supabase.from('lesson_progress').delete().eq('id', current.id);
      } else {
        await supabase.from('lesson_progress').upsert({
          lesson_id: lessonId,
          user_id: user.id,
          percent_complete: 100,
          status: 'done',
          completed_at: new Date().toISOString(),
        });
      }
      fetchLessons();
    },
    [user?.id, state.lessons, fetchLessons]
  );

  return {
    ...state,
    featuredLessons: featured,
    subjectsMeta,
    lessonsBySubject,
    refresh: fetchLessons,
    toggleLessonCompletion,
  };
}
