# 開發計劃：PPT 編輯器四功能 Tab

## 1. 概覽

將 SubNav 的五個 Tab 從 `#` 錨點連結改為 `onClick` 回呼驅動的 UI 模式切換。  
新增一個 `viewMode` state (`"editor" | "slides" | "settings"`) 控制主區域渲染內容；模板和匯出則沿用現有的 Modal 機制。

### 受影響的檔案（共 7 個）

| 檔案 | 變更 |
|---|---|
| `src/components/layout/SubNav.tsx` | 支援 `onClick` 替代 `href`，Tab 型別改為聯合型別 |
| `src/app/ppt/page.tsx` | 加入 `viewMode` state，傳遞 onClick 給 SubNav，條件渲染主體區 |
| `src/components/ppt/SlideOutlineView.tsx` | **新增** — 投影片大綱全屏展開視圖 |
| `src/components/ppt/ExportPanel.tsx` | **新增** — 匯出選項面板（HTML / Markdown / 純文字） |
| `src/components/ppt/SettingsPanel.tsx` | **新增** — 簡報設定面板（取代右側 PropertyPanel 的內容） |
| `src/components/ppt/PropertyPanel.tsx` | 微調：當處於設定模式時隱藏原本的屬性面板 |
| `src/lib/ppt/types.ts` | 可選：加入簡報設定型別（預設過渡、字型等） |

---

## 2. 逐步實作

### 2.1 修改 `SubNav.tsx` — 支援 onClick

**Tab 介面調整**：讓 `href` 可選，新增 `onClick` 回呼。

```tsx
// SubNav.tsx — Tab 型別
interface Tab {
  id: string;
  label: string;
  icon?: string;
  href?: string;       // 改為可選
  onClick?: () => void; // 新增
}
```

**渲染邏輯**：若 `tab.onClick` 存在則渲染為 `<button>`，否則渲染為 `<Link>`。

```tsx
// 取代原本的 <Link> 渲染
const renderTab = (tab: Tab, i: number) => {
  const className = `relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-colors ${
    i === activeIndex
      ? "text-zinc-900 dark:text-white"
      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
  }`;

  if (tab.onClick) {
    return (
      <button key={tab.id} onClick={tab.onClick} className={className}>
        {tab.icon && <span>{tab.icon}</span>}
        <span>{tab.label}</span>
        {i === activeIndex && (
          <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full" style={{ backgroundColor: "var(--theme-color, #6366F1)" }} />
        )}
      </button>
    );
  }
  return (
    <Link key={tab.id} href={tab.href!} className={className}>
      {tab.icon && <span>{tab.icon}</span>}
      <span>{tab.label}</span>
      {i === activeIndex && (
        <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full" style={{ backgroundColor: "var(--theme-color, #6366F1)" }} />
      )}
    </Link>
  );
};
```

> **注意**：activeIndex 的計算方式需調整——不能再用 `pathname.startsWith(href)`，改為在 `page.tsx` 中由外部傳入 `activeTab` prop，或由 SubNav 根據 `id` 匹配父元件傳入的 `activeId`。

**建議做法**：新增一個 `activeId` prop 到 SubNav：

```tsx
interface SubNavProps {
  tabs: Tab[];
  activeId?: string;   // 由父元件控制
}
```

`activeIndex` 改為 `tabs.findIndex(t => t.id === activeId)`。

### 2.2 修改 `page.tsx` — 加入 viewMode 狀態

```tsx
// page.tsx — 新增 state
type ViewMode = "editor" | "slides" | "settings";

function PptEditor() {
  const [viewMode, setViewMode] = useState<ViewMode>("editor");
  // ... 現有狀態

  // Tab onClick 回呼
  const handleTabClick = useCallback((tabId: string) => {
    switch (tabId) {
      case "editor":
        setViewMode("editor");
        break;
      case "templates":
        setTemplatePickerOpen(true);
        break;
      case "slides":
        setViewMode(prev => prev === "slides" ? "editor" : "slides"); // toggle
        break;
      case "export":
        // 開啟匯出面板（可用 Modal 或內嵌面板）
        setExportPanelOpen(true);
        break;
      case "settings":
        setViewMode(prev => prev === "settings" ? "editor" : "settings");
        break;
    }
  }, []);

  // tabs 定義調整
  const tabs = [
    { id: "editor",   label: "編輯",   icon: "✏️", onClick: () => handleTabClick("editor") },
    { id: "templates", label: "模板",   icon: "🎨", onClick: () => handleTabClick("templates") },
    { id: "slides",   label: "投影片", icon: "📄", onClick: () => handleTabClick("slides") },
    { id: "export",   label: "匯出",   icon: "📤", onClick: () => handleTabClick("export") },
    { id: "settings", label: "設定",   icon: "⚙️", onClick: () => handleTabClick("settings") },
  ];
```

**主體區域條件渲染**：

```tsx
{/* 主體：根據 viewMode 切換 */}
<div className="flex-1 flex overflow-hidden">
  {viewMode === "editor" && (
    <>
      <SlideList />
      <SlideEditor />
      <PropertyPanel />
    </>
  )}
  {viewMode === "slides" && (
    <SlideOutlineView onClose={() => setViewMode("editor")} />
  )}
  {viewMode === "settings" && (
    <>
      <SlideList />
      <SlideEditor />
      <SettingsPanel onClose={() => setViewMode("editor")} />
    </>
  )}
</div>
```

> **注意**：匯出面板（`export`）不切換 viewMode，使用 Modal 或獨立浮動面板。

### 2.3 新增 `SlideOutlineView.tsx` — 投影片大綱視圖

**位置**：`src/components/ppt/SlideOutlineView.tsx`

**功能**：
- 全屏展開的投影片列表，展示每頁完整文字內容
- 每頁顯示：頁碼、標題（第一個粗體元素）、所有文字元素的內容摘要
- 點擊頁面跳轉到該頁（回到 editor 模式且選中該頁）
- 拖拽重新排序（重用 SlideList 的 DnD 邏輯）
- 內聯編輯投影片標題

**示意結構**：

```tsx
export default function SlideOutlineView({ onClose }: { onClose: () => void }) {
  const { doc, editor, dispatch, editorDispatch } = usePPTStore();

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
      {/* 頂部欄 */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800">
        <h2 className="text-lg font-semibold text-white">📄 投影片大綱</h2>
        <button onClick={onClose} className="text-zinc-400 hover:text-white">✕ 返回編輯</button>
      </div>

      {/* 可滾動列表 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {doc.slides.map((slide, index) => (
          <SlideOutlineCard key={slide.id} slide={slide} index={index}
            isActive={editor.currentSlideId === slide.id}
            onSelect={() => {
              editorDispatch({ type: "SET_CURRENT_SLIDE", payload: slide.id });
              onClose(); // 回到編輯模式並選中
            }}
            onDragStart={...} onDragOver={...} onDrop={...}
          />
        ))}
      </div>
    </div>
  );
}
```

每個 `SlideOutlineCard` 顯示：
- 頁碼徽章 `第 N 頁`
- 從 `slide.elements` 中提取所有文字元素的 `content`
- 第一個粗體元素作為「標題」突出顯示
- 非文字元素以灰色標記 `[圖片]` `[矩形]` 等

### 2.4 新增 `ExportPanel.tsx` — 匯出選項面板

**位置**：`src/components/ppt/ExportPanel.tsx`

**功能**：
- 浮動 Modal / 側邊面板，非直接下載
- 三個匯出格式按鈕：**HTML** / **Markdown** / **純文字**
- 點擊後在面板內顯示預覽（文字內容或 iframe）
- 支援「下載」按鈕觸發實際下載

**現有工具函式**（可直接呼叫）：

| 格式 | 函式 | 位置 |
|---|---|---|
| HTML | `exportToHTML(doc)` → string → 下載 blob | `src/lib/ppt/export.ts` |
| Markdown | `slidesToMarkdown(doc)` → `downloadMarkdown(doc)` | `src/lib/ppt/markdown.ts` |
| 純文字 | 新寫：遍歷 `doc.slides` 提取文字內容，以 `---` 分隔 | 可在 `export.ts` 或 `markdown.ts` 中新增 |

**示意**：

```tsx
type ExportFormat = "html" | "markdown" | "text";

export default function ExportPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { doc } = usePPTStore();
  const [format, setFormat] = useState<ExportFormat>("html");
  const [preview, setPreview] = useState("");

  useEffect(() => {
    switch (format) {
      case "html": setPreview(exportToHTML(doc)); break;
      case "markdown": setPreview(slidesToMarkdown(doc)); break;
      case "text": setPreview(slidesToText(doc)); break;
    }
  }, [format, doc]);

  const handleDownload = () => {
    const blob = new Blob([preview], { type: mimeType });
    // 建立 a 標籤觸發下載
  };

  return (
    <Modal open={open} onClose={onClose} title="📤 匯出簡報" size="xl">
      {/* 格式切換按鈕 */}
      <div className="flex gap-2 mb-4">
        {["html", "markdown", "text"].map(f => (
          <button key={f} onClick={() => setFormat(f as ExportFormat)}
            className={cn("px-4 py-2 rounded-lg text-sm", format === f ? "bg-pink-600" : "bg-zinc-800")}>
            {f === "html" ? "HTML" : f === "markdown" ? "Markdown" : "純文字"}
          </button>
        ))}
      </div>
      {/* 預覽區 */}
      {format === "html" ? (
        <iframe srcDoc={preview} className="w-full h-[400px] rounded-xl" />
      ) : (
        <textarea readOnly value={preview} className="w-full h-[400px] ..." />
      )}
      {/* 下載按鈕 */}
      <Button variant="primary" onClick={handleDownload}>📥 下載</Button>
    </Modal>
  );
}
```

**新增 `slidesToText` 工具函式**（放在 `src/lib/ppt/export.ts` 或新增 `src/lib/ppt/text-export.ts`）：

```ts
export function slidesToText(doc: PPTDocument): string {
  return doc.slides.map((slide, i) => {
    const textParts = slide.elements
      .filter(el => el.type === "text")
      .map(el => (el as TextElement).content);
    return `--- 第 ${i + 1} 頁 ---\n${textParts.join("\n\n")}`;
  }).join("\n\n");
}
```

### 2.5 新增 `SettingsPanel.tsx` — 簡報設定面板

**位置**：`src/components/ppt/SettingsPanel.tsx`

**功能**：
- 右側屬性面板位置顯示，取代 `PropertyPanel`
- 內容：
  - **簡報標題** — 可編輯文字框（與 Toolbar 標題同步）
  - **預設過渡效果** — 下拉選單（淡入淡出 / 向左滑入 / 縮放 / 翻轉 / 無）
  - **預設字型** — 下拉選單（Inter / Noto Sans TC / Playfair Display 等）
  - **佈局選項** — 寬螢幕 / 標準 4:3 切換（影響 CANVAS_WIDTH / HEIGHT）
- 修改 store 需要支援設定持久化

**store 擴充**（非必要，可先用 useLocalStorage 或 PPTDocument 欄位）：

在 `types.ts` 的 `PPTDocument` 中加入：

```ts
export interface PPTDocument {
  // ... 現有欄位
  settings?: {
    defaultTransition?: string;
    defaultFont?: string;
    aspectRatio?: "16:9" | "4:3";
  };
}
```

Reducer 中加入 `UPDATE_SETTINGS` action（可選，簡單場景可直接 dispatch `LOAD_DOCUMENT`）。

### 2.6 調整 `page.tsx` — viewMode 為 "settings" 時隱藏 PropertyPanel

```tsx
{viewMode === "settings" ? (
  <SettingsPanel onClose={() => setViewMode("editor")} />
) : (
  <PropertyPanel />
)}
```

或者設定模式時右側固定顯示 SettingsPanel，左側和中間保持 SlideList + SlideEditor。

### 2.7 調整 `PropertyPanel.tsx`（可選）

目前右側面板的標題列固定為「屬性」。當用於設定模式時，可以不用修改，因為 `SettingsPanel` 是獨立元件。但需確保 `PropertyPanel` 在 `viewMode === "settings"` 時不顯示。

---

## 3. 資料流總結

```
page.tsx
├── useState<ViewMode> viewMode
├── handleTabClick(tabId) → setViewMode / setModalOpen
├── tabs[] → 傳給 SubNav
├── SubNav tabs={tabs} activeId={viewMode ...or tabId}
│
├── viewMode === "editor"
│   ├── <SlideList />   ← 左側縮圖
│   ├── <SlideEditor />  ← 中間編輯區
│   └── <PropertyPanel /> ← 右側屬性
│
├── viewMode === "slides"
│   └── <SlideOutlineView onClose={...} />
│
├── viewMode === "settings"
│   ├── <SlideList />
│   ├── <SlideEditor />
│   └── <SettingsPanel onClose={...} />
│
├── <TemplatePicker open={...} />        ← Modal
└── <ExportPanel open={...} />            ← Modal (or inline)
```

---

## 4. 風險與注意事項

1. **SubNav 活性狀態** — 目前的 active 邏輯依賴 `pathname.startsWith(href)`，改為 button 後需用 `activeId` prop 傳入。非 editor 模式下（slides / settings）需亮起對應 Tab。
2. **SlideOutlineView 的效能** — 如果投影片數量多（>50），全量渲染所有文字內容可能變慢。可加虛擬捲動（`react-window`）或分頁渲染。
3. **匯出預覽記憶體** — HTML 預覽使用 `<iframe srcDoc={...}>` 時，大文件可能耗記憶體。可考慮只預覽前幾頁或加入「載入中」狀態。
4. **設定持久化** — 目前 doc 已透過 `localStorage` 持久化。`PPTDocument.settings` 會自動隨 doc 儲存。若新增 reducer action，別忘了在 `pptReducer` 中加入對應 case。
5. **回到編輯模式** — SlideOutlineView 和 SettingsPanel 都需要一個「返回」按鈕。點擊大綱中的投影片卡應自動回到 editor 模式並選中該頁。
6. **匯出按鈕現有衝突** — Toolbar 已有「匯出」按鈕（直接下載 HTML），新的匯出面板是取代還是並存？建議 Toolbar 的匯出保持現狀（快速匯出 HTML），SubNav 的匯出提供完整選項面板。
