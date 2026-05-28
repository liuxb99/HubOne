# REVIEW: TASK-002cd 第 3 次評分（第 2 次返工後）

**審查日期：** 2025-07-16  
**審查者：** REVIEWER 子代理  
**審查範圍：** ThemeProvider, ThemeToggle, useTheme, layout.tsx 系列, EmptyState

---

## 1. 檢查清單

### 1a. ThemeProvider.tsx — businessId 雙軌制消除

| 項目 | 結果 | 說明 |
|------|------|------|
| businessId state 已移除 | ✅ YES | 無 `businessId` / `setBusinessId` 宣告 |
| themeColor state 已移除 | ✅ YES | `search_content "themeColor"` 全專案 0 匹配 |
| `<html data-theme>` 同步 effect 已移除 | ✅ YES | 無任何 effect 寫入 `document.documentElement.dataset` 的 data-theme |
| 只管理 light/dark/system | ✅ YES | Context value 僅 `{ mode, isDark, setMode }` |

**結論：ThemeProvider 已完全消除 businessId 雙軌制，採用方案 B（由 layout div 的硬編碼 `data-theme` 全權負責）。**

### 1b. ThemeToggle.tsx — 色標與 Context 讀取

| 項目 | 結果 | 說明 |
|------|------|------|
| 從 useThemeContext() 只取 isDark/setMode/mode | ✅ YES | `const { mode, isDark, setMode } = useThemeContext()` (line 24) |
| 色標用 MutationObserver 監聽 html data-theme | ✅ YES | `observer.observe(html, { attributeFilter: ["data-theme"] })` (lines 27-34) |

### 1c. useTheme.ts — re-export

| 項目 | 結果 | 說明 |
|------|------|------|
| 正確 re-export useThemeContext as useTheme | ✅ YES | `export { useThemeContext as useTheme, ThemeProvider }` |
| 正確 re-export ThemeContextType | ✅ YES | `export type { ThemeContextType } from "@/types"` |

### 1d. 其他檔案保持不變

| 檔案 | 狀態 | 說明 |
|------|------|------|
| `games/layout.tsx` | ✅ 不變 | `<div data-theme="game">` (line 13) |
| `civil/layout.tsx` | ✅ 不變 | `<div data-theme="civil">` (line 14) |
| `quant/layout.tsx` | ✅ 不變 | `<div data-theme="quant">` (line 15) |
| `ai-tools/layout.tsx` | ✅ 不變 | `<div data-theme="ai">` (line 14) |
| `marketplace/layout.tsx` | ✅ 不變 | `<div data-theme="market">` (line 14) |
| `ppt/layout.tsx` | ✅ 不變 | `<div data-theme="ppt">` (line 14) |
| `src/components/ui/index.ts` | ✅ 不變 | `export { default as EmptyState } from "./EmptyState"` (line 1) |

---

## 2. 前次問題修復狀況

| 第 2 次評分問題 | 狀態 | 說明 |
|----------------|------|------|
| **P0: businessId 雙軌制** — ThemeProvider 仍有 businessId state + `<html data-theme>` sync | ✅ **已修復** | 完全移除。Provider 不再持有任何 businessId/themeColor 相關 state、setter、effect |
| **P1: ThemeToggle 重複定義 BUSINESS_COLORS** | ❌ **未修復** | `ThemeToggle.tsx:7-14` 仍定義 `BUSINESS_COLORS`；值與 `Navbar.tsx:10-16` 的 `businesses[].color` 重複 |
| **P2: 無測試** | ❌ **未修復** | 仍無任何測試檔案或測試框架依賴 |

---

## 3. 新增問題

### ⚠️ ThemeToggle 色標功能斷裂（Regression）

**位置：** `ThemeToggle.tsx:27-34`

```typescript
// ThemeToggle.tsx:28-34
const update = () => setBusinessId(html.getAttribute("data-theme"));
update();
const observer = new MutationObserver(() => update());
observer.observe(html, { attributes: true, attributeFilter: ["data-theme"] });
```

MutationObserver 監聽 `<html>` 的 `data-theme` 屬性變化，但**全專案已無任何程式碼會寫入 `<html data-theme>`**：

- `ThemeProvider.tsx` 已移除 (`<html data-theme>` sync effect 隨方案 B 刪除)
- 所有 layout 使用 `<div data-theme="...">` — 這不會冒泡到 `<html>`
- `search_content "html.*data-theme"` 在全專案 CSS/TSX 中 **0 匹配**

**結果：** `businessId` 永遠為 `null`，`dotColor` 永遠為 `null`，業務線色標小點永遠不會顯示。

---

## 4. 四項評分

### 完整性（25 / 25）

所有 4 項檢查類別全部通過：
- ✅ ThemeProvider businessId 雙軌制已消除
- ✅ ThemeToggle 從 Context 讀取主題 + MutationObserver 監聽 data-theme
- ✅ useTheme 正確 re-export
- ✅ 其他檔案保持不變（layout data-theme、EmptyState export）

### 正確性（23 / 25）

- ✅ businessId 雙軌制已消除（ThemeProvider 不再持有 businessId state）
- ✅ ThemeProvider 正確作為 light/dark/system 單一狀態來源
- ✅ localStorage 讀寫僅存在於 `ThemeProvider.tsx`（初始化 `getItem:29`，`setMode:58`）
- ✅ classList 操作僅存在於 `ThemeProvider.tsx`（`toggle("dark"):53`）
- ✅ ThemeToggle 從 Context 讀取主題，無繞行
- ⚠️ **-2**：**色標功能斷裂** — MutationObserver 監聽 `<html data-theme>` 但無來源寫入此屬性，`businessId` 永為 `null`。此為方案 B 引入的 regression。

### 可維護性（24 / 25）

- ✅ ThemeProvider 職責集中（僅 light/dark/system）
- ✅ 程式碼結構清楚，分層合理（Provider → Hook → Component）
- ✅ 註解完整，架構決策有文件化
- ⚠️ **-1**：`ThemeToggle.tsx:7-14` 的 `BUSINESS_COLORS` 與 `Navbar.tsx:10-16` 的 `businesses[].color` 值重複（#00C853, #FF6D00, #E91E63 等）。新增業務線或修改色碼需同步兩處。

### 測試與驗證（0 / 25）

- 專案仍完全無測試檔案（`*.test.*` / `*.spec.*` — 0 匹配）
- `package.json` 無任何測試框架依賴（無 vitest / jest / mocha / playwright 等）
- **規則：若「是否有測試」= NO → 測試與驗證 0**

---

## 5. 總分

| 項目 | 分數 | 上限 |
|------|------|------|
| 完整性 | 25 | 25 |
| 正確性 | 23 | 25 |
| 可維護性 | 24 | 25 |
| 測試與驗證 | 0 | 25 |
| **總分** | **72** | **100** |

> **判定：不合格（< 90）** — 需第 3 次返工（最多 5 次）。

---

## 6. 返工建議（優先級排序）

### P0 — 必改

**色標功能斷裂（Regression）**

ThemeToggle 的 `<html data-theme>` MutationObserver 現在無人寫入目標屬性。選擇其一修復：

- **方案 A（推薦）：** 讓 ThemeToggle 的 MutationObserver 改為監聽 `document.body` 或其內部 container，尋找最近的 `[data-theme]` 父元素。因為 body 內一定會有 layout 的 `<div data-theme="...">`(或其祖先)，透過 `closest("[data-theme]")` 或 `document.querySelector("[data-theme]")` 取得。

- **方案 B：** 恢復 ThemeProvider 從布局層級接收 businessId 並同步到 `<html data-theme>`（回到方案 A 思路），但這違反本次返工的方針，不推薦。

- **方案 C（最簡單）：** 改為從 URL pathname 推斷 businessId。因為每個 layout 對應的 pathname 前綴是固定的（`/quant`, `/civil`, `/games` 等），可直接透過 `usePathname()` 判斷，無需 MutationObserver。

  ```typescript
  import { usePathname } from "next/navigation";
  
  const PATH_TO_BUSINESS: Record<string, string> = {
    "/quant": "quant", "/civil": "civil", "/marketplace": "market",
    "/ai-tools": "ai", "/ppt": "ppt", "/games": "game",
  };
  const businessId = PATH_TO_BUSINESS[Object.keys(PATH_TO_BUSINESS).find(k => pathname.startsWith(k)) ?? ""] ?? null;
  ```

### P1 — 應改（可維護性）

**消除 BUSINESS_COLORS 重複定義**

將 `ThemeToggle.tsx:7-14` 與 `Navbar.tsx:10-16` 的業務線色彩常數提取到共用模組（如 `@/constants/business.ts`），兩處共同引用。新增業務線時只需修改一處。

### P2 — 建議改（品質）

**補上測試**

至少為 `ThemeProvider`、`useTheme`、`ThemeToggle`、`EmptyState` 撰寫單元測試。建議框架：vitest + @testing-library/react。
