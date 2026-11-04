(function () {
  'use strict';
  let controller, busy = false, selectedCode = 'M11101', currentRefresh, progressText = '';
  const chapters = () => window.FactoryOfflineChapters || [];
  const scope = new URL('./', location.href);
  const cacheName = 'factory-quest-content-' + encodeURIComponent(scope.pathname) + '-v1';
  const megabytes = bytes => (bytes / 1000000).toFixed(2) + ' MB';
  function render(esc) {
    return `<section class="panel offline-panel"><h2>章節離線下載</h2><p>教材文字與公式會隨外殼儲存。下載章節可補齊圖片、原圖、互動頁與圖表引擎。</p>
      <label for="offline-chapter">選擇章節</label><select id="offline-chapter">${chapters().map(chapter => `<option value="${esc(chapter.topicCode)}" ${chapter.topicCode === selectedCode ? 'selected' : ''}>${esc(chapter.title)}</option>`).join('')}</select>
      <p id="offline-status" role="status">正在檢查離線內容…</p><p id="offline-capacity"></p>
      <div class="backup-actions"><button class="btn btn-small" id="offline-download">下載本章</button><button class="btn btn-small" id="offline-cancel" ${busy ? '' : 'hidden'}>取消下載</button></div>
      <p class="backup-note">瀏覽器仍可能清除儲存空間；離線前請再次檢查。取消會保留已完成的檔案，下次只補下載缺漏項目。</p></section>`;
  }
  async function verify(response, asset) {
    if (!response || !response.ok || response.headers.has('X-Factory-Offline')) return false;
    if (!window.crypto.subtle) return false;
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength !== asset.bytes) return false;
    const hash = await window.crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(hash)].map(value => value.toString(16).padStart(2, '0')).join('') === asset.sha256;
  }
  async function missing(chapter) {
    const absent = [];
    for (const asset of chapter.assets) {
      const response = await window.caches.match(new URL(asset.file, scope).href);
      if (!await verify(response, asset)) absent.push(asset);
    }
    return absent;
  }
  function setStatus(text) {
    progressText = text;
    const status = document.getElementById('offline-status');
    if (status) status.textContent = text;
  }
  function updateControls() {
    const select = document.getElementById('offline-chapter');
    if (!select) return;
    select.disabled = busy;
    document.getElementById('offline-download').disabled = busy;
    document.getElementById('offline-cancel').hidden = !busy;
  }
  function mount() {
    const select = document.getElementById('offline-chapter');
    if (!select) return;
    const status = document.getElementById('offline-status'), button = document.getElementById('offline-download');
    const cancel = document.getElementById('offline-cancel');
    if (!window.caches || !window.crypto.subtle || !window.navigator.serviceWorker?.controller) {
      status.textContent = '請透過 localhost 或 HTTPS 開啟，等待離線外殼安裝完成後重新載入。'; button.disabled = true; return;
    }
    let version = 0;
    const chapter = () => chapters().find(item => item.topicCode === select.value);
    async function refresh(note = '') {
      const token = ++version;
      try {
        const chosen = chapter(), absent = await missing(chosen);
        if (token !== version || !select.isConnected || busy) return;
        status.textContent = note + (absent.length ? `已儲存 ${chosen.assets.length - absent.length}/${chosen.assets.length} 項；尚缺 ${megabytes(absent.reduce((sum, item) => sum + item.bytes, 0))}。` : `本章 ${chosen.assets.length} 項已完整儲存，可離線閱讀圖解。`);
        button.disabled = !absent.length;
      } catch { status.textContent = '無法檢查離線空間，請恢復連線後重試。'; }
    }
    currentRefresh = refresh;
    updateControls();
    if (busy) status.textContent = progressText;
    select.addEventListener('change', () => { selectedCode = select.value; refresh(); });
    cancel.addEventListener('click', () => controller?.abort());
    button.addEventListener('click', async () => {
      if (busy) return;
      busy = true; controller = new window.AbortController();
      updateControls();
      let note = '';
      try {
        const chosen = chapter(), absent = await missing(chosen), cache = await window.caches.open(cacheName);
        for (const [index, asset] of absent.entries()) {
          controller.signal.throwIfAborted();
          setStatus(`下載 ${index + 1}/${absent.length} 項；完整本章 ${megabytes(chosen.bytes)}。`);
          const url = new URL(asset.file, scope).href;
          const response = await window.fetch(url, { signal: controller.signal, cache: 'reload', headers: { 'X-Factory-Download': '1' } });
          if (!await verify(response.clone(), asset)) throw new Error('檔案版本不符或下載未完成，請稍後重試。');
          controller.signal.throwIfAborted();
          await cache.put(url, response);
        }
        setStatus('下載完成，正在確認檔案…');
      } catch (error) { note = error.name === 'AbortError' ? '已取消，完成的檔案會保留。' : `下載未完成：${error.message} `; }
      finally {
        busy = false; controller = null; updateControls();
      }
      await currentRefresh?.(note);
    });
    window.navigator.storage?.estimate().then(estimate => {
      if (select.isConnected) document.getElementById('offline-capacity').textContent = `本站約使用 ${megabytes(estimate.usage || 0)}；瀏覽器配額估計 ${megabytes(estimate.quota || 0)}。`;
    }).catch(() => {});
    refresh();
  }
  window.FactoryOffline = { render, mount, missing, verify };
})();
