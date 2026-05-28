# REVIEW: TASK-002cd 第 2 次評分（第 1 次返工後）

**審查日期：** 2025-07-15  
**審查者：** REVIEWER 子代理  
**審查範圍：** ThemeProvider, useTheme, ThemeToggle, layout.tsx, games/layout.tsx, games/page.tsx, EmptyState barrel export

---

## 1. 檢查清單

| 項目 | 結果 | 說明 |
|------|------|------|
| 1. ThemeProvider Context | **YES** | React Context 作為主題唯一狀態來源 |
| 2. useTheme.ts re-export | **YES** | 正確 re-export `useThemeContext as useTheme` |
| 3. ThemeToggle 移除直接操作 | **YES** | 已無直接 localStorage/classList，改從 Context 讀取 |
| 4. layout.tsx 包裹 ThemeProvider | **YES** | `src/app/layout.tsx` 以 `<ThemeProvider>` 包裹 `<Navbar>` + `<main>` + `<Footer>` |
| 5. Games layout data-theme="game" | **YES** | `src/app/games/layout.tsx` 設定 `<div data-theme="game">` |
| 6. games/page.tsx 無重複 data-theme | **YES** | 已移除，僅 layout 層級保留 |
| 7. EmptyState barrel export | **YES** | `src/components/ui/index.ts:1` 已匯出 |

### 1a. 錯誤檢查（相較第 1 次評分修復狀況）

| 第 1 次問題 | 狀態 | 說明 |
|------------|------|------|
| ThemeToggle 雙重狀態管理 | ✅ **已修復** | ThemeToggle 不再直接操作 localStorage/classList，全數透過 Context |
| 無 React Context/Provider | ✅ **已修復** | `ThemeProvider.tsx` 建立 `createContext<ThemeContextType>()` |
| useTheme 的 businessId 為死碼 | ⚠️ **部分改善** | ThemeProvider 提供 `setBusinessId` API，但 layouts 仍以硬編碼 `data-theme` 屬性為主 |
| EmptyState 未 barrel export | ✅ **已修復** | 已加入 `src/components/ui/index.ts:1` |
| Games 缺少專屬 layout | ✅ **已修復** | `src/app/games/layout.tsx` 已建立 |
| 無測試檔案 | ❌ **未修復** | 仍無任何測試檔案或測試框架 |

### 1b. 剩餘問題

1. **ThemeProvider 的 businessId 狀態未與 layout 同步**  
   `ThemeProvider` 提供 `setBusinessId` API 且管理 `<html data-theme>` 更新（`ThemeProvider.tsx:70-77`），但所有 layout 仍然使用硬編碼 `<div data-theme="...">`，從未呼叫 `setBusinessId`。導致：
   - `ThemeProvider.businessId` 永遠為 `null`
   - `<html>` 上的 `data-theme` 同步 effect（`:70-77`）實為無作用
   - 業務線主題色由 layout div 而非 Provider 驅動

   這不是功能性 bug（CSS 仍然正確套用），但顯示 Provider 與 layout 之間存在架構不一致。

2. **ThemeToggle 重複定義 businessColors**  
   `ThemeToggle.tsx:27-34` 重複定義了 `BUSINESS_COLORS`（已在 `ThemeProvider.tsx:6-13` 定義）。應從 Context 提供的 `themeColor` 取得即可。

---

## 2. 四項評分

### 完整性（25 / 25）

所有 7 項檢查清單項目皆通過。返工要求已全數實作：
- ✅ ThemeProvider Context 建立
- ✅ ThemeToggle 去耦合
- ✅ games/layout.tsx 新增
- ✅ EmptyState barrel export

結構完備，無遺漏。

### 正確性（23 / 25）

- ✅ 主題狀態管理架構正確：`ThemeProvider` 作為 single source of truth
- ✅ `localStorage` 讀寫僅在 `ThemeProvider.tsx` 內（`getItem:35`，`setItem:84`）
- ✅ `classList` 操作僅在 `ThemeProvider.tsx` 內（`toggle("dark"):66`）
- ✅ ThemeToggle 透過 `useThemeContext()` 讀取狀態，不再繞過 Context
- ⚠️ **-2**：Provider 的 `businessId` 管理與 layout 硬編碼 `data-theme` 不一致（Provider 的 `<html>` data-theme sync 實為無效路徑）

### 可維護性（22 / 25）

- ✅ 程式碼結構清楚，ThemeProvider / useTheme / ThemeToggle 職責分離
- ✅ 註解完整（中文），架構決策有文件化
- ⚠️ **-1**：`ThemeToggle.tsx` 重複定義 `businessColors`（`ThemeProvider.tsx:6-13` 已定義）
- ⚠️ **-2**：`ThemeProvider.tsx:70-77` 的 `<html data-theme>` 同步邏輯因 `businessId` 永為 `null` 而無作用，為潛在混淆點

### 測試與驗證（0 / 25）

- 專案仍完全無測試檔案與測試框架（無 `*.test.*`、無 `*.spec.*`、無 `vitest`/`jest` 依賴）
- **規則：若「是否有測試」= NO → 測試與驗證 0**

---

## 3. 總分

| 項目 | 分數 | 上限 |
|------|------|------|
| 完整性 | 25 | 25 |
| 正確性 | 23 | 25 |
| 可維護性 | 22 | 25 |
| 測試與驗證 | 0 | 25 |
| **總分** | **70** | **100** |

> **判定：不合格（< 90）** — 需再次返工（第 2 次返工）。

---

## 4. 返工建議（優先級排序）

### P0 — 必改

1. **消除業務線主題雙軌制**  
   選擇其一：
   - **方案 A（推薦）：** Layout 呼叫 `setBusinessId(id)` 取代 `<div data-theme="...">`，由 ThemeProvider 統一管理 `data-theme` 於 `<html>` 層級。CSS selector 從 `[data-theme="quant"] .container` 改為 `[data-theme="quant"] .container`（仍可運作）。
   - **方案 B：** 移除 ThemeProvider 中 `businessId` 相關的 state、setter、以及 `<html data-theme>` 同步 effect，僅保留 layout div 的硬編碼 data-theme。這樣 Provider 的註解也需修正。

### P1 — 應改（可維護性）

2. **ThemeToggle 移除重複 businessColors**  
   直接使用 Context 的 `themeColor` 或從 Provider 匯入共用常數，避免兩處定義不同步。

### P2 — 建議改（品質）

3. **補上測試**  
   至少為 `ThemeProvider`、`useTheme`、`ThemeToggle`、`EmptyState` 撰寫單元測試。建議框架：vitest + @testing-library/react。
