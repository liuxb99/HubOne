"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import {
  calcBoltConnection,
  calcWeld,
  BOLT_DIAMETERS,
  ELECTRODE_OPTIONS,
  type BoltConnection,
  type WeldResult,
  type BoltGrade,
  type ConnectionType,
} from "@/lib/civil/steel";

type SteelTab = 'bolt' | 'weld';

const boltGradeOptions = [
  { value: 'A325', label: 'A325 (常用)' },
  { value: 'A490', label: 'A490 (高強度)' },
];

const connectionTypeOptions = [
  { value: 'bearing', label: '承壓連接' },
  { value: 'slip-critical', label: '滑動臨界' },
];

const boltDiameterOptions = BOLT_DIAMETERS.map((d) => ({
  value: String(d),
  label: `M${d} (ø${d}mm)`,
}));

const electrodeOptions = ELECTRODE_OPTIONS.map((e) => ({
  value: e,
  label: e,
}));

interface SteelFormProps {
  onResult?: (result: any) => void;
  onParamsChange?: (params: Record<string, any>) => void;
}

/**
 * 鋼構設計表單（即時計算版）
 *
 * 支援螺栓連接與銲接設計，參數分組統一風格。
 */
export default function SteelForm({ onResult, onParamsChange }: SteelFormProps) {
  const [activeTab, setActiveTab] = useState<SteelTab>('bolt');

  // ── 螺栓參數 ──
  // 📐 幾何參數
  const [diameter, setDiameter] = useState('22');
  // 📦 材料參數
  const [grade, setGrade] = useState<BoltGrade>('A325');
  const [connType, setConnType] = useState<ConnectionType>('bearing');
  // ⚙️ 載重參數
  const [shearForce, setShearForce] = useState(200);
  const [tensionForce, setTensionForce] = useState(0);

  // ── 銲接參數 ──
  // 📐 幾何參數
  const [weldSize, setWeldSize] = useState(8);
  const [weldLength, setWeldLength] = useState(200);
  const [angle, setAngle] = useState(0);
  // 📦 材料參數
  const [electrode, setElectrode] = useState('E70');
  // ⚙️ 載重參數
  const [weldForce, setWeldForce] = useState(200);

  // ── 即時計算 ──
  const boltResult = useMemo<BoltConnection | null>(() => {
    if (activeTab !== 'bolt') return null;
    if (shearForce <= 0 && tensionForce <= 0) return null;
    try {
      return calcBoltConnection(shearForce, tensionForce, Number(diameter), grade, connType);
    } catch {
      return null;
    }
  }, [activeTab, shearForce, tensionForce, diameter, grade, connType]);

  const weldResult = useMemo<WeldResult | null>(() => {
    if (activeTab !== 'weld') return null;
    if (weldForce <= 0 || weldSize <= 0 || weldLength <= 0) return null;
    try {
      return calcWeld(weldForce, weldSize, weldLength, electrode, angle);
    } catch {
      return null;
    }
  }, [activeTab, weldForce, weldSize, weldLength, electrode, angle]);

  const result = activeTab === 'bolt' ? boltResult : weldResult;

  useEffect(() => {
    // 傳遞增強結果（含輸入參數供圖表使用）
    if (activeTab === 'bolt' && boltResult) {
      onResult?.({ ...boltResult, diameter: Number(diameter) } as any);
    } else if (activeTab === 'weld' && weldResult) {
      onResult?.({ ...weldResult, weldSize, weldLength, electrode } as any);
    } else {
      onResult?.(result);
    }
  }, [result, activeTab, boltResult, weldResult, diameter, weldSize, weldLength, electrode, onResult]);

  useEffect(() => {
    if (activeTab === 'bolt') {
      onParamsChange?.({
        '連接類型': '螺栓連接',
        '螺栓直徑': `M${diameter}`,
        '螺栓等級': grade,
        '剪力 Pu': `${shearForce} kN`,
        '拉力 Tu': `${tensionForce} kN`,
      });
    } else {
      onParamsChange?.({
        '連接類型': '銲接設計',
        '銲道尺寸': `${weldSize} mm`,
        '銲道長度': `${weldLength} mm`,
        '電極': electrode,
        '受力角度': `${angle}°`,
      });
    }
  }, [activeTab, diameter, grade, shearForce, tensionForce, weldSize, weldLength, electrode, angle, onParamsChange]);

  const isSafe = activeTab === 'bolt'
    ? (boltResult?.isShearOK && boltResult?.isTensionOK) ?? false
    : (weldResult?.isOK) ?? false;

  return (
    <div className="space-y-6">
      {/* ── 切換分頁 ── */}
      <div className="flex gap-1 border-b border-gray-200 pb-0">
        <button
          onClick={() => setActiveTab('bolt')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium rounded-t-lg border border-b-0 transition-colors',
            activeTab === 'bolt'
              ? 'border-gray-200 bg-white text-[#FF6D00] -mb-px'
              : 'border-transparent text-gray-400 hover:text-gray-600',
          )}
        >
          🔩 螺栓連接
        </button>
        <button
          onClick={() => setActiveTab('weld')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium rounded-t-lg border border-b-0 transition-colors',
            activeTab === 'weld'
              ? 'border-gray-200 bg-white text-[#FF6D00] -mb-px'
              : 'border-transparent text-gray-400 hover:text-gray-600',
          )}
        >
          ⚡ 銲接設計
        </button>
      </div>

      {/* ════════════ 螺栓連接 ════════════ */}
      {activeTab === 'bolt' && (
        <div className="space-y-6 pt-2">
          {/* 📐 幾何參數 */}
          <fieldset className="border-l-2 border-blue-400 pl-4">
            <legend className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 mb-1">
              <span>📐</span> 幾何參數
            </legend>
            <div className="mt-2">
              <Select
                label="螺栓直徑"
                options={boltDiameterOptions}
                value={diameter}
                onChange={setDiameter}
              />
            </div>
          </fieldset>

          {/* 📦 材料參數 */}
          <fieldset className="border-l-2 border-green-400 pl-4">
            <legend className="flex items-center gap-1.5 text-sm font-semibold text-green-600 mb-1">
              <span>📦</span> 材料參數
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <Select
                label="螺栓等級"
                options={boltGradeOptions}
                value={grade}
                onChange={(v) => setGrade(v as BoltGrade)}
              />
              <Select
                label="連接類型"
                options={connectionTypeOptions}
                value={connType}
                onChange={(v) => setConnType(v as ConnectionType)}
              />
            </div>
          </fieldset>

          {/* ⚙️ 載重參數 */}
          <fieldset className="border-l-2 border-orange-400 pl-4">
            <legend className="flex items-center gap-1.5 text-sm font-semibold text-orange-600 mb-1">
              <span>⚙️</span> 載重參數
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <Input
                label="需求剪力 Pu"
                type="number"
                min="0"
                max="5000"
                step="10"
                value={shearForce}
                onChange={(e) => setShearForce(Number(e.target.value))}
                suffix={<span className="text-xs text-gray-400">kN</span>}
              />
              <Input
                label="需求拉力 Tu（選填）"
                type="number"
                min="0"
                max="5000"
                step="10"
                value={tensionForce}
                onChange={(e) => setTensionForce(Number(e.target.value))}
                suffix={<span className="text-xs text-gray-400">kN</span>}
              />
            </div>
          </fieldset>

          {/* 📊 計算結果 */}
          <fieldset className="border-l-2 border-emerald-400 pl-4">
            <legend className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 mb-1">
              <span>📊</span> 計算結果
            </legend>
            {!boltResult ? (
              <div className="flex items-center justify-center py-6 text-sm text-gray-400">
                請輸入載重參數
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                  <ResultCard label="螺栓數" value={boltResult.boltCount} unit="支" />
                  <ResultCard label="抗剪容量" value={boltResult.shearCapacity} unit="kN" />
                  <ResultCard label="抗拉容量" value={boltResult.tensionCapacity} unit="kN" />
                  <ResultCard
                    label="安全判定"
                    value={isSafe ? '🟢 安全' : '🔴 不合格'}
                    className={isSafe ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200'}
                  />
                </div>
                {boltResult.steps && boltResult.steps.length > 0 && (
                  <details className="mt-3">
                    <summary className="text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700">
                      檢視計算過程
                    </summary>
                    <div className="mt-2 space-y-1">
                      {boltResult.steps.map((step, i) => (
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
      )}

      {/* ════════════ 銲接設計 ════════════ */}
      {activeTab === 'weld' && (
        <div className="space-y-6 pt-2">
          {/* 📐 幾何參數 */}
          <fieldset className="border-l-2 border-blue-400 pl-4">
            <legend className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 mb-1">
              <span>📐</span> 幾何參數
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <Input
                label="銲道尺寸 w"
                type="number"
                min="3"
                max="30"
                step="1"
                value={weldSize}
                onChange={(e) => setWeldSize(Number(e.target.value))}
                suffix={<span className="text-xs text-gray-400">mm</span>}
              />
              <Input
                label="銲道長度 L"
                type="number"
                min="20"
                max="1000"
                step="10"
                value={weldLength}
                onChange={(e) => setWeldLength(Number(e.target.value))}
                suffix={<span className="text-xs text-gray-400">mm</span>}
              />
            </div>
          </fieldset>

          {/* 📦 材料參數 */}
          <fieldset className="border-l-2 border-green-400 pl-4">
            <legend className="flex items-center gap-1.5 text-sm font-semibold text-green-600 mb-1">
              <span>📦</span> 材料參數
            </legend>
            <div className="mt-2">
              <Select
                label="電極規格"
                options={electrodeOptions}
                value={electrode}
                onChange={setElectrode}
              />
            </div>
          </fieldset>

          {/* ⚙️ 載重參數 */}
          <fieldset className="border-l-2 border-orange-400 pl-4">
            <legend className="flex items-center gap-1.5 text-sm font-semibold text-orange-600 mb-1">
              <span>⚙️</span> 載重參數
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <Input
                label="需求強度 Pu"
                type="number"
                min="1"
                max="5000"
                step="10"
                value={weldForce}
                onChange={(e) => setWeldForce(Number(e.target.value))}
                suffix={<span className="text-xs text-gray-400">kN</span>}
              />
              <Input
                label="受力角度"
                type="number"
                min="0"
                max="90"
                step="15"
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
                suffix={<span className="text-xs text-gray-400">°</span>}
              />
            </div>
          </fieldset>

          {/* 📊 計算結果 */}
          <fieldset className="border-l-2 border-emerald-400 pl-4">
            <legend className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 mb-1">
              <span>📊</span> 計算結果
            </legend>
            {!weldResult ? (
              <div className="flex items-center justify-center py-6 text-sm text-gray-400">
                請輸入載重參數
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                  <ResultCard label="銲道容量" value={weldResult.capacity} unit="kN" />
                  <ResultCard label="使用率" value={`${(weldResult.ratio * 100).toFixed(1)}%`} />
                  <ResultCard
                    label="安全判定"
                    value={isSafe ? '🟢 安全' : '🔴 不合格'}
                    className={isSafe ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200'}
                  />
                </div>
                {weldResult.steps && weldResult.steps.length > 0 && (
                  <details className="mt-3">
                    <summary className="text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700">
                      檢視計算過程
                    </summary>
                    <div className="mt-2 space-y-1">
                      {weldResult.steps.map((step, i) => (
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
      )}
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
