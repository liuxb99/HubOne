"use client";

import { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { usePPTStore } from "@/lib/ppt/store";
import type { Slide } from "@/lib/ppt/types";

// ── 縮圖預覽元件 ─────────────────────────────────────────────────────────

function SlideThumbnail({ slide, isActive, index, onSelect, onDelete, onDuplicate, onDragStart, onDragOver, onDrop }: {
  slide: Slide;
  isActive: boolean;
  index: number;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const [hover, setHover] = useState(false);

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
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onSelect}
      className={cn(
        "group relative rounded-lg border-2 cursor-pointer transition-all duration-150",
        isActive
          ? "border-orange-500 ring-1 ring-orange-500/30"
          : "border-zinc-800 hover:border-zinc-600"
      )}
    >
      {/* 縮圖內容器 — 等比例縮小 */}
      <div
        className="w-full aspect-video rounded-[5px] overflow-hidden flex items-center justify-center relative"
        style={{
          ...bgStyle,
        }}
      >
        {/* 簡化元素預覽：只顯示輪廓 */}
        {slide.elements.length === 0 && (
          <span className="text-[8px] text-white/30">空白</span>
        )}
        {slide.elements.length > 0 && (
          <span className="text-[8px] text-white/50 absolute bottom-1 right-1">
            {slide.elements.length} 元件
          </span>
        )}
      </div>

      {/* 頁碼 */}
      <p className="text-[10px] text-zinc-500 text-center py-1">第 {index + 1} 頁</p>

      {/* Hover 操作按鈕 */}
      {hover && (
        <div className="absolute -top-2 -right-2 flex gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            className="w-5 h-5 flex items-center justify-center rounded-full bg-zinc-700 text-white text-[10px] hover:bg-zinc-600 shadow-lg transition-colors"
            title="複製"
          >
            📋
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="w-5 h-5 flex items-center justify-center rounded-full bg-red-700 text-white text-[10px] hover:bg-red-600 shadow-lg transition-colors"
            title="刪除"
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  );
}

// ── 主元件 ────────────────────────────────────────────────────────────────

export default function SlideList() {
  const { doc, editor, dispatch, editorDispatch } = usePPTStore();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  const handleSelect = useCallback(
    (slideId: string) => {
      editorDispatch({ type: "SET_CURRENT_SLIDE", payload: slideId });
    },
    [editorDispatch]
  );

  const handleAddSlide = useCallback(() => {
    dispatch({ type: "ADD_SLIDE" });
    // 自動選取由 useEffect 處理
  }, [dispatch]);

  const handleDeleteSlide = useCallback(
    (slideId: string) => {
      if (doc.slides.length <= 1) return;
      dispatch({ type: "DELETE_SLIDE", payload: { slideId } });
      // 若刪除的是當前頁，跳到前一頁或後一頁
      if (editor.currentSlideId === slideId) {
        const idx = doc.slides.findIndex((s) => s.id === slideId);
        const targetIdx = idx > 0 ? idx - 1 : 0;
        const targetSlide = doc.slides[targetIdx];
        if (targetSlide) {
          editorDispatch({ type: "SET_CURRENT_SLIDE", payload: targetSlide.id });
        }
      }
    },
    [doc.slides, editor.currentSlideId, dispatch, editorDispatch]
  );

  const handleDuplicateSlide = useCallback(
    (slideId: string) => {
      dispatch({ type: "DUPLICATE_SLIDE", payload: { slideId } });
    },
    [dispatch]
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
      dragOverIndex.current = index;
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
      if (isNaN(fromIndex) || fromIndex === dropIndex) return;

      const newSlides = [...doc.slides];
      const [moved] = newSlides.splice(fromIndex, 1);
      newSlides.splice(dropIndex, 0, moved);

      dispatch({ type: "REORDER_SLIDES", payload: { slideIds: newSlides.map((s) => s.id) } });
      setDragIndex(null);
      dragOverIndex.current = null;
    },
    [doc.slides, dispatch]
  );

  return (
    <aside className="w-48 lg:w-56 shrink-0 border-r border-[var(--border)] bg-zinc-900/50 flex flex-col">
      {/* 標頭 */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-zinc-800">
        <span className="text-xs font-medium text-zinc-500">投影片</span>
        <span className="text-[10px] text-zinc-600">{doc.slides.length} 頁</span>
      </div>

      {/* 縮圖列表 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {doc.slides.map((slide, index) => (
          <SlideThumbnail
            key={slide.id}
            slide={slide}
            index={index}
            isActive={editor.currentSlideId === slide.id}
            onSelect={() => handleSelect(slide.id)}
            onDelete={() => handleDeleteSlide(slide.id)}
            onDuplicate={() => handleDuplicateSlide(slide.id)}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
          />
        ))}

        {/* 空狀態 */}
        {doc.slides.length === 0 && (
          <div className="text-center py-8 text-zinc-600 text-xs">
            尚無投影片
          </div>
        )}
      </div>

      {/* 新增按鈕 */}
      <div className="p-3 border-t border-zinc-800">
        <button
          onClick={handleAddSlide}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-zinc-700 text-xs text-zinc-400 hover:text-white hover:border-zinc-500 hover:bg-zinc-800/50 transition-all"
        >
          <span>+</span>
          <span>新增投影片</span>
        </button>
      </div>
    </aside>
  );
}
