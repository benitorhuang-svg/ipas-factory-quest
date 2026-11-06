# Factory Quest 發布前專案審查

## 1. 專案基本資訊

- 初審：2026-11-05；CI 修復追蹤：2026-11-06。範圍：main 上相對正式版本 12f5f40 的全部產品修改；scratch 臨時檔不屬網站發布內容，後依使用者「push all」要求收錄版本庫供追溯。
- 實際入口是 dist/index.html；content/source-project/ 是保存來源。先前 2026-11-04 稽核另存 [歷史快照](PROJECT_AUDIT_2026-11-04.md)。
- 純靜態 HTML／CSS／Vanilla JS PWA，使用 LocalStorage、Service Worker、本機 Mermaid／KaTeX。Node >=22.13.0、npm、ESLint、jsdom、Playwright、sharp。
- 啟動：python -m http.server 8000 --directory dist。建置：npm run build；檢查：npm run lint、npm test、npm run test:browser、npm audit。
- 本輪已執行差異與資料流審查、依賴稽核、修正後 lint／build、完整 npm test 與瀏覽器測試；測試結果為 53 通過、5 個能力限制跳過、0 失敗。

## 2. 專案目錄結構

```text
.github/workflows/             先驗證、再發布 GitHub Pages
content/
  questions-subject*.json      476 筆題目，416 道不同內容
  question-explanations*       全部 416 題解析與內容指紋
  question-legacy.json         上一正式版本題庫快照
  question-reviews.json        逐題來源與獨立審核狀態
  official-questions.json      200 題公告試題解析的建置輸出
  study-materials/             28 篇教材的維護來源
  source-project/              891 份來源保存紀錄對應檔案
scripts/                       教材、公式、圖解、外殼與預快取建置
tests/                        資料、作答、遷移、瀏覽器與原生 PWA 驗證
docs/                         審查、解析覆蓋與教材說明
package.json                   唯一日常建置及測試入口
```

## 3. 核心功能推測

由程式與本輪執行可確認：12 單元任務、快練、錯題與到期複習、兩科 50 題／75 分鐘模擬、標準與高難抽題、XP／徽章、進度備份與匯入、28 篇教材與圖鑑、200 題公告試題查詢、章節離線及安全更新。這些是網站能力，不代表正式試題或人工審題已全覆蓋。

模擬題池 396 道選擇題全部有正解思路、逐選項理由與檢核；20 道數值題另有計算及誤算解析。60 筆共用內容的來源 ID 保留，不重複抽題或重複給同內容首次答對 XP。

## 4. 架構分析

- content/shell-assets.json 管理 33 個腳本及 16 份樣式來源，建置合併為 2 個腳本請求與 1 個樣式請求；不是直接修改 bundle。
- 教材 TS → build-materials → 按章 JSON；公告解析與補充按章共用。固定來源摘錄須通過原文核對。HTTP／file URL 使用相同已驗證章節內容，失敗不覆蓋有效資料。
- question-explanations.cjs 核對全部題目存在、各選項理由及題目指紋，再併入 data.js。缺題或過期解析阻止建置。
- engine.js 處理抽題、計分與存檔白名單；session.js 處理作答生命週期；persistence.js 提供 Web Locks、衝突通知與延遲保存。
- 每份作答與歷史報告記錄 questionRevision。無版本的既有資料沿用正式版 12f5f40 的題目快照；舊索引不會套到新選項。新任務使用新題庫與固定種子的選項洗牌。
- 外部邊界是進度 JSON、受控教材 HTML、同源互動資產與快取；匯入欄位驗證、文字 escape、查詢狀態白名單與請求生命週期均納入檢查。
- PWA 分離不可變外殼與內容快取、以內容雜湊命名版本、等待舊分頁結束才接管；章節資產下載可取消、續傳及驗證雜湊。

## 5. 目前風險

| 優先 | 發現與證據 | 本輪處理／實際限制 |
| --- | --- | --- |
| P1，已修 | 高難模式先合併優先題與普通題再全體洗牌。合成題庫有足夠高難題時，舊碼仍抽到 24 道普通題。 | engine.select 改成依計算、高難、情境、一般題分層補足。新增 600 次真題抽題及合成候選池回歸，核對配額、排除對與不足時補題。 |
| P1，已修 | 437 筆選擇題的文字或順序相對正式版變動；舊答案以數字索引儲存，原本直接用新題重算會誤判。 | 保存 476 筆原題快照，逐份作答辨認版本。原題、原選項、原答案、歷史分數及未交卷作答沿用原卷。全 476 題逐題測遷移、重載與計分。 |
| P2，已修 | 補抽 0 題仍洗牌及走訪所有候選；最後截斷保住配比，但產生無效抽樣及亂數消耗。 | pickSafe 在 count <= 0 時立即返回；配比回歸保持通過。 |
| P2，內容覆核 | 三道內容修正已登記 pending，其他既有審核標記不代表本輪新增獨立人工審核。 | MRP 核心輸入答案、待驗庫存選項、ISA-95 Level 0／1 用語已修正並保留題號。仍需獨立專業覆核，不以程式測試宣稱人工審查完成。 |
| P2，實機範圍 | 自動測試涵蓋 Chromium／WebKit、模擬網路及 Chromium 原生 SW，不等於所有手機安裝與儲存配額情境。 | 保留明確的能力跳過項；不把桌面測試外推為實機保證。 |

本輪依賴稽核為 0 個已知漏洞。來源保存檔不做格式化。scratch 歷史實驗資料依補充要求收錄版本庫，但不參與正式建置或網站發布；其密鑰模式掃描無命中。發布前另檢查暫存檔、密鑰模式及 staged 來源雜湊。

## 6. 優化建議

2026-11-06 追查 a4bb18c 的 CI 執行 42053984705：52 通過、5 跳過，唯一失敗為 Chromium 教材段落跳轉後位置偏移。定位到 reading-position.jump 只捲動一次、隨即清除目標；前方 content-visibility 區段完成排版後，ResizeObserver 已無可恢復的目標。另發現任何非使用者捲動事件也會誤取消既有定位。

修正為保留指定段落與 CSS 捲動邊界，在版面改變時重新定位，僅在 wheel／touch／pointer／keyboard 等使用者輸入時解除。捲動座標向上取整，避免 WebKit 小數座標量化使段落仍落在判讀邊界之外。回歸測試在跳轉後於前方加入 900px 內容並關閉原生 scroll anchoring，修正前可重現偏移；保留原本 0–180px 的斷言，未增加重試或放寬門檻。兩瀏覽器各重複 3 次通過。

本機修復驗證：lint 零警告、完整 Node 測試通過；最終閱讀定位單元測試、圖解／公式／外殼一致性及 300 行結構檢查通過；相關瀏覽器流程 33 通過、1 個 WebKit CDP 能力限制跳過。GitHub Ubuntu 的最終結果以修復提交對應的 CI 與部署紀錄為準。

本輪阻擋發布的抽題與舊進度解讀問題已修正；不引入框架遷移。中期維護應持續保留題庫版本、逐題解析缺漏阻擋、按章資料共用及原始來源證據。題庫快照增加外殼原始大小，是保留既有作答的明確取捨；若將來拆成按需載入，須先維持首次離線開啟舊報告的能力。

目前驗證證據：lint 零警告、build 成功、完整 npm test 通過、npm audit 0 個已知漏洞；完整 Chromium／WebKit 測試 53 通過、5 跳過、0 失敗。跳過項為 WebKit 不提供此測試所需的 CDP 節流與原生 SW 測試能力；相應原生離線、更新及節流案例已在 Chromium 通過。來源 891 份 SHA-256 一致，待提交檔案密鑰模式掃描無命中。

## 7. 下一步任務建議

1. 三道內容獨立覆核：範圍限 question-reviews 中 pending 題；驗收須有真實審核者、日期及依據；驗證 node scripts/check-content-governance.mjs。
2. 補充發布版題庫快照流程：範圍限題庫改版與版本文件；驗收能辨認舊／新作答且不重複遷移；驗證 node tests/question-versions.mjs。
3. 持續防守高難抽題：範圍限候選優先與配額；驗收保持 50 題、兩科配額及互斥題限制；驗證 node tests/exam-selection.mjs。
4. 真實手機離線抽查：範圍限選定 iOS／Android 裝置；驗收安裝後重開、離線作答與舊報告內容一致；記錄裝置及步驟，不能以自動測試替代。
5. 分版本追蹤外殼成本：範圍限實際發出的 data.js／bundle；驗收同條件量測首次及重訪位元組與讀取時間，且不破壞舊卷離線；驗證 npm run measure:performance。
