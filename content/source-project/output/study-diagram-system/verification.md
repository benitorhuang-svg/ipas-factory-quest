# 教材圖解優化驗證

日期：2026-10-27

- 教材來源：60 張，原始 Mermaid 雜湊全部一致，未修改圖表來源。
- 卡片／泳道流程圖：56 張，352 個節點與 315 組關係，與 Mermaid 原生解析結果一致；核對條件文字、虛線及雙向關係。
- 特殊圖型：3 張時序圖、1 張狀態圖，保留 Mermaid 原生呈現。
- 容器寬度：390、900、1100、1440 像素；60 張均可生成，流程圖沒有文字溢出、缺少路徑或箭頭穿越其他卡片／分組標題。
- SVG 配色：105 個文字元素在亮、暗模式均套用正確文字色，另目視檢查角色、訊息、條件標籤。
- 閱讀操作：125% 放大、重設、文字導讀、展開、Escape 回位，以及展開中返回上一單元均通過。
- `npm run check:study-diagrams`：分支、分組、循環、由下至上排列與 132 組避障路徑通過。
- `npm run typecheck`、`npm run check:unit-summaries`、`npm run build` 通過。
- 正式建置：122 個預快取項目；23 個互動總結與導讀的版本檢查通過。仍有既有的大型 bundle 提示。

## 快取回載

使用最終正式建置，於 `http://127.0.0.1:4189` 預熱 PWA 後，停止預覽伺服器，並由獨立 HTTP 請求確認該來源無法連線。

接著在瀏覽器重新載入 M12202，並首次開啟及重新載入 M13101、M11101。三者皆從 PWA 快取正常顯示；涵蓋時序圖、狀態圖、一般流程、決策、分組及泳道圖。M11101 顯示 34 個節點、27 組關係，沒有未轉換的來源區塊或路徑錯誤。

此測試證明應用程式來源無法連線時的快取回載；沒有停用瀏覽器的全部外部網路。

## 證據

- `source-inventory.json`、`parsed-graphs.json`：基準來源與原生解析。
- `source-preservation.json`：來源雜湊核對。
- `browser-verification.json`：四種寬度及閱讀操作紀錄。
- `svg-theme-verification.json`：亮暗文字配色。
- `offline-verification.json`：最終正式版的三單元回載結果。
- `decision-light.jpg`、`decision-dark-offline.jpg`：新版決策圖。
- `sequence-dark-offline.jpg`、`state-dark-offline.jpg`：特殊圖型的深色畫面。

測試預覽伺服器與測試分頁已關閉。開發中的 `localhost:5173` 保留。
