"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Toggle from "@/components/ui/Toggle";
import {
  calcColumn,
  calcRCColumn,
  type ColumnResult,
  type RCColumnResult,
  K_FACTOR_INFO,
} from "@/lib/civil/column";
import { H_BEAMS, getHBeamOptions } from "@/lib/civil/section";

const beamOptions = getHBeamOptions();

const kFactorOptions = K_FACTOR_INFO.map((k) => ({
  value: String(k.value),
  label: `${k.label} (k=${k.value})`,
}));

interface ColumnFormProps {
  onResult?: (result: ColumnResult | RCColumnResult | null) => void;
  onParamsChange?: (params: Record<string, any>) => void;
}

/**
 * 柱參數輸入表單（即時計算版）
 *
 * 支援鋼柱與 RC 柱切換，參數分組統一風格。
 */
export default function ColumnForm({ onResult, onParamsChange }: ColumnFormProps) {
  // ── 柱類型切換 ──
  const [isRC, setIsRC] = useState(false);

  // ── 幾何參數（鋼柱） ──
  const [length, setLength] = useState(3.5);
  const [kFactor, setKFactor] = useState('1.0');

  // ── 幾何參數（RC 柱） ──
  const [rcB, setRcB] = useState(400);
  const [rcH, setRcH] = useState(400);

  // ── 材料參數（鋼柱） ──
  const [selectedBeamName, setSelectedBeamName] = useState('H300×300×10×15');

  // ── 材料參數（RC 柱） ──
  const [rcFc, setRcFc] = useState(28);
  const [rcFy, setRcFy] = useState(420);

  // ── 載重參數（鋼柱） ──
  const [axialLoad, setAxialLoad] = useState(500);

  // ── 載重參數（RC 柱） ──
  const [rcPu, setRcPu] = useState(2000);
  const [rcMu, setRcMu] = useState(300);

  const selectedBeam = H_BEAMS.find((b) => b.name === selectedBeamName);

  // ── 即時計算 ──
  const steelResult = useMemo<ColumnResult | null>(() => {
    if (isRC) return null;
    if (length <= 0 || axialLoad <= 0 || !selectedBeam) return null;
    try {
      return calcColumn(length, axialLoad, selectedBeam, Number(kFactor));
    } catch {
      return null;
    }
  }, [isRC, length, axialLoad, kFactor, selectedBeam]);

  const rcResult = useMemo<RCColumnResult | null>(() => {
    if (!isRC) return null;
    if (rcB <= 0 || rcH <= 0 || rcFc <= 0 || rcFy <= 0) return null;
    try {
      return calcRCColumn(rcPu, rcMu, rcB, rcH, rcFc, rcFy);
    } catch {
      return null;
    }
  }, [isRC, rcPu, rcMu, rcB, rcH, rcFc, rcFy]);

  const result = isRC ? rcResult : steelResult;

  useEffect(() => {
    // 傳遞增強結果（含輸入參數供圖表使用）
    if (isRC && rcResult) {
      onResult?.(({
        ...rcResult,
        Pu: rcPu,
        Mu: rcMu,
        b: rcB,
        h: rcH,
      }) as any);
    } else {
      onResult?.(result);
    }
  }, [result, isRC, rcResult, rcPu, rcMu, rcB, rcH, onResult]);

  useEffect(() => {
    if (isRC) {
      onParamsChange?.({
        '斷面': `${rcB}×${rcH} mm`,
        '混凝土': `fc'=${rcFc} MPa`,
        '鋼筋': `fy=${rcFy} MPa`,
        '設計軸力 Pu': `${rcPu} kN`,
        '設計彎矩 Mu': `${rcMu} kN·m`,
      });
    } else {
      onParamsChange?.({
        '柱長度 L': `${length} m`,
        '軸向載重 P': `${axialLoad} kN`,
        '有效長度係數 k': kFactor,
        '型鋼': selectedBeam?.name ?? '未選擇',
      });
    }
  }, [isRC, length, axialLoad, kFactor, selectedBeam, rcB, rcH, rcFc, rcFy, rcPu, rcMu, onParamsChange]);

  // ── 安全狀態 ──
  const safetyLabel = result
    ? result.isSafe ? '🟢 安全' : '🔴 不合格'
    : '—';
  const safetyClass = result
    ? result.isSafe
      ? 'text-green-600 bg-green-50 border-green-200'
      : 'text-red-600 bg-red-50 border-red-200'
    : 'text-gray-400';

  return (
    <div className="space-y-6">
      {/* ── 柱類型切換 ── */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <span className="text-sm font-medium text-gray-800">
            {isRC ? '🏛️ RC 柱' : '🔩 鋼柱'}
          </span>
          <span className="ml-2 text-xs text-gray-400">
            {isRC ? '鋼筋混凝土柱設計（PM 曲線）' : '鋼結構柱設計（尤拉挫屈）'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">鋼柱</span>
          <Toggle checked={isRC} onChange={setIsRC} label="" />
          <span className="text-xs text-gray-400">RC 柱</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          📐 幾何參數
          ═══════════════════════════════════════ */}
      <fieldset className="border-l-2 border-blue-400 pl-4">
        <legend className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 mb-1">
          <span>📐</span> 幾何參數
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          {!isRC ? (
            <>
              <Input
                label="柱長度 L"
                type="number"
                step="0.1"
                min="0.1"
                max="30"
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                suffix={<span className="text-xs text-gray-400">m</span>}
              />
              <Select
                label="有效長度係數 k"
                options={kFactorOptions}
                value={kFactor}
                onChange={setKFactor}
              />
            </>
          ) : (
            <>
              <Input
                label="斷面寬度 b"
                type="number"
                step="10"
                min="200"
                max="1200"
                value={rcB}
                onChange={(e) => setRcB(Number(e.target.value))}
                suffix={<span className="text-xs text-gray-400">mm</span>}
              />
              <Input
                label="斷面深度 h"
                type="number"
                step="10"
                min="200"
                max="1200"
                value={rcH}
                onChange={(e) => setRcH(Number(e.target.value))}
                suffix={<span className="text-xs text-gray-400">mm</span>}
              />
            </>
          )}
        </div>

        {/* k 係數快捷按鈕（鋼柱） */}
        {!isRC && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
            {K_FACTOR_INFO.map((k) => (
              <button
                key={k.value}
                onClick={() => setKFactor(String(k.value))}
                className={cn(
                  'text-[10px] px-2 py-1.5 rounded border text-left transition-colors',
                  kFactor === String(k.value)
                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300',
                )}
              >
                <div className="font-semibold">{k.label}</div>
                <div className="opacity-75">{k.description}</div>
              </button>
            ))}
          </div>
        )}
      </fieldset>

      {/* ═══════════════════════════════════════
          📦 材料參數
          ═══════════════════════════════════════ */}
      <fieldset className="border-l-2 border-green-400 pl-4">
        <legend className="flex items-center gap-1.5 text-sm font-semibold text-green-600 mb-1">
          <span>📦</span> 材料參數
        </legend>
        <div className="mt-2">
          {!isRC ? (
            <Select
              label="型鋼選擇"
              options={beamOptions}
              value={selectedBeamName}
              onChange={setSelectedBeamName}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="混凝土強度 fc'"
                type="number"
                step="5"
                min="14"
                max="70"
                value={rcFc}
                onChange={(e) => setRcFc(Number(e.target.value))}
                suffix={<span className="text-xs text-gray-400">MPa</span>}
              />
              <Input
                label="鋼筋降伏強度 fy"
                type="number"
                step="20"
                min="280"
                max="700"
                value={rcFy}
                onChange={(e) => setRcFy(Number(e.target.value))}
                suffix={<span className="text-xs text-gray-400">MPa</span>}
              />
            </div>
          )}
        </div>

        {/* 斷面資訊（鋼柱） */}
        {!isRC && selectedBeam && (
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-500">
            <div className="px-2 py-1.5 rounded bg-green-50 border border-green-100">
              <span className="block text-gray-400">面積</span>
              <span className="font-mono font-medium text-gray-700">{selectedBeam.area} cm²</span>
            </div>
            <div className="px-2 py-1.5 rounded bg-green-50 border border-green-100">
              <span className="block text-gray-400">Ix</span>
              <span className="font-mono font-medium text-gray-700">{selectedBeam.Ix} cm⁴</span>
            </div>
            <div className="px-2 py-1.5 rounded bg-green-50 border border-green-100">
              <span className="block text-gray-400">rx</span>
              <span className="font-mono font-medium text-gray-700">{selectedBeam.rx ?? '—'} cm</span>
            </div>
            <div className="px-2 py-1.5 rounded bg-green-50 border border-green-100">
              <span className="block text-gray-400">重量</span>
              <span className="font-mono font-medium text-gray-700">{selectedBeam.weight} kg/m</span>
            </div>
          </div>
        )}
      </fieldset>

      {/* ═══════════════════════════════════════
          ⚙️ 載重參數
          ═══════════════════════════════════════ */}
      <fieldset className="border-l-2 border-orange-400 pl-4">
        <legend className="flex items-center gap-1.5 text-sm font-semibold text-orange-600 mb-1">
          <span>⚙️</span> 載重參數
        </legend>
        <div className="mt-2">
          {!isRC ? (
            <Input
              label="軸向載重 P"
              type="number"
              step="10"
              min="1"
              value={axialLoad}
              onChange={(e) => setAxialLoad(Number(e.target.value))}
              suffix={<span className="text-xs text-gray-400">kN</span>}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="設計軸壓力 Pu"
                type="number"
                step="50"
                min="0"
                value={rcPu}
                onChange={(e) => setRcPu(Number(e.target.value))}
                suffix={<span className="text-xs text-gray-400">kN</span>}
              />
              <Input
                label="設計彎矩 Mu"
                type="number"
                step="10"
                min="0"
                value={rcMu}
                onChange={(e) => setRcMu(Number(e.target.value))}
                suffix={<span className="text-xs text-gray-400">kN·m</span>}
              />
            </div>
          )}
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
              {!isRC && 'slenderness' in result && (
                <>
                  <ResultCard label="長細比 λ" value={result.slenderness} unit="" />
                  <ResultCard label="臨界載重 Pcr" value={result.criticalLoad} unit="kN" />
                  <ResultCard label="容許載重 Pa" value={result.allowableLoad} unit="kN" />
                  <ResultCard label="安全判定" value={safetyLabel} className={safetyClass} />
                </>
              )}
              {isRC && 'As_total' in result && (
                <>
                  <ResultCard label="鋼筋量 As" value={result.As_total} unit="mm²" />
                  <ResultCard label="鋼筋比 ρg" value={(result.rho_g * 100).toFixed(2)} unit="%" />
                  <ResultCard label="最大強度 φPn" value={result.phiPn_max} unit="kN" />
                  <ResultCard label="安全判定" value={safetyLabel} className={safetyClass} />
                </>
              )}
            </div>

            {isRC && 'safetyRatio' in result && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>使用率</span>
                  <span className="font-mono font-medium">{(result.safetyRatio * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      result.isSafe ? 'bg-green-500' : 'bg-red-500',
                    )}
                    style={{ width: `${Math.min(result.safetyRatio * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {isRC && 'bars' in result && (
              <div className="mt-3 p-3 rounded-lg border border-gray-100 bg-white">
                <h5 className="text-xs font-semibold text-gray-500 mb-2">配筋細節</h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="block text-gray-400">配筋</span>
                    <span className="font-mono font-medium text-gray-700">
                      {(result as RCColumnResult).bars.join(' + ')}
                    </span>
                  </div>
                  <div>
                    <span className="block text-gray-400">圍束間距</span>
                    <span className="font-mono font-medium text-gray-700">
                      D10@{(result as RCColumnResult).tieSpacing}mm
                    </span>
                  </div>
                  <div>
                    <span className="block text-gray-400">ρg 範圍</span>
                    <span className="font-mono font-medium text-gray-700">
                      {(result as RCColumnResult).rho_g_min} ~ {(result as RCColumnResult).rho_g_max}
                    </span>
                  </div>
                  <div>
                    <span className="block text-gray-400">安全係數</span>
                    <span className="font-mono font-medium text-gray-700">
                      {(result as RCColumnResult).safetyRatio.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </fieldset>
    </div>
  );
}

// ── 結果卡片子元件 ──
function ResultCard({
  label,
  value,
  unit,
  className,
}: {
  label: string;
  value: string | number;
  unit?: string;
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg border border-gray-100 bg-white p-3 text-center', className)}>
      <div className="text-[10px] text-gray-500 mb-1 font-medium">{label}</div>
      <div className="text-lg font-bold font-mono text-gray-800">
        {value}
        {unit && <span className="text-xs font-normal text-gray-400 ml-0.5">{unit}</span>}
      </div>
    </div>
  );
}
