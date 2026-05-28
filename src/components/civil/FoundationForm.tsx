"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { calcSpreadFooting, type FootingResult } from "@/lib/civil/foundation";

interface FoundationFormProps {
  onResult?: (result: FootingResult | null) => void;
  onParamsChange?: (params: Record<string, any>) => void;
}

/**
 * 獨立基腳設計表單（即時計算版）
 *
 * 參數分組：幾何 / 材料 / 載重 / 結果
 */
export default function FoundationForm({ onResult, onParamsChange }: FoundationFormProps) {
  // ── 📐 幾何參數 ──
  const [colSize, setColSize] = useState(400);

  // ── 📦 材料參數 ──
  const [fc, setFc] = useState(28);
  const [fy, setFy] = useState(420);

  // ── ⚙️ 載重參數 ──
  const [axialLoad, setAxialLoad] = useState(1500);
  const [qa, setQa] = useState(200);

  // ── 即時計算 ──
  const result = useMemo<FootingResult | null>(() => {
    if (axialLoad <= 0 || qa <= 0) return null;
    try {
      return calcSpreadFooting(axialLoad, qa, fc, fy, colSize);
    } catch {
      return null;
    }
  }, [axialLoad, qa, fc, fy, colSize]);

  useEffect(() => {
    // 傳遞增強結果（含輸入參數供圖表使用）
    if (result) {
      onResult?.(({ ...result, axialLoad }) as any);
    } else {
      onResult?.(result);
    }
  }, [result, axialLoad, onResult]);

  useEffect(() => {
    onParamsChange?.({
      '柱軸力 P': `${axialLoad} kN`,
      '容許承載力 qa': `${qa} kN/m²`,
      '混凝土 fc\'': `${fc} MPa`,
      '鋼筋 fy': `${fy} MPa`,
      '柱斷面尺寸': `${colSize} mm`,
    });
  }, [axialLoad, qa, fc, fy, colSize, onParamsChange]);

  const allOK = result?.isBearingOK && result?.isThicknessOK && result?.isShearOK;

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════
          📐 幾何參數
          ═══════════════════════════════════════ */}
      <fieldset className="border-l-2 border-blue-400 pl-4">
        <legend className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 mb-1">
          <span>📐</span> 幾何參數
        </legend>
        <div className="mt-2">
          <Input
            label="柱斷面尺寸（方形）"
            type="number"
            min="200"
            max="1500"
            step="50"
            value={colSize}
            onChange={(e) => setColSize(Number(e.target.value))}
            suffix={<span className="text-xs text-gray-400">mm</span>}
          />
        </div>
      </fieldset>

      {/* ═══════════════════════════════════════
          📦 材料參數
          ═══════════════════════════════════════ */}
      <fieldset className="border-l-2 border-green-400 pl-4">
        <legend className="flex items-center gap-1.5 text-sm font-semibold text-green-600 mb-1">
          <span>📦</span> 材料參數
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <Input
            label="混凝土 fc'"
            type="number"
            min="17"
            max="70"
            step="1"
            value={fc}
            onChange={(e) => setFc(Number(e.target.value))}
            suffix={<span className="text-xs text-gray-400">MPa</span>}
          />
          <Input
            label="鋼筋 fy"
            type="number"
            min="280"
            max="550"
            step="10"
            value={fy}
            onChange={(e) => setFy(Number(e.target.value))}
            suffix={<span className="text-xs text-gray-400">MPa</span>}
          />
        </div>
      </fieldset>

      {/* ═══════════════════════════════════════
          ⚙️ 載重參數
          ═══════════════════════════════════════ */}
      <fieldset className="border-l-2 border-orange-400 pl-4">
        <legend className="flex items-center gap-1.5 text-sm font-semibold text-orange-600 mb-1">
          <span>⚙️</span> 載重參數
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <Input
            label="柱軸力 P"
            type="number"
            min="10"
            max="50000"
            step="10"
            value={axialLoad}
            onChange={(e) => setAxialLoad(Number(e.target.value))}
            suffix={<span className="text-xs text-gray-400">kN</span>}
          />
          <Input
            label="容許承載力 qa"
            type="number"
            min="10"
            max="1000"
            step="10"
            value={qa}
            onChange={(e) => setQa(Number(e.target.value))}
            suffix={<span className="text-xs text-gray-400">kN/m²</span>}
          />
        </div>
      </fieldset>

      {/* ═══════════════════════════════════════
          📊 計算結果
          ═══════════════════════════════════════ */}
      <fieldset className="border-l-2 border-emerald-400 pl-4">
        <legend className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 mb-1">
          <span>📊</span> 計算結果
        </legend>

        {!result ? (
          <div className="flex items-center justify-center py-6 text-sm text-gray-400">
            <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            輸入參數後自動計算中…
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
              <ResultCard label="基腳尺寸" value={`${result.B}×${result.L}`} unit="m" />
              <ResultCard label="基腳厚度" value={result.H} unit="mm" />
              <ResultCard label="實際承載力" value={result.q_actual} unit="kN/m²" />
              <ResultCard
                label="安全判定"
                value={allOK ? '🟢 安全' : '🔴 不合格'}
                className={allOK ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200'}
              />
            </div>

            {/* 配筋結果 */}
            <div className="mt-3 p-3 rounded-lg border border-gray-100 bg-white">
              <h5 className="text-xs font-semibold text-gray-500 mb-2">配筋結果</h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <RebarBox label="配筋" desc={result.rebar_desc} />
                <RebarBox label="鋼筋面積" desc={`${result.As} mm²`} />
                <RebarBox label="彎矩 Mu" desc={`${result.Mu.toFixed(1)} kN·m`} />
              </div>
            </div>

            {/* 檢討項目 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <CheckItem label="承載力檢討" ok={result.isBearingOK} />
              <CheckItem label="厚度檢討" ok={result.isThicknessOK} />
              <CheckItem label="剪力檢討" ok={result.isShearOK} />
            </div>

            {/* 計算過程 */}
            {result.steps && result.steps.length > 0 && (
              <details className="mt-3">
                <summary className="text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700">
                  檢視計算過程
                </summary>
                <div className="mt-2 space-y-1">
                  {result.steps.map((step, i) => (
                    <div key={i} className="text-[10px] text-gray-500 font-mono py-1 border-b border-gray-100 last:border-0">
                      {step}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </fieldset>
    </div>
  );
}

// ── 子元件 ──
function ResultCard({ label, value, unit, className }: { label: string; value: string | number; unit?: string; className?: string }) {
  return (
    <div className={cn('rounded-lg border border-gray-100 bg-white p-3 text-center', className)}>
      <div className="text-[10px] text-gray-500 mb-1 font-medium">{label}</div>
      <div className="text-lg font-bold font-mono text-gray-800">
        {typeof value === 'number' ? value.toFixed(1) : value}
        {unit && <span className="text-xs font-normal text-gray-400 ml-0.5">{unit}</span>}
      </div>
    </div>
  );
}

function RebarBox({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="p-2.5 rounded bg-gray-50 border border-gray-100">
      <div className="text-[10px] text-gray-400 mb-0.5">{label}</div>
      <div className="text-sm font-bold font-mono text-[#FF6D00]">{desc}</div>
    </div>
  );
}

function CheckItem({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className={cn(
      'flex items-center justify-between px-3 py-2 rounded-lg border text-xs',
      ok ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700',
    )}>
      <span className="font-medium">{label}</span>
      <Badge variant={ok ? 'success' : 'error'}>{ok ? '合格' : '不合格'}</Badge>
    </div>
  );
}
