import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TOPICS_CONFIG } from './study-topics.mjs';
import { writeStudyIndex } from './write-study-index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.resolve(rootDir, 'src/data/study-materials');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * 簡易而強大的 Markdown 轉 HTML 轉譯器
 * 針對繁體中文、表格、LaTeX 公式保護與程式碼做嚴謹處理
 */
function markdownToHtml(md, sourceFile) {
  // 1. 保留並替換數學公式區塊以避免被 Markdown 語法破壞
  const mathBlocks = [];
  let processed = md.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
    const idx = mathBlocks.length;
    mathBlocks.push(`<div class="math-block">$$${formula.trim()}$$</div>`);
    return `___MATH_BLOCK_${idx}___`;
  });

  const mathInlines = [];
  processed = processed.replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
    const idx = mathInlines.length;
    mathInlines.push(`<span class="math-inline">$${formula.trim()}$</span>`);
    return `___MATH_INLINE_${idx}___`;
  });

  const lines = processed.split('\n');
  const out = [];
  let inList = false;
  let listType = null;
  let inTable = false;
  let tableRows = [];
  let inCodeBlock = false;
  let codeLang = '';
  let codeLines = [];

  function flushList() {
    if (inList) {
      out.push(listType === 'ul' ? '</ul>' : '</ol>');
      inList = false;
      listType = null;
    }
  }

  function flushTable() {
    if (inTable) {
      if (tableRows.length >= 2) {
        const headerRow = tableRows[0];
        const bodyRows = tableRows.slice(2); // row 1 is divider
        
        let html = '<div class="table-container"><table class="data-table"><thead><tr>';
        for (const cell of headerRow) {
          html += `<th>${cell.trim()}</th>`;
        }
        html += '</tr></thead><tbody>';
        
        for (const row of bodyRows) {
          html += '<tr>';
          for (let i = 0; i < headerRow.length; i++) {
            const cell = row[i] !== undefined ? row[i].trim() : '';
            html += `<td>${cell}</td>`;
          }
          html += '</tr>';
        }
        html += '</tbody></table></div>';
        out.push(html);
      }
      inTable = false;
      tableRows = [];
    }
  }

  function flushCodeBlock() {
    if (inCodeBlock) {
      if (codeLang === 'mermaid') {
        const rawCode = codeLines.join('\n');
        out.push(`<div class="mermaid-block"><pre class="mermaid">${rawCode}</pre></div>`);
      } else {
        const codeEscaped = codeLines.join('\n')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        out.push(`<pre class="code-block language-${codeLang}"><code>${codeEscaped}</code></pre>`);
      }
      inCodeBlock = false;
      codeLines = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // 處理程式碼區塊 ```
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        flushList();
        flushTable();
        inCodeBlock = true;
        codeLang = line.replace('```', '').trim() || 'text';
      }
      continue;
    }
    if (inCodeBlock) {
      codeLines.push(rawLine);
      continue;
    }

    // 支援原生 HTML pass-through (例如圖解卡片)
    if (line.startsWith('<')) {
      flushList();
      flushTable();
      out.push(rawLine);
      continue;
    }

    // 處理 Markdown 表格 | a | b |
    if (line.startsWith('|') && line.endsWith('|')) {
      flushList();
      inTable = true;
      const cells = line.slice(1, -1).split('|');
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // 空行
    if (line === '') {
      flushList();
      continue;
    }

    // 處理水平分隔線
    if (line === '---' || line === '***') {
      flushList();
      out.push('<hr class="study-divider" />');
      continue;
    }

    // 處理標題
    if (line.startsWith('# ')) {
      flushList();
      const title = line.replace('# ', '').trim();
      out.push(`<h1 class="study-h1">${title}</h1>`);
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      const title = line.replace('## ', '').trim();
      out.push(`<h2 class="study-h2">${title}</h2>`);
      continue;
    }
    if (line.startsWith('### ')) {
      flushList();
      const title = line.replace('### ', '').trim();
      out.push(`<h3 class="study-h3">${title}</h3>`);
      continue;
    }
    if (line.startsWith('#### ')) {
      flushList();
      const title = line.replace('#### ', '').trim();
      out.push(`<h4 class="study-h4"><span class="h4-bar"></span>${title}</h4>`);
      continue;
    }

    // 處理清單項目
    if (line.startsWith('* ') || line.startsWith('- ')) {
      if (!inList || listType !== 'ul') {
        flushList();
        out.push('<ul class="study-list">');
        inList = true;
        listType = 'ul';
      }
      const itemContent = line.slice(2).trim();
      out.push(`<li>${itemContent}</li>`);
      continue;
    }

    // 處理有序清單 1. 2.
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      if (!inList || listType !== 'ol') {
        flushList();
        out.push('<ol class="study-ordered-list">');
        inList = true;
        listType = 'ol';
      }
      out.push(`<li>${numMatch[2].trim()}</li>`);
      continue;
    }

    // 一般段落
    flushList();
    out.push(`<p class="study-paragraph">${line}</p>`);
  }

  flushList();
  flushTable();
  flushCodeBlock();

  let html = out.join('\n');

  // 行內語法處理：粗體與行內代碼
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="study-strong">$1</strong>');
  html = html.replace(/`([^`]+)`/g, '<code class="study-inline-code">$1</code>');

  // 超連結處理 (將內部 .md 參照轉為友好連結)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, href) => {
    let targetHref = href;
    if (!/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) {
      const targetFile = path.resolve(
        rootDir,
        'docs',
        path.dirname(sourceFile),
        href.split(/[?#]/, 1)[0]
      );
      const targetTopic = TOPICS_CONFIG.find(
        (topic) => path.resolve(rootDir, 'docs', topic.file) === targetFile
      );
      if (targetTopic) targetHref = `#/topic/${targetTopic.code}`;
    }
    if (targetHref === href && ['01_', '02_', '03_', '04_', '05_', '06_'].some((prefix) => href.includes(prefix))) {
      targetHref = '#/topics';
    }
    return `<a href="${targetHref}" class="study-link">${label}</a>`;
  });

  // 還原被隔離的數學公式
  html = html.replace(/___MATH_BLOCK_(\d+)___/g, (match, idx) => mathBlocks[parseInt(idx, 10)]);
  html = html.replace(/___MATH_INLINE_(\d+)___/g, (match, idx) => mathInlines[parseInt(idx, 10)]);

  return html;
}

function processAll() {
  console.log('🚀 開始將 Markdown 考科筆記同步為 PWA 單元教材...');

  const exportsMap = {};

  for (const topic of TOPICS_CONFIG) {
    const fullPath = path.resolve(rootDir, 'docs', topic.file);
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️ 檔案不存在: ${fullPath}`);
      continue;
    }

    const mdContent = fs.readFileSync(fullPath, 'utf-8');
    
    // 提取 Summary
    const lines = mdContent.split('\n').map(l => l.trim()).filter(Boolean);
    let summary = `本單元為【${topic.name}】之核心重點鑑定內容，涵蓋標準定義、工業架構與計算題型。`;
    for (const line of lines) {
      if (!line.startsWith('#') && !line.startsWith('---') && !line.startsWith('```') && !line.startsWith('<') && line.length > 20) {
        summary = line.replace(/\*\*/g, '').slice(0, 160) + '...';
        break;
      }
    }

    const htmlContent = markdownToHtml(mdContent, topic.file);

    const tsContent = `/**
 * ${topic.code}.ts — ${topic.name}
 * 自動生成自: ${topic.file}
 */

import type { StudyMaterial } from '@/core/types';

export const material: StudyMaterial = {
  topicCode: '${topic.code}',
  summary: ${JSON.stringify(summary)},
  coreConcepts: ${JSON.stringify(topic.coreConcepts, null, 2)},
  details: ${JSON.stringify(htmlContent)}
};
`;

    const outFilePath = path.join(outputDir, `${topic.code}.ts`);
    fs.writeFileSync(outFilePath, tsContent, 'utf-8');
    console.log(`✅ 已生成教材: ${topic.code} (${topic.name})`);
    exportsMap[topic.code] = topic.code;
  }

  writeStudyIndex(rootDir, exportsMap);
}

processAll();
