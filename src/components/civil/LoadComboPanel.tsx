"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

import {
  LOAD_COMBINATIONS,
  LOAD_TYPE_LABELS,
  LOAD_TYPE_COLORS,
  calcAllCombinations,
  type LoadCase,
  type LoadType,
} from "@/lib/civil/load";

interface LoadComboPanelProps {
  onResult?: (result: any) => void;
  onParamsChange?: (params: Record<string, any>) => void;
}

const loadTypeOptions = (Object.entries(LOAD_TYPE_LABELS) as [LoadType, string][]).map(
  ([value, label]) => ({ value, label }),
);

/**
 * 荷載組合面板
 *
 * 功能：
 * - 添加荷載（類型、數值、描述）
 * - 荷載列表（可刪除）
 * - 選擇組合方式
 * - 計算結果顯示
 */
export default function LoadComboPanel({ onResult, onParamsChange }: LoadComboPanelProps) {
  const [loads, setLoads] = useState<LoadCase[]>([
    { type: 'DL', value: 100, description: '結構自重' },
    { type: 'LL', value: 50, description: '活載重' },
  ]);
  const [newType, setNewType] = useState<LoadType>('DL');
  const [newValue, setNewValue] = useState(20);
  const [newDesc, setNewDesc] = useState('');

  /** 添加荷載 */
  const addLoad = useCallback(() => {
    if (newValue <= 0) return;
    setLoads((prev) => [
      ...prev,
      {
        type: newType,
        value: newValue,
        description: newDesc || LOAD_TYPE_LABELS[newType],
      },
    ]);
    setNewDesc('');
  }, [newType, newValue, newDesc]);

  /** 刪除荷載 */
  const removeLoad = useCallback((index: number) => {
    setLoads((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /** 即時計算所有組合 */
  const comboResults = useMemo(() => calcAllCombinations(loads), [loads]);

  // 找出最不利組合（最大值）
  const maxCombo = useMemo(
    () =>
      comboResults.reduce(
        (max, curr) => (curr.value > max.value ? curr : max),
        comboResults[0],
      ),
    [comboResults],
  );

  // 向上傳遞結果
  const comboResultData = useMemo(
    () => ({
      comboResults,
      maxCombo,
      totalLoad: loads.reduce((sum, l) => sum + l.value, 0),
    }),
    [comboResults, maxCombo, loads],
  );

  useEffect(() => {
    onResult?.(comboResultData);
  }, [comboResultData, onResult]);

  useEffect(() => {
    onParamsChange?.({
      '荷載數': `${loads.length} 個`,
      '荷載總計': `${loads.reduce((sum, l) => sum + l.value, 0).toFixed(1)} kN`,
      '最不利組合': maxCombo ? `${maxCombo.name} = ${maxCombo.value.toFixed(1)} kN` : '—',
    });
  }, [loads, maxCombo, onParamsChange]);

  return (
    <div className="space-y-6">
      {/* ── 添加荷載 ── */}
      <div className="rounded-lg border border-[var(--border)] bg-white p-4">
        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          添加荷載
        </h4>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[140px]">
            <Select
              label="荷載類型"
              options={loadTypeOptions}
              value={newType}
              onChange={(v) => setNewType(v as LoadType)}
            />
          </div>

          <div className="min-w-[100px]">
            <Input
              label="數值"
              type="number"
              step="1"
              min="0"
              value={newValue}
              onChange={(e) => setNewValue(Number(e.target.value))}
              suffix={<span className="text-xs text-[var(--text-tertiary)]">kN</span>}
            />
          </div>

          <div className="min-w-[160px] flex-1">
            <Input
              label="描述（選填）"
              placeholder={LOAD_TYPE_LABELS[newType]}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={addLoad}
            disabled={newValue <= 0}
            className="mb-0.5"
          >
            新增
          </Button>
        </div>
      </div>

      {/* ── 荷載列表 ── */}
      <div className="rounded-lg border border-[var(--border)] bg-white p-4">
        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          荷載列表
        </h4>

        {loads.length === 0 ? (
          <p className="text-xs text-[var(--text-tertiary)] text-center py-4">
            尚未添加荷載，請在上方輸入
          </p>
        ) : (
          <div className="space-y-1.5">
            {loads.map((load, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-3 py-2 rounded bg-[var(--bg-secondary)] border border-[var(--border-light)]"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-mono font-medium leading-tight border bg-transparent"
                    style={{
                      color: LOAD_TYPE_COLORS[load.type],
                      borderColor: LOAD_TYPE_COLORS[load.type],
                    }}
                  >
                    {load.type}
                  </span>
                  <span className="text-sm font-mono font-medium text-[var(--text-primary)]">
                    {load.value} kN
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {load.description}
                  </span>
                </div>
                <button
                  onClick={() => removeLoad(index)}
                  className="text-[var(--text-tertiary)] hover:text-error transition-colors p-1"
                  title="刪除"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 組合結果 ── */}
      <div className="rounded-lg border border-[var(--border)] bg-white p-4">
        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          組合結果
        </h4>

        {/* 總計 */}
        <div className="flex items-center justify-between mb-3 p-3 rounded bg-[var(--bg-tertiary)]">
          <span className="text-sm text-[var(--text-secondary)]">荷載總計</span>
          <span className="text-lg font-bold font-mono text-[var(--text-primary)]">
            {loads.reduce((sum, l) => sum + l.value, 0).toFixed(1)} kN
          </span>
        </div>

        {/* 最不利組合 */}
        {comboResults.length > 0 && (
          <div className="mb-3 p-3 rounded border border-[var(--theme-color)]/30 bg-[var(--theme-color)]/5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[var(--theme-color)]">
                  最不利組合
                </span>
                <span className="text-xs text-[var(--text-tertiary)] ml-2">
                  {maxCombo.name}: {maxCombo.formula}
                </span>
              </div>
              <span className="text-xl font-bold font-mono text-[var(--theme-color)]">
                {maxCombo.value.toFixed(1)} kN
              </span>
            </div>
          </div>
        )}

        {/* 所有組合列表 */}
        <div className="space-y-1">
          {comboResults.map((combo) => {
            const isMax = combo.name === maxCombo.name;
            return (
              <div
                key={combo.name}
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded text-sm',
                  isMax
                    ? 'bg-[var(--theme-color)]/5 border border-[var(--theme-color)]/20'
                    : 'border border-transparent hover:bg-[var(--bg-secondary)]',
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[var(--text-secondary)]">
                    {combo.name}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {combo.formula}
                  </span>
                </div>
                <span
                  className={cn(
                    'font-mono font-medium',
                    isMax ? 'text-[var(--theme-color)] text-base' : 'text-[var(--text-primary)]',
                  )}
                >
                  {combo.value.toFixed(1)} kN
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 組合對照表 ── */}
      <details className="rounded-lg border border-[var(--border)] bg-white">
        <summary className="px-4 py-3 text-sm font-medium text-[var(--text-primary)] cursor-pointer hover:bg-[var(--bg-secondary)]">
          載重組合係數對照表
        </summary>
        <div className="px-4 pb-3 overflow-x-auto">
          <table className="w-full text-xs text-[var(--text-secondary)]">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-1.5 pr-2">組合</th>
                <th className="text-left py-1.5 px-2">公式</th>
                <th className="text-left py-1.5 px-2">說明</th>
              </tr>
            </thead>
            <tbody>
              {LOAD_COMBINATIONS.map((combo) => (
                <tr key={combo.name} className="border-b border-[var(--border-light)] last:border-0">
                  <td className="py-1.5 pr-2 font-mono">{combo.name}</td>
                  <td className="py-1.5 px-2 font-mono">{combo.formula}</td>
                  <td className="py-1.5 px-2">{combo.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
