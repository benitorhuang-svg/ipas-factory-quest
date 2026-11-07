(function () {
  'use strict';
  function create(topicCodes) {
    const key = 'factory-quest-reading-v1';
    const allowed = new Set(topicCodes);
    const positions = new Map();
    let current = null;
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(key));
      if (saved?.version === 1 && Array.isArray(saved.positions)) {
        for (const [code, value] of saved.positions.slice(0, 64)) {
          if (allowed.has(code) && Number.isFinite(value?.y) && value.y >= 0 && value.y <= 10000000
            && Number.isFinite(value.offset) && Math.abs(value.offset) <= 1000000
            && (value.section === null || /^reading-section-\d+$/.test(value.section))) positions.set(code, value);
        }
      }
    } catch {}
    const frame = callback => window.requestAnimationFrame ? window.requestAnimationFrame(callback) : setTimeout(callback, 0);
    const cancel = id => { if (window.cancelAnimationFrame) window.cancelAnimationFrame(id); else clearTimeout(id); };
    function persist() {
      try { window.sessionStorage.setItem(key, JSON.stringify({ version: 1, positions: [...positions] })); } catch {}
    }
    function measure(record) {
      if (!record.root.isConnected) return;
      const headerEdge = (document.querySelector('.section-topbar')?.getBoundingClientRect().bottom || 0) + 32;
      const padding = parseFloat(window.getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      const margin = record.headings[0] ? parseFloat(window.getComputedStyle(record.headings[0]).scrollMarginTop) || 0 : 0;
      // scrollIntoView applies both root padding and heading margin. Include that
      // landing line so a paragraph jump does not highlight the previous section.
      const edge = Math.max(headerEdge, padding + margin + 1);
      let active = null;
      for (const heading of record.headings) {
        if (heading.getBoundingClientRect().top <= edge) active = heading;
        else break;
      }
      if (record.active !== (active?.id || null)) {
        for (const button of record.buttons) {
          if (button.dataset.target === active?.id) button.setAttribute('aria-current', 'location');
          else button.removeAttribute('aria-current');
        }
        record.active = active?.id || null;
      }
      positions.set(record.code, {
        y: Math.max(0, window.scrollY), section: active?.id || null,
        offset: active ? -active.getBoundingClientRect().top : 0,
      });
    }
    function restore(record) {
      if (current !== record || !record.target) return;
      const heading = record.target.section ? document.getElementById(record.target.section) : null;
      const y = heading ? window.scrollY + heading.getBoundingClientRect().top + record.target.offset : record.target.y;
      window.scrollTo({ top: Math.max(0, Math.ceil(y)), behavior: 'instant' });
    }
    function refresh() {
      if (!current) return;
      restore(current);
      measure(current);
    }
    function unmount() {
      if (!current) return;
      const record = current;
      measure(record);
      persist();
      current = null;
      if (record.frame !== null) cancel(record.frame);
      record.cleanup.forEach(cleanup => cleanup());
    }
    function mount() {
      const root = document.querySelector('[data-reading-key]');
      if (!root || !allowed.has(root.dataset.readingKey)) return;
      if (current) unmount();
      const record = {
        root, code: root.dataset.readingKey, headings: [...root.querySelectorAll('[id^="reading-section-"]')],
        buttons: [...root.querySelectorAll('[data-action="reading-section"]')],
        target: positions.get(root.dataset.readingKey) || null, frame: null, cleanup: [],
      };
      current = record;
      const listen = (target, name, handler, options) => {
        target.addEventListener(name, handler, options);
        record.cleanup.push(() => target.removeEventListener(name, handler, options));
      };
      const schedule = () => {
        if (record.frame !== null) return;
        record.frame = frame(() => {
          record.frame = null;
          if (current === record) refresh();
        });
      };
      const stopRestoring = () => { record.target = null; };
      // Layout/scroll anchoring can also emit scroll events. Only actual reader
      // input cancels a requested anchor; late layout must not cancel itself.
      listen(window, 'scroll', schedule, { passive: true });
      for (const name of ['wheel', 'touchstart', 'pointerdown', 'keydown']) listen(window, name, stopRestoring, { passive: true });
      listen(window, 'pagehide', () => { measure(record); persist(); });
      listen(document, 'visibilitychange', () => { if (document.hidden) { measure(record); persist(); } });
      const media = window.matchMedia?.('(min-width: 1600px)');
      const disclosure = root.querySelector('.reader-sections');
      if (media && disclosure) {
        const change = () => { disclosure.open = media.matches; };
        change();
        media.addEventListener?.('change', change);
        record.cleanup.push(() => media.removeEventListener?.('change', change));
      }
      if (window.ResizeObserver) {
        const observer = new window.ResizeObserver(schedule);
        observer.observe(root.querySelector('.reader-article'));
        record.cleanup.push(() => observer.disconnect());
      }
      listen(root, 'load', schedule, true);
      schedule();
    }
    function jump(target) {
      if (current) current.target = null;
      target?.scrollIntoView({ block: 'start', behavior: 'instant' });
      target?.focus({ preventScroll: true });
      if (current && target?.id && current.root.contains(target)) {
        const padding = parseFloat(window.getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
        const margin = parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0;
        current.target = { section: target.id, offset: -(padding + margin), y: window.scrollY };
        restore(current); measure(current); persist();
      }
    }
    return { mount, unmount, refresh, jump };
  }
  window.FactoryReadingPosition = { create };
})();
