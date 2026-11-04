/**
 * ExamSelectPage.ts — 考科選擇頁面
 * 使用者點擊「電腦測驗」後，先進入此頁選擇考科一或考科二，再進入模擬考。
 */

import { div, h, btn } from '@/utils/render';
import { PageShell } from '@/components/organisms';
import { EXAM_CONFIG, type ExamSubjectCode } from '@/core/exam';
import { QUESTION_BANK } from '@/data/quiz-banks';
import { getLearningOverview } from '@/core/wrong-book';
import { loadExamHistory } from '@/core/exam-history';
import { navigateTo } from '@/services/router';

function subjectCard(subjectCode: ExamSubjectCode): HTMLElement {
  const config = EXAM_CONFIG[subjectCode];
  const bank = QUESTION_BANK[subjectCode];
  const overview = getLearningOverview();
  const history = loadExamHistory().filter((r) => r.subjectCode === subjectCode);
  const coverage = overview.subjectProgress[subjectCode];
  const lastRecord = history[0];

  const card = div('exam-select__card');
  card.addEventListener('click', () => navigateTo(`/exam/${subjectCode}`));

  const badge = div('exam-select__badge', subjectCode === 'M11' ? '考科一' : '考科二');
  const title = h('h3', { className: 'exam-select__title' }, config.name);
  const meta = div('exam-select__meta');
  meta.innerHTML = `
    <span>📋 ${bank.length} 題題庫</span>
    <span>⏱ ${config.minutes} 分鐘</span>
    <span>✏️ 每次 ${config.count} 題</span>
  `;

  const stats = div('exam-select__stats');
  stats.innerHTML = `
    <div class="exam-select__stat">
      <span class="exam-select__stat-value">${coverage}%</span>
      <span class="exam-select__stat-label">覆蓋率</span>
    </div>
    <div class="exam-select__stat">
      <span class="exam-select__stat-value">${history.length}</span>
      <span class="exam-select__stat-label">已測驗</span>
    </div>
    <div class="exam-select__stat">
      <span class="exam-select__stat-value">${lastRecord ? `${lastRecord.percent}%` : '—'}</span>
      <span class="exam-select__stat-label">最近成績</span>
    </div>
  `;

  const progress = div('exam-select__progress');
  const fill = div('exam-select__progress-fill');
  fill.style.width = `${coverage}%`;
  progress.appendChild(fill);

  const action = btn('btn btn--primary exam-select__btn', '開始測驗 →', () => {
    navigateTo(`/exam/${subjectCode}`);
  });

  card.append(badge, title, meta, stats, progress, action);
  return card;
}

export function ExamSelectPage(): HTMLElement {
  const page = div('exam-select-page detail-page-container anim-stagger');

  const header = div('exam-select__header');
  header.append(
    h('h2', {}, '電腦化測驗（CBT）'),
    h('p', { className: 'exam-select__desc' }, '選擇考科開始模擬測驗，每份試卷隨機抽題，弱項題型會自動提高出現比例。'),
  );
  page.appendChild(header);

  const grid = div('exam-select__grid');
  grid.append(subjectCard('M11'), subjectCard('M12'));
  page.appendChild(grid);

  const historyLink = btn('btn btn--secondary', '📊 查看測驗紀錄', () => navigateTo('/exam-history'));
  historyLink.style.alignSelf = 'center';
  const actions = div('exam-select__actions');
  actions.appendChild(historyLink);
  page.appendChild(actions);

  return PageShell('/exam', page);
}
