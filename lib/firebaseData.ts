import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  setDoc,
  Timestamp,
  where,
  writeBatch,
  type DocumentData,
  type QueryConstraint,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';

import { db } from './firebase';
import {
  LESSONS_SEED,
  QUIZ_QUESTIONS_SEED,
  STUDY_TRACK_ITEMS_SEED,
  STUDY_TRACKS_SEED,
  SUBJECTS_SEED,
} from '../data/firebaseSeed';
import { OFFICIAL_RESOURCES } from '../data/officialResources';
import type {
  DailyStudyStat,
  Lesson,
  LessonProgress,
  QuizQuestion,
  StudyTrack,
  StudyTrackItem,
  Subject,
  User as AppUser,
} from '../types/database';

export type StudyTrackWithItems = StudyTrack & {
  items: StudyTrackItem[];
  created_at?: string;
};

const CONTENT_SEED_VERSION = '2026-04-01';
let seedPromise: Promise<void> | null = null;

const toIsoDate = (value: unknown, fallback?: string) => {
  if (typeof value === 'string' && value.length > 0) return value;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return fallback ?? new Date().toISOString();
};

const toNumber = (value: unknown, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const normalizeSubject = (id: string, data: DocumentData): Subject => ({
  id,
  slug: String(data.slug ?? id),
  name: String(data.name ?? 'Materia'),
  color_hex: String(data.color_hex ?? '#4F46E5'),
  icon: data.icon ? String(data.icon) : null,
  created_at: toIsoDate(data.created_at),
});

const normalizeLesson = (id: string, data: DocumentData): Lesson => ({
  id,
  subject_id: String(data.subject_id ?? ''),
  title: String(data.title ?? 'Aula'),
  module: String(data.module ?? 'Geral'),
  order_index: toNumber(data.order_index, 0),
  duration_minutes: toNumber(data.duration_minutes, 15),
  difficulty:
    data.difficulty === 'advanced' || data.difficulty === 'intermediate'
      ? data.difficulty
      : 'beginner',
  subject_tag: String(data.subject_tag ?? 'geral'),
  description: data.description ? String(data.description) : null,
  video_url: data.video_url ? String(data.video_url) : null,
  thumbnail_url: data.thumbnail_url ? String(data.thumbnail_url) : null,
  resource_url: data.resource_url ? String(data.resource_url) : null,
  is_featured: Boolean(data.is_featured),
  created_at: toIsoDate(data.created_at),
});

const normalizeLessonProgress = (id: string, data: DocumentData): LessonProgress => ({
  id,
  user_id: String(data.user_id ?? ''),
  lesson_id: String(data.lesson_id ?? ''),
  percent_complete: toNumber(data.percent_complete, 0),
  status:
    data.status === 'done' || data.status === 'in_progress' ? data.status : 'todo',
  completed_at: data.completed_at ? toIsoDate(data.completed_at) : null,
  updated_at: toIsoDate(data.updated_at),
  created_at: toIsoDate(data.created_at),
});

const normalizeDailyStat = (id: string, data: DocumentData): DailyStudyStat => ({
  id,
  user_id: String(data.user_id ?? ''),
  day: String(data.day ?? ''),
  minutes: toNumber(data.minutes, 0),
  completed_lessons: toNumber(data.completed_lessons, 0),
  streak: toNumber(data.streak, 0),
  created_at: toIsoDate(data.created_at),
});

const normalizeTrack = (id: string, data: DocumentData): StudyTrackWithItems => ({
  id,
  slug: String(data.slug ?? id),
  title: String(data.title ?? 'Trilha'),
  description: data.description ? String(data.description) : null,
  exam: data.exam ? String(data.exam) : null,
  color_hex: String(data.color_hex ?? '#4F46E5'),
  cover_url: data.cover_url ? String(data.cover_url) : null,
  items: [],
  created_at: toIsoDate(data.created_at),
});

const normalizeTrackItem = (id: string, data: DocumentData): StudyTrackItem => ({
  id,
  track_id: String(data.track_id ?? ''),
  lesson_id: data.lesson_id ? String(data.lesson_id) : null,
  order_index: toNumber(data.order_index, 0),
  kind: data.kind === 'lesson' ? 'lesson' : 'resource',
  title: data.title ? String(data.title) : null,
  description: data.description ? String(data.description) : null,
  resource_url: data.resource_url ? String(data.resource_url) : null,
  estimated_minutes: toNumber(data.estimated_minutes, 15),
});

const normalizeQuizQuestion = (id: string, data: DocumentData): QuizQuestion => ({
  id,
  exam: String(data.exam ?? 'ENEM'),
  subject: String(data.subject ?? 'geral'),
  difficulty:
    data.difficulty === 'dificil' || data.difficulty === 'medio' ? data.difficulty : 'facil',
  question: String(data.question ?? ''),
  options: Array.isArray(data.options)
    ? data.options.map((value: unknown) => String(value))
    : [],
  correct_option: toNumber(data.correct_option, 1),
  explanation: data.explanation ? String(data.explanation) : null,
  reference_url: data.reference_url ? String(data.reference_url) : null,
});

const normalizeUserProfile = (id: string, data: DocumentData): AppUser => ({
  id,
  email: String(data.email ?? ''),
  name: String(data.name ?? 'Estudante'),
  exam_targets: Array.isArray(data.exam_targets)
    ? data.exam_targets.map((item: unknown) => String(item) as AppUser['exam_targets'][number])
    : [],
  weaknesses: Array.isArray(data.weaknesses)
    ? data.weaknesses.map((item: unknown) => String(item))
    : [],
  created_at: toIsoDate(data.created_at),
  updated_at: toIsoDate(data.updated_at),
});

async function seedContentIfNeeded() {
  try {
    const markerRef = doc(db, 'app_meta', 'content_seed');
    const marker = await getDoc(markerRef);
    const markerVersion = marker.data()?.version;

    if (marker.exists() && markerVersion === CONTENT_SEED_VERSION) {
      return;
    }

    const batch = writeBatch(db);
    SUBJECTS_SEED.forEach((subject) => {
      batch.set(doc(db, 'subjects', subject.id), subject, { merge: true });
    });
    LESSONS_SEED.forEach((lesson) => {
      batch.set(doc(db, 'lessons', lesson.id), lesson, { merge: true });
    });
    QUIZ_QUESTIONS_SEED.forEach((question) => {
      batch.set(doc(db, 'quiz_questions', question.id), question, { merge: true });
    });
    STUDY_TRACKS_SEED.forEach((track) => {
      batch.set(doc(db, 'study_tracks', track.id), track, { merge: true });
    });
    STUDY_TRACK_ITEMS_SEED.forEach((item) => {
      batch.set(doc(db, 'study_track_items', item.id), item, { merge: true });
    });

    batch.set(
      markerRef,
      {
        version: CONTENT_SEED_VERSION,
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );

    await batch.commit();
  } catch (error) {
    console.warn('[firebase] nao foi possivel semear conteudo inicial:', error);
  }
}

export async function ensureSeedData() {
  if (!seedPromise) {
    seedPromise = seedContentIfNeeded();
  }
  return seedPromise;
}

export async function getSubjects(): Promise<Subject[]> {
  await ensureSeedData();
  try {
    const snapshot = await getDocs(collection(db, 'subjects'));
    const rows = snapshot.docs.map((item) => normalizeSubject(item.id, item.data()));
    if (rows.length === 0) return SUBJECTS_SEED;
    return rows.sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return SUBJECTS_SEED;
  }
}

export async function getLessons(): Promise<Lesson[]> {
  await ensureSeedData();
  try {
    const snapshot = await getDocs(collection(db, 'lessons'));
    const rows = snapshot.docs.map((item) => normalizeLesson(item.id, item.data()));
    if (rows.length === 0) return LESSONS_SEED;
    return rows.sort((a, b) => {
      const featuredDelta = Number(b.is_featured) - Number(a.is_featured);
      if (featuredDelta !== 0) return featuredDelta;
      return a.order_index - b.order_index;
    });
  } catch {
    return LESSONS_SEED;
  }
}

export async function getLessonProgressForUser(userId: string): Promise<LessonProgress[]> {
  if (!userId) return [];

  try {
    const progressRef = collection(db, 'lesson_progress');
    const snapshot = await getDocs(query(progressRef, where('user_id', '==', userId)));
    return snapshot.docs.map((item) => normalizeLessonProgress(item.id, item.data()));
  } catch {
    return [];
  }
}

export async function setLessonProgress(
  userId: string,
  lessonId: string,
  payload: {
    percent_complete: number;
    status: 'todo' | 'in_progress' | 'done';
    completed_at: string | null;
  }
): Promise<LessonProgress> {
  const id = `${userId}_${lessonId}`;
  const ref = doc(db, 'lesson_progress', id);
  const now = new Date().toISOString();
  const basePayload = {
    user_id: userId,
    lesson_id: lessonId,
    percent_complete: payload.percent_complete,
    status: payload.status,
    completed_at: payload.completed_at,
    updated_at: now,
    created_at: now,
  };

  await setDoc(ref, basePayload, { merge: true });

  return normalizeLessonProgress(id, basePayload);
}

export async function getDailyStudyStats(userId: string): Promise<DailyStudyStat[]> {
  if (!userId) return [];
  try {
    const statsRef = collection(db, 'daily_study_stats');
    const snapshot = await getDocs(query(statsRef, where('user_id', '==', userId)));
    const rows = snapshot.docs.map((item) => normalizeDailyStat(item.id, item.data()));
    return rows.sort((a, b) => b.day.localeCompare(a.day));
  } catch {
    return [];
  }
}

export async function getStudyTracksWithItems(): Promise<StudyTrackWithItems[]> {
  await ensureSeedData();

  try {
    const [tracksSnapshot, itemsSnapshot] = await Promise.all([
      getDocs(collection(db, 'study_tracks')),
      getDocs(collection(db, 'study_track_items')),
    ]);

    const tracks = new Map<string, StudyTrackWithItems>();

    tracksSnapshot.docs.forEach((trackDoc) => {
      tracks.set(trackDoc.id, normalizeTrack(trackDoc.id, trackDoc.data()));
    });

    itemsSnapshot.docs.forEach((itemDoc) => {
      const item = normalizeTrackItem(itemDoc.id, itemDoc.data());
      const track = tracks.get(item.track_id);
      if (!track) return;
      track.items.push(item);
    });

    const rows = Array.from(tracks.values()).map((track) => ({
      ...track,
      items: [...track.items].sort((a, b) => a.order_index - b.order_index),
    }));

    if (rows.length > 0) {
      return rows.sort((a, b) => a.title.localeCompare(b.title));
    }

    return fallbackTracks();
  } catch {
    return fallbackTracks();
  }
}

function fallbackTracks(): StudyTrackWithItems[] {
  const tracks = STUDY_TRACKS_SEED.map((track) => ({ ...track, items: [] as StudyTrackItem[] }));
  const map = new Map(tracks.map((track) => [track.id, track]));

  STUDY_TRACK_ITEMS_SEED.forEach((item) => {
    const track = map.get(item.track_id);
    if (!track) return;
    track.items.push(item);
  });

  return tracks
    .map((track) => ({
      ...track,
      items: [...track.items].sort((a, b) => a.order_index - b.order_index),
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function getStudyTrackItemById(resourceId: string): Promise<{
  id: string;
  title: string | null;
  description: string | null;
  resource_url: string | null;
  kind: string;
  track?: { title: string } | null;
} | null> {
  try {
    const itemRef = doc(db, 'study_track_items', resourceId);
    const itemSnapshot = await getDoc(itemRef);

    if (itemSnapshot.exists()) {
      const item = normalizeTrackItem(itemSnapshot.id, itemSnapshot.data());
      const trackRef = doc(db, 'study_tracks', item.track_id);
      const trackSnapshot = await getDoc(trackRef);
      const trackTitle = trackSnapshot.exists()
        ? String(trackSnapshot.data()?.title ?? 'Trilha oficial')
        : 'Trilha oficial';

      return {
        id: item.id,
        title: item.title ?? null,
        description: item.description ?? null,
        resource_url: item.resource_url ?? null,
        kind: item.kind,
        track: { title: trackTitle },
      };
    }
  } catch {
    // fallback below
  }

  const fallback = OFFICIAL_RESOURCES.find((item) => item.id === resourceId);
  if (!fallback) return null;

  return {
    id: fallback.id,
    title: fallback.title,
    description: fallback.description,
    resource_url: fallback.url,
    kind: 'resource',
    track: { title: fallback.trackTitle },
  };
}

export async function getQuizQuestions(filters?: {
  exam?: string;
  subject?: string;
}): Promise<QuizQuestion[]> {
  await ensureSeedData();

  const constraints: QueryConstraint[] = [];
  if (filters?.exam) constraints.push(where('exam', '==', filters.exam));
  if (filters?.subject) constraints.push(where('subject', '==', filters.subject));

  try {
    const ref = collection(db, 'quiz_questions');
    const snapshot = constraints.length > 0 ? await getDocs(query(ref, ...constraints)) : await getDocs(ref);
    const rows = snapshot.docs.map((item) => normalizeQuizQuestion(item.id, item.data()));
    if (rows.length > 0) {
      return rows.sort((a, b) => a.id.localeCompare(b.id));
    }
  } catch {
    // fallback below
  }

  return QUIZ_QUESTIONS_SEED.filter((question) => {
    if (filters?.exam && question.exam !== filters.exam) return false;
    if (filters?.subject && question.subject !== filters.subject) return false;
    return true;
  });
}

export async function syncAuthUserProfile(user: FirebaseUser) {
  const ref = doc(db, 'users', user.uid);
  const now = new Date().toISOString();
  const payload = {
    id: user.uid,
    email: user.email ?? '',
    name: user.displayName ?? 'Estudante',
    exam_targets: ['ENEM'],
    weaknesses: [] as string[],
    created_at: now,
    updated_at: now,
  };

  await setDoc(ref, payload, { merge: true });
}

export async function getUserProfile(userId: string): Promise<AppUser | null> {
  if (!userId) return null;

  try {
    const snapshot = await getDoc(doc(db, 'users', userId));
    if (!snapshot.exists()) return null;
    return normalizeUserProfile(snapshot.id, snapshot.data());
  } catch {
    return null;
  }
}

export async function updateUserProfile(userId: string, updates: Partial<AppUser>): Promise<AppUser | null> {
  if (!userId) return null;

  const ref = doc(db, 'users', userId);
  await setDoc(
    ref,
    {
      ...updates,
      updated_at: new Date().toISOString(),
    },
    { merge: true }
  );

  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return normalizeUserProfile(snapshot.id, snapshot.data());
}

export async function listUserProfiles(maxItems = 10): Promise<AppUser[]> {
  try {
    const snapshot = await getDocs(query(collection(db, 'users'), limit(maxItems)));
    return snapshot.docs.map((item) => normalizeUserProfile(item.id, item.data()));
  } catch {
    return [];
  }
}

export function subscribeToLessonProgress(userId: string, callback: () => void): Unsubscribe {
  if (!userId) {
    return () => undefined;
  }

  const ref = query(collection(db, 'lesson_progress'), where('user_id', '==', userId));
  return onSnapshot(
    ref,
    () => callback(),
    () => callback()
  );
}
