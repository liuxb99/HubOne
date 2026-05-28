"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { usePPTStore } from "@/lib/ppt/store";
import type { TextElement, ShapeElement, SlideElement } from "@/lib/ppt/types";
import Button from "@/components/ui/Button";

// ── 常數 ─────────────────────────────────────────────────────────────────

const FONT_FAMILIES = [
  { value: "Inter", label: "Inter" },
  { value: "Noto Sans TC", label: "Noto Sans TC" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Lora", label: "Lora" },
  { value: "Poppins", label: "Poppins" },
  { value: "Merriweather", label: "Merriweather" },
];

const FONT_SIZES = [
  10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72,
];

// ── 面板區段 ──────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="text-[10px] text-zinc-600 font-medium mb-2 uppercase tracking-wider">
        {title}
      </p>
      {children}
    </div>
  );
}

// ── 主元件 ────────────────────────────────────────────────────────────────

export default function PropertyPanel() {
  const { doc, editor, dispatch, editorDispatch, currentSlide } = usePPTStore();

  // 當前選取的元素
  const selectedElement: SlideElement | null =
    editor.selectedElementIds.length === 1 && currentSlide
      ? (currentSlide.elements.find((el) => el.id === editor.selectedElementIds[0]) ?? null)
      : null;

  const selectedTextEl = selectedElement?.type === "text" ? (selectedElement as TextElement) : null;
  const selectedShapeEl = selectedElement?.type === "shape" ? (selectedElement as ShapeElement) : null;

  // ── 更新元素 ──────────────────────────────────────────────────────────

  const updateElement = useCallback(
    (updates: Partial<SlideElement>) => {
      if (!selectedElement || !currentSlide) return;
      dispatch({
        type: "UPDATE_ELEMENT",
        payload: { slideId: currentSlide.id, elementId: selectedElement.id, updates },
      });
    },
    [selectedElement, currentSlide, dispatch]
  );

  const updateTextElement = useCallback(
    (updates: Partial<TextElement>) => {
      if (!selectedTextEl || !currentSlide) return;
      dispatch({
        type: "UPDATE_ELEMENT",
        payload: { slideId: currentSlide.id, elementId: selectedTextEl.id, updates },
      });
    },
    [selectedTextEl, currentSlide, dispatch]
  );

  // ── 背景設定 ──────────────────────────────────────────────────────────

  const handleBgColor = useCallback(
    (color: string) => {
      if (!currentSlide) return;
      dispatch({
        type: "SET_BACKGROUND",
        payload: { slideId: currentSlide.id, background: { type: "solid", value: color } },
      });
    },
    [currentSlide, dispatch]
  );

  const handleBgGradient = useCallback(
    (gradient: string) => {
      if (!currentSlide) return;
      dispatch({
        type: "SET_BACKGROUND",
        payload: { slideId: currentSlide.id, background: { type: "gradient", value: gradient } },
      });
    },
    [currentSlide, dispatch]
  );

  // ── 刪除元素 ──────────────────────────────────────────────────────────

  const handleDelete = useCallback(() => {
    if (!selectedElement || !currentSlide) return;
    dispatch({
      type: "DELETE_ELEMENT",
      payload: { slideId: currentSlide.id, elementId: selectedElement.id },
    });
    editorDispatch({ type: "DESELECT_ALL" });
  }, [selectedElement, currentSlide, dispatch, editorDispatch]);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <aside className="w-56 lg:w-64 shrink-0 border-l border-[var(--border)] bg-zinc-900/50 flex flex-col">
      {/* 標頭 */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <h3 className="text-xs font-medium text-zinc-500">屬性</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* ── 無選取：投影片背景 ──────────────────────────────────────── */}
        {!selectedElement && currentSlide && (
          <>
            <Section title="投影片背景">
              {/* 當前背景預覽 */}
              <div
                className="w-full h-12 rounded-lg border border-zinc-700 mb-2"
                style={
                  currentSlide.background.type === "gradient"
                    ? { background: currentSlide.background.value }
                    : { backgroundColor: currentSlide.background.value }
                }
              />

              {/* 純色選取 */}
              <div className="flex items-center gap-2 mb-2">
                <label className="relative w-8 h-8 rounded-full overflow-hidden cursor-pointer border border-zinc-600 flex-shrink-0">
                  <input
                    type="color"
                    value={
                      currentSlide.background.type === "solid"
                        ? currentSlide.background.value
                        : "#000000"
                    }
                    onChange={(e) => handleBgColor(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundColor:
                        currentSlide.background.type === "solid"
                          ? currentSlide.background.value
                          : "#000000",
                    }}
                  />
                </label>
                <span className="text-xs text-zinc-400">純色</span>
              </div>

              {/* 常用漸層快速套用 */}
              <p className="text-[10px] text-zinc-600 mb-1.5">快速漸層</p>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: "深邃", value: "linear-gradient(135deg, #1a1a2e, #16213e)" },
                  { label: "商務", value: "linear-gradient(135deg, #1e3a5f, #2d5a87)" },
                  { label: "翡翠", value: "linear-gradient(135deg, #0d5e3a, #2d8a5e)" },
                  { label: "暖陽", value: "linear-gradient(135deg, #d64d00, #f48c2d)" },
                  { label: "粉櫻", value: "linear-gradient(135deg, #c44a6c, #e891b0)" },
                  { label: "科技", value: "linear-gradient(135deg, #6c3cb6, #8e5ad8)" },
                  { label: "深海", value: "linear-gradient(135deg, #003b5c, #007b8a)" },
                  { label: "秋楓", value: "linear-gradient(135deg, #8b2500, #c94b13)" },
                ].map((g) => (
                  <button
                    key={g.label}
                    onClick={() => handleBgGradient(g.value)}
                    className="aspect-square rounded-lg border border-zinc-700 hover:ring-1 hover:ring-white/30 transition-all overflow-hidden"
                    style={{ background: g.value }}
                    title={g.label}
                  />
                ))}
              </div>

              {/* 純色快速選取 */}
              <p className="text-[10px] text-zinc-600 mb-1.5 mt-3">快速純色</p>
              <div className="grid grid-cols-6 gap-1.5">
                {[
                  "#0a0a0a", "#ffffff", "#1e3a5f", "#0d5e3a",
                  "#d64d00", "#c44a6c", "#6c3cb6", "#003b5c",
                  "#8b2500", "#f5f5f0", "#1a1a2e", "#0d0a14",
                ].map((color) => (
                  <button
                    key={color}
                    onClick={() => handleBgColor(color)}
                    className={cn(
                      "aspect-square rounded-lg border transition-all",
                      currentSlide.background.type === "solid" &&
                        currentSlide.background.value === color
                        ? "border-pink-500 ring-1 ring-pink-500/30"
                        : "border-zinc-700 hover:ring-1 hover:ring-white/30"
                    )}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </Section>
          </>
        )}

        {/* ── 選取文字元素 ────────────────────────────────────────────── */}
        {selectedTextEl && (
          <>
            <Section title="文字格式">
              {/* 字型 */}
              <div className="mb-2">
                <label className="text-[10px] text-zinc-600 block mb-1">字型</label>
                <select
                  value={selectedTextEl.fontFamily}
                  onChange={(e) => updateTextElement({ fontFamily: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1.5 text-xs text-zinc-300 outline-none focus:border-pink-500"
                >
                  {FONT_FAMILIES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 字型大小 */}
              <div className="mb-2">
                <label className="text-[10px] text-zinc-600 block mb-1">字型大小</label>
                <select
                  value={selectedTextEl.fontSize}
                  onChange={(e) => updateTextElement({ fontSize: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1.5 text-xs text-zinc-300 outline-none focus:border-pink-500"
                >
                  {FONT_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}px
                    </option>
                  ))}
                </select>
              </div>

              {/* 顏色 */}
              <div className="mb-2">
                <label className="text-[10px] text-zinc-600 block mb-1">顏色</label>
                <div className="flex items-center gap-2">
                  <label className="relative w-8 h-8 rounded-full overflow-hidden cursor-pointer border border-zinc-600 flex-shrink-0">
                    <input
                      type="color"
                      value={selectedTextEl.color}
                      onChange={(e) => updateTextElement({ color: e.target.value })}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div
                      className="w-full h-full"
                      style={{ backgroundColor: selectedTextEl.color }}
                    />
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {selectedTextEl.color}
                  </span>
                </div>
              </div>

              {/* 粗體/斜體/底線 */}
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() =>
                    updateTextElement({
                      fontWeight: selectedTextEl.fontWeight === "bold" ? "normal" : "bold",
                    })
                  }
                  className={cn(
                    "w-8 h-8 rounded text-xs font-bold transition-colors",
                    selectedTextEl.fontWeight === "bold"
                      ? "bg-pink-600/30 text-pink-300"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  )}
                >
                  B
                </button>
                <button
                  onClick={() =>
                    updateTextElement({
                      fontStyle: selectedTextEl.fontStyle === "italic" ? "normal" : "italic",
                    })
                  }
                  className={cn(
                    "w-8 h-8 rounded text-xs italic transition-colors",
                    selectedTextEl.fontStyle === "italic"
                      ? "bg-pink-600/30 text-pink-300"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  )}
                >
                  I
                </button>
                <button
                  onClick={() =>
                    updateTextElement({
                      textDecoration:
                        selectedTextEl.textDecoration === "underline" ? "none" : "underline",
                    })
                  }
                  className={cn(
                    "w-8 h-8 rounded text-xs underline transition-colors",
                    selectedTextEl.textDecoration === "underline"
                      ? "bg-pink-600/30 text-pink-300"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  )}
                >
                  U
                </button>
              </div>

              {/* 對齊 */}
              <div className="mb-2">
                <label className="text-[10px] text-zinc-600 block mb-1">對齊</label>
                <div className="flex gap-1">
                  {[
                    { value: "left" as const, label: "靠左" },
                    { value: "center" as const, label: "置中" },
                    { value: "right" as const, label: "靠右" },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => updateTextElement({ textAlign: value })}
                      className={cn(
                        "flex-1 py-1.5 rounded text-[10px] transition-colors",
                        selectedTextEl.textAlign === value
                          ? "bg-pink-600/30 text-pink-300"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 行高 */}
              <div>
                <label className="text-[10px] text-zinc-600 block mb-1">
                  行高: {selectedTextEl.lineHeight}
                </label>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={selectedTextEl.lineHeight}
                  onChange={(e) => updateTextElement({ lineHeight: Number(e.target.value) })}
                  className="w-full accent-pink-500"
                />
              </div>
            </Section>
          </>
        )}

        {/* ── 選取形狀元素 ────────────────────────────────────────────── */}
        {selectedShapeEl && (
          <>
            <Section title="形狀樣式">
              {/* 填色 */}
              <div className="mb-2">
                <label className="text-[10px] text-zinc-600 block mb-1">填色</label>
                <div className="flex items-center gap-2">
                  <label className="relative w-8 h-8 rounded-full overflow-hidden cursor-pointer border border-zinc-600 flex-shrink-0">
                    <input
                      type="color"
                      value={selectedShapeEl.fillColor}
                      onChange={(e) => updateElement({ fillColor: e.target.value })}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div
                      className="w-full h-full"
                      style={{ backgroundColor: selectedShapeEl.fillColor }}
                    />
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {selectedShapeEl.fillColor}
                  </span>
                </div>
              </div>

              {/* 邊框顏色 */}
              <div className="mb-2">
                <label className="text-[10px] text-zinc-600 block mb-1">邊框顏色</label>
                <div className="flex items-center gap-2">
                  <label className="relative w-8 h-8 rounded-full overflow-hidden cursor-pointer border border-zinc-600 flex-shrink-0">
                    <input
                      type="color"
                      value={selectedShapeEl.strokeColor}
                      onChange={(e) => updateElement({ strokeColor: e.target.value })}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div
                      className="w-full h-full"
                      style={{ backgroundColor: selectedShapeEl.strokeColor }}
                    />
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {selectedShapeEl.strokeColor}
                  </span>
                </div>
              </div>

              {/* 邊框粗細 */}
              <div>
                <label className="text-[10px] text-zinc-600 block mb-1">
                  邊框粗細: {selectedShapeEl.strokeWidth}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={selectedShapeEl.strokeWidth}
                  onChange={(e) => updateElement({ strokeWidth: Number(e.target.value) })}
                  className="w-full accent-pink-500"
                />
              </div>
            </Section>
          </>
        )}

        {/* ── 位置與尺寸（任何選取元素都顯示） ──────────────────────── */}
        {selectedElement && (
          <Section title="位置與尺寸">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="text-[10px] text-zinc-600 block mb-1">X</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.position.x)}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val)) updateElement({ position: { ...selectedElement.position, x: val } });
                  }}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-xs text-zinc-300 outline-none focus:border-pink-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-600 block mb-1">Y</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.position.y)}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val)) updateElement({ position: { ...selectedElement.position, y: val } });
                  }}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-xs text-zinc-300 outline-none focus:border-pink-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-600 block mb-1">W</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.size.width)}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val) && val > 0) updateElement({ size: { ...selectedElement.size, width: val } });
                  }}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-xs text-zinc-300 outline-none focus:border-pink-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-600 block mb-1">H</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.size.height)}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val) && val > 0) updateElement({ size: { ...selectedElement.size, height: val } });
                  }}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-xs text-zinc-300 outline-none focus:border-pink-500"
                />
              </div>
            </div>

            {/* 旋轉 */}
            <div className="mb-2">
              <label className="text-[10px] text-zinc-600 block mb-1">
                旋轉: {Math.round(selectedElement.rotation)}°
              </label>
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={selectedElement.rotation}
                onChange={(e) => updateElement({ rotation: Number(e.target.value) })}
                className="w-full accent-pink-500"
              />
            </div>

            {/* 透明度 */}
            <div>
              <label className="text-[10px] text-zinc-600 block mb-1">
                透明度: {selectedElement.opacity}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={selectedElement.opacity}
                onChange={(e) => updateElement({ opacity: Number(e.target.value) })}
                className="w-full accent-pink-500"
              />
            </div>
          </Section>
        )}

        {/* ── 刪除按鈕 ────────────────────────────────────────────────── */}
        {selectedElement && (
          <div className="pt-2 border-t border-zinc-800">
            <Button
              variant="danger"
              size="sm"
              className="w-full text-xs"
              onClick={handleDelete}
            >
              🗑️ 刪除元件
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
