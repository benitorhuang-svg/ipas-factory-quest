import { btn, div, h } from '@/utils/render';
import { PageShell } from '@/components/organisms';
import { clearExamHistory, loadExamHistory, subjectName } from '@/core/exam-history';
import { QUESTION_BANK } from '@/data/quiz-banks';
import type { ExamHistoryRecord } from '@/core/exam';

function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒`;
}

function renderReview(record: ExamHistoryRecord): HTMLElement {
  const review = div('exam-history-review');
  const questionsById = new Map(QUESTION_BANK[record.subjectCode].map((question) => [question.id, question]));
  const questionIds = record.questionIds?.length
    ? record.questionIds
    : QUESTION_BANK[record.subjectCode].slice(0, record.total).map((question) => question.id);
  const questions = questionIds.map((id) => questionsById.get(id)).filter((question): question is NonNullable<typeof question> => !!question);

  // ── Filter tabs: 全部 / 答對 / 答錯 ──
  const correctCount = questions.filter((q) => record.answers[q.id] === q.answer).length;
  const wrongCount = questions.length - correctCount;

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
    for (const [index, question] of questions.entries()) {
      const selected = record.answers[question.id];
      const isCorrect = selected === question.answer;
      if (activeFilter === 'correct' && !isCorrect) continue;
      if (activeFilter === 'wrong' && isCorrect) continue;
      const item = div(`exam-review__item ${isCorrect ? 'exam-review__item--correct' : 'exam-review__item--wrong'}`);
      item.appendChild(h('strong', {}, `${index + 1}. ${question.prompt}`));
      item.appendChild(h('p', {}, `你的答案：${selected ? `${selected}. ${question.options[selected]}` : '未作答'}`));
      item.appendChild(h('p', {}, `正確答案：${question.answer}. ${question.options[question.answer]}`));
      item.appendChild(h('p', {}, question.explanation));
      listContainer.appendChild(item);
    }
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
  return review;
}

function renderRecord(record: ExamHistoryRecord): HTMLElement {
  const card = div('exam-history-card');
  const scoreClass = record.percent >= 70 ? 'exam-history-card__score--pass' : 'exam-history-card__score--retry';
  const heading = div('exam-history-card__heading');
  heading.append(h('h3', {}, subjectName(record.subjectCode)), h('time', {}, new Date(record.completedAt).toLocaleString('zh-TW', { dateStyle: 'medium', timeStyle: 'short' })));
  const details = div('exam-history-card__details');
  details.hidden = true;
  const toggle = btn('btn btn--secondary', '查看逐題回顧', () => {
    details.hidden = !details.hidden;
    toggle.textContent = details.hidden ? '查看逐題回顧' : '收起逐題回顧';
  });
  card.append(heading, div(`exam-history-card__score ${scoreClass}`, `${record.percent}%`));
  card.appendChild(h('p', { className: 'exam-history-card__meta' }, `答對 ${record.correct}/${record.total} 題・已作答 ${record.answered} 題・耗時 ${formatDuration(record.durationSeconds)}`));
  card.append(toggle, details);
  details.appendChild(renderReview(record));
  return card;
}

export function ExamHistoryPage(): HTMLElement {
  const page = div('exam-page exam-history-page');
  page.append(h('h2', {}, '測驗紀錄'), h('p', { className: 'exam-history-page__intro' }, '完成交卷的電腦化測驗（Computer-Based Test, CBT）會儲存在此裝置，最多保留最近 50 筆。'));
  const history = loadExamHistory();
  if (!history.length) {
    const empty = div('empty-state');
    empty.append(h('div', { className: 'empty-state__icon' }, '📝'), h('div', { className: 'empty-state__title' }, '尚無測驗紀錄'), h('div', { className: 'empty-state__desc' }, '完成一份電腦化測驗後，就能在這裡查看成績與逐題回顧。'));
    page.appendChild(empty);
    return PageShell('/exam-history', page);
  }
  const actions = div('exam-history-page__actions');
  actions.appendChild(btn('btn btn--secondary', '清除全部紀錄', () => {
    if (!window.confirm('確定要清除所有測驗紀錄嗎？此操作無法復原。')) return;
    clearExamHistory();
    window.location.reload();
  }));
  page.appendChild(actions);
  const list = div('exam-history-list');
  history.forEach((record) => list.appendChild(renderRecord(record)));
  page.appendChild(list);
  return PageShell('/exam-history', page);
}
