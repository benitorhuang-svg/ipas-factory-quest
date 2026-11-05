(function () {
  'use strict';
  const pending = new Map();
  let local;
  function localSource() {
    if (window.FactoryLocalMaterials) return Promise.resolve();
    if (!local) local = new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.src = 'materials-local.js';
      const fail = () => { clearTimeout(timer); local = null; script.remove(); reject(new Error('無法讀取本機教材，請重試。')); };
      const timer = setTimeout(fail, 15000);
      script.onload = () => { clearTimeout(timer); resolve(); }; script.onerror = fail;
      document.head.append(script);
    });
    return local;
  }
  function validate(material, data) {
    if (data.topicCode !== material.topicCode || typeof data.details !== 'string') throw new Error('教材格式不正確。');
    const expected = material.questionIds || [];
    if (!expected.length) return;
    if (!data.questions || !data.notes || Object.keys(data.questions).length !== expected.length) throw new Error('試題說明資料不完整，請重試。');
    for (const id of expected) {
      const question = data.questions[id];
      if (!question || typeof question.details !== 'string' || typeof question.note !== 'string' || !Array.isArray(question.noteIds)) throw new Error('試題說明格式不正確。');
      for (const noteId of question.noteIds) if (typeof noteId !== 'string' || typeof data.notes[noteId]?.html !== 'string') throw new Error('試題補充資料不完整。');
    }
  }
  function load(material) {
    if (material.details && (!(material.questionIds || []).length || material.questions)) return Promise.resolve();
    if (pending.has(material.topicCode)) return pending.get(material.topicCode);
    const controller = new window.AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const source = location.protocol === 'file:' ? localSource().then(() => ({ topicCode: material.topicCode, details: window.FactoryLocalMaterials[material.topicCode], ...window.FactoryLocalQuestionBundles?.[material.topicCode] })) : window.fetch(material.file, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('無法載入講義，請確認連線後重試。');
      return response.json();
    });
    const promise = source.then(data => {
      validate(material, data);
      material.details = data.details;
      material.questions = data.questions || {};
      material.notes = data.notes || {};
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
      const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'btn'; retry.textContent = '重新載入內容';
      retry.addEventListener('click', () => { retry.disabled = true; mount(context); }); host.append(retry);
    });
  }
  window.FactoryMaterials = { load, mount };
})();
