"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { usePPTStore, generateId } from "@/lib/ppt/store";
import type { TextElement, ShapeElement } from "@/lib/ppt/types";
import Button from "@/components/ui/Button";

// ── 常數 ─────────────────────────────────────────────────────────────────

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72];
const FONT_FAMILIES = [
  { label: "Inter", value: "Inter" },
  { label: "Noto Sans TC", value: "Noto Sans TC" },
  { label: "Playfair Display", value: "Playfair Display" },
  { label: "Lora", value: "Lora" },
  { label: "Poppins", value: "Poppins" },
  { label: "Merriweather", value: "Merriweather" },
];

// ── Props ─────────────────────────────────────────────────────────────────

interface ToolbarProps {
  onOpenTemplates: () => void;
  onStartPresent: () => void;
  onExport: () => void;
}

// ── 元件 ─────────────────────────────────────────────────────────────────

export default function Toolbar({ onOpenTemplates, onStartPresent, onExport }: ToolbarProps) {
  const { doc, editor, dispatch, editorDispatch, currentSlide } = usePPTStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(doc.title);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [fontSizeOpen, setFontSizeOpen] = useState(false);
  const [fontFamilyOpen, setFontFamilyOpen] = useState(false);
  const fontSizeRef = useRef<HTMLDivElement>(null);
  const fontFamilyRef = useRef<HTMLDivElement>(null);

  // 同步 titleDraft
  useEffect(() => {
    setTitleDraft(doc.title);
  }, [doc.title]);

  // 編輯標題
  const startTitleEdit = useCallback(() => {
    setTitleDraft(doc.title);
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current?.select(), 50);
  }, [doc.title]);

  const commitTitle = useCallback(() => {
    setIsEditingTitle(false);
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== doc.title) {
      dispatch({ type: "SET_TITLE", payload: trimmed });
    } else {
      setTitleDraft(doc.title);
    }
  }, [titleDraft, doc.title, dispatch]);

  // 取得第一個被選取的文字元素（用於格式工具列）
  const selectedTextEl =
    editor.selectedElementIds.length === 1 && currentSlide
      ? (currentSlide.elements.find(
          (el) => el.id === editor.selectedElementIds[0] && el.type === "text"
        ) as TextElement | undefined)
      : undefined;

  // ── 格式操作 ──────────────────────────────────────────────────────────

  const updateSelectedTextElement = useCallback(
    (updates: Partial<TextElement>) => {
      if (!editor.selectedElementIds.length || !currentSlide) return;
      const elementId = editor.selectedElementIds[0];
      dispatch({ type: "UPDATE_ELEMENT", payload: { slideId: currentSlide.id, elementId, updates } });
    },
    [editor.selectedElementIds, currentSlide, dispatch]
  );

  const handleBold = useCallback(() => {
    if (!selectedTextEl) return;
    updateSelectedTextElement({
      fontWeight: selectedTextEl.fontWeight === "bold" ? "normal" : "bold",
    });
  }, [selectedTextEl, updateSelectedTextElement]);

  const handleItalic = useCallback(() => {
    if (!selectedTextEl) return;
    updateSelectedTextElement({
      fontStyle: selectedTextEl.fontStyle === "italic" ? "normal" : "italic",
    });
  }, [selectedTextEl, updateSelectedTextElement]);

  const handleUnderline = useCallback(() => {
    if (!selectedTextEl) return;
    updateSelectedTextElement({
      textDecoration: selectedTextEl.textDecoration === "underline" ? "none" : "underline",
    });
  }, [selectedTextEl, updateSelectedTextElement]);

  const handleFontSize = useCallback(
    (size: number) => {
      if (!selectedTextEl) return;
      updateSelectedTextElement({ fontSize: size });
      setFontSizeOpen(false);
    },
    [selectedTextEl, updateSelectedTextElement]
  );

  const handleFontFamily = useCallback(
    (family: string) => {
      if (!selectedTextEl) return;
      updateSelectedTextElement({ fontFamily: family });
      setFontFamilyOpen(false);
    },
    [selectedTextEl, updateSelectedTextElement]
  );

  const handleTextAlign = useCallback(
    (align: "left" | "center" | "right") => {
      if (!selectedTextEl) return;
      updateSelectedTextElement({ textAlign: align });
    },
    [selectedTextEl, updateSelectedTextElement]
  );

  // ── 新增元件 ──────────────────────────────────────────────────────────

  const addTextElement = useCallback(() => {
    if (!currentSlide) return;
    const newEl: TextElement = {
      id: generateId(),
      type: "text",
      position: { x: 50, y: 50 },
      size: { width: 300, height: 60 },
      rotation: 0,
      opacity: 100,
      locked: false,
      content: "雙擊編輯文字",
      fontFamily: "Inter",
      fontSize: 24,
      fontWeight: "normal",
      fontStyle: "normal",
      textDecoration: "none",
      color: "#ffffff",
      textAlign: "center",
      lineHeight: 1.5,
    };
    dispatch({ type: "ADD_ELEMENT", payload: { slideId: currentSlide.id, element: newEl } });
    editorDispatch({ type: "SELECT_ELEMENT", payload: { elementId: newEl.id } });
  }, [currentSlide, dispatch, editorDispatch]);

  const addShapeElement = useCallback(() => {
    if (!currentSlide) return;
    const newEl: ShapeElement = {
      id: generateId(),
      type: "shape",
      position: { x: 50, y: 50 },
      size: { width: 120, height: 80 },
      rotation: 0,
      opacity: 100,
      locked: false,
      shapeType: "rect",
      fillColor: "#6366F1",
      strokeColor: "#4F46E5",
      strokeWidth: 2,
    };
    dispatch({ type: "ADD_ELEMENT", payload: { slideId: currentSlide.id, element: newEl } });
    editorDispatch({ type: "SELECT_ELEMENT", payload: { elementId: newEl.id } });
  }, [currentSlide, dispatch, editorDispatch]);

  // ── 關閉下拉選單 ──────────────────────────────────────────────────────

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fontSizeRef.current && !fontSizeRef.current.contains(e.target as Node)) {
        setFontSizeOpen(false);
      }
      if (fontFamilyRef.current && !fontFamilyRef.current.contains(e.target as Node)) {
        setFontFamilyOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── 儲存指示 ──────────────────────────────────────────────────────────

  const [saved, setSaved] = useState(true);
  useEffect(() => {
    setSaved(false);
    const timer = setTimeout(() => setSaved(true), 1500);
    return () => clearTimeout(timer);
  }, [doc.updatedAt]);

  return (
    <header className="h-12 border-b border-[var(--border)] bg-zinc-900/90 flex items-center px-2 sm:px-4 gap-1 sm:gap-2 shrink-0 overflow-x-auto">
      {/* ── 左：簡報標題 ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mr-2 shrink-0">
        <span className="text-lg">📽️</span>
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitTitle();
              if (e.key === "Escape") {
                setTitleDraft(doc.title);
                setIsEditingTitle(false);
              }
            }}
            className="bg-zinc-800 text-white text-sm px-2 py-0.5 rounded border border-zinc-600 outline-none focus:border-pink-500 w-28 sm:w-40"
            autoFocus
          />
        ) : (
          <button
            onClick={startTitleEdit}
            className="text-sm text-white font-medium truncate max-w-[120px] sm:max-w-[200px] hover:text-pink-300 transition-colors"
            title="點擊編輯標題"
          >
            {doc.title}
          </button>
        )}
      </div>

      <div className="h-5 w-px bg-zinc-700 shrink-0" />

      {/* ── 中：新增元件 ────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 shrink-0">
        <Button variant="ghost" size="sm" onClick={addTextElement} className="text-xs !px-2" title="新增文字框">
          <span className="text-base">➕</span>
          <span className="hidden sm:inline ml-1">文字</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={addShapeElement} className="text-xs !px-2" title="新增形狀">
          <span className="text-base">🔲</span>
          <span className="hidden sm:inline ml-1">形狀</span>
        </Button>
      </div>

      <div className="h-5 w-px bg-zinc-700 shrink-0" />

      {/* ── 文字格式 ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 shrink-0">
        {/* 粗體 */}
        <button
          onClick={handleBold}
          disabled={!selectedTextEl}
          className={cn(
            "w-8 h-8 flex items-center justify-center rounded text-sm font-bold transition-colors",
            selectedTextEl?.fontWeight === "bold"
              ? "bg-pink-600/30 text-pink-300"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800",
            !selectedTextEl && "opacity-30 cursor-not-allowed"
          )}
          title="粗體"
        >
          B
        </button>
        {/* 斜體 */}
        <button
          onClick={handleItalic}
          disabled={!selectedTextEl}
          className={cn(
            "w-8 h-8 flex items-center justify-center rounded text-sm italic transition-colors",
            selectedTextEl?.fontStyle === "italic"
              ? "bg-pink-600/30 text-pink-300"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800",
            !selectedTextEl && "opacity-30 cursor-not-allowed"
          )}
          title="斜體"
        >
          I
        </button>
        {/* 底線 */}
        <button
          onClick={handleUnderline}
          disabled={!selectedTextEl}
          className={cn(
            "w-8 h-8 flex items-center justify-center rounded text-sm underline transition-colors",
            selectedTextEl?.textDecoration === "underline"
              ? "bg-pink-600/30 text-pink-300"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800",
            !selectedTextEl && "opacity-30 cursor-not-allowed"
          )}
          title="底線"
        >
          U
        </button>
      </div>

      <div className="h-5 w-px bg-zinc-700 shrink-0" />

      {/* ── 字型家族 ─────────────────────────────────────────────────── */}
      <div ref={fontFamilyRef} className="relative shrink-0">
        <button
          onClick={() => setFontFamilyOpen(!fontFamilyOpen)}
          disabled={!selectedTextEl}
          className={cn(
            "h-8 px-2 text-xs text-zinc-400 rounded hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-1",
            !selectedTextEl && "opacity-30 cursor-not-allowed"
          )}
          title="字型"
        >
          <span className="truncate max-w-[60px] sm:max-w-[80px]">
            {selectedTextEl?.fontFamily ?? "字型"}
          </span>
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        {fontFamilyOpen && (
          <div className="absolute top-full left-0 mt-1 w-40 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
            {FONT_FAMILIES.map((f) => (
              <button
                key={f.value}
                onClick={() => handleFontFamily(f.value)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm transition-colors",
                  selectedTextEl?.fontFamily === f.value
                    ? "text-pink-300 bg-pink-600/20"
                    : "text-zinc-300 hover:bg-zinc-700"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── 字型大小 ─────────────────────────────────────────────────── */}
      <div ref={fontSizeRef} className="relative shrink-0">
        <button
          onClick={() => setFontSizeOpen(!fontSizeOpen)}
          disabled={!selectedTextEl}
          className={cn(
            "h-8 px-2 text-xs text-zinc-400 rounded hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-1",
            !selectedTextEl && "opacity-30 cursor-not-allowed"
          )}
          title="字型大小"
        >
          {selectedTextEl?.fontSize ?? 16}
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        {fontSizeOpen && (
          <div className="absolute top-full left-0 mt-1 w-20 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
            {FONT_SIZES.map((s) => (
              <button
                key={s}
                onClick={() => handleFontSize(s)}
                className={cn(
                  "w-full text-center px-2 py-1.5 text-sm transition-colors",
                  selectedTextEl?.fontSize === s
                    ? "text-pink-300 bg-pink-600/20"
                    : "text-zinc-300 hover:bg-zinc-700"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── 文字顏色 ─────────────────────────────────────────────────── */}
      {selectedTextEl && (
        <div className="shrink-0">
          <label className="relative block w-8 h-8 cursor-pointer" title="文字顏色">
            <input
              type="color"
              value={selectedTextEl.color}
              onChange={(e) => updateSelectedTextElement({ color: e.target.value })}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div
              className="w-6 h-6 rounded-full border-2 border-zinc-600 mt-1 mx-auto"
              style={{ backgroundColor: selectedTextEl.color }}
            />
          </label>
        </div>
      )}

      <div className="h-5 w-px bg-zinc-700 shrink-0" />

      {/* ── 對齊 ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 shrink-0">
        {[
          { align: "left" as const, icon: "⬅️", label: "靠左" },
          { align: "center" as const, icon: "⬇️", label: "置中" },
          { align: "right" as const, icon: "➡️", label: "靠右" },
        ].map(({ align, icon, label }) => (
          <button
            key={align}
            onClick={() => handleTextAlign(align)}
            disabled={!selectedTextEl}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded text-xs transition-colors",
              selectedTextEl?.textAlign === align
                ? "bg-pink-600/30"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800",
              !selectedTextEl && "opacity-30 cursor-not-allowed"
            )}
            title={label}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* ── spacer ──────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-4" />

      {/* ── 右：操作按鈕 ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="sm" onClick={onOpenTemplates} className="text-xs !px-2" title="模板">
          <span>🎨</span>
          <span className="hidden sm:inline ml-1">模板</span>
        </Button>

        <Button variant="ghost" size="sm" onClick={onStartPresent} className="text-xs !px-2" title="放映">
          <span>🎬</span>
          <span className="hidden sm:inline ml-1">放映</span>
        </Button>

        <Button variant="ghost" size="sm" onClick={onExport} className="text-xs !px-2" title="匯出">
          <span>📤</span>
          <span className="hidden sm:inline ml-1">匯出</span>
        </Button>

        {/* 儲存狀態 */}
        <div className="flex items-center gap-1 ml-1" title={saved ? "已儲存" : "儲存中…"}>
          <span
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              saved ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
            )}
          />
          <span className="text-[10px] text-zinc-500 hidden sm:inline">
            {saved ? "已儲存" : "儲存中"}
          </span>
        </div>
      </div>
    </header>
  );
}
