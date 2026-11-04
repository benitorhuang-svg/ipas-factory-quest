(function () {
  'use strict';
  const pending = new Map();
  let mathStylesReady = false;
  function load(key, url, stylesheet = false) {
    if (pending.has(key)) return pending.get(key);
    const promise = new Promise((resolve, reject) => {
      const element = document.createElement(stylesheet ? 'link' : 'script');
      if (stylesheet) { element.rel = 'stylesheet'; element.href = url; }
      else { element.src = url; element.async = true; }
      let settled = false;
      const finish = failed => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        element.onload = null;
        element.onerror = null;
        if (failed) {
          pending.delete(key);
          element.remove();
          reject(new Error(`${key} could not be loaded`));
        } else {
          if (stylesheet) mathStylesReady = true;
          resolve();
        }
      };
      element.onload = () => finish(false);
      element.onerror = () => finish(true);
      const timer = setTimeout(() => finish(true), 15000);
      document.head.append(element);
    });
    pending.set(key, promise);
    return promise;
  }
  function katex() {
    return Promise.all([
      window.katex ? Promise.resolve() : load('katex', 'assets/vendor/katex/katex.min.js'),
      load('katex-styles', 'assets/vendor/katex/katex.min.css', true),
    ]);
  }
  window.FactoryAssets = {
    mermaid: () => window.mermaid ? Promise.resolve() : load('mermaid', window.FACTORY_QUEST_DATA?.rendererUrl || 'assets/mermaid.min.js'),
    katex,
    mathReady: () => Boolean(window.katex && mathStylesReady),
  };
})();
