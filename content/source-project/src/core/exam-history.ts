import type { ExamDraft, ExamHistoryRecord, ExamSubjectCode, OptionKey } from '@/core/exam';

const STORAGE_KEY = 'smartprod_exam_history_v1';
const HISTORY_LIMIT = 50;

function isHistoryRecord(value: unknown): value is ExamHistoryRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<ExamHistoryRecord>;
  return typeof record.id === 'string'
    && (record.subjectCode === 'M11' || record.subjectCode === 'M12')
    && typeof record.completedAt === 'number'
    && typeof record.total === 'number'
    && typeof record.correct === 'number'
    && typeof record.percent === 'number'
    && !!record.answers;
}

export function loadExamHistory(): readonly ExamHistoryRecord[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(value) ? value.filter(isHistoryRecord) : [];
  } catch {
    return [];
  }
}

export function saveExamHistory(
  draft: ExamDraft,
  result: { correct: number; total: number; answered: number; percent: number },
  completedAt = Date.now(),
): ExamHistoryRecord {
  const record: ExamHistoryRecord = {
    id: crypto.randomUUID(),
    subjectCode: draft.subjectCode,
    startedAt: draft.startedAt,
    completedAt,
    total: result.total,
    correct: result.correct,
    answered: result.answered,
    percent: result.percent,
    durationSeconds: Math.max(0, Math.floor((completedAt - draft.startedAt) / 1000)),
    answers: { ...draft.answers } as Record<string, OptionKey>,
    questionIds: [...draft.questionIds],
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...loadExamHistory()].slice(0, HISTORY_LIMIT)));
  } catch (error) {
    console.warn('Unable to save exam history:', error);
  }
  return record;
}

export function clearExamHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function subjectName(subjectCode: ExamSubjectCode): string {
  return subjectCode === 'M11' ? '科目一：生產與作業管理基礎' : '科目二：智慧製造生產線管理基礎';
}
