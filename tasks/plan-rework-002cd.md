# 返工計劃 — TASK-002cd（業務線主題切換 + 載入與錯誤狀態）

> **原始任務**: TASK-002c（業務線主題切換）+ TASK-002d（載入與錯誤狀態）
> **評分**: 58/100 ❌ 不合格
> **返工範圍**: 5 項修正

---

## 核心問題根源

ThemeToggle、useTheme、業務線 layout、頁面元件四者各自獨立操作 DOM 與 localStorage，**缺乏單一狀態來源 (Single Source of Truth)**。沒有 React Context，狀態無法共用。

```
┌─────────────────────────────────────────────────────────┐
│                   問題架構（現狀）                        │
│                                                         │
│  useTheme()  ←→  useLocalStorage("theme")               │
│       ↓                                                    │
│  document.documentElement.classList.toggle("dark")      │
│  document.documentElement.setAttribute("data-theme")    │
│                                                         │
│  ThemeToggle  ←→  localStorage.getItem("theme")         │  ← 重複！
│       ↓                                                    │
│  document.documentElement.classList.toggle("dark")      │  ← 重複！
│                                                         │
│  各 layout  ←→  <div data-theme="quant">（包在 div）    │  ← 不一致
│                                                         │
│  GamesPage  ←→  <div data-theme="game">（在 page 內）   │  ← 無 layout
└─────────────────────────────────────────────────────────┘
```

---

## 修正項目

---

### FIX-1：建立 ThemeProvider React Context（單一狀態來源）

#### 問題
- 無 `ThemeProvider`，每個 `useTheme()` 實例各自管理狀態（雙重 `useLocalStorage`）
- `ThemeToggle` 完全不使用 `useTheme`，而是直接操作 `localStorage` 與 `classList`
- 兩者各自寫入 localStorage → 後寫入者覆蓋前者

#### 修改方式

**階段 A — 建立 ThemeProvider**

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/components/layout/ThemeProvider.tsx` | **新增** | 建立 React Context，包裹 theme state 與 businessId state |
| `src/hooks/useTheme.ts` | **改寫** | 改為從 `ThemeContext` 讀取值；若在 Provider 外使用則報錯 |
| `src/app/layout.tsx` | **修改** | 用 `<ThemeProvider>` 包裹 `<html>` 內的全部 children |

**ThemeProvider 規格：**

```tsx
"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { BusinessId, ThemeMode, ThemeContextType } from "@/types";

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // ——— 全域 dark/light/system 狀態（寫 localStorage） ———
  const [mode, setMode] = useLocalStorage<ThemeMode>("theme", "system");
  const [isDark, setIsDark] = useState(false);

  // ——— 業務線主題狀態（不寫 localStorage，由 layout 設定） ———
  const [businessId, setBusinessId] = useState<BusinessId | null>(null);

  const resolveDark = useCallback((m: ThemeMode) => {
    if (m === "dark") return true;
    if (m === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }, []);

  // 初始化 & 監聽系統變化
  useEffect(() => {
    setIsDark(resolveDark(mode));
    if (mode === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [mode, resolveDark]);

  // 同步 <html> dark class
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  // 同步 <html> data-theme
  useEffect(() => {
    const html = document.documentElement;
    if (businessId) {
      html.setAttribute("data-theme", businessId);
    } else {
      html.removeAttribute("data-theme");
    }
  }, [businessId]);

  const themeColor = businessId ? BUSINESS_COLORS[businessId] : "#6366F1";

  return (
    <ThemeContext.Provider value={{ mode, isDark, themeColor, businessId, setMode, setBusinessId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeContext must be used within <ThemeProvider>");
  return ctx;
}
```

**改寫後的 `useTheme.ts`：**

```ts
// 僅做 re-export 向下相容，實際邏輯全部在 ThemeProvider
export { useThemeContext as useTheme } from "@/components/layout/ThemeProvider";
export type { ThemeContextType } from "@/types";
```

**`layout.tsx` 修改要點：**

```tsx
// src/app/layout.tsx
import { ThemeProvider } from "@/components/layout/ThemeProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col pt-16">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

#### 驗收標準
- [ ] `ThemeProvider` 建立並包裹 root layout，無 hydration mismatch
- [ ] `useTheme()` 在 Provider 內正常回傳值；在 Provider 外抛出明確錯誤
- [ ] `ThemeContextType` 型別與 `src/types/index.ts` 定義一致
- [ ] `ThemeToggle` 能透過 context 讀到當前 `mode` 與 `businessId`
- [ ] 主題切換時只有一處寫入 localStorage，無雙重寫入

---

### FIX-2：ThemeToggle 改為使用 useTheme hook

#### 問題
- `ThemeToggle.tsx` 完全獨立管理狀態：`localStorage.getItem("theme")`、`classList.toggle("dark")`、`localStorage.setItem(...)`
- 與 `useTheme` 形成**雙重狀態管理**，切換後兩者不同步

#### 修改方式

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/components/layout/ThemeToggle.tsx` | **改寫** | 移除自有的 localStorage/classList 操作；改用 `useTheme()` |
| `src/components/layout/ThemeProvider.tsx` | — | 已提供 `setMode` context |

**改寫後的核心邏輯：**

```tsx
"use client";

import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle() {
  const { mode, isDark, businessId, setMode } = useTheme();

  const toggle = () => {
    // light → dark → system → light
    const next = mode === "light" ? "dark" : mode === "dark" ? "system" : "light";
    setMode(next);
  };

  // ... render 邏輯使用 isDark / businessId 決定圖示與 dotColor
}
```

**完整 render 保留現有視覺設計**（月亮/太陽圖示、業務線 color dot）。

#### 驗收標準
- [ ] ThemeToggle 點擊循環：`light → dark → system → light`
- [ ] 切換後 `useTheme()` 在其他元件中立即反映新值（透過 context）
- [ ] `localStorage("theme")` 只有 `ThemeProvider` 一處寫入
- [ ] 業務線 color dot（`data-theme` 存在時在右上角顯示小色點）行為不變
- [ ] 移除 `ThemeToggle.tsx` 中的 `useEffect`（localStorage 讀取）和 `MutationObserver`

---

### FIX-3：建立 Games 專屬 layout.tsx

#### 問題
- 其他五大業務線都有 `layout.tsx` 設定 `data-theme`（如 `<div data-theme="quant">`）
- `games/` 無 `layout.tsx` → `data-theme="game"` 放在 page.tsx 內部的 `<div>` 上
- `games/loading.tsx` 載入時無法套用遊戲主題（loading 畫面先渲染，page.tsx 尚未 mount）

#### 修改方式

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/app/games/layout.tsx` | **新增** | 比照其他業務線，建立 layout 並設定 `data-theme="game"` |
| `src/app/games/page.tsx` | **修改** | 移除內部 `<div data-theme="game">`，改用 layout 提供的 theme |

**games/layout.tsx：**

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "經典遊戲 — OPC",
  description: "10 款熱門經典遊戲 · 使用鍵盤操作 · 挑戰高分",
};

export default function GamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-theme="game"
      className="min-h-full bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950"
    >
      {children}
    </div>
  );
}
```

**games/page.tsx 修改：**
- 移除最外層 `<div data-theme="game" ...>`
- 保留內部所有內容區塊，layout 已提供包裹 `<div>`

> **注意**：`games/page.tsx` 是 `"use client"`，而 layout 是 server component。Server component 的 `data-theme` 會先於 client hydration 存在 → loading 時即套用主題。同時，`ThemeProvider` 也會同步 `data-theme="game"` 到 `<html>`（透過 `setBusinessId("game")` → 這需要在 layout 或 page 中調用）。

**可選改進**：在 `games/layout.tsx` 中（或透過一個 client wrapper）調用 `useTheme().setBusinessId("game")`，確保 `<html>` 上也同步遊戲主題。做法：

```tsx
// src/app/games/layout.tsx
// 如果希望 <html> 也有 data-theme="game"，需要一個 client wrapper
```

或更簡單的作法：不修改 layout（保持 server component），讓 `ThemeProvider` 的 `businessId` 初始為 `null`，CSS 選擇器 `[data-theme="game"]` 在 layout 的 `<div>` 上已足夠覆蓋遊戲區域。

#### 驗收標準
- [ ] `src/app/games/layout.tsx` 存在，設定 `data-theme="game"` + 深色背景
- [ ] `games/loading.tsx` 載入時，layout 的 `data-theme="game"` 已套用
- [ ] `games/page.tsx` 中**沒有** `data-theme="game"` 重複設定
- [ ] 頁面視覺效果與修改前一致（背景漸層、Tab 樣式不變）
- [ ] 其他業務線的 layout 模式一致（quant/civil/marketplace/ai-tools/ppt 均使用 layout.tsx + data-theme）

---

### FIX-4：EmptyState 加入 barrel export

#### 問題
- `src/components/ui/index.ts` 未 export `EmptyState`
- 其他業務線無法用 `import { EmptyState } from "@/components/ui"` 引入

#### 修改方式

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/components/ui/index.ts` | **修改** | 加入 `EmptyState` export |

**加入行（依字母順序插在 `Card` 與 `Input` 之間，或放在文件末尾）：**

```ts
export { default as EmptyState } from "./EmptyState";
```

#### 驗收標準
- [ ] `import { EmptyState } from "@/components/ui"` 可正常匯入
- [ ] TypeScript 無型別錯誤
- [ ] 其他 UI 元件 export 不受影響（未誤刪任何行）

---

### FIX-5：補上測試檔案

#### 問題
- 專案中無任何 `.test.ts` / `.spec.ts` 檔案
- TASK-002c / TASK-002d 的元件與 hook 無對應測試

#### 修改方式

建議使用 **Vitest + React Testing Library**（與 Next.js 生態相容）。

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/hooks/__tests__/useTheme.test.ts` | **新增** | 測試 useTheme 基本行為（需 mock localStorage + ThemeProvider） |
| `src/components/layout/__tests__/ThemeToggle.test.tsx` | **新增** | 測試 ThemeToggle 渲染與點擊行為 |
| `src/components/ui/__tests__/EmptyState.test.tsx` | **新增** | 測試 EmptyState 渲染、props、action callback |
| `vitest.config.ts` 或 `jest.config.ts` | **新增/確認** | 確保測試 runner 配置正確 |

**測試要點：**

| 測試目標 | 測試案例 |
|----------|----------|
| **useTheme** | `useTheme()` 在 Provider 內回傳正確預設值（mode="system", isDark 依系統） |
| | `setMode("dark")` 後 `isDark` 變為 `true`，localStorage 寫入 `"dark"` |
| | `setMode("light")` 後 `isDark` 變為 `false` |
| | `setBusinessId("game")` 後 `businessId` 回傳 `"game"` |
| | `useTheme()` 在 Provider 外抛出 `Error` |
| **ThemeToggle** | 渲染時顯示正確圖示（依 mode 顯示月亮或太陽） |
| | 點擊後 mode 循環正確（light→dark→system→light） |
| | 當 `businessId` 存在時顯示 color dot |
| **EmptyState** | 只傳 `title` → 顯示 title，無 description，無 button |
| | 傳 `description` → 顯示描述文字 |
| | 傳 `action` → 顯示按鈕，點擊觸發 `onClick` |
| | 自訂 `icon` → 顯示自訂 emoji |

#### 驗收標準
- [ ] `npx vitest run`（或對應測試指令）全部通過，無錯誤
- [ ] useTheme 測試覆蓋：預設值、切換 mode、切換 businessId、Provider 外錯誤
- [ ] ThemeToggle 測試覆蓋：渲染、點擊循環、業務線 dot
- [ ] EmptyState 測試覆蓋：title/description/action/icon 四種 props 組合
- [ ] 測試檔案放置在對應目錄下的 `__tests__/` 資料夾中

---

## 執行順序

```
FIX-1 (ThemeProvider)     ── 阻塞 FIX-2
     │
     ▼
FIX-2 (ThemeToggle 改寫)  ── 依賴 FIX-1
     │
     ▼
FIX-3 (games/layout.tsx)  ── 獨立，可平行
     │
     ▼
FIX-4 (EmptyState export) ── 獨立，可平行
     │
     ▼
FIX-5 (測試)               ── 依賴 FIX-1～FIX-4 完成
```

| 修正 | 依賴 | 建議工時 |
|------|------|---------|
| FIX-1 | 無 | 1.5h |
| FIX-2 | FIX-1 | 0.5h |
| FIX-3 | 無 | 0.3h |
| FIX-4 | 無 | 0.1h |
| FIX-5 | FIX-1~FIX-4 | 1.5h |
| **總計** | | **~3.9h** |

---

## 最終狀態架構（目標）

```
┌─────────────────────────────────────────────────────────┐
│                   目標架構（修正後）                      │
│                                                         │
│  ThemeProvider (Context)                                 │
│    ├── useLocalStorage("theme")        ← 唯一寫入點      │
│    ├── useState<BusinessId | null>     ← 由 layout 設定  │
│    ├── sync <html>.classList("dark")   ← 唯一操作點      │
│    └── sync <html> data-theme          ← 唯一操作點      │
│         ↑                                      ↑         │
│   useTheme() hook ←────── ThemeToggle 讀取          │
│         ↑                                      ↑         │
│   各 layout.tsx                           各業務線頁面     │
│   (設定 data-theme + 觸發 setBusinessId)                  │
└─────────────────────────────────────────────────────────┘
```

---

## 附錄：關鍵檔案對照表

| 修正 | 檔案 | 動作 |
|------|------|------|
| FIX-1 | `src/components/layout/ThemeProvider.tsx` | **新增** |
| FIX-1 | `src/hooks/useTheme.ts` | **改寫**（改為 re-export ThemeProvider 中的 hook） |
| FIX-1 | `src/app/layout.tsx` | **修改**（包裹 `<ThemeProvider>`） |
| FIX-2 | `src/components/layout/ThemeToggle.tsx` | **改寫**（使用 `useTheme()`） |
| FIX-3 | `src/app/games/layout.tsx` | **新增** |
| FIX-3 | `src/app/games/page.tsx` | **修改**（移除 `data-theme="game"`） |
| FIX-4 | `src/components/ui/index.ts` | **修改**（加入 EmptyState export） |
| FIX-5 | `src/hooks/__tests__/useTheme.test.ts` | **新增** |
| FIX-5 | `src/components/layout/__tests__/ThemeToggle.test.tsx` | **新增** |
| FIX-5 | `src/components/ui/__tests__/EmptyState.test.tsx` | **新增** |
