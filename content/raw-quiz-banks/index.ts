import { TOPICS } from '@/core/topics';
import type { ExamQuestion, ExamSubjectCode, QuestionDifficulty, QuestionReference } from '@/core/exam';

type StoredQuestion = Omit<ExamQuestion, 'difficulty' | 'reference'>;
type QuestionFile = readonly [path: string, question: StoredQuestion];

const OFFICIAL_RESOURCE_URL = 'https://ipd.nat.gov.tw/ipas/certification/SPE/learning-resources';

const topicOrder = new Map(TOPICS.map((topic, index) => [topic.code, index]));

const questionFiles = Object.entries(
  import.meta.glob<StoredQuestion>('./M*/**/*.json', { eager: true, import: 'default' }),
) as QuestionFile[];

function questionNumber(path: string): number {
  const match = path.match(/_(\d+)\.json$/);
  if (!match) throw new Error(`Invalid CBT question filename: ${path}`);
  return Number(match[1]);
}

function difficulty(question: StoredQuestion): QuestionDifficulty {
  const version = question.id.match(/-v(\d+)$/)?.[1];
  if (version === '1') return 'easy';
  if (version === '2') return 'medium';
  return 'hard';
}

function reference(question: StoredQuestion): QuestionReference {
  const topic = TOPICS.find((item) => item.code === question.topicCode);
  if (!topic?.filePath) throw new Error(`Unknown CBT topic or material path: ${question.topicCode}`);
  return {
    materialPath: topic.filePath,
    officialResourceUrl: OFFICIAL_RESOURCE_URL,
    note: '依本專案教材與 iPAS 公告試題命題範圍自行編寫，非公告試題原文。',
  };
}

function loadSubject(subjectCode: ExamSubjectCode): readonly ExamQuestion[] {
  return questionFiles
    .filter(([, question]) => question.subjectCode === subjectCode)
    .sort(([leftPath, left], [rightPath, right]) => {
      const byTopic = (topicOrder.get(left.topicCode) ?? Infinity) - (topicOrder.get(right.topicCode) ?? Infinity);
      return byTopic || questionNumber(leftPath) - questionNumber(rightPath);
    })
    .map(([, question]) => ({ ...question, difficulty: difficulty(question), reference: reference(question) }));
}

export const QUESTION_BANK: Record<ExamSubjectCode, readonly ExamQuestion[]> = {
  M11: loadSubject('M11'),
  M12: loadSubject('M12'),
};
