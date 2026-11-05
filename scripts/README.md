# 建置與維護入口

現行發布入口為根目錄 package.json；請使用 npm run build。

- build-materials.cjs：從 material-index.json 與教材 TS 來源建立教材資料；JSON 整合檔、按章檔與本機 fallback 均為輸出。
- question-explanations.cjs：合併 content/question-explanations.json 與 question-explanations/L*.json，覆蓋全部 416 道不同題（含 396 道模擬選擇題）。缺任何題、選項理由不完整或題目指紋改變皆停止建置。新增或修改解析後跑 npm run test:explanations；資料格式與修正記錄見 docs/QUESTION_EXPLANATIONS.md。
- prepare-exam-content.cjs / exam-analysis.cjs：依保存教材與試題對照索引建立逐題解析，共用完整原段落並保留公式。公告答案沿用來源；自動切分不等於人工答案審查。
- build-math.mjs：用站內 KaTeX 預先產生教材、逐題說明與共用補充的 HTML／MathML 公式，保留原始公式；一般閱讀只載入樣式與字型。
- build-question-local.mjs：將同章試題與共用補充附加至本機 HTML 的備援資料。HTTP 版共用按章 JSON，不另產生逐題檔案。
- build-diagrams.mjs：用 Chromium 與站內 Mermaid 產生教材 SVG；依來源與編譯器指紋重用已核對的產物，保留 Mermaid 文字來源。第一次建置需先執行 npx playwright install chromium。
- build-media.mjs：建立 WebP 預覽與索引，保留全部原圖。
- build-offline.mjs：建立逐章離線資產、大小與 SHA-256 清單。
- build-shell.mjs：依 content/shell-assets.json 的順序合併原始 JS／CSS，產生 app-bundle.js、shell-bundle.css 及入口引用；新增模組要更新該清單，不直接修改 bundle。
- build-precache.mjs：建立一致的外殼版本；SW 註記及 HTML 版本標記以固定占位字串參與雜湊。
- measure-performance.mjs：Chromium 390×844、4 倍 CPU 降速、4 Mbps／120 ms 的可重複量測；停用 HTTP cache 與 SW，區分文字出現、圖解完成、錯誤與作答回應。可用 --root、--output、--runs、--kbps 等參數指定前後版本與條件，這不是手機或公開站實測。
- compare-performance.mjs：對齊量測條件，彙整中位數、範圍與成功／失敗數；輸入優化前、優化後 JSON 及輸出路徑。圖解失敗不會被當成成功速度。
- check-question-duplicates.mjs：只接受已登錄的重複群組；新重複或別名變更必須重新檢視。
- check-content-governance.mjs：核對題目指紋、來源檔與教材連結；--report 更新單元覆蓋表。
- check-structure.mjs：維護程式與樣式最多 300 行；排除生成資料與來源保存專案。

其他舊 CJS 為遷移／診斷工具，不屬於現行建置。
其中 rebuild-clean.cjs、build-data.cjs、build_study_materials.cjs 等會重寫資料；保留供追溯，不應作為日常建置入口。
rebuild-clean.cjs 的單元常數拆至 legacy/units.cjs，行為未改變。
