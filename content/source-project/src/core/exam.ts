export type ExamSubjectCode = 'M11' | 'M12';
export type OptionKey = 'A' | 'B' | 'C' | 'D';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface QuestionReference {
  readonly materialPath: string;
  readonly officialResourceUrl: string;
  readonly note: string;
}

export interface ExamQuestion {
  readonly id: string;
  readonly subjectCode: ExamSubjectCode;
  readonly topicCode: string;
  readonly prompt: string;
  readonly options: Record<OptionKey, string>;
  readonly answer: OptionKey;
  readonly explanation: string;
  readonly source: '自編練習題';
  readonly difficulty: QuestionDifficulty;
  readonly reference: QuestionReference;
}

export interface ExamDraft {
  readonly subjectCode: ExamSubjectCode;
  readonly startedAt: number;
  readonly answers: Record<string, OptionKey>;
  readonly currentIndex: number;
  readonly questionIds: readonly string[];
}

/** A completed CBT attempt kept locally for later review. */
export interface ExamHistoryRecord {
  readonly id: string;
  readonly subjectCode: ExamSubjectCode;
  readonly startedAt: number;
  readonly completedAt: number;
  readonly total: number;
  readonly correct: number;
  readonly answered: number;
  readonly percent: number;
  readonly durationSeconds: number;
  readonly answers: Record<string, OptionKey>;
  readonly questionIds?: readonly string[];
}

export const EXAM_CONFIG: Record<ExamSubjectCode, { name: string; minutes: number; count: number }> = {
  M11: { name: '考科一：生產與作業管理基礎', minutes: 75, count: 50 },
  M12: { name: '考科二：智慧製造生產線管理基礎', minutes: 75, count: 50 },
};
