# 開源線上簡報/PPT 編輯器專案研究報告

> 生成日期：2026-05-28 | 資料來源：GitHub API + 專案 README 分析

---

## 一、專案總覽比較表

| 專案 | GitHub Stars | 主要語言 | 授權 | 定位 | 獨特優勢 |
|------|-------------|---------|------|------|---------|
| **Reveal.js** | 71,314 | JavaScript | MIT | HTML 簡報框架 | 最大社群、CSS 3D 動畫、零依賴 |
| **Slidev** | 46,810 | TypeScript | MIT | 開發者簡報工具 | Markdown 驅動、npm 主題系統、PPTX 匯出 |
| **Impress.js** | 38,180 | JavaScript | MIT | 3D 簡報框架 | 3D 空間定位、無限畫布 |
| **Spectacle** | 10,129 | TypeScript | MIT | React 簡報庫 | React 組件化、TypeScript 支援 |
| **MDX Deck** | 11,483 | JavaScript | MIT | MDX 簡報 | MDX 彈性、Gatsby 靜態生成 |

---

## 二、各專案詳細分析

### 2.1 Reveal.js — HTML Presentation Framework

| 面向 | 說明 |
|------|------|
| **GitHub** | hakimel/reveal.js · ⭐ 71,314 |
| **技術棧** | 純 JavaScript (無框架依賴), CSS 3D Transforms |
| **核心架構** | CSS 3D transforms 驅動的幻燈片引擎。瀏覽器原生 `<section>` 元素作為投影片容器 |
| **投影片管理** | 以 HTML `section` 元素表示投影片，支援 `data-*` 屬性配置。可透過 `Reveal.sync()` 動態增刪 |
| **編輯機制** | 本身無圖形化編輯器。但開發者製作了 slides.com 作為視覺化編輯前端。支援 Markdown 內嵌 |
| **模板系統** | 社群提供大量 CSS 主題（dark, black, white, league, sky, beige, simple, serif, blood, night, moon, solarized） |
| **匯出功能** | PDF 匯出（?print- PDF）、Speaker Notes、LaTeX 公式、程式碼語法高亮 |
| **借鑑價值** | 🔥 CSS 3D transform 定位系統、嵌套投影片概念、fragment 步進動畫機制、Auto-Animate 差值動畫演算法 |

### 2.2 Slidev — Presentation Slides for Developers

| 面向 | 說明 |
|------|------|
| **GitHub** | slidevjs/slidev · ⭐ 46,810 |
| **技術棧** | TypeScript, Vue 3, Vite, UnoCSS, Shiki, Monaco Editor, KaTeX, Mermaid |
| **核心架構** | Markdown 驅動 + Vite 建置。將 Markdown 檔案解析為 Vue 組件，透過 Vite HMR 實現即時預覽 |
| **投影片管理** | Markdown 以 \`---\` 分隔投影片。支援 frontmatter 配置佈局、背景、過渡效果 |
| **編輯機制** | 任意文字編輯器 + HMR 即時預覽 / 內建 Monaco Editor / VSCode 擴展 |
| **模板系統** | 強大的 npm 主題系統，主題作為 npm 包發布（`@slidev/theme-*`） |
| **匯出功能** | PDF (Playwright) / PNG / PPTX / SPA / Docker |
| **借鑑價值** | 🔥 Markdown → Vue SFC 管線、UnoCSS 原子化 CSS、PPTX 匯出實現、Monaco Editor 整合、繪圖功能 |

### 2.3 Spectacle — ReactJS Presentation Library

| 面向 | 說明 |
|------|------|
| **GitHub** | FormidableLabs/spectacle · ⭐ 10,129 |
| **技術棧** | TypeScript, React 18+, Emotion (CSS-in-JS), MDX |
| **核心架構** | React 組件化架構。所有投影片元素均為 React 組件：`<Slide>`, `<Heading>`, `<Text>`, `<CodePane>` |
| **投影片管理** | 以 `<Slide>` 組件宣告，支援 `transition` 屬性配置過渡效果 |
| **借鑑價值** | 🔥 組件化投影片元素的拆分方式可作為編輯器元件面板的基礎；內建動畫系統的實現方式 |

### 2.4 Impress.js — 3D Presentation Framework

| 面向 | 說明 |
|------|------|
| **GitHub** | impress/impress.js · ⭐ 38,180 |
| **技術棧** | JavaScript (零依賴), CSS3 3D Transforms |
| **核心架構** | CSS3 3D transforms 驅動。所有投影片定位於 3D 空間（x, y, z, rotate, scale） |
| **借鑑價值** | 🔥 data-* 屬性驅動的定位系統、3D 空間過渡動畫、無限畫布概念 |

---

## 三、關鍵技術借鑑建議

### 3.1 投影片定位引擎
借鑑 Reveal.js 的嵌套投影片模型 + Impress.js 的 data-* 屬性定位系統。
統一抽象為：
```typescript
interface SlideNode {
  id: string;
  content: SlideContent;
  position: { x: number; y: number; z?: number; scale?: number };
  parent?: string;
  transition?: string;
  fragments?: Fragment[];
}
```

### 3.2 Markdown ↔ WYSIWYG 雙向同步
借鑑 Slidev 的 Markdown 解析管線。內部以 MDX AST 操作，支援 Markdown 原始碼編輯和可視化編輯即時同步。

### 3.3 主題/模板系統
借鑑 Slidev 的 npm 主題包機制。我們的模板改為「可下載的樣式包」結構：
```typescript
interface ThemePackage {
  id: string;
  name: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
  layouts: Record<string, SlideLayout>;
  components?: Record<string, React.ComponentType>;
}
```

### 3.4 HTML 匯出引擎強化
借鑑 Reveal.js 的獨立單頁應用輸出。我們目前的 exportToHTML 已經有基礎，可加入：
- Speaker Notes 支援
- 自動生成目錄頁
- 程式碼語法高亮（highlight.js / Shiki）
- LaTeX 公式渲染（KaTeX）

### 3.5 動畫與過渡系統
借鑑 Reveal.js 的 Auto-Animate 和 Fragment 系統。
```typescript
interface Fragment {
  index: number;
  animation: 'fade-in' | 'slide-up' | 'zoom-in' | 'highlight';
  duration: number;
}
```

### 3.6 協作編輯架構（未來）
借鑑 Slidev 的 WebSocket HMR 機制，未來可支援多人在線協作編輯。

---

## 四、優先級建議

| 優先級 | 功能 | 借鑑來源 | 預估工時 |
|--------|------|---------|---------|
| P0 | Markdown 導入/匯出（雙向同步） | Slidev | 2天 |
| P0 | 投影片過渡動畫系統 | Reveal.js | 1天 |
| P1 | 模板系統改為 npm 包結構 | Slidev | 2天 |
| P1 | 匯出強化（Speaker Notes, TOC） | Reveal.js | 1天 |
| P2 | 程式碼區塊 + 語法高亮 | Spectacle | 1天 |
| P2 | 自由畫布定位（data-* 系統） | Impress.js | 3天 |
| P3 | LaTeX 公式支援 | Slidev | 1天 |
| P3 | 多人在線協作 | Slidev HMR | 5天 |
