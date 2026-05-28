// 向後相容：re-export ThemeProvider 中的 useThemeContext 作為 useTheme
// ThemeProvider 已移除 businessId / businessTheme 相關邏輯
export { useThemeContext as useTheme, ThemeProvider } from "@/components/layout/ThemeProvider";
export type { ThemeContextType } from "@/types";
