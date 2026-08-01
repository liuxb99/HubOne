"use client";

import { useEffect, useCallback, useRef, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { usePPTStore, CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/ppt/store";
import type { TextElement, ShapeElement, ImageElement, Slide } from "@/lib/ppt/types";
import { getTransitionStyles, getAllTransitionKeyframes, type SlideTransition, type TransitionDirection } from "@/lib/ppt/animations";

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

// ── 取得過渡型別與持續時間 ───────────────────────────────────────────────

function getSlideTransition(slide: Slide): SlideTransition {
  const t = slide.transition;
  if (t && ["none", "fade", "slide-left", "slide-right", "slide-up", "slide-down", "zoom", "flip"].includes(t)) {
    return t as SlideTransition;
  }
  return "none";
}

function getSlideDuration(slide: Slide): number {
  return slide.transitionDuration ?? 600;
}

// ── 主元件 ────────────────────────────────────────────────────────────────

export default function SlidePreview() {
  const { doc, editor, editorDispatch } = usePPTStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // ── 動畫狀態 ──────────────────────────────────────────────────────────
  const [animating, setAnimating] = useState(false);
  const [animationStyle, setAnimationStyle] = useState<React.CSSProperties>({});
  const [animationDirection, setAnimationDirection] = useState<TransitionDirection>("forward");
  const prevIndexRef = useRef(editor.currentPresentIndex);

  const currentSlide = doc.slides[editor.currentPresentIndex] ?? null;
  const total = doc.slides.length;
  const currentIndex = editor.currentPresentIndex;

  // 當前投影片的過渡設定
  const transitionType = currentSlide ? getSlideTransition(currentSlide) : "none";
  const transitionDuration = currentSlide ? getSlideDuration(currentSlide) : 600;

  // ── 注入動畫 CSS ──────────────────────────────────────────────────────
  const keyframeCSS = useMemo(() => getAllTransitionKeyframes(), []);

  // ── 切換投影片（含過渡動畫） ──────────────────────────────────────────

  const goToSlide = useCallback(
    (targetIndex: number) => {
      if (animating) return;
      if (targetIndex < 0 || targetIndex >= total) return;
      if (targetIndex === currentIndex) return;

      const direction: TransitionDirection = targetIndex > currentIndex ? "forward" : "backward";
      const targetSlide = doc.slides[targetIndex];
      const tType = targetSlide ? getSlideTransition(targetSlide) : "none";
      const tDur = targetSlide ? getSlideDuration(targetSlide) : 600;

      if (tType === "none" || tDur === 0) {
        // 無過渡，直接切換
        const diff = Math.abs(targetIndex - currentIndex);
        for (let i = 0; i < diff; i++) {
          if (targetIndex > currentIndex) {
            editorDispatch({ type: "NEXT_SLIDE", payload: { total } });
          } else {
            editorDispatch({ type: "PREV_SLIDE" });
          }
        }
        return;
      }

      // 有過渡：設定動畫樣式
      const { enterStyle } = getTransitionStyles(tType, tDur, direction);
      setAnimationDirection(direction);
      setAnimationStyle(enterStyle);
      setAnimating(true);

      // 先切換投影片
      const diff2 = Math.abs(targetIndex - currentIndex);
      for (let i = 0; i < diff2; i++) {
        if (targetIndex > currentIndex) {
          editorDispatch({ type: "NEXT_SLIDE", payload: { total } });
        } else {
          editorDispatch({ type: "PREV_SLIDE" });
        }
      }

      // 動畫結束後清除樣式
      setTimeout(() => {
        setAnimating(false);
        setAnimationStyle({});
      }, tDur);
    },
    [animating, currentIndex, total, doc.slides, editorDispatch]
  );

  // ── 監聽 currentIndex 變化以觸發動畫 ─────────────────────────────────

  useEffect(() => {
    const prev = prevIndexRef.current;
    if (prev !== currentIndex) {
      // 當 index 因其他方式改變時（如按鈕直接跳頁）
      prevIndexRef.current = currentIndex;
    }
  }, [currentIndex]);

  // ── 鍵盤控制 ──────────────────────────────────────────────────────────

  const goNext = useCallback(() => {
    if (currentIndex < total - 1) {
      goToSlide(currentIndex + 1);
    }
  }, [currentIndex, total, goToSlide]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      goToSlide(currentIndex - 1);
    }
  }, [currentIndex, goToSlide]);

  // 優化：直接跳到首/尾頁
  const goToFirst = useCallback(() => {
    goToSlide(0);
  }, [goToSlide]);

  const goToLast = useCallback(() => {
    goToSlide(total - 1);
  }, [goToSlide, total]);

  const exitFullscreen = useCallback(() => {
    editorDispatch({ type: "END_PRESENT" });
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
        goToFirst();
      } else if (e.key === "End") {
        e.preventDefault();
        goToLast();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, exitFullscreen, goToFirst, goToLast]);

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
      containerRef.current.requestFullscreen?.().catch(() => {});
    }
  }, [editor.isPresenting]);

  // ── 監聽 fullscreen change ────────────────────────────────────────────

  useEffect(() => {
    const handleFSChange = () => {
      // 不做特殊處理
    };
    document.addEventListener("fullscreenchange", handleFSChange);
    return () => document.removeEventListener("fullscreenchange", handleFSChange);
  }, []);

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
      {/* 注入動畫 CSS */}
      {keyframeCSS && (
        <style>{keyframeCSS}</style>
      )}

      {/* 投影片內容 — 垂直置中 */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div
          className="relative shadow-2xl overflow-hidden"
          style={{
            width: "100%",
            maxWidth: CANVAS_WIDTH,
            aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
            ...bgStyle,
            ...animationStyle,
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
                goToSlide(i);
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

        {/* 過渡效果指示 */}
        {transitionType !== "none" && (
          <span className="text-xs text-zinc-600 hidden sm:inline">
            {transitionType}
          </span>
        )}

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
