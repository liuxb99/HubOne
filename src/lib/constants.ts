
import type { BusinessId } from "@/types";
/** 業務線 URL 路徑前綴 → BusinessId */
export const BUSINESS_PATH_PREFIX: Record<string, string> = {
  quant: "quant",
  civil: "civil",
  market: "marketplace",
  ai: "ai-tools",
  ppt: "ppt",
  game: "games",
};

/** 業務線 ID → 主題色 */
export const BUSINESS_COLORS: Record<BusinessId, string> = {
  quant: "#00C853",
  civil: "#FF6D00",
  market: "#E91E63",
  ai: "#8B5CF6",
  ppt: "#EC4899",
  game: "#FF6B35",
};

/** 業務線 ID → 顯示名稱 */
export const BUSINESS_NAMES: Record<BusinessId, string> = {
  quant: "量化交易",
  civil: "土木結構",
  market: "二手交易",
  ai: "AI 工具",
  ppt: "線上 PPT",
  game: "經典遊戲",
};

/** 從 URL pathname 推斷業務線 ID */
export function inferBusinessId(pathname: string): BusinessId | null {
  for (const [id, prefix] of Object.entries(BUSINESS_PATH_PREFIX)) {
    if (pathname.startsWith(`/${prefix}`)) return id as BusinessId;
  }
  return null;
}
