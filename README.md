# ReserveMap

ReserveMap 是部署於 GitHub Pages 的唯讀旅遊收藏地圖。網站以 React、TypeScript、Vite 與 Google Maps JavaScript API 建置；正式資料由 repository 內的兩份 JSON 提供。

## 本機啟動

需求：Node.js 22、npm。

```bash
npm install
cp .env.example .env.local
npm run dev
```

在 `.env.local` 填入：

```text
VITE_GOOGLE_MAPS_API_KEY=你的金鑰
VITE_GOOGLE_MAP_ID=你的Map ID
```

未設定 API Key 時，網站仍可操作地區選擇、分類篩選、搜尋及地點清單，地圖區會顯示獨立的設定提示。

## 常用檢查

```bash
npm run validate:data  # JSON Schema 與跨檔案資料規則
npm run typecheck      # TypeScript
npm run test           # 單元測試
npm run build          # 資料驗證與 production build
npm run check          # 執行全部檢查
```

正式資料位於：

```text
data/definitions.json
data/places.json
```

Agent 新增、修改、整理或刪除資料前，必須遵循 `AGENTS.md`。

## GitHub Pages

推送至遠端 `main` 後，`deploy-pages.yml` 會先驗證資料、執行測試與建置，再發布 `dist`。在 repository 設定中需要：

1. 將 Pages 的 Source 設為 **GitHub Actions**。
2. 建立 Actions secrets：`VITE_GOOGLE_MAPS_API_KEY`、`VITE_GOOGLE_MAP_ID`。
3. 在 Google Cloud Console 將 API Key 限制為正式 Pages 網域與必要的本機來源，且只開放 Maps JavaScript API。

Workflow 會自動處理一般 project site 的 repository 子路徑，以及名稱以 `.github.io` 結尾的根網址 repository。
