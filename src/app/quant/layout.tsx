import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "量化交易 — OPC",
  description: "即時行情、技術分析、回測引擎、虛擬交易",
};

export default function QuantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-theme="quant"
      className="min-h-full bg-zinc-950 text-zinc-100"
    >
      {children}
    </div>
  );
}
