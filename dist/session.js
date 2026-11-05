(function () { 'use strict';
function create(ctx) {
const { E, bank, qmap, go, save, toast, modal, closeModal, icon } = ctx;
function runQuestions() {
    return (ctx.state.active?.questionIds || []).map(id => qmap.get(id)).filter(Boolean);
  }

function start(mode, unitId = null, subject = null, force = false) {
    if (!ctx.canEdit()) return;
    if (ctx.state.active && !force) {
      modal(`
        <button class="modal-close" data-action="close" aria-label="關閉">${icon('cross')}</button>
        <h2>上一張任務還在進行中</h2>
        <p>可以接著完成目前作答，或放下未交卷的答案，開啟新的挑戰。已交卷的成績與徽章會保留。</p>
        <div class="button-row">
          <button class="btn btn-primary" data-action="resume">繼續原任務</button>
          <button class="btn" data-action="force-start" data-mode="${mode}" data-unit="${unitId || ''}" data-subject="${subject || ''}">開始新任務</button>
        </div>
      `);
      return;
    }
    let qs, reviewTargets;
    try {
      if (mode === 'review') {
        const plan = E.reviewPlan(ctx.state, bank);
        qs = plan.questions;
        reviewTargets = plan.targets;
      } else qs = E.select(bank, { mode, unitId, subject, state: ctx.state });
    } catch (e) {
      toast(e.message);
      return;
    }
    if (!qs.length) {
      toast(mode === 'review' ? '目前沒有待加強或到期複習題目。' : '題庫尚未準備完成。');
      return;
    }
    closeModal();
    ctx.state.active = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'r' + Date.now() + Math.random().toString(36).slice(2),
      mode,
      unitId,
      subject,
      questionIds: qs.map(q => q.id),
      ...(reviewTargets ? { reviewTargets } : {}),
      answers: {},
      startedAt: Date.now()
    };
    save();
    go('quiz');
  }

function updateQuizStatus() {
    const run = ctx.state.active;
    if (!run) return;
    const qs = runQuestions(), count = qs.filter(q => E.hasAnswer(q, run.answers[q.id])).length;
    const counter = document.getElementById('answered-count');
    if (!counter) return;
    counter.textContent = count;
    const note = document.getElementById('submit-note');
    if (note) note.textContent = count === qs.length ? '全部完成，準備查看你的任務報告' : '還有' + (qs.length - count) + '題等待你的決定';
    const subBtn = document.getElementById('submit-run');
    if (subBtn) subBtn.disabled = count !== qs.length;
    qs.forEach((q, index) => {
      const dot = document.querySelector(`[data-qdot="${q.id}"]`);
      const answered = E.hasAnswer(q, run.answers[q.id]);
      dot?.classList.toggle('done', answered);
      dot?.setAttribute('aria-label', `第 ${index + 1} 題，${answered ? '已作答' : '未作答'}`);
    });
  }

function submit(auto = false) {
    if (!ctx.canEdit()) return;
    const run = ctx.state.active;
    if (!run) return;
    if (!auto && !runQuestions().every(q => E.hasAnswer(q, run.answers[q.id]))) {
      toast('請先完成所有題目，再提交任務。');
      return;
    }
    const result = E.grade(ctx.state, run, bank);
    ctx.state = result.state;
    ctx.lastReport = result.report;
    save();
    closeModal();
    go('result', result.report.runId);
    if (auto) toast('模擬時間到，已自動交卷。');
  }

function tick() {
    const run = ctx.state.active;
    if (!run || run.mode !== 'exam') return;
    const remaining = Math.max(0, 75 * 60 - Math.floor((Date.now() - run.startedAt) / 1000));
    const clock = document.getElementById('clock');
    if (clock) {
      clock.querySelector('span').textContent = String(Math.floor(remaining / 60)).padStart(2, '0') + ':' + String(remaining % 60).padStart(2, '0');
      clock.classList.toggle('urgent', remaining < 300);
    }
    if (remaining === 0) submit(true);
  }
return { runQuestions, start, updateQuizStatus, submit, tick };
}
window.FactorySession = { create };
})();
