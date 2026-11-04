(function () {
  'use strict';
  function create({ key, onRemote, notify }) {
    let observed = null, writable = !window.navigator.locks, pending = false, release, timer, dirty;
    try { observed = localStorage.getItem(key); } catch { /* Saving reports storage failures. */ }
    function show(message) {
      let notice = document.getElementById('storage-notice');
      if (!notice) {
        notice = document.createElement('div'); notice.id = 'storage-notice'; notice.className = 'app-notice';
        notice.setAttribute('role', 'status'); document.body.append(notice);
      }
      notice.replaceChildren(document.createTextNode(message));
      if (!writable) {
        const button = document.createElement('button'); button.textContent = '重新取得作答權';
        button.addEventListener('click', acquire); notice.append(button);
      }
    }
    function acquire() {
      if (!window.navigator.locks || writable || pending) return;
      pending = true;
      window.navigator.locks.request(key + '-writer', { ifAvailable: true }, lock => {
        pending = false;
        if (!lock) { show('另一個分頁正在保存進度；此分頁可閱讀教材。'); return; }
        writable = true;
        document.getElementById('storage-notice')?.remove();
        try { observed = localStorage.getItem(key); onRemote(observed); } catch { /* Keep local state. */ }
        return new Promise(resolve => { release = resolve; });
      }).catch(() => { pending = false; show('無法取得作答權，請重新開啟此分頁。'); });
    }
    function canEdit() {
      if (!writable) { notify('請在具有作答權的分頁操作，或關閉該分頁後重新取得作答權。'); return false; }
      try {
        const latest = localStorage.getItem(key);
        if (latest !== observed) {
          dirty = null; observed = latest; onRemote(latest);
          notify('另一個分頁已更新進度，已載入最新資料；請重新操作。'); return false;
        }
      } catch { /* Keep in-memory work exportable even when storage is unavailable. */ }
      return true;
    }
    function save(state) {
      clearTimeout(timer); dirty = null;
      if (!canEdit()) return false;
      try { const serialized = JSON.stringify(state); localStorage.setItem(key, serialized); observed = serialized; return true; }
      catch { notify('目前無法自動儲存，請至成長紀錄匯出備份。'); return false; }
    }
    function flush() { if (dirty) save(dirty); }
    function schedule(state) { dirty = state; clearTimeout(timer); timer = setTimeout(flush, 180); }
    window.addEventListener('storage', event => {
      if (event.key !== key || event.newValue === observed) return;
      dirty = null; clearTimeout(timer); observed = event.newValue; onRemote(observed);
    });
    window.addEventListener('pagehide', () => { flush(); writable = !window.navigator.locks; release?.(); release = null; });
    window.addEventListener('pageshow', acquire);
    window.addEventListener('factory-before-reload', flush);
    document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
    acquire();
    return { save, schedule, flush, canEdit };
  }
  window.FactoryPersistence = { create };
})();
