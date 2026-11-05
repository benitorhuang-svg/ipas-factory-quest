# Factory Quest 專案優化稽核

> 本文保留 2026-11-04 實作前的稽核快照。後續修正、效能數字及驗證範圍見 [深度優化紀錄](OPTIMIZATION.md)。

## 1. 專案基本資訊

- 稽核日期：2026-11-04；範圍：目前工作目錄，包含既有尚未提交的整合與介面修改。
- 實際產品：Factory Quest 初級兩科學科備考 PWA；執行入口為 `dist/index.html`。
- 技術：HTML、CSS、Vanilla JavaScript、LocalStorage、Service Worker；Mermaid、KaTeX 為站內資源。
- 工具：npm／package-lock.json，Node.js >=22.13.0；開發依賴 ESLint、jsdom。
- `content/source-project/` 是保存的 TypeScript/Vite 來源，不是目前網站啟動入口。
- 啟動：`python -m http.server 8000 --directory dist`，開啟 localhost:8000。
- 檢查：`npm run lint`、`npm test`；建置：`npm run build`。
- 本次已執行：lint 零警告通過、八個 test 腳本全部通過，以及唯讀資料／資產統計與無害 HTML 注入重現。
- 本次未執行：build、套件安裝、格式修正、瀏覽器 E2E、手機／PWA 安裝與線上部署驗收。build 會覆寫 content 與 dist，故不在此次唯讀檢查中執行。
- 唯一寫入為本報告；保留原本工作目錄修改。舊報告的 Vite 入口與「尚無作答功能」判斷已不適用。

## 2. 專案目錄結構

以下省略依賴、發布輸出與 Git 內部目錄；發布程式職責另見架構分析。

```text
.github/workflows/             GitHub Pages 部署
content/
  units.json                  12 個單元
  questions-subject*.json      272 + 204 筆題目
  study-materials/             28 篇教材來源模組
  study-materials.json         教材整合輸出，同時提供部分建置輸入
  glossary.json                165 筆辭典
  site-resources.json          視覺資源與 PDF 清單
  source-integration.json      891 個來源檔案保存紀錄
  source-project/              另一套專案的保存來源
docs/                          教材、設計、整合及介面驗收紀錄
scripts/                       教材建置、預快取、來源整合與舊診斷工具
tests/                         資料、路由、作答、閱讀、資產與模擬 SW 測試
package.json                   現行命令與開發依賴
eslint.config.mjs              現行 lint 範圍及規則
```

## 3. 核心功能推測

由入口、路由及測試可確認程式包含以下功能；本次 DOM 執行不等於實機操作驗收。

- 12 單元任務、5 題快練、錯題複習、XP／徽章。
- 兩科各 50 題、75 分鐘模考，暫存作答及到時交卷。
- 28 篇教材、165 筆辭典、公式／易錯觀念、9 份 PDF。
- 單元圖鑑、Mermaid／KaTeX、互動圖 iframe、閱讀位置接續。
- 本機進度保存與 JSON 備份匯入／匯出。
- PWA 外殼預快取，圖片／PDF／互動頁按需快取。

「476 筆題目」是記錄數；本次依題幹、類型、選項、答案、容差與單位比較，只得到 416 種不同題目，詳見風險。

## 4. 架構分析

- **啟動與路由**：`dist/index.html` 依序載入 24 個站內腳本、12 份樣式；`app.js` 解析 hash，組合各 view，透過 `window.Factory*` 互通。
- **資料流**：教材 TS 字串 → `scripts/build-materials.cjs` → `content/study-materials.json`／`dist/data.js` → UI；題庫、辭典及資源清單亦併入 data.js。
- **狀態**：`engine.js` 負責抽題、復原、計分與進度；`session.js` 處理任務生命週期；`app.js` 把整份狀態寫入 LocalStorage。
- **分層**：頁面已拆為 view 模組，另有彈窗、閱讀定位、圖表、公式與資產載入模組；目前根層執行 JS/CSS 均未超過 300 行。
- **外部邊界**：主要學習流程未見後端 API；使用者匯入 JSON、教材 HTML、同源互動 iframe、Service Worker 快取是主要信任邊界。
- **PWA**：`build-precache.mjs` 對外殼與 SW 計算版本；103 個預快取資產，8,146,316 bytes；本次重算版本與現有清單一致。
- **測試**：八個 Node 腳本涵蓋題庫／計分、891 個來源雜湊、60 張圖、610 個公式、路由與作答流程；畫面幾何、dialog 及 SW 多為 jsdom／模擬事件。

## 5. 目前風險

| 優先 | 類別 | 證據、機制與影響 |
| --- | --- | --- |
| P0 | 匯入安全／正確性 | `dist/engine.js:67` 原樣保留大部分 history 欄位；`view-quiz.js:96`、`view-progress.js:28` 直接插入 unitId 等值。無害的 b 標記可穿過 restore 並生成 DOM，已證實 HTML 注入；未測試執行惡意腳本。使用者須先匯入特製備份才會觸發，存在 DOM XSS 風險。 |
| P1 | 題庫品質／評量 | 476 筆包含 40 組完全重複題，多出 60 筆；例如 L111-B01／B05／B09。抽題與 XP 以 ID 區分，同一內容可能在同次測驗出現多次，亦可被計為不同題目首次答對。 |
| P1 | 發布可靠性 | `.github/workflows/deploy.yml` 直接上傳 dist，沒有 Node／npm ci／lint／build／test，也沒有 PR 驗證；本機通過不代表之後每次部署會驗證。 |
| P1 | 更新生命週期 | `dist/sw.js:17` install 後立即 skipWaiting，activate 時 claim 並移除可清理舊外殼。新 SW 可接管舊頁面，延後載入資產可能跨版本；此為程式與生命週期推論，尚未在兩版本瀏覽器重現。 |
| P1 | 實機驗證缺口 | 現有測試沒有實際瀏覽器排版與原生 SW；`docs/UI_REDESIGN.md` 亦列有手機、200% 縮放、dialog 焦點、離線與更新待驗項目。 |
| P2 | 載入／容量 | 發布資產共 95,945,848 bytes，data.js 989,850 bytes，Mermaid 5,575,485 bytes 且列入預快取；多張 PNG 約 2–2.76 MB。按需執行 Mermaid 已做好，但首次 SW 安裝仍會下載它；數字皆為原始檔大小，不是網路壓縮傳輸量。 |
| P2 | 快取管理 | 內容快取長期保留、未見容量預估／內容離線清單／使用者管理介面。現有 quota fallback 能維持回應，但無法讓學習者掌握哪些章節已備妥。 |
| P2 | 存檔一致性 | `app.js` 在每次答案 input 同步序列化整份狀態，storage 事件直接取代目前狀態。多分頁同時作答可能覆寫彼此進度；本次僅靜態判讀，未做競態重現。 |
| P2 | 學習效果 | `engine.js:90` 寫入 dueAt，但 review 抽題只使用最後答錯的 ID；答對題到期不會回到複習。首頁建議主要依未通關／最佳分數，未使用到期日及近期弱點。 |
| P2 | 內容治理 | 476 筆皆未提供 source、sourceUrl、reviewedAt、version、competencyId、difficulty 欄位。現有單元對應可用，但無法逐題追溯出處與能力覆蓋；不表示每題答案有錯。 |
| P2 | 維護性 | 教材建置同時讀寫 study-materials.json，與 TS 來源形成雙重維護；global 載入次序由 HTML 維持。ESLint 排除 engine.js、validate.cjs 與大部分舊 CJS；`scripts/rebuild-clean.cjs` 335 行，且多個舊建置入口仍在。 |

匯入修正應同時做欄位白名單、型別／有限數值驗證與輸出編碼；一般文字優先使用 textContent，富 HTML 才需清理。此建議依據 [OWASP XSS 防護指南](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)。

新 SW 接管舊頁面的機制可參考 [Service Worker lifecycle](https://web.dev/articles/service-worker-lifecycle)；本報告未把該風險當成已重現的現場故障。

## 6. 優化建議

**立即處理**

1. 修補進度匯入，拒絕或正規化非預期欄位；成績頁與紀錄頁不得把匯入文字當 HTML。補無害標記、null results、非法數值及正常備份回歸案例。
2. 建立題目內容指紋與 canonical ID；保留舊 ID 對照，先決定替換重複題或合併策略，避免直接刪掉 60 筆而損壞舊存檔及 XP。
3. 加入 PR／部署驗證，順序為 npm ci → lint → build → test，全部通過後才上傳同次建置產物。現有測試依賴發布檔，故 build 應先於 test。
4. 更新策略延後至作答結束或使用者同意重新載入；加入兩版本、兩分頁、延後載入圖解與公式的真實瀏覽器測試。

**中期重構與產品改進**

- 建立「今日應複習」：依 dueAt 納入答對但已到期題目；錯題與薄弱能力優先，讓首頁建議可解釋。
- 圖鑑使用縮圖與 WebP／AVIF，保留原圖給放大閱讀；拆分教材資料，先量測再決定 chunk 粒度。大檔不應只依靠延遲執行改善安裝成本。
- 提供章節離線下載、完成／缺漏清單、容量資訊及可取消操作；圖片與互動頁是否已下載要分開計算。可用 [Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API) 估計容量，但不是保證可用空間。
- 加入分頁 revision 或作答鎖與衝突提示；先證明兩分頁競態，再選擇合併或單一作答頁策略。
- 宣告每份教材的唯一來源，建置只產生輸出，避免靜默覆寫另一份可編輯來源；標記舊工具用途，不刪除保存資料。
- 讓 engine 與資料驗證器也納入適當 lint；維護檔維持 300 行以內。僅文件更新不應觸發應用程式格式修正。
- 為受控教材 HTML／互動 URL 制定可接受來源；iframe 限制需先驗證縮放、匯出與下載能力，避免直接加 sandbox 破壞現有功能。

**長期架構**

- 建立能力點—教材—canonical 題目的覆蓋矩陣，附版本、審核狀態與勘誤紀錄；逐步以資料品質門檻取代單純題數門檻。
- 若模組依賴持續增加，再逐步改為 ES modules 並加入 JSDoc／checkJs；現況可沿用純靜態部署。
- 以完成一次「診斷 → 弱項閱讀 → 到期複習 → 模考」的成功率與作答可靠性衡量優化，而非只看頁面數或 XP。

## 7. 下一步任務建議

以下恰為五個可獨立交付的小任務；新增命令列為預定交付，尚未存在。

1. **修補備份匯入與成績輸出**
   - 目標：匯入資料只能形成合規狀態與文字。
   - 範圍：engine.restore、progress-store、兩個成績／紀錄 view 及相關測試。
   - 驗收：無害 HTML 不生成標記；null／非法 history 不拋錯或污染進度；正常匯入、模考、計分冪等仍正確。
   - 驗證：`npm run lint:fix && npm run lint && npm run build && npm test`。

2. **加入題庫重複檢查與遷移提案**
   - 目標：明確區分記錄數、不同題目數與舊 ID。
   - 範圍：新增唯讀指紋檢查器與 40 組對照表；本任務先不刪題。
   - 驗收：重現 476／416／60；列出重複 ID；提出 earnedCorrectIds、ledger、history、active 的遷移規則。
   - 驗證：預定 `node scripts/check-question-duplicates.mjs`；現有重複應明確回報為待處理，不冒稱已清零。

3. **建立 GitHub Actions 品質關卡**
   - 目標：每次部署使用已驗證的建置產物。
   - 範圍：workflow 與必要的命令說明。
   - 驗收：PR 執行 ci／lint／build／test；任一失敗阻止發布；deploy 只使用通過檢查的同次產物。
   - 驗證：`npm ci && npm run lint && npm run build && npm test`；另以 PR 與部署 workflow 執行紀錄確認關卡。

4. **新增兩版本 PWA 更新驗收**
   - 目標：先重現並限制舊頁被新 SW 接管的風險。
   - 範圍：瀏覽器測試工具與 A／B 版本靜態 fixture；必要時修正 SW／更新通知。
   - 驗收：兩分頁之一正在模考時更新不遺失答案；圖表／公式延後載入版本一致；已存與未存內容離線回應符合定義。
   - 驗證：預定 `npm run test:pwa`；報告需附實際瀏覽器版本、步驟及網路／快取證據。

5. **建立圖鑑縮圖試點與容量基準**
   - 目標：降低圖鑑預覽成本，保留原圖閱讀品質。
   - 範圍：先選一個單元，新增縮圖、尺寸資訊與預覽引用；不批次覆蓋原圖。
   - 驗收：原圖仍可放大；預覽檔小於原圖；390／1440 px 可讀且無新增溢出；報告列出前後實際請求 bytes。
   - 驗證：`npm run lint:fix && npm run lint && npm run build && npm test`，加上兩種寬度的實際瀏覽器量測。
