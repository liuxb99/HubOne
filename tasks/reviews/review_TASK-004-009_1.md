# REVIEW: TASK-004~006（量化交易）+ TASK-007~009（土木結構）綜合評分

**審查日期：** 2025-07-16
**審查者：** REVIEWER 子代理
**審查範圍：**
- 量化交易：`src/lib/quant/` (3 files)、`src/components/quant/` (3 files)、`src/app/quant/page.tsx`
- 土木結構：`src/lib/civil/` (4 files)、`src/components/civil/` (5 files)、`src/app/civil/page.tsx`
- API 路由：`src/app/api/civil/calculate/route.ts`、`src/app/api/quant/market/route.ts`、`src/app/api/quant/strategy/route.ts`

---

## 1. 檢查清單

### 1a. 量化交易（TASK-004~006）

| 項目 | 結果 | 說明 |
|------|------|------|
| **MA 演算法正確** | ✅ YES | `calcMA()` 使用標準 SMA：滑動視窗求和後取平均 (`indicators.ts:12-20`) |
| **EMA 演算法正確** | ✅ YES | `calcEMA()` 標準遞迴公式：EMAₜ = Pₜ × α + EMAₜ₋₁ × (1-α), α=2/(period+1) (`indicators.ts:34-47`) |
| **RSI 演算法正確** | ✅ YES | `calcRSI()` 使用 Wilder 平滑法：初始 SMA → 後續平滑 (α=1/period)，結果 [0..period-1] 為 null (`indicators.ts:63-97`) |
| **MACD 演算法正確** | ✅ YES | `calcMACD()` = EMA12 - EMA26, Signal = EMA9(MACD), Histogram = MACD - Signal (`indicators.ts:110-148`)，對齊邏輯正確 |
| **布林帶演算法正確** | ✅ YES | `calcBollinger()` 中軌 = MA20，上下軌 = MA ± stdDev×k，使用母體標準差 (`indicators.ts:162-181`) |
| **lightweight-charts 整合** | ✅ YES | `createChart()` 建立圖表，`addCandlestickSeries()` 繪 K 線，`addHistogramSeries()` 繪成交量，`addLineSeries()` 繪指標 (`KLineChart.tsx:92-220`) |
| **行情產生器邏輯** | ✅ YES | 種子隨機可重現，`generateHistory()` 產生 200 根歷史 K 線，`generateNextKLine()` 模擬即時更新 (`market.ts`) |
| **持倉管理正確** | ✅ YES | `addPosition()` 加倉加權平均成本、`closePosition()` 平倉、`reducePosition()` 部分平倉 (`store.ts`) |
| **交易面板功能完整** | ✅ YES | 買入/賣出切換、數量輸入、最大/全部快捷、持倉列表含損益計算 (`TradePanel.tsx`) |
| **三欄響應式佈局** | ✅ YES | lg+ 三欄、sm 二欄、手機單欄 + Chart/Trade Tab 切換 (`quant/page.tsx:126-252`) |
| **無單元測試** | ❌ NO | `src/lib/quant/` 下無 `__tests__/` 目錄，無單元測試 |

### 1b. 土木結構（TASK-007~009）

| 項目 | 結果 | 說明 |
|------|------|------|
| **型鋼數據庫 20 種** | ✅ YES | 20 種 H 型鋼，涵蓋 H100~H1000 + 輕型系列 (`section.ts:27-198`)，數據含 name/height/width/webThick/flangeThick/area/Ix/Zx/weight/rx/ry |
| **簡支梁彎矩計算正確** | ✅ YES | `calcMomentAt()` 對簡支梁使用 M(x)=R_left·x - ΣP(x-a) - Σw·len·(x-start-len/2) (`beam.ts:265-287`) |
| **簡支梁剪力計算正確** | ✅ YES | `calcShearAt()` 對簡支梁從左反力起算，經過載重位置後減去載重 (`beam.ts:229-256`) |
| **反力計算正確** | ✅ YES | `calcReactions()` 使用 ΣM=0 求解 R_left = momentSum/L (`beam.ts:144-176`) |
| **懸臂梁計算正確** | ✅ YES | 懸臂梁彎矩 M(x) = -ΣP(x-a) - Σw·len·(x-start-len/2)，驗證全跨 UDL 得 M = -wx²/2 ✅ (`beam.ts:274-282`) |
| **固定梁彎矩計算正確** | ✅ YES | 固定梁使用與簡支梁相同的剪力/彎矩疊加邏輯（反力不同，但彎矩疊加公式相同） |
| **尤拉公式正確** | ✅ YES | Pcr = π²EI/(kL)²，單位轉換：L(mm)=L(m)×1000、I(mm⁴)=I(cm⁴)×10⁴、r(mm)=r(cm)×10 (`column.ts:66-83`) |
| **AISC ASD 容許應力** | ✅ YES | `calcAllowableStress()` 含 λ≤Cc（非彈性）與 λ>Cc（彈性）兩區段，公式符合 AISC E2 (`column.ts:108-119`) |
| **荷載組合符合台灣規範** | ✅ YES | 10 組 LRFD 組合：1.4DL、1.2DL+1.6LL、含 WL/EL/SL/CL 組合 (`load.ts:57-118`) |
| **SVG 圖表繪製** | ✅ YES | `BeamDiagram.tsx` 繪製梁示意圖 + V 圖 + M 圖 + δ 圖，正彎矩朝下符合結構學慣例，支援三種支承繪製 |
| **計算書可列印** | ✅ YES | `CalcReport.tsx` 含 @media print 樣式，顯示參數/公式/結果/安全判定 |
| **三欄響應式佈局** | ✅ YES | lg+ 三欄（選單 + 表單/結果 + 快速參考）、xl 顯示右欄、手機單欄 |
| **無單元測試** | ❌ NO | `src/lib/civil/` 下無 `__tests__/` 目錄，無單元測試 |

### 1c. 發現問題

| # | 問題 | 檔案 | 嚴重性 | 說明 |
|---|------|------|--------|------|
| 1 | **撓度計算單位錯誤** | `beam.ts:265-287` | **高** | `calcDeflectionAt()` 使用 `(totalDelta * 1e6) / EI`，但 totalDelta 單位為 N·m³，EI 為 N·mm²。正確轉換應為 `1e9` 而非 `1e6`，導致撓度值低估 **1000 倍**。詳細分析見 §2 正確性。 |
| 2 | **撓度使用固定斷面** | `beam.ts:290` | 中 | `calcDeflectionAt()` 固定使用 `I_assumed = 2.04e8 mm⁴`（H300×300×10×15），不隨使用者選擇的斷面改變，即使換用 H100×100 仍用同一慣性矩。 |
| 3 | **KLineChart 整圖重建** | `KLineChart.tsx:91-226` | 低 | `useEffect` 依賴 `[data, activeIndicators]`，每次切換指標都 `chart.remove()` 後重建整個圖表，而非單純切換 Series 可見性。功能正確但浪費效能。 |
| 4 | **API 與 UI 分離** | `app/api/civil/`、`app/api/quant/` | 低 | API 路由存在但 UI 完全使用 client-side 計算，API 的 `civil/calculate` 甚至使用簡化 mock 而非 `beam.ts`/`column.ts` 的實際演算法。 |
| 5 | **MACD 柱狀圖未實作** | `KLineChart.tsx` | 低 | `calcMACD()` 有回傳 histogram，但 K 線圖中僅繪製 MACD 線與 Signal 線，未繪製柱狀圖（直方圖）。 |
| 6 | **section.ts 備註不精確** | `section.ts:24` | 極低 | 註解寫「約 20 種」但實際恰好 20 種，未造成功能問題。 |

---

## 2. 四項評分

### 完整性（Integrity）

#### 量化交易（21 / 25）

| 面向 | 分數 | 說明 |
|------|------|------|
| 功能覆蓋 | ✅ 6/6 | 所有要求的函式庫與元件皆已實作 |
| API 整合 | ⚠️ -2 | API 路由存在但未與 UI 整合。`/api/quant/market` 與 `/api/quant/strategy` 無前端呼叫端 |
| 指標覆蓋 | ✅ 5/5 | MA/EMA/RSI/MACD/布林帶五種指標皆實作 |
| 錯誤處理 | ⚠️ -1 | TradePanel 有基本錯誤訊息（餘額不足），但 KLineChart 無 data 為空時的錯誤邊界 |
| 載入狀態 | ⚠️ -1 | quant/page.tsx 的 klineData 載入有顯示「載入中…」，但無骨架屏 |

#### 土木結構（23 / 25）

| 面向 | 分數 | 說明 |
|------|------|------|
| 功能覆蓋 | ✅ 6/6 | 截面庫 / 梁引擎 / 柱引擎 / 荷載組合 / SVG 圖表 / 計算書皆已實作 |
| 結構計算廣度 | ✅ 3/3 | 簡支梁 / 固定梁 / 懸臂梁 + 集中載重 / 均佈載重 |
| 公式顯示 | ✅ | 快速參考區顯示三種梁的彎矩公式 + 尤拉公式 + k 係數 |
| 載入狀態 | ✅ | BeamForm 與 ColumnForm 有計算中 loading 狀態 |
| 柱計算選項 | ✅ | 四種 k 係數按鈕直觀選擇 |

### 正確性（Correctness）

#### 量化交易（24 / 25）

- **MA** ✅：標準 SMA 實現，O(n·period)，結果正確
- **EMA** ✅：標準遞迴公式 α = 2/(period+1)，第一個值使用 SMA 種子，正確
- **RSI** ✅：Wilder 平滑法正確實現，R₀ = 100 - 100/(1+初始平均漲/跌)。驗證：period=14, 需要 15 筆資料，第一筆結果位於 index=14
- **MACD** ✅：EMA12 - EMA26 對齊正確，Signal = EMA9(MACD) 對齊正確，histogram 計算正確
- **布林帶** ✅：中軌 MA(period)，上/下軌 = 中軌 ± k×σ（母體標準差）
- **lightweight-charts 整合** ✅：`createChart` → `addCandlestickSeries` → `setData` 流程正確；新增 `priceScale("rsi")`、`priceScale("macd")` 於副圖層
- **持倉成本計算** ✅：加倉使用加權平均成本 `(C₁Q₁ + C₂Q₂)/(Q₁+Q₂)`，正確
- **-1**：MACD 柱狀圖（histogram）雖有計算但未繪製於圖表上，為功能不完整

#### 土木結構（20 / 25）

- **梁反力/剪力/彎矩** ✅：反力計算使用靜力平衡（ΣFy=0, ΣM=0），剪力與彎矩疊加邏輯正確；對典型載重情況驗證（簡支梁集中 P 於跨中：Mmax = PL/4 ✅；全跨 UDL：Mmax = wL²/8 ✅）
- **懸臂梁計算** ✅：固定端在左側，M(x) = -wx²/2 驗證通過
- **固定梁計算** ✅：使用相同的疊加邏輯
- **尤拉公式** ✅：Pcr = π²EI/(kL)²，單位轉換正確（cm⁴ → mm⁴ ×10⁴，cm → mm ×10）
- **AISC ASD** ✅：`calcAllowableStress()` 兩區段公式正確，Cc = √(2π²E/fy)
- **荷載組合** ✅：10 組 LRFD 組合係數符合台灣建築物結構設計規範
- **型鋼數據** ✅：20 種 H 型鋼數據合理（與手算粗略驗證偏差 <5%，屬 fillet radius 補償範圍）

- **❌ 撓度計算單位錯誤（-3）**：`beam.ts:310` 公式 `(totalDelta * 1e6) / EI` 中：
  - `totalDelta` = Σ(P×1000 × a²b²/(3L))，單位 N·m³（P:kN→N, a,b,L:m）
  - `EI` = E(N/mm²) × I(mm⁴)，單位 N·mm²
  - 正確轉換：1 m³ = 10⁹ mm³，應為 `× 1e9` 而非 `× 1e6`
  - 結果：撓度值低估 1000 倍（例如實際 5mm 顯示為 0.005mm）
  - 此為**單位轉換錯誤**，非演算法錯誤。由於撓度不參與安全驗算（安全判定僅基於應力），不影響結構安全判定，但顯示值不正確。

- **❌ 撓度固定斷面（-2）**：`beam.ts:312` 固定使用 `I_assumed = 2.04e8 mm⁴`（H300×300），即使選用 H100×100 仍使用同樣慣性矩。正確做法應使用 `section?.Ix`（若有提供斷面）或回傳無因次變形比。

### 可維護性（Maintainability）

#### 量化交易（23 / 25）

| 優點 | 說明 |
|------|------|
| ✅ 純函數設計 | `indicators.ts` 中所有指標函數皆為 pure function，無副作用 |
| ✅ TypeScript 嚴格 | 所有函數均含完整型別標註與泛型 |
| ✅ JSDoc 註解 | 每個函數含參數/回傳值/範例說明 |
| ✅ 組件單一職責 | Ticker/KLineChart/TradePanel 各司其職 |
| ✅ 自訂 Hook 替代 | 使用 `useMemo`/`useCallback` 優化渲染 |

| 可改進 | 說明 |
|--------|------|
| ⚠️ 指標常數未抽離 | MA20/MA60/EMA12 等週期數字 hardcode 在 KLineChart.tsx 中 |
| ⚠️ 圖表重建策略 | 切換指標頻繁重建 DOM 圖表，可改用 series visibility toggle |

#### 土木結構（23 / 25）

| 優點 | 說明 |
|------|------|
| ✅ 純函數計算引擎 | `beam.ts` / `column.ts` / `load.ts` 所有計算函數為 pure function |
| ✅ 型別安全 | `HBeam`/`BeamResult`/`ColumnResult`/`BeamLoad` 等介面完整定義 |
| ✅ JSDoc 含範例 | `column.ts:35-39` 含 `@example` 可執行範例 |
| ✅ 結構化程式碼 | 內部輔助函數 `calcReactions`/`calcShearAt`/`calcMomentAt`/`calcDeflectionAt` 拆分合理 |
| ✅ 常數集中 | `E`、`SAFETY_FACTOR`、`FY` 等定義於檔案頂部 |

| 可改進 | 說明 |
|--------|------|
| ⚠️ 撓度函數缺乏文件 | `calcDeflectionAt` 無 JSDoc，註解說明「簡化疊加」但不明確說明限制 |
| ⚠️ 懸臂梁反力結構 | `calcReactions` 對懸臂梁將彎矩存入 `reactions.right` 欄位（非力），但該值未被使用，屬死碼 |

### 測試與驗證（Testing & Verification）

#### 量化交易（0 / 25）

**無單元測試**：`src/lib/quant/` 下無 `__tests__/` 目錄。

應測試的關鍵函數：

| 函數 | 測試案例數（建議） | 關鍵測試 |
|------|-------------------|---------|
| `calcMA` | 4+ | 正常週期、period=1、data 長度<period、全零序列 |
| `calcEMA` | 4+ | 標準遞迴、大週期、遞增序列（驗證追蹤延遲） |
| `calcRSI` | 5+ | 連續上漲（RSI=100）、連續下跌（RSI=0）、震盪市場、period 邊界、與已知資料比對 |
| `calcMACD` | 3+ | MACD 零軸交叉、黃金交叉/死亡交叉、與已知資料比對 |
| `calcBollinger` | 3+ | 標準差計算、常數序列（std=0 → 上下軌重合）、單一數據點 |
| `market.ts` | 3+ | 種子可重現性、K 線 open=prevClose 一致、volume 正整數 |
| `store.ts` | 5+ | 加倉平均成本、部分平倉、localStorage 不可用降級、餘額扣減 |

#### 土木結構（0 / 25）

**無單元測試**：`src/lib/civil/` 下無 `__tests__/` 目錄。

應測試的關鍵函數：

| 函數 | 測試案例數（建議） | 關鍵測試 |
|------|-------------------|---------|
| `calcBeam`（簡支梁） | 6+ | 跨中集中載重（Mmax=PL/4 ✅）、全跨 UDL（Mmax=wL²/8 ✅）、偏心集中載重、多載重疊加、零載重（錯誤）、超長跨距 |
| `calcBeam`（懸臂梁） | 4+ | 端點集中載重（Mmax=PL ✅）、全跨 UDL（Mmax=wL²/2 ✅）、部分 UDL、組合載重 |
| `calcBeam`（固定梁） | 3+ | 跨中集中載重（Mmax=PL/8 ✅）、全跨 UDL（Mmax=wL²/12 ✅） |
| `calcColumn` | 5+ | 短柱（低 λ、非彈性挫屈）、長柱（高 λ、彈性挫屈）、安全/不安全案例、k=0.5/0.7/1.0/2.0、邊界載重 |
| `calcAllCombinations` | 3+ | 單一載重、多載重混合、無對應載重類型（factor=0） |
| `findHBeam` | 3+ | 恰好符合、超過需求、無符合（回傳 null） |

---

## 3. 各項評分總表

| 任務 | 完整性 | 正確性 | 可維護性 | 測試與驗證 | 總分 | 判定 |
|------|--------|--------|---------|-----------|------|------|
| **TASK-004~006（量化交易）** | 21 | 24 | 23 | 0 | **68** | ❌ **不合格** |
| **TASK-007~009（土木結構）** | 23 | 20 | 23 | 0 | **66** | ❌ **不合格** |

> **合格門檻：90 分**。兩個任務均未達標，主要失分來自**完全缺乏單元測試**以及土木結構的**撓度計算單位錯誤**。

---

## 4. 必須修復項目

### P0 — 嚴重錯誤（須立即修復）

| # | 檔案 | 問題 | 修復建議 |
|---|------|------|---------|
| P0-1 | `beam.ts:310` | 撓度單位轉換錯誤：`1e6` → `1e9` | 將 `(totalDelta * 1e6) / EI` 改為 `(totalDelta * 1e9) / EI` |
| P0-2 | `beam.ts:312` | 撓度固定使用 H300×300 之慣性矩 | 改為讀取實際 `section?.Ix`（若有提供），否則回傳 NaN 或 0 |

### P1 — 測試覆蓋（必須補上）

| # | 檔案 | 建議 |
|---|------|------|
| P1-1 | `src/lib/quant/__tests__/indicators.test.ts` | 新增 20+ 測試案例覆蓋 MA/EMA/RSI/MACD/布林帶 |
| P1-2 | `src/lib/quant/__tests__/market.test.ts` | 新增 3+ 測試案例（種子可重現性、K 線結構） |
| P1-3 | `src/lib/quant/__tests__/store.test.ts` | 新增 5+ 測試案例（加倉平均成本、平倉、邊界條件） |
| P1-4 | `src/lib/civil/__tests__/beam.test.ts` | 新增 15+ 測試案例（三種支承 × 兩種載重 × 已知解比對） |
| P1-5 | `src/lib/civil/__tests__/column.test.ts` | 新增 5+ 測試案例（尤拉公式比對、AISC ASD 驗證） |
| P1-6 | `src/lib/civil/__tests__/load.test.ts` | 新增 3+ 測試案例（組合計算、最不利組合篩選） |
| P1-7 | `src/lib/civil/__tests__/section.test.ts` | 新增 3+ 測試案例（findHBeam、getHBeamByName） |

### P2 — 功能改善（建議修復）

| # | 檔案 | 建議 |
|---|------|------|
| P2-1 | `KLineChart.tsx` | MACD 圖增加 histogram 柱狀圖（使用 `addHistogramSeries`） |
| P2-2 | `KLineChart.tsx` | 改為 series visibility toggle，避免整圖重建 |
| P2-3 | `section.ts:24` | 將「約 20 種」改為「20 種」 |
| P2-4 | `beam.ts` | `calcDeflectionAt()` 加上 JSDoc，說明「簡化近似，僅供參考」 |

---

## 5. 總結

**量化交易（TASK-004~006）總分 68/100 ❌ 不合格。**

- **優點**：五種技術指標演算法全部正確實現（MA/EMA/RSI/MACD/布林帶），lightweight-charts 整合正確，交易面板功能完整，三欄響應式佈局合理。
- **致命問題**：完全無單元測試（測試項 0/25），導致總分無法達標。

**土木結構（TASK-007~009）總分 66/100 ❌ 不合格。**

- **優點**：20 種 H 型鋼資料庫齊全，梁內力計算（反力/剪力/彎矩）演算法正確，尤拉公式與 AISC ASD 容許應力正確，10 組台灣規範荷載組合完善，SVG 圖表與計算書品質良好。
- **致命問題**：
  1. 撓度計算單位轉換錯誤（`1e6` 應為 `1e9`），導致顯示值偏差 ×1000 — **演算法正確但單位錯誤**
  2. 撓度固定使用 H300×300 慣性矩，不隨選用斷面改變
  3. 完全無單元測試（測試項 0/25）

**兩個任務皆因缺乏測試與土木結構的單位錯誤未能達標。** 建議優先：
1. 修復 `beam.ts` 撓度單位錯誤（2 行變更）
2. 建立 `vitest` 測試框架（如 TASK-002cd 返工序幕），補上量化交易 30+ 案 + 土木結構 25+ 案測試
3. 測試全數通過後重新評分
