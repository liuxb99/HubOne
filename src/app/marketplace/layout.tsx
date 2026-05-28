import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "二手交易 — OPC",
  description: "商品刊登搜尋、購物車訂單、評價系統、站內訊息",
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-theme="market" className="min-h-full bg-white dark:bg-zinc-900">
      {children}
    </div>
  );
}
