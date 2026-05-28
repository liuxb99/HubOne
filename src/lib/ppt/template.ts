// =============================================================================
// 線上 PPT 編輯器 — 模板庫（8 套精美模板）
// =============================================================================

import type { Template } from "./types";

export const TEMPLATES: Template[] = [
  // ─── 1. 深邃簡約 ──────────────────────────────────────────────────────
  {
    id: "minimal-dark",
    name: "深邃簡約",
    description: "黑底白字，極簡留白，適合科技發表",
    colors: {
      primary: "#1a1a2e",
      secondary: "#16213e",
      accent: "#e94560",
      text: "#ffffff",
      background: "#0a0a0a",
      gradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
    },
    fonts: { heading: "Inter", body: "Noto Sans TC" },
  },

  // ─── 2. 商務藍圖 ──────────────────────────────────────────────────────
  {
    id: "corporate-blue",
    name: "商務藍圖",
    description: "深藍漸層，金色強調，適合商務簡報",
    colors: {
      primary: "#1e3a5f",
      secondary: "#2d5a87",
      accent: "#c9a959",
      text: "#ffffff",
      background: "#0d2137",
      gradient: "linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)",
    },
    fonts: { heading: "Playfair Display", body: "Noto Sans TC" },
  },

  // ─── 3. 自然翡翠 ──────────────────────────────────────────────────────
  {
    id: "nature-emerald",
    name: "自然翡翠",
    description: "翠綠與大地色調，適合環保、農業、健康相關簡報",
    colors: {
      primary: "#0d5e3a",
      secondary: "#2d8a5e",
      accent: "#f4a261",
      text: "#1a1a1a",
      background: "#f0f7f2",
      gradient: "linear-gradient(135deg, #0d5e3a 0%, #2d8a5e 100%)",
    },
    fonts: { heading: "Lora", body: "Noto Sans TC" },
  },

  // ─── 4. 暖陽橙暮 ──────────────────────────────────────────────────────
  {
    id: "warm-sunset",
    name: "暖陽橙暮",
    description: "暖橙漸層，熱情活力，適合行銷提案與品牌發表",
    colors: {
      primary: "#d64d00",
      secondary: "#f48c2d",
      accent: "#ffd166",
      text: "#ffffff",
      background: "#1a0a00",
      gradient: "linear-gradient(135deg, #d64d00 0%, #f48c2d 100%)",
    },
    fonts: { heading: "Poppins", body: "Noto Sans TC" },
  },

  // ─── 5. 浪漫粉櫻 ──────────────────────────────────────────────────────
  {
    id: "romantic-sakura",
    name: "浪漫粉櫻",
    description: "柔嫩粉紅，溫暖優雅，適合婚禮、美妝、生活風格",
    colors: {
      primary: "#c44a6c",
      secondary: "#e891b0",
      accent: "#f7caca",
      text: "#3d1a2b",
      background: "#fff5f7",
      gradient: "linear-gradient(135deg, #c44a6c 0%, #e891b0 100%)",
    },
    fonts: { heading: "Playfair Display", body: "Noto Sans TC" },
  },

  // ─── 6. 科技紫羅蘭 ────────────────────────────────────────────────────
  {
    id: "tech-violet",
    name: "科技紫羅蘭",
    description: "深紫搭配霓虹青，未來科技感十足，適合 AI、新創",
    colors: {
      primary: "#6c3cb6",
      secondary: "#8e5ad8",
      accent: "#00e5ff",
      text: "#ffffff",
      background: "#0d0a14",
      gradient: "linear-gradient(135deg, #6c3cb6 0%, #8e5ad8 100%)",
    },
    fonts: { heading: "Inter", body: "Noto Sans TC" },
  },

  // ─── 7. 深海探險 ──────────────────────────────────────────────────────
  {
    id: "deep-ocean",
    name: "深海探險",
    description: "深海藍到青綠，冷冽沉穩，適合學術研究與數據報告",
    colors: {
      primary: "#003b5c",
      secondary: "#007b8a",
      accent: "#7fcbc4",
      text: "#e6f2f5",
      background: "#001520",
      gradient: "linear-gradient(135deg, #003b5c 0%, #007b8a 100%)",
    },
    fonts: { heading: "Merriweather", body: "Noto Sans TC" },
  },

  // ─── 8. 秋楓赤紅 ──────────────────────────────────────────────────────
  {
    id: "autumn-maple",
    name: "秋楓赤紅",
    description: "楓紅與暖金，濃郁秋意，適合文化創意、旅遊分享",
    colors: {
      primary: "#8b2500",
      secondary: "#c94b13",
      accent: "#f0a500",
      text: "#2c1810",
      background: "#fdf5ed",
      gradient: "linear-gradient(135deg, #8b2500 0%, #c94b13 100%)",
    },
    fonts: { heading: "Lora", body: "Noto Sans TC" },
  },
];

/** 根據 ID 查詢模板，找不到時回傳第一個模板 */
export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

/** 取得預設模板（深邃簡約） */
export function getDefaultTemplate(): Template {
  return TEMPLATES[0];
}
