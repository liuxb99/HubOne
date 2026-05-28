# OPC 專案全面審計報告

> **審計日期**: 2025-07-17  
> **專案版本**: 0.1.0  
> **審計範圍**: 全部 6 條業務線 · 13 個 UI 元件 · 10 款遊戲 · 10 個 API 路由

---

## 一、各維度評分

```
               架構正確性 (8/10)
                  ▲
                 / \
    完整性       /   \      程式碼品質
    (5/10) ◄---/     \---► (8/10)
           /               \
          /                 \
         /                   \
  可維護性                   UX/UI 品質
  (6/10)                     (7/10)
         \                   /
          \                 /
           \               /
   性能    ◄---\       /---► 遊戲可玩性
   (7/10)      \     /      (7/10)
                 ▼
              完整性修正後
              (缺少大量實際業務邏輯)
```

| # | 維度 | 評分 | 說明 |
|---|------|------|------|
| 1 | **架構正確性** | 8/10 | 目錄分割合理，UI 元件抽象良好，各業務線採用一致佈局模式 |
| 2 | **程式碼品質** | 8/10 | 型別安全（strict mode）、命名一致、JSDoc 完整、DRY 掌握良好 |
| 3 | **UX/UI 品質** | 7/10 | 主題系統完整、載入骨架頁存在、但缺少實際互動反饋 |
| 4 | **遊戲可玩性** | 7/10 | 10 款遊戲均可運行，但缺乏儲存/排行榜整合、觸控支援 |
| 5 | **性能** | 7/10 | Next.js App Router + dynamic import + 骨架頁，但 Google Font 阻塞渲染 |
| 6 | **可維護性** | 6/10 | 模組化尚可，但大量 Mock 數據與業務邏輯空缺導致理解成本高 |
| 7 | **完整性** | 5/10 | 六大業務線僅有 UI 骨架，實際功能完成度約 20% |

---

## 二、前 10 項高優先級問題

### P0 — 致命問題

#### 1. NextAuth 僅為 stub，認證流程中斷

- **檔案**: `src/app/api/auth/[...nextauth]/route.ts` (全檔)
- **問題**: GET/POST 均回傳 501 `"NextAuth 尚未配置"`，登入/註冊頁面的表單 submit 僅有 `e.preventDefault()` 無實際邏輯
- **影響**: 所有需要用戶身份的 API（遊戲排行榜、商品刊登、訂單）無法驗證用戶；前端硬編碼 `user-current` / `user-seller` 等假資料
- **建議**: 
  1. 完成 NextAuth 設定（Credentials Provider + JWT）
  2. 實作 `[...nextauth]/route.ts` 的 authorize 邏輯
  3. 登入頁面接入實際 API 呼叫
  4. 為每一個受保護的 API 加上 `getServerSession` 檢查

#### 2. 六大業務線均無實際業務邏輯，僅為佔位頁面

- **檔案**: `src/app/quant/page.tsx` · `src/app/civil/page.tsx` · `src/app/marketplace/page.tsx` · `src/app/ai-tools/page.tsx` · `src/app/ppt/page.tsx` · `src/app/games/page.tsx`
- **問題**: 所有業務線頁面均顯示「開發中」標記、Mock 數據或空狀態。量化行情使用 `Math.random()` 偽造價格、AI 工具無真正 LLM 串接、PPT 編輯器無拖放功能
- **影響**: 專案無法對外發布，僅為原型展示
- **建議**: 選擇 1-2 條業務線優先 MVP 實作（建議遊戲 + 量化），其餘標示「即將推出」

#### 3. `GameScore` 排行榜查詢策略錯誤

- **檔案**: `src/app/api/games/scores/route.ts:72-82`
- **問題**: 先 `findMany` 查詢所有分數（含重複用戶），再在記憶體中用 `seenUsers` 過濾。這可能回傳比 `limit` 少的結果，且當資料量大時性能差
- **影響**: 排行榜結果不正確（有效條目少於預期），且無法正確分頁（`total` 基於原始查詢）
- **建議**: 改用 Prisma 原生聚合查詢或 raw SQL：
  ```sql
  SELECT gs.*, u.name, u.avatar
  FROM "GameScore" gs
  JOIN "User" u ON u.id = gs."userId"
  WHERE gs.game = 'tetris'
  AND gs.score = (SELECT MAX(score) FROM "GameScore" WHERE "userId" = gs."userId" AND game = 'tetris')
  ORDER BY gs.score DESC
  LIMIT 10;
  ```

### P1 — 高嚴重性

#### 4. Prisma 生成引擎包含 Windows DLL，跨平台建置中斷

- **檔案**: `src/generated/prisma/query_engine-windows.dll.node` (二進位檔)
- **問題**: 將特定平台的 Prisma query engine binary 提交至版本庫。若在 macOS/Linux 上 `postinstall` 會嘗試重新生成，但舊檔案會造成混淆
- **影響**: CI/CD 在非 Windows 環境可能失敗，違反 12-factor 原則
- **建議**: 
  1. 將 `src/generated/prisma/` 加入 `.gitignore`
  2. 在 `postinstall` 中自動 `prisma generate`
  3. 改用 `prisma-client` generator 輸出至 `node_modules/.prisma`（預設路徑）

#### 5. Google Fonts 阻塞初次渲染

- **檔案**: `src/app/layout.tsx:17-18`
- **問題**: 使用 `<link>` 載入 Google Fonts（Inter、Noto Sans TC、JetBrains Mono），未使用 `next/font` 或 `display=swap` 參數
- **影響**: 字體載入期間頁面文字不可見（FOUT），LCP 指標受損
- **建議**:
  ```tsx
  // 改用 next/font
  import { Inter, Noto_Sans_TC, JetBrains_Mono } from "next/font/google";
  const inter = Inter({ subsets: ["latin"], display: "swap" });
  ```

#### 6. API 路由全面缺乏身分驗證與授權

- **檔案**: `src/app/api/marketplace/items/route.ts` · `src/app/api/marketplace/orders/route.ts` · `src/app/api/quant/strategy/route.ts` · 等
- **問題**: 所有 POST/PUT/DELETE 端點均未檢查用戶身份。`/api/civil/calculate` 和 `/api/ai-tools/generate` 為無狀態計算（尚可接受），但 `/api/marketplace/orders` 任何人都可以建立訂單
- **影響**: 上線後可能被濫用
- **建議**: 建立一個共用的 `withAuth` 包裝器（類似 middleware），在所有 POST/PUT/DELETE 路由加上 `getServerSession` 檢查

### P2 — 中嚴重性

#### 7. `src/types/index.ts` 與 `src/lib/constants.ts` 重複定義 BusinessId

- **檔案**: `src/types/index.ts:5` 與 `src/lib/constants.ts:1`（re-export）
- **問題**: `BusinessId` 在 `types/index.ts` 定義為 type，`constants.ts` 以 `export type { BusinessId }`  re-export。但 `Navbar.tsx` 從 `constants.ts` 匯入（`import type { BusinessId } from "@/lib/constants"`），造成混淆
- **問題**: 不一致的 import 路徑 — 部分檔案從 `@/types` 匯入，部分從 `@/lib/constants` 匯入
- **影響**: 未來若 type 定義不同步會導致型別錯誤
- **建議**: 統一從 `@/types` 匯入，`constants.ts` 不再 re-export type

#### 8. `data-theme` 覆蓋造成深色主題不一致

- **檔案**: `src/app/quant/layout.tsx` · `src/app/ai-tools/layout.tsx` · `src/app/ppt/layout.tsx` · `src/app/games/layout.tsx`
- **問題**: 量化/AI/PPT/遊戲的 layout 硬編碼了 `className="min-h-full bg-zinc-950 text-zinc-100"` 之類的背景色和文字色，與 `data-theme` 的 CSS 變數競爭，且**忽略了使用者的 light/dark 切換**
- **影響**: 即使使用者在 light mode，進入量化頁面仍然只顯示深色背景；主題切換按鈕在這些頁面無效
- **建議**: 移除硬編碼的 tailwind 顏色類，僅保留 `data-theme` CSS 變數控制。若業務線強制固定主題，應在 ThemeProvider 層級決定

#### 9. 遊戲元件缺乏排行榜整合與分數提交

- **檔案**: `src/components/games/Tetris.tsx` · `Snake.tsx` · `Minesweeper.tsx` 等
- **問題**: 所有遊戲的 Game Over 畫面僅顯示「重新開始」按鈕，未實作：
  - 自動提交分數至 `/api/games/scores`
  - 顯示當前排行榜
  - 個人最佳紀錄提示
- **影響**: 遊戲頁面上方的「遊戲結束後自動記錄分數到排行榜」提示為誤導
- **建議**: 建立共用 hook `useGameScore(gameName)`，封裝分數提交與排行榜查詢邏輯

#### 10. 手機版 UX 多處缺失

- **檔案**: `src/components/layout/Navbar.tsx:100-115`（漢堡選單）· `src/components/games/*`（鍵盤操作）· `src/app/quant/page.tsx`（行情列表）
- **問題**: 
  - 遊戲僅支援鍵盤操作，無觸控/手勢支援
  - 應用無 PWA manifest / Service Worker / `meta viewport` 以外的最佳化
  - 量化行情表格在小螢幕上無水平滾動
- **建議**: 
  - 遊戲加入觸控按鈕 overlay
  - 加入 `next-pwa` 或至少 manifest.json
  - 所有表格容器加上 `overflow-x-auto`

---

## 三、快速勝利（5 分鐘內可修復）

| # | 位置 | 問題 | 修復 |
|---|------|------|------|
| 1 | `layout.tsx:17-18` | Google Font link 無 `display=swap` | 加 `&display=swap` 至 font URL |
| 2 | `.gitignore` | 缺少 generated prisma | 加入 `src/generated/prisma/` |
| 3 | `constants.ts` | 多餘的 `export type { BusinessId }` | 移除 re-export line |
| 4 | `games/page.tsx` | 排行榜提示誤導 | 改為「排行榜功能開發中」 |
| 5 | `Navbar.tsx` | `businessList` 為 component 內常數 | 可提取至 `constants.ts` |
| 6 | `marketplace/page.tsx` | 搜尋 input 為 `readOnly` | 加上 placeholder 提示「搜尋功能即將開放」 |
| 7 | `ppt/layout.tsx` | 硬編碼 `bg-zinc-950 text-zinc-100` | 移除，依賴 `data-theme` |
| 8 | `next.config.ts` | 完全空白 | 加上 `experimental` 優化（turbo、scrollRestoration） |
| 9 | `package.json` | `postinstall` 無 error handling | 加 `|| true` |
| 10 | `Footer.tsx` | 無 `@/lib/utils` 的 `cn` 使用 | 一致性小改，現狀無害 |

---

## 四、重大改進建議

### 4.1 三個月路線圖建議

| 階段 | 目標 | 關鍵任務 |
|------|------|----------|
| **Phase 1 — 基礎建設** (2 週) | 認證 + 部署 | 完成 NextAuth、修復 Prisma 生成、補測試 |
| **Phase 2 — MVP 業務線** (4 週) | 遊戲 + 量化可上線 | 排行榜整合、WebSocket 行情、Canvas 遊戲觸控 |
| **Phase 3 — 業務擴展** (6 週) | 土木 + 二手交易 | 結構計算引擎 UI、商品 CRUD + 圖片上傳 |
| **Phase 4 — 品質打磨** (持續) | 性能 + 可及性 | PWA、Lighthouse 90+、i18n 骨架 |

### 4.2 架構層面建議

1. **通用 API 錯誤處理**：建立 `api-handler.ts` 包裝所有 API route，統一成功/錯誤格式
2. **測試覆蓋策略**：目前僅有 `constants.test.ts` 一組測試，至少補上：
   - UI 元件的 render 測試（vitest + testing-library）
   - API route 的整合測試
   - 遊戲邏輯的純函數測試
3. **共用 Hook 提煉**：遊戲元件有大量重複的 `useState` + `useRef` + `useEffect` 模式，可提煉 `useGameLoop`、`useKeyboard`、`useCanvas` 等 hook
4. **Prisma 中間層**：建立 `src/lib/db/` 將資料庫查詢封裝成 service functions，API route 不直接操作 Prisma
5. **主題系統簡化**：目前 `globals.css` 有 380+ 行主題變數，且與 `@theme` Tailwind v4 token 重複。建議擇一（保留 CSS variables 作為 source of truth，移除 `@theme` block 中與 CSS variables 重複的部分）

### 4.3 已知但未列入 P0 的技術債

- Prisma schema 缺少 `Item`（商品）、`Order`（訂單）、`Review`（評價）等模型，二手交易無法實作
- `docs/design-system.md` 有 455 行詳細規範，但許多樣式（如 `--text-display: 48px`）並未實際在任何 component 中使用
- `src/app/(auth)/` 使用 route group，但 login/register 頁面缺少實際 API 整合
- 所有 loading.tsx 僅為骨架動畫，無 Suspense boundary 配合的 streaming strategy
