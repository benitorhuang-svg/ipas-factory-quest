import { div, h, btn } from '@/utils/render';
import { PageShell } from '@/components/organisms';
import { EXAM_CONFIG, type ExamDraft, type ExamQuestion, type ExamSubjectCode, type OptionKey } from '@/core/exam';
import { QUESTION_BANK } from '@/data/quiz-banks';
import { saveExamHistory } from '@/core/exam-history';
import { getLearningOverview } from '@/core/wrong-book';
import { navigateTo } from '@/services/router';
import type { RouteParams } from '@/core/types';
import { expandTerminology } from '@/utils/terminology';

const storageKey = (subject: ExamSubjectCode) => `smartprod_exam_${subject}`;
let intervalId: number | null = null;

function isSubject(value: string): value is ExamSubjectCode {
  return value === 'M11' || value === 'M12';
}

/**
 * Weighted random sampling without replacement — A-Res algorithm
 * (Efraimidis & Spirakis). For each item with weight w, compute a key
 * u^(1/w) where u ∈ (0,1), then pick the top-k by key.
 */
function weightedSample<T>(items: readonly T[], count: number, weight: (item: T) => number): T[] {
  const keyed = items.map((item) => ({
    item,
    key: Math.random() ** (1 / Math.max(weight(item), 0.01)),
  }));
  keyed.sort((a, b) => b.key - a.key);
  return keyed.slice(0, count).map(({ item }) => item);
}

function createDraft(subjectCode: ExamSubjectCode): ExamDraft {
  // ── Step 1: deduplicate by prompt text (keep first occurrence) ──
  const seen = new Set<string>();
  const unique: ExamQuestion[] = [];
  for (const question of QUESTION_BANK[subjectCode]) {
    const key = question.prompt.trim();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(question);
  }

  // ── Step 2: compute per-question weight from wrong-book data ──
  const overview = getLearningOverview();
  const mistakeMap = new Map(overview.mistakes.map((m) => [m.question.id, m.count]));

  const questionIds = weightedSample(
    unique,
    Math.min(EXAM_CONFIG[subjectCode].count, unique.length),
    (question) => 1 + (mistakeMap.get(question.id) ?? 0) * 2,
  ).map((question) => question.id);

  return { subjectCode, startedAt: Date.now(), answers: {}, currentIndex: 0, questionIds };
}

function readDraft(subjectCode: ExamSubjectCode): ExamDraft {
  const raw = localStorage.getItem(storageKey(subjectCode));
  if (raw) {
    try {
      const draft = JSON.parse(raw) as Partial<ExamDraft>;
      if (Array.isArray(draft.questionIds) && draft.questionIds.length > 0) return draft as ExamDraft;
      const freshDraft = createDraft(subjectCode);
      return { ...freshDraft, ...draft, answers: draft.answers ?? {}, currentIndex: draft.currentIndex ?? 0, questionIds: freshDraft.questionIds };
    } catch { localStorage.removeItem(storageKey(subjectCode)); }
  }
  return createDraft(subjectCode);
}

function saveDraft(draft: ExamDraft): void {
  localStorage.setItem(storageKey(draft.subjectCode), JSON.stringify(draft));
}

function formatTime(seconds: number): string {
  return `${String(Math.max(0, Math.floor(seconds / 60))).padStart(2, '0')}:${String(Math.max(0, seconds % 60)).padStart(2, '0')}`;
}


function score(questions: readonly typeof QUESTION_BANK.M11[number][], answers: Record<string, OptionKey>) {
  const correct = questions.filter((question) => answers[question.id] === question.answer).length;
  return { correct, total: questions.length, answered: Object.keys(answers).length, percent: Math.round((correct / questions.length) * 100) };
}

function renderResult(subjectCode: ExamSubjectCode, questions: readonly typeof QUESTION_BANK.M11[number][], answers: Record<string, OptionKey>): HTMLElement {
  const result = score(questions, answers);
  const page = div('exam-page');
  const passed = result.percent >= 70;
  page.innerHTML = `
    <section class="exam-result-card">
      <div class="exam-result-card__icon">${passed ? '🎉' : '💪'}</div>
      <p class="exam-eyebrow">${EXAM_CONFIG[subjectCode].name}｜自編練習題</p>
      <h2>${passed ? '達到 70 分練習門檻' : '尚未達到 70 分練習門檻'}</h2>
      <div class="exam-score">${result.percent}<small>分</small></div>
      <p>答對 ${result.correct}／${result.total} 題；已作答 ${result.answered} 題。</p>
    </section>`;

  // ── Filter tabs: 全部 / 答對 / 答錯 ──
  const review = div('exam-review');
  const wrongCount = questions.filter((q) => answers[q.id] !== q.answer).length;
  const correctCount = result.correct;

  const tabs = div('exam-review-filter');
  const filterLabels: { key: 'all' | 'correct' | 'wrong'; label: string }[] = [
    { key: 'all', label: `全部 (${questions.length})` },
    { key: 'correct', label: `答對 (${correctCount})` },
    { key: 'wrong', label: `答錯 (${wrongCount})` },
  ];

  let activeFilter: 'all' | 'correct' | 'wrong' = 'all';
  const listContainer = div('exam-review__list');

  const renderFilteredList = () => {
    listContainer.innerHTML = '';
    questions.forEach((question, index) => {
      const isCorrect = answers[question.id] === question.answer;
      if (activeFilter === 'correct' && !isCorrect) return;
      if (activeFilter === 'wrong' && isCorrect) return;
      const item = div(`exam-review__item ${isCorrect ? 'exam-review__item--correct' : 'exam-review__item--wrong'}`);
      const selected = answers[question.id] ? `${answers[question.id]}．${question.options[answers[question.id]]}` : '未作答';
      item.innerHTML = `<div data-no-terminology="true"><strong>${index + 1}. ${question.prompt}</strong><p>你的答案：${selected}</p><p>正解：${question.answer}．${question.options[question.answer]}</p></div><p class="exam-review__explanation">${question.explanation}</p>`;
      listContainer.appendChild(item);
    });
    if (!listContainer.children.length) {
      listContainer.appendChild(div('exam-review__empty', activeFilter === 'correct' ? '沒有答對的題目' : '沒有答錯的題目 🎉'));
    }
  };

  const renderTabs = () => {
    tabs.innerHTML = '';
    for (const { key, label } of filterLabels) {
      const tabBtn = btn(`exam-review-filter__tab${activeFilter === key ? ' exam-review-filter__tab--active' : ''}`, label, () => {
        activeFilter = key;
        renderTabs();
        renderFilteredList();
      });
      tabs.appendChild(tabBtn);
    }
  };

  renderTabs();
  renderFilteredList();
  review.append(tabs, listContainer);

  page.appendChild(review);
  const actions = div('exam-actions');
  actions.append(
    btn('btn btn--primary', '再做一次', () => { localStorage.removeItem(storageKey(subjectCode)); navigateTo(`/exam/${subjectCode}`); }),
    btn('btn btn--secondary', '返回首頁', () => navigateTo('/')),
  );
  page.appendChild(actions);
  expandTerminology(page);
  return page;
}

function renderExam(subjectCode: ExamSubjectCode): HTMLElement {
  if (intervalId) window.clearInterval(intervalId);
  let draft = readDraft(subjectCode);
  const questionsById = new Map(QUESTION_BANK[subjectCode].map((question) => [question.id, question]));
  const questions = draft.questionIds.map((id) => questionsById.get(id)).filter((question): question is NonNullable<typeof question> => !!question);
  let completed = false;
  const page = div('exam-page');

  const finish = () => {
    if (completed) return;
    completed = true;
    if (intervalId) window.clearInterval(intervalId);
    saveExamHistory(draft, score(questions, draft.answers));
    localStorage.removeItem(storageKey(subjectCode));
    page.replaceChildren(renderResult(subjectCode, questions, draft.answers));
  };

  const render = () => {
    const question = questions[draft.currentIndex];
    const seconds = EXAM_CONFIG[subjectCode].minutes * 60 - Math.floor((Date.now() - draft.startedAt) / 1000);
    if (seconds <= 0) { finish(); return; }
    page.innerHTML = '';
    const header = div('exam-header');
    header.innerHTML = `<div><p class="exam-eyebrow">${EXAM_CONFIG[subjectCode].name}</p><h2>電腦化測驗（Computer-Based Test, CBT）模擬考｜${questions.length} 題</h2></div><div class="exam-timer ${seconds <= 300 ? 'exam-timer--warning' : ''}">⏱ ${formatTime(seconds)}</div>`;
    page.appendChild(header);
    const progress = div('exam-progress');
    const answered = Object.keys(draft.answers).length;
    progress.innerHTML = `<span>第 ${draft.currentIndex + 1} 題／${questions.length} 題</span><span>已答 ${answered} 題</span>`;
    const questionCard = div('exam-question');
    questionCard.setAttribute('data-no-terminology', 'true');
    questionCard.appendChild(h('h3', {}, question.prompt));
    (['A', 'B', 'C', 'D'] as OptionKey[]).forEach((key) => {
      const option = h('button', { className: `exam-option${draft.answers[question.id] === key ? ' exam-option--selected' : ''}`, type: 'button' }, `${key}. ${question.options[key]}`);
      option.addEventListener('click', () => {
        draft = { ...draft, answers: { ...draft.answers, [question.id]: key } };
        saveDraft(draft);
        render();
      });
      questionCard.appendChild(option);
    });
    page.appendChild(questionCard);
    const controls = div('exam-actions');
    const previous = btn('btn btn--secondary', '← 上一題', () => { draft = { ...draft, currentIndex: Math.max(0, draft.currentIndex - 1) }; saveDraft(draft); render(); });
    previous.disabled = draft.currentIndex === 0;
    const next = btn('btn btn--secondary', '下一題 →', () => { draft = { ...draft, currentIndex: Math.min(questions.length - 1, draft.currentIndex + 1) }; saveDraft(draft); render(); });
    const submit = btn('btn btn--primary', '交卷並計分', () => {
      if (window.confirm(`尚有 ${questions.length - Object.keys(draft.answers).length} 題未答，仍要交卷嗎？`)) finish();
    });
    controls.append(previous, next, submit);
    page.appendChild(controls);
    const grid = div('exam-grid');
    questions.forEach((item, index) => {
      const cell = btn(`exam-grid__cell${index === draft.currentIndex ? ' exam-grid__cell--active' : ''}${draft.answers[item.id] ? ' exam-grid__cell--answered' : ''}`, String(index + 1), () => { draft = { ...draft, currentIndex: index }; saveDraft(draft); render(); });
      grid.appendChild(cell);
    });
    page.appendChild(grid);
  };
  intervalId = window.setInterval(() => {
    if (!window.location.hash.startsWith('#/exam/')) {
      if (intervalId) window.clearInterval(intervalId);
      intervalId = null;
      return;
    }
    render();
  }, 1000);
  render();
  return page;
}

export function ExamPage(params: RouteParams): HTMLElement {
  const subjectCode = params.subjectCode ?? '';
  if (!isSubject(subjectCode)) return PageShell('/topics', div('empty-state', '找不到指定的模擬考。'));
  return PageShell(`/exam/${subjectCode}`, renderExam(subjectCode), { hideBottomNav: true, compactHeader: true, onBack: true });
}
