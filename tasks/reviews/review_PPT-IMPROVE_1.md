# Review: PPT 編輯器強化（Markdown 雙向同步 + 過渡動畫系統）

**評分人：** Reviewer 子代理  
**評分日期：** 2025-07  
**評分範圍：** 11 個檔案（4 新建 + 7 修改）

---

## 一、檢查清單

| 檢查項 | 結果 | 備註 |
|--------|------|------|
| **Markdown 雙向轉換引擎** — `src/lib/ppt/markdown.ts` | ✅ YES | `markdownToDocument()` / `slidesToMarkdown()` 完整實作，支援 frontmatter、標題、列表、程式碼區塊、引言、圖片 |
| **過渡動畫系統** — `src/lib/ppt/animations.ts` | ✅ YES | 8 種過渡型別（none/fade/slide-*/zoom/flip），含方向感知、持續時間、CSS keyframes、中文 UI 標籤 |
| **MD 導入對話框** — `MarkdownImportModal.tsx` | ✅ YES | 貼上/檔案雙模式、格式驗證、錯誤處理、範例載入、預覽投影片計數 |
| **MD 匯出對話框** — `MarkdownExportModal.tsx` | ✅ YES | 唯讀預覽、複製到剪貼簿（含降級方案）、下載 .md、統計資訊 |
| **`types.ts` 新增 transition/notes 欄位** | ✅ YES | `Slide` 型別新增 `transition?: string`、`transitionDuration?: number`、`notes?: string` |
| **`store.tsx` 新增 `UPDATE_SLIDE` action** | ✅ YES | `pptReducer` 中完整處理 `{ type: "UPDATE_SLIDE", payload: { slideId, updates } }` |
| **`Toolbar.tsx` 加入 MD 按鈕** | ✅ YES | 接收 `onImportMD` / `onExportMD` props，渲染「導入 MD」「匯出 MD」按鈕 |
| **`page.tsx` 整合 Modal** | ✅ YES | Dynamic import 兩個 Modal，React state 控制開關，Props 正確傳遞 |
| **`SlidePreview.tsx` 加入過渡動畫** | ✅ YES | 整合 `getTransitionStyles()`、注入 keyframe CSS、支援方向、鍵盤/觸控/點擊操作 |
| **`PropertyPanel.tsx` 加入過渡設定 UI** | ✅ YES | 下拉選單選過渡型別 + 滑桿控制持續時間（200ms–2000ms） |
| **`export.ts` 保留過渡動畫** | ✅ YES | `data-transition` / `data-transition-duration` 屬性寫入 HTML，JS 端 `applyTransition()` 執行動畫 |

**檢查清單結果：11/11 ✅ 全數通過**

---

## 二、四項評分（各 0–25）

### A. 完整性 — **22 / 25**

| 優點 | 扣分項 |
|------|--------|
| 所有規格要求的功能皆已實作 | ❌ `PropertyPanel` 缺少 `notes`（演講者備忘錄）編輯欄位 — 型別已定義但無 UI |
| 導入支援 YAML frontmatter（transition/background/notes） | ❌ 行內格式雙向遺失：導入時 `stripInlineMarkdown()` 移除 **bold**/*italic*/`code` 標記，匯出時純文字無從還原，**roundtrip 丟失 inline 格式** |
| 匯出保留過渡設定 + 內嵌執行 JS | |
| 支援 8 種過渡型別，含方向感知 | |

### B. 正確性 — **21 / 25**

| 優點 | 扣分項 |
|------|--------|
| Reducer 邏輯正確：`UPDATE_SLIDE` 會用 `...slide, ...updates` 合併，preserves 其他欄位 | ❌ `parseBlockToSlide()` 雙重疊代：第一次遍歷掃標題並 push heading 元素，第二次遍歷再跳過標題行掃剩餘內容。heading 和 content 的 `ctx.y` 狀態缺乏 coherency — heading 的 y 推進在第一次循環，content 的 y 推進在第二次循環，兩者共用同一個 `ctx`，可能導致重疊或過度間距 |
| 動畫 CSS keyframes 語法正確，`backface-visibility` 在 flip 中有處理 | ❌ `SlidePreview.goToSlide()` 多步跳頁有閃爍問題：使用 for-loop 連續 dispatch `NEXT_SLIDE`/`PREV_SLIDE` N 次，**中間頁會短暫閃現**，動畫僅應用於最終目標頁 |
| HTML 匯出的 `applyTransition()` 函數邏輯完整 | ❌ `elementToMarkdown()` 靠 fontSize + fontWeight 閾值啟發式判斷標題層級 — 一個 36px bold 非標題文字會被誤判為 `#` |
| Frontmatter YAML 解析器過於簡陋：僅支援 `key: value` 單行，有冒號的值無法正確解析 | |

### C. 程式碼品質 — **20 / 25**

| 優點 | 扣分項 |
|------|--------|
| 全域 TypeScript 型別嚴謹，`SlideElement` 為 tagged union | ❌ `markdown.ts:232-294` — `parseBlockToSlide()` 兩次遍歷 content lines，同樣的 loop logic 重複兩次，可合併成單次遍歷 |
| 模組職責清晰：markdown.ts / animations.ts / export.ts 獨立 | ❌ `pptreducer` 中多個 case 重複 `const now = Date.now();`（可統一提取） |
| 中文 JSDoc 註解完整，對團隊友善 | |
| 雙 Modal 皆有 loading/error/empty state 處理 | ❌ `stripInlineMarkdown()` 在 import 端無差別移除所有 inline 標記，導致編輯器內僅存純文字 — 若使用者從外部貼上含 **bold** 的 MD，渲染後看不到粗體 |
| Good testability surface（純函數 `markdownToSlides` / `slidesToMarkdown` / `exportToHTML`） | ❌ 無單元測試檔案 |

### D. 使用者體驗 — **22 / 25**

| 優點 | 扣分項 |
|------|--------|
| 導入 Modal 有「貼上/檔案」雙模式、語法提示卡、範例載入、清除按鈕 | ❌ 檔案模式**無 drag-and-drop**（僅點擊選擇），與介面提示「拖曳檔案到此區域」不符 |
| 匯出 Modal 有複製/下載/統計資訊 | ❌ 過渡設定 UI 無即時預覽 — 使用者必須進入放映模式才能看到效果 |
| 放映模式支援 dots 跳頁、左右點擊、觸控滑動、鍵盤（Home/End/Space/Esc） | ❌ PropertyPanel 中無 notes 欄位，演講者備忘錄無法編輯儲存 |
| 過渡選單有中文標籤 | |

---

## 三、總結評分

| 項目 | 分數 | 佔比 | 加權 |
|------|------|------|------|
| A. 完整性 | 22 | 25% | 5.5 |
| B. 正確性 | 21 | 25% | 5.25 |
| C. 程式碼品質 | 20 | 25% | 5.0 |
| D. 使用者體驗 | 22 | 25% | 5.5 |
| **總分** | **85** | **100%** | **21.25** |

### 判定：❌ 不合格（85 < 90）

### 關鍵待改進項目（依優先序）

1. **🟥 行內格式 roundtrip 遺失** — `markdown.ts` 導入時用 `stripInlineMarkdown()` 拋棄了 `**bold**` 等語法資訊，應改為將 inline 格式轉譯為 TextElement 的子區段或保留原始 MD 源供 export 參照
2. **🟥 `SlidePreview.goToSlide()` 多步跳頁閃爍** — 應跳過中間 slides 直接 dispatch 到目標 index，或使用 `setTimeout` chain 逐頁動畫而非立即 dispatch
3. **🟧 `notes` 無 UI** — `types.ts` 已定義 `notes?: string` 但 PropertyPanel 無對應編輯欄位，功能僅存在於 frontmatter import/export 路徑
4. **🟧 `parseBlockToSlide()` 雙重疊代** — 可重構為單次遍歷，減少維護負擔和 y 座標不一致風險
5. **🟧 無單元測試** — `markdownToSlides` / `slidesToMarkdown` / `exportToHTML` 為純函數，適合 Jest/Vitest 測試；應補上 boundary cases（空 frontmatter、多個 --- 連續、無效 YAML）
6. **🟡 檔案匯入無 drag-and-drop** — 介面提示支援但未實作

---

## 四、各檔案逐行要點

| 檔案 | 關鍵行 | 備註 |
|------|--------|------|
| `src/lib/ppt/types.ts` | L89–92 | `Slide` 新增 `transition?` / `transitionDuration?` / `notes?` ✅ |
| `src/lib/ppt/store.tsx` | L164–170 | `UPDATE_SLIDE` action 實作 ✅ |
| `src/lib/ppt/markdown.ts` | L119–220 | `parseBlockToSlide()` 雙重疊代 🔴 |
| `src/lib/ppt/markdown.ts` | L61–69 | `stripInlineMarkdown()` 拋棄 inline 格式 🔴 |
| `src/lib/ppt/markdown.ts` | L323 | `elementToMarkdown()` 啟發式標題判斷 🔴 |
| `src/lib/ppt/animations.ts` | L12–15 | 8 種過渡型別 ✅ |
| `src/lib/ppt/animations.ts` | L47–126 | CSS keyframes 定義完整 ✅ |
| `src/lib/ppt/animations.ts` | L129–200 | `getTransitionStyles()` 方向感知 ✅ |
| `src/components/ppt/SlidePreview.tsx` | L108–139 | `goToSlide()` 多步循環 dispatch 🔴 |
| `src/components/ppt/SlidePreview.tsx` | L58 | keyframe CSS injection ✅ |
| `src/components/ppt/PropertyPanel.tsx` | L161–218 | 過渡設定 UI（select + slider）✅ |
| `src/components/ppt/PropertyPanel.tsx` | (missing) | 無 notes 編輯區 🔴 |
| `src/lib/ppt/export.ts` | L103–106 | `data-transition` / `data-transition-duration` 屬性 ✅ |
| `src/lib/ppt/export.ts` | L177–213 | `applyTransition()` JS 函數 ✅ |
