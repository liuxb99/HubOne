"use client";

import { cn } from "@/lib/utils";
import type { BeamResult } from "@/lib/civil/beam";
import type { ColumnResult, RCColumnResult } from "@/lib/civil/column";

/**
 * 計算書元件
 *
 * 顯示：
 * - 輸入參數摘要
 * - 計算公式（含規範條文引用）
 * - 公式推導步驟
 * - 結果數值
 * - RC 配筋詳情（梁/柱）
 * - 斷面驗證（安全/不合格）
 * - 可列印（@media print）
 */
interface CalcReportProps {
  /** 計算結果 */
  result: BeamResult | ColumnResult | RCColumnResult | null;
  /** 計算類型 */
  type: 'beam' | 'column';
  /** 輸入參數（用於顯示摘要） */
  params: Record<string, any>;
  /** 額外 class */
  className?: string;
  /** 是否顯示公式推導 */
  showDerivation?: boolean;
}

/** 結果列 */
function ResultRow({
  label,
  value,
  unit,
  highlight,
  code,
}: {
  label: string;
  value: string | number;
  unit?: string;
  highlight?: boolean;
  code?: string;
}) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-[var(--border-light)] last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--text-secondary)]">{label}</span>
        {code && (
          <span className="text-[10px] font-mono text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">
            {code}
          </span>
        )}
      </div>
      <span
        className={cn(
          'text-sm font-mono font-medium',
          highlight ? 'text-[var(--theme-color)]' : 'text-[var(--text-primary)]',
        )}
      >
        {typeof value === 'number' ? value.toLocaleString('zh-TW', { maximumFractionDigits: 2 }) : value}
        {unit && <span className="text-xs text-[var(--text-tertiary)] ml-1">{unit}</span>}
      </span>
    </div>
  );
}

/** 區塊標題 */
function SectionTitle({ title, code }: { title: string; code?: string }) {
  return (
    <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2 mt-3 first:mt-0 flex items-center gap-2">
      {title}
      {code && <span className="text-[10px] font-mono text-[var(--text-tertiary)] font-normal bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">{code}</span>}
    </h4>
  );
}

/** 公式卡片 */
function FormulaCard({ formula, description }: { formula: string; description?: string }) {
  return (
    <div className="bg-[var(--bg-tertiary)] rounded-lg p-3 my-2 border border-[var(--border-light)]">
      <div className="text-sm font-mono font-medium text-[var(--text-primary)] text-center">
        {formula}
      </div>
      {description && (
        <div className="text-xs text-[var(--text-tertiary)] text-center mt-1">
          {description}
        </div>
      )}
    </div>
  );
}

/** 安全徽章 */
function SafetyBadge({ safe }: { safe: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded text-sm font-medium',
        safe
          ? 'bg-success/10 text-success'
          : 'bg-error/10 text-error',
      )}
    >
      <span>{safe ? '🟢' : '🔴'}</span>
      <span>
        {safe ? '結構安全 — 設計強度 ≥ 需求強度' : '結構不安全 — 請選用更大斷面或增加鋼筋量'}
      </span>
    </div>
  );
}

/** 規範引用 */
function CodeRef({ code, title, description }: { code: string; title: string; description?: string }) {
  return (
    <div className="flex items-start gap-2 py-1 text-xs text-[var(--text-secondary)]">
      <span className="font-mono font-semibold text-[var(--text-primary)] shrink-0 bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">
        {code}
      </span>
      <div>
        <span className="font-medium">{title}</span>
        {description && <span className="text-[var(--text-tertiary)]"> — {description}</span>}
      </div>
    </div>
  );
}

export default function CalcReport({
  result,
  type,
  params,
  className,
  showDerivation = true,
}: CalcReportProps) {
  if (!result) {
    return (
      <div className={cn('rounded-lg border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--text-tertiary)]', className)}>
        <div className="text-3xl mb-2">📄</div>
        <p>請先執行計算</p>
        <p className="text-xs mt-1">計算完成後將顯示詳細計算書</p>
      </div>
    );
  }

  const isBeam = type === 'beam';
  const beamResult = isBeam ? (result as BeamResult) : null;
  const columnResult = !isBeam && 'section' in result ? (result as ColumnResult) : null;
  const rcColumnResult = !isBeam && !('section' in result) ? (result as RCColumnResult) : null;
  const rcResult = beamResult?.rcResult;

  return (
    <div
      className={cn(
        'rounded-lg border border-[var(--border)] bg-white print:border-0 print:shadow-none',
        className,
      )}
    >
      {/* ── 標題列 ── */}
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-tertiary)] print:bg-transparent">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {isBeam ? '梁結構計算書' : '柱結構計算書'}
            </h3>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
              依據 ACI 318-19 / AISC 360 規範
            </p>
          </div>
          <button onClick={() => window.print()} className="text-xs text-[var(--theme-color)] hover:underline print:hidden">
            🖨️ 列印
          </button>
        </div>
      </div>

      <div className="p-4 space-y-1">
        {/* ── 一、輸入參數 ── */}
        <SectionTitle title="一、輸入參數" />
        {Object.entries(params).map(([key, value]) => (
          <ResultRow key={key} label={key} value={String(value)} />
        ))}

        {/* ── 二、斷面資訊 ── */}
        {'section' in result && result.section && (
          <>
            <SectionTitle title="二、斷面資訊" />
            <ResultRow label="型號" value={result.section.name} />
            <ResultRow label="斷面積" value={result.section.area} unit="cm²" />
            <ResultRow label="慣性矩 Ix" value={result.section.Ix} unit="cm⁴" />
            <ResultRow label="斷面模數 Zx" value={result.section.Zx} unit="cm³" />
            <ResultRow label="單位重量" value={result.section.weight} unit="kg/m" />
          </>
        )}

        {/* ── 三、計算結果 ── */}
        <SectionTitle title="三、計算結果" />

        {isBeam && beamResult && (
          <>
            {/* 梁結果 */}
            <ResultRow label="最大彎矩 Mmax" value={beamResult.maxMoment} unit="kN·m" highlight code="§5.2" />
            <ResultRow label="最大剪力 Vmax" value={beamResult.maxShear} unit="kN" code="§5.3" />
            <ResultRow label="最大撓度 δmax" value={beamResult.maxDeflection} unit="mm" code="§6.1" />
            <ResultRow label="左端反力" value={beamResult.reactions.left} unit="kN" />
            <ResultRow label="右端反力" value={beamResult.reactions.right} unit="kN" />
            <ResultRow label="需求斷面模數 Zreq" value={beamResult.requiredZx} unit="cm³" highlight />
            <ResultRow label="使用率" value={beamResult.safetyRatio} highlight />
          </>
        )}

        {!isBeam && columnResult && (
          <>
            {/* 柱結果 */}
            <ResultRow label="軸向載重 P" value={columnResult.axialLoad} unit="kN" />
            <ResultRow label="長細比 λ" value={columnResult.slenderness} highlight code="§E2" />
            <ResultRow label="尤拉臨界載重 Pcr" value={columnResult.criticalLoad} unit="kN" highlight code="§E3" />
            <ResultRow label="容許載重 Pa" value={columnResult.allowableLoad} unit="kN" />
            <ResultRow label="有效長度係數 k" value={columnResult.k} />
            <ResultRow label="使用率" value={columnResult.safetyRatio} highlight />
          </>
        )}

        {/* ── RC 配筋結果（梁） ── */}
        {rcResult && (
          <>
            <SectionTitle title="四、RC 配筋結果" code="ACI 318-19 §9~§22" />

            <FormulaCard
              formula="ρ_min = max(0.25√f'c / fy, 1.4 / fy)"
              description="最小鋼筋比（ACI 318-19 §9.6.1.2）"
            />
            <FormulaCard
              formula="ρ_max = 0.85 β₁ f'c / fy × 0.375"
              description="最大鋼筋比，拉力控制斷面（ACI 318-19 §9.3.1.1）"
            />

            <ResultRow label="拉力筋 As" value={rcResult.As_tension} unit="mm²" highlight />
            <ResultRow label="壓力筋 As'" value={rcResult.As_compression} unit="mm²" />
            <ResultRow label="剪力筋 Av" value={rcResult.As_shear} unit="mm²" />
            <ResultRow label="拉力筋比 ρ" value={rcResult.rho} highlight code="§9.6" />
            <ResultRow label="最大筋比 ρ_max" value={rcResult.rho_max} code="§10.3.5" />
            <ResultRow label="最小筋比 ρ_min" value={rcResult.rho_min} code="§9.6.1.2" />
            <ResultRow label="設計彎矩強度 φMn" value={rcResult.phiMn} unit="kN·m" highlight />
            <ResultRow label="設計剪力強度 φVn" value={rcResult.phiVn} unit="kN" highlight />
            <ResultRow label="剪力筋間距" value={rcResult.spacing} unit="mm" />

            <SectionTitle title="配筋配置" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
              <div className="p-2.5 rounded bg-[var(--bg-tertiary)] text-center">
                <div className="text-[10px] text-[var(--text-tertiary)]">拉力筋</div>
                <div className="text-sm font-mono font-bold text-[var(--theme-color)]">
                  {rcResult.bars_tension.join(', ')}
                </div>
              </div>
              <div className="p-2.5 rounded bg-[var(--bg-tertiary)] text-center">
                <div className="text-[10px] text-[var(--text-tertiary)]">壓力筋</div>
                <div className="text-sm font-mono font-bold text-[var(--text-secondary)]">
                  {rcResult.bars_compression.length > 0 ? rcResult.bars_compression.join(', ') : '—'}
                </div>
              </div>
              <div className="p-2.5 rounded bg-[var(--bg-tertiary)] text-center">
                <div className="text-[10px] text-[var(--text-tertiary)]">剪力筋</div>
                <div className="text-sm font-mono font-bold text-[var(--text-primary)]">
                  {rcResult.stirrup}
                </div>
              </div>
            </div>

            <SectionTitle title="斷面控制狀態" />
            <div className={cn(
              'flex items-center gap-2 px-3 py-2 rounded text-sm font-medium',
              rcResult.isTensionControlled ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning',
            )}>
              <span>{rcResult.isTensionControlled ? '✅' : '⚠️'}</span>
              <span>{rcResult.isTensionControlled ? '拉力控制斷面 (εt ≥ 0.005)' : '過渡區斷面 (εy < εt < 0.005)'}</span>
            </div>
          </>
        )}

        {/* RC 柱結果 */}
        {(columnResult?.rcResult || rcColumnResult) && (
          <>
            <SectionTitle title="四、RC 柱配筋結果" code="ACI 318-19 §10, §22" />

            <FormulaCard
              formula="ρ_g = A_st / A_g, 0.01 ≤ ρ_g ≤ 0.08"
              description="鋼筋比範圍（ACI 318-19 §10.6.1）"
            />

            <ResultRow label="總鋼筋面積 A_st" value={(columnResult?.rcResult ?? rcColumnResult)!.As_total} unit="mm²" highlight />
            <ResultRow label="鋼筋比 ρ_g" value={(columnResult?.rcResult ?? rcColumnResult)!.rho_g} highlight code="§10.6" />
            <ResultRow label="最小 ρ_g_min" value={(columnResult?.rcResult ?? rcColumnResult)!.rho_g_min} code="§10.6.1.1" />
            <ResultRow label="最大 ρ_g_max" value={(columnResult?.rcResult ?? rcColumnResult)!.rho_g_max} code="§10.6.1.2" />
            <ResultRow label="最大軸壓強度 φPn_max" value={(columnResult?.rcResult ?? rcColumnResult)!.phiPn_max} unit="kN" highlight code="§22.4" />
            <ResultRow label="圍束間距" value={(columnResult?.rcResult ?? rcColumnResult)!.tieSpacing} unit="mm" code="§25.7.2" />
            <ResultRow label="使用率" value={(columnResult?.rcResult ?? rcColumnResult)!.safetyRatio} highlight />

            <div className="p-2.5 rounded bg-[var(--bg-tertiary)] text-center mt-2">
              <div className="text-[10px] text-[var(--text-tertiary)]">配筋配置</div>
              <div className="text-sm font-mono font-bold text-[var(--theme-color)]">
                {(columnResult?.rcResult ?? rcColumnResult)!.bars.join(' | ')}
              </div>
            </div>
          </>
        )}

        {/* ── 公式推導（選用） ── */}
        {showDerivation && (
          <>
            <SectionTitle title="五、公式推導" />

            {isBeam && beamResult && (
              <div className="space-y-2 text-xs text-[var(--text-secondary)] leading-relaxed">
                <CodeRef code="§5.2" title="彎矩計算" description="依支承類型選用彎矩公式" />
                <div className="bg-[var(--bg-tertiary)] rounded p-2.5 font-mono text-xs">
                  <p>簡支梁(集中): Mmax = P·L / 4</p>
                  <p>簡支梁(均佈): Mmax = w·L² / 8</p>
                  <p>懸臂梁(集中): Mmax = P·L</p>
                  <p>懸臂梁(均佈): Mmax = w·L² / 2</p>
                  <p className="mt-1 text-[var(--text-tertiary)]">
                    代入: Mmax = {beamResult.maxMoment.toFixed(2)} kN·m
                  </p>
                </div>

                <CodeRef code="§5.3" title="剪力計算" description="V = dM/dx" />
                <div className="bg-[var(--bg-tertiary)] rounded p-2.5 font-mono text-xs">
                  <p>Vmax = {beamResult.maxShear.toFixed(2)} kN</p>
                </div>

                <CodeRef code="§6.1" title="撓度計算" description="δ = ∫(M·dx)/(E·I)" />
                <div className="bg-[var(--bg-tertiary)] rounded p-2.5 font-mono text-xs">
                  <p>δmax = {beamResult.maxDeflection.toFixed(2)} mm</p>
                </div>

                {beamResult.section && (
                  <>
                    <CodeRef code="§F2" title="彎矩強度檢討" description="Mmax / (Zx × Fb) ≤ 1.0" />
                    <div className="bg-[var(--bg-tertiary)] rounded p-2.5 font-mono text-xs">
                      <p>σ = M / Z = {beamResult.maxMoment.toFixed(2)}×10⁶ / {beamResult.section.Zx}×10³</p>
                      <p>σ = {((beamResult.maxMoment * 1_000_000) / (beamResult.section.Zx * 1000)).toFixed(1)} MPa</p>
                      <p>σallow = Fy / SF</p>
                      <p>使用率 = {beamResult.safetyRatio.toFixed(2)} {beamResult.isSafe ? '&lt; 1.0 ✅' : '≥ 1.0 ❌'}</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {!isBeam && columnResult && (
              <div className="space-y-2 text-xs text-[var(--text-secondary)] leading-relaxed">
                <CodeRef code="§E2" title="長細比計算" description="λ = k·L / r" />
                <div className="bg-[var(--bg-tertiary)] rounded p-2.5 font-mono text-xs">
                  <p>λ = {columnResult.k} × {columnResult.length}×1000 / {columnResult.section.rx ?? '—'}×10</p>
                  <p>λ = {columnResult.slenderness.toFixed(2)}</p>
                  {columnResult.slenderness > 200 && (
                    <p className="text-error mt-1">⚠️ λ &gt; 200（過度細長，不建議使用）</p>
                  )}
                </div>

                <CodeRef code="§E3" title="尤拉臨界載重" description="Pcr = π²·E·I / (k·L)²" />
                <div className="bg-[var(--bg-tertiary)] rounded p-2.5 font-mono text-xs">
                  <p>Pcr = π² × {205000} × {columnResult.section.Ix}×10⁴ / ({columnResult.k}×{columnResult.length}×1000)²</p>
                  <p>Pcr = {columnResult.criticalLoad.toFixed(2)} kN</p>
                </div>

                <CodeRef code="§E4" title="容許載重" description="Pa = Pcr / SF" />
                <div className="bg-[var(--bg-tertiary)] rounded p-2.5 font-mono text-xs">
                  <p>Pa = {columnResult.criticalLoad.toFixed(2)} / 1.67</p>
                  <p>Pa = {columnResult.allowableLoad.toFixed(2)} kN</p>
                  <p>使用率 = {columnResult.safetyRatio.toFixed(2)} {columnResult.isSafe ? '&lt; 1.0 ✅' : '≥ 1.0 ❌'}</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── 規範引用總表 ── */}
        <SectionTitle title="六、參考規範" />
        <div className="space-y-1">
          <CodeRef code="ACI 318-19" title="混凝土結構設計規範" description="§7 單向版 · §8 雙向版 · §9 梁 · §10 柱 · §22 強度" />
          <CodeRef code="AISC 360-16" title="鋼結構建築規範" description="§E 柱設計 · §F 梁設計 · §J 連接設計" />
          {rcResult && (
            <CodeRef code="ACI 318-19 §9.6.1.2" title="最小鋼筋比" description="ρ_min = max(0.25√fc/fy, 1.4/fy)" />
          )}
          {(columnResult?.rcResult || rcColumnResult) && (
            <CodeRef code="ACI 318-19 §10.6.1" title="柱鋼筋比" description="0.01 ≤ ρ_g ≤ 0.08" />
          )}
        </div>

        {/* ── 安全判定 ── */}
        <SectionTitle title="七、安全判定" />
        <SafetyBadge safe={result.isSafe} />
      </div>

      <style jsx>{`
        @media print {
          .print\\:border-0 { border: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:bg-transparent { background: transparent !important; }
        }
      `}</style>
    </div>
  );
}
