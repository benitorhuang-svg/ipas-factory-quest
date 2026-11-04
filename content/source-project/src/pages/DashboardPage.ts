import { btn, div, h } from '@/utils/render';
import { PageShell } from '@/components/organisms';
import { getLearningOverview } from '@/core/wrong-book';
import { navigateTo } from '@/services/router';

function progressCard(label: string, value: number, description: string, action: () => void): HTMLElement {
  const card = div('dashboard__subject-card');
  card.append(h('div', { className: 'dashboard__subject-label' }, label), h('strong', {}, `${value}%`), h('p', {}, description));
  const progress = div('dashboard__progress');
  progress.appendChild(div('dashboard__progress-fill'));
  (progress.firstElementChild as HTMLElement).style.width = `${value}%`;
  card.append(progress, btn('dashboard__link', '繼續練習 →', action));
  return card;
}

export function DashboardPage(): HTMLElement {
  const overview = getLearningOverview();
  const container = div('dashboard detail-page-container anim-stagger');
  const nextAction = overview.mistakes.length ? () => navigateTo('/wrong-book') : () => navigateTo('/topics');

  const hero = div('dashboard__hero');
  hero.style.setProperty('--dashboard-hero-image', `url("${import.meta.env.BASE_URL}assets/smart-factory-dashboard-hero.png")`);
  hero.append(
    h('p', { className: 'dashboard__eyebrow' }, 'iPAS 智慧生產工程師（初級）'),
    h('h1', {}, overview.attempts ? '今天，先完成一個能看見的進度。' : '從第一份練習，建立你的學習節奏。'),
    h('p', { className: 'dashboard__intro' }, '首頁集中追蹤測驗、覆蓋率與待複習錯題，讓下一步更清楚。'),
  );
  const heroActions = div('dashboard__actions');
  heroActions.append(
    btn('btn btn--primary', overview.mistakes.length ? `複習 ${overview.mistakes.length} 題錯題` : '開始單元學習', nextAction),
    btn('btn btn--secondary', '開始電腦化測驗（Computer-Based Test, CBT）練習', () => navigateTo('/exam')),
  );
  hero.appendChild(heroActions);
  container.appendChild(hero);

  const metrics = div('dashboard__metrics');
  const metricData = [
    ['已完成測驗', String(overview.attempts), '份'],
    ['歷次正確率', `${overview.accuracy}`, '%'],
    ['待複習錯題', String(overview.mistakes.length), '題'],
  ];
  metricData.forEach(([label, value, unit]) => {
    const metric = div('dashboard__metric');
    metric.append(h('span', {}, label), h('strong', {}, value), h('small', {}, unit));
    metrics.appendChild(metric);
  });
  container.appendChild(metrics);

  const progressSection = div('dashboard__section');
  progressSection.append(h('div', { className: 'dashboard__section-title' }, '考科覆蓋進度'), h('p', {}, '以歷次電腦化測驗出現過的題目計算；覆蓋率越高，代表練習範圍越完整。'));
  const subjects = div('dashboard__subjects');
  subjects.append(
    progressCard('考科一｜生產與作業管理基礎', overview.subjectProgress.M11, '生產規劃、品質與精實管理', () => navigateTo('/exam/M11')),
    progressCard('考科二｜智慧製造生產線管理基礎', overview.subjectProgress.M12, '智慧工廠、物聯網與整合應用', () => navigateTo('/exam/M12')),
  );
  progressSection.appendChild(subjects);
  container.appendChild(progressSection);

  const review = div('dashboard__review');
  review.append(
    div('', h('div', { className: 'dashboard__review-icon' }, '📕'), h('div', {}, h('h2', {}, '錯題本：把失誤變成下一次答對'), h('p', {}, overview.mistakes.length ? `目前有 ${overview.mistakes.length} 題需要回看，系統會優先排列重複答錯的題目。` : '完成電腦化測驗後，答錯或未作答的題目會自動收集在這裡。'))),
    btn('btn btn--secondary', '開啟錯題本', () => navigateTo('/wrong-book')),
  );
  container.appendChild(review);

  const learn = div('dashboard__learn-more');
  learn.append(h('h2', {}, '學習地圖'), h('p', {}, '從單元教材開始，再以電腦化測驗驗證理解；每一項英文縮寫在首次出現時皆標示完整英文名稱。'));
  learn.appendChild(btn('btn btn--primary', '瀏覽全部單元', () => navigateTo('/topics')));
  container.appendChild(learn);
  return PageShell('/', container);
}
