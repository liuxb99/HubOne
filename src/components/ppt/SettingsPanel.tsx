"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { usePPTStore } from "@/lib/ppt/store";
import { DEFAULT_SETTINGS, type PPTSettings } from "@/lib/ppt/types";

// ── 常數 ─────────────────────────────────────────────────────────────────

const TRANSITION_OPTIONS = [
  { value: "none", label: "無" },
  { value: "fade", label: "淡入淡出" },
  { value: "slide-left", label: "向左滑入" },
  { value: "slide-right", label: "向右滑入" },
  { value: "slide-up", label: "向上滑入" },
  { value: "slide-down", label: "向下滑入" },
  { value: "zoom", label: "縮放" },
  { value: "flip", label: "翻轉" },
] as const;

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter" },
  { value: "Noto Sans TC", label: "Noto Sans TC" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Lora", label: "Lora" },
  { value: "Poppins", label: "Poppins" },
  { value: "Merriweather", label: "Merriweather" },
] as const;

const ASPECT_RATIO_OPTIONS = [
  { value: "16:9" as const, label: "寬螢幕 16:9", icon: "🖥️" },
  { value: "4:3" as const, label: "標準 4:3", icon: "📺" },
] as const;

// ── 面板區段 ──────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-[10px] text-zinc-600 font-medium mb-2 uppercase tracking-wider">
        {title}
      </p>
      {children}
    </div>
  );
}

// ── 主元件 ────────────────────────────────────────────────────────────────

interface SettingsPanelProps {
  onClose: () => void;
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { doc, dispatch } = usePPTStore();
  const settings: PPTSettings = doc.settings ?? DEFAULT_SETTINGS;

  // 更新設定
  const updateSettings = useCallback(
    (updates: Partial<PPTSettings>) => {
      dispatch({ type: "UPDATE_SETTINGS", payload: updates });
    },
    [dispatch]
  );

  // 更新標題
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch({ type: "SET_TITLE", payload: e.target.value });
    },
    [dispatch]
  );

  return (
    <aside className="w-56 lg:w-64 shrink-0 border-l border-[var(--border)] bg-zinc-900/50 flex flex-col">
      {/* 標頭 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <h3 className="text-xs font-medium text-zinc-500">⚙️ 簡報設定</h3>
        <button
          onClick={onClose}
          className="text-xs text-zinc-500 hover:text-white transition-colors"
        >
          ✕ 關閉
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* ── 簡報標題 ──────────────────────────────────────────────── */}
        <Section title="簡報標題">
          <input
            type="text"
            value={doc.title}
            onChange={handleTitleChange}
            placeholder="輸入簡報標題"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 outline-none focus:border-pink-500 placeholder:text-zinc-600"
          />
        </Section>

        {/* ── 預設過渡效果 ──────────────────────────────────────────── */}
        <Section title="預設過渡效果">
          <select
            value={settings.defaultTransition}
            onChange={(e) =>
              updateSettings({
                defaultTransition: e.target.value as PPTSettings["defaultTransition"],
              })
            }
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-300 outline-none focus:border-pink-500"
          >
            {TRANSITION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Section>

        {/* ── 預設過渡持續時間 ──────────────────────────────────────── */}
        <Section title="預設過渡持續時間">
          <div className="space-y-1">
            <input
              type="range"
              min="200"
              max="2000"
              step="100"
              value={settings.defaultTransitionDuration}
              onChange={(e) =>
                updateSettings({ defaultTransitionDuration: Number(e.target.value) })
              }
              className="w-full accent-pink-500"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-600">200ms</span>
              <span className="text-xs text-zinc-400 font-mono">
                {settings.defaultTransitionDuration}ms
              </span>
              <span className="text-[10px] text-zinc-600">2000ms</span>
            </div>
          </div>
        </Section>

        {/* ── 預設字型 ──────────────────────────────────────────────── */}
        <Section title="預設字型">
          <select
            value={settings.defaultFont}
            onChange={(e) => updateSettings({ defaultFont: e.target.value })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-300 outline-none focus:border-pink-500"
            style={{ fontFamily: settings.defaultFont }}
          >
            {FONT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Section>

        {/* ── 佈局比例 ──────────────────────────────────────────────── */}
        <Section title="佈局比例">
          <div className="grid grid-cols-2 gap-2">
            {ASPECT_RATIO_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateSettings({ aspectRatio: opt.value })}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all",
                  settings.aspectRatio === opt.value
                    ? "border-pink-500 bg-pink-500/10 text-pink-300"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300"
                )}
              >
                <span className="text-lg">{opt.icon}</span>
                <span className="text-[10px] font-medium">{opt.label}</span>
              </button>
            ))}
          </div>

          {/* 比例示意 */}
          <div className="mt-3 px-3 py-2 bg-zinc-800/50 rounded-lg">
            <div
              className={cn(
                "mx-auto rounded border border-zinc-700",
                settings.aspectRatio === "16:9" ? "w-24 h-[13.5px]" : "w-24 h-18"
              )}
              style={{
                height: settings.aspectRatio === "16:9" ? "54px" : "72px",
              }}
            >
              <div className="w-full h-full bg-zinc-700/30 rounded flex items-center justify-center">
                <span className="text-[8px] text-zinc-600">{settings.aspectRatio}</span>
              </div>
            </div>
          </div>
        </Section>

        {/* ── 分隔線 + 提示 ──────────────────────────────────────────── */}
        <div className="pt-2 border-t border-zinc-800">
          <p className="text-[10px] text-zinc-600 leading-relaxed">
            💡 設定會自動儲存，並作為新建投影片的預設值。
          </p>
        </div>
      </div>
    </aside>
  );
}
