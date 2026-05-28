"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import { usePPTStore } from "@/lib/ppt/store";
import { TEMPLATES, getDefaultTemplate } from "@/lib/ppt/template";
import type { Template } from "@/lib/ppt/types";

// ── 模板卡片 ──────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  isActive,
  onClick,
}: {
  template: Template;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative rounded-xl border-2 overflow-hidden transition-all duration-200",
        "hover:scale-[1.03] hover:shadow-xl hover:z-10",
        isActive
          ? "border-pink-500 ring-2 ring-pink-500/30"
          : "border-zinc-700 hover:border-zinc-500"
      )}
    >
      {/* 配色預覽 */}
      <div className="p-4 space-y-2">
        {/* 主色條 */}
        <div className="w-full h-8 rounded-lg flex overflow-hidden">
          <div className="flex-1" style={{ backgroundColor: template.colors.primary }} />
          <div className="flex-1" style={{ backgroundColor: template.colors.secondary }} />
          <div className="flex-1" style={{ backgroundColor: template.colors.accent }} />
        </div>
        {/* 文字色 + 背景色 */}
        <div className="flex gap-2">
          <div
            className="flex-1 h-6 rounded text-[8px] flex items-center justify-center font-medium"
            style={{
              backgroundColor: template.colors.background,
              color: template.colors.text,
            }}
          >
            Aa
          </div>
          <div
            className="flex-1 h-6 rounded text-[8px] flex items-center justify-center border border-zinc-600"
            style={{
              backgroundColor: template.colors.text,
              color: template.colors.background,
            }}
          >
            Aa
          </div>
        </div>
      </div>

      {/* 名稱 */}
      <div className="px-4 pb-3">
        <p className="text-sm font-medium text-white text-left">{template.name}</p>
        <p className="text-[10px] text-zinc-500 text-left mt-0.5 line-clamp-1">
          {template.description}
        </p>
      </div>

      {/* 使用中標記 */}
      {isActive && (
        <div className="absolute top-2 right-2 bg-pink-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
          使用中
        </div>
      )}
    </button>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────

interface TemplatePickerProps {
  open: boolean;
  onClose: () => void;
}

// ── 主元件 ────────────────────────────────────────────────────────────────

export default function TemplatePicker({ open, onClose }: TemplatePickerProps) {
  const { doc, dispatch } = usePPTStore();
  const [selectedId, setSelectedId] = useState(doc.templateId);

  // 更新選取
  const handleSelect = useCallback(
    (templateId: string) => {
      setSelectedId(templateId);
    },
    []
  );

  // 套用模板
  const handleApply = useCallback(() => {
    const template = TEMPLATES.find((t) => t.id === selectedId) ?? getDefaultTemplate();
    dispatch({
      type: "APPLY_TEMPLATE",
      payload: { templateId: selectedId, template },
    });
    onClose();
  }, [selectedId, dispatch, onClose]);

  // 雙擊快速套用
  const handleDoubleClick = useCallback(
    (templateId: string) => {
      const template = TEMPLATES.find((t) => t.id === templateId) ?? getDefaultTemplate();
      dispatch({
        type: "APPLY_TEMPLATE",
        payload: { templateId, template },
      });
      onClose();
    },
    [dispatch, onClose]
  );

  return (
    <Modal open={open} onClose={onClose} title="🎨 選擇模板" size="xl">
      <div className="space-y-4">
        <p className="text-sm text-zinc-400">
          選擇配色模板，將套用至所有投影片。當前文字顏色也將自動調整。
        </p>

        {/* 模板網格 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto p-1">
          {TEMPLATES.map((template) => (
            <div
              key={template.id}
              onClick={() => handleSelect(template.id)}
              onDoubleClick={() => handleDoubleClick(template.id)}
            >
              <TemplateCard
                template={template}
                isActive={selectedId === template.id}
                onClick={() => handleSelect(template.id)}
              />
            </div>
          ))}
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleApply}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-medium transition-all",
              "bg-pink-600 text-white hover:bg-pink-500",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
            )}
          >
            套用模板
          </button>
        </div>
      </div>
    </Modal>
  );
}
