// =============================================================================
// PPT 編輯器 — Markdown 雙向轉換引擎（借鑑 Slidev）
// =============================================================================
//
// 支援語法：
//   # Title        → 封面投影片（大標題）
//   ## Section     → 一般投影片（次標題）
//   ---            → 投影片分隔
//   - List item    → 項目列表
//   1. Ordered     → 有序列表
//   **bold**       → 粗體
//   *italic*       → 斜體
//   ![alt](url)    → 圖片
//   ```code```     → 程式碼區塊
//   > quote        → 引言
//   空白行          → 段落
//   Frontmatter    → YAML 投影片屬性 (transition, background, layout, notes)
// =============================================================================

import type { PPTDocument, Slide, SlideElement, TextElement, ImageElement, SlideBackground } from "./types";
import { generateId, createSlide } from "./store";
import type { SlideTransition } from "./animations";

// ── 內建模板預設色 ──────────────────────────────────────────────────────

const DEFAULT_TEMPLATE_ID = "minimal-dark";

// ── 輔助：建立預設文字元素 ───────────────────────────────────────────────

function makeTextElement(partial: Partial<TextElement> & { content: string }): TextElement {
  return {
    id: generateId(),
    type: "text",
    position: { x: 80, y: 80 },
    size: { width: 800, height: 60 },
    rotation: 0,
    opacity: 100,
    locked: false,
    fontFamily: "Inter",
    fontSize: 24,
    fontWeight: "normal",
    fontStyle: "normal",
    textDecoration: "none",
    color: "#ffffff",
    textAlign: "left",
    lineHeight: 1.5,
    ...partial,
  };
}

// ── 簡易 YAML 解析器 ────────────────────────────────────────────────────

interface Frontmatter {
  transition?: SlideTransition;
  transitionDuration?: number;
  background?: string;
  layout?: string;
  notes?: string;
  [key: string]: unknown;
}

function parseYAML(yaml: string): Frontmatter {
  const result: Frontmatter = {};
  for (const line of yaml.split("\n")) {
    const match = line.match(/^\s*(\w+)\s*:\s*(.+)\s*$/);
    if (match) {
      const key = match[1];
      let value: string | number = match[2].trim().replace(/^["']|["']$/g, "");
      // 嘗試轉數字
      if (key === "transitionDuration") {
        value = parseInt(value as string, 10) || 600;
      }
      result[key] = value;
    }
  }
  return result;
}

// ── 輔助：將行內標記轉換為純文字（移除 ** * ` 等）────────────────────

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") // bold
    .replace(/\*(.+?)\*/g, "<em>$1</em>")     // italic
    .replace(/`(.+?)`/g, "<code>$1</code>")       // inline code
    .replace(/~~(.+?)~~/g, "$1");    // strikethrough
}

/** 判斷一行是否只含裝飾性字元（如分隔線、註解） */
function isLineBreakOrComment(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith("<!--") && trimmed.endsWith("-->")) return true;
  if (/^[-*_]{3,}$/.test(trimmed)) return true;
  return false;
}

// ── 從 Markdown 內容行解析為 SlideElement[] ──────────────────────────────

interface ParseContext {
  y: number;
  elements: SlideElement[];
  isFirstSlide: boolean;
}

function parseContentLines(lines: string[], ctx: ParseContext): void {
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 空白行 → 段落間隔
    if (!trimmed) {
      ctx.y += 20;
      i++;
      continue;
    }

    // 註解行 → 略過
    if (trimmed.startsWith("<!--") && trimmed.endsWith("-->")) {
      i++;
      continue;
    }

    // 程式碼區塊
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // 跳過結尾 ```

      const codeContent = codeLines.join("\n");
      ctx.elements.push(
        makeTextElement({
          content: codeContent,
          position: { x: 80, y: ctx.y },
          size: { width: 800, height: Math.max(60, codeLines.length * 22) },
          fontSize: 14,
          fontFamily: "JetBrains Mono",
          color: "#e2e8f0",
          lineHeight: 1.6,
        })
      );
      ctx.y += Math.max(60, codeLines.length * 22) + 16;
      continue;
    }

    // 引言
    if (trimmed.startsWith("> ")) {
      const quoteContent = trimmed.slice(2).trim();
      ctx.elements.push(
        makeTextElement({
          content: stripInlineMarkdown(quoteContent),
          position: { x: 80, y: ctx.y },
          size: { width: 760, height: 40 },
          fontSize: 20,
          fontStyle: "italic",
          color: "#94a3b8",
          lineHeight: 1.6,
        })
      );
      ctx.y += 56;
      i++;
      continue;
    }

    // 圖片
    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (imageMatch) {
      const [, alt, src] = imageMatch;
      ctx.elements.push({
        id: generateId(),
        type: "image",
        position: { x: 80, y: ctx.y },
        size: { width: 400, height: 250 },
        rotation: 0,
        opacity: 100,
        locked: false,
        src,
        alt,
        fit: "contain",
      } as ImageElement);
      ctx.y += 266;
      i++;
      continue;
    }

    // 有序列表
    const orderedMatch = trimmed.match(/^\d+\.\s+(.+)/);
    if (orderedMatch) {
      const item = stripInlineMarkdown(orderedMatch[1]);
      ctx.elements.push(
        makeTextElement({
          content: `${i - countPrecedingEmpty(lines, i) + 1}. ${item}`,
          position: { x: 100, y: ctx.y },
          size: { width: 760, height: 36 },
          fontSize: 20,
          lineHeight: 1.6,
        })
      );
      ctx.y += 48;
      i++;
      continue;
    }

    // 無序列表
    const bulletMatch = trimmed.match(/^[-*]\s+(.+)/);
    if (bulletMatch) {
      const item = stripInlineMarkdown(bulletMatch[1]);
      ctx.elements.push(
        makeTextElement({
          content: `• ${item}`,
          position: { x: 100, y: ctx.y },
          size: { width: 760, height: 36 },
          fontSize: 20,
          lineHeight: 1.6,
        })
      );
      ctx.y += 48;
      i++;
      continue;
    }

    // 一般段落（多行合併）
    const paragraphLines: string[] = [trimmed];
    i++;
    while (i < lines.length) {
      const next = lines[i].trim();
      if (!next || next.startsWith("#") || next.startsWith("-") || next.startsWith("> ") || next.startsWith("```") || next.startsWith("1.") || next.startsWith("![")) break;
      if (isLineBreakOrComment(next)) break;
      paragraphLines.push(next);
      i++;
    }
    const paragraph = paragraphLines.map((l) => stripInlineMarkdown(l)).join(" ");
    if (paragraph) {
      ctx.elements.push(
        makeTextElement({
          content: paragraph,
          position: { x: 80, y: ctx.y },
          size: { width: 800, height: 40 },
          fontSize: 18,
          lineHeight: 1.6,
        })
      );
      ctx.y += 52;
    }
  }
}

/** 計算連續空白行的數量（用於有序列表編號） */
function countPrecedingEmpty(lines: string[], idx: number): number {
  let count = 0;
  for (let j = idx - 1; j >= 0; j--) {
    if (lines[j].trim() === "") count++;
    else break;
  }
  return count;
}

// ── 從 Markdown 區塊解析為 Slide ─────────────────────────────────────────

function parseBlockToSlide(block: string, index: number, totalBlocks: number): Slide {
  const lines = block.split("\n");
  let frontmatter: Frontmatter = {};
  let contentLines = lines;

  // 檢查 YAML frontmatter
  if (lines[0]?.trim() === "---") {
    const fmEnd = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
    if (fmEnd > 1) {
      frontmatter = parseYAML(lines.slice(1, fmEnd).join("\n"));
      contentLines = lines.slice(fmEnd + 1);
    }
  }

  const slide: Slide = {
    id: generateId(),
    elements: [],
    background: { type: "solid", value: "#0a0a0a" },
    ...(frontmatter.transition ? { transition: frontmatter.transition as SlideTransition } : {}),
    ...(frontmatter.transitionDuration ? { transitionDuration: frontmatter.transitionDuration } : {}),
    ...(frontmatter.notes ? { notes: frontmatter.notes } : {}),
  };

  // 處理 frontmatter 背景
  if (frontmatter.background) {
    const bg = frontmatter.background;
    if (bg.startsWith("linear-gradient") || bg.startsWith("radial-gradient")) {
      slide.background = { type: "gradient", value: bg };
    } else {
      slide.background = { type: "solid", value: bg };
    }
  }

  // 解析內容行
  let hasHeading = false;
  let firstContentY = 80;

  // 先找第一個標題來決定投影片類型
  for (const line of contentLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ") && !hasHeading) {
      hasHeading = true;
      break;
    }
  }

  const ctx: ParseContext = {
    y: hasHeading ? 160 : 80,
    elements: [],
    isFirstSlide: index === 0,
  };

  for (const line of contentLines) {
    const trimmed = line.trim();

    // # Title → 大標題（只在第一頁或作為封面時置中）
    const h1Match = trimmed.match(/^# (.+)/);
    if (h1Match) {
      if (!hasHeading) {
        hasHeading = true;
      }
      const title = stripInlineMarkdown(h1Match[1]);
      ctx.elements.push(
        makeTextElement({
          content: title,
          position: { x: 80, y: index === 0 ? 200 : ctx.y },
          size: { width: 800, height: 70 },
          fontSize: index === 0 ? 48 : 36,
          fontWeight: "bold",
          textAlign: index === 0 ? "center" : "left",
          lineHeight: 1.3,
        })
      );
      ctx.y = index === 0 ? 290 : ctx.y + 80;
      continue;
    }

    // ## Section → 次標題
    const h2Match = trimmed.match(/^## (.+)/);
    if (h2Match) {
      const title = stripInlineMarkdown(h2Match[1]);
      ctx.elements.push(
        makeTextElement({
          content: title,
          position: { x: 80, y: ctx.y },
          size: { width: 800, height: 60 },
          fontSize: 32,
          fontWeight: "bold",
          textAlign: "left",
          lineHeight: 1.3,
        })
      );
      ctx.y += 70;
      continue;
    }

    // ### 三級標題
    const h3Match = trimmed.match(/^### (.+)/);
    if (h3Match) {
      const title = stripInlineMarkdown(h3Match[1]);
      ctx.elements.push(
        makeTextElement({
          content: title,
          position: { x: 80, y: ctx.y },
          size: { width: 800, height: 50 },
          fontSize: 24,
          fontWeight: "bold",
          textAlign: "left",
          lineHeight: 1.4,
        })
      );
      ctx.y += 60;
      continue;
    }
  }

  // 第二次遍歷：處理非標題內容
  // 過濾掉已經處理過的標題行
  const nonHeadingLines: string[] = [];
  for (const line of contentLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ") || trimmed.startsWith("## ") || trimmed.startsWith("### ")) {
      continue;
    }
    nonHeadingLines.push(line);
  }

  // 解析剩餘內容
  parseContentLines(nonHeadingLines, ctx);

  slide.elements = ctx.elements;
  return slide;
}

// ── 公開 API：Markdown → Slides ──────────────────────────────────────────

/**
 * 將 Markdown 字串轉換為 Slide 陣列。
 *
 * @param md - Markdown 字串
 * @param options - 轉換選項
 * @returns Slide 陣列
 */
export function markdownToSlides(md: string): Partial<Slide>[] {
  // 以 --- 分隔投影片區塊（行首 --- 或前後皆換行的 ---）
  const blocks = md.split(/\n---\n/);
  return blocks.map((block, i) => parseBlockToSlide(block, i, blocks.length));
}

/**
 * 將 Markdown 字串解析為完整的 PPTDocument。
 *
 * @param md - Markdown 字串
 * @param title - 簡報標題（可選，預設取第一個 # 標題或 "未命名簡報"）
 * @returns PPTDocument
 */
export function markdownToDocument(md: string, title?: string): PPTDocument {
  const slides = markdownToSlides(md);

  // 從第一個 slide 尋找標題
  let docTitle = title ?? "未命名簡報";
  if (!title && slides.length > 0) {
    const firstSlide = slides[0];
    if (firstSlide.elements) {
      const titleEl = firstSlide.elements.find(
        (el) => el.type === "text" && (el as TextElement).fontWeight === "bold"
      ) as TextElement | undefined;
      if (titleEl) {
        docTitle = titleEl.content;
      }
    }
  }

  const now = Date.now();
  return {
    id: generateId(),
    title: docTitle,
    slides: slides as Slide[],
    templateId: DEFAULT_TEMPLATE_ID,
    createdAt: now,
    updatedAt: now,
  };
}

// ── 從 SlideElement 推斷 Markdown 表示 ──────────────────────────────────

function elementToMarkdown(el: SlideElement, elements: SlideElement[]): string[] {
  const lines: string[] = [];

  if (el.type === "text") {
    const t = el as TextElement;
    const content = t.content;

    // 判斷是否為標題
    const isTitle = t.fontWeight === "bold" && t.fontSize >= 36;
    const isSubtitle = t.fontWeight === "bold" && t.fontSize >= 28 && t.fontSize < 36;
    const isSectionTitle = t.fontWeight === "bold" && t.fontSize >= 22 && t.fontSize < 28;

    // 項目符號
    if (content.startsWith("• ") || content.startsWith("· ")) {
      lines.push(`- ${content.slice(2)}`);
      return lines;
    }

    // 有序列表
    const orderedMatch = content.match(/^\d+\.\s+(.+)/);
    if (orderedMatch) {
      lines.push(`${elements.indexOf(el) + 1}. ${orderedMatch[1]}`);
      return lines;
    }

    // 引言（斜體且位置靠左）
    if (t.fontStyle === "italic" && t.color === "#94a3b8") {
      lines.push(`> ${content}`);
      return lines;
    }

    // 標題
    if (isTitle) {
      lines.push(`# ${content}`);
      return lines;
    }
    if (isSubtitle) {
      lines.push(`## ${content}`);
      return lines;
    }
    if (isSectionTitle) {
      lines.push(`### ${content}`);
      return lines;
    }

    // 一般段落（如果內容包含換行，視為程式碼區塊）
    if (content.includes("\n") && t.fontFamily?.includes("Mono")) {
      lines.push("```");
      lines.push(content);
      lines.push("```");
      return lines;
    }

    lines.push(content);
    return lines;
  }

  if (el.type === "image") {
    const img = el as ImageElement;
    lines.push(`![${img.alt}](${img.src})`);
    return lines;
  }

  // 形狀 → 以註解表示
  if (el.type === "shape") {
    lines.push(`<!-- shape: ${(el as import("./types").ShapeElement).shapeType} -->`);
    return lines;
  }

  return lines;
}

// ── 公開 API：Slides → Markdown ──────────────────────────────────────────

/**
 * 將 PPTDocument 匯出為 Markdown 字串。
 *
 * 轉換規則：
 * - 每頁投影片以 `---` 分隔
 * - 最大字型 TextElement 作為 `#` 或 `##` 標題
 * - 列表型 TextElement 作為 `-` 要點
 * - 支援 frontmatter 輸出（transition, background, notes）
 *
 * @param doc - PPTDocument
 * @returns Markdown 字串
 */
export function slidesToMarkdown(doc: PPTDocument): string {
  const blocks: string[] = [];

  for (let i = 0; i < doc.slides.length; i++) {
    const slide = doc.slides[i];
    const lines: string[] = [];

    // Frontmatter
    const fm: Frontmatter = {};
    if (slide.transition) fm.transition = slide.transition as any;
    if (slide.transitionDuration && slide.transitionDuration !== 600) fm.transitionDuration = slide.transitionDuration;
    if (slide.notes) fm.notes = slide.notes;
    if (slide.background) {
      if (slide.background.type === "gradient") {
        fm.background = slide.background.value;
      } else if (slide.background.value !== "#0a0a0a" && slide.background.value !== "#ffffff") {
        fm.background = slide.background.value;
      }
    }

    const fmKeys = Object.keys(fm);
    if (fmKeys.length > 0) {
      lines.push("---");
      if (fm.transition) lines.push(`transition: ${fm.transition}`);
      if (fm.transitionDuration) lines.push(`transitionDuration: ${fm.transitionDuration}`);
      if (fm.background) lines.push(`background: ${fm.background}`);
      if (fm.notes) lines.push(`notes: "${fm.notes.replace(/"/g, '\\"')}"`);
      lines.push("---");
    }

    // 排序元素：由上到下，由左到右
    const sortedElements = [...slide.elements].sort((a, b) => {
      // 標題優先（粗體大字型排最前面）
      const aIsHeading = a.type === "text" && (a as TextElement).fontWeight === "bold";
      const bIsHeading = b.type === "text" && (b as TextElement).fontWeight === "bold";
      if (aIsHeading && !bIsHeading) return -1;
      if (!aIsHeading && bIsHeading) return 1;
      // 按 Y 座標排序
      if (a.position.y !== b.position.y) return a.position.y - b.position.y;
      return a.position.x - b.position.x;
    });

    // 轉換每個元素為 Markdown
    for (const el of sortedElements) {
      const mdLines = elementToMarkdown(el, sortedElements);
      for (const line of mdLines) {
        lines.push(line);
      }
    }

    blocks.push(lines.join("\n"));
  }

  return blocks.join("\n---\n");
}

/**
 * 將 PPTDocument 匯出為 Markdown 並觸發下載。
 *
 * @param doc - PPTDocument
 */
export function downloadMarkdown(doc: PPTDocument): void {
  const md = slidesToMarkdown(doc);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${doc.title.replace(/\s+/g, "_")}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
