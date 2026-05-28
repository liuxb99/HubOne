"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import { calcOneWaySlab, calcTwoWaySlab, type SlabResult } from "@/lib/civil/slab";

type SlabType = 'one_way' | 'two_way';

const slabTypeOptions = [
  { value: 'one_way', label: '單向版' },
  { value: 'two_way', label: '雙向版' },
];

const supportOptions = [
  { value: 'simply', label: '簡支' },
  { value: 'continuous', label: '連續' },
];

const edgeConditionOptions = [
  { value: 'simple', label: '四邊簡支' },
  { value: 'continuous', label: '四邊連續' },
];

interface SlabFormProps {
  onResult?: (result: SlabResult | null) => void;
  onParamsChange?: (params: Record<string, any>) => void;
}

/**
 * RC 版設計表單（即時計算版）
 *
 * 參數分組：幾何 / 材料 / 載重 / 結果
 */
export default function SlabForm({ onResult, onParamsChange }: SlabFormProps) {
  // ── 版類型 ──
  const [slabType, setSlabType] = useState<SlabType>('one_way');

  // ── 📐 幾何參數 ──
  const [spanLx, setSpanLx] = useState(4000);
  const [spanLy, setSpanLy] = useState(5000);
  const [supportType, setSupportType] = useState<'simply' | 'continuous'>('simply');
  const [edgeCondition, setEdgeCondition] = useState<'simple' | 'continuous'>('simple');

  // ── 📦 材料參數 ──
  const [fc, setFc] = useState(28);
  const [fy, setFy] = useState(420);

  // ── ⚙️ 載重參數 ──
  const [load, setLoad] = useState(12);

  // ── 即時計算 ──
  const result = useMemo<SlabResult | null>(() => {
    if (spanLx <= 0) return null;
    if (slabType === 'two_way' && spanLy <= 0) return null;
    try {
      if (slabType === 'one_way') {
        return calcOneWaySlab(spanLx, load, fc, fy, supportType);
      }
      return calcTwoWaySlab(spanLx, spanLy, load, fc, fy, edgeCondition);
    } catch {
      return null;
    }
  }, [slabType, spanLx, spanLy, load, fc, fy, supportType, edgeCondition]);

  useEffect(() => {
    // 傳遞增強結果（含輸入參數供圖表使用）
    if (result) {
      onResult?.({ ...result, spanLx, slabType } as any);
    } else {
      onResult?.(result);
    }
  }, [result, spanLx, slabType, onResult]);

  useEffect(() => {
    onParamsChange?.({
      '版類型': slabType === 'one_way' ? '單向版' : '雙向版',
      '短向跨度 Lx': `${spanLx} mm`,
      '長向跨度 Ly': slabType === 'two_way' ? `${spanLy} mm` : '—',
      '設計載重 w': `${load} kN/m²`,
      '混凝土 fc\'': `${fc} MPa`,
      '鋼筋 fy': `${fy} MPa`,
    });
  }, [slabType, spanLx, spanLy, load, fc, fy, onParamsChange]);

  const isSafe = result?.isThicknessOK && result?.isDeflectionOK;

  return (
    <div className="space-y-6">
      {/* ── 版類型選擇 ── */}
      <div className="flex gap-3">
        <button
          onClick={() => setSlabType('one_way')}
          className={cn(
            'flex-1 px-4 py-3 rounded-lg border text-center transition-all',
            slabType === 'one_way'
              ? 'border-[#FF6D00] bg-orange-50 text-[#FF6D00]'
              : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300',
          )}
        >
          <div className="text-lg mb-1">↔️</div>
          <div className="text-sm font-medium">單向版</div>
          <div className="text-[10px] opacity-70">L₂/L₁ &gt; 2</div>
        </button>
        <button
          onClick={() => setSlabType('two_way')}
          className={cn(
            'flex-1 px-4 py-3 rounded-lg border text-center transition-all',
            slabType === 'two_way'
              ? 'border-[#FF6D00] bg-orange-50 text-[#FF6D00]'
              : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300',
          )}
        >
          <div className="text-lg mb-1">🔄</div>
          <div className="text-sm font-medium">雙向版</div>
          <div className="text-[10px] opacity-70">L₂/L₁ ≤ 2</div>
        </button>
      </div>

      {/* ═══════════════════════════════════════
          📐 幾何參數
          ═══════════════════════════════════════ */}
      <fieldset className="border-l-2 border-blue-400 pl-4">
        <legend className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 mb-1">
          <span>📐</span> 幾何參數
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <Input
            label="短向跨度 Lx"
            type="number"
            min="1000"
            max="12000"
            step="100"
            value={spanLx}
            onChange={(e) => setSpanLx(Number(e.target.value))}
            suffix={<span className="text-xs text-gray-400">mm</span>}
          />
          {slabType === 'two_way' && (
            <Input
              label="長向跨度 Ly"
              type="number"
              min="1000"
              max="12000"
              step="100"
              value={spanLy}
              onChange={(e) => setSpanLy(Number(e.target.value))}
              suffix={<span className="text-xs text-gray-400">mm</span>}
            />
          )}
          {slabType === 'one_way' ? (
            <Select
              label="支承條件"
              options={supportOptions}
              value={supportType}
              onChange={(v) => setSupportType(v as 'simply' | 'continuous')}
            />
          ) : (
            <Select
              label="邊界條件"
              options={edgeConditionOptions}
              value={edgeCondition}
              onChange={(v) => setEdgeCondition(v as 'simple' | 'continuous')}
            />
          )}
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
        <div className="mt-2">
          <Input
            label="設計載重 w"
            type="number"
            min="1"
            max="50"
            step="0.5"
            value={load}
            onChange={(e) => setLoad(Number(e.target.value))}
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
              <ResultCard label="最小版厚" value={result.h_min} unit="mm" />
              <ResultCard label="採用版厚" value={result.h_provided} unit="mm" />
              <ResultCard label="短向彎矩" value={result.Mu_x} unit="kN·m/m" />
              <ResultCard
                label="安全判定"
                value={isSafe ? '🟢 安全' : '🔴 不合格'}
                className={isSafe ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200'}
              />
            </div>

            {/* 配筋結果 */}
            <div className="mt-3 p-3 rounded-lg border border-gray-100 bg-white">
              <h5 className="text-xs font-semibold text-gray-500 mb-2">配筋結果</h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <RebarBox label="短向主筋" desc={result.rebar_desc_x} detail={`As = ${result.As_main_x} mm²/m`} />
                {slabType === 'two_way' && (
                  <RebarBox label="長向主筋" desc={result.rebar_desc_y} detail={`As = ${result.As_main_y} mm²/m`} />
                )}
                <RebarBox label="溫度鋼筋" desc={result.rebar_desc_temp} detail={`As = ${result.As_temp} mm²/m`} />
              </div>
            </div>

            {/* 檢討表 */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <CheckItem label="版厚合格" ok={result.isThicknessOK} />
              <CheckItem label="撓度合格" ok={result.isDeflectionOK} />
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

function RebarBox({ label, desc, detail }: { label: string; desc: string; detail: string }) {
  return (
    <div className="p-2.5 rounded bg-gray-50 border border-gray-100">
      <div className="text-[10px] text-gray-400 mb-0.5">{label}</div>
      <div className="text-sm font-bold font-mono text-[#FF6D00]">{desc}</div>
      <div className="text-[10px] text-gray-400 mt-0.5">{detail}</div>
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
