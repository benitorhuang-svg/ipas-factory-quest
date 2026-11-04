(function () {
  'use strict';
  let sequence = 0;
  function retry(root = document) {
    for (const image of root.querySelectorAll('img[data-media-failed]')) {
      const message = document.getElementById(image.dataset.mediaFailed);
      const button = image.closest('button');
      if (button?.getAttribute('aria-describedby') === message?.id) button.removeAttribute('aria-describedby');
      message?.remove();
      delete image.dataset.mediaFailed;
      image.hidden = false;
      image.src = image.getAttribute('src');
    }
    root.querySelector('[data-action="retry-media"]')?.remove();
  }
  function bind() {
    document.addEventListener('error', event => {
      const image = event.target;
      if (!(image instanceof window.HTMLImageElement) || !image.closest('#content, #modal') || image.dataset.mediaFailed) return;
      const message = document.createElement('span');
      message.className = 'media-unavailable';
      message.id = `media-unavailable-${++sequence}`;
      message.textContent = `${image.alt ? image.alt + '：' : ''}圖解暫時無法載入。請確認連線後重試。`;
      image.hidden = true;
      image.dataset.mediaFailed = message.id;
      image.after(message);
      image.closest('button')?.setAttribute('aria-describedby', message.id);
      const actions = image.closest('dialog')?.querySelector('.media-actions');
      if (actions && !actions.querySelector('[data-action="retry-media"]')) {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'btn btn-small'; button.dataset.action = 'retry-media'; button.textContent = '重新載入';
        actions.prepend(button);
      }
    }, true);
    window.addEventListener('online', () => retry());
  }
  window.FactoryMedia = { bind, retry };
})();
