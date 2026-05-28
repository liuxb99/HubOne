# Phase 2：量化交易 + 土木結構 功能深化計劃

> **技術棧**: Next.js 16（App Router）+ TypeScript + Tailwind CSS v4 + lightweight-charts  
> **專案狀態**: Phase 1 已完成（基礎架構、設計系統、UI 元件庫、10 款遊戲）
> **量化交易**: 從佔位頁面 → 真實 K 線圖、技術指標、模擬交易儀表板  
> **土木結構**: 從佔位頁面 → 結構計算工具（梁/柱/荷載組合/計算書）

---

## 目錄結構目標（Phase 2 新增/修改）

```
src/
├── lib/
│   ├── quant/                          ← 新增
│   │   ├── indicators.ts               # 技術指標庫
│   │   ├── market.ts                   # 行情數據產生器
│   │   └── __tests__/
│   │       ├── indicators.test.ts      # 指標單元測試
│   │       └── market.test.ts          # 數據產生器測試
│   ├── civil/                          ← 新增
│   │   ├── section.ts                  # 截面資料庫
│   │   ├── beam.ts                     # 梁計算引擎
│   │   ├── column.ts                   # 柱計算引擎
│   │   ├── load.ts                     # 荷載組合
│   │   └── __tests__/
│   │       ├── beam.test.ts
│   │       ├── column.test.ts
│   │       └── load.test.ts
│   └── ...                             # 既有檔案維持不變
├── components/
│   ├── quant/                          ← 新增
│   │   ├── KLineChart.tsx              # K 線圖（lightweight-charts）
│   │   ├── TradePanel.tsx              # 交易面板
│   │   ├── Ticker.tsx                  # 即時行情 Ticker
│   │   └── PairList.tsx                # 交易對列表（左欄）
│   ├── civil/                          ← 新增
│   │   ├── BeamDiagram.tsx             # SVG 梁示意圖/彎矩/剪力/變形圖
│   │   ├── CalcReport.tsx              # 計算書元件
│   │   ├── BeamForm.tsx                # 梁參數輸入表單
│   │   ├── ColumnForm.tsx              # 柱參數輸入表單
│   │   └── LoadComboPanel.tsx          # 荷載組合面板
│   └── ...                             # 既有元件維持不變
├── app/
│   ├── quant/
│   │   ├── page.tsx                    ← 改寫為三欄儀表板
│   │   ├── layout.tsx                  # 維持不變
│   │   └── loading.tsx                 # 維持不變
│   ├── civil/
│   │   ├── page.tsx                    ← 改寫為結構計算工具入口
│   │   ├── layout.tsx                  # 維持不變
│   │   └── loading.tsx                 # 維持不變
│   └── api/
│       └── civil/
│           └── calculate/route.ts      ← 改寫為結構計算 API
└── hooks/
    └── ...                             # 維持不變（useLocalStorage 已被量化面板使用）
```

---

## 任務分解總覽

```
Phase 2 ─┬─ TASK-004  量化交易核心函式庫
          ├─ TASK-005  量化交易前端元件
          ├─ TASK-006  量化交易儀表板整合
          ├─ TASK-007  土木結構核心函式庫
          ├─ TASK-008  土木結構前端元件
          └─ TASK-009  土木結構工具頁面整合
```

**依賴關係（DAG）：**

```
TASK-004 ──→ TASK-005 ──→ TASK-006
                                  (可並行)
TASK-007 ──→ TASK-008 ──→ TASK-009
```

- TASK-004 和 TASK-007 可**完全並行**（不同業務線）
- TASK-005 依賴 TASK-004（元件需要 indicators + market）
- TASK-006 依賴 TASK-005（儀表板需要 KLineChart + TradePanel + Ticker）
- TASK-008 依賴 TASK-007（前端元件需要 beam + column + load + section）
- TASK-009 依賴 TASK-008（頁面整合需要所有 civil 元件）

---

## TASK-004：量化交易核心函式庫

### TASK-004a — 技術指標庫（indicators.ts）

| 項目 | 內容 |
|------|------|
| **ID** | TASK-004a |
| **目標** | 實作 5 種常用技術指標的純函數計算 |
| **優先級** | P0 — 阻塞下游 |
| **預計工時** | 2h |
| **可並行** | 是（與 TASK-007 完全並行） |

**需要建立的檔案：**

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/lib/quant/indicators.ts` | 建立 | 技術指標純函數庫 |
| `src/lib/quant/__tests__/indicators.test.ts` | 建立 | 指標單元測試 |

**實作細節：**

```typescript
// src/lib/quant/indicators.ts — 核心介面與函數

// OHLC 資料點
export interface OHLC {
  time: number;        // Unix timestamp (seconds)
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// 計算結果型別
export interface MALine {
  time: number;
  value: number;
}

// === 函數簽名 ===
export function calcMA(data: OHLC[], period: number): MALine[]
export function calcEMA(data: OHLC[], period: number): MALine[]
export function calcRSI(data: OHLC[], period: number): { time: number; value: number }[]
export function calcMACD(data: OHLC[]): {
  macdLine: { time: number; value: number }[]
  signalLine: { time: number; value: number }[]
  histogram: { time: number; value: number }[]
}
export function calcBollinger(data: OHLC[], period: number, stdDev: number): {
  upper: MALine[]
  middle: MALine[]
  lower: MALine[]
}
```

**實作要點：**
- `calcMA`：滑動窗口平均，前 `period-1` 筆回傳 `null`（跳過）
- `calcEMA`：EMA = close × k + prevEMA × (1−k)，k = 2/(period+1)
- `calcRSI`：使用 Wilder 平滑法計算平均漲跌幅，RSI = 100 − 100/(1+RS)
- `calcMACD`：MACD = EMA(12) − EMA(26)，Signal = EMA(9) of MACD，Histogram = MACD − Signal
- `calcBollinger`：中軌 = MA，上下軌 = MA ± stdDev × 標準差
- 所有函數為純函數，無副作用，輸入輸出不變

**驗收標準：**
- [ ] `calcMA` 對 5 筆資料、period=3 回傳 3 個有效值
- [ ] `calcEMA` 對已知序列回傳正確的指數平滑值
- [ ] `calcRSI` 對連續上漲資料回傳 100
- [ ] `calcMACD` 回傳的 macdLine/signalLine/histogram 長度一致
- [ ] `calcBollinger` 上軌 ≥ 中軌 ≥ 下軌
- [ ] 所有函數在資料不足時回傳空陣列（不拋錯）
- [ ] 通過 `npx vitest run src/lib/quant/__tests__/indicators.test.ts`

---

### TASK-004b — 行情數據產生器（market.ts）

| 項目 | 內容 |
|------|------|
| **ID** | TASK-004b |
| **目標** | 實作隨機漫步 K 線生成器，提供模擬行情數據 |
| **優先級** | P0 — 阻塞下游 |
| **預計工時** | 1h |
| **依賴** | 無（但介面與 TASK-004a 的 OHLC 共用） |

**需要建立的檔案：**

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/lib/quant/market.ts` | 建立 | 行情數據產生器 |
| `src/lib/quant/__tests__/market.test.ts` | 建立 | 產生器測試 |

**實作細節：**

```typescript
// src/lib/quant/market.ts

export interface KLine {
  time: number;        // Unix timestamp (seconds) — 日線用當日 00:00 UTC
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TickerData {
  symbol: string;
  price: number;
  change: number;      // 絕對變動
  changePercent: number;
  high: number;
  low: number;
  volume: number;
}

// 交易對配置
export const SYMBOLS = [
  { symbol: "BTC/USDT", basePrice: 42000, volatility: 0.02 },
  { symbol: "ETH/USDT", basePrice: 2200, volatility: 0.025 },
  { symbol: "TSLA",     basePrice: 245, volatility: 0.03 },
  { symbol: "AAPL",     basePrice: 178, volatility: 0.015 },
  { symbol: "NVDA",     basePrice: 880, volatility: 0.035 },
] as const;

export function generateHistory(count: number, basePrice?: number, volatility?: number): KLine[]
export function generateNextKLine(prev: KLine, volatility?: number): KLine
export function generateTickerData(symbols?: typeof SYMBOLS): TickerData[]
```

**隨機漫步演算法：**
1. 從 `basePrice` 開始
2. 每根 K 線：`close = prevClose × (1 + N(0, volatility))`
3. `open = prevClose`（或 prevClose 加微小隨機）
4. `high = max(open, close) × (1 + abs(N(0, volatility/2)))`
5. `low = min(open, close) × (1 - abs(N(0, volatility/2)))`
6. `volume = baseVolume × (1 + N(0, 0.3))`，確保 > 0

**驗收標準：**
- [ ] `generateHistory(100)` 回傳 100 根 K 線
- [ ] 每根 K 線的 high ≥ max(open, close)，low ≤ min(open, close)
- [ ] 所有 close 值 > 0
- [ ] 所有 volume 值 > 0
- [ ] `generateNextKLine` 產生的 K 線與前一根時間連續
- [ ] `generateTickerData` 回傳 SYMBOLS 長度資料
- [ ] 通過單元測試

---

### TASK-004 依賴圖

```
TASK-004a (indicators.ts) ──┐
                              ├── TASK-005 (前端元件)
TASK-004b (market.ts) ──────┘
```

---

## TASK-005：量化交易前端元件

### TASK-005a — K 線圖元件（KLineChart.tsx）

| 項目 | 內容 |
|------|------|
| **ID** | TASK-005a |
| **目標** | 使用 lightweight-charts 實作可互動 K 線圖，支援技術指標疊加 |
| **優先級** | P0 |
| **預計工時** | 3h |
| **依賴** | TASK-004a（indicators）、TASK-004b（market） |

**需要建立的檔案：**

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/components/quant/KLineChart.tsx` | 建立 | K 線圖主元件 |
| `src/components/quant/__tests__/KLineChart.test.tsx` | 建立 | 元件測試（可選） |

**Props 介面：**

```typescript
interface KLineChartProps {
  data: KLine[];
  width?: number;
  height?: number;
  indicators?: {
    ma?: number[];        // 要顯示的 MA 週期陣列，如 [7, 25, 99]
    rsi?: boolean;
    macd?: boolean;
    bollinger?: boolean;
  };
}
```

**實作要點：**

1. **初始化圖表**：使用 `lightweight-charts` 的 `createChart`，傳入深色主題配置
2. **主圖（Candlestick Series）**：
   - 使用 `addCandlestickSeries` 繪製蠟燭圖
   - 蠟燭顏色：上漲 = `#26A69A`（綠），下跌 = `#EF5350`（紅）
   - 蠟燭寬度自適應
3. **成交量副圖**：
   - 使用 `addHistogramSeries` 置於底部（透過 price scale 分離）
   - 顏色同蠟燭圖方向色
4. **技術指標疊加**：
   - MA：使用 `addLineSeries`，分別為 7 週期（白）、25 週期（黃）、99 週期（紫）
   - RSI：新增副圖 `addLineSeries`，範圍 0-100，超買線 70（虛線）、超賣線 30（虛線）
   - MACD：新增副圖，MACD 線（藍）、信號線（橙）、柱狀圖（紅/綠）
   - 布林帶：使用 `addLineSeries` 繪製上/中/下三軌，帶半透明填充
5. **指標切換**：
   - 圖表上方按鈕列，點擊切換顯示/隱藏
   - 使用 React state 控制各指標可見性
6. **深色主題**：
   - 背景 `#0D1117`，文字 `#8B949E`，網格 `#1C2128`
   - crosshair 顏色 `#30363D`
7. **時間尺度**：
   - 支援滑鼠滾輪縮放、拖動平移
   - `timeScale().fitContent()` 初始適配

**驗收標準：**
- [ ] `createChart` 成功渲染，無控制台錯誤
- [ ] 蠟燭圖正確顯示 open/high/low/close
- [ ] 成交量副圖在底部顯示
- [ ] MA(7/25/99) 疊加在蠟燭圖上
- [ ] RSI 顯示在獨立副圖，有 70/30 參考線
- [ ] MACD 顯示在獨立副圖
- [ ] 布林帶三軌顯示
- [ ] 指標切換按鈕可控制各指標顯示/隱藏
- [ ] 滑鼠縮放、拖動平移正常
- [ ] 圖表響應式（隨容器寬度變化）

---

### TASK-005b — 交易面板（TradePanel.tsx）

| 項目 | 內容 |
|------|------|
| **ID** | TASK-005b |
| **目標** | 實作模擬交易面板，支援買入/賣出、持倉管理、localStorage 持久化 |
| **優先級** | P0 |
| **預計工時** | 2h |
| **依賴** | TASK-004b（market — 需要 KLine 型別與價格） |

**需要建立的檔案：**

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/components/quant/TradePanel.tsx` | 建立 | 交易面板元件 |

**實作要點：**

```typescript
interface Position {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
}

interface TradePanelProps {
  symbol: string;
  currentPrice: number;
  onTrade?: (type: "buy" | "sell", symbol: string, quantity: number, price: number) => void;
}
```

1. **當前價格顯示**：大字顯示當前價格（漲跌顏色），24h 漲跌百分比
2. **買入/賣出分頁**：
   - Tab 切換買入/賣出模式
   - 數量輸入（數字輸入框，有快速按鈕 25%/50%/75%/100%）
   - 下單按鈕（買入為綠色，賣出為紅色）
3. **持倉列表**：
   - 表格顯示所有持倉：交易對、庫存數量、均價、現價、損益（金額+百分比）
   - 損益負數為紅色，正數為綠色
   - 每行可點擊「賣出」按鈕
4. **交易記錄**：
   - 持倉使用 `useLocalStorage<Position[]>("quant-positions", [])` 持久化
   - 交易完成後更新持倉清單與 localStorage
5. **邏輯**：
   - 買入：創建新持倉或追加（重新計算均價）
   - 賣出：減少持倉數量，歸零則移除
   - 不允許賣出超過持有數量
   - 不允許負數或零數量

**驗收標準：**
- [ ] 輸入數量後點擊買入，持倉列表出現對應記錄
- [ ] 再次買入同一交易對，均價正確重新計算
- [ ] 賣出後持倉數量減少，歸零時記錄移除
- [ ] localStorage 讀寫正常，重新整理頁面後持倉保留
- [ ] 快速按鈕（25%/50%/75%/100%）正確計算數量
- [ ] 損益金額與百分比計算正確
- [ ] 所有極端操作（負數、超賣）有防呆處理

---

### TASK-005c — 即時行情 Ticker（Ticker.tsx）

| 項目 | 內容 |
|------|------|
| **ID** | TASK-005c |
| **目標** | 實作橫向滾動報價條，模擬即時行情更新 |
| **優先級** | P1 |
| **預計工時** | 1.5h |
| **依賴** | TASK-004b（market — 需要 TickerData） |

**需要建立的檔案：**

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/components/quant/Ticker.tsx` | 建立 | 即時行情橫幅 |

**實作要點：**

```typescript
interface TickerProps {
  symbols?: TickerData[];
  interval?: number;  // 更新間隔毫秒，預設 3000
}
```

1. **佈局**：
   - 全寬橫向滾動條，固定在圖表上方
   - 使用 CSS `overflow-x: auto` + 隱藏滾動條（自訂 scrollbar）
   - 每個報價項顯示：交易對名稱、價格、漲跌百分比、方向箭頭（▲/▼）
2. **數據更新**：
   - 使用 `useEffect` + `setInterval` 每 3 秒調用 `generateTickerData` 更新價格
   - 價格變動時觸發 CSS 閃爍動畫（漲綠色閃、跌紅色閃）
3. **顏色規則**：
   - 價格上漲：文字綠色（`#26A69A`）
   - 價格下跌：文字紅色（`#EF5350`）
   - 價格不變：文字白色
4. **動畫**：
   - 數值變化時短暫閃爍背景色（0.5s 後淡出）
   - 使用 CSS animation 或 transition 實現

**驗收標準：**
- [ ] 5 個交易對（BTC/ETH/TSLA/AAPL/NVDA）全部顯示
- [ ] 每 3 秒價格自動更新
- [ ] 價格上漲時顯示綠色 + ▲，下跌時紅色 + ▼
- [ ] 數值變化有閃爍動畫
- [ ] 橫向滾動流暢

---

### TASK-005d — 交易對列表（PairList.tsx）

| 項目 | 內容 |
|------|------|
| **ID** | TASK-005d |
| **目標** | 實作左側交易對列表，支援選中切換與行情顯示 |
| **優先級** | P1 |
| **預計工時** | 1h |
| **依賴** | TASK-004b（market — TickerData） |

**需要建立的檔案：**

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/components/quant/PairList.tsx` | 建立 | 交易對列表元件 |

**實作要點：**

```typescript
interface PairListProps {
  symbols: TickerData[];
  activeSymbol: string;
  onSelect: (symbol: string) => void;
}
```

1. **列表顯示**：每個交易對顯示 symbol、最新價格、漲跌%、成交量
2. **選中高亮**：當前選中交易對有左側邊框高亮（螢光綠）
3. **搜尋過濾**：頂部搜尋框，輸入過濾交易對
4. **漲跌指示**：漲跌顏色 + 小圖示（▲/▼）

**驗收標準：**
- [ ] 所有交易對正確列出
- [ ] 點擊可選中，選中狀態有視覺反饋
- [ ] 搜尋框可即時過濾
- [ ] 價格與漲跌顏色正確

---

### TASK-005 依賴圖

```
TASK-004a (indicators) ──→ TASK-005a (KLineChart)
TASK-004b (market) ──┬──→ TASK-005a (KLineChart)
                      ├──→ TASK-005b (TradePanel)
                      ├──→ TASK-005c (Ticker)
                      └──→ TASK-005d (PairList)
```

---

## TASK-006：量化交易儀表板整合

### TASK-006a — 改寫量化首頁（page.tsx）

| 項目 | 內容 |
|------|------|
| **ID** | TASK-006a |
| **目標** | 將佔位頁面改為三欄即時儀表板，整合所有量化元件 |
| **優先級** | P0 |
| **預計工時** | 2h |
| **依賴** | TASK-005a, TASK-005b, TASK-005c, TASK-005d |

**需要修改的檔案：**

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/app/quant/page.tsx` | 改寫 | 從佔位頁面改為三欄儀表板 |

**佈局設計：**

```
┌──────────────────────────────────────────────────┐
│  📊 量化交易  [即時行情 | K線圖表 | 策略編輯 ...]  │  ← SubNav
├──────────────────────────────────────────────────┤
│  [Ticker 橫向滾動報價條]                           │  ← Ticker.tsx
├──────────┬───────────────────────┬────────────────┤
│ 交易對列表 │    K 線圖 + 指標切換    │   交易面板     │
│           │                       │               │
│ BTC/USDT  │  ┌─────────────────┐  │  BTC/USDT     │
│ ETH/USDT  │  │  Candlestick    │  │  $42,350.12   │
│ TSLA      │  │  + MA overlay   │  │  ┌────┐       │
│ AAPL      │  │                 │  │  │數量│       │
│ NVDA      │  ├─────────────────┤  │  ├────┤       │
│           │  │  成交量副圖      │  │  │買入│       │
│           │  ├─────────────────┤  │  └────┘       │
│           │  │  指標切換按鈕列   │  │               │
│           │  │ [MA][RSI][MACD] │  │ 持倉列表       │
│           │  └─────────────────┘  │  BTC 0.5 ...  │
│           │                       │  ETH 2.0 ...  │
├──────────┴───────────────────────┴────────────────┤
│  WebSocket 連線指示燈 (綠色脈動圓點)               │
└──────────────────────────────────────────────────┘
```

**實作要點：**

1. **狀態管理**（使用 React state，無需第三方）：
   - `activeSymbol: string` — 當前選中交易對（預設 BTC/USDT）
   - `klineData: KLine[]` — 當前 K 線資料（`useMemo` 依賴 activeSymbol）
   - `tickerData: TickerData[]` — ticker 行情（每 3 秒更新）
   - `positions: Position[]` — 持倉列表（由 TradePanel 內部管理）

2. **數據流**：
   - 頁面載入時呼叫 `generateHistory(200)` 產生初始 K 線
   - 切換交易對時重新產生 K 線
   - 使用 `useEffect` + `setInterval` 每秒更新最新價格（`generateNextKLine`）
   - Ticker 每 3 秒獨立更新

3. **WebSocket 指示燈**：
   - 保留現有綠色脈衝動畫
   - 文字改為「模擬行情」而非「資料服務」

4. **響應式設計**：
   - 桌面（≥1024px）：三欄佈局
   - 平板（768-1023px）：兩欄（交易對列表折疊為可切換側欄）
   - 手機（<768px）：單欄，Tab 切換視圖

5. **SubNav 保留**：維持現有次導航（即時行情/K線圖表/策略編輯/回測引擎/投資組合/模擬交易）

**驗收標準：**
- [ ] 三欄佈局正確渲染
- [ ] 切換交易對時 K 線圖和交易面板同步更新
- [ ] Ticker 橫向滾動正常
- [ ] 指標切換按鈕可控制圖表指標顯示
- [ ] 買入/賣出操作後持倉列表更新
- [ ] 連線指示燈顯示正常
- [ ] 手機/平板響應式佈局正確
- [ ] 無 TypeScript 錯誤，`npm run build` 成功

---

## TASK-007：土木結構核心函式庫

### TASK-007a — 截面資料庫（section.ts）

| 項目 | 內容 |
|------|------|
| **ID** | TASK-007a |
| **目標** | 建立 H 型鋼截面資料庫與 RC 斷面介面 |
| **優先級** | P0 — 阻塞下游 |
| **預計工時** | 1.5h |
| **可並行** | 是（與 TASK-004 完全並行） |

**需要建立的檔案：**

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/lib/civil/section.ts` | 建立 | 截面資料庫 |
| `src/lib/civil/__tests__/section.test.ts` | 建立 | 截面資料測試 |

**實作細節：**

```typescript
// src/lib/civil/section.ts

// H 型鋼截面
export interface HBeam {
  name: string;           // 標稱，如 "H100×100"
  height: number;         // 梁高 mm
  width: number;          // 翼板寬 mm
  webThick: number;       // 腹板厚 mm
  flangeThick: number;    // 翼板厚 mm
  area: number;           // 截面積 cm²
  Ix: number;             // 慣性矩 cm⁴
  Zx: number;             // 塑性模數 cm³
  weight: number;         // 單位重 kg/m
}

// 常用 H 型鋼資料庫（約 20 種）
export const H_BEAMS: HBeam[] = [
  // 輕型 H
  { name: "H100×100", height: 100, width: 100, webThick: 6,  flangeThick: 8,  area: 21.7,  Ix: 383,   Zx: 76.5,  weight: 17.0 },
  { name: "H125×125", height: 125, width: 125, webThick: 6.5,flangeThick: 9,  area: 30.3,  Ix: 839,   Zx: 134,   weight: 23.8 },
  { name: "H150×150", height: 150, width: 150, webThick: 7,  flangeThick: 10, area: 40.1, Ix: 1640,  Zx: 219,   weight: 31.5 },
  // ... 依此類推到 H900×300
  // 包含 H200×200, H250×250, H300×300, H350×350, H400×400,
  //        H500×200, H500×300, H600×200, H600×300,
  //        H700×300, H800×300, H900×300 等
];

// RC 矩形斷面
export interface RCSection {
  width: number;          // 寬 mm
  height: number;         // 高 mm
  cover: number;          // 保護層 mm
  rebar: RebarInfo[];     // 鋼筋配置
  stirrup: StirrupInfo;   // 箍筋
}

export interface RebarInfo {
  diameter: number;       // 直徑 mm (D10=9.53, D13=12.7, D16=15.9, D19=19.1, D22=22.2, D25=25.4, D29=28.6, D32=32.2, D36=35.8)
  count: number;          // 數量
  layer: "top" | "bottom" | "side";
}

export interface StirrupInfo {
  diameter: number;       // 箍筋直徑 mm
  spacing: number;        // 間距 mm
}

// 輔助函數
export function getHBeam(name: string): HBeam | undefined
export function getHBeamByIndex(index: number): HBeam
export function calcRCArea(section: RCSection): number        // RC 斷面積
export function calcRCInertia(section: RCSection): number     // RC 慣性矩（近似）
```

**資料來源：** 參考 CNS 規範 H 型鋼標準尺寸，使用實際工程常用型號。

**驗收標準：**
- [ ] `H_BEAMS` 包含至少 18 種 H 型鋼（H100×100 ~ H900×300）
- [ ] 每個截面所有數值欄位合理且符合工程常識
- [ ] `getHBeam("H300×300")` 回傳正確物件
- [ ] `getHBeam("INVALID")` 回傳 `undefined`
- [ ] `calcRCArea` 計算正確
- [ ] 通過單元測試

---

### TASK-007b — 梁計算引擎（beam.ts）

| 項目 | 內容 |
|------|------|
| **ID** | TASK-007b |
| **目標** | 實作梁內力計算引擎，含彎矩、剪力、撓度、斷面驗算 |
| **優先級** | P0 — 阻塞下游 |
| **預計工時** | 3h |
| **依賴** | TASK-007a（section — 需要 HBeam/RCSection） |

**需要建立的檔案：**

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/lib/civil/beam.ts` | 建立 | 梁計算引擎 |
| `src/lib/civil/__tests__/beam.test.ts` | 建立 | 梁計算測試 |

**實作細節：**

```typescript
// src/lib/civil/beam.ts

export type SupportType = "simply" | "fixed" | "cantilever";

export interface BeamLoad {
  type: "point" | "udl" | "moment";
  value: number;        // kN 或 kN/m 或 kN·m
  position?: number;    // 集中力/彎矩位置 (m)，從左端算起
  start?: number;       // 分佈載重起點 (m)
  end?: number;         // 分佈載重終點 (m)
}

export interface BeamResult {
  // 輸入摘要
  length: number;
  supportType: SupportType;
  loads: BeamLoad[];
  section?: string;

  // 反力
  reactions: { left: number; right: number };

  // 極值
  maxMoment: number;
  maxShear: number;
  maxDeflection: number;
  maxMomentPosition: number;
  maxShearPosition: number;
  maxDeflectionPosition: number;

  // 曲線（用於繪圖）
  momentPoints: { x: number; m: number }[];     // 至少 100 點
  shearPoints: { x: number; v: number }[];
  deflectionPoints: { x: number; d: number }[];

  // 斷面驗算
  isSafe: boolean;
  utilizationRatio: number;  // 使用率 Mmax/Mn
  requiredZx: number;        // 需要之塑性模數 cm³
}

export function calcBeam(
  length: number,         // 跨度 (m)
  supportType: SupportType,
  loads: BeamLoad[],
  section?: HBeam         // 可選，用於斷面驗算
): BeamResult

// 內部輔助
function calcReactions(...): { left: number; right: number }
function calcMomentAt(x: number, ...): number
function calcShearAt(x: number, ...): number
function calcDeflectionAt(x: number, ...): number
function checkSection(moment: number, section: HBeam): { isSafe: boolean; ratio: number }
```

**計算方法：**

1. **反力計算**：根據支座類型與載重類型，用力平衡方程式求解
   - 簡支梁：ΣM = 0，ΣFy = 0
   - 固定端：額外考慮固定端彎矩
   - 懸臂梁：固定端反力 = 所有載重總和
2. **斷面內力**：分段積分法，在梁上取 ≥100 個計算點
   - V(x) = Σ(反力) − Σ(載重積分)
   - M(x) = Σ(V(x) 積分)
   - δ(x) = 雙重積分法 (EIδ'' = −M)
3. **斷面驗算**：
   - Mn = Zx × Fy（Fy = 345 MPa 為 SN400 鋼材降伏強度）
   - 使用率 = Mmax / Mn（需 ≤ 1.0）
   - 若未提供斷面，跳過驗算

**驗收標準：**
- [ ] 簡支梁單一集中力：最大彎矩在載重點，值 = Pab/L
- [ ] 簡支梁均佈載重：最大彎矩在跨中，值 = wL²/8
- [ ] 懸臂梁端點集中力：最大彎矩在固定端，值 = PL
- [ ] 多個載重疊加正確
- [ ] `momentPoints`、`shearPoints`、`deflectionPoints` 各有至少 100 點
- [ ] 有斷面驗算時 `isSafe` 正確判斷
- [ ] 通過單元測試

---

### TASK-007c — 柱計算引擎（column.ts）

| 項目 | 內容 |
|------|------|
| **ID** | TASK-007c |
| **目標** | 實作柱軸壓計算，含尤拉公式與長細比驗算 |
| **優先級** | P0 — 阻塞下游 |
| **預計工時** | 1.5h |
| **依賴** | TASK-007a（section — 需要 HBeam） |

**需要建立的檔案：**

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/lib/civil/column.ts` | 建立 | 柱計算引擎 |
| `src/lib/civil/__tests__/column.test.ts` | 建立 | 柱計算測試 |

**實作細節：**

```typescript
// src/lib/civil/column.ts

export interface ColumnResult {
  // 輸入摘要
  length: number;          // m
  axialLoad: number;       // kN
  section: string;
  k: number;               // 有效長度係數

  // 截面性質
  area: number;            // cm²
  I: number;               // cm⁴
  radius: number;          // 迴轉半徑 cm

  // 長細比分析
  slenderness: number;     // λ = kL / r
  isShortColumn: boolean;  // λ < 40 視為短柱

  // 強度
  criticalLoad: number;    // 臨界負載 kN (Pcr)
  allowableLoad: number;   // 容許負載 kN (Pcr / safetyFactor)
  safetyFactor: number;    // 安全係數
  isSafe: boolean;
  utilizationRatio: number;
}

export function calcColumn(
  length: number,       // m
  axialLoad: number,    // kN
  section: HBeam,
  k?: number            // 有效長度係數，預設 1.0
): ColumnResult
```

**計算方法：**
1. **迴轉半徑**：r = √(I/A)
2. **長細比**：λ = kL / r（L 單位換算為 cm 與 r 一致）
3. **分類**：
   - 短柱（λ < 40）：Pcr = Fy × A（材料強度控制）
   - 中長柱（40 ≤ λ < 120）：Pcr = Fy × A × (1 − 0.5 × (λ/Cc)²)，Cc = √(2π²E/Fy)
   - 長柱（λ ≥ 120）：Pcr = π²EI / (kL)²（尤拉公式）
4. **安全係數**：
   - 短柱：1.67
   - 中長柱/長柱：1.92
5. **容許負載**：Pa = Pcr / safetyFactor
6. **驗算**：utilizationRatio = P / Pa，≤ 1.0 為安全

**驗收標準：**
- [ ] 對已知截面、長度、載重，計算出正確長細比
- [ ] 尤拉公式計算正確（Pcr = π²EI/(kL)²）
- [ ] 短柱/中長柱/長柱分類正確
- [ ] `isSafe` 在載重超過容許值時為 `false`
- [ ] 通過單元測試

---

### TASK-007d — 荷載組合（load.ts）

| 項目 | 內容 |
|------|------|
| **ID** | TASK-007d |
| **目標** | 依據台灣建築技術規則建立荷載組合計算 |
| **優先級** | P1 |
| **預計工時** | 1h |
| **依賴** | 無 |

**需要建立的檔案：**

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/lib/civil/load.ts` | 建立 | 荷載組合計算 |
| `src/lib/civil/__tests__/load.test.ts` | 建立 | 荷載組合測試 |

**實作細節：**

```typescript
// src/lib/civil/load.ts

export type LoadType = "DL" | "LL" | "WL" | "EL" | "SL" | "TL";

export interface LoadItem {
  type: LoadType;
  value: number;    // kN/m² 或 kN
  description?: string;
}

export interface LoadCombinationDef {
  name: string;
  formula: string;
  factors: Partial<Record<LoadType, number>>;
}

// 依據台灣建築技術規則（建築物耐震設計規範）
export const LOAD_COMBINATIONS: LoadCombinationDef[] = [
  // 極限狀態 (USD)
  { name: "USD-1", formula: "1.4DL",        factors: { DL: 1.4 } },
  { name: "USD-2", formula: "1.2DL + 1.6LL", factors: { DL: 1.2, LL: 1.6 } },
  { name: "USD-3", formula: "1.2DL + 1.0LL + 1.6WL", factors: { DL: 1.2, LL: 1.0, WL: 1.6 } },
  { name: "USD-4", formula: "0.9DL + 1.6WL", factors: { DL: 0.9, WL: 1.6 } },
  { name: "USD-5", formula: "1.2DL + 1.0LL + 1.0EL", factors: { DL: 1.2, LL: 1.0, EL: 1.0 } },
  { name: "USD-6", formula: "0.9DL + 1.0EL", factors: { DL: 0.9, EL: 1.0 } },
  // 工作應力 (ASD)
  { name: "ASD-1", formula: "DL + LL", factors: { DL: 1.0, LL: 1.0 } },
  { name: "ASD-2", formula: "DL + 0.75LL + 0.75WL", factors: { DL: 1.0, LL: 0.75, WL: 0.75 } },
];

export function calcCombination(loads: LoadItem[], combo: LoadCombinationDef): number
export function calcAllCombinations(loads: LoadItem[]): { name: string; formula: string; value: number }[]
```

**驗收標準：**
- [ ] 8 種荷載組合依台灣建築技術規則定義
- [ ] `calcCombination` 對已知輸入回傳正確數值
- [ ] `calcAllCombinations` 對每種組合回傳計算結果
- [ ] 處理缺失載重型別（如無 WL 時 WL 係數視為 0）
- [ ] 通過單元測試

---

### TASK-007 依賴圖

```
TASK-007a (section) ──┬──→ TASK-007b (beam)
                       └──→ TASK-007c (column)
TASK-007d (load) ────────（獨立，與其他無依賴）
                              └──→ TASK-008 (前端元件)
```

---

## TASK-008：土木結構前端元件

### TASK-008a — SVG 繪圖元件（BeamDiagram.tsx）

| 項目 | 內容 |
|------|------|
| **ID** | TASK-008a |
| **目標** | 使用 SVG 繪製梁示意圖、彎矩圖、剪力圖、變形圖 |
| **優先級** | P0 — 阻塞下游 |
| **預計工時** | 3h |
| **依賴** | TASK-007b（beam — 需要 BeamResult 的座標點） |

**需要建立的檔案：**

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/components/civil/BeamDiagram.tsx` | 建立 | SVG 繪圖元件 |

**Props 介面：**

```typescript
interface BeamDiagramProps {
  result: BeamResult | null;
  mode: "beam" | "moment" | "shear" | "deflection";  // 顯示模式
  width?: number;
  height?: number;
}
```

**實作要點：**

1. **梁示意圖（mode="beam"）**：
   - 矩形梁體（可視長度比例）
   - 支座符號：三角形（簡支）、斜線網格（固定端）、自由端無符號
   - 載重標示：箭頭（集中力 P）、均佈箭頭陣列（UDL）、彎矩箭頭
   - 尺寸標註（跨度 L）
2. **彎矩圖（mode="moment"）**：
   - 正彎矩在下方（土木工程慣例，或可選切換）
   - 使用 path 繪製平滑曲線
   - 標註最大值與位置
   - 填充半透明顏色
3. **剪力圖（mode="shear"）**：
   - 階梯狀曲線
   - 標註最大值與位置
4. **變形圖（mode="deflection"）**：
   - 誇大變形量（否則肉眼不可見）
   - 虛線表示原始位置
   - 實線表示變形後
5. **共用功能**：
   - 座標軸與網格線（淺灰色）
   - 標註關鍵數值（字型大小適中）
   - SVG viewBox 自適應
   - 支援深色/淺色主題（透過 props 或 CSS 變數）

**SVG 結構範例：**
```tsx
<svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
  {/* 網格 */}
  <g className="stroke-zinc-700/30">
    {gridLines.map(...)}
  </g>
  {/* 曲線 */}
  <path
    d={generatePath(points)}
    className="fill-none stroke-emerald-500 stroke-2"
  />
  {/* 標註 */}
  <text ...>{maxValue}</text>
</svg>
```

**驗收標準：**
- [ ] 四種模式（beam/moment/shear/deflection）各自正確繪製
- [ ] 梁示意圖顯示支座與載重
- [ ] 彎矩圖最大值標註正確
- [ ] 剪力圖變化點正確
- [ ] 變形圖跨中最大撓度位置正確
- [ ] SVG 響應式（隨容器寬度縮放）
- [ ] 支援深色主題

---

### TASK-008b — 計算書元件（CalcReport.tsx）

| 項目 | 內容 |
|------|------|
| **ID** | TASK-008b |
| **目標** | 產生 HTML 格式計算書，可列印 |
| **優先級** | P1 |
| **預計工時** | 2h |
| **依賴** | TASK-007b（beam — BeamResult）、TASK-007c（column — ColumnResult） |

**需要建立的檔案：**

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/components/civil/CalcReport.tsx` | 建立 | 計算書元件 |

**Props 介面：**

```typescript
interface CalcReportProps {
  type: "beam" | "column";
  input: Record<string, unknown>;   // 輸入參數
  result: BeamResult | ColumnResult;
}
```

**實作要點：**

1. **頁首**：
   - 標題「結構計算書」
   - 日期（自動產生）
   - 案名/編號（可編輯，使用 props 或 state）
2. **輸入參數摘要**：
   - 表格顯示所有輸入參數
   - 梁/柱類型、跨度/長度、載重、斷面
3. **計算結果**：
   - 表格顯示關鍵結果（反力、最大彎矩、最大剪力、最大撓度、長細比、臨界載重等）
   - 使用 HTML `<table>` 格式，乾淨易讀
4. **斷面驗證**：
   - 顯示使用率
   - 安全/不安全標示（綠色/紅色）
   - 使用率進度條
5. **可列印**：
   - CSS `@media print` 樣式
   - 隱藏背景、導航、按鈕
   - 分頁控制（page-break）
6. **匯出**（加分項，非必要）：
   - 瀏覽器列印對話框（`window.print()`）

**驗收標準：**
- [ ] 輸入參數摘要正確顯示
- [ ] 計算結果以表格呈現
- [ ] 斷面驗證安全/不安全一目了然
- [ ] `@media print` 樣式正確（隱藏非必要元素）
- [ ] 支援梁計算書與柱計算書兩種模式

---

### TASK-008c — 梁參數輸入表單（BeamForm.tsx）

| 項目 | 內容 |
|------|------|
| **ID** | TASK-008c |
| **目標** | 梁計算的參數輸入表單 |
| **優先級** | P0 — 阻塞下游 |
| **預計工時** | 1.5h |
| **依賴** | TASK-007a（section — H_BEAMS）、TASK-007b（beam — SupportType/BeamLoad） |

**需要建立的檔案：**

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/components/civil/BeamForm.tsx` | 建立 | 梁參數表單 |

**實作要點：**

```typescript
interface BeamFormProps {
  onCalculate: (params: BeamFormData) => void;
  loading?: boolean;
}

interface BeamFormData {
  length: number;
  supportType: "simply" | "fixed" | "cantilever";
  loads: BeamLoad[];
  section: string | null;  // H_BEAMS 中的 name，null=不指定
}
```

1. **基本參數**：
   - 跨度輸入（number，單位 m，步長 0.1，範圍 1-50）
   - 支座類型選擇（簡支梁/固定梁/懸臂梁，使用 Toggle 或 Select）
2. **載重列表**：
   - 可新增多個載重
   - 每個載重：類型選擇（集中力/均佈載重/彎矩）、數值輸入、位置輸入
   - 載重項目可刪除
3. **斷面選擇**：
   - 下拉選單，從 H_BEAMS 載入
   - 選中後顯示 Ix、Zx、weight 等資訊
   - 可不指定（僅計算內力）
4. **計算按鈕**：
   - 主要 CTA 按鈕「開始計算」
   - 輸入驗證（所有必要欄位已填）
   - loading 狀態

**驗收標準：**
- [ ] 可輸入跨度（1-50m）
- [ ] 三種支座類型可選擇
- [ ] 可新增/刪除多個載重
- [ ] 載重類型切換時顯示對應輸入欄位
- [ ] 斷面下拉選單列出 H_BEAMS
- [ ] 表單驗證在無效輸入時顯示錯誤
- [ ] 點擊計算後呼叫 onCalculate

---

### TASK-008d — 柱參數輸入表單（ColumnForm.tsx）

| 項目 | 內容 |
|------|------|
| **ID** | TASK-008d |
| **目標** | 柱計算的參數輸入表單 |
| **優先級** | P0 — 阻塞下游 |
| **預計工時** | 1h |
| **依賴** | TASK-007a（section — H_BEAMS）、TASK-007c（column — calcColumn） |

**需要建立的檔案：**

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/components/civil/ColumnForm.tsx` | 建立 | 柱參數表單 |

**實作要點：**

```typescript
interface ColumnFormProps {
  onCalculate: (params: ColumnFormData) => void;
  loading?: boolean;
}

interface ColumnFormData {
  length: number;       // m
  axialLoad: number;    // kN
  section: string;      // H_BEAMS 中的 name
  k: number;            // 有效長度係數
}
```

1. **基本參數**：
   - 柱長度輸入（m）
   - 軸向壓力輸入（kN）
2. **斷面選擇**：
   - 同 BeamForm，從 H_BEAMS 載入
   - 顯示截面性質
3. **有效長度係數 k**：
   - 預設 1.0
   - 常用值快速選擇：0.5（固定-固定）、0.7（固定-鉸接）、1.0（鉸接-鉸接）、2.0（懸臂）

**驗收標準：**
- [ ] 柱長度與軸力可輸入
- [ ] 斷面下拉選單正確
- [ ] k 係數四種常用值可快速選擇
- [ ] 點擊計算後呼叫 onCalculate

---

### TASK-008e — 荷載組合面板（LoadComboPanel.tsx）

| 項目 | 內容 |
|------|------|
| **ID** | TASK-008e |
| **目標** | 荷載組合輸入與計算結果顯示 |
| **優先級** | P1 |
| **預計工時** | 1.5h |
| **依賴** | TASK-007d（load — LOAD_COMBINATIONS/calcAllCombinations） |

**需要建立的檔案：**

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/components/civil/LoadComboPanel.tsx` | 建立 | 荷載組合面板 |

**實作要點：**

```typescript
interface LoadComboPanelProps {
  onResult?: (results: { name: string; value: number }[]) => void;
}
```

1. **荷載輸入**：
   - 六種荷載類型（DL/LL/WL/EL/SL/TL）輸入
   - 說明文字（DL=靜載重, LL=活載重, WL=風載重, EL=地震載重, SL=雪載重, TL=溫度載重）
2. **組合計算**：
   - 點擊計算後顯示所有組合結果
   - 表格顯示：組合名稱、公式、計算值
   - 最大值高亮顯示
3. **視覺**：
   - 乾淨的表格佈局
   - 最大組合值醒目提示

**驗收標準：**
- [ ] 六種荷載類型可輸入數值
- [ ] 點擊計算後顯示 8 種組合結果
- [ ] 最大值自動高亮
- [ ] 公式顯示正確

---

### TASK-008 依賴圖

```
TASK-007a (section) ──┬──→ TASK-008c (BeamForm)
                       └──→ TASK-008d (ColumnForm)
TASK-007b (beam) ──┬──→ TASK-008a (BeamDiagram)
                    └──→ TASK-008b (CalcReport) ← 也依賴 TASK-007c
TASK-007c (column) ─┴──→ TASK-008b (CalcReport)
TASK-007d (load) ──────→ TASK-008e (LoadComboPanel)
```

---

## TASK-009：土木結構工具頁面整合

### TASK-009a — 改寫土木首頁（page.tsx）

| 項目 | 內容 |
|------|------|
| **ID** | TASK-009a |
| **目標** | 將佔位頁面改為功能完整的結構計算工具入口 |
| **優先級** | P0 |
| **預計工時** | 2.5h |
| **依賴** | TASK-008a, TASK-008b, TASK-008c, TASK-008d, TASK-008e |

**需要修改的檔案：**

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/app/civil/page.tsx` | 改寫 | 從佔位頁面改為結構計算工具 |
| `src/app/api/civil/calculate/route.ts` | 實作 | （可選）後端計算 API，提供資料持久化 |

**佈局設計：**

```
┌──────────────────────────────────────────────────┐
│  🏗️ 土木結構  [梁設計 | 柱設計 | 板設計 | ...]   │  ← SubNav
├──────────┬───────────────────────┬────────────────┤
│ 功能選單  │    參數輸入 + 計算結果    │  SVG 示意圖   │
│          │                       │                │
│ 📐 梁計算 │  ┌─ 參數輸入 ───────┐  │  ┌──────────┐ │
│ 🏛️ 柱計算 │  │ 跨度: [___] m    │  │  │ 梁示意圖  │ │
│ ⚖️ 荷載組合│  │ 支座: [簡支]     │  │  │          │ │
│          │  │ 載重: +新增       │  │  │          │ │
│          │  │ 斷面: H300×300    │  │  ├──────────┤ │
│          │  │ [開始計算]        │  │  │ M 圖     │ │
│          │  └──────────────────┘  │  │          │ │
│          │  ┌─ 計算結果 ───────┐  │  ├──────────┤ │
│          │  │ 最大彎矩: 125 kN·m│  │  │ V 圖     │ │
│          │  │ 最大剪力: 50 kN  │  │  │          │ │
│          │  │ 最大撓度: 8.2 mm │  │  └──────────┘ │
│          │  │ 斷面: ✅ 安全     │  │                │
│          │  │ (使用率 0.72)    │  │                │
│          │  └──────────────────┘  │                │
├──────────┴───────────────────────┴────────────────┤
│  📄 計算書 (CalcReport)                           │
│  [列印計算書]                                     │
└──────────────────────────────────────────────────┘
```

**實作要點：**

1. **狀態管理**：
   - `activeTool: "beam" | "column" | "load"` — 當前選中工具（預設 "beam"）
   - `beamResult: BeamResult | null` — 梁計算結果
   - `columnResult: ColumnResult | null` — 柱計算結果
   - `loadResults: LoadComboResult[] | null` — 荷載組合結果

2. **左側功能選單**：
   - 三個主要功能按鈕（梁計算/柱計算/荷載組合）
   - 選中狀態高亮（橙色主題色）
   - 每個按鈕附圖示

3. **中側內容區**：
   - 根據 `activeTool` 渲染對應表單
   - 表單提交後執行計算，更新結果
   - 結果顯示區塊：關鍵數值卡片（最大彎矩、最大剪力、最大撓度、安全狀態）

4. **右側 SVG 圖示區**：
   - 根據 `activeTool` 顯示對應圖表
   - 梁模式：四按鈕切換（梁圖/彎矩/剪力/變形）
   - 柱模式：柱示意圖（載重+斷面標註）
   - 荷載模式：條形圖顯示各組合結果比較

5. **底部計算書**：
   - 僅在有計算結果時顯示
   - 可展開/收起
   - 「列印計算書」按鈕

6. **API 路由**（可選）：
   - `src/app/api/civil/calculate/route.ts` — POST 接受計算參數，回傳結果
   - 提供資料庫儲存與查詢功能（進階，非 Phase 2 必要）

**驗收標準：**
- [ ] 三種工具（梁/柱/荷載組合）可切換
- [ ] 梁計算：輸入參數 → 計算結果 → SVG 圖表正確
- [ ] 柱計算：輸入參數 → 計算結果 → SVG 圖表正確
- [ ] 荷載組合：輸入荷載 → 顯示所有組合結果
- [ ] 右側 SVG 圖表根據工具切換
- [ ] 底部計算書顯示且可列印
- [ ] 手機/平板響應式佈局
- [ ] 無 TypeScript 錯誤，`npm run build` 成功

---

## 執行順序（建議）

### 第一波（可完全並行）

```
┌─────────────────────────────────────┐
│ 波次 1：核心函式庫（同時執行）        │
│                                     │
│ 子代理 A：TASK-004 (量化)           │
│   TASK-004a → TASK-004b             │
│                                     │
│ 子代理 B：TASK-007 (土木)           │
│   TASK-007a → TASK-007b + TASK-007c│
│            → TASK-007d (獨立)       │
└─────────────────────────────────────┘
```

### 第二波（依賴第一波完成）

```
┌─────────────────────────────────────┐
│ 波次 2：前端元件（同時執行）          │
│                                     │
│ 子代理 A：TASK-005 (量化元件)        │
│   TASK-005a → TASK-005b → TASK-005c│
│            → TASK-005d              │
│                                     │
│ 子代理 B：TASK-008 (土木元件)        │
│   TASK-008c + TASK-008d (表單)      │
│         → TASK-008a (SVG)           │
│         → TASK-008b + TASK-008e     │
└─────────────────────────────────────┘
```

### 第三波（依賴第二波完成）

```
┌─────────────────────────────────────┐
│ 波次 3：頁面整合（同時執行）          │
│                                     │
│ 子代理 A：TASK-006 (量化儀表板)      │
│                                     │
│ 子代理 B：TASK-009 (土木工具頁面)    │
└─────────────────────────────────────┘
```

---

## 預計總工時

| 任務 | 工時 | 說明 |
|------|------|------|
| TASK-004a | 2h | indicators.ts 五種指標 |
| TASK-004b | 1h | market.ts 隨機漫步產生器 |
| TASK-005a | 3h | KLineChart.tsx lightweight-charts |
| TASK-005b | 2h | TradePanel.tsx 交易面板 |
| TASK-005c | 1.5h | Ticker.tsx 橫向滾動報價條 |
| TASK-005d | 1h | PairList.tsx 交易對列表 |
| TASK-006a | 2h | 改寫 quant/page.tsx |
| TASK-007a | 1.5h | section.ts H 型鋼資料庫 |
| TASK-007b | 3h | beam.ts 梁計算引擎 |
| TASK-007c | 1.5h | column.ts 柱計算引擎 |
| TASK-007d | 1h | load.ts 荷載組合 |
| TASK-008a | 3h | BeamDiagram.tsx SVG 繪圖 |
| TASK-008b | 2h | CalcReport.tsx 計算書 |
| TASK-008c | 1.5h | BeamForm.tsx 梁表單 |
| TASK-008d | 1h | ColumnForm.tsx 柱表單 |
| TASK-008e | 1.5h | LoadComboPanel.tsx 荷載面板 |
| TASK-009a | 2.5h | 改寫 civil/page.tsx |
| **總計** | **31h** | 約 4 個全職工作天 |

### 並行加速效果

由於量化（TASK-004~006）與土木（TASK-007~009）可完全並行：

| 維度 | 串行 | 並行（2 代理） |
|------|------|---------------|
| 量化總工時 | 12.5h | 12.5h |
| 土木總工時 | 18h | 18h |
| **實際日曆時間** | **31h** | **~18h** |

---

## 風險與注意事項

### 技術風險

| 風險 | 影響 | 應對 |
|------|------|------|
| `lightweight-charts` React 整合 | 圖表可能不響應 state 變化 | 使用 `useRef` 管理 chart instance，`useEffect` 監聽 data 變化後呼叫 `setData` |
| 隨機漫步 K 線價格偏離過大 | 圖表顯示異常 | 限制步長為 volatility 的 3 倍標準差範圍內 |
| SVG 繪圖在深色主題下看不清 | 計算書可讀性下降 | 使用 CSS 變數控制顏色，測試淺色/深色兩種模式 |
| 梁計算多載重疊加 | 彎矩圖形狀複雜 | 使用疊加原理（superposition），逐個載重計算後疊加 |
| localStorage 在 SSR 下報錯 | 頁面 crash | 使用 `useLocalStorage` hook（已內建 SSR 安全檢查） |

### 依賴注意事項

- `useLocalStorage` hook 已存在於 `src/hooks/useLocalStorage.ts`，TradePanel 直接引用即可
- `lightweight-charts` 已安裝於 `package.json`，無需額外安裝
- 量化交易和土木結構的函式庫檔案應放置在各自目錄下，不要跨目錄引用

### 測試策略

- 核心計算邏輯（indicators、market、beam、column、load）必須有單元測試
- 前端元件建議使用 React Testing Library 測試（非強制，但計算邏輯部分必須測試）
- 測試檔案放置在 `src/lib/quant/__tests__/` 與 `src/lib/civil/__tests__/` 目錄下
