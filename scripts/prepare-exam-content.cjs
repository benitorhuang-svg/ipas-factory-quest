const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { JSDOM } = require('jsdom');
const { escape: esc, contextReferences, focus, note } = require('./exam-analysis.cjs');

function applyReviews(output, index, root) {
  const audit = JSON.parse(fs.readFileSync(path.join(root, 'content/official-question-review.json'), 'utf8'));
  const digest = value => crypto.createHash('sha256').update(value).digest('hex');
  const checks = Object.assign({}, ...index.subjects.map(subject => {
    if (digest(fs.readFileSync(path.join(root, subject.source))) !== audit.sources[subject.subject] || subject.sha256 !== audit.sources[subject.subject]) throw new Error(`Changed official PDF: ${subject.subject}; review it again`);
    return JSON.parse(fs.readFileSync(path.join(root, `content/official-question-checks/${subject.subject}.json`), 'utf8'));
  }));
  if (Object.keys(checks).length !== output.length || Object.keys(audit.questions).length !== output.length) throw new Error('Official review coverage does not match question count');
  for (const question of output) {
    const check = checks[question.id], receipt = audit.questions[question.id];
    const signature = digest(JSON.stringify(question));
    if (!Array.isArray(check) || check.length !== 3 || check[0] !== question.officialAnswer || !['retained', 'qualified', 'ambiguous'].includes(check[1]) || typeof check[2] !== 'string' || !check[2].trim()) throw new Error(`Missing or invalid official check: ${question.id}`);
    if (signature !== receipt?.[0] || !Number.isInteger(receipt[1]) || receipt[1] < 1) throw new Error(`Changed official explanation: ${question.id}; review it again`);
    if (digest(JSON.stringify(check)) !== receipt[2]) throw new Error(`Changed official check: ${question.id}; review it again`);
    question.sourcePage = receipt[1];
    question.details += `\n<section class="question-check"><h3>結果檢核</h3><p class="study-paragraph">${esc(check[2])}</p></section>`;
    if (check[1] === 'ambiguous' && !question.note) question.note = check[2];
  }
}

// Keep imported receipts intact and retain complete paragraphs as shared context.
module.exports = function prepareExamContent(materials, root) {
  const index = JSON.parse(fs.readFileSync(path.join(root, 'docs/歷屆試題與解題技巧/115第一次試題教材對照索引.json'), 'utf8'));
  const subjects = index.subjects.map(subject => ({ code: subject.subject, title: path.basename(subject.source).match(/L\d{2}_?(.+)_公告試題\.pdf$/)?.[1] || subject.subject, source: `assets/pdf/${path.basename(subject.source)}`, sha256: subject.sha256 }));
  const questions = index.subjects.flatMap(subject => subject.questions.map(question => ({
    ...question, subject: subject.subject, id: `${subject.subject}-${question.question}`,
    reasoning: [], mistakes: [], noteIds: [],
  })));
  const byId = new Map(questions.map(question => [question.id, question]));
  const notes = new Map();
  const sourceTexts = new Map();
  function attach(block, subject, kind, fallback = []) {
    for (const [id, fragments] of focus(block, subject, fallback)) {
      const question = byId.get(id);
      if (!question) throw new Error(`Unknown exam reference: ${id}`);
      question[kind].push(...fragments);
    }
  }
  function preserve(block, material, heading, ids) {
    const record = note(block, material.topicCode, heading, ids);
    notes.set(record.id, record);
    for (const id of ids) {
      if (!byId.has(id)) throw new Error(`Unknown context reference: ${id}`);
      byId.get(id).noteIds.push(record.id);
    }
  }
  for (const material of materials) {
    const own = questions.filter(question => question.topicCode === material.topicCode);
    if (!own.length) continue;
    const subject = material.topicCode.startsWith('M22') ? 'L22' : own[0].subject;
    const dom = new JSDOM(material.details, { includeNodeLocations: true }), document = dom.window.document;
    sourceTexts.set(material.topicCode, document.body.textContent);
    const heading = [...document.querySelectorAll('h3')].find(node => node.textContent.startsWith('試題判讀與選項辨析'));
    if (!heading) throw new Error(`Missing exam analysis: ${material.topicCode}`);
    const section = [heading];
    for (let node = heading.nextElementSibling; node && !/^H[23]$/.test(node.tagName); node = node.nextElementSibling) section.push(node);
    for (const row of section.flatMap(node => [...node.querySelectorAll('tbody tr')])) {
      const [number, reasoning, mistakes] = row.children;
      const ids = [...number.textContent.matchAll(/\d+/g)].map(match => `${subject}-${Number(match[0])}`);
      attach(reasoning, subject, 'reasoning', ids); attach(mistakes, subject, 'mistakes', ids);
    }
    for (const node of section.slice(1)) {
      if (node.querySelector('table')) continue;
      for (const block of /^(UL|OL)$/.test(node.tagName) ? [...node.children] : [node]) {
        const ids = contextReferences(block.textContent, subject);
        preserve(block, material, heading.textContent, ids.length ? ids : own.map(question => question.id));
        attach(block, subject, 'reasoning');
      }
    }
    const rows = own.map(question => `<tr id="exam-core-${question.id}" tabindex="-1"><td><a class="study-link" data-action="question-open" data-question="${question.id}" data-material="${material.topicCode}" href="#/guide/questions/${question.id}">${question.subject} 第 ${question.question} 題</a></td><td>${esc(question.concept)}</td></tr>`).join('');
    const replacement = `<h3 class="study-h3">對應考題核心</h3>\n<p class="study-paragraph">從考查核心回想本章觀念；點選題號可閱讀本題說明。</p>\n<div class="table-container"><table class="data-table"><thead><tr><th scope="col">對應考題</th><th scope="col">考查核心</th></tr></thead><tbody>${rows}</tbody></table></div>\n`;
    const start = dom.nodeLocation(heading).startOffset;
    const last = dom.nodeLocation(section.at(-1)).endOffset;
    const edits = [{ start, end: last, text: replacement }];
    let currentHeading = '';
    for (const block of document.body.children) {
      if (/^H[23]$/.test(block.tagName)) currentHeading = block.textContent;
      if (section.includes(block)) continue;
      if (/^H[23]$/.test(block.tagName) && /公告試題|試題導向/.test(block.textContent)) {
        const label = block.textContent.replace(/^(?:\d+\.\s*)?(?:115 年第一次)?公告試題(?:補強|導向)?[：:]?\s*/, '核心內容：').replace('試題導向練習', '應用練習').replace('試題導向：', '核心內容：');
        const location = dom.nodeLocation(block);
        edits.push({ start: location.startOffset, end: location.endOffset, text: `<${block.tagName.toLowerCase()} class="${block.className}">${esc(label)}</${block.tagName.toLowerCase()}>` });
      }
      if (!/^(P|UL|OL)$/.test(block.tagName)) continue;
      for (const item of /^(UL|OL)$/.test(block.tagName) ? [...block.children] : [block]) {
        const ids = contextReferences(item.textContent, subject);
        if (!ids.length) continue;
        preserve(item, material, currentHeading, ids);
        const location = dom.nodeLocation(item);
        edits.push({ start: location.startOffset, end: location.endOffset, text: '' });
      }
    }
    for (const edit of edits.sort((a, b) => b.start - a.start)) material.details = material.details.slice(0, edit.start) + edit.text + material.details.slice(edit.end);
    dom.window.close();
  }
  const supplements = JSON.parse(fs.readFileSync(path.join(root, 'content/exam-analysis-supplements.json'), 'utf8'));
  for (const supplement of supplements) {
    const question = byId.get(supplement.questionId);
    if (!question || !sourceTexts.get(supplement.materialCode)?.includes(supplement.quote)) throw new Error(`Unverified source excerpt: ${supplement.questionId}`);
    question.reasoning.push(`<p class="study-paragraph">${esc(supplement.quote)}${/[。！？]$/.test(supplement.quote) ? '' : '。'}</p>`);
  }
  const output = questions.map(question => {
    if (!question.reasoning.length) throw new Error(`Missing focused analysis: ${question.id}`);
    const { reasoning, mistakes, noteIds, topicCode, ...meta } = question;
    const paragraphs = items => [...new Set(items)].join('\n');
    return { ...meta, topicCode: `EXAM-${question.id}`, materialCode: topicCode, noteIds: [...new Set(noteIds)],
      details: `<section class="question-reasoning"><h3>判斷步驟</h3>${paragraphs(reasoning)}</section>${mistakes.length ? `<section class="question-mistakes"><h3>常見誤選理由</h3>${paragraphs(mistakes)}</section>` : ''}` };
  });
  applyReviews(output, index, root);
  return { questions: output, subjects, notes: [...notes.values()] };
};
module.exports.applyReviews = applyReviews;
