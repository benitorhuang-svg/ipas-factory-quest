# 建置與維護入口

現行發布入口為根目錄 package.json；請使用 npm run build。

- build-materials.cjs：從 material-index.json 與教材 TS 來源建立教材資料；JSON 整合檔、按章檔與本機 fallback 均為輸出。
- build-media.mjs：建立 WebP 預覽與索引，保留全部原圖。
- build-offline.mjs：建立逐章離線資產、大小與 SHA-256 清單。
- build-precache.mjs：建立一致的外殼版本；SW 註記及 HTML 版本標記以固定占位字串參與雜湊。
- check-question-duplicates.mjs：只接受已登錄的重複群組；新重複或別名變更必須重新檢視。
- check-content-governance.mjs：核對題目指紋、來源檔與教材連結；--report 更新單元覆蓋表。
- check-structure.mjs：維護程式與樣式最多 300 行；排除生成資料與來源保存專案。

其他舊 CJS 為遷移／診斷工具，不屬於現行建置。
其中 rebuild-clean.cjs、build-data.cjs、build_study_materials.cjs 等會重寫資料；保留供追溯，不應作為日常建置入口。
rebuild-clean.cjs 的單元常數拆至 legacy/units.cjs，行為未改變。
