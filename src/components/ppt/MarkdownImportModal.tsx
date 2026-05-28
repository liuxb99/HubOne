"use client";

import { useState, useRef, useCallback } from "react";
import { usePPTStore } from "@/lib/ppt/store";
import { markdownToDocument } from "@/lib/ppt/markdown";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

// ── Props ─────────────────────────────────────────────────────────────────

interface MarkdownImportModalProps {
  open: boolean;
  onClose: () => void;
}

// ── 內建範例 Markdown ────────────────────────────────────────────────────

const EXAMPLE_MD = `# 我的簡報標題

> 副標題或簡短描述

---

## 第一節：介紹

- 重點項目 1
- 重點項目 2
- 重點項目 3

1. 第一步驟
2. 第二步驟
3. 第三步驟

---

## 程式碼範例

\`\`\`typescript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

> 程式碼區塊支援多種語言標記

---

## 圖片與更多

![Placeholder](https://picsum.photos/seed/ppt/800/400)

一般段落文字可以直接撰寫。
支援 **粗體** 和 *斜體* 文字。`;

// ── 主元件 ───────────────────────────────────────────────────────────────

export default function MarkdownImportModal({ open, onClose }: MarkdownImportModalProps) {
  const { dispatch, editorDispatch } = usePPTStore();
  const [mdContent, setMdContent] = useState("");
  const [mode, setMode] = useState<"paste" | "file">("paste");
  const [error, setError] = useState<string | null>(null);
  const [previewCount, setPreviewCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── 讀取檔案 ──────────────────────────────────────────────────────────

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 驗證副檔名
    if (!file.name.endsWith(".md") && !file.name.endsWith(".markdown")) {
      setError("請選擇 .md 或 .markdown 檔案");
      return;
    }

    try {
      const text = await file.text();
      setMdContent(text);
      setError(null);

      // 預覽投影片數量
      const slideCount = text.split(/\n---\n/).length;
      setPreviewCount(slideCount);
    } catch {
      setError("讀取檔案失敗，請重試");
    }
  }, []);

  // ── 當文字貼上時更新預覽 ──────────────────────────────────────────────

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setMdContent(text);
    setError(null);

    if (text.trim()) {
      const slideCount = text.split(/\n---\n/).length;
      setPreviewCount(slideCount);
    } else {
      setPreviewCount(0);
    }
  }, []);

  // ── 匯入 ──────────────────────────────────────────────────────────────

  const handleImport = useCallback(() => {
    if (!mdContent.trim()) {
      setError("請輸入 Markdown 內容或選擇檔案");
      return;
    }

    try {
      const doc = markdownToDocument(mdContent);
      dispatch({ type: "LOAD_DOCUMENT", payload: doc });
      // 選取第一頁
      if (doc.slides.length > 0) {
        editorDispatch({ type: "SET_CURRENT_SLIDE", payload: doc.slides[0].id });
      }
      onClose();
    } catch {
      setError("解析 Markdown 失敗，請檢查格式");
    }
  }, [mdContent, dispatch, editorDispatch, onClose]);

  // ── 載入範例 ──────────────────────────────────────────────────────────

  const handleLoadExample = useCallback(() => {
    setMdContent(EXAMPLE_MD);
    setError(null);
    setPreviewCount(5);
  }, []);

  // ── 清除 ──────────────────────────────────────────────────────────────

  const handleClear = useCallback(() => {
    setMdContent("");
    setError(null);
    setPreviewCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* ── 標頭 ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white">📄 導入 Markdown</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              從 Markdown 檔案或直接貼上內容，自動生成投影片
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* ── 模式切換 ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-zinc-800 shrink-0">
          <button
            onClick={() => setMode("paste")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-medium transition-colors",
              mode === "paste"
                ? "bg-pink-600/30 text-pink-300 border border-pink-600/50"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent"
            )}
          >
            ✏️ 貼上內容
          </button>
          <button
            onClick={() => setMode("file")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-medium transition-colors",
              mode === "file"
                ? "bg-pink-600/30 text-pink-300 border border-pink-600/50"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent"
            )}
          >
            📁 選擇檔案
          </button>

          <div className="flex-1" />

          {previewCount > 0 && (
            <span className="text-xs text-zinc-500">
              預覽：{previewCount} 頁投影片
            </span>
          )}
        </div>

        {/* ── 內容區 ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6">
          {mode === "paste" ? (
            <textarea
              value={mdContent}
              onChange={handleTextChange}
              placeholder={`貼上 Markdown 內容...\n\n支援語法：\n# 標題\n## 子標題\n--- (投影片分隔)\n- 項目列表\n1. 有序列表\n**粗體** *斜體*\n![圖片](url)\n\`\`\`code\`\`\`\n> 引言`}
              className="w-full h-[400px] bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-200 font-mono outline-none focus:border-pink-500/50 resize-none placeholder:text-zinc-700 leading-relaxed"
              spellCheck={false}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-xl">
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-3 px-8 py-8 rounded-xl hover:bg-zinc-800/50 transition-colors"
              >
                <span className="text-4xl">📂</span>
                <span className="text-sm text-zinc-400">
                  點擊選擇 .md 檔案
                </span>
                <span className="text-xs text-zinc-600">
                  或拖曳檔案到此區域
                </span>
              </button>
            </div>
          )}

          {/* 錯誤訊息 */}
          {error && (
            <div className="mt-3 px-4 py-2 bg-red-900/30 border border-red-800/50 rounded-lg">
              <p className="text-xs text-red-400">⚠️ {error}</p>
            </div>
          )}

          {/* 支援語法提示 */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { syntax: "# 標題", desc: "封面/大標題" },
              { syntax: "## 子標題", desc: "章節標題" },
              { syntax: "---", desc: "投影片分隔" },
              { syntax: "- 列表", desc: "項目符號" },
              { syntax: "1. 列表", desc: "有序列表" },
              { syntax: "**粗體**", desc: "粗體文字" },
              { syntax: "`程式碼`", desc: "行內程式碼" },
              { syntax: "> 引言", desc: "引用區塊" },
            ].map(({ syntax, desc }) => (
              <div
                key={syntax}
                className="px-2 py-1.5 bg-zinc-800/50 rounded-lg text-center"
              >
                <code className="text-[11px] text-pink-300 font-mono">{syntax}</code>
                <p className="text-[10px] text-zinc-500 mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── 底部按鈕 ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleLoadExample} className="text-xs">
              📝 載入範例
            </Button>
            {mdContent && (
              <Button variant="ghost" size="sm" onClick={handleClear} className="text-xs">
                🗑️ 清除
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
              取消
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleImport}
              disabled={!mdContent.trim()}
              className="text-xs"
            >
              ✅ 確認導入
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
