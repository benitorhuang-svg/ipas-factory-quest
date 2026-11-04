(function () {
  'use strict';
  const pending = new Map();
  let local;
  function localSource() {
    if (window.FactoryLocalMaterials) return Promise.resolve();
    if (!local) local = new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.src = 'materials-local.js';
      script.onload = resolve; script.onerror = () => { local = null; script.remove(); reject(new Error('無法讀取本機講義。')); };
      document.head.append(script);
    });
    return local;
  }
  function load(material) {
    if (material.details) return Promise.resolve();
    if (pending.has(material.topicCode)) return pending.get(material.topicCode);
    const controller = new window.AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const source = location.protocol === 'file:' ? localSource().then(() => ({ topicCode: material.topicCode, details: window.FactoryLocalMaterials[material.topicCode] })) : window.fetch(material.file, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('無法載入講義，請確認連線後重試。');
      return response.json();
    });
    const promise = source.then(data => {
      if (data.topicCode !== material.topicCode || typeof data.details !== 'string') throw new Error('講義格式不正確。');
      material.details = data.details;
    }).finally(() => { clearTimeout(timeout); pending.delete(material.topicCode); });
    pending.set(material.topicCode, promise);
    return promise;
  }
  function mount(context) {
    const host = document.querySelector('[data-material-loading]');
    if (!host) return;
    const material = context.DATA.studyMaterials.find(m => m.topicCode === host.dataset.materialLoading);
    if (!material) return;
    load(material).then(() => { if (host.isConnected) context.render(); }).catch(error => {
      if (!host.isConnected) return;
      host.replaceChildren(document.createTextNode(error.message));
      const retry = document.createElement('button'); retry.className = 'btn'; retry.textContent = '重新載入講義';
      retry.addEventListener('click', () => { retry.disabled = true; mount(context); }); host.append(retry);
    });
  }
  window.FactoryMaterials = { load, mount };
})();
