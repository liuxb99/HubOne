"use client";

import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { usePPTStore } from "@/lib/ppt/store";
import { exportToHTML, slidesToText } from "@/lib/ppt/export";
import { slidesToMarkdown } from "@/lib/ppt/markdown";

// ── 匯出格式 ─────────────────────────────────────────────────────────────

type ExportFormat = "html" | "markdown" | "text";

const FORMAT_OPTIONS: { value: ExportFormat; label: string; icon: string }[] = [
  { value: "html", label: "HTML", icon: "🌐" },
  { value: "markdown", label: "Markdown", icon: "📝" },
  { value: "text", label: "純文字", icon: "📄" },
];



// ── 主元件 ────────────────────────────────────────────────────────────────

interface ExportPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function ExportPanel({ open, onClose }: ExportPanelProps) {
  const { doc } = usePPTStore();
  const [format, setFormat] = useState<ExportFormat>("html");
  const [preview, setPreview] = useState("");
  const [copied, setCopied] = useState(false);

  // 產生預覽內容
  useEffect(() => {
    if (!open) return;
    try {
      switch (format) {
        case "html": {
          setPreview(exportToHTML(doc));
          break;
        }
        case "markdown": {
          setPreview(slidesToMarkdown(doc));
          break;
        }
        case "text": {
          setPreview(slidesToText(doc));
          break;
        }
      }
    } catch (err) {
      setPreview(`⚠️ 匯出失敗：${err}`);
    }
  }, [format, doc, open]);

  // 複製到剪貼簿
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(preview);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = preview;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [preview]);

  // 下載檔案
  const handleDownload = useCallback(() => {
    let mimeType = "text/plain;charset=utf-8";
    let ext = "txt";
    if (format === "html") {
      mimeType = "text/html;charset=utf-8";
      ext = "html";
    } else if (format === "markdown") {
      mimeType = "text/markdown;charset=utf-8";
      ext = "md";
    }

    const blob = new Blob([preview], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.title.replace(/\s+/g, "_")}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [preview, format, doc.title]);

  return (
    <Modal open={open} onClose={onClose} title="📤 匯出簡報" size="xl">
      <div className="space-y-4">
        {/* ── 格式切換 Tab ──────────────────────────────────────────── */}
        <div className="flex gap-1 bg-zinc-800/50 rounded-lg p-1">
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setFormat(opt.value);
                setCopied(false);
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all",
                format === opt.value
                  ? "bg-pink-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-700"
              )}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>

        {/* ── 格式說明 ────────────────────────────────────────────────── */}
        <p className="text-xs text-zinc-500">
          {format === "html" && "匯出為獨立 HTML 檔案，可直接在瀏覽器放映。"}
          {format === "markdown" && "匯出為 Markdown 格式，可匯入其他工具。"}
          {format === "text" && "提取所有投影片的文字內容。"}
        </p>

        {/* ── 預覽區 ──────────────────────────────────────────────────── */}
        <div className="relative">
          {format === "html" ? (
            <div className="w-full h-[360px] rounded-xl border border-zinc-800 overflow-hidden bg-white">
              <iframe
                srcDoc={preview}
                className="w-full h-full"
                title="HTML 預覽"
                sandbox="allow-scripts"
              />
            </div>
          ) : (
            <textarea
              readOnly
              value={preview}
              className="w-full h-[360px] bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 font-mono resize-none outline-none focus:border-pink-500"
            />
          )}
        </div>

        {/* ── 操作按鈕 ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
          <Button variant="ghost" size="sm" onClick={onClose}>
            取消
          </Button>

          {/* 複製按鈕（Markdown 與純文字適用） */}
          {format !== "html" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              className={cn(copied && "!border-emerald-500 !text-emerald-400")}
            >
              {copied ? "✅ 已複製" : "📋 複製"}
            </Button>
          )}

          {/* 下載按鈕 */}
          <Button variant="primary" size="sm" onClick={handleDownload}>
            📥 下載
          </Button>
        </div>
      </div>
    </Modal>
  );
}
