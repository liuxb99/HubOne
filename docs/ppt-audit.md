# 線上 PPT 編輯器 — 程式碼審計報告

> 審計日期：2025-07  
> 審計範圍：6 個核心函式庫檔案 + 8 個元件檔案  
> 共發現 **10 個問題**（P0 × 0, P1 × 7, P2 × 3）

---

## 嚴重程度定義

| 等級 | 定義 |
|------|------|
| **P0** | 立即崩潰、資料遺失、無法編譯 |
| **P1** | 功能性錯誤 — 操作結果與預期不符 |
| **P2** | 邊界情況 / 已棄用 API / 程式碼維護性 |

---

## P1 — 功能性錯誤

### 1. `handleAddSlide` 新增投影片後選到錯誤的頁面

**檔案：** `src/components/ppt/SlideList.tsx`，第 47–56 行

```ts
const handleAddSlide = useCallback(() => {
  dispatch({ type: "ADD_SLIDE" });
  const slides = doc.slides;                    // ← 舊的 state
  if (slides.length > 0) {
    const newId = slides[slides.length - 1].id;  // ← 舊最後一頁的 id
    editorDispatch({ type: "SET_CURRENT_SLIDE", payload: newId });
  }
}, [dispatch, editorDispatch, doc.slides]);
```

**問題：** `useReducer` dispatch 後 `doc.slides` 還是舊陣列。  
`slides[slides.length - 1]` 取到的是「新增前的舊最後一頁」，不是新投影片。

**結果：** 點「新增投影片」後，選取的是倒數第二頁，使用者必須再手動點最後一頁。

**修復建議：** 透過 reducer 回傳新 slide id，或從 dispatch 外部計算新 id 後再 dispatch：

```ts
// 方案 A：先在外部生成 id，建 slide 時帶入
const newSlide = createSlide(); // 外部生成
dispatch({ type: "ADD_SLIDE", payload: { slide: newSlide } }); // reducer 使用傳入的 slide
editorDispatch({ type: "SET_CURRENT_SLIDE", payload: newSlide.id });
```

---

### 2. `handleDeleteSlide` 刪除第一頁時導航到已刪除的頁面

**檔案：** `src/components/ppt/SlideList.tsx`，第 63–74 行

```ts
if (editor.currentSlideId === slideId) {
  const idx = doc.slides.findIndex((s) => s.id === slideId); // 舊陣列中 idx=0
  const targetIdx = idx > 0 ? idx - 1 : 0;                  // → 0
  const targetSlide = doc.slides[targetIdx];                 // → 舊 slides[0] = 被刪的頁
  if (targetSlide) {
    editorDispatch({ type: "SET_CURRENT_SLIDE", payload: targetSlide.id });
  }
}
```

**問題：** 刪除第一頁（`slideId` 在第一筆，`idx === 0`）時，`targetIdx = 0`，從舊陣列取 `doc.slides[0]` 得到的是**正要被刪除的那頁**。dispatch 後 `currentSlideId` 指向不存在的 id，導致編輯區顯示「請新增投影片」。

**修復建議：** 刪除第一頁時應取下一頁（舊陣列 idx=1）：

```ts
const targetIdx = idx > 0 ? idx - 1 : 1; // 索引 0 → 取下一頁
const targetSlide = doc.slides[Math.min(targetIdx, doc.slides.length - 1)];
```

---

### 3. `handleResizeStart` 未檢查 locked 旗標

**檔案：** `src/components/ppt/SlideEditor.tsx`，第 176–188 行

```ts
const handleResizeStart = useCallback(
  (e: ReactMouseEvent, handle: ResizeHandle, elementId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const el = currentSlide?.elements.find((el) => el.id === elementId);
    if (!el) return;
    // ⚠️ 沒有檢查 el.locked
    ...
  },
  [currentSlide]
);
```

**問題：** 同檔案的 `handleMouseDown`（第 155 行）有 `if (!el || el.locked) return;`，但 `handleResizeStart` 沒有。  
鎖定的元素仍然可以透過拖拉縮放控制點來調整大小，`locked` 形同虛設。

**修復建議：** 在 `if (!el) return;` 後加上 `if (el.locked) return;`。

---

### 4. `SlidePreview` 投影片放映模式 — Home/End 鍵盤事件雙重綁定導致導航錯誤

**檔案：** `src/components/ppt/SlidePreview.tsx`

有 **兩個 `useEffect`** 同時監聽 `keydown`：

| 區塊 | 行號 | 處理的按鍵 |
|------|------|-----------|
| 第一個 `useEffect` | ~95–108 | ArrowRight/Left/Up/Down, Space, PageUp/Down, Escape, **Home**, **End** |
| 第二個 `useEffect` | ~159–176 | **Home**, **End** |

兩個 handler 都對 Home/End 註冊了 `window.addEventListener("keydown", ...)`，按一次 Home/End 會觸發**兩次** dispatch。

**第一個 handler 的 Home 實作：**
```ts
// 行 ~101
editorDispatch({ type: "PREV_SLIDE" }); // 只回退一頁，不是跳到第一頁
```

**第一個 handler 的 End 實作：**
```ts
// 行 ~105
// 只有註解，完全沒動作 ← End 鍵無效
```

**第二個 handler 的 Home/End 實作：**
```ts
// 行 ~163–180
while (editor.currentPresentIndex > 0) {
  editorDispatch({ type: "PREV_SLIDE" });
  break; // ← break 導致只跑一次，從 index 3 只會到 index 2，不是 0
}
```

**結果：** 
- Home 鍵：第一個 handler 回退 1 頁，第二個 handler 再回退 1 頁，總共回退 2 頁（若在 page 3 → page 1，但若在 page 1 不動）。
- End 鍵：第一個 handler 沒動作，第二個 handler 前進 1 頁（從 index 2 只到 index 3，不是最後一頁）。

**修復建議：** 移除第一個 `useEffect` 中對 Home/End 的處理，統一由第二個 `useEffect` 負責。同時將 `while (...){... break;}` 改為直接 dispatch 目標 index（或改用 loop 直到到達目標）：

```ts
// 最佳做法：新增一個 action 直接跳到指定頁
case "GO_TO_SLIDE":
  return { ...state, currentPresentIndex: action.payload };
```

---

### 5. `SlidePreview` — 底部頁碼指示器點擊使用迴圈 dispatch，效能差且可能 Race

**檔案：** `src/components/ppt/SlidePreview.tsx`，第 248–254 行

```tsx
onClick={(e) => {
  e.stopPropagation();
  const diff = i - editor.currentPresentIndex;
  for (let j = 0; j < Math.abs(diff); j++) {
    if (diff > 0) editorDispatch({ type: "NEXT_SLIDE", payload: { total } });
    else editorDispatch({ type: "PREV_SLIDE" });
  }
}}
```

**問題：** 從第 3 頁跳到第 10 頁需要連續 dispatch 7 次，觸發 7 次 re-render。  
且 `editor.currentPresentIndex` 是 closure 中的舊值，在 for 迴圈中**每次 dispatch 後都不會更新**，因此 `diff` 始終是初始差值，邏輯上等於 dispatch 了 |diff| 次，結果正確但效能浪費。

**修復建議：** 新增 editor action `GO_TO_SLIDE` 直接設定目標 index，一次 dispatch 完成。

---

### 6. `store.tsx` — `REORDER_SLIDES` 使用 `as Slide[]` 強制轉型

**檔案：** `src/lib/ppt/store.tsx`，第 119–124 行

```ts
const reordered = slideIds.map((id) => slideMap.get(id)).filter(Boolean) as Slide[];
if (reordered.length !== state.slides.length) return state;
```

**問題：** `slideMap.get(id)` 回傳 `Slide | undefined`，`.filter(Boolean)` 後 TypeScript 仍然推斷為 `(Slide | undefined)[]`。使用 `as Slide[]` 雖然後面有 `length` 檢查，但若某個 `id` 不存在於 map（已刪除），`filter(Boolean)` 會靜默移除該筆，`length` 檢查會 intercept。**目前安全，但若未來在 length 檢查前使用 `reordered` 則會出問題。**

**修復建議：** 使用 TypeScript 4.x 的型別守衛：

```ts
.filter((s): s is Slide => s !== undefined)
```

---

### 7. `store.tsx` — `pptReducer` 中 `const now` 重複宣告

**檔案：** `src/lib/ppt/store.tsx`

| 位置 | 內容 |
|------|------|
| 第 63 行（外部） | `const now = Date.now();` |
| 每個 case 區塊內部 | `{ const now = Date.now(); ... }` |

**問題：** 外層的 `const now` 被每一個 case 區塊自己的 `const now` 遮蔽（shadow），外層變數從未被使用。雖然不是 bug，但容易誤導維護者以為某個 case 忘了加上 `updatedAt: now`。

**修復建議：** 移除第 63 行的外層 `const now = Date.now();`，只在每個需要 `updatedAt` 的 case 內部宣告。

---

## P2 — 邊界情況 / 已棄用 API / 維護性

### 8. `TextView` 使用已棄用的 `document.execCommand`

**檔案：** `src/components/ppt/TextView.tsx`，第 117–119 行

```ts
const applyFormat = useCallback(
  (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  },
  []
);
```

**說明：** `document.execCommand` 自 2020 年起已被各大瀏覽器標記為 deprecated，未來版本可能移除。目前仍可在大多數瀏覽器運作，但無法保證長期相容。

**修復建議：** 改用 `document.queryCommandState` + `document.queryCommandValue` + 手動操作 `selection` / `range`，或引入輕量級富文字編輯器（如 TipTap / Slate.js）來管理文字格式。

---

### 9. `SlideList` — 拖曳排序使用 `setDragIndex` 但未實際使用此狀態

**檔案：** `src/components/ppt/SlideList.tsx`，第 114–140 行

```ts
const [dragIndex, setDragIndex] = useState<number | null>(null); // setDragIndex 只在 handleDragStart 中被設值
...
const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
  setDragIndex(index); // ← 設值後從未被 read
  ...
}, []);
```

**問題：** `dragIndex` state 在 `handleDragStart` 中被寫入，但**沒有任何邏輯讀取它**。排序判斷完全依靠 `e.dataTransfer.getData("text/plain")`。這個 state 是無用的殘留代碼。

**修復建議：** 移除 `dragIndex` state 及其所有相關程式碼。

---

### 10. `store.tsx` — `REORDER_SLIDES` 中重新排序後 `editorState.currentSlideId` 可能遺失

**檔案：** `src/lib/ppt/store.tsx`，第 119–124 行

```ts
case "REORDER_SLIDES": {
  const { slideIds } = action.payload;
  const slideMap = new Map(state.slides.map((s) => [s.id, s]));
  const reordered = slideIds.map((id) => slideMap.get(id)).filter(Boolean) as Slide[];
  if (reordered.length !== state.slides.length) return state;
  return { ...state, slides: reordered, updatedAt: now };
}
```

**說明：** 重新排序後，使用者當前選取的頁面（存在 `EditorState.currentSlideId` 中，屬於另一個 reducer）仍然指向同一個 `slideId`，所以不會遺失。**但若 UI 狀態管理將 `currentSlideId` 存為 index 而非 id，則排序後會指向錯誤頁面。** 目前程式碼使用 `slideId` 儲存，所以安全，但值得在 code review 中注意此設計決策。

---

## 未發現問題的區域

以下檔案經檢查未發現型別錯誤、邏輯錯誤或空值安全問題：

| 檔案 | 狀態 |
|------|------|
| `src/lib/ppt/types.ts` | ✅ 型別定義完整清晰 |
| `src/lib/ppt/template.ts` | ✅ 模板資料無執行期邏輯 |
| `src/lib/ppt/export.ts` | ✅ HTML 匯出邏輯正確 |
| `src/components/ppt/Toolbar.tsx` | ✅ 閉包依賴正確、下拉選單關閉邏輯完整 |
| `src/components/ppt/PropertyPanel.tsx` | ✅ 屬性面板邏輯嚴謹 |
| `src/components/ppt/TemplatePicker.tsx` | ✅ Modal 控制流程正確 |
| `src/app/ppt/page.tsx` | ✅ Provider 包裹架構正確，動態導入無誤 |

---

## 總結

| 嚴重度 | 數量 | 主要類型 |
|--------|------|----------|
| P0 | 0 | — |
| P1 | 7 | 閉包中使用了過期 state（3 處）、雙重事件綁定（1 處）、while/break 邏輯錯誤（1 處）、locked 旗標未檢查（1 處）、已棄用 API（1 處） |
| P2 | 3 | 殘留狀態變數、型別強轉、重複宣告 |

**最需要優先修復的 3 項：**
1. **#1** `handleAddSlide` 選到舊頁面 → 使用者體驗直接受影響
2. **#2** `handleDeleteSlide` 刪第一頁導航到空頁面 → 編輯區顯示異常
3. **#4** Home/End 鍵雙重綁定 → 操作結果不符合使用者預期
