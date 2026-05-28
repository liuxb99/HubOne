"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { usePPTStore } from "@/lib/ppt/store";
import type { TextElement } from "@/lib/ppt/types";

// ── 縮放控制點 ────────────────────────────────────────────────────────────

const RESIZE_HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;
type ResizeHandle = (typeof RESIZE_HANDLES)[number];

function getHandleCursor(handle: ResizeHandle): string {
  const map: Record<ResizeHandle, string> = {
    nw: "nwse-resize",
    n: "ns-resize",
    ne: "nesw-resize",
    e: "ew-resize",
    se: "nwse-resize",
    s: "ns-resize",
    sw: "nesw-resize",
    w: "ew-resize",
  };
  return map[handle];
}

// ── Props ─────────────────────────────────────────────────────────────────

interface TextViewProps {
  element: TextElement;
  isSelected: boolean;
  slideId: string;
  scale: number;
  onMouseDown: (e: React.MouseEvent, elementId: string) => void;
  onClick: (e: React.MouseEvent, elementId: string) => void;
  onResizeStart: (e: React.MouseEvent, handle: ResizeHandle, elementId: string) => void;
}

// ── 元件 ─────────────────────────────────────────────────────────────────

export default function TextView({
  element,
  isSelected,
  slideId,
  scale,
  onMouseDown,
  onClick,
  onResizeStart,
}: TextViewProps) {
  const { dispatch } = usePPTStore();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(element.content);
  const editorRef = useRef<HTMLDivElement>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const toolbarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 同步外部 content 變化
  useEffect(() => {
    if (!isEditing) {
      setContent(element.content);
    }
  }, [element.content, isEditing]);

  // ── 進入編輯模式 ──────────────────────────────────────────────────────

  const startEditing = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setContent(element.content);
      setIsEditing(true);
      setShowToolbar(true);

      // 清除工具條自動隱藏計時器
      if (toolbarTimeoutRef.current) {
        clearTimeout(toolbarTimeoutRef.current);
      }
    },
    [element.content]
  );

  // ── 退出編輯模式 ──────────────────────────────────────────────────────

  const stopEditing = useCallback(() => {
    setIsEditing(false);

    // 提交內容變更
    const trimmed = content;
    if (trimmed !== element.content) {
      dispatch({
        type: "UPDATE_TEXT",
        payload: { slideId, elementId: element.id, content: trimmed },
      });
    }

    // 延遲隱藏工具條
    toolbarTimeoutRef.current = setTimeout(() => {
      setShowToolbar(false);
    }, 2000);
  }, [content, element.content, element.id, slideId, dispatch]);

  // ── 鍵盤事件 ──────────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setContent(element.content); // 還原
        setIsEditing(false);
        setShowToolbar(false);
      }
    },
    [element.content]
  );

  // ── 自動對焦 ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (isEditing && editorRef.current) {
      editorRef.current.focus();
      // 將游標移到最後
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditing]);

  // ── 文字樣式 ──────────────────────────────────────────────────────────

  const textStyle: React.CSSProperties = {
    fontFamily: element.fontFamily,
    fontSize: element.fontSize,
    fontWeight: element.fontWeight,
    fontStyle: element.fontStyle,
    textDecoration: element.textDecoration as React.CSSProperties["textDecoration"],
    color: element.color,
    textAlign: element.textAlign,
    lineHeight: element.lineHeight,
    margin: 0,
    padding: "4px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    width: "100%",
    height: "100%",
    outline: "none",
    cursor: isEditing ? "text" : isSelected ? "move" : "pointer",
  };

  // ── 格式工具條操作 ────────────────────────────────────────────────────

  const applyFormat = useCallback(
    (command: string, value?: string) => {
      document.execCommand(command, false, value);
      editorRef.current?.focus();
    },
    []
  );

  const handleBold = useCallback(() => {
    applyFormat("bold");
  }, [applyFormat]);

  const handleItalic = useCallback(() => {
    applyFormat("italic");
  }, [applyFormat]);

  const handleUnderline = useCallback(() => {
    applyFormat("underline");
  }, [applyFormat]);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        position: "absolute",
        left: element.position.x,
        top: element.position.y,
        width: element.size.width,
        height: element.size.height,
        opacity: element.opacity / 100,
        transform: `rotate(${element.rotation}deg)`,
      }}
      onMouseDown={(e) => {
        if (!isEditing) onMouseDown(e, element.id);
      }}
      onClick={(e) => {
        if (!isEditing) onClick(e, element.id);
      }}
      onDoubleClick={startEditing}
      className={cn(
        "group",
        isSelected && !isEditing && "ring-2 ring-blue-500"
      )}
    >
      {/* 編輯模式：contentEditable */}
      {isEditing ? (
        <>
          {/* 浮動格式工具條 */}
          {showToolbar && (
            <div
              className="absolute -top-10 left-0 flex items-center gap-0.5 bg-zinc-800 rounded-lg border border-zinc-700 shadow-lg px-1.5 py-1 z-50"
              onMouseEnter={() => {
                if (toolbarTimeoutRef.current) clearTimeout(toolbarTimeoutRef.current);
              }}
              onMouseLeave={() => {
                toolbarTimeoutRef.current = setTimeout(() => setShowToolbar(false), 1000);
              }}
            >
              <button
                onMouseDown={(e) => { e.preventDefault(); handleBold(); }}
                className="w-7 h-7 flex items-center justify-center rounded text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-700"
                title="粗體"
              >
                B
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); handleItalic(); }}
                className="w-7 h-7 flex items-center justify-center rounded text-xs italic text-zinc-300 hover:text-white hover:bg-zinc-700"
                title="斜體"
              >
                I
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); handleUnderline(); }}
                className="w-7 h-7 flex items-center justify-center rounded text-xs underline text-zinc-300 hover:text-white hover:bg-zinc-700"
                title="底線"
              >
                U
              </button>
              <div className="w-px h-4 bg-zinc-700 mx-1" />
              <button
                onMouseDown={(e) => { e.preventDefault(); stopEditing(); }}
                className="w-7 h-7 flex items-center justify-center rounded text-xs text-zinc-400 hover:text-white hover:bg-zinc-700"
                title="完成編輯"
              >
                ✓
              </button>
            </div>
          )}

          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            style={textStyle}
            onInput={(e) => setContent((e.target as HTMLDivElement).innerHTML || "")}
            onBlur={stopEditing}
            onKeyDown={handleKeyDown}
            className="bg-transparent overflow-hidden"
          />
        </>
      ) : (
        /* 顯示模式 */
        <div style={textStyle} className="overflow-hidden pointer-events-none">
          {element.content || <span className="text-white/30">雙擊編輯</span>}
        </div>
      )}

      {/* 縮放控制點（僅在選取且非編輯時顯示） */}
      {isSelected &&
        !isEditing &&
        RESIZE_HANDLES.map((handle) => (
          <div
            key={handle}
            onMouseDown={(e) => onResizeStart(e, handle, element.id)}
            className={cn(
              "absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-sm",
              "hover:bg-blue-100 z-10",
              handle === "nw" && "-top-1.5 -left-1.5",
              handle === "n" && "-top-1.5 left-1/2 -translate-x-1/2",
              handle === "ne" && "-top-1.5 -right-1.5",
              handle === "e" && "top-1/2 -right-1.5 -translate-y-1/2",
              handle === "se" && "-bottom-1.5 -right-1.5",
              handle === "s" && "-bottom-1.5 left-1/2 -translate-x-1/2",
              handle === "sw" && "-bottom-1.5 -left-1.5",
              handle === "w" && "top-1/2 -left-1.5 -translate-y-1/2"
            )}
            style={{ cursor: getHandleCursor(handle) }}
          />
        ))}
    </div>
  );
}
