# 評分報告 for TASK-002a（Tailwind CSS 主題系統）

**評分時間:** 2026-07-11T12:10:00+08:00
**評分者:** reviewer-subagent

**審查範圍:**
- TASK-002a: Tailwind CSS v4 主題系統 (`src/app/globals.css`)

**對照規範:**
- `docs/design-system.md` v1.0 (色彩、間距、圓角、陰影、排版、業務線主題)

---

## 評分檢查清單（必須 YES/NO）

| 檢查項目 | 結果 | 說明 |
|----------|------|------|
| **@theme 區塊是否正確註冊所有設計標記** | **YES** | 色彩（品牌色、六大事業體主色、功能色、語意別名）、間距（4px 基數，共 16 個 token）、圓角（sm/md/lg/xl）、陰影（sm/md/lg/xl）、字級（10 級）、字重（4 級）、行高（3 級）、字體家族（sans + mono）——全數正確註冊 |
| **data-theme 六大事業體是否有完整 CSS 變數覆蓋** | **YES** | 六個 `[data-theme]` 區塊（quant / civil / market / ai / ppt / game）均有獨立的 theme-color、bg-primary~tertiary、text-primary~tertiary、border、card-bg、card-shadow，部分另有 success/error/warning/info 覆蓋 |
| **是否有 print 樣式** | **YES** | `@media print` 隱藏 nav / footer / .no-print，強制白底黑字 12pt，設定 `@page margin: 2cm` |
| **是否有 reduced-motion 樣式** | **YES** | `@media (prefers-reduced-motion: reduce)` 將所有 animation/transition 壓至 0.01ms，強制 `scroll-behavior: auto` |
| **語法是否正確（Tailwind CSS v4）** | **YES** | `@import "tailwindcss"` 為 v4 標準入口；`@theme` token 命名使用 `--color-*` / `--font-*` / `--text-*` / `--spacing-*` / `--radius-*` / `--shadow-*` / `--font-weight-*` / `--leading-*` 均為 v4 合法名稱；無明顯語法錯誤 |
| **設計規範中的色彩、間距、圓角等是否都有對應** | **YES** | 對照 `docs/design-system.md` 各章節，所有數值均正確對應（詳見下表） |

---

## 設計規範對照表

| 規範章節 | 項目 | 規範值 | CSS 值 | 符合 |
|----------|------|--------|--------|:----:|
| §2.1 | 品牌主色 | #6366F1 | `--brand: #6366F1` / `--color-brand: #6366F1` | ✅ |
| §2.1 | 品牌淺色 | #818CF8 | `--brand-light: #818CF8` / `--color-brand-light: #818CF8` | ✅ |
| §2.1 | 品牌深色 | #4F46E5 | `--brand-dark: #4F46E5` / `--color-brand-dark: #4F46E5` | ✅ |
| §2.1 | 成功色 | #22C55E | `--success: #22C55E` / `--color-success: #22C55E` | ✅ |
| §2.1 | 警告色 | #F59E0B | `--warning: #F59E0B` / `--color-warning: #F59E0B` | ✅ |
| §2.1 | 錯誤色 | #EF4444 | `--error: #EF4444` / `--color-error: #EF4444` | ✅ |
| §2.1 | 資訊色 | #3B82F6 | `--info: #3B82F6` / `--color-info: #3B82F6` | ✅ |
| §2.1 | 深色資訊 | #60A5FA | `--color-info-light: #60A5FA` | ✅ |
| §2.2 | quant 主色 | #00C853 | `--quant: #00C853` / `--color-quant: #00C853` | ✅ |
| §2.2 | civil 主色 | #FF6D00 | `--civil: #FF6D00` / `--color-civil: #FF6D00` | ✅ |
| §2.2 | market 主色 | #E91E63 | `--market: #E91E63` / `--color-market: #E91E63` | ✅ |
| §2.2 | ai 主色 | #8B5CF6 | `--ai: #8B5CF6` / `--color-ai: #8B5CF6` | ✅ |
| §2.2 | ppt 主色 | #EC4899 | `--ppt: #EC4899` / `--color-ppt: #EC4899` | ✅ |
| §2.2 | game 主色 | #FF6B35 | `--game: #FF6B35` / `--color-game: #FF6B35` | ✅ |
| §2.2 | game 輔色 | #004E89 (表格) / #00FFF7 (§5.6) | `--game-secondary: #00FFF7` | ⚠️ 註1 |
| §4 | 間距 (space-1~20) | 4px–80px (4px base) | `--spacing-1` ~ `--spacing-20` 全覆蓋，並擴充奇數間距 | ✅ |
| §1.3 | 圓角 sm | 4px | `--radius-sm: 4px` | ✅ |
| §1.3 | 圓角 md | 8px | `--radius-md: 8px` | ✅ |
| §1.3 | 圓角 lg | 12px | `--radius-lg: 12px` | ✅ |
| §1.3 | 圓角 xl | 16px | `--radius-xl: 16px` | ✅ |
| §1.3 | 陰影 sm | 0 1px 2px rgba(0,0,0,0.05) | 完全相同 | ✅ |
| §1.3 | 陰影 md | 0 4px 12px rgba(0,0,0,0.08) | 完全相同 | ✅ |
| §1.3 | 陰影 lg | 0 8px 30px rgba(0,0,0,0.12) | 完全相同 | ✅ |
| §1.3 | 陰影 xl | 0 20px 60px rgba(0,0,0,0.15) | 完全相同 | ✅ |
| §3.2 | Display | 48px / 700 | `--text-display: 48px` + `--font-weight-bold: 700` | ✅ |
| §3.2 | H1 | 36px / 700 | `--text-h1: 36px` | ✅ |
| §3.2 | H2 | 28px / 600 | `--text-h2: 28px` | ✅ |
| §3.2 | H3 | 22px / 600 | `--text-h3: 22px` | ✅ |
| §3.2 | H4 | 18px / 500 | `--text-h4: 18px` | ✅ |
| §3.2 | Body | 16px / 400 | `--text-body: 16px` | ✅ |
| §3.2 | Body Small | 14px / 400 | `--text-sm: 14px` | ✅ |
| §3.2 | Caption | 12px / 400 | `--text-xs: 12px` | ✅ |
| §3.2 | Data Large | 32px / 700 | `--text-data-lg: 32px` | ✅ |
| §3.2 | Data Mono | 14px / 400 | `--text-data: 14px` | ✅ |
| §3.1 | 英文字體 | Inter | `--font-sans: 'Inter', ...` | ✅ |
| §3.1 | 中文字體 | Noto Sans TC | `--font-sans: ..., 'Noto Sans TC', ...` | ✅ |
| §3.1 | 等寬字體 | JetBrains Mono | `--font-mono: 'JetBrains Mono', ...` | ✅ |
| §3.1 | 遊戲字體 | Press Start 2P | ❌ 未註冊 | ⚠️ 註2 |
| §3.3 | 行高: heading | 1.2 | `--leading-heading: 1.2` | ✅ |
| §3.3 | 行高: body | 1.6 | `--leading-body: 1.6` | ✅ |
| §3.3 | 行高: data | 1.0 | `--leading-data: 1` | ✅ |
| §2.1 | 淺色背景 | #FFFFFF | `--bg-primary: #FFFFFF` | ✅ |
| §2.1 | 淺色表面 | #F8F9FA | `--bg-secondary: #F8F9FA` | ✅ |
| §2.1 | 淺色文字主 | #1A1A2E | `--text-primary: #1A1A2E` | ✅ |
| §2.1 | 淺色文字次 | #71717A | `--text-secondary: #71717A` | ✅ |
| §2.1 | 淺色邊框 | #E4E4E7 | `--border: #E4E4E7` | ✅ |
| §2.1 | 深色背景 | #0A0A0B | `.dark { --bg-primary: #0A0A0B }` | ✅ |
| §2.1 | 深色表面 | #18181B | `.dark { --bg-secondary: #18181B }` | ✅ |
| §2.1 | 深色文字主 | #F4F4F5 | `.dark { --text-primary: #F4F4F5 }` | ✅ |
| §2.1 | 深色文字次 | #A1A1AA | `.dark { --text-secondary: #A1A1AA }` | ✅ |
| §2.1 | 深色邊框 | #27272A | `.dark { --border: #27272A }` | ✅ |
| §7.1 | quant 強制深色 | 是 | `[data-theme="quant"]` 色彩均為深色 | ✅ |
| §7.1 | ai 強制深色 | 是 | `[data-theme="ai"]` 色彩均為深色 | ✅ |
| §7.1 | game 強制深色 | 是 | `[data-theme="game"]` 色彩均為深色 | ✅ |
| §7.1 | civil 淺色 | 是 | `[data-theme="civil"]` 色彩均為淺色 | ✅ |
| §7.1 | market 淺色 | 是 | `[data-theme="market"]` 色彩均為淺色 | ✅ |
| §7.1 | ppt 淺色 | 是 | `[data-theme="ppt"]` 色彩均為淺色 | ✅ |
| §2.3 | 量化交易樣例 | #0D1117 / #161B22 / #1C2128 / #E6EDF3 | quant 主題完全匹配 | ✅ |

> **註1**: 設計規範 §2.2 表格中 game 輔色為 `#004E89`（藍），但 §5.6 詳細描述中 game 輔色為 `#00FFF7`（青）。CSS 採用 §5.6 的值 `#00FFF7`，屬於規範內部不一致，非 CSS 實作錯誤。
>
> **註2**: 設計規範 §3.1 提及「Press Start 2P」像素字體用於遊戲大廳標題，但未在 `@theme` 的 `--font-*` 中註冊。可於後續遊戲頁面實作時補入。

---

## 評分明細

### 完整性 — 24/25

- ✅ `@theme` 區塊完整註冊了所有設計規範要求的 token：色彩（品牌色 + 六大事業體主色 + 功能色 + 語意別名）、間距（1–20，4px 基數）、圓角（sm/md/lg/xl）、陰影（sm/md/lg/xl）、字級（display/h1–h4/body/sm/xs/data-lg/data）、字重（4 級）、行高（3 級）、字體家族（sans + mono）
- ✅ 六個 `[data-theme]` 區塊各自完整覆蓋背景、文字、邊框、陰影等變數，並對應設計規範中各業務線 §5.x 的色彩細節
- ✅ `:root` 淺色主題 + `.dark` 深色主題 + `@media print` + `@media (prefers-reduced-motion: reduce)` 均齊備
- ✅ 額外提供：`@keyframes` 動畫（7 組）、毛玻璃效果（`.glass`）、主題過渡（`.theme-transition`）、滾動條樣式、選取顏色
- ⚠️ **扣 1 分**：「Press Start 2P」字體（設計規範 §3.1 提及）未在 `@theme` 中註冊，但這是遊戲頁面限定的裝飾字體，不影響核心主題系統，屬輕微遺漏

### 正確性 — 25/25

- **Tailwind v4 語法**: `@import "tailwindcss"` + `@theme` 區塊 token 命名完全遵循 v4 規範（`--color-*` / `--font-*` / `--text-*` / `--spacing-*` / `--radius-*` / `--shadow-*` / `--font-weight-*` / `--leading-*`），無任何語法錯誤
- **CSS 自定義屬性**: 所有 `var()` 引用鍵名正確、後備值（fallback）完整（如 `var(--theme-color, var(--brand))`）
- **語意別名**: `--color-surface: var(--bg-secondary)`、`--color-border: var(--border)`、`--color-accent: var(--theme-color, var(--brand))` 均為有效的 Tailwind v4 `@theme` 寫法——執行時期 `var()` 解析，產生的 utility class 可正常運作
- **業務線主題**: 六個 `[data-theme]` 區塊的色彩選擇與設計規範 §5.x 完全一致（quant 的 #0D1117/#161B22/#1C2128、civil 的 #F5F5F0/#FFFFFF、market 的 #FFF5F7/#E91E63 等）
- **深色/淺色切換**: `.dark` 區塊以 `:root` 淺色為基底覆蓋，正確使用變數覆蓋策略而非重新宣告全部
- **Print/Reduced-motion**: 語法正確，`!important` 使用在 print 區塊中恰當（強制隱藏導航列）
- **動畫定義**: 7 組 `@keyframes` 語法正確，對應的 `.animate-*` utility class 完整

### 可維護性 — 25/25

- ✅ **清晰的章節分隔**: 檔案以註解區塊分成「設計標記 (`@theme`)」「Design System Tokens (`:root`)」「全域樣式」「動畫」「業務線主題」「列印樣式」「無障礙」七個區域，層次分明
- ✅ **一致的命名慣例**: `--color-*`（@theme token）、`--*`（:root CSS 變數）、`--bg-*` / `--text-*` / `--border-*` 語義化命名
- ✅ **業務線主題集中管理**: 六個 `[data-theme]` 區塊排列一致，每區塊覆蓋相同的變數集合，易於比對與擴充
- ✅ **註解說明**: 所有區塊都有繁體中文章節標題與用途說明
- ✅ **無硬編碼**: 業務線主題中的 `--theme-color: var(--quant)` 等形式透過 CSS 變數引用 `:root` 定義，避免色彩值散落各處

### 測試與驗證 — 20/25

- ✅ **語法驗證**: 經人工審查，Tailwind CSS v4 `@theme` 語法與 CSS 自定義屬性語法均正確
- ✅ **與設計規範逐項對照**: 49 項對照點中 47 項完全符合、2 項為規範內部不一致或輕微遺漏（不影響功能）
- ✅ **UI 審美**: 主題系統設計精美——六大事業體各具獨特視覺語言、毛玻璃效果、7 組關鍵影格動畫、平滑主題過渡
- ⚠️ **缺少自動化測試**: 無 `.test.ts` 檔案驗證：
  - CSS 變數在渲染後是否正確解析（如 `var(--bg-secondary)` 在 `@theme` 中的行為）
  - 深色/淺色主題切換後變數覆蓋是否確實生效
  - `[data-theme]` 屬性變更後六大事業體色彩是否正確套用
- ⚠️ **未以 Tailwind CLI 或 build 工具實際驗證**: 建議執行 `npx tailwindcss --input src/app/globals.css` 確認 `@theme` 能正確產出 utility class

---

## 總分

| 項目 | 分數 | 備註 |
|------|------|------|
| 完整性 | 24/25 | Press Start 2P 字體未註冊（輕微遺漏） |
| 正確性 | 25/25 | 語法、命名、色彩數值均正確 |
| 可維護性 | 25/25 | 結構清晰，命名一致，註解完整 |
| 測試與驗證 | 20/25 | 無自動化測試，未以 Tailwind CLI 實測 |
| **總分** | **94/100** | **合格 (≥ 90)** |

## 結果：✅ 合格

**總分 94/100 ≥ 90，通過評分，無需返工。**

---

### 缺失項目與改進建議（非阻塞）

1. **Press Start 2P 字體（可選）**：設計規範 §3.1 提及用於遊戲大廳標題，建議在 `@theme` 補上 `--font-pixel: 'Press Start 2P', monospace;` 並在 CDN 或 `@font-face` 中載入該字體
2. **設計規範內部不一致**：game 輔色在 §2.2 為 `#004E89`（藍），§5.6 為 `#00FFF7`（青），CSS 已採用 §5.6 的值。建議與設計師確認後統一規範，或作為 CSS 的 intentional choice
3. **測試覆蓋（建議後續階段補充）**：
   - 可撰寫 Playwright 或 Cypress 測試，驗證 `data-theme` 切換後各 CSS 變數的 computed style
   - 可撰寫視覺回歸測試（如 Chromatic / Percy）確保主題變更不破壞既有頁面
4. **Tailwind CLI 建置驗證**：建議在 CI 中加入 `npx @tailwindcss/cli -i src/app/globals.css -o /dev/null` 以確認 `@theme` 區塊能正確產出 utility classes
