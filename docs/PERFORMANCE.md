# 網頁效能優化與量測

日期：2026-11-05。範圍為當前工作目錄的 `dist/` 執行網站；未推送或部署。
保留進場時已有的介面、到期換題與其他修改，沒有重設題庫或使用者進度格式。

## 實作

| 瓶頸 | 修改 | 保留的行為 |
| --- | --- | --- |
| 首頁載入 30 支腳本及 14 份樣式 | 按原執行／cascade 順序合併為 2 支腳本及 1 份樣式；移除首頁資料中未被使用的兩份 Markdown 副本 | 原模組繼續分開維護，支援 `file://` |
| 首次閱讀下載 5,575,485 bytes 的 Mermaid 並執行整章排版；15 秒 timeout 在降速條件下造成圖解失敗 | 建置時產生 60 張 SVG，教材保留原 Mermaid 來源；按章取得小型 SVG，重訪共用已載入的結果 | 放大閱讀、唯一 SVG ID／箭頭引用、載入失敗時 Mermaid 備援、本機檔案模式 |
| 公式需下載 KaTeX JS 並在裝置端逐一轉換 | 用原站內 KaTeX 在建置時產生 610 個 HTML／MathML 公式，保留原公式；一般閱讀只需樣式與字型 | 可存取的 MathML、站內資源與原始公式備援 |
| 講義內的圖片仍載入數 MB 原圖 | 使用既有 WebP 預覽與尺寸，原生按鈕開啟原圖 | 原圖內容、替代文字、鍵盤操作及關閉焦點還原 |
| 長講義初次排版阻塞主執行緒 | 按閱讀段落包裝內容，使用 `content-visibility: auto` 與估算尺寸；段落錨點放在略過排版的區塊外 | 全部文字與段落仍在 DOM，可跳轉、閱讀接續 |
| 段落跳轉後仍標示上一節 | 目前段落的判斷納入根元素 scroll padding 與標題 scroll margin | 段落定位與同分頁還原，不改既有位置存檔格式 |
| 預快取含未被現代瀏覽器採用的字型備援格式 | 預快取 WOFF2，保留 WOFF／TTF 及 JS 引擎檔案供線上備援 | Chromium／WebKit 的公式離線閱讀；所有 63 份 vendor 檔案及授權雜湊保留 |

原始 TS 教材、來源保存專案、原圖、476 筆題庫及 416 種內容的進度／去重規則保留。891 個來源收據的 SHA-256 檢查通過。

## 量測方法

使用 Chromium、390×844 CSS viewport、4 倍 CPU 降速、4 Mbps 下載及 120 ms 延遲；每版三個全新 browser context。
本機 HTTP 不啟用壓縮，HTTP cache 停用，Service Worker 阻擋，以排除不同離線安裝狀態對核心比較的影響。
原生離線及更新另由瀏覽器測試驗證。

流程為首頁 → 圖鑑 → M11101 → 首頁 → 再讀 M11101 → 單元 → 開始闖關 → 選一個答案。
「文字就緒」為可見的頁面主內容加兩次 animation frame；「圖解就緒」為五個 SVG 已插入加兩次 animation frame。
畫面外的段落按需排版，不強迫全章畫面外內容先繪製。
作答回應包含測試驅動與動畫幀成本，不能作為現場 INP。

重訪的 HTML／SVG 應用層記憶體快取保留，兩版條件一致；沒有使用 HTTP cache 或 SW 快取來掩蓋下載。
首次圖解若失敗，記為失敗，不將錯誤頁出現時間當成功速度。
資源 bytes 僅計已完成的 Resource Timing 項目，不包含失敗／未完成的 Mermaid 請求，不能當完整傳輸流量。

原始資料：[優化前](evidence/performance-2026-11-05-before.json)、[優化後](evidence/performance-2026-11-05-after.json)。
彙總資料：[前後比較](evidence/performance-2026-11-05-comparison.json)。

### 三次量測中位數

| 項目 | 優化前 | 優化後 |
| --- | ---: | ---: |
| 首頁就緒 | 3.024 秒 | 2.680 秒 |
| 圖鑑文字就緒 | 0.611 秒 | 0.585 秒 |
| 首次講義正文就緒 | 3.860 秒 | 1.744 秒 |
| 首次五張圖解 | 0/3 成功，三次皆 timeout | 3/3 成功，2.325 秒 |
| 返回同章五張圖解 | 9.568 秒 | 0.248 秒 |
| 首次講義最大長工作 | 3.274 秒 | 1.040 秒 |
| 開始單元闖關 | 0.831 秒 | 0.950 秒 |
| 作答回應 | 0.331 秒 | 0.329 秒 |
| HTML 引用的外殼 JS／CSS 請求 | 44 | 3 |
| 外殼預快取資產數 | 138 | 56 |
| 預快取原始檔 bytes | 2,627,468 | 2,487,063 |

這組樣本中，正文就緒約縮短 55%，返回同章含圖解約縮短 97%；首頁約縮短 11%。
圖鑑與作答回應差異小，不宣稱顯著改善。開始闖關的樣本較慢約 0.12 秒，該段含測試驅動自動等待與未固定的隨機抽題，不能據此宣稱該路徑提升或將差異歸因於應用效能；原始數據完整保留。
這些為單機短樣本，背景負載存在波動；不推論實際使用者分位數。

## 驗證範圍

最終結果：lint／build／完整 Node 檢查通過；瀏覽器 22 項成功、4 項明確略過、0 失敗、0 flaky。
完整收據見 [驗證摘要](evidence/performance-2026-11-05-validation.json)。

- `npm run lint:fix`、`npm run lint`：維護來源零警告。
- `npm run build`：按章教材、公式、SVG、預覽、離線清單、外殼 bundle 與快取版本；相同輸入重建版本不變，SVG 可重用。
- `npm test`：來源收據、題庫／計分、舊進度、到期複習、60 張來源圖語法、610 個原公式、靜態 SVG 雜湊及實際箭頭引用、按章離線清單與 bundle 新鮮度。
- 真實瀏覽器：Chromium／WebKit 的 390／1440 設定視窗、`file://`、教材／圖解／原圖、SVG 失敗備援、段落跳轉與閱讀恢復、匯入防護、多分頁、到期換題與草稿。
- Chromium 原生 PWA：章節下載、損壞重取、取消／續傳、未儲存內容、離線閱讀及 A/B 更新等待／草稿保存；另有 1.6 Mbps／120 ms／4 倍 CPU 的慢網路案例。
- WebKit 明確略過三項原生 SW 案例及一項 CDP 降速案例，不將其他瀏覽器證據推算為已測。

新增網路失敗測試時阻擋 SW，確保測試攔截的是瀏覽器實際發出的資產請求；原生 SW 的情境另外保留完整測試。
截圖驗收使用停用動畫的穩定畫面，並檢視教材及圖解；這不等於全部 60 張圖都已完成各裝置人工校對。

## 維護方式

新增外殼 JS／CSS 到 `content/shell-assets.json`，維持實作檔案各不超過 300 行；`app-bundle.js`、`shell-bundle.css`、按章輸出及 SVG 為生成檔，不直接編輯。

首次環境安裝：

```sh
npm ci
npx playwright install chromium webkit
npm run build
npm run lint
npm test
npm run test:browser
```

重新量測目前版本：

```sh
npm run measure:performance -- --output docs/evidence/performance-current.json --runs 3
node scripts/compare-performance.mjs before.json after.json comparison.json
```

可用 `--root` 指向保存的舊發布目錄；`--kbps`、`--latency`、`--cpu` 設定條件。
`--profile` 另外輸出首次章節的 Chromium CPU profile 供診斷；正式前後比較不啟用 profiler。
瀏覽器測試會清理 `test-results/`，需要保留的量測證據應輸出到 `docs/evidence/` 或其他獨立位置。

## 證據限制

這是本機、無壓縮 HTTP、固定路徑、三個樣本的比較；不是公開 GitHub Pages／CDN、實體手機、Lighthouse 分數或實際使用者 p95。
未驗證手機作業系統安裝／背景回收；字型跨平台與全部章節的視覺精校亦未全覆蓋。
人工答案、難度與細項官方能力點審核沿用原狀態，不因效能測試通過而視為完成。

## 技術依據

- [KaTeX renderToString](https://katex.org/docs/api.html)：在建置時產生公式 HTML／MathML。
- [content-visibility](https://web.dev/articles/content-visibility)：略過畫面外內容的排版；避免讀取被略過子樹的幾何而強制展開。
- [Rendering performance](https://web.dev/articles/rendering-performance)：同時檢查頁面載入與操作期間的繪製成本。
- [Playwright CDPSession](https://playwright.dev/docs/api/class-cdpsession)：隔離量測的降速與 CPU profile。
- [Playwright：Service Worker 與網路攔截](https://playwright.dev/docs/network#missing-network-events-and-service-workers)：區分資產失敗攔截與原生 SW 測試。
