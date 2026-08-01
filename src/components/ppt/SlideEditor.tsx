"use client";

import { useRef, useState, useCallback, useEffect, type MouseEvent as ReactMouseEvent } from "react";
import { cn } from "@/lib/utils";
import { usePPTStore, CANVAS_WIDTH, CANVAS_HEIGHT, generateId } from "@/lib/ppt/store";
import type { SlideElement, TextElement, ShapeElement, Position } from "@/lib/ppt/types";
import TextView from "./TextView";

// ── 輔助：取得元素的 CSS style ───────────────────────────────────────────

function getElementStyle(el: SlideElement, isSelected: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    position: "absolute",
    left: el.position.x,
    top: el.position.y,
    width: el.size.width,
    height: el.size.height,
    opacity: el.opacity / 100,
    transform: `rotate(${el.rotation}deg)`,
    cursor: isSelected ? "move" : "pointer",
    userSelect: "none",
  };

  if (el.type === "text") {
    const t = el as TextElement;
    return {
      ...base,
      fontFamily: t.fontFamily,
      fontSize: t.fontSize,
      fontWeight: t.fontWeight,
      fontStyle: t.fontStyle,
      textDecoration: t.textDecoration as React.CSSProperties["textDecoration"],
      color: t.color,
      textAlign: t.textAlign,
      lineHeight: t.lineHeight,
      // 讓 contentEditable 可用
      userSelect: isSelected ? "auto" : "none",
      outline: "none",
    };
  }

  if (el.type === "shape") {
    const s = el as ShapeElement;
    return {
      ...base,
      backgroundColor: s.fillColor,
      border: `${s.strokeWidth}px solid ${s.strokeColor}`,
      borderRadius: s.shapeType === "circle" ? "50%" : s.shapeType === "rect" ? "4px" : "0",
      // triangle/diamond 用 clip-path
      clipPath:
        s.shapeType === "triangle"
          ? "polygon(50% 0%, 0% 100%, 100% 100%)"
          : s.shapeType === "diamond"
          ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
          : undefined,
    };
  }

  return base;
}

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

// ── 主元件 ────────────────────────────────────────────────────────────────

interface SlideEditorProps {
  /** 外部傳入的縮放比例（從容器計算） */
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export default function SlideEditor({ containerRef: externalContainerRef }: SlideEditorProps) {
  const { doc, editor, dispatch, editorDispatch, currentSlide, deselectAll } = usePPTStore();
  const internalContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = externalContainerRef ?? internalContainerRef;

  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [dragElementId, setDragElementId] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [resizeStart, setResizeStart] = useState<{ mouse: Position; el: { pos: Position; size: { width: number; height: number } } } | null>(null);

  // 計算縮放比
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScale = () => {
      const { clientWidth, clientHeight } = container;
      const scaleX = (clientWidth - 48) / CANVAS_WIDTH;
      const scaleY = (clientHeight - 48) / CANVAS_HEIGHT;
      setScale(Math.min(scaleX, scaleY, 1.5));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef]);

  // ── 點擊元件選取 ──────────────────────────────────────────────────────

  const handleElementClick = useCallback(
    (e: ReactMouseEvent, elementId: string) => {
      e.stopPropagation();
      editorDispatch({ type: "SELECT_ELEMENT", payload: { elementId, multi: e.ctrlKey || e.metaKey } });
    },
    [editorDispatch]
  );

  // ── 點擊空白取消選取 ──────────────────────────────────────────────────

  const handleCanvasClick = useCallback(() => {
    deselectAll();
  }, [deselectAll]);

  // ── 雙擊空白新增文字 ──────────────────────────────────────────────────

  const handleCanvasDoubleClick = useCallback(
    (e: ReactMouseEvent) => {
      if (!currentSlide) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      const newEl: TextElement = {
        id: generateId(),
        type: "text",
        position: { x: Math.max(0, x - 100), y: Math.max(0, y - 20) },
        size: { width: 200, height: 50 },
        rotation: 0,
        opacity: 100,
        locked: false,
        content: "新文字",
        fontFamily: "Inter",
        fontSize: 20,
        fontWeight: "normal",
        fontStyle: "normal",
        textDecoration: "none",
        color: "#ffffff",
        textAlign: "left",
        lineHeight: 1.5,
      };
      dispatch({ type: "ADD_ELEMENT", payload: { slideId: currentSlide.id, element: newEl } });
      editorDispatch({ type: "SELECT_ELEMENT", payload: { elementId: newEl.id } });
    },
    [currentSlide, scale, dispatch, editorDispatch]
  );

  // ── 拖曳移動 ──────────────────────────────────────────────────────────

  const handleMouseDown = useCallback(
    (e: ReactMouseEvent, elementId: string) => {
      if (e.button !== 0) return;
      const el = currentSlide?.elements.find((el) => el.id === elementId);
      if (!el || el.locked) return;

      e.stopPropagation();
      e.preventDefault();

      // 先選取
      editorDispatch({ type: "SELECT_ELEMENT", payload: { elementId, multi: e.ctrlKey || e.metaKey } });

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const offsetX = (e.clientX - rect.left) / scale;
      const offsetY = (e.clientY - rect.top) / scale;

      setIsDragging(true);
      setDragElementId(elementId);
      setDragOffset({ x: offsetX, y: offsetY });
    },
    [currentSlide, scale, editorDispatch]
  );

  // ── 縮放控制點滑鼠按下 ────────────────────────────────────────────────

  const handleResizeStart = useCallback(
    (e: ReactMouseEvent, handle: ResizeHandle, elementId: string) => {
      e.stopPropagation();
      e.preventDefault();

      const el = currentSlide?.elements.find((el) => el.id === elementId);
      if (!el) return;

      setIsResizing(true);
      setResizeHandle(handle);
      setResizeStart({
        mouse: { x: e.clientX, y: e.clientY },
        el: {
          pos: { ...el.position },
          size: { ...el.size },
        },
      });
    },
    [currentSlide]
  );

  // ── 全域滑鼠事件 ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragElementId && currentSlide) {
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale - dragOffset.x;
        const y = (e.clientY - rect.top) / scale - dragOffset.y;

        dispatch({
          type: "MOVE_ELEMENT",
          payload: {
            slideId: currentSlide.id,
            elementId: dragElementId,
            position: { x: Math.max(0, x), y: Math.max(0, y) },
          },
        });
      }

      if (isResizing && resizeHandle && resizeStart && currentSlide) {
        const el = currentSlide.elements.find((el) => el.id === editor.selectedElementIds[0]);
        if (!el) return;

        const dx = (e.clientX - resizeStart.mouse.x) / scale;
        const dy = (e.clientY - resizeStart.mouse.y) / scale;

        let newX = resizeStart.el.pos.x;
        let newY = resizeStart.el.pos.y;
        let newW = resizeStart.el.size.width;
        let newH = resizeStart.el.size.height;

        const handle = resizeHandle;

        // 根據控制點計算新位置與大小
        if (handle.includes("e")) newW = Math.max(20, resizeStart.el.size.width + dx);
        if (handle.includes("w")) {
          newW = Math.max(20, resizeStart.el.size.width - dx);
          newX = resizeStart.el.pos.x + (resizeStart.el.size.width - newW);
        }
        if (handle.includes("s")) newH = Math.max(20, resizeStart.el.size.height + dy);
        if (handle.includes("n")) {
          newH = Math.max(20, resizeStart.el.size.height - dy);
          newY = resizeStart.el.pos.y + (resizeStart.el.size.height - newH);
        }

        dispatch({
          type: "UPDATE_ELEMENT",
          payload: {
            slideId: currentSlide.id,
            elementId: el.id,
            updates: {
              position: { x: newX, y: newY },
              size: { width: newW, height: newH },
            },
          },
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragElementId(null);
      setIsResizing(false);
      setResizeHandle(null);
      setResizeStart(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, dragElementId, dragOffset, resizeHandle, resizeStart, currentSlide, dispatch, editor.selectedElementIds, scale, containerRef]);

  // ── Render ─────────────────────────────────────────────────────────────

  if (!currentSlide) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950">
        <p className="text-zinc-600 text-sm">請新增投影片</p>
      </div>
    );
  }

  const bgStyle =
    currentSlide.background.type === "gradient"
      ? { background: currentSlide.background.value }
      : { backgroundColor: currentSlide.background.value };

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-zinc-950 overflow-hidden"
      onClick={handleCanvasClick}
    >
      {/* 投影片畫布 */}
      <div
        className={cn(
          "relative shadow-2xl rounded-xl overflow-hidden",
          "transition-transform duration-200"
        )}
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          ...bgStyle,
        }}
        onDoubleClick={handleCanvasDoubleClick}
      >
        {/* 渲染所有元件 */}
        {currentSlide.elements.map((el) => {
          const isSelected = editor.selectedElementIds.includes(el.id);
          return (
            <div key={el.id}>
              {/* 文字元件 */}
              {el.type === "text" && (
                <TextView
                  element={el as TextElement}
                  isSelected={isSelected}
                  slideId={currentSlide.id}
                  scale={scale}
                  onMouseDown={handleMouseDown}
                  onClick={handleElementClick}
                  onResizeStart={handleResizeStart}
                />
              )}

              {/* 形狀元件 */}
              {el.type === "shape" && (
                <div
                  style={getElementStyle(el, isSelected)}
                  onMouseDown={(e) => handleMouseDown(e, el.id)}
                  onClick={(e) => handleElementClick(e, el.id)}
                  className={cn(
                    "group",
                    isSelected && "ring-2 ring-blue-500"
                  )}
                >
                  {/* 縮放控制點 */}
                  {isSelected &&
                    RESIZE_HANDLES.map((handle) => (
                      <div
                        key={handle}
                        onMouseDown={(e) => handleResizeStart(e, handle, el.id)}
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
              )}

              {/* 圖片元件（預留） */}
              {el.type === "image" && (
                <div
                  style={getElementStyle(el, isSelected)}
                  onMouseDown={(e) => handleMouseDown(e, el.id)}
                  onClick={(e) => handleElementClick(e, el.id)}
                  className={cn(
                    "overflow-hidden",
                    isSelected && "ring-2 ring-blue-500"
                  )}
                >
                  <img
                    src={(el as import("@/lib/ppt/types").ImageElement).src}
                    alt={(el as import("@/lib/ppt/types").ImageElement).alt}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: (el as import("@/lib/ppt/types").ImageElement).fit as React.CSSProperties["objectFit"],
                    }}
                    draggable={false}
                  />
                  {/* 縮放控制點 */}
                  {isSelected &&
                    RESIZE_HANDLES.map((handle) => (
                      <div
                        key={handle}
                        onMouseDown={(e) => handleResizeStart(e, handle, el.id)}
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
