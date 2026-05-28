import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "線上 PPT — OPC",
  description: "拖放編輯器、多種模板、圖表表格、Markdown 導入、HTML 匯出",
};

export default function PptLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-theme="ppt" className="min-h-full">
      {children}
    </div>
  );
}
