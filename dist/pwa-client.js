(function () {
  'use strict';
  if (!('serviceWorker' in window.navigator) || !/^(https?:)$/.test(location.protocol)) return;
  let reloading = false;
  const pageVersion = document.querySelector('meta[name="factory-release"]')?.content;
  function reconcile() {
    const worker = window.navigator.serviceWorker.controller;
    if (!worker || !pageVersion || reloading) return;
    const channel = new window.MessageChannel();
    const timer = setTimeout(() => { channel.port1.close(); channel.port2.close(); }, 3000);
    channel.port1.onmessage = event => {
      clearTimeout(timer); channel.port1.close(); channel.port2.close();
      if (event.data?.version && event.data.version !== pageVersion && !reloading) {
        reloading = true;
        window.dispatchEvent(new window.Event('factory-before-reload'));
        location.reload();
      }
    };
    worker.postMessage({ type: 'FACTORY_VERSION' }, [channel.port2]);
  }
  window.navigator.serviceWorker.addEventListener('controllerchange', reconcile);
  window.addEventListener('load', async () => {
    try {
      const registration = await window.navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' });
      reconcile();
      if (registration.waiting) {
        window.dispatchEvent(new window.Event('factory-before-reload'));
        registration.waiting.postMessage({ type: 'FACTORY_ACTIVATE_ON_BOOT' });
      }
      const ready = () => {
        if (!registration.waiting || !window.navigator.serviceWorker.controller) return;
        let notice = document.getElementById('update-notice');
        if (!notice) { notice = document.createElement('div'); notice.id = 'update-notice'; notice.className = 'app-notice'; notice.setAttribute('role', 'status'); document.body.append(notice); }
        notice.textContent = '新版本已準備。請完成作答，關閉本站所有分頁後重新開啟，即可更新。';
      };
      ready();
      registration.addEventListener('updatefound', () => registration.installing?.addEventListener('statechange', ready));
    } catch (error) { console.info('離線安裝暫時無法完成：', error.message); }
  });
})();
