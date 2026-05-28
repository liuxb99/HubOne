// =============================================================================
// PPT 編輯器 — 投影片過渡動畫系統（借鑑 Reveal.js）
// =============================================================================

import type { CSSProperties } from "react";

// ── 過渡動畫型別 ─────────────────────────────────────────────────────────

export type SlideTransition =
  | "none"
  | "fade"
  | "slide-left"
  | "slide-right"
  | "slide-up"
  | "slide-down"
  | "zoom"
  | "flip";

/** 過渡方向（用於決定進/出動畫的方向） */
export type TransitionDirection = "forward" | "backward";

/** 過渡設定 */
export interface TransitionConfig {
  type: SlideTransition;
  duration: number; // ms
}

// ── CSS @keyframes 動畫字串 ──────────────────────────────────────────────

export const TRANSITION_KEYFRAMES: Record<SlideTransition, string> = {
  none: "",
  fade: `
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
  `,
  "slide-left": `
    @keyframes slideInFromRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
    @keyframes slideOutToLeft { from { transform: translateX(0); } to { transform: translateX(-100%); } }
    @keyframes slideInFromLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
    @keyframes slideOutToRight { from { transform: translateX(0); } to { transform: translateX(100%); } }
  `,
  "slide-right": `
    @keyframes slideInFromLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
    @keyframes slideOutToRight { from { transform: translateX(0); } to { transform: translateX(100%); } }
    @keyframes slideInFromRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
    @keyframes slideOutToLeft { from { transform: translateX(0); } to { transform: translateX(-100%); } }
  `,
  "slide-up": `
    @keyframes slideInFromBottom { from { transform: translateY(100%); } to { transform: translateY(0); } }
    @keyframes slideOutToTop { from { transform: translateY(0); } to { transform: translateY(-100%); } }
    @keyframes slideInFromTop { from { transform: translateY(-100%); } to { transform: translateY(0); } }
    @keyframes slideOutToBottom { from { transform: translateY(0); } to { transform: translateY(100%); } }
  `,
  "slide-down": `
    @keyframes slideInFromTop { from { transform: translateY(-100%); } to { transform: translateY(0); } }
    @keyframes slideOutToBottom { from { transform: translateY(0); } to { transform: translateY(100%); } }
    @keyframes slideInFromBottom { from { transform: translateY(100%); } to { transform: translateY(0); } }
    @keyframes slideOutToTop { from { transform: translateY(0); } to { transform: translateY(-100%); } }
  `,
  zoom: `
    @keyframes zoomIn { from { transform: scale(0.3); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    @keyframes zoomOut { from { transform: scale(1); opacity: 1; } to { transform: scale(0.3); opacity: 0; } }
  `,
  flip: `
    @keyframes flipIn { from { transform: perspective(1200px) rotateY(-90deg); opacity: 0; } to { transform: perspective(1200px) rotateY(0deg); opacity: 1; } }
    @keyframes flipOut { from { transform: perspective(1200px) rotateY(0deg); opacity: 1; } to { transform: perspective(1200px) rotateY(90deg); opacity: 0; } }
  `,
};

// ── 取得所有動畫 CSS（用於注入 <style>） ───────────────────────────────

export function getAllTransitionKeyframes(): string {
  return Object.values(TRANSITION_KEYFRAMES)
    .filter(Boolean)
    .join("\n");
}

// ── 根據過渡型別與方向，回傳進入/離開的 CSS properties ──────────────────

export function getTransitionStyles(
  type: SlideTransition,
  duration: number,
  direction: TransitionDirection = "forward"
): {
  enterStyle: CSSProperties;
  exitStyle: CSSProperties;
  enterClass: string;
  exitClass: string;
} {
  const durationSec = duration / 1000;

  const base: CSSProperties = {
    animationDuration: `${durationSec}s`,
    animationFillMode: "both",
    animationTimingFunction: "ease",
  };

  switch (type) {
    case "fade":
      return {
        enterStyle: { ...base, animationName: "fadeIn" },
        exitStyle: { ...base, animationName: "fadeOut" },
        enterClass: "animate-fadeIn",
        exitClass: "animate-fadeOut",
      };

    case "slide-left":
      if (direction === "forward") {
        return {
          enterStyle: { ...base, animationName: "slideInFromRight" },
          exitStyle: { ...base, animationName: "slideOutToLeft" },
          enterClass: "animate-slideInFromRight",
          exitClass: "animate-slideOutToLeft",
        };
      }
      return {
        enterStyle: { ...base, animationName: "slideInFromLeft" },
        exitStyle: { ...base, animationName: "slideOutToRight" },
        enterClass: "animate-slideInFromLeft",
        exitClass: "animate-slideOutToRight",
      };

    case "slide-right":
      if (direction === "forward") {
        return {
          enterStyle: { ...base, animationName: "slideInFromLeft" },
          exitStyle: { ...base, animationName: "slideOutToRight" },
          enterClass: "animate-slideInFromLeft",
          exitClass: "animate-slideOutToRight",
        };
      }
      return {
        enterStyle: { ...base, animationName: "slideInFromRight" },
        exitStyle: { ...base, animationName: "slideOutToLeft" },
        enterClass: "animate-slideInFromRight",
        exitClass: "animate-slideOutToLeft",
      };

    case "slide-up":
      if (direction === "forward") {
        return {
          enterStyle: { ...base, animationName: "slideInFromBottom" },
          exitStyle: { ...base, animationName: "slideOutToTop" },
          enterClass: "animate-slideInFromBottom",
          exitClass: "animate-slideOutToTop",
        };
      }
      return {
        enterStyle: { ...base, animationName: "slideInFromTop" },
        exitStyle: { ...base, animationName: "slideOutToBottom" },
        enterClass: "animate-slideInFromTop",
        exitClass: "animate-slideOutToBottom",
      };

    case "slide-down":
      if (direction === "forward") {
        return {
          enterStyle: { ...base, animationName: "slideInFromTop" },
          exitStyle: { ...base, animationName: "slideOutToBottom" },
          enterClass: "animate-slideInFromTop",
          exitClass: "animate-slideOutToBottom",
        };
      }
      return {
        enterStyle: { ...base, animationName: "slideInFromBottom" },
        exitStyle: { ...base, animationName: "slideOutToTop" },
        enterClass: "animate-slideInFromBottom",
        exitClass: "animate-slideOutToTop",
      };

    case "zoom":
      return {
        enterStyle: { ...base, animationName: "zoomIn" },
        exitStyle: { ...base, animationName: "zoomOut" },
        enterClass: "animate-zoomIn",
        exitClass: "animate-zoomOut",
      };

    case "flip":
      return {
        enterStyle: {
          ...base,
          animationName: "flipIn",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        },
        exitStyle: {
          ...base,
          animationName: "flipOut",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        },
        enterClass: "animate-flipIn",
        exitClass: "animate-flipOut",
      };

    default:
      return {
        enterStyle: {},
        exitStyle: {},
        enterClass: "",
        exitClass: "",
      };
  }
}

// ── 過渡效果顯示名稱（中文） ────────────────────────────────────────────

export const TRANSITION_LABELS: Record<SlideTransition, string> = {
  none: "無",
  fade: "淡入淡出",
  "slide-left": "向左滑入",
  "slide-right": "向右滑入",
  "slide-up": "向上滑入",
  "slide-down": "向下滑入",
  zoom: "縮放",
  flip: "翻轉",
};

// ── 過渡效果列表（用於 UI） ─────────────────────────────────────────────

export const TRANSITION_OPTIONS: { value: SlideTransition; label: string }[] = [
  { value: "none", label: "無" },
  { value: "fade", label: "淡入淡出" },
  { value: "slide-left", label: "向左滑入" },
  { value: "slide-right", label: "向右滑入" },
  { value: "slide-up", label: "向上滑入" },
  { value: "slide-down", label: "向下滑入" },
  { value: "zoom", label: "縮放" },
  { value: "flip", label: "翻轉" },
];
