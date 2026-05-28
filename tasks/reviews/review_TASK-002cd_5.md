# REVIEW: TASK-002cd 第 5 次評分（第 4 次返工後）

**審查日期：** 2025-07-16  
**審查者：** REVIEWER 子代理  
**審查範圍：** constants.ts（修改）、Navbar.tsx（修改）、vitest.config.ts（新增）、src/lib/__tests__/constants.test.ts（新增）、package.json（確認）

---

## 1. 檢查清單

### 1a. 本次修復目標

| 項目 | 結果 | 說明 |
|------|------|------|
| **[FIX-A] Navbar 移除未使用的 import** | ✅ YES | `Navbar.tsx` 僅保留 `BUSINESS_NAMES` 與 `BusinessId` 的匯入，`BUSINESS_COLORS` 已移除 |
| **[FIX-A] constants.ts 改從 @/types 導入 BusinessId** | ✅ YES | `constants.ts:1-2` 使用 `import type { BusinessId } from "@/types"` 後 `export type { BusinessId }`，消除重複定義 |
| **[FIX-B] 新增 vitest 測試框架** | ✅ YES | `vitest.config.ts` 已建立（jsdom + globals + `@` alias）；`package.json` 含 `vitest ^2.1.0` 相依及 `test` / `test:watch` scripts |
| **[FIX-B] 7 個測試案例** | ✅ YES | 5 個 `inferBusinessId` 測試 + 2 個常數測試，**全部通過** |

### 1b. 前次問題修復狀況

| 第 4 次評分問題 | 狀態 | 說明 |
|----------------|------|------|
| **Navbar 未使用的 `BUSINESS_COLORS` 匯入** | ✅ **已修復** | `Navbar.tsx` 匯入行已無此符號 |
| **`BusinessId` 類型重複定義** | ✅ **已修復** | `constants.ts` 從 `@/types` 導入，類型僅定義於 `@/types/index.ts:4` |
| **無測試框架與測試案例 → 測試與驗證 0 分** | ✅ **已修復** | 新增 vitest + 7 個測試案例，全部通過 |

### 1c. 新增問題

無新增問題。

---

## 2. 四項評分

### 完整性（25 / 25）

所有本次返工要求已確實實作：

- ✅ Navbar.tsx 移除未使用的 `BUSINESS_COLORS` 匯入
- ✅ constants.ts 改為從 `@/types` 導入 `BusinessId`，消除 DRY 違反
- ✅ vitest.config.ts 新增（jsdom environment、globals、`@` path alias）
- ✅ `src/lib/__tests__/constants.test.ts` 新增，含 7 個測試案例
- ✅ package.json 含 vitest 依賴 + test scripts
- ✅ `@testing-library/react`、`@testing-library/jest-dom`、`jsdom` 皆已列於 devDependencies

無遺漏項。

### 正確性（25 / 25）

- ✅ **類型正確**：`constants.ts` 導入的 `BusinessId` 與 `@/types/index.ts` 定義一致（union type of 6 string literals）
- ✅ **匯入正確**：`Navbar.tsx` 使用 `import type { BusinessId } from "@/lib/constants"` — 透過 re-export 取得類型，無循環依賴
- ✅ **路徑別名一致**：`vitest.config.ts` 的 `resolve.alias`（`@` → `./src`）與 `tsconfig.json` 的 `paths` 鏡像一致
- ✅ **測試邏輯正確**：所有 7 案結果符合預期（`/marketplace/items/123` → `"market"`、`"/"` → `null` 等）
- ✅ **測試全數通過**：`vitest run` → 1 file, 7 tests, all passed (788ms)

無功能 regression。

### 可維護性（25 / 25）

- ✅ **單一事實來源**：`BusinessId` 僅定義於 `@/types/index.ts`，`constants.ts` 引用後 re-export
- ✅ **死碼歸零**：Navbar.tsx 無未使用匯入
- ✅ **常數集中管理**：`constants.ts` 為業務線常數的唯一定義點
- ✅ **inferBusinessId() 為純函數**，無外部依賴，易於測試與推論
- ✅ **測試遵循專案慣例**：`__tests__/` 目錄命名、與受測檔案同層（`src/lib/__tests__/constants.test.ts`）
- ✅ **vitest config 與 Next.js 生態相容**：使用 jsdom + `@` alias，不與 Next.js 編譯衝突

### 測試與驗證（22 / 25）

| 測試面向 | 案例數 | 覆蓋範圍 |
|---------|--------|---------|
| `inferBusinessId` 正向路徑 | 2 | `/quant` → `"quant"`、`/games` → `"game"` |
| `inferBusinessId` 子路徑 | 1 | `/marketplace/items/123` → `"market"` |
| `inferBusinessId` 邊界（null） | 2 | 未知路徑 `/unknown` → `null`、根路徑 `/` → `null` |
| `BUSINESS_COLORS` | 1 | 確認 keys.length === 6 + 抽驗 `quant`/`game` 存在 |
| `BUSINESS_NAMES` | 1 | 抽驗 `quant`（量化交易）+ `game`（經典遊戲）中文名稱 |

**加分項：**
- 子路徑測試（`/marketplace/items/123`）驗證 prefix-matching 不含 pathname 尾綴干擾
- 根路徑測試驗證首頁正確回傳 `null`（首頁不顯示色標為正確行為）
- 7 案測試總執行時間 3ms，近乎零成本

**扣分項（-3）：**
- `BUSINESS_COLORS` 僅驗證長度與 key 存在，未驗證**具體色值**（如 `#00C853` vs 錯值）
- `BUSINESS_NAMES` 僅抽驗 2/6 條，未全量驗證
- `BUSINESS_PATH_PREFIX` 完全未測（雖 route→id 映射已透過 inferBusinessId 間接測試，但 prefix 本身未直接斷言）
- 建議補上：`BUSINESS_COLORS` 全量色值快照斷言 + `BUSINESS_PATH_PREFIX` 比對 `inferBusinessId` 邏輯的整合斷言

> **但注意：** 前次評分此項為 **0/25**（完全無測試），本次已建立 7 案測試且全數通過，是**顯著進步**。扣分反映的是「可進一步完善」，非基本缺失。

---

## 3. 總分

| 項目 | 分數 | 上限 |
|------|------|------|
| 完整性 | 25 | 25 |
| 正確性 | 25 | 25 |
| 可維護性 | 25 | 25 |
| 測試與驗證 | 22 | 25 |
| **總分** | **97** | **100** |

> **判定：合格（≥ 90）** ✅ — 本次返工已解決前次全部問題。TASK-002cd 驗收通過。

---

## 4. 總結

本次返工（第 4 次）成功解決了前次評分的三項問題：

1. **FIX-A** 消除了 Navbar 中的死碼（未使用的 `BUSINESS_COLORS` 匯入）與 `BusinessId` 類型重複定義，可維護性從 23 → 25。
2. **FIX-B** 從零建立了完整的測試基礎設施（vitest config + `__tests__/` 目錄 + 7 個測試案例 + package.json 整合），測試與驗證從 0 → 22，是本次最大的品質躍進。
3. 所有測試通過，功能正確，無 regression。

總分 **97/100**，超越合格門檻（90）。**無需再返工**。
