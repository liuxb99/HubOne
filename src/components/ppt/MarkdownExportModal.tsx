"use client";

import { useState, useCallback, useMemo } from "react";
import { usePPTStore } from "@/lib/ppt/store";
import { slidesToMarkdown, downloadMarkdown } from "@/lib/ppt/markdown";
import Button from "@/components/ui/Button";

// ── Props ─────────────────────────────────────────────────────────────────

interface MarkdownExportModalProps {
  open: boolean;
  onClose: () => void;
}

// ── 主元件 ───────────────────────────────────────────────────────────────

export default function MarkdownExportModal({ open, onClose }: MarkdownExportModalProps) {
  const { doc } = usePPTStore();
  const [copySuccess, setCopySuccess] = useState(false);

  // 產出 Markdown（memoized）
  const markdownContent = useMemo(() => slidesToMarkdown(doc), [doc]);

  // ── 複製到剪貼簿 ──────────────────────────────────────────────────────

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // 降級方案：選取文字區域
      const textarea = document.querySelector("#md-export-content") as HTMLTextAreaElement;
      if (textarea) {
        textarea.select();
        document.execCommand("copy");
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    }
  }, [markdownContent]);

  // ── 下載 ──────────────────────────────────────────────────────────────

  const handleDownload = useCallback(() => {
    downloadMarkdown(doc);
  }, [doc]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* ── 標頭 ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white">📝 匯出 Markdown</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              將當前簡報匯出為 Markdown 格式，共 {doc.slides.length} 頁投影片
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* ── 內容區 ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6">
          <textarea
            id="md-export-content"
            value={markdownContent}
            readOnly
            className="w-full h-[400px] bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-200 font-mono outline-none resize-none leading-relaxed"
            spellCheck={false}
          />

          {/* 投影片統計 */}
          <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
            <span>📄 {doc.slides.length} 頁投影片</span>
            <span>📏 {markdownContent.split("\n").length} 行</span>
            <span>📦 {new Blob([markdownContent]).size} bytes</span>
          </div>
        </div>

        {/* ── 底部按鈕 ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 shrink-0">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            關閉
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              className="text-xs"
            >
              {copySuccess ? "✅ 已複製！" : "📋 複製到剪貼簿"}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownload}
              className="text-xs"
            >
              📥 下載 .md
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
