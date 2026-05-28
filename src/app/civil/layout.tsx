import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "土木結構 — OPC",
  description: "梁柱板內力計算、截面資料庫、荷載組合、計算書匯出",
};

export default function CivilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-theme="civil" className="min-h-full bg-white dark:bg-zinc-50">
      {children}
    </div>
  );
}
