# REVIEW: TASK-002cd 第 4 次評分（第 3 次返工後）

**審查日期：** 2025-07-16  
**審查者：** REVIEWER 子代理  
**審查範圍：** constants.ts（新增）、ThemeToggle.tsx（修改）、Navbar.tsx（修改）、ThemeProvider.tsx（確認）

---

## 1. 檢查清單

### 1a. 本次修復目標

| 項目 | 結果 | 說明 |
|------|------|------|
| ThemeToggle 移除 MutationObserver，改爲 usePathname() 從 URL 推斷 businessId | ✅ YES | 使用 `usePathname()` + `inferBusinessId()` (`ThemeToggle.tsx:14-16`)，無任何 MutationObserver |
| 新增 src/lib/constants.ts — 集中定義 BUSINESS_COLORS、BUSINESS_NAMES、BUSINESS_PATH_PREFIX | ✅ YES | 已建立 (`constants.ts:1-39`)，結構清楚，export type + const + function |
| Navbar.tsx 改為引用 constants.ts，消除重複定義 | ✅ YES | `BUSINESS_NAMES` 用於桌面/手機選單標籤 (`Navbar.tsx:50, 83`)，`BusinessId` 類型用於 `businessList` 型別 (`Navbar.tsx:10`) |
| ThemeProvider.tsx 確認 businessId 已移除 | ✅ YES | 無 `businessId`/`themeColor` state、無 `<html data-theme>` sync effect (`ThemeProvider.tsx:1-72`) |

### 1b. 前次問題修復狀況

| 第 3 次評分問題 | 狀態 | 說明 |
|----------------|------|------|
| **P0: 色標功能斷裂** — MutationObserver 監聽 `<html data-theme>` 但無來源寫入此屬性（layout 使用 `<div data-theme>`） | ✅ **已修復** | MutationObserver 完全移除。改用 `usePathname()` 推斷，**不受 DOM 結構影響**，能正確在 `/quant`、`/civil`、`/marketplace`、`/ai-tools`、`/ppt`、`/games` 頁面顯示色標 |
| **P1: BUSINESS_COLORS 重複定義** — ThemeToggle.tsx 與 Navbar.tsx 各有獨立定義 | ✅ **已修復** | 兩者皆從 `@/lib/constants` 導入，**單一事實來源** |
| **P2: 無測試** | ❌ **未修復** | `package.json` 無測試框架依賴，專案無 `*.test.*` / `*.spec.*` |

### 1c. 新增問題

| 問題 | 嚴重度 | 說明 |
|------|--------|------|
| **Navbar 未使用的匯入** | 低 | `Navbar.tsx:7` 導入 `BUSINESS_COLORS` 但 JSX 中**從未使用**（`search_content` 確認 — 僅出現在該 import 行）。為死碼，且 `eslint` lint 步驟 (`package.json:7`) 可能觸發 `no-unused-vars` 錯誤 |
| **BusinessId 類型重複定義** | 低 | `BusinessId` 同時定義於 `@/types/index.ts:4` 和 `@/lib/constants.ts:2`，字面相同但違反 DRY。未來修改需同步兩處 |

---

## 2. 四項評分

### 完整性（25 / 25）

所有本次返工要求已確實實作：
- ✅ `src/lib/constants.ts` 新增，集中管理所有業務線常數
- ✅ `ThemeToggle.tsx` 改為 `usePathname()` + `inferBusinessId()` 推斷色標
- ✅ `Navbar.tsx` 引用 constants.ts，消除重複定義
- ✅ `ThemeProvider.tsx` 無 businessId 遺留

無遺漏項。

### 正確性（25 / 25）

- ✅ 色標功能**已修復** — `inferBusinessId("/marketplace/orders")` → `"market"`，`inferBusinessId("/")` → `null`（首頁隱藏色標為正確行為）
- ✅ `usePathname()` 自動追蹤客戶端導航，無需額外 effect/observer
- ✅ `ThemeProvider` 完全乾淨 — 無 businessId state、無 data-theme sync、無誤導性 setter
- ✅ 主題 light/dark/system 切換不受影響
- ✅ Navbar 導航正確，href 與 BUSINESS_PATH_PREFIX 一致

無功能回歸。

### 可維護性（23 / 25）

- ✅ 常數集中化為重大改善 — 新增業務線只需修改 `constants.ts` 一處 + 對應 layout
- ✅ `inferBusinessId()` 為純函數，無副作用，易於測試
- ✅ `ThemeToggle` 不再依賴 DOM 結構（MutationObserver），改為 URL 驅動，更符合 Next.js 慣例
- ⚠️ **-1**：`BusinessId` 類型定義重複（`@/types/index.ts:4` 與 `@/lib/constants.ts:2`）。建議 `constants.ts` 從 `@/types` 導入該類型，而非重新定義
- ⚠️ **-1**：`Navbar.tsx:7` 的 `BUSINESS_COLORS` 為未使用的匯入。若專案 lint 規則嚴格（`eslint-config-next` + `no-unused-vars`），可能導致 CI 失敗

### 測試與驗證（0 / 25）

- 專案仍完全無測試檔案與測試框架
- `package.json` 無 vitest / jest / mocha / playwright 等依賴
- 無 `*.test.*`、`*.spec.*`、`__tests__/` 目錄
- **規則：若「是否有測試」= NO → 測試與驗證 0**

**備註：** `inferBusinessId()` 為純函數，非常適合單元測試（測試案例僅 6 條路徑前綴 + 1 個 null），無外部依賴，是補上測試的理想切入點。

---

## 3. 總分

| 項目 | 分數 | 上限 |
|------|------|------|
| 完整性 | 25 | 25 |
| 正確性 | 25 | 25 |
| 可維護性 | 23 | 25 |
| 測試與驗證 | 0 | 25 |
| **總分** | **73** | **100** |

> **判定：不合格（< 90）** — 需第 4 次返工（最多 5 次）。

---

## 4. 返工建議（優先級排序）

### P0 — 必改（本次無 P0 問題）

色標 regression 已修復，功能正確。無新 P0 問題。

### P1 — 應改（可維護性）

1. **移除 Navbar 未使用的 `BUSINESS_COLORS` 匯入**
   - `src/components/layout/Navbar.tsx:7`：刪除 `BUSINESS_COLORS,`（只保留 `BUSINESS_NAMES`）
   - 避免 lint 錯誤、消除死碼

2. **消除 `BusinessId` 類型重複**
   - 方案 A：`@/lib/constants.ts` 從 `@/types` 導入 `BusinessId`，不再自行定義
   - 方案 B：將 `BusinessId` 類型定義僅保留在 `constants.ts`，`@/types` 引用過來
   - 一致原則：類型定義應為單一事實來源

### P2 — 建議改（品質）

3. **為 `inferBusinessId()` 補上單元測試**
   - 此為純函數，6 條業務線路徑 + 首頁（null）共 7 個測試案例
   - 建議框架：vitest（輕量、ESM 原生、與 Next.js 相容性好）
   - 測試檔案位置：`src/lib/__tests__/constants.test.ts`

4. （選擇性）為 `ThemeProvider` + `ThemeToggle` 補上 React Testing Library 元件測試
