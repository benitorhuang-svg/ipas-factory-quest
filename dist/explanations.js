/* global module */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FactoryExplanations = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const groups = {
    正解解析: 'steps', 正解: 'steps', 解題步驟: 'steps', 破題關鍵: 'focus',
    干擾項辨析: 'pitfalls', 重點辨析: 'pitfalls', 常見誤算剖析: 'pitfalls',
    避坑提醒: 'check', 觀念提示: 'check', 結果檢核: 'check',
  };
  const marker = new RegExp(`【(${Object.keys(groups).join('|')})】`, 'g');
  const key = text => text.replace(/[\s。；;•\-*]/g, '');
  function generic(text) {
    return /其他選項均為|與題意核心概念不符|數值計算(?:常見干擾陷阱|干擾項)|常見誤算：未扣抵安全庫存/.test(text);
  }
  function parse(text = '') {
    const parts = { focus: [], steps: [], pitfalls: [], check: [] };
    const matches = [...text.matchAll(marker)];
    let start = 0, group = 'steps';
    const seen = new Set();
    const append = end => {
      for (const line of text.slice(start, end).split(/\r?\n/)) {
        const clean = line.trim().replace(/^[•\-*]\s*/, '');
        if (!clean || generic(clean) || seen.has(key(clean))) continue;
        seen.add(key(clean)); parts[group].push(clean);
      }
    };
    for (const match of matches) {
      append(match.index);
      group = groups[match[1]]; start = match.index + match[0].length;
    }
    append(text.length);
    return parts;
  }
  function render({ esc, icon }, question, { answer, order } = {}) {
    const detail = question.analysis || parse(question.explanation);
    const focus = (detail.focus || [])
      .filter(line => !detail.steps.some(step => key(step).includes(key(line))));
    const paragraphs = lines => lines.map(line => `<p class="expl-p">${esc(line)}</p>`).join('');
    const section = (title, body, type) => body ? `<section class="expl-section expl-${type}"><h4>${title}</h4>${body}</section>` : '';
    const focusHtml = section('破題關鍵', paragraphs(focus), 'focus');
    const steps = detail.steps || [];
    const solution = section(question.skill === 'calculation' || question.kind === 'number' ? '解題步驟' : '正解解析',
      steps.length > 1 ? `<ol class="expl-steps">${steps.map(step => `<li>${esc(step)}</li>`).join('')}</ol>` : paragraphs(steps), 'solution');
    let options = '';
    if (detail.options && question.kind === 'choice') {
      options = (order || question.options.map((_, index) => index)).map((index, slot) => {
        if (index === question.answer) return '';
        const selected = answer === index;
        return `<li class="expl-option${selected ? ' is-selected' : ''}" data-option-index="${index}"><div><strong>${'ABCD'[slot]}. ${esc(question.options[index])}</strong>${selected ? '<span class="expl-selected">你的選擇</span>' : ''}</div><p>${esc(detail.options[index])}</p></li>`;
      }).join('');
      options = `<ul class="expl-options">${options}</ul>`;
    }
    const pitfalls = section(options ? '選項辨析' : '重點辨析', options ||
      (detail.pitfalls?.length ? `<ul class="expl-pitfalls">${detail.pitfalls.map(line => `<li>${esc(line)}</li>`).join('')}</ul>` : ''), 'distinctions');
    const check = section('本題檢核', paragraphs(detail.check || []), 'check');
    const references = (detail.references || []).filter(ref => /^https:\/\//.test(ref.url)).map(ref =>
      `<a href="${esc(ref.url)}" target="_blank" rel="noopener noreferrer">${esc(ref.title)}</a>`).join('、');
    const sources = references ? `<p class="expl-p expl-sources">參考依據：${references}</p>` : '';
    return `<div class="explanation-card"><div class="expl-card-head">${icon('bulb')}<strong>試題解析</strong></div>${focusHtml}${solution}${pitfalls}${check}${sources}</div>`;
  }
  return { parse, render };
});
