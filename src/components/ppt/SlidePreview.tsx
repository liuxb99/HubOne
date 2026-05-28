"use client";

import { useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { usePPTStore, CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/ppt/store";
import type { TextElement, ShapeElement, ImageElement } from "@/lib/ppt/types";

// ── 輔助：Render 單一元件 ─────────────────────────────────────────────────

function renderPreviewElement(el: import("@/lib/ppt/types").SlideElement) {
  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: el.position.x,
    top: el.position.y,
    width: el.size.width,
    height: el.size.height,
    opacity: el.opacity / 100,
    transform: `rotate(${el.rotation}deg)`,
    pointerEvents: "none",
  };

  if (el.type === "text") {
    const t = el as TextElement;
    return (
      <div key={el.id} style={baseStyle}>
        <p
          style={{
            fontFamily: t.fontFamily,
            fontSize: t.fontSize,
            fontWeight: t.fontWeight,
            fontStyle: t.fontStyle,
            textDecoration: t.textDecoration as React.CSSProperties["textDecoration"],
            color: t.color,
            textAlign: t.textAlign,
            lineHeight: t.lineHeight,
            margin: 0,
            padding: "4px",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {t.content}
        </p>
      </div>
    );
  }

  if (el.type === "shape") {
    const s = el as ShapeElement;
    const shapeStyle: React.CSSProperties = {
      ...baseStyle,
      backgroundColor: s.fillColor,
      border: `${s.strokeWidth}px solid ${s.strokeColor}`,
      borderRadius: s.shapeType === "circle" ? "50%" : s.shapeType === "rect" ? "4px" : "0",
      clipPath:
        s.shapeType === "triangle"
          ? "polygon(50% 0%, 0% 100%, 100% 100%)"
          : s.shapeType === "diamond"
          ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
          : undefined,
    };
    return <div key={el.id} style={shapeStyle} />;
  }

  if (el.type === "image") {
    const img = el as ImageElement;
    return (
      <div key={el.id} style={{ ...baseStyle, overflow: "hidden" }}>
        <img
          src={img.src}
          alt={img.alt}
          style={{
            width: "100%",
            height: "100%",
            objectFit: img.fit as React.CSSProperties["objectFit"],
          }}
          draggable={false}
        />
      </div>
    );
  }

  return null;
}

// ── 主元件 ────────────────────────────────────────────────────────────────

export default function SlidePreview() {
  const { doc, editor, editorDispatch } = usePPTStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const currentSlide = doc.slides[editor.currentPresentIndex] ?? null;
  const total = doc.slides.length;
  const currentIndex = editor.currentPresentIndex;

  // ── 鍵盤控制 ──────────────────────────────────────────────────────────

  const goNext = useCallback(() => {
    if (currentIndex < total - 1) {
      editorDispatch({ type: "NEXT_SLIDE", payload: { total } });
    }
  }, [currentIndex, total, editorDispatch]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      editorDispatch({ type: "PREV_SLIDE" });
    }
  }, [currentIndex, editorDispatch]);

  const exitFullscreen = useCallback(() => {
    editorDispatch({ type: "END_PRESENT" });
    // 嘗試退出瀏覽器全螢幕
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, [editorDispatch]);

  // 鍵盤事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "Escape") {
        e.preventDefault();
        exitFullscreen();
      } else if (e.key === "Home") {
        e.preventDefault();
        editorDispatch({ type: "PREV_SLIDE" });
        // 跳到第一頁：連續調用 prev 到 index 0
      } else if (e.key === "End") {
        e.preventDefault();
        // 跳到最後一頁
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, exitFullscreen, editorDispatch]);

  // ── 點擊左右切換 ──────────────────────────────────────────────────────

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x < rect.width / 2) {
        goPrev();
      } else {
        goNext();
      }
    },
    [goNext, goPrev]
  );

  // ── 觸控滑動 ──────────────────────────────────────────────────────────

  const touchStartX = useRef(0);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const diff = touchStartX.current - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) goNext();
        else goPrev();
      }
    },
    [goNext, goPrev]
  );

  // ── 自動全螢幕 ────────────────────────────────────────────────────────

  useEffect(() => {
    if (editor.isPresenting && containerRef.current) {
      containerRef.current.requestFullscreen?.().catch(() => {
        // 某些瀏覽器可能需要使用者互動才能全螢幕
      });
    }
  }, [editor.isPresenting]);

  // ── 監聽 fullscreen change ────────────────────────────────────────────

  useEffect(() => {
    const handleFSChange = () => {
      if (!document.fullscreenElement && editor.isPresenting) {
        // 使用者按了 F11 或 Escape 退出全螢幕
        // 但我們還是保留放映模式
      }
    };
    document.addEventListener("fullscreenchange", handleFSChange);
    return () => document.removeEventListener("fullscreenchange", handleFSChange);
  }, [editor.isPresenting]);

  // ── 處理 Home/End ─────────────────────────────────────────────────────
  // 用 useEffect 來處理 Home/End
  useEffect(() => {
    const handleKeyDown2 = (e: KeyboardEvent) => {
      if (e.key === "Home") {
        e.preventDefault();
        // 跳到第一頁：設為 0
        while (editor.currentPresentIndex > 0) {
          editorDispatch({ type: "PREV_SLIDE" });
          break;
        }
      } else if (e.key === "End") {
        e.preventDefault();
        // 跳到最後一頁
        const target = total - 1;
        while (editor.currentPresentIndex < target) {
          editorDispatch({ type: "NEXT_SLIDE", payload: { total } });
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown2);
    return () => window.removeEventListener("keydown", handleKeyDown2);
  }, [editor.currentPresentIndex, total, editorDispatch]);

  if (!editor.isPresenting) return null;

  if (!currentSlide) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
        <p className="text-zinc-500">無投影片可放映</p>
        <button
          onClick={exitFullscreen}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white text-sm"
        >
          ESC 退出
        </button>
      </div>
    );
  }

  const bgStyle: React.CSSProperties =
    currentSlide.background.type === "gradient"
      ? { background: currentSlide.background.value }
      : { backgroundColor: currentSlide.background.value };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black flex flex-col"
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 投影片內容 — 垂直置中 */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div
          className="relative shadow-2xl overflow-hidden"
          style={{
            width: "100%",
            maxWidth: CANVAS_WIDTH,
            aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
            ...bgStyle,
          }}
        >
          {/* Render 所有元件 */}
          {currentSlide.elements.map(renderPreviewElement)}
        </div>
      </div>

      {/* 底部控制列 */}
      <div className="h-16 bg-zinc-900/80 border-t border-zinc-800 flex items-center justify-center gap-4 px-4">
        {/* 上一頁 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          disabled={currentIndex === 0}
          className={cn(
            "w-10 h-10 flex items-center justify-center rounded-full transition-colors",
            currentIndex === 0
              ? "text-zinc-600 cursor-not-allowed"
              : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
          )}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        {/* 頁碼指示器 */}
        <div className="flex items-center gap-2">
          {doc.slides.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                // 直接跳到指定頁
                const diff = i - editor.currentPresentIndex;
                for (let j = 0; j < Math.abs(diff); j++) {
                  if (diff > 0) editorDispatch({ type: "NEXT_SLIDE", payload: { total } });
                  else editorDispatch({ type: "PREV_SLIDE" });
                }
              }}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-all",
                i === currentIndex
                  ? "bg-pink-500 scale-125"
                  : "bg-zinc-600 hover:bg-zinc-400"
              )}
            />
          ))}
        </div>

        {/* 下一頁 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          disabled={currentIndex >= total - 1}
          className={cn(
            "w-10 h-10 flex items-center justify-center rounded-full transition-colors",
            currentIndex >= total - 1
              ? "text-zinc-600 cursor-not-allowed"
              : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
          )}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>

        {/* 分隔 */}
        <div className="w-px h-6 bg-zinc-800 mx-2" />

        {/* 頁碼文字 */}
        <span className="text-sm text-zinc-400">
          {currentIndex + 1} / {total}
        </span>

        {/* 退出 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            exitFullscreen();
          }}
          className="ml-2 px-4 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          ✕ 退出
        </button>
      </div>
    </div>
  );
}
