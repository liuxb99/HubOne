# 一人公司 — 技術架構計劃書

> 建立時間：2026-05-25
> 計畫版本：v1.0
> 適用場景：純前端 SPA，HTML + CSS + JavaScript，GitHub Pages / Vercel 部署

---

## 目錄

1. [目錄 / 檔案結構](#1-目錄--檔案結構)
2. [路由設計方案](#2-路由設計方案)
3. [設計系統（CSS 變數、主題架構）](#3-設計系統)
4. [資料存儲策略（IndexedDB Schema）](#4-資料存儲策略)
5. [各業務線關鍵元件與檔案分配](#5-各業務線關鍵元件與檔案分配)
6. [建議開發順序（依賴關係分析）](#6-建議開發順序)
7. [關鍵技術決策記錄](#7-關鍵技術決策記錄)

---

## 1. 目錄 / 檔案結構

```
one-person-company/
├── index.html                          # SPA 入口（所有路由由此載入）
├── manifest.json                       # PWA manifest（離線支援）
├── sw.js                               # Service Worker（離線快取策略）
├── favicon.svg                         # 網站圖示
│
├── assets/
│   ├── fonts/                          # 自訂字體（Noto Sans TC, 等寬字體）
│   │   ├── noto-sans-tc-regular.woff2
│   │   └── jetbrains-mono-regular.woff2
│   ├── icons/                          # SVG 圖示集（業務線圖示、功能圖示）
│   │   ├── nav-quant.svg
│   │   ├── nav-civil.svg
│   │   ├── nav-market.svg
│   │   ├── nav-ai.svg
│   │   ├── nav-ppt.svg
│   │   ├── nav-game.svg
│   │   └── ... (約 30 個常用 SVG)
│   └── images/                         # 靜態圖片（首頁背景、預設頭像等）
│       ├── hero-bg.svg
│       ├── default-avatar.svg
│       └── logo.svg
│
├── css/
│   ├── base.css                        # CSS reset、全域基礎樣式、排版
│   ├── variables.css                   # CSS 自訂屬性（主題變數，含深色/淺色）
│   ├── utilities.css                   # 工具類（spacing、flex、grid、display helper）
│   ├── components.css                  # 通用元件（按鈕、卡片、表單、Modal、Toast）
│   ├── layout.css                      # 佈局系統（導航欄、側邊欄、主內容區）
│   ├── animations.css                  # 共用關鍵影格動畫
│   └── pages/                          # 各頁面特有樣式
│       ├── home.css
│       ├── quant.css
│       ├── civil.css
│       ├── marketplace.css
│       ├── ai-tools.css
│       ├── ppt-editor.css
│       └── games.css
│
├── js/
│   ├── app.js                          # 應用入口：路由初始化、全局註冊、首屏載入
│   ├── router.js                       # Hash-based SPA 路由引擎
│   ├── store.js                        # 全局反應式狀態管理（Proxy 實作）
│   ├── theme.js                        # 深色/淺色主題切換邏輯（localStorage 持久化）
│   ├── i18n.js                         # 多國語系（繁體中文為主，擴充保留）
│   ├── db/
│   │   ├── index.js                    # IndexedDB 連線管理（DB 開啟/升級/migration）
│   │   ├── schemas.js                  # 所有 Object Store 的 Schema 定義
│   │   └── repositories/              # 各業務線的資料存取層（CRUD 封裝）
│   │       ├── marketplace-repo.js     # 二手交易資料操作
│   │       ├── game-repo.js            # 遊戲高分紀錄操作
│   │       └── settings-repo.js        # 用戶設定操作
│   ├── utils/
│   │   ├── dom.js                      # DOM 輔助函數（createElement、query、delegate）
│   │   ├── format.js                   # 格式化工具（日期、貨幣、數字、百分比）
│   │   ├── debounce.js                 # 防抖與節流
│   │   ├── export.js                   # 匯出工具（HTML → PDF、Markdown → HTML）
│   │   └── validators.js              # 表單驗證器
│   ├── components/                     # 共用 UI 元件（每個元件 = 一個 class 或 factory）
│   │   ├── Modal.js
│   │   ├── Toast.js
│   │   ├── Dropdown.js
│   │   ├── Tabs.js
│   │   ├── DataTable.js
│   │   ├── Carousel.js
│   │   ├── ConfirmDialog.js
│   │   └── LoadingSpinner.js
│   ├── pages/                          # 頁面控制器（每個業務線一個子目錄）
│   │   ├── home/
│   │   │   └── HomePage.js             # 首頁儀表板
│   │   ├── quant/
│   │   │   ├── QuantPage.js            # 量化交易主頁（路由分派）
│   │   │   ├── ChartView.js            # K線圖渲染（Canvas）
│   │   │   ├── IndicatorEngine.js      # 技術指標計算引擎
│   │   │   ├── BacktestEngine.js       # 回測引擎（可選 Web Worker）
│   │   │   ├── StrategyEditor.js       # 策略編輯器
│   │   │   ├── PaperTrading.js         # 虛擬交易
│   │   │   └── mockData.js            # 模擬行情數據生成器
│   │   ├── civil/
│   │   │   ├── CivilPage.js            # 土木結構主頁
│   │   │   ├── BeamSolver.js           # 梁內力計算
│   │   │   ├── ColumnSolver.js         # 柱內力計算
│   │   │   ├── SlabSolver.js           # 板內力計算
│   │   │   ├── SectionDB.js            # 型鋼/鋼筋截面資料庫
│   │   │   ├── LoadCombiner.js         # 荷載組合計算
│   │   │   ├── ReportGenerator.js      # 計算書產生器（HTML → PDF）
│   │   │   └── SectionViewer.js        # 截面 SVG 示意圖繪製
│   │   ├── marketplace/
│   │   │   ├── MarketPage.js           # 二手交易主頁
│   │   │   ├── ProductList.js          # 商品列表（含搜尋/篩選/分頁）
│   │   │   ├── ProductDetail.js        # 商品詳情
│   │   │   ├── ProductForm.js          # 商品刊登/編輯表單
│   │   │   ├── CartView.js             # 購物車
│   │   │   ├── OrderManager.js         # 訂單管理
│   │   │   ├── ReviewSystem.js         # 評價系統
│   │   │   └── Messaging.js            # 站內訊息
│   │   ├── ai-tools/
│   │   │   ├── AIToolsPage.js          # AI 工具主頁
│   │   │   ├── TextGenerator.js        # 文字生成
│   │   │   ├── ImageGenerator.js       # 圖片生成展示（模擬）
│   │   │   ├── CodeAssistant.js        # 程式碼助手
│   │   │   ├── DocSummarizer.js        # 文件摘要
│   │   │   └── PromptOptimizer.js      # 提示詞優化
│   │   ├── ppt-editor/
│   │   │   ├── PPTEditorPage.js        # PPT 編輯器主頁
│   │   │   ├── SlideCanvas.js          # 投影片畫布（拖放編輯）
│   │   │   ├── Toolbar.js              # 編輯器工具列
│   │   │   ├── SlidePanel.js           # 投影片縮圖列表
│   │   │   ├── PropertyPanel.js        # 屬性面板
│   │   │   ├── TemplateManager.js      # 模板管理器
│   │   │   ├── ChartElement.js         # 圖表元素
│   │   │   ├── TableElement.js         # 表格元素
│   │   │   ├── PPTExporter.js          # 匯出為 HTML/PDF
│   │   │   └── MarkdownImporter.js     # Markdown 導入
│   │   └── games/
│   │       ├── GamesPage.js            # 遊戲大廳
│   │       ├── TetrisGame.js           # 俄羅斯方塊
│   │       ├── SnakeGame.js            # 貪食蛇
│   │       ├── MinesweeperGame.js      # 踩地雷
│   │       ├── Game2048.js             # 2048
│   │       ├── BreakoutGame.js         # 打磚塊
│   │       └── ScoreBoard.js           # 高分紀錄板
│   └── workers/                        # Web Workers（可選，計算密集型任務）
│       ├── backtest.worker.js          # 回測計算 Worker
│       └── indicator.worker.js         # 技術指標批量計算 Worker
│
└── tests/                              # 手動測試 HTML（純前端無測試框架）
    ├── test-router.html
    ├── test-theme.html
    └── test-db.html
```

### 檔案命名與組織原則

| 規則 | 說明 |
|------|------|
| **PascalCase** | JavaScript class / 元件檔案（如 `ChartView.js`） |
| **kebab-case** | CSS 檔案、資產檔案（如 `nav-quant.svg`） |
| **camelCase** | 工具函數檔案（如 `debounce.js`） |
| 每頁一個目錄 | 頁面相應 JS 放在 `js/pages/<name>/` 下 |
| 業務邏輯與渲染分離 | 計算引擎與 UI 元件分開檔案 |

---

## 2. 路由設計方案

### 2.1 路由引擎（Hash-based）

使用 `window.location.hash` 實現 SPA 路由，無需伺服器端設定。

```
#/                          → 首頁儀表板
#/quant                     → 量化交易主頁
#/quant/chart/:symbol       → 特定標的 K 線圖
#/quant/backtest            → 回測模擬器
#/quant/strategy            → 策略編輯器
#/quant/paper-trading       → 虛擬交易
#/civil                     → 土木結構主頁
#/civil/beam                → 梁計算
#/civil/column              → 柱計算
#/civil/slab                → 板計算
#/civil/section-db          → 截面資料庫
#/civil/report              → 計算書
#/market                    → 二手交易主頁
#/market/products           → 商品列表
#/market/product/:id        → 商品詳情
#/market/product/new        → 刊登商品
#/market/product/edit/:id   → 編輯商品
#/market/cart               → 購物車
#/market/orders             → 訂單管理
#/market/messages           → 站內訊息
#/market/profile            → 賣家/買家個人頁
#/ai                        → AI 工具主頁
#/ai/text                   → 文字生成
#/ai/image                  → 圖片生成
#/ai/code                   → 程式碼助手
#/ai/summary                → 文件摘要
#/ai/prompt                 → 提示詞優化
#/ppt                       → PPT 編輯器主頁
#/ppt/new                   → 新建簡報
#/ppt/edit/:id              → 編輯簡報
#/ppt/templates             → 模板庫
#/games                     → 遊戲大廳
#/games/tetris              → 俄羅斯方塊
#/games/snake               → 貪食蛇
#/games/minesweeper         → 踩地雷
#/games/2048                → 2048
#/games/breakout            → 打磚塊
```

### 2.2 路由引擎實作策略

`js/router.js` 的設計要點：

```javascript
// 路由核心 API
class Router {
  constructor(routes, options);
  navigate(path);             // 程式化導航（更新 hash）
  start();                    // 啟動監聽 hashchange
  getCurrentRoute();          // 解析當前 hash 為 {path, params, query}
  addGuard(guardFn);          // 導航守衛（可用於離開提示、權限檢查）
}

// 路由規則定義格式
const routes = {
  '/':                        { view: HomePage,         title: '首頁' },
  '/quant':                   { view: QuantPage,        title: '量化交易' },
  '/quant/chart/:symbol':     { view: ChartView,        title: 'K線圖' },
  '/market/product/:id':      { view: ProductDetail,    title: '商品詳情' },
  // ... 其餘路由
};
```

### 2.3 延遲載入策略

- **首屏**（首頁）— 同步載入
- **非首屏** — 使用 `import()` 動態載入頁面 JS 與 CSS
- **共用元件**（Modal、Toast 等）— 首次使用時載入，緩存於全域
- 每個業務線的子頁面切換時，僅替換 `#main-content` 區域的 DOM

### 2.4 頁面生命週期

每個頁面控制器實作以下 hook：

| Hook | 時機 |
|------|------|
| `onMount()` | DOM 插入後初始化 |
| `onUnmount()` | 離開頁面時清理（清除 interval、移除監聽） |
| `onUpdate(params)` | 路由參數變化時（如同頁面切 tab） |

---

## 3. 設計系統

### 3.1 CSS 變數 — 主題架構

設計一個以 **CSS 自訂屬性**為核心的主題系統，支援深色/淺色無縫切換。

```css
/* css/variables.css — 淺色主題（預設） */
:root {
  /* ─── 色票系統 ─── */
  --color-primary:         #2563eb;   /* 主色（藍） */
  --color-primary-hover:   #1d4ed8;
  --color-primary-light:   #dbeafe;
  --color-secondary:       #7c3aed;   /* 輔助色（紫） */
  --color-secondary-hover: #6d28d9;
  --color-accent:          #f59e0b;   /* 強調色（金） */
  --color-success:         #10b981;   /* 成功 */
  --color-warning:         #f59e0b;   /* 警告 */
  --color-danger:          #ef4444;   /* 錯誤 */
  --color-info:            #3b82f6;   /* 資訊 */

  /* ─── 語意化表面色 ─── */
  --color-bg:              #ffffff;
  --color-bg-secondary:    #f8fafc;
  --color-bg-tertiary:     #f1f5f9;
  --color-surface:         #ffffff;
  --color-surface-hover:   #f8fafc;
  --color-border:          #e2e8f0;
  --color-border-light:    #f1f5f9;

  /* ─── 語意化文字色 ─── */
  --color-text:            #0f172a;
  --color-text-secondary:  #475569;
  --color-text-tertiary:   #94a3b8;
  --color-text-inverse:    #ffffff;
  --color-link:            var(--color-primary);

  /* ─── 陰影 ─── */
  --shadow-sm:  0 1px 2px rgba(0,0,0,0.05);
  --shadow-md:  0 4px 6px -1px rgba(0,0,0,0.1);
  --shadow-lg:  0 10px 15px -3px rgba(0,0,0,0.1);
  --shadow-xl:  0 20px 25px -5px rgba(0,0,0,0.1);

  /* ─── 圓角 ─── */
  --radius-sm:    4px;
  --radius-md:    8px;
  --radius-lg:    12px;
  --radius-xl:    16px;
  --radius-full:  9999px;

  /* ─── 間距（4 的倍數） ─── */
  --space-1:   4px;
  --space-2:   8px;
  --space-3:   12px;
  --space-4:   16px;
  --space-5:   20px;
  --space-6:   24px;
  --space-8:   32px;
  --space-10:  40px;
  --space-12:  48px;
  --space-16:  64px;

  /* ─── 字型 ─── */
  --font-sans:    'Noto Sans TC', system-ui, -apple-system, sans-serif;
  --font-mono:    'JetBrains Mono', 'Cascadia Code', monospace;
  --font-size-xs:  0.75rem;    /* 12px */
  --font-size-sm:  0.875rem;   /* 14px */
  --font-size-md:  1rem;       /* 16px */
  --font-size-lg:  1.125rem;   /* 18px */
  --font-size-xl:  1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;     /* 24px */
  --font-size-3xl: 1.875rem;   /* 30px */
  --font-size-4xl: 2.25rem;    /* 36px */

  /* ─── 行高 ─── */
  --line-height-tight:   1.25;
  --line-height-normal:  1.5;
  --line-height-relaxed: 1.75;

  /* ─── 字重 ─── */
  --font-weight-normal:  400;
  --font-weight-medium:  500;
  --font-weight-semibold: 600;
  --font-weight-bold:    700;

  /* ─── 佈局 ─── */
  --nav-height:           60px;
  --sidebar-width:        240px;
  --content-max-width:    1200px;
  --content-padding:      var(--space-6);

  /* ─── 過渡 ─── */
  --transition-fast:    150ms ease;
  --transition-normal:  250ms ease;
  --transition-slow:    400ms ease;

  /* ─── Z-index 堆疊 ─── */
  --z-dropdown:    100;
  --z-sticky:      200;
  --z-modal:       300;
  --z-toast:       400;
  --z-tooltip:     500;
}

/* ─── 深色主題 ─── */
[data-theme="dark"] {
  --color-primary:         #3b82f6;
  --color-primary-hover:   #60a5fa;
  --color-primary-light:   #1e3a5f;
  --color-secondary:       #a78bfa;
  --color-secondary-hover: #c4b5fd;

  --color-bg:              #0f172a;
  --color-bg-secondary:    #1e293b;
  --color-bg-tertiary:     #334155;
  --color-surface:         #1e293b;
  --color-surface-hover:   #334155;
  --color-border:          #334155;
  --color-border-light:    #1e293b;

  --color-text:            #f1f5f9;
  --color-text-secondary:  #94a3b8;
  --color-text-tertiary:   #64748b;
  --color-text-inverse:    #0f172a;
  --color-link:            var(--color-primary);

  --shadow-sm:  0 1px 2px rgba(0,0,0,0.3);
  --shadow-md:  0 4px 6px -1px rgba(0,0,0,0.4);
  --shadow-lg:  0 10px 15px -3px rgba(0,0,0,0.4);
  --shadow-xl:  0 20px 25px -5px rgba(0,0,0,0.4);
}
```

### 3.2 主題切換機制

- `js/theme.js` 管理主題狀態
- 存儲於 `localStorage('theme')`
- 預設跟隨系統偏好：`window.matchMedia('(prefers-color-scheme: dark)')`
- 切換時在 `<html>` 元素上設置 `data-theme="dark"` 或 `data-theme="light"`
- 切換動畫使用 `transition: background-color var(--transition-normal)` 實現平滑過渡

### 3.3 每個業務線的主題色（區分視覺識別）

| 業務線 | 主題色 HEX | CSS 變數 |
|--------|-----------|----------|
| 量化交易 | `#2563eb` 藍 | `--quant-color` |
| 土木結構 | `#dc2626` 紅 | `--civil-color` |
| 二手交易 | `#059669` 綠 | `--market-color` |
| AI 工具 | `#7c3aed` 紫 | `--ai-color` |
| 線上 PPT | `#ea580c` 橙 | `--ppt-color` |
| 經典遊戲 | `#eab308` 黃 | `--game-color` |

這些變數在 `variables.css` 中定義，用於各業務線的頂層導航標示、頁面 accent 元素。

### 3.4 響應式斷點

```css
/* 手機 (< 640px) */    @media (max-width: 639px) { ... }
/* 平板 (640-1023px) */ @media (min-width: 640px) and (max-width: 1023px) { ... }
/* 桌機 (≥ 1024px) */   @media (min-width: 1024px) { ... }
/* 大螢幕 (≥ 1440px) */ @media (min-width: 1440px) { ... }
```

---

## 4. 資料存儲策略

### 4.1 總體策略

| 儲存方式 | 用途 | 容量限制 |
|----------|------|----------|
| **IndexedDB** | 結構化業務資料（商品、訂單、訊息、遊戲紀錄、PPT 文件） | ~MB 級（瀏覽器配額） |
| **localStorage** | 簡單設定（主題偏好、語言、折疊狀態、最後瀏覽頁面） | ~5MB |
| **sessionStorage** | 暫時狀態（當前編輯但未儲存的內容） | 分頁關閉即消失 |
| **Cache API** | 靜態資源快取（透過 Service Worker） | 瀏覽器配額 |

### 4.2 IndexedDB Schema 設計

**資料庫名稱：** `OnePersonCompanyDB`
**版本：** 1（使用整數版本號，升級時在 `onupgradeneeded` 中處理 migration）

#### Object Store 一覽表

| Store 名稱 | Key Path | 索引 | 用途 |
|------------|----------|------|------|
| `products` | `id` | `category`, `price`, `createdAt`, `sellerId`, `status` | 商品資料 |
| `orders` | `id` | `buyerId`, `sellerId`, `status`, `createdAt` | 訂單 |
| `order_items` | `id` | `orderId` | 訂單明細 |
| `cart_items` | `id` | `userId` | 購物車項目 |
| `messages` | `id` | `conversationId`, `senderId`, `createdAt` | 站內訊息 |
| `conversations` | `id` | `participantIds`, `lastMessageAt` | 對話清單 |
| `reviews` | `id` | `productId`, `reviewerId`, `createdAt` | 評價 |
| `game_scores` | `id` | `gameType`, `score`, `playerName` | 遊戲高分紀錄 |
| `ppt_documents` | `id` | `updatedAt`, `templateId` | PPT 文件 |
| `app_settings` | `key` | — | 應用程式設定（key-value） |

#### 詳細 Schema

```javascript
// js/db/schemas.js

const DB_NAME = 'OnePersonCompanyDB';
const DB_VERSION = 1;

const STORES = {
  // ─── 二手交易 ───
  products: {
    keyPath: 'id',
    indexes: [
      { name: 'category',    keyPath: 'category',  options: { unique: false } },
      { name: 'price',       keyPath: 'price',     options: { unique: false } },
      { name: 'createdAt',   keyPath: 'createdAt', options: { unique: false } },
      { name: 'sellerId',    keyPath: 'sellerId',  options: { unique: false } },
      { name: 'status',      keyPath: 'status',    options: { unique: false } },
      { name: 'title',       keyPath: 'title',     options: { unique: false } },  // 全文搜尋用
    ],
    // 文件範例:
    // {
    //   id: 'uuid',
    //   title: '二手 iPhone 14 Pro',
    //   description: '9成新，附盒裝',
    //   price: 25000,
    //   category: '3C電子',
    //   images: ['data:image/...', ...],  // Base64 或 Blob URL
    //   sellerId: 'user-uuid',
    //   status: 'active' | 'sold' | 'deleted',
    //   createdAt: '2026-05-25T10:00:00Z',
    //   updatedAt: '2026-05-25T10:00:00Z',
    //   viewCount: 0,
    // }
  },

  orders: {
    keyPath: 'id',
    indexes: [
      { name: 'buyerId',    keyPath: 'buyerId',  options: { unique: false } },
      { name: 'sellerId',   keyPath: 'sellerId', options: { unique: false } },
      { name: 'status',     keyPath: 'status',   options: { unique: false } },
      { name: 'createdAt',  keyPath: 'createdAt', options: { unique: false } },
    ],
    // {
    //   id: 'uuid',
    //   orderNumber: 'ORD-20260525-001',
    //   buyerId: 'user-uuid',
    //   sellerId: 'user-uuid',
    //   items: [{ productId, title, price, quantity }],
    //   totalAmount: 25000,
    //   status: 'pending' | 'confirmed' | 'shipped' | 'completed' | 'cancelled',
    //   shippingInfo: { name, phone, address },
    //   createdAt: '2026-05-25T10:00:00Z',
    // }
  },

  cart_items: {
    keyPath: 'id',
    indexes: [
      { name: 'userId',     keyPath: 'userId',   options: { unique: false } },
    ],
    // {
    //   id: 'uuid',
    //   userId: 'user-uuid',
    //   productId: 'product-uuid',
    //   quantity: 1,
    //   addedAt: '2026-05-25T10:00:00Z',
    // }
  },

  messages: {
    keyPath: 'id',
    indexes: [
      { name: 'conversationId', keyPath: 'conversationId', options: { unique: false } },
      { name: 'senderId',       keyPath: 'senderId',       options: { unique: false } },
      { name: 'createdAt',      keyPath: 'createdAt',      options: { unique: false } },
    ],
    // {
    //   id: 'uuid',
    //   conversationId: 'conv-uuid',
    //   senderId: 'user-uuid',
    //   content: '請問還有貨嗎？',
    //   createdAt: '2026-05-25T10:00:00Z',
    //   read: false,
    // }
  },

  conversations: {
    keyPath: 'id',
    indexes: [
      { name: 'participantIds', keyPath: 'participantIds', options: { unique: false } },  // multiEntry
      { name: 'lastMessageAt',  keyPath: 'lastMessageAt',  options: { unique: false } },
    ],
    // {
    //   id: 'conv-uuid',
    //   participantIds: ['user-uuid-1', 'user-uuid-2'],
    //   lastMessage: '好的，謝謝',
    //   lastMessageAt: '2026-05-25T10:00:00Z',
    //   unreadCount: { 'user-uuid-1': 0, 'user-uuid-2': 1 },
    // }
  },

  reviews: {
    keyPath: 'id',
    indexes: [
      { name: 'productId',  keyPath: 'productId',  options: { unique: false } },
      { name: 'reviewerId', keyPath: 'reviewerId', options: { unique: false } },
      { name: 'createdAt',  keyPath: 'createdAt',  options: { unique: false } },
    ],
    // {
    //   id: 'uuid',
    //   productId: 'product-uuid',
    //   orderId: 'order-uuid',
    //   reviewerId: 'user-uuid',
    //   targetId: 'user-uuid',
    //   rating: 5,           // 1-5
    //   content: '商品品質很好，出貨快速！',
    //   createdAt: '2026-05-25T10:00:00Z',
    // }
  },

  // ─── 遊戲 ───
  game_scores: {
    keyPath: 'id',
    indexes: [
      { name: 'gameType',   keyPath: 'gameType', options: { unique: false } },
      { name: 'score',      keyPath: 'score',    options: { unique: false } },
    ],
    // {
    //   id: 'uuid',
    //   gameType: 'tetris' | 'snake' | 'minesweeper' | '2048' | 'breakout',
    //   playerName: '玩家一',
    //   score: 99999,
    //   difficulty: 'normal',
    //   playedAt: '2026-05-25T10:00:00Z',
    // }
  },

  // ─── PPT ───
  ppt_documents: {
    keyPath: 'id',
    indexes: [
      { name: 'updatedAt',  keyPath: 'updatedAt',  options: { unique: false } },
    ],
    // {
    //   id: 'uuid',
    //   title: '第三季財報簡報',
    //   templateId: 'business-blue',
    //   slides: [
    //     {
    //       id: 'slide-uuid',
    //       elements: [
    //         { type: 'text', x, y, w, h, content, fontSize, color, ... },
    //         { type: 'image', x, y, w, h, src, ... },
    //         { type: 'chart', x, y, w, h, chartType, data, ... },
    //         { type: 'table', x, y, w, h, rows, cols, data, ... },
    //       ],
    //       backgroundColor: '#ffffff',
    //       transition: 'fade',
    //     }
    //   ],
    //   createdAt: '2026-05-25T10:00:00Z',
    //   updatedAt: '2026-05-25T10:00:00Z',
    // }
  },

  // ─── 設定（key-value） ───
  app_settings: {
    keyPath: 'key',
    // {
    //   key: 'userProfile',
    //   value: { name: '小明', avatar: 'data:...', phone: '0912345678' },
    // }
  },
};
```

### 4.3 Repository 模式（資料存取層）

每個 Repository 封裝對特定 Store 的操作：

```javascript
// js/db/repositories/marketplace-repo.js
class ProductRepository {
  async getAll(filter = {})         // 列表（支援分頁、排序、篩選）
  async getById(id)                 // 單筆
  async create(data)                // 新增
  async update(id, data)            // 更新
  async delete(id)                  // 軟刪除
  async search(query, options)      // 全文搜尋
}
```

### 4.4 離線支援策略

- **Service Worker** (`sw.js`) 使用 Cache First 策略快取靜態資源（HTML、CSS、JS、字體、圖示）
- **IndexedDB** 本身即為離線儲存，所有 CRUD 皆離線可用
- **網路狀態監聽**：透過 `navigator.onLine` + `window.addEventListener('online'/'offline')` 在 UI 顯示離線提示

---

## 5. 各業務線關鍵元件與檔案分配

### 5.1 量化交易 (`js/pages/quant/`)

| 元件 | 檔案 | 核心技術 | 依賴 |
|------|------|----------|------|
| K線圖渲染 | `ChartView.js` | Canvas API | `mockData.js` |
| 技術指標引擎 | `IndicatorEngine.js` | 純數學計算 | 無 |
| 回測引擎 | `BacktestEngine.js` | 事件驅動模擬 | `IndicatorEngine.js` |
| 策略編輯器 | `StrategyEditor.js` | 條件式 DSL 編輯器 | 無 |
| 虛擬交易 | `PaperTrading.js` | 狀態機 | `ChartView.js` |
| 模擬數據 | `mockData.js` | 隨機行走演算法 | 無 |

**資料流：**
```
mockData.js → ChartView.js (渲染)
            → IndicatorEngine.js (計算指標疊加在 K 線)
            → BacktestEngine.js (用歷史數據跑策略)
            → PaperTrading.js (即時模擬交易)
```

### 5.2 土木結構設計 (`js/pages/civil/`)

| 元件 | 檔案 | 核心技術 | 依賴 |
|------|------|----------|------|
| 梁內力計算 | `BeamSolver.js` | 結構力學公式 | 無 |
| 柱內力計算 | `ColumnSolver.js` | 結構力學公式 | 無 |
| 板內力計算 | `SlabSolver.js` | 結構力學公式 | 無 |
| 截面資料庫 | `SectionDB.js` | 靜態資料 + 查詢 | 無 |
| 荷載組合 | `LoadCombiner.js` | 組合計算 | 無 |
| 計算書產生 | `ReportGenerator.js` | HTML 模板 → `window.print()` / jsPDF | 無 |
| SVG 示意圖 | `SectionViewer.js` | 內聯 SVG (DOM) | 無 |

### 5.3 二手物品交易 (`js/pages/marketplace/`)

| 元件 | 檔案 | 核心技術 | 依賴 |
|------|------|----------|------|
| 商品列表 | `ProductList.js` | 虛擬滾動 + 篩選 | `marketplace-repo.js` |
| 商品詳情 | `ProductDetail.js` | 動態渲染 | `marketplace-repo.js` |
| 刊登表單 | `ProductForm.js` | 表單驗證 + FileReader | 無 |
| 購物車 | `CartView.js` | 狀態管理 | `marketplace-repo.js` |
| 訂單管理 | `OrderManager.js` | 狀態機 | `marketplace-repo.js` |
| 評價系統 | `ReviewSystem.js` | 星級評分元件 | `marketplace-repo.js` |
| 站內訊息 | `Messaging.js` | 即時更新（輪詢模擬） | `marketplace-repo.js` |

### 5.4 AI 工具 (`js/pages/ai-tools/`)

| 元件 | 檔案 | 核心技術 | 依賴 |
|------|------|----------|------|
| 文字生成 | `TextGenerator.js` | 提示詞模板 + Mock 回覆 | 無 |
| 圖片生成 | `ImageGenerator.js` | Canvas 合成模擬圖片 | 無 |
| 程式碼助手 | `CodeAssistant.js` | 語法高亮 + 模板 | 無 |
| 文件摘要 | `DocSummarizer.js` | 文字統計 + 關鍵句提取 | 無 |
| 提示詞優化 | `PromptOptimizer.js` | 規則引擎 | 無 |

### 5.5 線上做 PPT (`js/pages/ppt-editor/`)

| 元件 | 檔案 | 核心技術 | 依賴 |
|------|------|----------|------|
| 投影片畫布 | `SlideCanvas.js` | 拖放 API + DOM 定位 | 無 |
| 工具列 | `Toolbar.js` | 命令模式 | 無 |
| 縮圖列表 | `SlidePanel.js` | 拖放排序 | 無 |
| 屬性面板 | `PropertyPanel.js` | 表單綁定 | 無 |
| 模板管理 | `TemplateManager.js` | JSON 模板資料 | 無 |
| 圖表元素 | `ChartElement.js` | Canvas 繪圖 | 無 |
| 表格元素 | `TableElement.js` | 可編輯表格 | 無 |
| 匯出引擎 | `PPTExporter.js` | HTML 模板 → Blob → 下載 | 無 |
| Markdown 匯入 | `MarkdownImporter.js` | 自訂解析器 → 投影片結構 | 無 |

### 5.6 經典遊戲 (`js/pages/games/`)

| 元件 | 檔案 | 核心技術 | 依賴 |
|------|------|----------|------|
| 俄羅斯方塊 | `TetrisGame.js` | Canvas + 遊戲迴圈 | `ScoreBoard.js` |
| 貪食蛇 | `SnakeGame.js` | Canvas + 遊戲迴圈 | `ScoreBoard.js` |
| 踩地雷 | `MinesweeperGame.js` | DOM Grid + 遞迴演算法 | `ScoreBoard.js` |
| 2048 | `Game2048.js` | DOM Grid + 滑動合併演算法 | `ScoreBoard.js` |
| 打磚塊 | `BreakoutGame.js` | Canvas + 物理碰撞 | `ScoreBoard.js` |
| 計分板 | `ScoreBoard.js` | 高分排行 UI | `game-repo.js` |

---

## 6. 建議開發順序

### 依賴關係圖

```
Phase 1 (基礎)
  ├── TASK-001: 專案初始化（index.html, 目錄結構, 建置腳本）
  ├── TASK-002: 設計系統（variables.css, base.css, theme.js）
  └── TASK-003: 路由 + 導航 + 首頁（router.js, app.js, layout.css, HomePage.js）

Phase 2 (共用元件)
  └── TASK-004: 共用元件庫（Modal, Toast, Tabs, DataTable, 表單驗證器）

Phase 3-8 (各業務線 — 可並行開發)
  ├── Phase 3: 經典遊戲（技術最簡單，快速建立信心）
  │   └── TASK-005: 遊戲大廳 + 五款遊戲 + 計分板
  │
  ├── Phase 4: 量化交易（中等複雜度，核心在 Canvas 繪圖）
  │   └── TASK-006: K線圖 + 技術指標 + 回測引擎 + 策略編輯器 + 虛擬交易
  │
  ├── Phase 5: 土木結構（中等複雜度，核心在數值計算）
  │   └── TASK-007: 結構計算引擎 + 截面資料庫 + SVG 示意圖 + 計算書
  │
  ├── Phase 6: AI 工具（最簡單，以模擬為主）
  │   └── TASK-008: 五大 AI 工具（文字/圖片/程式碼/摘要/提示詞）
  │
  ├── Phase 7: 二手交易（最複雜，需 IndexedDB 完整 CRUD）
  │   └── TASK-009: 商品 CRUD + 搜尋 + 購物車 + 訂單 + 評價 + 訊息
  │
  └── Phase 8: 線上 PPT（最複雜，拖放編輯器）
      └── TASK-010: 編輯器核心 + 模板 + 匯入匯出

Phase 9 (收尾)
  └── TASK-011: PWA 離線支援（manifest.json, sw.js）+ 效能優化 + 最終測試
```

### 詳細開發階段規劃

| 階段 | 任務 ID | 任務名稱 | 預計工時 | 依賴 | 說明 |
|------|---------|----------|----------|------|------|
| **P1** | TASK-001 | 專案初始化 | 2h | 無 | 建立目錄、index.html 基本骨架、入口 JS/CSS、README |
| **P1** | TASK-002 | 設計系統 | 3h | TASK-001 | variables.css、base.css、utilities.css、theme.js |
| **P1** | TASK-003 | 路由與首頁 | 4h | TASK-002 | router.js、app.js、layout.css、HomePage.js、導航列 |
| **P2** | TASK-004 | 共用元件 | 3h | TASK-003 | Modal、Toast、Tabs、DataTable、LoadingSpinner |
| **P3** | TASK-005 | 經典遊戲 | 8h | TASK-004 | 遊戲大廳 + 5 款遊戲各自實作，每款約 1.5h |
| **P4** | TASK-006 | 量化交易 | 10h | TASK-004 | 最耗時在 K線圖 Canvas 與回測引擎 |
| **P5** | TASK-007 | 土木結構 | 8h | TASK-004 | 計算公式實作 + SVG 繪圖 + 計算書 |
| **P6** | TASK-008 | AI 工具 | 5h | TASK-004 | 以 Mock 為主，UI 重於邏輯 |
| **P7** | TASK-009 | 二手交易 | 12h | TASK-004 + TASK-002 | IndexedDB CRUD 最多、頁面最多 |
| **P8** | TASK-010 | 線上 PPT | 12h | TASK-004 | 拖放編輯器難度最高，模板系統較繁 |
| **P9** | TASK-011 | PWA 與優化 | 4h | 全部完成後 | Service Worker、manifest、lighthouse 優化 |

### 開發順序建議（一人公司最佳路徑）

```
Week 1:  TASK-001 → TASK-002 → TASK-003 → TASK-004
         (基礎建設，約 3 天)

Week 2:  TASK-005 → TASK-006
         (遊戲 + 量化，約 4-5 天)

Week 3:  TASK-007 → TASK-008
         (土木 + AI，約 3-4 天)

Week 4-5: TASK-009 → TASK-010
          (交易 + PPT，最重，約 5-6 天)

Week 6:  TASK-011 + 總體測試 + Bug 修復
         (收尾，約 3 天)
```

**為什麼遊戲先做？** 因為遊戲的 Canvas 實作經驗可以 reused 到 K線圖和 PPT 繪圖功能；同時遊戲的即時成就感有助於維持開發動力。

---

## 7. 關鍵技術決策記錄

| 決策 | 選項 | 選擇理由 |
|------|------|----------|
| **框架** | Vanilla JS vs React/Vue | 無 bundler 依賴、直接部署 GitHub Pages、減少學習成本、檔案更小、一人專案無需團隊協作 |
| **路由** | Hash-based vs History API | Hash 路由無需伺服器設定，GitHub Pages 直接支援，最簡單 |
| **K 線圖** | Canvas API vs Chart.js | Canvas 更靈活可完全控制渲染細節，Chart.js 無法滿足複雜的技術指標疊加需求 |
| **儲存** | IndexedDB vs localStorage | 二手交易和 PPT 數據量大，IndexedDB 支援索引查詢和大量結構化資料 |
| **離線** | Service Worker Cache First | 靜態資源可離線使用，IndexedDB 資料本來就在本地 |
| **CSS 方案** | CSS Variables + 工具類 vs Tailwind | Tailwind 需建置工具鏈，CSS Variables 純原生無依賴 |
| **PDF 匯出** | `window.print()` + CSS 分頁 vs jsPDF | `print()` 最簡單穩定，CSS `@media print` 控制分頁；jsPDF 作為進階選項 |
| **圖片儲存** | Base64 Data URL vs Blob URL | 商品圖片用 Base64 存 IndexedDB（簡潔），大型圖片用 Blob URL（效能） |
| **Mock 數據** | 內建隨機生成 vs JSON fixture | 隨機生成更靈活（K線、商品），JSON fixture 用於截面資料庫等靜態資料 |
| **狀態管理** | Proxy-based 自制 store vs 無狀態 | 輕量級 Proxy 實作反應式綁定，避免手動 DOM 更新（約 50 行核心程式碼） |

---

## 附錄 A: 關鍵檔案責任摘要

```
index.html           → SPA 容器，所有路由共用的 DOM 結構
js/app.js           → 應用生命週期管理（初始化 DB、註冊 SW、啟動路由）
js/router.js        → Hash-based 路由引擎（< 200 行）
js/store.js         → 反應式狀態管理（Proxy 實作，< 100 行）
js/theme.js         → 主題切換（< 80 行）
js/db/index.js      → IndexedDB 連線管理（< 150 行）
```

## 附錄 B: 各業務線的首屏 JS 大小估算

| 業務線 | 檔案數 | 預估大小 (min+gz) | 載入策略 |
|--------|--------|-------------------|----------|
| 首頁 | 1 | ~3 KB | 初始載入 |
| 經典遊戲 | 6 | ~15 KB | 按需載入 |
| 量化交易 | 6 | ~18 KB | 按需載入 |
| 土木結構 | 7 | ~12 KB | 按需載入 |
| AI 工具 | 5 | ~8 KB | 按需載入 |
| 二手交易 | 7 | ~20 KB | 按需載入 |
| 線上 PPT | 9 | ~25 KB | 按需載入 |
| 共用核心 | ~15 files | ~10 KB | 初始載入 |

**總初始載入（首屏）：** ~13 KB（核心共用 + 首頁），預估 < 1s 載入完成。

---

*本計劃書由 PLANNER 子代理生成，供開發階段參考。*
