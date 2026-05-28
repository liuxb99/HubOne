"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { usePPTStore } from "@/lib/ppt/store";
import type { Slide, TextElement, SlideElement } from "@/lib/ppt/types";

// ── 輔助：提取投影片文字摘要 ─────────────────────────────────────────────

function getSlideTextSummary(slide: Slide): string {
  const textEls = slide.elements.filter(
    (el): el is TextElement => el.type === "text"
  );
  return textEls.map((el) => el.content).join(" · ").slice(0, 100);
}

function getSlideTitle(slide: Slide): string | null {
  const textEls = slide.elements.filter(
    (el): el is TextElement => el.type === "text"
  );
  // 第一個粗體文字當作標題
  const bold = textEls.find((el) => el.fontWeight === "bold");
  if (bold) return bold.content.slice(0, 60);
  // 否則取第一個文字元素
  if (textEls.length > 0) return textEls[0].content.slice(0, 60);
  return null;
}

function getNonTextSummaries(slide: Slide): string[] {
  return slide.elements
    .filter((el) => el.type !== "text")
    .map((el) => {
      switch (el.type) {
        case "image":
          return "🖼️ 圖片";
        case "shape":
          return `🔲 ${(el as any).shapeType ?? "形狀"}`;
        default:
          return "📦 元件";
      }
    });
}

function getTransitionLabel(transition?: string): string {
  const map: Record<string, string> = {
    fade: "淡入淡出",
    "slide-left": "向左滑入",
    "slide-right": "向右滑入",
    "slide-up": "向上滑入",
    "slide-down": "向下滑入",
    zoom: "縮放",
    flip: "翻轉",
  };
  return transition && map[transition] ? map[transition] : "無";
}

// ── 投影片大綱卡片 ───────────────────────────────────────────────────────

function SlideOutlineCard({
  slide,
  index,
  isActive,
  onSelect,
  onDragStart,
  onDragOver,
  onDrop,
  isDragOver,
}: {
  slide: Slide;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  isDragOver: boolean;
}) {
  const title = getSlideTitle(slide);
  const summary = getSlideTextSummary(slide);
  const nonTexts = getNonTextSummaries(slide);
  const transition = slide.transition;
  const bgStyle =
    slide.background.type === "gradient"
      ? { background: slide.background.value }
      : { backgroundColor: slide.background.value };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onSelect}
      className={cn(
        "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-150",
        isActive
          ? "border-pink-500 bg-pink-500/10 ring-1 ring-pink-500/30"
          : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-900",
        isDragOver && "border-pink-500/50 bg-pink-500/5"
      )}
    >
      {/* 頁碼 */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-400">
        {index + 1}
      </div>

      {/* 內容 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {title ? (
            <span className="text-sm font-semibold text-white truncate">
              {title}
            </span>
          ) : (
            <span className="text-sm text-zinc-500 italic">空白投影片</span>
          )}
          {/* 背景色小標示 */}
          <div
            className="w-4 h-4 rounded border border-zinc-700 flex-shrink-0"
            style={bgStyle}
            title="背景色"
          />
        </div>

        {/* 文字摘要 */}
        {summary ? (
          <p className="text-xs text-zinc-400 line-clamp-2 mb-1">{summary}</p>
        ) : (
          <p className="text-xs text-zinc-600 italic mb-1">無文字內容</p>
        )}

        {/* 非文字元素標示 */}
        {nonTexts.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-1">
            {nonTexts.map((label, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-500"
              >
                {label}
              </span>
            ))}
          </div>
        )}

        {/* 過渡動畫 */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-600">過渡：</span>
          <span className="text-[10px] text-zinc-400">
            {getTransitionLabel(transition)}
          </span>
          {slide.transitionDuration && (
            <span className="text-[10px] text-zinc-600">
              ({slide.transitionDuration}ms)
            </span>
          )}
        </div>
      </div>

      {/* 拖拽把手 */}
      <div className="flex-shrink-0 self-center text-zinc-600 cursor-grab active:cursor-grabbing">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M8 6h.01M16 6h.01M8 12h.01M16 12h.01M8 18h.01M16 18h.01" />
        </svg>
      </div>
    </div>
  );
}

// ── 主元件 ────────────────────────────────────────────────────────────────

interface SlideOutlineViewProps {
  onClose: () => void;
}

export default function SlideOutlineView({ onClose }: SlideOutlineViewProps) {
  const { doc, editor, dispatch, editorDispatch } = usePPTStore();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleSelect = useCallback(
    (slideId: string) => {
      editorDispatch({ type: "SET_CURRENT_SLIDE", payload: slideId });
      onClose(); // 回到編輯模式並選中該頁
    },
    [editorDispatch, onClose]
  );

  // Drag & Drop
  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      setDragIndex(index);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(index));
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverIndex(index);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
      if (isNaN(fromIndex) || fromIndex === dropIndex) {
        setDragIndex(null);
        setDragOverIndex(null);
        return;
      }

      const newSlides = [...doc.slides];
      const [moved] = newSlides.splice(fromIndex, 1);
      newSlides.splice(dropIndex, 0, moved);

      dispatch({
        type: "REORDER_SLIDES",
        payload: { slideIds: newSlides.map((s) => s.id) },
      });
      setDragIndex(null);
      setDragOverIndex(null);
    },
    [doc.slides, dispatch]
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 頂部欄 */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-zinc-800 bg-zinc-950">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>📄</span>
          <span>投影片大綱</span>
          <span className="text-sm font-normal text-zinc-500">
            （{doc.slides.length} 頁）
          </span>
        </h2>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <span>✕</span>
          <span>返回編輯</span>
        </button>
      </div>

      {/* 可滾動列表 */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
        {doc.slides.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-600">尚無投影片</p>
          </div>
        ) : (
          doc.slides.map((slide, index) => (
            <SlideOutlineCard
              key={slide.id}
              slide={slide}
              index={index}
              isActive={editor.currentSlideId === slide.id}
              isDragOver={dragOverIndex === index && dragIndex !== index}
              onSelect={() => handleSelect(slide.id)}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
            />
          ))
        )}
      </div>

      {/* 底部提示 */}
      <div className="px-4 sm:px-6 py-2 border-t border-zinc-800 bg-zinc-950/50">
        <p className="text-[10px] text-zinc-600">
          💡 拖曳卡片可重新排序投影片 · 點擊卡片切換到該頁
        </p>
      </div>
    </div>
  );
}
