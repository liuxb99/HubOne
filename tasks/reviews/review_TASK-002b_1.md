# TASK-002b 共用 UI 元件庫 — 評分報告

**審查範圍**: Button, Card, Input, Select, Modal, Skeleton, Spinner, Badge, Tabs, Toggle (共 10 個元件 + index.ts)  
**設計規範參考**: `docs/design-system.md`  
**審查日期**: 2025-01

---

## 一、檢查清單

| # | 檢查項目 | 結果 | 備註 |
|---|----------|------|------|
| 1 | 符合設計規範 `docs/design-system.md` | ✅ 通過 | 各變體、尺寸、圓角、陰影均對應規範章節 6.2～6.5 |
| 2 | 支援 `className` prop 外部覆蓋 | ✅ 通過 | 所有元件均使用 `cn()` 合併 className |
| 3 | 支援深色/淺色主題 | ✅ 通過 | 使用 `--bg-primary`、`--text-primary`、`--theme-color` 等 CSS 變數 |
| 4 | TypeScript 型別完善 | ✅ 通過 | Button/Input 使用 `forwardRef` 泛型；Select/Tabs 導出型別介面 |
| 5 | 所有元件加 `"use client"` | ✅ 通過 | 10/10 元件均以 `"use client"` 開頭 |
| 6 | 程式碼品質（命名、結構、註解） | ✅ 通過 | 統一 JSDoc + `@example`，一致的 `cn()`/CSS var/transition 模式 |

---

## 二、逐元件審查摘要

### Button.tsx
| 項目 | 說明 |
|------|------|
| 變體 | primary / secondary / ghost / danger / icon / large — 完全對應規範 §6.2 |
| 尺寸 | sm(32px) / md(40px) / lg(48px) — large variant 固定 48px 符合 CTA 規範 |
| 狀態 | loading（內嵌 Spinner）+ disabled（opacity-50 + cursor-not-allowed） |
| 主題 | 使用 `--theme-color`、`--text-secondary`、`--bg-tertiary`、`--border` CSS 變數 |
| 可及性 | `focus-visible:ring-2`、disabled 語意、`type` 預設 `"button"` |
| 型別 | `forwardRef<HTMLButtonElement, …>` + 展開 `ButtonHTMLAttributes` |
| ✅ 亮點 | arrow function 命名、const enum-like sizeMap/variantMap、icon/large 的 `isSizeLocked` 邏輯 |

### Card.tsx
| 項目 | 說明 |
|------|------|
| 變體 | default / clickable / data / product — 完全對應規範 §6.3 |
| 圓角 | `--radius-md` (8px) 符合規範 |
| 陰影 | default/clickable: `--shadow-md` / hover 升級 `--shadow-lg` ✅ |
| hover | clickable/data 預設啟用 `-translate-y-0.5`（約 -2px）符合規範 |
| product | 使用 `border` 而非陰影，符合 §6.3 "無陰影但有邊框" |
| ✅ 亮點 | `padding` / `hover` 提供預設值但可覆蓋；data variant 專用 props（icon/value/label） |

### Input.tsx
| 項目 | 說明 |
|------|------|
| 規格 | label / error / helperText / prefix / suffix — 完全對應規範 §6.4 |
| focus | `focus-within:border-[var(--theme-color)]` + 微陰影 ✅ |
| error | 紅色邊框 + `role="alert"` 錯誤訊息 ✅ |
| 可及性 | `aria-invalid`、`aria-describedby`、label `htmlFor` 關聯 ✅ |
| 型別 | `forwardRef<HTMLInputElement, …>` + 展開 `InputHTMLAttributes` ✅ |
| ✅ 亮點 | `inputId` 自動從 label 產生、placeholder 使用 `--text-tertiary` 變數 |

### Select.tsx
| 項目 | 說明 |
|------|------|
| 規格 | 自定義下拉（非原生）、圓角 8px、選項 hover 高亮 — 符合 §6.4 |
| 行為 | 點擊外部關閉、Escape 關閉、鍵盤 focus-visible ✅ |
| 可及性 | `aria-expanded`、`aria-haspopup="listbox"`、`role="listbox"`/`role="option"` ✅ |
| 型別 | 導出 `SelectOption` 介面 ✅ |
| ⚠️ 注意 | 沒有鍵盤方向鍵導航（上/下/Enter），僅有 Escape 關閉 — 可改進 |

### Modal.tsx
| 項目 | 說明 |
|------|------|
| 動畫 | `animate-scale-in` 符合規範 §9.2（scale(0.95)→1 + fade） |
| 尺寸 | sm / md / lg / xl — 對應 `max-w-sm` ~ `max-w-4xl` |
| 關閉 | 遮罩點擊關閉 + Escape 鍵關閉 ✅ |
| 滾動鎖 | `document.body.style.overflow = "hidden"` ✅ |
| 圓角 | `--radius-lg` (12px) 符合規範 |
| 陰影 | `--shadow-xl` 符合規範 |
| ✅ 亮點 | 無標題時仍顯示關閉按鈕、`aria-modal` + `role="dialog"` 完整 |

### Skeleton.tsx
| 項目 | 說明 |
|------|------|
| 變體 | text / card / image / circle — 符合規範 §6.5 |
| 動畫 | 使用 `animate-shimmer`（漸層掃光） |
| ⚠️ 注意 | 規範 §9.2 要求 `@keyframes pulse`（背景色來回漸變），實作使用 shimmer（漸層掃光）— **輕微偏離規範**。兩者皆為載入佔位動畫，功能等效但視覺效果不同。 |
| 型別 | width/height 接受 `string | number` ✅ |

### Spinner.tsx
| 項目 | 說明 |
|------|------|
| 尺寸 | sm(16px) / md(24px) / lg(32px) ✅ |
| 動畫 | `animate-spin` 圓環旋轉 ✅ |
| 主題 | 使用 `border-current` + `border-t-transparent` 繼承文字色 |
| 可及性 | `role="status"` + `aria-label="載入中"` ✅ |
| ✅ 亮點 | 簡潔實作，可透過 `className` 自訂顏色 |

### Badge.tsx
| 項目 | 說明 |
|------|------|
| 變體 | default / success / warning / error / info ✅ |
| 模式 | 一般標籤 + dot（小圓點）模式 ✅ |
| 主題 | 非 default 變體使用 `--success`/`--warning`/`--error`/`--info` 變數；default 使用 `dark:` Tailwind class |
| ✅ 亮點 | 圓角 full、簡潔 props 設計 |

### Tabs.tsx
| 項目 | 說明 |
|------|------|
| 結構 | 水平 Tab + 滑動底線指示器 — 符合規範 §6.1 (次導航) |
| 動畫 | 底線滑動 `duration-300 ease-in-out` 符合規範 §9.1 |
| 可及性 | `role="tablist"`、`role="tab"`、`aria-selected` ✅ |
| 型別 | 導出 `TabItem` 介面 ✅ |
| ✅ 亮點 | `useRef` 動態計算底線位置，非硬編碼 |
| ⚠️ 注意 | 未監聽 `ResizeObserver` — 視窗縮放時底線位置不會即時更新 |

### Toggle.tsx
| 項目 | 說明 |
|------|------|
| 風格 | iOS 風格開關，平滑過渡 200ms — 符合規範 §6.4 |
| 狀態 | checked / unchecked / disabled ✅ |
| 主題 | checked 時使用 `--theme-color`；unchecked 使用 Tailwind `dark:` 處理 |
| 可及性 | `role="switch"`、`aria-checked` ✅ |
| ✅ 亮點 | 簡潔實作，label 可選，點擊 label 連動（`<label>` 包裹） |

### index.ts
- 正確匯出所有 10 個元件及 2 個型別（`SelectOption`、`TabItem`）✅
- 使用 `export { default as X }` 模式 ✅

---

## 三、評分明細

### 評分面向 1：設計規範符合度（25 分）

| 加分項 | 扣分項 |
|--------|--------|
| 所有 Button 變體對應 §6.2 | — |
| 所有 Card 變體對應 §6.3 | — |
| Input/Select/Toggle 對應 §6.4 | — |
| Skeleton/Spinner 對應 §6.5 | Skeleton 使用 shimmer 而非規範指定的 pulse（§9.2） |
| Modal/Tabs 動畫對應 §9 | — |
| 圓角、陰影、間距與 CSS 變數一致 | — |

**得分：23 / 25**（shimmer vs pulse 輕微偏離 -2）

---

### 評分面向 2：外部擴展性 & TypeScript 型別（25 分）

| 加分項 | 扣分項 |
|--------|--------|
| 10/10 元件均接受 `className` + `cn()` 合併 | — |
| Button/Input 使用 `forwardRef` + 展開 HTML 屬性 | — |
| Select/Tabs 導出公開型別介面 | — |
| 所有 props 皆有明確 type/interface | — |
| 無 `any` 型別使用 | — |

**得分：25 / 25**

---

### 評分面向 3：主題支援 & 客戶端標註（25 分）

| 加分項 | 扣分項 |
|--------|--------|
| 所有元件使用 CSS 變數（`--bg-primary` 等） | — |
| .dark 類別變數已全域定義（globals.css） | — |
| 六大事業體 `[data-theme]` 主題變數已定義 | — |
| 10/10 元件均有 `"use client"` | — |
| placeholder/disabled/error 狀態皆使用主題變數 | — |

**得分：25 / 25**

---

### 評分面向 4：程式碼品質（25 分）

| 加分項 | 扣分項 |
|--------|--------|
| 所有元件有 JSDoc + `@example` | Select 缺少鍵盤上下導航（僅 Escape） |
| 命名一致（camelCase, PascalCase 適當） | — |
| `cn()` / CSS var / transition 模式統一 | — |
| 完整的 ARIA 屬性支援 | — |
| 元件責任單一、結構清晰 | — |

**得分：23 / 25**（Select 鍵盤導航不完整 -1、Skeleton 動畫偏離 -1）

---

## 四、總分與結論

| 面向 | 得分 | 滿分 |
|------|:----:|:----:|
| 設計規範符合度 | 23 | 25 |
| 外部擴展性 & TypeScript | 25 | 25 |
| 主題支援 & use client | 25 | 25 |
| 程式碼品質 | 23 | 25 |
| **總分** | **96** | **100** |

**判定：✅ 合格（≥ 90）**

---

## 五、改進建議（非阻擋性）

1. **Select — 鍵盤導航**：加入 `ArrowUp`/`ArrowDown`/`Enter` 鍵盤事件提升無障礙體驗（`src/components/ui/Select.tsx:85-95`）。
2. **Skeleton — 動畫一致性**：若設計團隊確認 pulse 為規範意圖，可將 `animate-shimmer` 改為 pulse 效果（`src/components/ui/Skeleton.tsx:38`）。
3. **Tabs — ResizeObserver**：加入 `ResizeObserver` 監聽確保視窗縮放時底線位置即時更新（`src/components/ui/Tabs.tsx:45-50`）。
4. **Button — 自訂 color 傳遞**：目前 `variant="primary"` 固定使用 `--theme-color`，可考慮允許外部透過 CSS 變數覆蓋。
