# PPT 編輯器功能完善開發計劃

> 基於 `docs/research-online-ppt.md` 研究發現，結合當前程式碼現狀（`src/lib/ppt/` + `src/components/ppt/`）產出的分階段實作計劃。

---

## 目錄

1. [Scope 界定與當前狀態摘要](#1-scope-界定與當前狀態摘要)
2. [階段一：Markdown 雙向同步（P0）](#2-階段一markdown-雙向同步p0)
3. [階段二：投影片過渡動畫系統（P0）](#3-階段二投影片過渡動畫系統p0)
4. [階段三：匯出強化 + Speaker Notes（P1）](#4-階段三匯出強化--speaker-notesp1)
5. [階段四：模板系統強化（P1）](#5-階段四模板系統強化p1)
6. [階段五：程式碼區塊元件（P2）](#6-階段五程式碼區塊元件p2)
7. [階段六：自由畫布定位系統（P2）](#7-階段六自由畫布定位系統p2)
8. [總結：影響範圍矩陣](#8-總結影響範圍矩陣)

---

## 1. Scope 界定與當前狀態摘要

### 當前已實作功能

| 層面 | 狀態 | 關鍵檔案 |
|------|------|---------|
| 核心型別（Slide, Element, Template） | ✅ 完整 | `src/lib/ppt/types.ts` |
| 狀態管理（Context + useReducer） | ✅ 完整 | `src/lib/ppt/store.tsx` |
| localStorage 持久化 | ✅ 完整 | `store.tsx` 中 `saveToStorage / loadFromStorage` |
| 8 套配色模板 | ✅ 完整 | `src/lib/ppt/template.ts` |
| HTML 匯出 + 放映導航 | ✅ 完整 | `src/lib/ppt/export.ts` |
| 工具列（文字格式、元件新增） | ✅ 完整 | `src/components/ppt/Toolbar.tsx` |
| 畫布編輯（拖曳、縮放、雙擊新增） | ✅ 完整 | `src/components/ppt/SlideEditor.tsx` |
| 投影片縮圖列表（拖曳排序） | ✅ 完整 | `src/components/ppt/SlideList.tsx` |
| 文字編輯（contentEditable） | ✅ 完整 | `src/components/ppt/TextView.tsx` |
| 屬性面板（背景、文字、形狀、位置） | ✅ 完整 | `src/components/ppt/PropertyPanel.tsx` |
| 模板選取 Modal | ✅ 完整 | `src/components/ppt/TemplatePicker.tsx` |
| 全螢幕放映模式 | ✅ 完整 | `src/components/ppt/SlidePreview.tsx` |

### 欠缺功能（按研究建議優先級）

| 優先級 | 功能 | 借鑑來源 | 預計實作階段 |
|--------|------|---------|------------|
| **P0** | Markdown 導入/匯出（雙向同步） | Slidev | 階段一 |
| **P0** | 投影片過渡動畫系統（Auto-Animate + Fragment） | Reveal.js | 階段二 |
| **P1** | 匯出強化（Speaker Notes、目錄、語法高亮） | Reveal.js | 階段三 |
| **P1** | 模板系統強化（Layout 架構、更多佈局） | Slidev | 階段四 |
| **P2** | 程式碼區塊元件 + 語法高亮 | Spectacle CodePane | 階段五 |
| **P2** | 自由畫布定位（data-* 定位系統） | Impress.js | 階段六 |

---

## 2. 階段一：Markdown 雙向同步（P0）

### 2.1 概述

借鑑 Slidev 的 Markdown 驅動管線，實現 Markdown ↔ 內部 PPT 文件的雙向轉換。使用者可以：
- 匯入 `.md` 檔案自動生成投影片
- 將當前簡報匯出為 `.md` 檔案

### 2.2 要修改/建立的檔案

```
新增:
  src/lib/ppt/markdown.ts          # Markdown ↔ PPTDocument 轉換核心
  src/components/ppt/MarkdownImportModal.tsx  # 導入對話框
  src/components/ppt/MarkdownExportModal.tsx  # 匯出對話框

修改:
  src/components/ppt/Toolbar.tsx    # 加入 Markdown 導入/匯出按鈕
  src/app/ppt/page.tsx             # 加入 Modal 狀態管理
```

### 2.3 實作方式

#### 2.3.1 轉換核心 `markdown.ts`

**Markdown → PPTDocument 解析管線：**

```
Markdown 字串
  → 以 \n---\n 分割為區塊（每個區塊 = 一頁投影片）
  → 解析 frontmatter（YAML 格式，位於區塊開頭 --- ... ---）
  → 每區塊內容按行解析：
    - 行首 ## / ### → 建立標題 TextElement（heading 級別對應字型大小）
    - 行首 - / * → 建立要點 TextElement（前置 bullet 符號）
    - 行首 > → 建立引用區塊（斜體 + 左邊框）
    - 行首 ``` → 建立程式碼區塊（code block，含語言標記）
    - 空白行分隔不同段落
  → 產出 SlideElement[]
```

**Design decisions:**
- 每張投影片的第一個 `#` 或 `##` 作為標題，設 `fontSize: 36`、置中
- 其餘內容作為正文，設 `fontSize: 20`、靠左
- 程式碼區塊使用 `type: "text"`，但附加 `monospace` 標記（後續階段五可升級為專用元件）
- 支援 frontmatter 屬性：`layout`, `background`, `transition`

**PPTDocument → Markdown 序列化管線：**

```
PPTDocument
  → 每頁 Slide 轉為區塊：
    - 輸出背景註釋 <!-- bg: ... -->（可選）
    - 依元素排序（由左上到右下）：
      * 最大字型 TextElement → ## 標題
      * 列表型 TextElement → - 要點
      * 其餘 TextElement → 段落
      * ImageElement → ![alt](src)
    - 各區塊以 \n---\n 分隔
  → 合併為完整 Markdown 字串
```

#### 2.3.2 基礎型別擴充（`types.ts`）

```typescript
// 在 Slide 中新增
export interface Slide {
  // ... 現有欄位
  notes?: string;           // Speaker Notes（階段三用到）
  transition?: string;      // 過渡效果名稱（階段二用到）
  layout?: string;          // 佈局名稱（階段四用到）
}
```

#### 2.3.3 解析策略（遞迴下降）

```typescript
// 偽代碼 — 核心解析邏輯
function parseMarkdownToDoc(md: string): PPTDocument {
  const blocks = md.split(/\n---\n/);
  const slides: Slide[] = blocks.map(parseBlockToSlide);
  return { ...defaultDoc, slides };
}

function parseBlockToSlide(block: string): Slide {
  const lines = block.split('\n');
  let frontmatter = {};
  let contentLines = lines;
  if (lines[0]?.startsWith('---')) {
    const fmEnd = lines.findIndex((l, i) => i > 0 && l.startsWith('---'));
    frontmatter = parseYAML(lines.slice(1, fmEnd).join('\n'));
    contentLines = lines.slice(fmEnd + 1);
  }
  const elements = parseContentToElements(contentLines);
  return { ...defaultSlide, ...frontmatter, elements };
}
```

### 2.4 使用者在 UI 中的操作流程

**導入流程：**
1. 工具列點擊「📄 Markdown」按鈕 → 下拉選單「導入」
2. Modal 開啟，包含檔案選取器 + 文字區域（可直接貼上 Markdown）
3. 預覽區顯示轉換結果的投影片縮圖
4. 點擊「確認導入」→ 取代或附加到當前文件

**匯出流程：**
1. 工具列點擊「📄 Markdown」按鈕 → 下拉選單「匯出」
2. Modal 顯示預覽 Markdown 內容
3. 點擊「下載 .md」或「複製到剪貼簿」

### 2.5 驗收標準

- [ ] 匯入 `# Title\n\n- Point 1\n- Point 2\n---\n# Slide 2` 產生 2 頁投影片
- [ ] 匯入包含程式碼區塊的 Markdown，文字保留 monospace 樣式
- [ ] 匯入包含 frontmatter（`background`、`transition`）的 Markdown，正確應用到投影片屬性
- [ ] 匯出當前簡報為 Markdown，再重新導入，內容一致（往返測試）
- [ ] 工具列按鈕可正確開啟/關閉導入/匯出 Modal

---

## 3. 階段二：投影片過渡動畫系統（P0）

### 3.1 概述

借鑑 Reveal.js 的 **Auto-Animate**（差值動畫）和 **Fragment**（步進動畫），為投影片切換與元素出現提供流暢動畫。

### 3.2 要修改/建立的檔案

```
新增:
  src/lib/ppt/animations.ts       # 動畫型別定義 + 動畫輔助函式
  src/lib/ppt/transitionStyles.ts # CSS 過渡樣式定義

修改:
  src/lib/ppt/types.ts            # 加入 Animation / Fragment 型別
  src/lib/ppt/export.ts           # 匯出中加入動畫 CSS + JS
  src/components/ppt/SlideEditor.tsx  # 編輯模式預覽動畫
  src/components/ppt/SlidePreview.tsx # 放映模式加入動畫
  src/components/ppt/PropertyPanel.tsx # 動畫設定面板
```

### 3.3 實作方式

#### 3.3.1 型別擴充（`types.ts`）

```typescript
// ── Fragment 步進動畫 ─────────────────────────────────────────────────

export interface Fragment {
  index: number;          // 在投影片內的出場順序
  animation: FragmentAnimation;
  duration: number;       // 毫秒
}

export type FragmentAnimation =
  | 'fade-in'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'zoom-in'
  | 'highlight'
  | 'none';

// ── 投影片過渡動畫 ───────────────────────────────────────────────────

export type SlideTransition =
  | 'none'
  | 'fade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'zoom'
  | 'flip'
  | 'convex'
  | 'concave';

// ── 擴充 Slide ─────────────────────────────────────────────────────────

// 在現有 Slide 中新增欄位
export interface Slide {
  // ... 現有欄位
  transition?: SlideTransition;      // 此頁過渡效果
  transitionDuration?: number;       // 過渡持續時間（毫秒）
  fragments?: Fragment[];            // 此頁的步進動畫設定
  autoAnimate?: boolean;             // 是否啟用 Auto-Animate（從上一頁差值）
}
```

#### 3.3.2 動畫輔助模組（`animations.ts`）

```typescript
export const TRANSITION_CSS: Record<SlideTransition, string> = {
  'none':        '',
  'fade':        'opacity 0.6s ease',
  'slide-left':  'transform 0.6s ease',
  'slide-right': 'transform 0.6s ease',
  'slide-up':    'transform 0.6s ease',
  'slide-down':  'transform 0.6s ease',
  'zoom':        'transform 0.8s ease',
  'flip':        'transform 0.8s ease',
  'convex':      'transform 0.7s ease',
  'concave':     'transform 0.7s ease',
};

export const FRAGMENT_CSS: Record<FragmentAnimation, string> = {
  'fade-in':    'opacity 0.4s ease',
  'slide-up':   'transform 0.4s ease, opacity 0.4s ease',
  'slide-down': 'transform 0.4s ease, opacity 0.4s ease',
  'slide-left': 'transform 0.4s ease, opacity 0.4s ease',
  'slide-right':'transform 0.4s ease, opacity 0.4s ease',
  'zoom-in':    'transform 0.4s ease, opacity 0.4s ease',
  'highlight':  'color 0.3s ease, background-color 0.3s ease',
  'none':       '',
};
```

#### 3.3.3 CSS 過渡樣式（`transitionStyles.ts`）

匯出完整的 CSS 字串，包含：
- **過渡類別**: `.slide-transition-fade`, `.slide-transition-slide-left` 等
  - 使用 CSS `@keyframes` 定義進/出動畫
  - 進入：`slide-enter-{name}`，離開：`slide-exit-{name}`
- **Fragment 類別**: `.fragment`, `.fragment.fragment-visible`, `.fragment.fragment-current`
  - 預設 `opacity: 0; transform: translateY(20px)` 等
  - `.fragment-visible` 時還原
- **Auto-Animate 支援**: 透過 CSS `transition` + 元素比對（比對 `data-element-id`）

#### 3.3.4 放映模式整合（`SlidePreview.tsx`）

在放映模式中加入：
1. 投影片切換時套用 `transition` CSS class
2. 每頁投影片內部支援 Fragment 步進（按空白鍵/下一個時，先走完 fragment 再切頁）
3. 使用 `useState` 追蹤當前 fragment index，當所有 fragment 顯示完才允許切頁

```typescript
// SlidePreview.tsx 新增狀態
const [fragmentIndex, setFragmentIndex] = useState(0);
const currentSlideFragments = currentSlide?.fragments ?? [];

// 下一頁邏輯
const goNext = useCallback(() => {
  if (fragmentIndex < currentSlideFragments.length) {
    setFragmentIndex(i => i + 1);
    return; // 先走完 fragment
  }
  // 真的切到下一頁
  setFragmentIndex(0);
  editorDispatch({ type: "NEXT_SLIDE", payload: { total } });
}, [fragmentIndex, currentSlideFragments.length, editorDispatch, total]);
```

#### 3.3.5 屬性面板整合（`PropertyPanel.tsx`）

當選取投影片（無選取元素）時，在背景設定區塊下方新增：
- **過渡效果下拉選單**: 選擇 `SlideTransition`
- **過渡持續時間滑桿**: 200ms – 2000ms
- **啟用 Auto-Animate 切換開關**
- **Fragment 管理**: 顯示當前元素列表 + 拖曳排序 fragment index

### 3.4 驗收標準

- [ ] 投影片切換時有平滑過渡動畫（fade / slide / zoom 至少三種生效）
- [ ] 同一頁內元素可設定 Fragment 步進，放映時依序出現
- [ ] Auto-Animate 模式下，相鄰兩頁相同 `data-element-id` 的元素平滑差值
- [ ] 屬性面板可設定過渡效果與 Fragment
- [ ] 匯出 HTML 保留過渡動畫（退化方案：當 JS 不可用時無動畫但功能正常）

---

## 4. 階段三：匯出強化 + Speaker Notes（P1）

### 4.1 概述

在現有 `exportToHTML` 的基礎上，加入：
- Speaker Notes（演講者備註）支援
- 自動生成目錄頁
- 程式碼語法高亮（highlight.js）
- 改進的投影片定位與導航

### 4.2 要修改/建立的檔案

```
新增:
  src/lib/ppt/export-enhanced.ts   # 強化版匯出（可選擇保留原 export.ts 作為輕量版）

修改:
  src/lib/ppt/types.ts             # 加入 notes 欄位
  src/components/ppt/PropertyPanel.tsx  # 加入 Speaker Notes 編輯區域
  src/components/ppt/TextView.tsx   # 支援在文字編輯中標記 fragment（後續階段）
  src/components/ppt/Toolbar.tsx    # 匯出選項對話框
  src/app/ppt/page.tsx             # 匯出選項 Modal
```

### 4.3 實作方式

#### 4.3.1 Speaker Notes 支援

**資料層**（`types.ts`）：
```typescript
export interface Slide {
  // ... 現有
  notes?: string;      // Markdown 格式的演講者備註
}
```

**編輯 UI**（`PropertyPanel.tsx`）：
- 在投影片背景設定下方新增「演講者備註」區域
- 可摺疊的 textarea，支援 Markdown 簡格式
- 圖示：🎤

**匯出**（`export-enhanced.ts`）：
- 在每頁投影片 HTML 中加入隱藏的 `div.speaker-notes`（`display: none`）
- 在放映模式中按 `S` 鍵開啟 Speaker Notes 視窗（彈出獨立視窗或側邊欄）
- 跟 Reveal.js 模式：新視窗顯示當前頁的 notes + 下一頁 preview

```html
<!-- 每頁投影片中嵌入 -->
<div class="speaker-notes" style="display:none">${esc(slide.notes ?? '')}</div>

<!-- 底部 toolbar 加入 speaker notes 按鈕 -->
<script>
  let notesWindow = null;
  document.addEventListener('keydown', (e) => {
    if (e.key === 's' && !e.ctrlKey && !e.metaKey) {
      if (notesWindow) { notesWindow.close(); notesWindow = null; return; }
      notesWindow = window.open('', 'speaker-notes', 'width=600,height=400');
      // 寫入當前 slide notes + next slide preview
    }
  });
</script>
```

#### 4.3.2 自動生成目錄頁

**邏輯**（`export-enhanced.ts`）：
- 在匯出時，遍歷所有投影片，抓取每頁第一個標題 TextElement 作為條目
- 在第一頁之前插入一張目錄投影片
- 目錄頁使用模板的 primary/secondary 配色，列出各頁標題與頁碼
- 每個目錄條目可點擊跳轉

**生成演算法**：
```typescript
function generateTOCSlide(doc: PPTDocument): Slide {
  const tocTitle: TextElement = {
    id: generateId(), type: 'text',
    position: { x: 80, y: 60 }, size: { width: 800, height: 80 },
    content: '目錄', fontSize: 40, fontWeight: 'bold',
    textAlign: 'center', color: '#ffffff',
    // ... 其餘預設值
  };

  const tocEntries = doc.slides.map((slide, i) => {
    const title = findFirstHeading(slide) ?? `第 ${i + 1} 頁`;
    return createTOCEntry(title, i + 1, i);
  });

  return { id: generateId(), elements: [tocTitle, ...tocEntries], background: { type: 'solid', value: '#1a1a2e' } };
}
```

**使用者控制**：
- 匯出對話框中的 checkbox：「生成目錄頁」
- 預設開啟

#### 4.3.3 程式碼語法高亮

**策略**：使用 highlight.js（CDN）在匯出的 HTML 中：
1. 在 `<head>` 中加入 highlight.js CSS（從 CDN 載入）
2. 在 `<body>` 底部加入 highlight.js JS 並執行 `hljs.highlightAll()`
3. Markdown 匯入時已識別的程式碼區塊加上 `<pre><code class="language-xxx">` 標記

```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<script>hljs.highlightAll();</script>
```

#### 4.3.4 匯出選項對話框

新增一個 Modal，讓使用者在匯出前選擇：
- ✅ 生成目錄頁
- ✅ 包含 Speaker Notes（匯出為獨立區塊）
- ✅ 語法高亮
- ✅ 嵌入字型（link to Google Fonts）

### 4.4 驗收標準

- [ ] 可在屬性面板為每頁投影片編輯 Speaker Notes
- [ ] 匯出 HTML 後，按 `S` 鍵可開啟演講者備註視窗
- [ ] 匯出時可選擇是否生成目錄頁
- [ ] 目錄頁列出所有投影片標題，點擊可跳轉
- [ ] 程式碼區塊在匯出 HTML 中有語法高亮
- [ ] 匯出選項對話框提供前述三個選項

---

## 5. 階段四：模板系統強化（P1）

### 5.1 概述

目前的 `Template` 僅包含配色與字型。借鑑 Slidev 的 npm 主題包結構，擴充為包含：
- 多種佈局（Layout）：標題頁、內容頁、雙欄、圖片置中、空白
- 佈局預設元素（預設標題/正文位置）
- 封裝為可匯入的「主題包」物件

### 5.2 要修改/建立的檔案

```
新增:
  src/lib/ppt/layouts.ts           # 內建佈局定義
  src/lib/ppt/theme-types.ts       # 強化模板型別（ThemePackage）

修改:
  src/lib/ppt/types.ts             # 擴充 Template → ThemePackage
  src/lib/ppt/template.ts          # 現有 8 套模板改為 ThemePackage 結構
  src/components/ppt/TemplatePicker.tsx  # 顯示佈局預覽
  src/components/ppt/PropertyPanel.tsx   # 佈局切換 UI
  src/components/ppt/Toolbar.tsx         # 快速套用佈局按鈕
```

### 5.3 實作方式

#### 5.3.1 佈局型別（`layouts.ts`）

```typescript
// ── 佈局定義 ─────────────────────────────────────────────────────────

export interface LayoutRegion {
  id: string;
  type: 'title' | 'subtitle' | 'content' | 'image' | 'code' | 'footer';
  position: Position;
  size: Size;
  /** 預設文字樣式 */
  defaultStyle?: Partial<TextElement>;
}

export interface SlideLayout {
  id: string;
  name: string;
  description: string;
  thumbnail: string;           // SVG 或 CSS 預覽
  regions: LayoutRegion[];     // 預定義區域
  defaultBackground?: SlideBackground;
}

// ── 內建佈局 ─────────────────────────────────────────────────────────

export const BUILTIN_LAYOUTS: SlideLayout[] = [
  {
    id: 'title-slide',
    name: '標題頁',
    description: '大標題 + 副標題',
    thumbnail: '...',
    regions: [
      { id: 'title', type: 'title', position: { x: 80, y: 180 }, size: { width: 800, height: 100 },
        defaultStyle: { fontSize: 48, fontWeight: 'bold', textAlign: 'center' } },
      { id: 'subtitle', type: 'subtitle', position: { x: 80, y: 300 }, size: { width: 800, height: 60 },
        defaultStyle: { fontSize: 24, textAlign: 'center', opacity: 70 } },
    ],
  },
  {
    id: 'content',
    name: '內容頁',
    description: '標題 + 要點列表',
    regions: [
      { id: 'title', type: 'title', position: { x: 80, y: 60 }, size: { width: 800, height: 60 },
        defaultStyle: { fontSize: 32, fontWeight: 'bold' } },
      { id: 'content', type: 'content', position: { x: 80, y: 140 }, size: { width: 800, height: 340 },
        defaultStyle: { fontSize: 20, lineHeight: 1.8 } },
    ],
  },
  {
    id: 'two-columns',
    name: '雙欄',
    description: '標題 + 左右雙欄',
    regions: [
      { id: 'title', type: 'title', position: { x: 80, y: 60 }, size: { width: 800, height: 60 } },
      { id: 'left', type: 'content', position: { x: 60, y: 140 }, size: { width: 400, height: 340 } },
      { id: 'right', type: 'content', position: { x: 500, y: 140 }, size: { width: 400, height: 340 } },
    ],
  },
  {
    id: 'image-center',
    name: '圖片置中',
    description: '全版圖片',
    regions: [
      { id: 'image', type: 'image', position: { x: 0, y: 0 }, size: { width: 960, height: 540 } },
      { id: 'title', type: 'title', position: { x: 80, y: 440 }, size: { width: 800, height: 60 },
        defaultStyle: { fontSize: 28, fontWeight: 'bold', textShadow: '0 2px 10px rgba(0,0,0,0.5)' } },
    ],
  },
  {
    id: 'blank',
    name: '空白',
    description: '完全自訂',
    regions: [],
  },
];
```

#### 5.3.2 模板型別擴充（`types.ts`）

```typescript
export interface ThemePackage {
  id: string;
  name: string;
  description: string;
  version?: string;
  author?: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
  layouts: SlideLayout[];      // 此主題提供的佈局
  defaultLayout?: string;      // 預設使用哪個佈局
}
```

#### 5.3.3 現有模板升級（`template.ts`）

將 `Template[]` 改為 `ThemePackage[]`，每套模板關聯一組佈局：

```typescript
export const THEMES: ThemePackage[] = TEMPLATES.map(t => ({
  ...t,
  layouts: BUILTIN_LAYOUTS,     // 目前所有模板共用同一組佈局
  defaultLayout: 'content',
}));
```

保留向後相容：`Template` 仍可用，`getTemplateById` 改為回傳 `ThemePackage`。

#### 5.3.4 佈局套用機制（`store.tsx` 新增 Action）

```typescript
// 新增 Action 型別
| { type: "APPLY_LAYOUT"; payload: { slideId: string; layoutId: string } }

// Reducer 處理：
case "APPLY_LAYOUT": {
  const { slideId, layoutId } = action.payload;
  const layout = BUILTIN_LAYOUTS.find(l => l.id === layoutId);
  if (!layout) return state;

  return {
    ...state,
    slides: state.slides.map(slide => {
      if (slide.id !== slideId) return slide;
      // 保留使用者的自訂元素，加上佈局區域的預設元素
      const layoutElements = layout.regions.map(region => createElementFromRegion(region));
      return {
        ...slide,
        elements: [...layoutElements, ...slide.elements],
      };
    }),
  };
}
```

#### 5.3.5 TemplatePicker 升級

目前的 TemplatePicker 只顯示配色預覽。升級後：
- 每個模板卡片顯示該模板的第一個佈局預覽
- 選取模板後，可選擇預設佈局
- 「套用」按鈕同時套用配色 + 佈局（或僅套用配色）

### 5.4 驗收標準

- [ ] 模板擴充為 ThemePackage 結構，向後相容
- [ ] 至少 5 種內建佈局（標題頁、內容頁、雙欄、圖片置中、空白）
- [ ] 套用佈局時自動生成對應的預設元素（標題框、內容框）
- [ ] TemplatePicker 顯示佈局預覽
- [ ] 屬性面板可切換當前投影片的佈局

---

## 6. 階段五：程式碼區塊元件（P2）

### 6.1 概述

借鑑 Spectacle 的 `CodePane`，建立專用的程式碼區塊元件，支援：
- 語法高亮（Shiki 或 highlight.js）
- 行號顯示
- 主題切換（暗/亮）
- 程式碼字型（Fira Code / JetBrains Mono）

### 6.2 要修改/建立的檔案

```
新增:
  src/lib/ppt/code-block.ts       # 程式碼區塊型別 + 高亮輔助
  src/components/ppt/CodeBlock.tsx # 程式碼區塊渲染元件

修改:
  src/lib/ppt/types.ts            # 加入 CodeBlockElement 型別
  src/lib/ppt/store.tsx           # 處理新元素型別
  src/lib/ppt/export.ts           # 匯出時語法高亮
  src/components/ppt/Toolbar.tsx  # 新增程式碼區塊按鈕
  src/components/ppt/SlideEditor.tsx  # 渲染 CodeBlockElement
  src/components/ppt/PropertyPanel.tsx # 程式碼屬性編輯
```

### 6.3 實作方式

#### 6.3.1 型別定義（`types.ts`）

```typescript
export interface CodeBlockElement extends BaseElement {
  type: "code";
  code: string;
  language: string;          // 'javascript' | 'python' | 'html' | 'css' | ...
  showLineNumbers: boolean;
  theme: 'github-dark' | 'github-light' | 'dracula' | 'monokai';
  fontSize: number;
}
```

更新聯合型別：
```typescript
export type SlideElement = TextElement | ImageElement | ShapeElement | CodeBlockElement;
```

#### 6.3.2 高亮輔助（`code-block.ts`）

```typescript
// 使用 highlight.js 進行客戶端高亮
// 或使用 Shiki（較大，建議僅在匯出時使用）

import hljs from 'highlight.js';

export function highlightCode(code: string, language: string): string {
  try {
    const result = hljs.highlight(code, { language });
    return result.value;  // HTML 字串
  } catch {
    return escHtml(code); // 降級為純文字
  }
}

export const SUPPORTED_LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'json', label: 'JSON' },
  { id: 'bash', label: 'Bash' },
  { id: 'sql', label: 'SQL' },
  { id: 'rust', label: 'Rust' },
  { id: 'go', label: 'Go' },
  { id: 'plaintext', label: '純文字' },
];
```

#### 6.3.3 渲染元件（`CodeBlock.tsx`）

```tsx
export default function CodeBlock({ element, isSelected, onMouseDown, ... }: Props) {
  const highlighted = useMemo(() => highlightCode(element.code, element.language), [element.code, element.language]);

  return (
    <div style={{ position: 'absolute', ...element.position, ...element.size }} className={isSelected ? 'ring-2 ring-blue-500' : ''}>
      <div className="code-header">  // 語言標籤 + 複製按鈕
        <span>{element.language}</span>
        <button onClick={copyCode}>📋</button>
      </div>
      <pre className={`line-numbers ${element.theme}`}>
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
}
```

#### 6.3.4 屬性面板整合

在 `PropertyPanel.tsx` 中，當選取 `CodeBlockElement` 時顯示：
- 程式碼編輯器（textarea 或小型 Monaco Editor）
- 語言選擇下拉選單
- 行號開關
- 主題選擇
- 字型大小
- 即時預覽

### 6.4 驗收標準

- [ ] 工具列可新增「程式碼區塊」元件
- [ ] 編輯器中可輸入/貼上程式碼，選擇語言
- [ ] 編輯器中即時顯示語法高亮
- [ ] 支援至少 10 種程式語言
- [ ] 支援行號顯示切換
- [ ] 屬性面板可編輯語言、主題、字型大小
- [ ] 匯出 HTML 保留語法高亮

---

## 7. 階段六：自由畫布定位系統（P2）

### 7.1 概述

借鑑 Impress.js 的 `data-*` 屬性定位系統，將投影片從線性頁面轉為 2.5D 空間定位：
- 每頁投影片在空間中有 `(x, y, z, rotate, scale)` 座標
- 放映時以 CSS 3D transforms 在空間中移動
- 為「無限畫布」和「非線性簡報」打下基礎

### 7.2 要修改/建立的檔案

```
新增:
  src/lib/ppt/impress-engine.ts   # 3D 定位引擎計算
  src/components/ppt/Canvas3D.tsx  # 3D 畫布預覽（編輯模式）

修改:
  src/lib/ppt/types.ts            # 加入 SlidePosition3D 型別
  src/lib/ppt/store.tsx            # 支援 3D 座標更新
  src/lib/ppt/export.ts           # 匯出 3D 定位
  src/components/ppt/SlideEditor.tsx   # 可切換 2D/3D 模式
  src/components/ppt/SlidePreview.tsx  # 3D 空間漫遊
  src/components/ppt/PropertyPanel.tsx # 3D 座標編輯
```

### 7.3 實作方式

#### 7.3.1 型別擴充（`types.ts`）

```typescript
export interface SlidePosition3D {
  x: number;           // 水平偏移（px）
  y: number;           // 垂直偏移（px）
  z?: number;          // 深度（px），預設 0
  rotateX?: number;    // X 軸旋轉（度）
  rotateY?: number;    // Y 軸旋轉（度）
  rotateZ?: number;    // Z 軸旋轉（度），預設 0
  scale?: number;      // 縮放，預設 1
}

// 擴充 Slide
export interface Slide {
  // ... 現有
  position3D?: SlidePosition3D;   // 3D 空間定位（可選）
}
```

#### 7.3.2 定位引擎（`impress-engine.ts`）

```typescript
/**
 * 計算從目前投影片到下一個投影片的 CSS transform 字串
 * 借鑑 Impress.js 的步進計算：
 *   1. 先還原到原點（translate 回到中心）
 *   2. 旋轉（rotateX, rotateY, rotateZ）
 *   3. 縮放（scale）
 *   4. 平移到目標位置（translate）
 */
export function computeSlideTransform(pos: SlidePosition3D): string {
  const { x, y, z = 0, rotateX = 0, rotateY = 0, rotateZ = 0, scale = 1 } = pos;
  // 從中心點計算（CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2）
  return [
    `translate(${x}px, ${y}px)`,
    `translateZ(${z}px)`,
    `rotateX(${rotateX}deg)`,
    `rotateY(${rotateY}deg)`,
    `rotateZ(${rotateZ}deg)`,
    `scale(${scale})`,
  ].join(' ');
}

/**
 * 計算視口位置（讓目標投影片置中）
 */
export function computeCameraTransform(target: SlidePosition3D): string {
  // 攝影機反向移動
  const tx = -(target.x ?? 0) + (CANVAS_WIDTH / 2);
  const ty = -(target.y ?? 0) + (CANVAS_HEIGHT / 2);
  const tz = -(target.z ?? 0);
  return `translate3d(${tx}px, ${ty}px, ${tz}px) rotateX(${-(target.rotateX ?? 0)}deg) rotateY(${-(target.rotateY ?? 0)}deg)`;
}
```

#### 7.3.3 3D 畫布編輯模式（`Canvas3D.tsx`）

在編輯模式中新增可切換的 3D 視角：
- 以俯視圖（top-down）顯示所有投影片在空間中的位置
- 拖曳投影片縮圖可調整 3D 座標
- 右側面板顯示精確的 XYZ / 旋轉 / 縮放數值
- 切換 2D 模式回到原本的線性編輯

**UI 示意**：
```
[2D 模式] [3D 模式]   ← 切換按鈕
┌─────────────────────────┐
│                         │
│    ┌──┐                 │
│    │S1│  ┌──┐           │
│    └──┘  │S2│           │
│          └──┘    ┌──┐   │
│                  │S3│   │
│                  └──┘   │
└─────────────────────────┘
```

#### 7.3.4 放映模式 3D 漫遊（`SlidePreview.tsx`）

當投影片有 `position3D` 時，放映模式使用 CSS 3D transforms 切換：
- 容器設定 `perspective: 1000px` 和 `transform-style: preserve-3d`
- 每頁投影片使用 `computeSlideTransform` 定位
- 使用 `computeCameraTransform` 移動攝影機視口
- 過渡動畫使用 CSS `transition: transform 0.8s ease`

```css
.presentation-3d {
  perspective: 1000px;
  perspective-origin: 50% 50%;
}
.slide-3d {
  position: absolute;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  transition: transform 0.8s ease;
}
```

### 7.4 驗收標準

- [ ] 每頁投影片可在屬性面板設定 `(x, y, z, rotate, scale)` 3D 座標
- [ ] 編輯模式可切換 2D/3D 視角
- [ ] 3D 視角下以俯視圖顯示所有投影片的空間分佈
- [ ] 放映模式使用 CSS 3D transforms 切換投影片
- [ ] 支援非線性跳轉（跳轉到空間中任意投影片）
- [ ] 匯出 HTML 保留 3D 定位效果

---

## 8. 總結：影響範圍矩陣

| 檔案 | 階段一 | 階段二 | 階段三 | 階段四 | 階段五 | 階段六 |
|------|--------|--------|--------|--------|--------|--------|
| `src/lib/ppt/types.ts` | ✅ Slide.notes | ✅ Slide.transition, Fragment | ✅ notes | ✅ ThemePackage, Layout | ✅ CodeBlockElement | ✅ SlidePosition3D |
| `src/lib/ppt/store.tsx` | — | — | — | ✅ APPLY_LAYOUT action | ✅ code 元素處理 | ✅ 3D 座標更新 |
| `src/lib/ppt/template.ts` | — | — | — | ✅ 改為 ThemePackage | — | — |
| `src/lib/ppt/export.ts` | — | ✅ 動畫 CSS | ✅ 重寫為增強版 | — | ✅ 高亮 | ✅ 3D transform |
| `src/lib/ppt/markdown.ts` | ✅ **新增** | — | — | — | — | — |
| `src/lib/ppt/animations.ts` | — | ✅ **新增** | — | — | — | — |
| `src/lib/ppt/transitionStyles.ts` | — | ✅ **新增** | — | — | — | — |
| `src/lib/ppt/layouts.ts` | — | — | — | ✅ **新增** | — | — |
| `src/lib/ppt/theme-types.ts` | — | — | — | ✅ **新增** | — | — |
| `src/lib/ppt/code-block.ts` | — | — | — | — | ✅ **新增** | — |
| `src/lib/ppt/impress-engine.ts` | — | — | — | — | — | ✅ **新增** |
| `src/lib/ppt/export-enhanced.ts` | — | — | ✅ **新增** | — | — | — |
| `src/components/ppt/Toolbar.tsx` | ✅ MD 按鈕 | — | ✅ 匯出選項 | ✅ 佈局按鈕 | ✅ Code 按鈕 | ✅ 2D/3D 切換 |
| `src/components/ppt/SlideEditor.tsx` | — | ✅ 動畫預覽 | — | — | ✅ CodeBlock 渲染 | ✅ 3D 編輯模式 |
| `src/components/ppt/SlidePreview.tsx` | — | ✅ Fragment 步進 | ✅ Speaker Notes | — | — | ✅ 3D 漫遊 |
| `src/components/ppt/PropertyPanel.tsx` | — | ✅ 動畫設定 | ✅ Notes 編輯 | ✅ 佈局切換 | ✅ Code 屬性 | ✅ 3D 座標 |
| `src/components/ppt/TextView.tsx` | — | ✅ fragment 標記 | — | — | — | — |
| `src/components/ppt/MarkdownImportModal.tsx` | ✅ **新增** | — | — | — | — | — |
| `src/components/ppt/MarkdownExportModal.tsx` | ✅ **新增** | — | — | — | — | — |
| `src/components/ppt/CodeBlock.tsx` | — | — | — | — | ✅ **新增** | — |
| `src/components/ppt/Canvas3D.tsx` | — | — | — | — | — | ✅ **新增** |
| `src/app/ppt/page.tsx` | ✅ Modal 狀態 | — | ✅ 匯出選項 | — | — | — |

### 建議執行順序

```
階段一 ─→ 階段二 ─→ 階段三 ─→ 階段四 ─→ 階段五 ─→ 階段六
 (P0)      (P0)      (P1)      (P1)       (P2)       (P2)
```

每個階段獨立可交付，階段之間無強耦合。若需要縮減 scope，可跳過階段六（自由畫布）或階段五（程式碼區塊），不影響其他功能。
