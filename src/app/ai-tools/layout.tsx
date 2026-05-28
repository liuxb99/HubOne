import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI 工具 — OPC",
  description: "文字生成、程式碼助手、圖片展示、文件摘要、提示詞管理",
};

export default function AiToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-theme="ai" className="min-h-full bg-zinc-950 text-zinc-100">
      {children}
    </div>
  );
}
