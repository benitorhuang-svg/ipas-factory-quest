import type { ExamHistoryRecord, ExamQuestion, ExamSubjectCode } from '@/core/exam';
import { QUESTION_BANK } from '@/data/quiz-banks';
import { loadExamHistory } from '@/core/exam-history';

export interface MistakeItem {
  readonly question: ExamQuestion;
  readonly count: number;
  readonly lastMissedAt: number;
  readonly selectedAnswer?: string;
}

export interface LearningOverview {
  readonly attempts: number;
  readonly answered: number;
  readonly correct: number;
  readonly accuracy: number;
  readonly mistakes: readonly MistakeItem[];
  readonly subjectProgress: Readonly<Record<ExamSubjectCode, number>>;
}

function questions(): Map<string, ExamQuestion> {
  return new Map([...QUESTION_BANK.M11, ...QUESTION_BANK.M12].map((question) => [question.id, question]));
}

function safePercent(numerator: number, denominator: number): number {
  return denominator ? Math.round((numerator / denominator) * 100) : 0;
}

/** Derives dashboard and wrong-book data from the immutable local exam history. */
export function getLearningOverview(records = loadExamHistory()): LearningOverview {
  const questionById = questions();
  const mistakes = new Map<string, MistakeItem>();
  const seen = { M11: new Set<string>(), M12: new Set<string>() };
  let answered = 0;
  let correct = 0;

  for (const record of records) {
    const ids = record.questionIds ?? [];
    for (const id of ids) {
      const question = questionById.get(id);
      if (!question) continue;
      seen[question.subjectCode].add(id);
      const selectedAnswer = record.answers[id];
      if (selectedAnswer) answered += 1;
      if (selectedAnswer === question.answer) {
        correct += 1;
        continue;
      }
      const previous = mistakes.get(id);
      mistakes.set(id, {
        question,
        count: (previous?.count ?? 0) + 1,
        lastMissedAt: Math.max(previous?.lastMissedAt ?? 0, record.completedAt),
        selectedAnswer,
      });
    }
  }

  return {
    attempts: records.length,
    answered,
    correct,
    accuracy: safePercent(correct, answered),
    mistakes: [...mistakes.values()].sort((left, right) => right.count - left.count || right.lastMissedAt - left.lastMissedAt),
    subjectProgress: {
      M11: safePercent(seen.M11.size, QUESTION_BANK.M11.length),
      M12: safePercent(seen.M12.size, QUESTION_BANK.M12.length),
    },
  };
}

export function mistakesForSubject(
  mistakes: readonly MistakeItem[],
  subject: 'all' | ExamSubjectCode,
): readonly MistakeItem[] {
  return subject === 'all' ? mistakes : mistakes.filter((item) => item.question.subjectCode === subject);
}

export function recordsForSubject(records: readonly ExamHistoryRecord[], subject: ExamSubjectCode): readonly ExamHistoryRecord[] {
  return records.filter((record) => record.subjectCode === subject);
}
