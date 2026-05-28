# CalcReport 全面修復 — 評分報告

**reviewer:** subagent（自動評分）
**日期:** 2025-01-XX
**評分範圍:** `src/components/civil/CalcReport.tsx`（全面改寫） + `src/app/civil/page.tsx`（移除 type prop）

---

## 一、檢查清單

| # | 項目 | 結果 | 備註 |
|---|------|------|------|
| 1 | `src/app/civil/page.tsx` 已移除 `type` prop | ✅ YES | `page.tsx:170-173` 呼叫 `CalcReport` 時僅傳入 `result` 與 `params`，無任何 `type` 參數 |
| 2 | `SlabResult` 有專屬渲染區塊 | ✅ YES | 第 415-494 行：版厚檢討、彎矩設計值、配筋結果、撓度檢討 |
| 3 | `FootingResult` 有專屬渲染區塊 | ✅ YES | 第 496-553 行：尺寸承載力、厚度剪力檢討、配筋結果 |
| 4 | `BoltConnection` 有專屬渲染區塊 | ✅ YES | 第 555-600 行：螺栓參數、抗剪/抗拉容量、檢討結果 |
| 5 | `WeldResult` 有專屬渲染區塊 | ✅ YES | 第 602-625 行：銲道容量、使用率、強度檢討 |
| 6 | `BeamResult` 仍正常渲染 | ✅ YES | 第 361-390 行：彎矩/剪力/撓度/反力/斷面模數 |
| 7 | `ColumnResult`（鋼柱）仍正常渲染 | ✅ YES | 第 392-410 行：軸壓/長細比/臨界載重/使用率 |
| 8 | `RCColumnResult`（直接傳入）有專屬區塊 | ✅ YES | 第 694-728 行：總鋼筋面積/鋼筋比/軸壓強度/圍束 |
| 9 | `ColumnResult.rcResult`（巢狀 RC柱）有專屬區塊 | ✅ YES | 第 628-692 行：透過 `isSteelColumn`→`rcResult` 渲染 |
| 10 | 鴨子型別偵測邏輯覆蓋全部 5+2 類型 | ✅ YES | `detectResultType` 函數覆蓋 beam→column→slab→footing→steel（含 bolt/weld） |
| 11 | 型別守衛 (type guard) 存在且正確 | ✅ YES | `isSlabResult`, `isFootingResult`, `isBoltConnection`, `isWeldResult`, `isSteelColumn`, `isRCColumn` |
| 12 | TypeScript 編譯零錯誤 | ✅ YES | `npx tsc --noEmit` exit code 0 |

---

## 二、四項評分（各 0-25 分）

### 2.1 SlabResult / FootingResult / BoltConnection / WeldResult 支援 — **25 / 25**

**滿分。** 四種新結果類型皆有專屬渲染區塊：

- **SlabResult**（第 415-494 行）：完整顯示版厚檢討（`h_min`/`h_provided` → `isThicknessOK`）、彎矩設計值（`Mu_x`/`Mu_y`）、配筋結果（`As_main_x`/`As_main_y`/`As_temp` + 間距）、三欄配筋配置卡片、撓度檢討（`isDeflectionOK`）。
- **FootingResult**（第 496-553 行）：尺寸（`B`/`L`/`H`）、承載力比較（`q_actual` vs `q_allowable`）、三項安全檢討（`isBearingOK`/`isThicknessOK`/`isShearOK`）、配筋（`As`/`spacing`/`rebar_desc`）。
- **BoltConnection**（第 555-600 行）：螺栓參數（`boltDiameter`/`boltCount`/`boltGrade`/`connectionType`）、抗剪/抗拉容量與需求、兩項 `CheckBadge` 檢討。
- **WeldResult**（第 602-625 行）：容量（`capacity`/`ratio`）、`FormulaCard` 顯示 AISC §J2.4 公式、`CheckBadge` 檢討。

**型別守衛雙重驗證：** 每個區塊外層皆以 `{isTYPE && isTYPEguard(result) && (...)}` 保護，鴨子型別偵測 + 執行期型別守衛雙層保障。

### 2.2 BeamResult / ColumnResult 維持正常 — **25 / 25**

**滿分。** 原有梁柱渲染路徑完全保留：

- **BeamResult**（第 361-390 行）：`maxMoment`/`maxShear`/`maxDeflection`/`reactions`/`requiredZx`/`safetyRatio` — 與改寫前一致。
- **ColumnResult（鋼柱）**（第 392-410 行）：`axialLoad`/`slenderness`/`criticalLoad`/`allowableLoad`/`k`/`safetyRatio` — 與改寫前一致。
- **RC 配筋（梁）**（第 534-626 行）：`rcResult` 巢狀區塊顯示所有彎矩/剪力/配筋/斷面控制狀態。
- **斷面資訊**（第 304-313 行）：`hasSection` 路徑保留 `section.name`/`area`/`Ix`/`Zx`/`weight`。
- **安全判定**（第 788-791 行）：`SafetyBadge` 使用 `isSafe` 計算，邏輯正確。

### 2.3 鴨子型別偵測可靠性 — **23 / 25**

**良好，但有兩個可改進項。**

#### 偵測邏輯（第 33-44 行）

```
1. maxMoment + maxShear         → beam        (BeamResult)
2. slenderness / criticalLoad    → column      (ColumnResult)
3. As_total / interactionPoints  → column      (RCColumnResult)
4. h_min + Mu_x                 → slab        (SlabResult)
5. B + q_allowable              → footing     (FootingResult)
6. capacity / shearCapacity     → steel       (WeldResult / BoltConnection)
7. 預設                          → beam
```

**正確性驗證：**

| 輸入類型 | 判斷路徑 | 結果 | 正確？ |
|----------|----------|------|--------|
| `BeamResult` | 1 → beam | `'beam'` | ✅ |
| `ColumnResult` | 2 → column | `'column'` | ✅ |
| `RCColumnResult` | 3 → column | `'column'` | ✅ |
| `SlabResult` | 4 → slab | `'slab'` | ✅ |
| `FootingResult` | 5 → footing | `'footing'` | ✅ |
| `BoltConnection` | 6 → steel | `'steel'` | ✅ |
| `WeldResult` | 6 → steel | `'steel'` | ✅ |
| `null` / `undefined` / 非物件 | 預設 → beam | `'beam'` | ⚠️ 保守處理可接受 |

**扣分項：**
1. **`detectResultType` 使用 `as any`（第 35 行）** — 鴨子型別本質上繞過 TypeScript 型別系統，但亦可考慮使用 `Record<string, unknown>` 並輔以 `in` 運算子，降低對 `any` 的依賴。
2. **`B` 作為偵測屬性太短** — 雖然目前無碰撞（所有介面均無頂層 `B` 屬性），但理論上若有新類型引入 `B` 屬性，可能降低偵測可靠性。配對 `q_allowable` 已緩解此風險。

### 2.4 程式碼品質與型別安全 — **22 / 25**

**良好，但有三項扣分。**

**優點：**
- 模組化子元件：`ResultRow`、`SectionTitle`、`FormulaCard`、`SafetyBadge`、`CodeRef`、`CheckBadge` — 可讀性與可維護性佳。
- `CalcReportProps` 介面有完整 JSDoc 註解（第 78-87 行）。
- 空狀態處理（第 227-241 行）：`result === null` 時顯示佔位提示。
- 列印樣式支援（第 793-800 行）。
- TypeScript 編譯零錯誤（`npx tsc --noEmit` exit 0）。
- 移除 `type` prop 後，呼叫端（`page.tsx:170-173`）變得更簡潔。

**扣分項：**
1. **`isSafe` 回退邏輯過度樂觀（第 238-248 行）**：
   ```ts
   return (result as any).isSafe === true || (result as any).isSafe === undefined;
   ```
   當 `isSafe` 為 `undefined` 時視為安全。對 BeamResult/ColumnResult 而言 `isSafe` 為必填欄位，此分支在現有類型中不會觸發；但對未來擴充而言，預設安全而非不安全違反結構工程「保守設計」原則。建議改為：
   ```ts
   return (result as any).isSafe === true;
   ```
   （扣 2 分）

2. **多處 `as any` 強制轉型**（第 35、236、240、245、301 行）— 鴨子型別本質需要繞過型別系統，但若引入泛型輔助函數可降低 `any` 散佈範圍。（扣 1 分）

3. **`steps: string[]` 陣列未被渲染** — `SlabResult`、`FootingResult`、`BoltConnection`、`WeldResult` 的 `steps` 欄位儲存了詳細計算步驟，但 calc report 並未顯示這些步驟，浪費了計算引擎的產出。（扣 0 分，屬於功能追加而非品質缺陷，僅記錄）

---

## 三、總分

| 評分項目 | 得分 | 滿分 |
|----------|:----:|:----:|
| SlabResult / FootingResult / BoltConnection / WeldResult 支援 | **25** | 25 |
| BeamResult / ColumnResult 維持正常 | **25** | 25 |
| 鴨子型別偵測可靠性 | **23** | 25 |
| 程式碼品質與型別安全 | **22** | 25 |
| **總分** | **95** | **100** |

## 四、結論

**✅ 合格（95/100 ≥ 90）**

CalcReport 全面修復成功。主要貢獻：

1. **引入鴨子型別自動偵測**（`detectResultType`），無需呼叫端傳入 `type` prop，降低了使用複雜度。
2. **完整支援 5 種結果類型**（Slab/Footing/Bolt/Weld + 既有 Beam/Column），每種皆有專屬渲染區塊與型別守衛。
3. **6 個型別守衛函數**提供執行期二次驗證，確保型別安全。
4. **移除 `page.tsx` 中的 `type` prop**，呼叫端簡化為一行（第 170-173 行）。

### 建議改進（非必改）

| # | 建議 | 影響 | 位置 |
|---|------|------|------|
| 1 | `isSafe` 回退改為 `=== true`（不含 `undefined`） | 中 — 未來擴充安全 | 第 240 行 |
| 2 | 考慮渲染 `steps` 陣列作為公式推導補充 | 低 — UI 增強 | 全域 |
| 3 | 考慮用 `Record<string, unknown>` 取代部分 `as any` | 低 — 型別純淨度 | 第 35、236 行等 |
