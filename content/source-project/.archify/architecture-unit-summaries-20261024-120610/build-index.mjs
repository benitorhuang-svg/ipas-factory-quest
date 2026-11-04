import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const artifactRoot = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(artifactRoot, '../..');
const { TOPICS_CONFIG } = await import(pathToFileURL(path.join(root, 'scripts/study-topics.mjs')));
const topics = TOPICS_CONFIG.filter(({ code }) => /^M\d{5}$/.test(code));
const publicRoot = path.join(root, 'public/assets/interactive-diagrams/unit-summaries');
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const relative = (file) => path.relative(root, file).replaceAll('\\', '/');
const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');

function walk(folder) {
  return fs.readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(folder, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

const diagrams = topics.map((topic) => {
  const asset = path.join(publicRoot, `${topic.code}.html`);
  const assetSha256 = hash(asset);
  const matches = walk(path.join(artifactRoot, topic.code))
    .filter((file) => file.endsWith('.finalize-summary.json'))
    .map((file) => ({ file, value: JSON.parse(fs.readFileSync(file, 'utf8')), time: fs.statSync(file).mtimeMs }))
    .filter(({ value }) => value.ok && value.artifact?.sha256 === assetSha256)
    .sort((a, b) => b.time - a.time);
  if (!matches.length) throw new Error(`${topic.code}: no passing receipt matches the public HTML.`);
  const latest = matches[0];
  if (hash(latest.value.specification.path) !== latest.value.specification.sha256) {
    throw new Error(`${topic.code}: candidate changed after finalization.`);
  }
  const source = path.join(root, 'docs', topic.file);
  return {
    code: topic.code, title: topic.name, source: relative(source), sourceSha256: hash(source),
    candidate: relative(latest.value.specification.path), receipt: relative(latest.file),
    assetSha256, bytes: fs.statSync(asset).size,
  };
});

fs.writeFileSync(path.join(publicRoot, 'manifest.json'), JSON.stringify({
  schemaVersion: 1, generatedAt: new Date().toISOString(), artifactRoot: relative(artifactRoot), diagrams,
}, null, 2) + '\n', 'utf8');

const subjects = [
  ['M11', '初級考科一｜生產與作業管理基礎'],
  ['M12', '初級考科二｜智慧製造生產線管理基礎'],
  ['M13', '術科｜智慧生產與管理實務'],
  ['M21', '中級考科一｜生產與作業管理實務應用'],
  ['M22', '中級考科二｜設備與製程管理實務應用'],
];
const groups = subjects.map(([prefix, title]) => `<section><h2>${title}</h2><div class="units">${topics
  .filter(({ code }) => code.startsWith(prefix))
  .map(({ code, name }) => `<a href="./${code}.html"><span>${code}</span><strong>${escape(name)}</strong><small>開啟互動總結 ↗</small></a>`).join('\n')}</div></section>`).join('\n');
const index = `<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>23 個考科單元・互動總結</title><style>
:root{color-scheme:light dark;font-family:system-ui,"Microsoft JhengHei",sans-serif;background:#f3f6fb;color:#16243b}
body{max-width:1120px;margin:auto;padding:40px 24px 72px}h1{font-size:clamp(26px,4vw,40px);margin:8px 0 16px}p{color:#516079;line-height:1.8}header{margin-bottom:40px}header small{color:#4f46e5;font-weight:700;letter-spacing:.12em}h2{font-size:19px;margin:32px 0 16px}.units{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}a{display:flex;flex-direction:column;gap:12px;padding:22px;background:#fff;border:1px solid #dfe6f0;border-radius:16px;color:inherit;text-decoration:none}a:hover,a:focus-visible{border-color:#635bff;box-shadow:0 4px 16px #4f46e520}a span{font-size:12px;font-weight:700;color:#4f46e5}a strong{line-height:1.6}a small{color:#65738a}footer{margin-top:40px;color:#65738a;font-size:13px;line-height:1.8}@media(prefers-color-scheme:dark){:root{background:#101725;color:#e5edf9}a{background:#182235;border-color:#2c3c55}p,a small,footer{color:#acb9cf}a span,header small{color:#ada8ff}}
</style></head><body><header><small>iPAS SMART PRODUCTION</small><h1>每個單元，一張互動總結</h1><p>23 個考科單元的概念關係、判讀條件與易混淆處。點選單元開啟 Archify 圖，也可在教材頁首直接閱讀。</p></header>
${groups}
<footer>各圖依對應教材整理。點選概念可探索上下游關係；公式與操作判讀請連同圖旁的前提說明閱讀。</footer></body></html>\n`;
fs.writeFileSync(path.join(publicRoot, 'index.html'), index, 'utf8');

const rows = diagrams.map((entry) => `| ${entry.code} | [${entry.title}](../${entry.source}) | [互動圖](../public/assets/interactive-diagrams/unit-summaries/${entry.code}.html) | [JSON](../${entry.candidate}) |`).join('\n');
const doc = `# 考科單元互動總結\n\n23 個 M 開頭的考科單元各有一張 Archify 總結，顯示在教材頁首的「單元總結・互動關聯圖」，並加入本章閱讀目錄。圖中保留概念間關係、公式前提、判讀界線及複習問題。\n\n[開啟全部總結圖索引](../public/assets/interactive-diagrams/unit-summaries/index.html)\n\n| 單元 | 教材來源 | 成品 | 編輯來源 |\n| --- | --- | --- | --- |\n${rows}\n\n## 維護方式\n\n- 教材文字是內容依據；修訂教材後，重新檢視該單元圖中的節點、箭頭與提示卡。\n- JSON 編輯來源與 Archify 收據位於 ${relative(artifactRoot)}/各單元目錄。每張應通過 finalize，並將已驗證 HTML 複製至 public/assets/interactive-diagrams/unit-summaries/對應代碼.html。\n- 完成內容審查與重新產圖後，以 node ${relative(artifactRoot)}/build-index.mjs 更新索引與來源雜湊清單。該命令只產生索引，不更新圖中知識。\n- 執行 npm run check:unit-summaries 檢查 23 單元覆蓋、教材來源雜湊、公開 HTML 與 Archify 收據的一致性，再執行 npm run typecheck 與 npm run build。\n- 頁首入口由 src/components/UnitSummary.ts 共用提供；教材同步仍可照原流程執行。\n\n## 載入與離線\n\n圖表進入可視範圍附近時才建立內容載入；iframe 使用獨立 sandbox，並提供完整圖的新頁面入口。正式打包時互動 HTML 會納入既有 PWA 預快取。\n`;
const viewerNotes = `\n## 互動閱讀\n\n- 頁首提供「全圖」與「清晰閱讀」；清晰閱讀以節點標題約 14px 為縮放目標，並顯示即時比例。可放大、縮小、拖曳及全螢幕閱讀，選擇的模式會沿用到其他單元。\n- 「文字導讀」以 18px 大字呈現概念、上下游關係與複習提示；可逐點閱讀，再定位回互動圖。大字偏好會保存於本機。\n- 導讀由已審查的 candidate.json 產生；更新圖表後執行 npm run sync:unit-summary-readers。check:unit-summaries 與建置前檢查會防止導讀和圖表來源不一致。\n- 載入有 20 秒上限，失敗時可重試；文字導讀可獨立使用。記憶體最多保留四份圖表文件，切換單元時會清理接收器與未完成請求。\n- 正式版會預快取 23 份 .reader.json，使離線教材同時提供互動圖與文字導讀。\n`;
const cacheNotes = '- 建置後會核對所有圖表與導讀的快取內容指紋；首次安裝的 Service Worker 會立即接管，避免沿用無版本的教材快取。\n';
fs.writeFileSync(path.join(root, 'docs/單元互動總結.md'), doc + viewerNotes + cacheNotes, 'utf8');
console.log(`Published index and manifest for ${diagrams.length} summaries.`);
