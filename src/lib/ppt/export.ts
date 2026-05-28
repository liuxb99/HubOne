// =============================================================================
// 線上 PPT 編輯器 — HTML 匯出模組
// =============================================================================

import type { PPTDocument, Slide, SlideElement, TextElement, ImageElement, ShapeElement } from "./types";
import { getTemplateById } from "./template";

// ── 輔助：CSS 跳脫 ───────────────────────────────────────────────────────

function esc(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── 輔助：產生 shape SVG ────────────────────────────────────────────────

function renderShapeToSVG(el: ShapeElement): string {
  const { shapeType, fillColor, strokeColor, strokeWidth } = el;
  const { width, height } = el.size;

  switch (shapeType) {
    case "rect":
      return `<rect x="0" y="0" width="${width}" height="${height}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" rx="4" />`;
    case "circle":
      return `<circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) / 2}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
    case "triangle":
      return `<polygon points="${width / 2},0 ${width},${height} 0,${height}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
    case "diamond":
      return `<polygon points="${width / 2},0 ${width},${height / 2} ${width / 2},${height} 0,${height / 2}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
    case "arrow": {
      const tipX = width;
      const tipY = height / 2;
      const bodyEndX = width * 0.65;
      return `<line x1="0" y1="${tipY}" x2="${bodyEndX}" y2="${tipY}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
<polygon points="${tipX},${tipY} ${bodyEndX},0 ${bodyEndX},${height}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
    }
    case "line":
      return `<line x1="0" y1="${height / 2}" x2="${width}" y2="${height / 2}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
    default:
      return "";
  }
}

// ── 輔助：產生元素 HTML ─────────────────────────────────────────────────

function renderElement(el: SlideElement): string {
  const baseStyle = [
    `position: absolute`,
    `left: ${el.position.x}px`,
    `top: ${el.position.y}px`,
    `width: ${el.size.width}px`,
    `height: ${el.size.height}px`,
    `opacity: ${el.opacity}`,
    `transform: rotate(${el.rotation}deg)`,
    el.locked ? `pointer-events: none` : ``,
  ]
    .filter(Boolean)
    .join("; ");

  switch (el.type) {
    case "text": {
      const t = el as TextElement;
      const textStyle = [
        `font-family: ${t.fontFamily}, sans-serif`,
        `font-size: ${t.fontSize}px`,
        `font-weight: ${t.fontWeight}`,
        `font-style: ${t.fontStyle}`,
        t.textDecoration !== "none" ? `text-decoration: ${t.textDecoration}` : "",
        `color: ${t.color}`,
        `text-align: ${t.textAlign}`,
        `line-height: ${t.lineHeight}`,
        `margin: 0`,
        `white-space: pre-wrap`,
        `overflow: hidden`,
      ]
        .filter(Boolean)
        .join("; ");
      return `<div style="${baseStyle}; overflow: hidden;"><p style="${textStyle}">${esc(t.content)}</p></div>`;
    }

    case "image": {
      const img = el as ImageElement;
      const objectFit = img.fit === "fill" ? "100% 100%" : img.fit;
      return `<div style="${baseStyle}; overflow: hidden;">
  <img src="${esc(img.src)}" alt="${esc(img.alt)}" style="width: 100%; height: 100%; object-fit: ${objectFit};" />
</div>`;
    }

    case "shape": {
      const s = el as ShapeElement;
      const svg = renderShapeToSVG(s);
      return `<div style="${baseStyle}; overflow: visible;">
  <svg width="${s.size.width}" height="${s.size.height}" viewBox="0 0 ${s.size.width} ${s.size.height}" xmlns="http://www.w3.org/2000/svg">${svg}</svg>
</div>`;
    }

    default:
      return "";
  }
}

// ── 輔助：產生單頁投影片 HTML ───────────────────────────────────────────

function renderSlide(slide: Slide, index: number, total: number): string {
  const bgStyle =
    slide.background.type === "gradient"
      ? `background: ${slide.background.value};`
      : `background-color: ${slide.background.value};`;

  const elementsHTML = slide.elements.map(renderElement).join("\n");

  return `<div class="slide" data-index="${index}">
  <div class="slide-content" style="${bgStyle} position: relative; width: 100%; height: 100%; overflow: hidden;">
    ${elementsHTML}
  </div>
  <div class="slide-number">${index + 1} / ${total}</div>
</div>`;
}

// ── 主匯出函式 ──────────────────────────────────────────────────────────

/**
 * 產生完整獨立的 HTML 檔案，包含所有投影片內容、樣式、投影片切換功能。
 * 可直接在瀏覽器開啟放映（按空白鍵或點擊切換下一頁）。
 */
export function exportToHTML(doc: PPTDocument): string {
  const template = getTemplateById(doc.templateId);
  const total = doc.slides.length;

  const slidesHTML = doc.slides.map((slide, i) => renderSlide(slide, i, total)).join("\n");

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(doc.title)}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 100%; height: 100%; overflow: hidden; font-family: ${template?.fonts.body ?? "Noto Sans TC, sans-serif"}; background: #000; }

  .presentation { width: 100%; height: 100%; position: relative; }
  .slide { position: absolute; inset: 0; display: none; }
  .slide.active { display: block; }

  .slide-content {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 40px;
    position: relative;
  }

  .slide-number {
    position: absolute;
    bottom: 16px;
    right: 24px;
    font-size: 14px;
    color: rgba(255,255,255,0.5);
    font-family: ${template?.fonts.body ?? "Noto Sans TC, sans-serif"};
    pointer-events: none;
  }

  /* 導航控制 */
  .nav-arrows { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); display: flex; gap: 12px; z-index: 100; }
  .nav-arrows button {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    color: #fff;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
    backdrop-filter: blur(4px);
  }
  .nav-arrows button:hover { background: rgba(255,255,255,0.25); }
  .nav-arrows button:disabled { opacity: 0.3; cursor: default; }

  /* 進度條 */
  .progress-bar { position: fixed; top: 0; left: 0; height: 4px; background: ${template?.colors.accent ?? "#e94560"}; transition: width 0.4s ease; z-index: 200; }

  /* 全螢幕提示 */
  .fullscreen-hint {
    position: fixed;
    top: 16px;
    right: 24px;
    color: rgba(255,255,255,0.3);
    font-size: 13px;
    z-index: 100;
    pointer-events: none;
  }
</style>
</head>
<body>
<div class="presentation" id="presentation">
  ${slidesHTML}
  <div class="progress-bar" id="progressBar" style="width: ${total > 0 ? 100 / total : 0}%"></div>
  <div class="nav-arrows">
    <button id="prevBtn" disabled>◀</button>
    <button id="nextBtn">▶</button>
  </div>
  <div class="fullscreen-hint">按 F11 全螢幕 · 空白鍵下一頁</div>
</div>

<script>
  (function() {
    var slides = document.querySelectorAll('.slide');
    var total = slides.length;
    var current = 0;
    var prevBtn = document.getElementById('prevBtn');
    var nextBtn = document.getElementById('nextBtn');
    var progressBar = document.getElementById('progressBar');

    function showSlide(index) {
      slides.forEach(function(s, i) {
        s.classList.toggle('active', i === index);
      });
      current = index;
      prevBtn.disabled = current === 0;
      nextBtn.disabled = current >= total - 1;
      if (progressBar) {
        progressBar.style.width = ((current + 1) / total * 100) + '%';
      }
    }

    function next() {
      if (current < total - 1) showSlide(current + 1);
    }

    function prev() {
      if (current > 0) showSlide(current - 1);
    }

    // 鍵盤事件
    document.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        prev();
      } else if (e.key === 'Home') {
        e.preventDefault();
        showSlide(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        showSlide(total - 1);
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) document.exitFullscreen();
      }
    });

    // 滑鼠/觸控點擊切換
    document.getElementById('presentation').addEventListener('click', function(e) {
      // 不觸發按鈕區域
      if (e.target.closest('button')) return;
      if (e.target.closest('.fullscreen-hint')) return;
      if (e.target.closest('.slide-number')) return;
      // 左半邊上一頁，右半邊下一頁
      var rect = this.getBoundingClientRect();
      var x = e.clientX - rect.left;
      if (x < rect.width / 2) prev();
      else next();
    });

    // 觸控滑動
    var touchStartX = 0;
    document.addEventListener('touchstart', function(e) {
      touchStartX = e.changedTouches[0].screenX;
    });
    document.addEventListener('touchend', function(e) {
      var diff = touchStartX - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) next();
        else prev();
      }
    });

    // 按鈕事件
    if (prevBtn) prevBtn.addEventListener('click', prev);
    if (nextBtn) nextBtn.addEventListener('click', next);

    // 顯示第一頁
    showSlide(0);
  })();
</script>
</body>
</html>`;
}
