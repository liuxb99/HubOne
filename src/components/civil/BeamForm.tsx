"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import { calcBeam, type BeamResult, type BeamLoad, type SupportType } from "@/lib/civil/beam";
import { H_BEAMS, getHBeamOptions } from "@/lib/civil/section";

const beamOptions = getHBeamOptions();

const supportOptions = [
  { value: 'simply', label: '簡支梁' },
  { value: 'fixed', label: '固定梁' },
  { value: 'cantilever', label: '懸臂梁' },
];

interface LoadItem {
  id: string;
  type: 'point' | 'udl';
  value: number;
  position?: number;
  start?: number;
  end?: number;
}

interface BeamFormProps {
  onResult?: (result: BeamResult | null) => void;
  onParamsChange?: (params: Record<string, any>) => void;
}

/**
 * 梁參數輸入表單（即時計算版）
 *
 * 參數分組：
 *   📐 幾何參數（藍色左邊框）
 *   📦 材料參數（綠色左邊框）
 *   ⚙️ 載重參數（橙色左邊框）
 *   📊 計算結果（翠綠色左邊框）
 *
 * 使用 useMemo 自動即時計算，無需按計算按鈕。
 */
export default function BeamForm({ onResult, onParamsChange }: BeamFormProps) {
  // ── 幾何參數 ──
  const [length, setLength] = useState(6);
  const [supportType, setSupportType] = useState<SupportType>('simply');

  // ── 材料參數 ──
  const [selectedBeamName, setSelectedBeamName] = useState('H300×300×10×15');

  // ── 載重參數 ──
  const [loads, setLoads] = useState<LoadItem[]>([
    { id: '1', type: 'point', value: 50, position: 3 },
  ]);

  const selectedBeam = H_BEAMS.find((b) => b.name === selectedBeamName);

  // ── 即時計算 ──
  const result = useMemo<BeamResult | null>(() => {
    if (length <= 0) return null;
    if (!selectedBeam) return null;

    try {
      const beamLoads: BeamLoad[] = loads.map((l) => {
        if (l.type === 'point') {
          return { type: 'point', value: l.value, position: l.position ?? length / 2 };
        }
        return { type: 'udl', value: l.value, start: l.start ?? 0, end: l.end ?? length };
      });
      return calcBeam(length, supportType, beamLoads, selectedBeam);
    } catch {
      return null;
    }
  }, [length, supportType, loads, selectedBeam]);

  // ── 向上傳遞結果 ──
  useEffect(() => {
    onResult?.(result);
  }, [result, onResult]);

  useEffect(() => {
    onParamsChange?.({
      '梁長度 L': `${length} m`,
      '支承類型': supportOptions.find((o) => o.value === supportType)?.label ?? supportType,
      '載重數': `${loads.length} 個`,
      '型鋼': selectedBeam?.name ?? '未選擇',
    });
  }, [length, supportType, loads, selectedBeam, onParamsChange]);

  // ── 載重操作 ──
  const addLoad = useCallback(
    (type: 'point' | 'udl') => {
      const newId = String(Date.now());
      const newLoad: LoadItem = {
        id: newId,
        type,
        value: type === 'point' ? 10 : 5,
        position: type === 'point' ? length / 2 : undefined,
        start: type === 'udl' ? 0 : undefined,
        end: type === 'udl' ? length : undefined,
      };
      setLoads((prev) => [...prev, newLoad]);
    },
    [length],
  );

  const removeLoad = useCallback((id: string) => {
    setLoads((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((l) => l.id !== id);
    });
  }, []);

  const updateLoad = useCallback((id: string, field: keyof LoadItem, value: any) => {
    setLoads((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  }, []);

  // ── 安全狀態 ──
  const safetyLabel = result ? (result.isSafe ? '🟢 安全' : '🔴 不合格') : '—';
  const safetyClass = result
    ? result.isSafe
      ? 'text-green-600 bg-green-50 border-green-200'
      : 'text-red-600 bg-red-50 border-red-200'
    : 'text-gray-400';

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════
          📐 幾何參數
          ═══════════════════════════════════════ */}
      <fieldset className="border-l-2 border-blue-400 pl-4">
        <legend className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 mb-1">
          <span>📐</span> 幾何參數
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <Input
            label="梁長度 L"
            type="number"
            step="0.1"
            min="0.1"
            max="50"
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            suffix={<span className="text-xs text-gray-400">m</span>}
          />
          <Select
            label="支承類型"
            options={supportOptions}
            value={supportType}
            onChange={(v) => setSupportType(v as SupportType)}
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
        <div className="mt-2">
          <Select
            label="型鋼選擇"
            options={beamOptions}
            value={selectedBeamName}
            onChange={setSelectedBeamName}
          />
        </div>
        {selectedBeam && (
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
              <span className="block text-gray-400">Zx</span>
              <span className="font-mono font-medium text-gray-700">{selectedBeam.Zx} cm³</span>
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
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Button variant="secondary" size="sm" onClick={() => addLoad('point')}>
            ＋ 集中載重
          </Button>
          <Button variant="secondary" size="sm" onClick={() => addLoad('udl')}>
            ＋ 均佈載重
          </Button>
          <span className="text-[10px] text-gray-400 ml-1">
            {loads.length} 個載重
          </span>
        </div>

        {loads.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4 mt-2">
            尚未添加載重，請按上方按鈕添加
          </p>
        )}

        <div className="space-y-2 mt-3">
          {loads.map((load) => (
            <div
              key={load.id}
              className="flex flex-wrap items-end gap-2 p-2.5 rounded bg-orange-50/40 border border-orange-100"
            >
              <Badge variant={load.type === 'point' ? 'info' : 'warning'}>
                {load.type === 'point' ? '集中' : '均佈'}
              </Badge>

              <div className="flex-1 min-w-[80px]">
                <label className="text-[10px] text-gray-400 block mb-0.5">
                  數值 (kN{load.type === 'udl' ? '/m' : ''})
                </label>
                <input
                  type="number"
                  step="1"
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded bg-white text-gray-800"
                  value={load.value}
                  onChange={(e) => updateLoad(load.id, 'value', Number(e.target.value))}
                />
              </div>

              {load.type === 'point' && (
                <div className="min-w-[80px]">
                  <label className="text-[10px] text-gray-400 block mb-0.5">位置 (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded bg-white text-gray-800"
                    value={load.position ?? length / 2}
                    onChange={(e) => updateLoad(load.id, 'position', Number(e.target.value))}
                  />
                </div>
              )}

              {load.type === 'udl' && (
                <>
                  <div className="min-w-[70px]">
                    <label className="text-[10px] text-gray-400 block mb-0.5">起點 (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded bg-white text-gray-800"
                      value={load.start ?? 0}
                      onChange={(e) => updateLoad(load.id, 'start', Number(e.target.value))}
                    />
                  </div>
                  <div className="min-w-[70px]">
                    <label className="text-[10px] text-gray-400 block mb-0.5">終點 (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded bg-white text-gray-800"
                      value={load.end ?? length}
                      onChange={(e) => updateLoad(load.id, 'end', Number(e.target.value))}
                    />
                  </div>
                </>
              )}

              <button
                onClick={() => removeLoad(load.id)}
                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                title="刪除載重"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
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
            {/* 關鍵數值卡片 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
              {[
                { label: '最大彎矩 Mmax', value: result.maxMoment, unit: 'kN·m', color: 'text-red-600' },
                { label: '最大剪力 Vmax', value: result.maxShear, unit: 'kN', color: 'text-blue-600' },
                { label: '最大撓度 δmax', value: result.maxDeflection, unit: 'mm', color: 'text-gray-500' },
                { label: '安全判定', value: safetyLabel, unit: '', className: safetyClass },
              ].map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    'rounded-lg border bg-white p-3 text-center',
                    item.className || 'border-gray-100',
                  )}
                >
                  <div className="text-[10px] text-gray-500 mb-1 font-medium">
                    {item.label}
                  </div>
                  <div className={cn('text-lg font-bold font-mono', item.color || 'text-gray-800')}>
                    {typeof item.value === 'number' ? item.value.toFixed(1) : item.value}
                    {item.unit && (
                      <span className="text-xs font-normal text-gray-400 ml-0.5">
                        {item.unit}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 使用率條 */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>斷面使用率</span>
                <span className="font-mono font-medium">
                  {(result.safetyRatio * 100).toFixed(1)}%
                </span>
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

            {/* 反力 */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-gray-50">
                <span>左端反力 R<sub>L</sub></span>
                <span className="font-mono font-medium text-gray-700 ml-auto">
                  {result.reactions.left.toFixed(1)} kN
                </span>
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-gray-50">
                <span>右端反力 R<sub>R</sub></span>
                <span className="font-mono font-medium text-gray-700 ml-auto">
                  {result.reactions.right.toFixed(1)} kN
                </span>
              </div>
            </div>
          </>
        )}
      </fieldset>
    </div>
  );
}
