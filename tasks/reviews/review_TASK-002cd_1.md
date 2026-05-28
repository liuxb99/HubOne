# REVIEW: TASK-002c + TASK-002d 評分報告

**審查日期：** 2025-07-15  
**審查者：** REVIEWER 子代理  
**審查範圍：** `src/hooks/useTheme.ts`, `src/components/layout/ThemeToggle.tsx`, 6 個 layout.tsx, `src/app/games/page.tsx`, `src/app/error.tsx`, `src/app/not-found.tsx`, `src/app/loading.tsx`, `src/components/ui/EmptyState.tsx`

---

## 1. 檢查清單

| 項目 | 結果 | 說明 |
|------|------|------|
| 是否可執行（語法正確？可 build？） | **YES** | TypeScript 語法正確，所有 import 路徑可解析 |
| 是否有錯誤 | **NO** | 存在架構性缺陷（詳見下方） |
| 是否滿足需求條列 | **NO** | 部分缺失（詳見下方） |
| 是否有測試或滿足審美 | **NO** | 專案中完全無測試檔案（無 `*.test.*`/`*.spec.*`，無測試框架相依） |

### 1a. 錯誤詳情（架構/邏輯缺陷，非編譯錯誤）

1. **ThemeToggle 與 useTheme 雙重狀態管理（嚴重）**  
   `ThemeToggle.tsx` 直接讀寫 `localStorage` 並操作 `document.documentElement.classList`，完全繞過 `useTheme` hook。  
   若頁面其他元件透過 `useTheme` 讀取主題狀態，ThemeToggle 的變更不會同步過去。
   - `src/components/layout/ThemeToggle.tsx:18-22` — 直接操作 localStorage
   - `src/hooks/useTheme.ts:33-35` — useTheme 也操作同一個 localStorage key

2. **無 React Context／Provider**  
   `types/index.ts` 定義了 `ThemeContextType` 但從未建立 `createContext<ThemeContextType>()`。`useTheme` hook 的實例之間沒有任何狀態共享機制。
   - `src/types/index.ts:23-30` — 定義了 `ThemeContextType` 但無對應 Context

3. **useTheme 的 businessId 功能是死碼**  
   `useTheme` 回傳 `setBusinessId` 但沒有任何元件呼叫它。實際的 `data-theme` 切換由各 layout 的靜態 JSX 屬性完成。
   - `src/hooks/useTheme.ts:48-51` — `setBusinessId` 無呼叫者
   - 比對各 layout：data-theme 皆為靜態硬編碼

4. **EmptyState 未從 barrel 匯出**  
   `src/components/ui/EmptyState.tsx` 存在但未列入 `src/components/ui/index.ts` 的匯出清單，導致 `import { EmptyState } from '@/components/ui'` 會失敗。
   - `src/components/ui/index.ts:1-13` — 未包含 EmptyState

### 1b. 需求滿足度缺失

1. **無遊戲業務線專屬 layout.tsx**  
   其他 5 條業務線皆有 `layout.tsx` 設置 `data-theme`，games 僅在 `page.tsx` 的內部 `<div>` 上設定。導致 `games/loading.tsx` 載入時無 `data-theme="game"`，造成視覺閃爍（FOUC）。
   - `src/app/games/page.tsx:39` — data-theme 在 page 內層而非 layout 層級
   - `src/app/games/loading.tsx` — 完全無 data-theme 設定

2. **無測試檔案**  
   整個專案無任何測試（單元、整合、e2e 皆無），`package.json` 中也無測試腳本或測試框架。

---

## 2. 四項評分

### 完整性（22 / 25）

- **優點：** 6 條業務線的 layout 皆有 `data-theme`，全域 `loading.tsx`、`error.tsx`、`not-found.tsx` 皆實作。UI 骨架頁面完整涵蓋所有業務線。
- **缺點：** Games 缺少專屬 layout（-2），EmptyState 未納入 barrel export（-1）。

### 正確性（18 / 25）

- **優點：** TypeScript 型別正確，CSS 變數體系完整（6 套業務線色彩定義在 `globals.css`），語意化 API（`theme`/`setTheme`/`businessTheme`）設計清晰。
- **缺點：**
  - ThemeToggle 與 useTheme 雙重狀態管理（-4）— 可能導致執行時期不一致
  - 無 React Context／Provider（-2）
  - Games 載入時無 data-theme 導致 FOUC（-1）

### 可維護性（18 / 25）

- **優點：** 程式碼結構清楚，hook 與元件分離，CSS 變數集中管理，註解完整（中文）。
- **缺點：**
  - ThemeToggle 重複實作了 useTheme 已有的邏輯（-3）
  - EmptyState 未匯出，使用時需繞道 import（-2）
  - useTheme 的 businessId 功能為死碼（-1）
  - ThemeContextType 型別未實際使用（-1）

### 測試與驗證（0 / 25）

- 專案完全無測試檔案與測試框架。無單元測試、無整合測試、無 e2e 測試。
- **依據規則「若「是否有測試」= NO → 測試與驗證 0」**

---

## 3. 總分

| 項目 | 分數 | 上限 |
|------|------|------|
| 完整性 | 22 | 25 |
| 正確性 | 18 | 25 |
| 可維護性 | 18 | 25 |
| 測試與驗證 | 0 | 25 |
| **總分** | **58** | **100** |

> **判定：不合格（< 90）** — 需返工。

---

## 4. 返工建議（優先級排序）

### P0 — 必改（影響正確性）

1. **建立 ThemeProvider Context**  
   將 `useTheme` 的狀態提升為 React Context，讓 ThemeToggle 與其他元件共用同一份主題狀態。  
   **建議：** 新增 `src/providers/ThemeProvider.tsx`，包裹在 RootLayout 中。

2. **ThemeToggle 改用 useTheme（或 ThemeContext）**  
   移除 ThemeToggle 對 `localStorage` 和 `document.documentElement.classList` 的直接操作，改由 Context 提供狀態和方法。

### P1 — 應改（影響完整與可維護）

3. **新增 `src/app/games/layout.tsx`**  
   統一模式：設置 `data-theme="game"` 於 layout 層級，使 `loading.tsx` 載入時也有正確主題。

4. **EmptyState 加入 barrel export**  
   在 `src/components/ui/index.ts` 補上 `export { default as EmptyState } from "./EmptyState";`。

5. **移除死碼或補上實作**  
   要嘛讓路由切換時自動呼叫 `setBusinessId`，要嘛移除此 API 以避免誤導。

### P2 — 建議改（提升品質）

6. **補上測試**  
   至少為 `useTheme`、`ThemeToggle`、`EmptyState` 撰寫單元測試。建議以 vitest + @testing-library/react 為框架。

7. **CSS 架構一致性**  
   各 layout 的 Tailwind bg class（如 `bg-zinc-950`、`bg-white`）與 CSS 變數體系有部分重疊與衝突，建議統一使用 CSS 變數（`bg-[var(--bg-primary)]`）或純 Tailwind。
