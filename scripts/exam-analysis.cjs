const crypto = require('node:crypto');

const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
function references(text, initialSubject) {
  let subject = initialSubject;
  const ids = new Set();
  for (const match of text.matchAll(/L(?:11|12|21|22)|第\s*([\d\s、，～~–—-]+)\s*題/g)) {
    if (!match[1]) subject = match[0];
    else for (const part of match[1].split(/[、，]/)) {
      const [first, last = first] = part.trim().split(/[～~–—-]/).map(Number);
      if (!Number.isInteger(first) || first < 1 || last > 50 || last < first) throw new Error(`Invalid exam reference: ${match[0]}`);
      for (let number = first; number <= last; number++) ids.add(`${subject}-${number}`);
    }
  }
  return { ids: [...ids], subject };
}

// Slice through text nodes so inline formula and link markup survives.
function sliceHTML(block, start, end) {
  const document = block.ownerDocument, walker = document.createTreeWalker(block, 4);
  const texts = [];
  let total = 0, node;
  while ((node = walker.nextNode())) { texts.push({ node, start: total, end: total + node.length }); total += node.length; }
  const first = texts.find(text => text.end > start), last = texts.find(text => text.end >= end);
  if (!first || !last) return '';
  const range = document.createRange();
  range.setStart(first.node, start - first.start); range.setEnd(last.node, end - last.start);
  const wrapper = document.createElement('p'); wrapper.className = 'study-paragraph'; wrapper.append(range.cloneContents());
  const tail = document.createTreeWalker(wrapper, 4);
  let lastText;
  while ((node = tail.nextNode())) lastText = node;
  if (lastText) lastText.data = lastText.data.replace(/[，,；]$/, '。');
  return wrapper.outerHTML;
}
function focus(block, initialSubject, fallback = []) {
  const result = new Map();
  let subject = initialSubject, current = fallback;
  for (const match of block.textContent.matchAll(/[\s\S]+?(?:[。；]|[，,](?=(?:L(?:11|12|21|22)\s*)?第\s*\d)|$)/g)) {
    const refs = references(match[0], subject); subject = refs.subject;
    if (refs.ids.length) current = refs.ids;
    const html = sliceHTML(block, match.index, match.index + match[0].length);
    for (const id of current) {
      if (!result.has(id)) result.set(id, []);
      result.get(id).push(html);
    }
  }
  return result;
}
function note(block, materialCode, heading, ids) {
  const html = block.outerHTML;
  const id = crypto.createHash('sha256').update(materialCode + '\0' + html).digest('hex').slice(0, 16);
  return { id, materialCode, heading, html, questionIds: ids };
}
function contextReferences(text, subject) {
  // A leading list defines the scope of a shared paragraph. Later unqualified
  // references use the author's local subject, not the last subject in that list.
  const scope = text.split('。')[0];
  return references(/^\s*(?:對照|對應)/.test(scope) ? scope : text, subject).ids;
}
module.exports = { escape, references, contextReferences, focus, note };
