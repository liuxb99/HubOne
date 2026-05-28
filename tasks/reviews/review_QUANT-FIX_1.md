# QUANT-FIX 評分報告

**日期**: 2025-01-XX  
**評審範圍**: `src/lib/quant/market.ts`, `src/components/quant/Ticker.tsx`, `src/app/quant/page.tsx`  
**關聯元件**: `src/components/quant/TradePanel.tsx`

---

## 評分摘要

| 評分項目 | 分數 | 狀態 |
|----------|------|------|
| 1. generateHistory symbol 差異化 | **5/5** ✅ | 完善 |
| 2. 台股顯示正確性 | **5/5** ✅ | 完善 |
| 3. Ticker 高亮 activeSymbol | **5/5** ✅ | 完善 |
| 4. 交易面板價格跟隨 | **5/5** ✅ | 完善 |
| 5. 程式碼品質 | **4/5** ⚠️ | 1 處可改進 |
| **總分** | **24/25 (96%)** | |

---

## 逐項分析

### 1. generateHistory 是否根據不同 symbol 產生不同數據？ ✅ 5/5

**結論**: 完美實現。

- `generateHistory(symbol, count)` 接收 symbol 參數（`market.ts:97`）。
- 透過 `seedFromSymbol(symbol)` 將 symbol 字串的 ASCII 碼加總作為隨機種子（`market.ts:84-86`），再呼叫 `resetSeed(seed)` 重置 RNG（`market.ts:101`）。
- 每個 symbol 有獨立的 `BASE_PRICE_MAP` 起始價格（`market.ts:42-55`）：
  - BTC/USDT → 42000, 2330.TW → 1080, 2308.TW → 380, 等。
- 頁面初始化時 `useEffect` 依賴 `[activeSymbol]`（`page.tsx:52-54`），切換股票時重新呼叫 `generateHistory(activeSymbol, 200)`，確保圖表數據跟隨切換。

**範例**: BTC/USDT 與 2330.TW 會產生完全不同的 K 線序列（不同種子、不同 basePrice）。

---

### 2. 台股是否正確顯示在交易對列表中？ ✅ 5/5

**結論**: 台股完整顯示、分組正確。

- **頁面交易對列表** (`page.tsx:12-30`)：5 檔台股皆以 `2330.TW` 等格式定義，`category: "tw-stock"`, `categoryLabel: "台股"`。
- **圖示與標籤**：台積電 🔬、鴻海 🏭、聯發科 💎、中華電 📡、台達電 ⚙️。
- **分組邏輯** (`page.tsx:40-52`)：`PAIR_GROUPS` 按 category 分組，左側邊欄依序顯示「加密貨幣 → 美股 → 台股」。
- **行情數據** (`market.ts:53-57`)：`BASE_PRICE_MAP` 包含所有 5 檔台股，`generatePairs()` 會正確產生價格。
- **Ticker 報價條**：透過 `generatePairs()` 統一渲染，台股同樣出現在滾動條中。

---

### 3. Ticker 是否高亮當前股票？ ✅ 5/5

**結論**: 正確實作。

- `Ticker.tsx` 接收 `activeSymbol?: string` prop（`Ticker.tsx:13-15`）。
- 渲染時逐一比對 `p.symbol === activeSymbol`（`Ticker.tsx:85`）。
- 高亮效果：
  - 背景色：`bg-emerald-900/20`（`Ticker.tsx:90-91`）
  - 文字色：`text-emerald-400` vs 一般 `text-zinc-300`（`Ticker.tsx:94-96`）
- `QuantDashboard` 傳遞 `<Ticker activeSymbol={activeSymbol} />`（`page.tsx:95`），state 切換即觸發重渲染。
- 雙倍數據滾動（`displayPairs = [...pairs, ...pairs]`）會造成每個 symbol 出現兩次且都高亮，這是 CSS 動畫的慣用技巧，行為正確。

---

### 4. 交易面板價格是否跟隨更新？ ✅ 5/5

**結論**: 價格跟隨 symbol 切換與即時更新。

- **Symbol 切換**：`QuantDashboard` 的 `activeSymbol` state 改變 → `useEffect` 重新產生 `klineData` → `currentPrice`（`useMemo`，取最後一根 close）自動更新 → `TradePanel` 接收新的 `symbol` 與 `currentPrice` prop（`page.tsx:180`）。
- **即時 tick**：每 3 秒 `setInterval` 追加 K 線 → `klineData` 更新 → `currentPrice` 更新 → 交易面板價格數字更新。
- **TradePanel 內部** (`TradePanel.tsx`): 使用 `currentPrice` 顯示價格、計算下單成本、計算持倉盈虧（`getPnL` 函數）。
- **頁面 Header 價格**（`page.tsx:128-139`）同樣跟隨，與交易面板一致。

---

### 5. 程式碼品質 ⚠️ 4/5

**優點**:
- 完整 TypeScript 型別定義（`KLine`, `PairInfo`, `TickerItem`, `TradePanelProps`）。
- 合理的元件拆分：`Ticker` / `KLineChart` / `TradePanel` / 頁面層。
- 使用合適的 React hooks（`useMemo` 計算價格、`useCallback` 穩定回呼、`useEffect` 管理 side effect）。
- 隨機種子設計精巧：`seedFromSymbol()` 將 symbol 映射為整數種子，確保可重現性。

**可改進處**:

1. **`handleReconnect` 冗餘賦值** (`page.tsx:72-76`)：
   ```typescript
   const handleReconnect = useCallback(() => {
     setWsError(false);
     setIsConnected(true);          // ← 第一次
     setTimeout(() => setIsConnected(true), 500);  // ← 第二次，多餘
   }, []);
   ```
   `setIsConnected(true)` 被呼叫兩次，第二次在 setTimeout 中為無作用。建議移除 setTimeout 行，或改為確實模擬重連延遲（例如先設 false 再設 true）。

2. **`generateNextKLine` 未使用 symbol 參數** (`market.ts:120-136`)：
   該函數只依賴前一根 K 線推算下一根，不接收 symbol — 這在已有歷史數據的情境下合理，但若有初始啟動需產生第一根 K 線的場景會缺少 base price 參考。目前無實際問題，因 `generateHistory` 已負責初始化。

---

## 總評

| 項目 | 分數 |
|------|------|
| 功能性 | 10/10 — 四項需求全部正確實現 |
| 正確性 | 10/10 — 邊界情況處理得當 |
| 程式碼品質 | 4/5 — 整體優良，僅 1 處冗餘邏輯 |
| **總分** | **24/25 (96%)** |

修復完全符合預期。建議修正 `handleReconnect` 中多餘的 `setTimeout` 呼叫（`page.tsx:75`）以提升程式碼簡潔度。
