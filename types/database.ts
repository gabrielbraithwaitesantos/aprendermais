export interface User {
  id: string;
  email: string;
  name: string;
  exam_targets: ('ENEM' | 'UFPR' | 'UTFPR')[];
  weaknesses: string[];
  created_at: string;
  updated_at: string;
}

export interface Exam {
  id: string;
  name: string;
  type: 'ENEM' | 'UFPR' | 'UTFPR';
  year: number;
  dates: {
    registration_start?: string;
    registration_end?: string;
    exam_date?: string;
  };
  areas: string[];
}

export interface PDFResource {
  id: string;
  title: string;
  exam_id: string;
  year: number;
  storage_path: string;
  tags: string[];
  url: string;
  subject_area: string;
  created_at: string;
}

export interface Video {
  id: string;
  title: string;
  topic: string;
  youtube_id: string;
  duration: number;
  exam_type: 'ENEM' | 'UFPR' | 'UTFPR';
  subject_area: string;
  thumbnail_url: string;
  created_at: string;
}

export interface StudyPlanItem {
  id: string;
  user_id: string;
  topic: string;
  exam_id: string;
  due_date: string;
  status: 'todo' | 'in_progress' | 'completed';
  resources: {
    pdf_ids: string[];
    video_ids: string[];
  };
  created_at: string;
}

export interface Quiz {
  id: string;
  title: string;
  exam_type: 'ENEM' | 'UFPR' | 'UTFPR';
  subject_area: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: QuizPromptQuestion[];
  created_at: string;
}

export interface QuizPromptQuestion {
  id: string;
  stem: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface QuizResult {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  answers: number[];
  time_taken: number;
  created_at: string;
}

export interface Subject {
  id: string;
  slug: string;
  name: string;
  color_hex: string;
  icon: string | null;
  created_at: string;
}

export interface Lesson {
  id: string;
  subject_id: string;
  title: string;
  module: string;
  order_index: number;
  duration_minutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  subject_tag: string;
  description?: string | null;
  video_url?: string | null;
  thumbnail_url?: string | null;
  resource_url?: string | null;
  is_featured: boolean;
  created_at: string;
}

export type LessonStatus = 'todo' | 'in_progress' | 'done';

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  percent_complete: number;
  status: LessonStatus;
  completed_at: string | null;
  updated_at: string;
  created_at: string;
  lesson?: Lesson;
}

export interface DailyStudyStat {
  id: string;
  user_id: string;
  day: string; // YYYY-MM-DD
  minutes: number;
  completed_lessons: number;
  streak: number;
  created_at: string;
}

export interface SubjectProgressSummary {
  subject_id: string;
  subject_name: string;
  subject_slug?: string;
  color_hex: string;
  icon?: string | null;
  completed_lessons: number;
  total_lessons: number;
  percent: number;
}

export interface RecentActivity {
  id: string;
  lesson_title: string;
  subject_name: string;
  status: LessonStatus;
  updated_at: string;
}

export interface StudyTrack {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  exam?: string | null;
  color_hex: string;
  cover_url?: string | null;
}

export interface StudyTrackItem {
  id: string;
  track_id: string;
  lesson_id?: string | null;
  order_index: number;
  kind: 'lesson' | 'resource';
  title?: string | null;
  description?: string | null;
  resource_url?: string | null;
  estimated_minutes: number;
  lesson?: Lesson | null;
}

export interface QuizQuestion {
  id: string;
  exam: string;
  subject: string;
  difficulty: 'facil' | 'medio' | 'dificil';
  question: string;
  options: string[];
  correct_option: number;
  explanation?: string | null;
  reference_url?: string | null;
}
