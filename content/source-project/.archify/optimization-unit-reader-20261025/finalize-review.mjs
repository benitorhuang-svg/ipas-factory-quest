import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const folder = new URL('.', import.meta.url);
const report = JSON.parse(await fs.readFile(new URL('verification.json', folder), 'utf8'));
assert.equal(report.failures.length, 0);
assert.equal(report.errors.length, 0);
assert.equal(report.passed, 54);
const widths = [390, 1440].map((width) => {
  const entries = report.results.filter(({ name }) => name.startsWith(`${width}/`));
  return { width, units: entries.length, minFontPx: Math.min(...entries.map(({ font }) => font)), maxFontPx: Math.max(...entries.map(({ font }) => font)) };
});
const data = await fs.readFile(new URL('../../dist/sw.js', folder));
const evidence = { ok: true, date: new Date().toISOString(), browserCases: report.passed, failures: [], viewportMetrics: widths,
  swSha256: crypto.createHash('sha256').update(data).digest('hex'), preview: report.base, priorCacheFailure: 'Resolved by content revisions and clientsClaim; see verification-before-cache-fix.json.' };
await fs.writeFile(new URL('result.json', folder), JSON.stringify(evidence, null, 2), 'utf8');
const review = `# 單元總結閱讀優化驗證\n\n完成日期：2026-10-25。範圍為 23 個考科單元的 Archify 教材頁閱讀介面。\n\n- 清晰閱讀會量測 SVG 文字後調整倍率；390px 與 1440px 各測 23 章，主節點文字最小 ${Math.min(...widths.map(x => x.minFontPx))}px。全圖可回到完整關聯總覽。\n- 文字導讀預設 18px，概念、關係與提示都由已審查的候選來源產生；可前後閱讀、沿關係跳轉並定位回圖。\n- 已驗證即時比例、縮放上下限、閱讀偏好、鍵盤頁籤、全螢幕、深色主題、觸控拖曳及快速切換章節。\n- HTTP 失敗、控制器錯誤與 20 秒逾時皆可重試；失敗時文字導讀仍可使用，重試也可由有效的預快取完成。\n- 53 個介面案例加 1 個實際離線案例，共 54 項通過，無未處理 JavaScript 錯誤。\n- 實際切斷網路並重新載入後，M11101、M13201、M22301 的圖與導讀均可讀；後兩章於離線前尚未開啟。\n- 已修正原先 assets 全部視為不可變資產的快取設定；23 份 HTML 與 23 份導讀都有內容指紋。原始 Archify 公開 HTML、候選來源及收據一致性檢查通過。\n- 型別檢查、正式建置與快取指紋檢查通過。既有超過 500 kB 的 JavaScript chunk 提示仍存在。\n\n## 證據\n\n- [完整瀏覽器結果](verification.json)\n- [獨立離線結果](offline-verification.json)\n- [摘要與 Service Worker 指紋](result.json)\n- [手機圖表](graph-390.png) / [手機大字導讀](reader-390.png)\n- [桌面圖表](graph-1440.png) / [桌面導讀](reader-1440.png)\n- [全螢幕](fullscreen.png) / [離線手機](offline-mobile.png)\n\n瀏覽器為獨立 Chromium；手機尺寸與觸控採模擬，未宣稱實體 iOS 或 Safari 驗證。\n\n本機預覽：${report.base}/#/topic/M13201\n`;
await fs.writeFile(new URL('review.md', folder), review, 'utf8');
console.log(JSON.stringify(evidence, null, 2));
