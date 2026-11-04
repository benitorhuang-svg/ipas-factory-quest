import { btn, div, h } from '@/utils/render';
import { PageShell } from '@/components/organisms';
import { getLearningOverview, mistakesForSubject, type MistakeItem } from '@/core/wrong-book';
import { navigateTo } from '@/services/router';
import { expandTerminology } from '@/utils/terminology';

type Filter = 'all' | 'M11' | 'M12';

function subjectName(subject: Filter): string {
  if (subject === 'M11') return '科目一';
  if (subject === 'M12') return '科目二';
  return '全部';
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
}

function mistakeCard(item: MistakeItem, index: number): HTMLElement {
  const { question } = item;
  const card = div('wrong-book__item');
  const label = item.selectedAnswer ? `上次選 ${item.selectedAnswer}` : '上次未作答';
  card.append(
    div('wrong-book__meta', `#${index + 1}　${question.subjectCode === 'M11' ? '科目一' : '科目二'}・${question.topicCode}`),
    h('h3', {}, question.prompt),
    div('wrong-book__chips', h('span', { className: 'wrong-book__count' }, `錯／漏 ${item.count} 次`), h('span', {}, `${label}・${formatDate(item.lastMissedAt)}`)),
  );
  const details = div('wrong-book__details');
  details.hidden = true;
  details.append(
    h('p', {}, `正確答案：${question.answer}．${question.options[question.answer]}`),
    h('p', {}, question.explanation),
  );
  const actions = div('wrong-book__actions');
  const toggle = btn('btn btn--secondary', '查看解析', () => {
    details.hidden = !details.hidden;
    toggle.textContent = details.hidden ? '查看解析' : '收起解析';
  });
  actions.append(toggle, btn('btn btn--primary', '複習此單元', () => navigateTo(`/topic/${question.topicCode}`)));
  card.append(details, actions);
  return card;
}

export function WrongBookPage(): HTMLElement {
  const overview = getLearningOverview();
  const page = div('wrong-book-page detail-page-container anim-stagger');
  page.append(
    div('wrong-book__hero', h('p', { className: 'dashboard__eyebrow' }, '針對性複習'), h('h1', {}, '錯題本'), h('p', {}, '彙整每次電腦化測驗（Computer-Based Test, CBT）的答錯與未作答題目；題目重複失誤時會自動提高排序。')),
  );
  const summary = div('wrong-book__summary');
  summary.append(
    div('', h('strong', {}, String(overview.mistakes.length)), h('span', {}, '待複習題數')),
    div('', h('strong', {}, String(overview.attempts)), h('span', {}, '已完成測驗')),
    div('', h('strong', {}, `${overview.accuracy}%`), h('span', {}, '歷次作答正確率')),
  );
  page.appendChild(summary);

  const filters = div('wrong-book__filters');
  const list = div('wrong-book__list');
  const renderList = (filter: Filter) => {
    list.replaceChildren();
    const items = mistakesForSubject(overview.mistakes, filter);
    if (!items.length) {
      list.append(h('div', { className: 'empty-state' }, h('div', { className: 'empty-state__icon' }, '✨'), h('div', { className: 'empty-state__title' }, '目前沒有待複習題目'), h('div', { className: 'empty-state__desc' }, '完成 CBT 後，答錯或未作答的題目會出現在這裡。')));
      expandTerminology(list);
      return;
    }
    items.forEach((item, index) => list.appendChild(mistakeCard(item, index)));
    expandTerminology(list);
  };
  (['all', 'M11', 'M12'] as const).forEach((filter, index) => {
    const button = btn(`wrong-book__filter${index === 0 ? ' wrong-book__filter--active' : ''}`, subjectName(filter), () => {
      filters.querySelectorAll('button').forEach((item) => item.classList.remove('wrong-book__filter--active'));
      button.classList.add('wrong-book__filter--active');
      renderList(filter);
    });
    filters.appendChild(button);
  });
  page.append(filters, list);
  return PageShell('/wrong-book', page);
}
