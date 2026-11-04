(function () { 'use strict';
function create(ctx) {
const { E, bank, save, toast, modal, closeModal, icon, go } = ctx;
function exportProgress() {
    const payload = { ...ctx.state, exportedAt: new Date().toISOString() };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'factory-quest-progress-' + E.dateKey() + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('進度備份已匯出。');
  }
  const importInput = document.createElement('input');
  importInput.type = 'file';
  importInput.accept = '.json,application/json';
  importInput.hidden = true;
  document.body.appendChild(importInput);
  importInput.addEventListener('change', async () => {
    const f = importInput.files[0];
    if (!f) return;
    try {
      if (f.size > 2000000) throw new Error('備份檔案太大，請選擇本網站匯出的進度。');
      const raw = JSON.parse(await f.text());
      if (!raw || raw.version !== 1 || !Array.isArray(raw.earnedCorrectIds) || !raw.best || typeof raw.best !== 'object' || Array.isArray(raw.best) || !Array.isArray(raw.history)) throw new Error('這不是有效的智造闖關進度檔。');
      const incoming = E.restore(raw, bank);
      modal(`
        <button class="modal-close" data-action="close" aria-label="關閉">${icon('cross')}</button>
        <h2>匯入這份學習進度？</h2>
        <p>備份包含${incoming.passedUnits.length}個已通關部門與${incoming.xp} XP。匯入後會取代目前裝置的進度。</p>
        <div class="button-row">
          <button class="btn btn-primary" id="confirm-import">匯入並取代</button>
          <button class="btn" data-action="close">保留目前進度</button>
        </div>
      `);
      document.getElementById('confirm-import').addEventListener('click', () => {
        if (!ctx.canEdit()) return;
        ctx.state = incoming;
        ctx.lastReport = null;
        save();
        closeModal();
        go('progress');
        toast('進度已匯入。');
      });
    } catch (e) {
      toast(e.message || '無法讀取進度備份。');
    }
    importInput.value = '';
  });


return { exportProgress, importInput };
}
window.FactoryProgressStore = { create };
})();
