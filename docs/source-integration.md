# 來源資料整合與圖解驗證

本次將 `C:\Users\benit\Desktop\iPAS智慧生產工程師` 的資料整合至 Factory Quest。
來源資料夾保留原狀；本專案原有的 476 題、12 單元及 28 篇講義繼續使用。

## 檔案覆蓋範圍

| 類型 | 檔案數 | 處理方式 |
| --- | ---: | --- |
| 已有相同內容 | 503 | 沿用本專案檔案，記錄 SHA-256 |
| 原先未納入 | 376 | 複製到對應位置或來源保存目錄 |
| 同名內容不同／原稿另存 | 12 | 保留本專案版本，另存來源版本 |
| 合計 | 891 | 每個檔案均有可核對的內容雜湊 |

完整逐檔去向為 `content/source-integration.json`，包含來源路徑、目標路徑、大小與 SHA-256。
原始整合保存 387 個檔案、57,001,738 bytes；深度優化另保存原稽核文件 6,982 bytes，現共 388 個保存版本、57,008,720 bytes。

| 來源 | 本專案位置 |
| --- | --- |
| `docs/` | `docs/`；不同版本另存 `content/source-project/docs/` |
| `public/assets/` | `dist/assets/` |
| `src/data/study-materials/` | `content/study-materials/`；不同版本另存來源目錄 |
| `src/data/quiz-banks/` | `content/raw-quiz-banks/` |
| `output/infographics/` | `dist/assets/infographics/` |
| 其餘 `src/`、腳本、設定、`.archify/`、`output/` | `content/source-project/` |

`.git` 歷史、`node_modules` 依賴及來源專案產生的 `dist` 不複製。
可重建所需的程式、鎖檔、設定和原始資產已保存；原專案的生成圖稿與驗證輸出也已納入。
來源程式保存供查閱，不會自動覆蓋 Factory Quest 的應用功能。
如需重建來源專案，應依 manifest 將各檔案還原到各自的來源相對路徑。

## 畫面問題與修正

1. 原渲染器將合法的帶引號連線標籤改寫成不帶引號的語法，
   使 M12103 的品質判定圖與 M11202 的管制圖選擇圖解析失敗。
   新共用渲染器保留原始語法，並序列化處理，避免切換講義時重複渲染。
2. 原講義匯入器以字串替換解碼，留下字面上的 `\r`，造成另外 21 張圖解析失敗。
   現在依來源模組的字串語法完整解碼，再統一行尾，亦保留數學公式與引號。
3. 圖表保留可讀尺寸，寬圖在自己的圖框內捲動，並提供放大閱讀與關閉操作。
   標籤在 Mermaid 量測階段套用換行規則，避免生成後任意擴大標籤。
4. 講義首頁圖改用 contain，避免裁掉教材圖片；補上窄版閱讀欄、
   表格捲動、導覽列收縮與頁底按鈕換行規則。
5. 下載頁補列原有但未展示的兩份歷史版本簡章，合計 9 份 PDF。
6. 新增圖解 JS/CSS 的 Service Worker 核心快取項，快取版本更新為 v11。

## 維護與檢查

```sh
npm ci
npm run build
npm run lint:fix
npm run lint
npm test
```

- `build` 從本專案的 content 檔案重建講義與 data.js，不依賴外部來源資料夾。
- `tests/integration.mjs` 核對全部 891 個來源檔案雜湊及 58 個教材連結資產。
- `tests/diagrams.mjs` 用站內實際附帶的 Mermaid 解析全部 60 張圖，
  另用 DOM 測試檢查渲染排程、圖框、放大／還原與失敗訊息。
- `tests/routes.mjs` 執行全部 28 個講義路由、前後篇切換、圖鑑、辭典、公式、避坑及 9 份 PDF 入口。
- `tests/validate.cjs` 驗證 476 題、12 個任務、兩科模擬考與存檔／計分機制。

本次 computer-use 因無法可靠辨識 Chrome 網址而停止，未完成實際瀏覽器畫面驗證。
DOM 測試不具備文字／SVG 排版能力，dialog 測試採用原生開關行為的模擬。
因此桌面／手機的圖中文字截切、放大視窗實際操作，以及 Service Worker 的
離線回載與未造訪單元行為，仍需實際瀏覽器驗證。


2026-11-04 深度優化已補上 Chromium／WebKit 瀏覽器驗證；上述「未完成」是來源整合當時的歷史紀錄。最新範圍與限制見 [深度優化紀錄](OPTIMIZATION.md)。
