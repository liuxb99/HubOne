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
const MarkdownImportModal = dynamic(() => import("@/components/ppt/MarkdownImportModal"), { ssr: false });
const MarkdownExportModal = dynamic(() => import("@/components/ppt/MarkdownExportModal"), { ssr: false });
const SlideOutlineView = dynamic(() => import("@/components/ppt/SlideOutlineView"), { ssr: false });
const ExportPanel = dynamic(() => import("@/components/ppt/ExportPanel"), { ssr: false });
const SettingsPanel = dynamic(() => import("@/components/ppt/SettingsPanel"), { ssr: false });

// ── ViewMode 型別 ─────────────────────────────────────────────────────────

type ViewMode = "editor" | "slides" | "settings";

// ── 內部內容（消耗 PPTContext） ───────────────────────────────────────────

function PptEditor() {
  const { doc, editor, editorDispatch } = usePPTStore();

  const [viewMode, setViewMode] = useState<ViewMode>("editor");
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [mdImportOpen, setMdImportOpen] = useState(false);
  const [mdExportOpen, setMdExportOpen] = useState(false);
  const [exportPanelOpen, setExportPanelOpen] = useState(false);

  // ── Tab 點擊處理 ─────────────────────────────────────────────────────
  const handleTabClick = useCallback((tabId: string) => {
    switch (tabId) {
      case "editor":
        setViewMode("editor");
        break;
      case "templates":
        setTemplatePickerOpen(true);
        break;
      case "slides":
        setViewMode((prev) => (prev === "slides" ? "editor" : "slides"));
        break;
      case "export":
        setExportPanelOpen(true);
        break;
      case "settings":
        setViewMode((prev) => (prev === "settings" ? "editor" : "settings"));
        break;
    }
  }, []);

  // ── SubNav Tabs ─────────────────────────────────────────────────────
  const tabs = [
    { id: "editor", label: "編輯", icon: "✏️", onClick: () => handleTabClick("editor") },
    { id: "templates", label: "模板", icon: "🎨", onClick: () => handleTabClick("templates") },
    { id: "slides", label: "投影片", icon: "📄", onClick: () => handleTabClick("slides") },
    { id: "export", label: "匯出", icon: "📤", onClick: () => handleTabClick("export") },
    { id: "settings", label: "設定", icon: "⚙️", onClick: () => handleTabClick("settings") },
  ];

  // 計算 activeTabId（用於 SubNav）
  const activeTabId = viewMode === "editor" ? "editor"
    : viewMode === "slides" ? "slides"
    : viewMode === "settings" ? "settings"
    : undefined;

  // ── 匯出 HTML（Toolbar 快速匯出） ───────────────────────────────────
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
        onImportMD={() => setMdImportOpen(true)}
        onExportMD={() => setMdExportOpen(true)}
      />

      {/* 次導航 */}
      <SubNav tabs={tabs} activeId={activeTabId} />

      {/* 主體：根據 viewMode 條件渲染 */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === "editor" && (
          <>
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
          </>
        )}

        {viewMode === "slides" && (
          <SlideOutlineView onClose={() => setViewMode("editor")} />
        )}

        {viewMode === "settings" && (
          <>
            {/* 左側 — 投影片縮圖列表 */}
            <div className="hidden sm:block">
              <SlideList />
            </div>

            {/* 中間 — 編輯區 */}
            <SlideEditor />

            {/* 右側 — 設定面板（lg 以上顯示） */}
            <div className="hidden lg:block">
              <SettingsPanel onClose={() => setViewMode("editor")} />
            </div>
          </>
        )}
      </div>

      {/* 模板選擇 Modal */}
      <TemplatePicker
        open={templatePickerOpen}
        onClose={() => setTemplatePickerOpen(false)}
      />

      {/* 匯出面板 Modal */}
      <ExportPanel
        open={exportPanelOpen}
        onClose={() => setExportPanelOpen(false)}
      />

      {/* Markdown 導入 Modal */}
      <MarkdownImportModal
        open={mdImportOpen}
        onClose={() => setMdImportOpen(false)}
      />

      {/* Markdown 匯出 Modal */}
      <MarkdownExportModal
        open={mdExportOpen}
        onClose={() => setMdExportOpen(false)}
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
