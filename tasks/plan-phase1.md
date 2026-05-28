# Phase 1：專案基礎 — 開發計劃

> **適用技術棧**: Next.js 16（App Router）+ TypeScript + Tailwind CSS v4 + Prisma + PostgreSQL  
> **專案已預先建置部分基礎結構**（create-next-app 脚手架、Navbar/Footer/ThemeToggle、首頁、遊戲頁面、Prisma schema、設計標記）。此計劃涵蓋其餘部分。
> **六大事業線**: 量化交易 / 土木結構 / 二手交易 / AI 工具 / 線上 PPT / 經典遊戲

---

## 目錄結構設計（目標）

```
src/
├── app/                          # Next.js App Router 頁面與 API
│   ├── layout.tsx                # 根佈局（Navbar + Footer + 字體）
│   ├── page.tsx                  # 首頁（Hero + 六大事業線卡片） — ✅ 已存在
│   ├── globals.css               # 全域 CSS + 設計標記 + 動畫 — ✅ 已存在
│   ├── favicon.ico
│   ├── not-found.tsx             # 404 頁面
│   ├── error.tsx                 # 全域錯誤邊界
│   ├── loading.tsx               # 全域載入骨架
│   ├── (auth)/                   # 認證相關路由群組
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── quant/                    # 量化交易
│   │   ├── layout.tsx
│   │   ├── page.tsx              # 儀表板入口
│   │   └── loading.tsx
│   ├── civil/                    # 土木結構
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── loading.tsx
│   ├── marketplace/              # 二手交易
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── items/[id]/page.tsx   # 商品詳情
│   │   └── loading.tsx
│   ├── ai-tools/                 # AI 工具
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── loading.tsx
│   ├── ppt/                      # 線上 PPT
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── loading.tsx
│   ├── games/                    # 經典遊戲
│   │   ├── page.tsx              # 遊戲大廳 — ✅ 已存在
│   │   └── loading.tsx
│   └── api/                      # Next.js API 路由
│       ├── auth/
│       │   ├── [...nextauth]/
│       │   │   └── route.ts      # NextAuth 配置
│       │   └── register/
│       │       └── route.ts
│       ├── quant/
│       │   ├── market/route.ts   # 行情數據
│       │   └── strategy/route.ts # 策略 CRUD
│       ├── civil/
│       │   └── calculate/route.ts# 結構計算
│       ├── marketplace/
│       │   ├── items/route.ts    # 商品 CRUD
│       │   └── orders/route.ts   # 訂單
│       ├── ai-tools/
│       │   └── generate/route.ts # AI 生成
│       ├── ppt/
│       │   └── export/route.ts   # 匯出
│       └── games/
│           └── scores/route.ts   # 排行榜
├── components/
│   ├── ui/                       # 共用 UI 元件
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Modal.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Spinner.tsx
│   │   ├── Badge.tsx
│   │   ├── Tabs.tsx
│   │   └── Toggle.tsx
│   ├── layout/                   # 佈局元件
│   │   ├── Navbar.tsx            # ✅ 已存在
│   │   ├── Footer.tsx            # ✅ 已存在
│   │   ├── ThemeToggle.tsx       # ✅ 已存在
│   │   ├── SubNav.tsx            # 業務線次導航
│   │   └── Sidebar.tsx           # 側邊欄（供 civil/ai-tools 使用）
│   ├── home/                     # 首頁專用元件
│   │   ├── HeroSection.tsx
│   │   ├── BusinessCard.tsx
│   │   └── StatsOverview.tsx
│   └── games/                    # 遊戲元件 — 部分已存在
│       ├── Tetris.tsx            # ✅ 已存在
│       ├── Snake.tsx             # ✅ 已存在
│       ├── Minesweeper.tsx       # ✅ 已存在
│       ├── Game2048.tsx          # ✅ 已存在
│       ├── Breakout.tsx          # ✅ 已存在
│       ├── PacMan.tsx            # 待建立
│       ├── Invaders.tsx          # 待建立
│       ├── FlappyBird.tsx        # 待建立
│       ├── Memory.tsx            # 待建立
│       └── Shooter.tsx           # 待建立
├── lib/
│   ├── prisma.ts                 # Prisma 客戶端單例 — ✅ 已存在
│   ├── utils.ts                  # 輔助函數 (cn, formatDate, formatScore) — ✅ 已存在
│   └── auth.ts                   # NextAuth 配置選項
├── hooks/                        # 自定義 hooks
│   ├── useTheme.ts               # 主題管理 hook
│   └── useLocalStorage.ts        # localStorage hook
├── types/                        # TypeScript 型別
│   └── index.ts
└── generated/                    # Prisma 生成程式碼（自動產生）
    └── prisma/
```

---

## 任務分解

Phase 1 包含 **3 個主要任務**，進一步細分為 **11 個子任務**。

```
TASK-001 ─┬─ TASK-001a  專案配置與依賴
           ├─ TASK-001b  Prisma 資料庫初始化
           ├─ TASK-001c  目錄結構建立
           └─ TASK-001d  基礎 API 路由骨架

TASK-002 ─┬─ TASK-002a  Tailwind CSS 主題系統完成
           ├─ TASK-002b  共用 UI 元件庫
           ├─ TASK-002c  業務線主題切換
           └─ TASK-002d  載入與錯誤狀態

TASK-003 ─┬─ TASK-003a  次導航與業務線佈局
           ├─ TASK-003b  五大業務線入口頁
           ├─ TASK-003c  首頁儀表板增強
           └─ TASK-003d  認證頁面（登入/註冊）
```

---

### TASK-001：專案初始化與架構搭建

#### TASK-001a — 專案配置與依賴

| 項目 | 內容 |
|------|------|
| **ID** | TASK-001a |
| **目標** | 確保專案依賴完整、環境變數配置就緒、開發腳本可用 |
| **優先級** | P0 — 阻塞 |
| **預計工時** | 0.5h |

**需要操作/修改的檔案：**

| 檔案 | 動作 | 說明 |
|------|------|------|
| `.env` | 修改 | 填入正確的 DATABASE_URL |
| `.env.example` | 建立 | 提供 DATABASE_URL 模板（不含敏感資訊） |
| `package.json` | 確認 | 確認 scripts 完整性；若缺少 `db:seed` 腳本則新增 |

**驗收標準：**
- [ ] `npm run dev` 可正常啟動開發伺服器
- [ ] `npm run build` 可成功建置（無 TypeScript 錯誤）
- [ ] `.env.example` 存在且不含敏感資訊
- [ ] 所有依賴已安裝（`@prisma/client`, `next-auth`, `bcryptjs`, `clsx`）

---

#### TASK-001b — Prisma 資料庫初始化

| 項目 | 內容 |
|------|------|
| **ID** | TASK-001b |
| **目標** | 初始化 PostgreSQL 資料庫、執行 Prisma 遷移、生成客戶端 |
| **優先級** | P0 — 阻塞 |
| **預計工時** | 0.5h |

**需要操作/修改的檔案：**

| 檔案 | 動作 | 說明 |
|------|------|------|
| `prisma/schema.prisma` | 修改 | 根據需求擴充模型（後續階段逐步增加） |
| `prisma/seed.ts` | 建立 | 種子資料腳本（預設管理員帳號、測試數據） |
| `prisma.config.ts` | 確認 | 確保配置正確 |
| `src/generated/prisma/` | 自動 | `prisma generate` 產出 |
| `prisma/migrations/` | 自動 | `prisma migrate dev` 產出 |

**驗收標準：**
- [ ] `npx prisma generate` 成功產出 TypeScript 客戶端
- [ ] `npx prisma db push` 成功同步資料庫結構
- [ ] 資料庫中產生 `User`、`GameScore`、`Message` 三張表
- [ ] `npx prisma db seed` 可成功寫入種子資料

---

#### TASK-001c — 目錄結構建立

| 項目 | 內容 |
|------|------|
| **ID** | TASK-001c |
| **目標** | 建立完整的目錄與路由佔位檔案，確保 App Router 結構正確 |
| **優先級** | P1 — 高 |
| **預計工時** | 1h |

**需要建立的檔案：**

| 檔案 | 說明 |
|------|------|
| `src/app/not-found.tsx` | 404 自訂頁面，含返回首頁按鈕 |
| `src/app/error.tsx` | 全域錯誤邊界（"use client"），顯示錯誤訊息 + 重新整理按鈕 |
| `src/app/loading.tsx` | 全域載入骨架（Skeleton 動畫） |
| `src/app/quant/layout.tsx` | 量化交易佈局（強制深色主題） |
| `src/app/quant/page.tsx` | 量化交易入口頁（佔位 + 功能簡介） |
| `src/app/quant/loading.tsx` | 量化交易頁面載入骨架 |
| `src/app/civil/layout.tsx` | 土木結構佈局（淺色主題 + 左側工具列） |
| `src/app/civil/page.tsx` | 土木結構入口頁 |
| `src/app/civil/loading.tsx` | 載入骨架 |
| `src/app/marketplace/layout.tsx` | 二手交易佈局（淺色活潑主題） |
| `src/app/marketplace/page.tsx` | 二手交易入口頁 |
| `src/app/marketplace/items/[id]/page.tsx` | 商品詳情頁（佔位） |
| `src/app/marketplace/loading.tsx` | 載入骨架 |
| `src/app/ai-tools/layout.tsx` | AI 工具佈局（深色主題 + 左側側邊欄） |
| `src/app/ai-tools/page.tsx` | AI 工具入口頁 |
| `src/app/ai-tools/loading.tsx` | 載入骨架 |
| `src/app/ppt/layout.tsx` | 線上 PPT 佈局 |
| `src/app/ppt/page.tsx` | 線上 PPT 入口頁 |
| `src/app/ppt/loading.tsx` | 載入骨架 |
| `src/hooks/useTheme.ts` | 主題管理 hook |
| `src/hooks/useLocalStorage.ts` | localStorage hook |
| `src/types/index.ts` | 共用 TypeScript 型別定義 |

**驗收標準：**
- [ ] 訪問 `/quant` 顯示量化交易入口頁，背景為深色
- [ ] 訪問 `/civil` 顯示土木結構入口頁，背景為淺色
- [ ] 訪問 `/marketplace` 顯示二手交易入口頁
- [ ] 訪問 `/ai-tools` 顯示 AI 工具入口頁，含左側側邊欄
- [ ] 訪問 `/ppt` 顯示線上 PPT 入口頁
- [ ] 訪問 `/games` 正常顯示遊戲大廳（✅ 已存在）
- [ ] 訪問不存在路由顯示自訂 404 頁面
- [ ] 六大業務線頁面均顯示 Navbar 與 Footer
- [ ] `not-found.tsx` 與 `error.tsx` 響應式且符合設計系統

---

#### TASK-001d — 基礎 API 路由骨架

| 項目 | 內容 |
|------|------|
| **ID** | TASK-001d |
| **目標** | 建立各業務線的 API 路由骨架（佔位 handler），確保後端架構可運作 |
| **優先級** | P1 — 高 |
| **預計工時** | 1h |

**需要建立的檔案：**

| 檔案 | 方法 | 說明 |
|------|------|------|
| `src/app/api/auth/[...nextauth]/route.ts` | GET/POST | NextAuth 處理 |
| `src/app/api/auth/register/route.ts` | POST | 註冊 API（暫時回傳 200） |
| `src/app/api/quant/market/route.ts` | GET | 市場行情 API（模擬數據） |
| `src/app/api/quant/strategy/route.ts` | GET/POST | 策略 CRUD |
| `src/app/api/civil/calculate/route.ts` | POST | 結構計算 API |
| `src/app/api/marketplace/items/route.ts` | GET/POST | 商品 API |
| `src/app/api/marketplace/orders/route.ts` | GET/POST | 訂單 API |
| `src/app/api/ai-tools/generate/route.ts` | POST | AI 生成 API（Mock） |
| `src/app/api/ppt/export/route.ts` | POST | 簡報匯出 API |
| `src/app/api/games/scores/route.ts` | GET/POST | 排行榜 API（與 Prisma 互動） |

**驗收標準：**
- [ ] 所有 API 路由回傳正確的 HTTP 狀態碼（200/201/400/404）
- [ ] `/api/games/scores` GET 回傳 GameScore 列表
- [ ] `/api/games/scores` POST 可新增分數
- [ ] `/api/quant/market` 回傳模擬行情 JSON
- [ ] 未實作的 API 回傳 501 並含合理 JSON 訊息
- [ ] API 路由使用 Next.js 標準 Route Handler（而非 Page Router）

---

### TASK-002：設計系統與主題系統

#### TASK-002a — Tailwind CSS 主題系統完成

| 項目 | 內容 |
|------|------|
| **ID** | TASK-002a |
| **目標** | 將設計系統規範（docs/design-system.md）完整轉化為 Tailwind CSS v4 主題變數 |
| **優先級** | P0 — 阻塞 |
| **預計工時** | 1.5h |

**需要操作/修改的檔案：**

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/app/globals.css` | 修改 | 補全所有設計標記（完整色彩、間距、圓角、陰影、字級、斷點） |
| — | — | 建立 `@theme` 區塊供 Tailwind v4 utility classes 使用 |

**globals.css 需要增加的內容：**
- 完整 CSS 自訂屬性（`--color-*`, `--radius-*`, `--shadow-*`, `--spacing-*`, `--font-*`）
- Tailwind v4 `@theme` 指令將設計標記註冊為 utility classes
- 六大事業線 `data-theme` 屬性（量化深色、土木淺色、AI 深色、遊戲深色、交易淺色、PPT 預設）
- `@media (prefers-reduced-motion: reduce)` 禁用動畫
- `print` 樣式表
- 字體載入策略（確認 Inter / Noto Sans TC / JetBrains Mono 已載入）

**驗收標準：**
- [ ] `bg-brand` / `text-primary` 等 Tailwind utility classes 可正確套用
- [ ] `data-theme="quant"` 時頁面套用暗色金融風格
- [ ] `data-theme="game"` 時頁面套用深紫黑復古風格
- [ ] 所有設計規範中的色票、間距、圓角、陰影均有對應 CSS 變數
- [ ] 斷點定義與規範一致（xs 640px / sm 640px+ / md 768px+ / lg 1024px+ / xl 1280px+ / 2xl 1536px+）

---

#### TASK-002b — 共用 UI 元件庫

| 項目 | 內容 |
|------|------|
| **ID** | TASK-002b |
| **目標** | 建立設計系統規範中定義的核心共用元件，所有業務線可複用 |
| **優先級** | P0 — 阻塞 |
| **預計工時** | 2h |

**需要建立的檔案：**

| 檔案 | 說明 | 關鍵功能 |
|------|------|---------|
| `src/components/ui/Button.tsx` | 按鈕元件 | variant (primary/secondary/ghost/danger/icon/large), size, loading state, disabled |
| `src/components/ui/Card.tsx` | 通用卡片 | hover 動畫, 可點擊模式, data card variant, 商品卡片 variant |
| `src/components/ui/Input.tsx` | 輸入框 | label, error state, focus 動畫, prefix/suffix icon |
| `src/components/ui/Select.tsx` | 自定義下拉 | 圓角 8px, hover 高亮, 自定義 arrow |
| `src/components/ui/Modal.tsx` | 模態框 | Scale In 動畫, 背景遮罩, 關閉按鈕, 可拖曳 |
| `src/components/ui/Skeleton.tsx` | 骨架屏 | pulse 動畫, 多種 variant (text/card/image/circle) |
| `src/components/ui/Spinner.tsx` | 載入旋轉器 | 圓環旋轉, 可變色（對應業務線主色） |
| `src/components/ui/Badge.tsx` | 標籤 | variant (default/success/warning/error/info), dot mode |
| `src/components/ui/Tabs.tsx` | 選項卡 | 底部滑動底線指示器, 動畫過渡 |
| `src/components/ui/Toggle.tsx` | 開關切換 | iOS 風格, 平滑過渡, label 支援 |

**驗收標準：**
- [ ] 每個元件均為 client component（`"use client"`）
- [ ] 所有元件接受 `className` prop 進行外部樣式覆蓋
- [ ] 支援 asChild／polymorphic 模式（按鈕可為 `<Link>`）
- [ ] Button 所有 variant 視覺正確（primary/secondary/ghost/danger/icon/large）
- [ ] Card hover 動畫正確（`translateY(-2px)` + 陰影升級）
- [ ] Modal 進出動畫正確（scale 0.95→1 + fade）
- [ ] Skeleton pulse 動畫流暢
- [ ] Toggle iOS 風格正確

---

#### TASK-002c — 業務線主題切換

| 項目 | 內容 |
|------|------|
| **ID** | TASK-002c |
| **目標** | 實現業務線級別的主題切換（覆蓋全域主題），以及各業務線的 `data-theme` 屬性動態套用 |
| **優先級** | P1 — 高 |
| **預計工時** | 1h |

**需要操作/修改的檔案：**

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/hooks/useTheme.ts` | 修改 | 擴充支援業務線級別主題（回傳 `{ theme, businessTheme, setBusinessTheme }`） |
| `src/app/layout.tsx` | 修改 | 初始化時從 cookie/localStorage 讀取業務線主題偏好 |
| `src/components/layout/ThemeToggle.tsx` | 修改 | 增加業務線主題選單（可選），當在業務線頁面時顯示獨立切換 |
| `src/app/quant/layout.tsx` | 修改 | 設定 `data-theme="quant"` + `data-theme-mode="dark"` |
| `src/app/civil/layout.tsx` | 修改 | 設定 `data-theme="civil"` + `data-theme-mode="light"` |
| `src/app/marketplace/layout.tsx` | 修改 | 設定 `data-theme="market"` + `data-theme-mode="light"` |
| `src/app/ai-tools/layout.tsx` | 修改 | 設定 `data-theme="ai"` + `data-theme-mode="dark"` |
| `src/app/ppt/layout.tsx` | 修改 | 設定 `data-theme="ppt"` |
| `src/app/games/page.tsx` | 修改 | 確認 `data-theme="game"` 已套用 |

**驗收標準：**
- [ ] 進入量化交易頁面自動強制深色主題（量化專用色票）
- [ ] 進入土木結構頁面自動套用淺色專業主題
- [ ] 進入 AI 工具頁面自動強制深色科技主題
- [ ] 進入經典遊戲頁面自動套用深紫黑復古主題
- [ ] 業務線內的主題切換不影響其他業務線
- [ ] 主題切換動畫 0.3s ease 過渡
- [ ] 左上角 ThemeToggle 在業務線頁面顯示該業務線的 icon/色標

---

#### TASK-002d — 載入與錯誤狀態

| 項目 | 內容 |
|------|------|
| **ID** | TASK-002d |
| **目標** | 實現全站的 loading skeleton、錯誤邊界、以及空狀態元件 |
| **優先級** | P1 — 高 |
| **預計工時** | 1h |

**需要操作/修改的檔案：**

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/app/loading.tsx` | 修改 | 整頁骨架屏（layout 層級） |
| `src/app/error.tsx` | 修改 | 錯誤邊界（顯示錯誤 Icon + "請重新整理" 按鈕 + 返回首頁） |
| `src/app/not-found.tsx` | 修改 | 404 頁面（OPC Logo + "頁面不存在" + 返回首頁） |
| `src/components/ui/EmptyState.tsx` | 建立 | 空狀態元件（圖示 + 標題 + 描述 + CTA 按鈕） |

**驗收標準：**
- [ ] 頁面切換時顯示 Skeleton 動畫（非空白閃爍）
- [ ] API 錯誤時 error.tsx 正確捕獲並顯示友好訊息
- [ ] 404 頁面設計符合品牌風格，含返回首頁按鈕
- [ ] EmptyState 可自訂 icon、title、description、action
- [ ] 所有載入狀態元件使用該業務線主色

---

### TASK-003：導航與首頁儀表板

#### TASK-003a — 次導航與業務線佈局

| 項目 | 內容 |
|------|------|
| **ID** | TASK-003a |
| **目標** | 實現業務線內部的次導航元件（Tab 切換 + 底部滑動底線），以及各業務線專屬佈局 |
| **優先級** | P1 — 高 |
| **預計工時** | 2h |

**需要建立的檔案：**

| 檔案 | 說明 |
|------|------|
| `src/components/layout/SubNav.tsx` | 次導航元件（sticky, 48px height, tab 切換, 滑動底線指示器, 滾動隱藏/顯示） |
| `src/components/layout/Sidebar.tsx` | 側邊欄元件（供 civil / ai-tools 使用，可摺疊） |

**次導航 (SubNav) 規格：**
- props: `tabs: { id, label, icon, href }[]`, `defaultTab?: string`
- 位置：主導航下方（sticky, top-16）
- 高度：48px
- 樣式：水平 Tab 列表，當前選中 Tab 底部有滑動底線指示器（動畫過渡）
- 滾動行為：向下滾動時隱藏，向上滾動時重新出現

**側邊欄 (Sidebar) 規格：**
- props: `items: { icon, label, onClick }[]`, `collapsible?: boolean`
- 寬度：摺疊時 48px（僅圖示），展開時 200px（圖示 + 文字）
- hover 展開 + click 鎖定
- 背景：與對應業務線主題一致

**驗收標準：**
- [ ] SubNav 在 `/quant`、`/civil`、`/marketplace`、`/ai-tools`、`/ppt` 頁面顯示
- [ ] Tab 切換時底部指示器平滑滑動（300ms ease-in-out）
- [ ] 向下滾動時 SubNav 隱藏，向上滾動時重新顯示
- [ ] Sidebar 可摺疊/展開，動畫流暢
- [ ] 次導航色彩與該業務線主色一致

---

#### TASK-003b — 五大業務線入口頁

| 項目 | 內容 |
|------|------|
| **ID** | TASK-003b |
| **目標** | 實作六大業務線的入口頁面（量化交易、土木結構、二手交易、AI 工具、線上 PPT），每個入口頁包含業務線 Hero、功能卡片與統計數據 |
| **優先級** | P1 — 高 |
| **預計工時** | 3h |

**需要建立/修改的檔案：**

| 檔案 | 說明 |
|------|------|
| `src/app/quant/page.tsx` | 量化交易入口：三欄儀表板佈局（市場列表 → K線 → 交易面板）、WebSocket 連線指示燈、模擬行情 ticker |
| `src/app/civil/page.tsx` | 土木結構入口：左側工具列 + 中央繪圖區 + 右側屬性面板（佔位） |
| `src/app/marketplace/page.tsx` | 二手交易入口：頂部搜尋欄 + 商品網格（4 欄桌面） + 熱門分類 |
| `src/app/ai-tools/page.tsx` | AI 工具入口：左側工具切換側邊欄 + 中央工作區 + 底部輸入框 |
| `src/app/ppt/page.tsx` | 線上 PPT 入口：三欄編輯器（縮圖 → 編輯 → 屬性）或跳轉至範本選擇頁 |
| `src/components/home/StatsOverview.tsx` | 建立 | 首頁統計概覽元件（各業務線的簡要統計數字） |

**每個入口頁必須包含：**
- 業務線專屬 Hero 區域（Icon + 標題 + 簡短描述）
- 3~4 個功能卡片（描述該業務線的核心功能）
- 一個主要 CTA 按鈕
- 對應的業務線主題（data-theme）

**量化交易入口頁面額外需求：**
- 三欄式佈局（左：市場列表佔位 → 中：K線圖佔位 → 右：交易面板佔位）
- 左上角 WebSocket 連線指示燈（綠點呼吸動畫）
- 頂部滾動 ticker 顯示模擬價格

**驗收標準：**
- [ ] 每個入口頁顯示正確的業務線名稱和圖示
- [ ] 每個入口頁包含該業務線主色的主題裝飾
- [ ] 量化交易頁面包含三欄佈局雛形
- [ ] 土木結構頁面包含工具列 + 繪圖區佈局雛形
- [ ] 二手交易頁面包含搜尋欄 + 商品網格
- [ ] AI 工具頁面包含側邊欄 + 工作區 + 輸入框
- [ ] 線上 PPT 頁面包含編輯器佈局雛形或範本選擇
- [ ] 所有入口頁面響應式（桌面 / 平板 / 手機）

---

#### TASK-003c — 首頁儀表板增強

| 項目 | 內容 |
|------|------|
| **ID** | TASK-003c |
| **目標** | 增強現有首頁（page.tsx），加入統計概覽區、即時數據展示、以及更豐富的品牌展示 |
| **優先級** | P2 — 中 |
| **預計工時** | 1.5h |

**需要修改/建立的檔案：**

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/app/page.tsx` | 修改 | 整合 StatsOverview 元件，調整布局與動畫 |
| `src/components/home/HeroSection.tsx` | 建立 | Hero 區域獨立元件（動態打字效果、品牌標語動畫） |
| `src/components/home/BusinessCard.tsx` | 建立 | 業務線卡片獨立元件（接收 props 渲染） |
| `src/components/home/StatsOverview.tsx` | 建立 | 統計概覽（六大事業線的即時統計：交易量、會員數、遊戲總分等 — Mock 數據） |

**首頁增強重點：**
- Hero 區域加入動態打字效果（"一人公司・無限可能"、"量化交易・精準決策" 等輪播）
- 六大事業線卡片改為獨立 BusinessCard 元件，支援 hover 動畫、stagger 進場
- 加入 StatsOverview 區塊（Mock 統計數字 + 動畫計數器）
- 底部加入 CTA 區塊（引導用戶探索各業務線）

**驗收標準：**
- [ ] Hero 區域包含動態打字或輪播效果
- [ ] 業務線卡片 stagger 動畫正確（依序延遲 80ms）
- [ ] StatsOverview 顯示六大事業線的 Mock 統計數字
- [ ] 統計數字有滾動計數器動畫（從 0 到目標值）
- [ ] 首頁在所有斷點下顯示正常
- [ ] 首頁載入時動畫流暢無閃爍

---

#### TASK-003d — 認證頁面（登入/註冊）

| 項目 | 內容 |
|------|------|
| **ID** | TASK-003d |
| **目標** | 實現登入/註冊頁面 UI（前端驗證 + form 處理），串接 NextAuth |
| **優先級** | P2 — 中 |
| **預計工時** | 2h |

**需要建立的檔案：**

| 檔案 | 說明 |
|------|------|
| `src/app/(auth)/login/page.tsx` | 登入頁面（email + password form, 社交登入佔位） |
| `src/app/(auth)/register/page.tsx` | 註冊頁面（name + email + password + 確認密碼 form） |
| `src/lib/auth.ts` | NextAuth 配置（Credentials provider + JWT session） |
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth API 路由 |
| `src/app/api/auth/register/route.ts` | 註冊 API（bcrypt 加密密碼後寫入 DB） |

**登入頁面規格：**
- 表單欄位：Email, Password
- 記住我（checkbox）
- 表單驗證（email 格式、密碼不為空）
- 錯誤提示（"帳號或密碼錯誤"）
- 提交中 loading 狀態
- "沒有帳號？立即註冊" 連結
- 暫時佔位的社交登入按鈕（Google / GitHub / LINE）

**註冊頁面規格：**
- 表單欄位：姓名, Email, 密碼, 確認密碼
- 表單驗證（email 格式、密碼長度 ≥ 8、密碼一致）
- 隱私政策 checkbox
- 註冊成功 → 自動登入 → 導回首頁
- "已有帳號？立即登入" 連結

**驗收標準：**
- [ ] 導航欄右側顯示登入/註冊連結（未登入狀態）
- [ ] 登入成功後導回前頁或首頁
- [ ] 註冊成功後自動登入，導回首頁
- [ ] 表單驗證顯示 inline error message
- [ ] 密碼使用 bcrypt 加密儲存
- [ ] session 使用 JWT（無狀態）
- [ ] 已登入用戶訪問登入頁 → 自動重新導向首頁
- [ ] NextAuth API route 正確處理 credentials login

---

## 依賴關係圖

```
                 階段 1：專案基礎

TASK-001a ─────────────────────────────────────┐
  專案配置與依賴                                 │
       │                                        │
       ▼                                        │
TASK-001b ─────┐                                │
  Prisma 初始化  │                                │
       │        │                                │
       ▼        ▼                                ▼
TASK-001c ── TASK-001d ───── TASK-002a ───── TASK-002b
  目錄結構       API 骨架      主題系統完成       UI 元件庫
       │                          │                │
       ▼                          ▼                ▼
TASK-003a ────────────────── TASK-002c ────── TASK-002d
  次導航佈局                   主題切換          載入/錯誤
       │                          │
       ▼                          ▼
TASK-003b ───────────────────────┤
  業務線入口頁                    │
       │                          │
       ▼                          ▼
TASK-003c ────────────────── TASK-003d
  首頁儀表板增強                 認證頁面
```

### 並行策略

| 並行群組 | 包含任務 | 說明 |
|---------|---------|------|
| **群組 A** | TASK-001a → 001b → 001c | 必須線性執行：依賴 → 資料庫 → 目錄結構 |
| **群組 B** | TASK-001d（與群組 A 並行） | API 骨架可在目錄結構完成後立即開始，無需等待資料庫 |
| **群組 C** | TASK-002a（與群組 A/B 並行） | 主題系統可與目錄結構同步進行 |
| **群組 D** | TASK-002b（依賴 TASK-002a） | UI 元件庫需主題 token 就緒 |
| **群組 E** | TASK-003a + TASK-002c + TASK-002d（可並行） | 次導航、主題切換、載入狀態三者無依賴關係 |
| **群組 F** | TASK-003b（依賴 TASK-003a + TASK-002b + TASK-002c） | 入口頁需次導航、UI 元件、主題就緒 |
| **群組 G** | TASK-003c（可與群組 F 並行） | 首頁儀表板僅依賴 UI 元件，不依賴業務線佈局 |
| **群組 H** | TASK-003d（與群組 F/G 並行） | 認證頁面獨立，僅依賴 Prisma + UI 元件 |

### 建議執行順序（最短關鍵路徑）

```
Week 1:
  Day 1:  TASK-001a, TASK-001b          [依賴 + 資料庫]
  Day 2:  TASK-001c, TASK-002a          [目錄 + 主題] ← 可並行
  Day 3:  TASK-001d, TASK-002b          [API 骨架 + UI 元件庫]
  Day 4:  TASK-003a, TASK-002c          [次導航 + 主題切換]
  Day 5:  TASK-002d, TASK-003c, TASK-003d  [載入 + 首頁 + 認證] ← 可並行

Week 2:
  Day 1-2: TASK-003b                    [五大入口頁]
  Day 3:   整合測試與修復
  Day 4:   驗收與 Phase 1 交付
```

---

## 附錄：技術決策記錄

| 決策 | 選項 | 選擇理由 |
|------|------|---------|
| 框架版本 | Next.js 16 | 專案已 scaffold（package.json 顯示 `next: 16.2.6`），與 Next.js 14 API 相容 |
| CSS 方案 | Tailwind CSS v4 + CSS 自訂屬性 | v4 使用 `@tailwindcss/postcss` + CSS 驅動配置，無需 `tailwind.config.ts` |
| 認證 | NextAuth v4 (Credentials) | 一人公司不需 OAuth 複雜度，Credentials + JWT 即可 |
| 資料庫 ORM | Prisma | 已預先配置，型別安全，遷移管理方便 |
| UI 元件策略 | 自建（基於設計系統） | 設計系統規範非常具體，自建可完全控制；後續可抽為套件 |
| 字體載入 | Google Fonts CDN（layout.tsx head） | 簡潔直接，不增加 build 複雜度 |
| 圖示 | Lucide Icons（設計規範指定） | 待後續階段安裝 `lucide-react` |
| 遊戲 Canvas | 純 React + Canvas API | 不需額外 game engine，降低依賴 |

---

## 參考資料

- 需求文件：[tasks/requirements.md](../tasks/requirements.md)
- 場景規則：[config/scene_rules.yaml](../config/scene_rules.yaml)
- 設計規範：[docs/design-system.md](../docs/design-system.md)
- 現有程式碼：`src/app/page.tsx`, `src/components/layout/Navbar.tsx`, `src/app/globals.css`
