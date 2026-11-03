# 教材圖解設計與維護

教材 Markdown 中的 Mermaid 是節點、文字、條件與連線的來源。圖表呈現方式由共用閱讀器決定；請勿為了排版修改知識關係，或在生成後的 SVG 補入術語文字。

## 呈現方式

- 一般流程：依步驟排序，桌面每列最多三張卡片。
- 分支決策：保留全部條件，條件顯示於目的卡片，判斷卡使用琥珀色。
- 分組關係：保留原始分組名稱；組內依可用寬度排列，避免狹窄卡片。
- 生產規劃層級：保留已確認的七節點、三泳道配置，以及產能雙向回饋。
- 時序與狀態圖：由 Mermaid 原生渲染，使用相同閱讀工具與亮暗配色。
- 自訂形狀、互動節點、重疊或巢狀分組、自我迴圈：保留 Mermaid 原生渲染。

節點的中文名稱、英文名稱、縮寫及補充文字分層顯示。換行取決於卡片的可用寬度，不使用固定字數插入斷行。

## 閱讀操作

每張圖提供 75%～200% 縮放、重設及展開閱讀。展開後按 Escape 或「收合」回到原位置；切換單元時關閉閱讀框。卡片圖另有文字導讀，列出原始節點及所有關係。

圖中連線依實際卡片位置避開節點與分組標題，隨尺寸與縮放重新計算。虛線、雙向箭頭與循環關係保留；循環只影響排版及走線，不移除資料。

## 實作入口

- `src/utils/mermaid-loader.ts`：序列化 Mermaid 解析工作並選擇呈現方式。
- `src/utils/study-graph-model.ts`：透過 Mermaid 原生解析器讀取圖意。
- `src/utils/study-graph-layout.ts`、`study-graph-router.ts`：分組、階層與正交避障走線。
- `src/components/StudyGraph.ts`、`StudyGraphConnections.ts`：卡片與 SVG 連線。
- `src/components/StudyDiagramFrame.ts`：共用閱讀工具、對話框與文字導讀。
- `src/components/ProductionPlanningDiagram.ts`：生產規劃泳道的專用呈現。
- `src/styles/study-diagrams.css`、`src/utils/mermaid-theme.ts`：亮暗配色、字級與原生 SVG 主題。

來源與圖表外框都必須保留 `data-no-terminology="true"`，避免後續術語展開改動已量測的文字。

## 驗證

```sh
npm run check:study-diagrams
npm run typecheck
npm run check:unit-summaries
npm run build
```

`check:study-diagrams` 檢查中英標籤、分支、循環、由下至上的排列，以及 132 組卡片避障路徑。正式建置另外驗證互動總結的快取版本。

這些檢查不取代畫面檢查。調整呈現方式後，需檢查亮暗模式、窄版與桌面、縮放及展開閱讀，並核對節點、條件、連線方向和虛線是否與 Mermaid 來源一致。涉及快取時，另用正式建置檢查回載及未造訪單元。

本次全庫驗證紀錄位於 `output/study-diagram-system/`：60 份來源、56 張流程圖的 352 個節點與 315 組關係，以及 390／900／1100／1440 像素畫面檢查。`source-preservation.json` 記錄原始圖表雜湊核對結果；`browser-verification.json` 記錄瀏覽器的節點、連線、避障及溢出檢查。
