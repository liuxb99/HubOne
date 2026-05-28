import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "經典遊戲 — OPC",
  description: "10 款熱門經典遊戲，線上遊玩，全域排行榜",
};

export default function GamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div data-theme="game">{children}</div>;
}
