// ==================== 業務線定義 ====================

/** 六大事業線 ID */
export type BusinessId = "quant" | "civil" | "market" | "ai" | "ppt" | "game";

/** 業務線資料 */
export interface Business {
  id: BusinessId;
  label: string;
  icon: string;
  href: string;
  color: string;
  description: string;
  features: string[];
}

// ==================== 主題 ====================

/** 主題模式 */
export type ThemeMode = "light" | "dark" | "system";

/** 主題上下文 — ThemeProvider 只管理 light/dark/system */
export interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

// ==================== 用戶 ====================

/** 用戶基本資料 */
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  createdAt: string;
}

// ==================== 遊戲 ====================

/** 遊戲分數 */
export interface GameScoreData {
  id: string;
  userId: string;
  game: string;
  score: number;
  level: number;
  createdAt: string;
  user?: { name: string; avatar: string | null };
}

/** 遊戲定義 */
export interface GameDefinition {
  id: string;
  name: string;
  icon: string;
  desc: string;
}

// ==================== 通用 ====================

/** 分頁回應 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** API 通用回應 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
