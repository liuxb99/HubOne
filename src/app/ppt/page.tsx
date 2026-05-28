"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { PPTProvider, usePPTStore } from "@/lib/ppt/store";
import { exportToHTML } from "@/lib/ppt/export";
import SubNav from "@/components/layout/SubNav";

// ── 動態導入（避免 SSR 問題） ────────────────────────────────────────────

const Toolbar = dynamic(() => import("@/components/ppt/Toolbar"), { ssr: false });
const SlideList = dynamic(() => import("@/components/ppt/SlideList"), { ssr: false });
const SlideEditor = dynamic(() => import("@/components/ppt/SlideEditor"), { ssr: false });
const PropertyPanel = dynamic(() => import("@/components/ppt/PropertyPanel"), { ssr: false });
const TemplatePicker = dynamic(() => import("@/components/ppt/TemplatePicker"), { ssr: false });
const SlidePreview = dynamic(() => import("@/components/ppt/SlidePreview"), { ssr: false });

// ── 次導航標籤 ────────────────────────────────────────────────────────────

const tabs = [
  { id: "editor", label: "編輯", icon: "✏️", href: "/ppt" },
  { id: "templates", label: "模板", icon: "🎨", href: "/ppt/templates" },
  { id: "slides", label: "投影片", icon: "📄", href: "/ppt/slides" },
  { id: "export", label: "匯出", icon: "📤", href: "/ppt/export" },
  { id: "settings", label: "設定", icon: "⚙️", href: "/ppt/settings" },
];

// ── 內部內容（消耗 PPTContext） ───────────────────────────────────────────

function PptEditor() {
  const { doc, editor, editorDispatch } = usePPTStore();

  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);

  // ── 匯出 ──────────────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const html = exportToHTML(doc);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.title.replace(/\s+/g, "_")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [doc]);

  // ── 放映 ──────────────────────────────────────────────────────────────
  const handleStartPresent = useCallback(() => {
    if (doc.slides.length === 0) return;
    editorDispatch({ type: "START_PRESENT" });
  }, [doc.slides.length, editorDispatch]);

  return (
    <div className="min-h-full flex flex-col bg-zinc-950">
      {/* 頂部工具列 */}
      <Toolbar
        onOpenTemplates={() => setTemplatePickerOpen(true)}
        onStartPresent={handleStartPresent}
        onExport={handleExport}
      />

      {/* 次導航 */}
      <SubNav tabs={tabs} />

      {/* 主體：三欄編輯器佈局 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左側 — 投影片縮圖列表 */}
        <div className="hidden sm:block">
          <SlideList />
        </div>

        {/* 中間 — 編輯區 */}
        <SlideEditor />

        {/* 右側 — 屬性面板（lg 以上顯示） */}
        <div className="hidden lg:block">
          <PropertyPanel />
        </div>
      </div>

      {/* 模板選擇 Modal */}
      <TemplatePicker
        open={templatePickerOpen}
        onClose={() => setTemplatePickerOpen(false)}
      />

      {/* 全螢幕放映 */}
      <SlidePreview />
    </div>
  );
}

// ── 根元件（包裹 Provider） ───────────────────────────────────────────────

export default function PptPage() {
  return (
    <PPTProvider>
      <PptEditor />
    </PPTProvider>
  );
}
