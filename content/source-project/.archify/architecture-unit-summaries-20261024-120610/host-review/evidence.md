# Archify 單元總結頁首位置驗證

日期：2026-10-24

## 已確認

- 開發版逐一開啟 23 個 M-code 單元：互動總結區塊皆位於標題卡後、核心學習重點與「重點知識解析與圖表」之前；章節目錄第一項皆為「單元總結・互動關聯圖」。
- M12101 的單元總結與原 ISA-95 互動圖都能載入。
- 正式建置預覽 `http://127.0.0.1:57833/#/topic/M13201`：390px 與 1440px 視窗均顯示頁首總結圖；390px 頁面寬度沒有超出視窗。點選圖中節點可開啟資訊面板。
- `npm.cmd run typecheck`、`npm.cmd run check:unit-summaries`、`npm.cmd run build` 及本次修改檔案的 `git diff --check` 均通過。建置產生 99 個離線快取項目；Vite 仍提示既有大型 JavaScript chunks 超過 500 kB。
- 原 4173/4174 預覽網址的瀏覽器分別由舊版 Service Worker 快取控制；本次正式版畫面改用全新來源埠 57833 核對。
- 教材頁加入圖表外側的縮小、放大與重設全圖控制。M13201 在 390px 與 1440px 畫面都由 100% 放大至 125%，節點文字的畫面寬度約增加 25%；重設可回到 100%，頁面寬度沒有超出視窗。

## 畫面

- `lesson-mobile-top-production.jpg`：390 × 844，教材頁首與嵌入互動圖。
- `lesson-desktop-top-production.jpg`：1440 × 900，教材頁首、互動圖與右側章節目錄。
- `lesson-mobile-zoom-controls.jpg`：390 × 844，手機版縮放控制與 125% 圖表。
- `lesson-desktop-zoom-controls.jpg`：1440 × 900，桌面版縮放控制與 125% 圖表。
