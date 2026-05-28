"use client";

import { cn } from "@/lib/utils";
import type { BeamResult } from "@/lib/civil/beam";
import type { ColumnResult, RCColumnResult } from "@/lib/civil/column";
import type { SlabResult } from "@/lib/civil/slab";
import type { FootingResult } from "@/lib/civil/foundation";
import type { BoltConnection, WeldResult } from "@/lib/civil/steel";

// ═══════════════════════════════════════════
//  鴨子型別檢測 — 自動判斷結果類型
// ═══════════════════════════════════════════

type ResultType = 'beam' | 'column' | 'slab' | 'footing' | 'steel';

/**
 * 根據結果物件的屬性（duck typing）自動判斷計算類型。
 * 無需 caller 手動傳入 type 參數。
 *
 * 判斷邏輯（依優先順序）：
 * 1. 有 maxMoment + maxShear         → beam
 * 2. 有 slenderness / criticalLoad   → column (鋼柱)
 * 3. 有 As_total + interactionPoints → column (RC柱)
 * 4. 有 h_min + Mu_x                → slab
 * 5. 有 B + q_allowable             → footing
 * 6. 有 capacity / shearCapacity    → steel (銲接/螺栓)
 * 7. 否則預設 beam
 */
function detectResultType(result: unknown): ResultType {
  if (!result || typeof result !== 'object') return 'beam';

  const r = result as any;

  if ('maxMoment' in r && 'maxShear' in r) return 'beam';
  if ('slenderness' in r || 'criticalLoad' in r) return 'column';
  if ('As_total' in r || 'interactionPoints' in r) return 'column';
  if ('h_min' in r && 'Mu_x' in r) return 'slab';
  if ('B' in r && 'q_allowable' in r) return 'footing';
  if ('capacity' in r || 'shearCapacity' in r) return 'steel';

  return 'beam';
}

// ═══════════════════════════════════════════
//  型別守衛
// ═══════════════════════════════════════════

function isSlabResult(r: unknown): r is SlabResult {
  return !!r && typeof (r as SlabResult).h_min === 'number' && typeof (r as SlabResult).h_provided === 'number';
}

function isFootingResult(r: unknown): r is FootingResult {
  return !!r && typeof (r as FootingResult).B === 'number' && typeof (r as FootingResult).H === 'number';
}

function isBoltConnection(r: unknown): r is BoltConnection {
  return !!r && typeof (r as BoltConnection).boltCount === 'number' && typeof (r as BoltConnection).shearCapacity === 'number';
}

function isWeldResult(r: unknown): r is WeldResult {
  return !!r && typeof (r as WeldResult).capacity === 'number' && typeof (r as WeldResult).ratio === 'number';
}

/** 判斷是否為鋼柱 (ColumnResult) 而非 RC柱 (RCColumnResult) */
function isSteelColumn(r: unknown): r is ColumnResult {
  return !!r && 'slenderness' in (r as any);
}

/** 判斷是否為 RC柱 */
function isRCColumn(r: unknown): r is RCColumnResult {
  return !!r && 'As_total' in (r as any);
}

// ═══════════════════════════════════════════
//  Props
// ═══════════════════════════════════════════

interface CalcReportProps {
  /** 計算結果（不再需要手動傳入 type，系統會自動偵測） */
  result: BeamResult | ColumnResult | RCColumnResult | SlabResult | FootingResult | BoltConnection | WeldResult | null;
  /** 輸入參數（用於顯示摘要） */
  params?: Record<string, any>;
  /** 額外 class */
  className?: string;
  /** 是否顯示公式推導，預設 true */
  showDerivation?: boolean;
}

// ═══════════════════════════════════════════
//  子元件
// ═══════════════════════════════════════════

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
      {code && (
        <span className="text-[10px] font-mono text-[var(--text-tertiary)] font-normal bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">
          {code}
        </span>
      )}
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
        safe ? 'bg-success/10 text-success' : 'bg-error/10 text-error',
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

/** 合格／不合格徽章 */
function CheckBadge({ ok, label, failLabel }: { ok: boolean; label: string; failLabel?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded text-sm font-medium mt-1',
        ok ? 'bg-success/10 text-success' : 'bg-error/10 text-error',
      )}
    >
      <span>{ok ? '🟢' : '🔴'}</span>
      <span>{ok ? label : (failLabel ?? label)}</span>
    </div>
  );
}

// ═══════════════════════════════════════════
//  主元件
// ═══════════════════════════════════════════

export default function CalcReport({
  result,
  params = {},
  className,
  showDerivation = true,
}: CalcReportProps) {
  // ── 自動偵測類型 ──
  const type = detectResultType(result);

  const isBeam = type === 'beam';
  const isColumn = type === 'column';
  const isSlab = type === 'slab';
  const isFooting = type === 'footing';
  const isSteel = type === 'steel';

  // ── 空狀態 ──
  if (!result) {
    return (
      <div
        className={cn(
          'rounded-lg border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--text-tertiary)]',
          className,
        )}
      >
        <div className="text-3xl mb-2">📄</div>
        <p>請先執行計算</p>
        <p className="text-xs mt-1">計算完成後將顯示詳細計算書</p>
      </div>
    );
  }

  // ── 安全判定 ──
  const isSafe = (() => {
    if (isSlab && isSlabResult(result)) {
      return result.isThicknessOK && result.isDeflectionOK;
    }
    if (isFooting && isFootingResult(result)) {
      return result.isBearingOK && result.isThicknessOK && result.isShearOK;
    }
    if (isSteel && isBoltConnection(result)) {
      return result.isShearOK && result.isTensionOK;
    }
    if (isSteel && isWeldResult(result)) {
      return result.isOK;
    }
    return (result as any).isSafe === true || (result as any).isSafe === undefined;
  })();

  // ── 計算書標題 ──
  const reportTitle = (() => {
    switch (type) {
      case 'beam':
        return '梁結構計算書';
      case 'column':
        return isSteelColumn(result) ? '鋼柱結構計算書' : 'RC 柱結構計算書';
      case 'slab':
        return 'RC 版設計計算書';
      case 'footing':
        return '獨立基腳設計計算書';
      case 'steel':
        return '鋼結構設計計算書';
      default:
        return '結構計算書';
    }
  })();

  const hasSection = 'section' in (result as any);

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
              📋 {reportTitle}
            </h3>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
              依據 ACI 318-19 / AISC 360 規範
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="text-xs text-[var(--theme-color)] hover:underline print:hidden"
          >
            🖨️ 列印
          </button>
        </div>
      </div>

      <div className="p-4 space-y-1">
        {/* ═══════════════════════════════════
            一、輸入參數
            ═══════════════════════════════════ */}
        <SectionTitle title="一、輸入參數" />
        {Object.keys(params).length === 0 ? (
          <p className="text-xs text-[var(--text-tertiary)] italic">無輸入參數</p>
        ) : (
          Object.entries(params).map(([key, value]) => (
            <ResultRow key={key} label={key} value={String(value)} />
          ))
        )}

        {/* ═══════════════════════════════════
            二、斷面資訊（梁/鋼柱共用）
            ═══════════════════════════════════ */}
        {hasSection && (result as any).section && (
          <>
            <SectionTitle title="二、斷面資訊" />
            <ResultRow label="型號" value={(result as any).section.name} />
            <ResultRow label="斷面積" value={(result as any).section.area} unit="cm²" />
            <ResultRow label="慣性矩 Ix" value={(result as any).section.Ix} unit="cm⁴" />
            <ResultRow label="斷面模數 Zx" value={(result as any).section.Zx} unit="cm³" />
            <ResultRow label="單位重量" value={(result as any).section.weight} unit="kg/m" />
          </>
        )}

        {/* ═══════════════════════════════════
            三、計算結果
            ═══════════════════════════════════ */}
        <SectionTitle
          title={
            isSlab
              ? '三、版厚與內力'
              : isFooting
                ? '三、尺寸與承載力'
                : isSteel
                  ? '三、連接容量'
                  : '三、計算結果'
          }
        />

        {/* ── 梁結果 ── */}
        {isBeam && (
          <>
            <ResultRow label="最大彎矩 Mmax" value={(result as BeamResult).maxMoment} unit="kN·m" highlight code="§5.2" />
            <ResultRow label="最大剪力 Vmax" value={(result as BeamResult).maxShear} unit="kN" code="§5.3" />
            <ResultRow label="最大撓度 δmax" value={(result as BeamResult).maxDeflection} unit="mm" code="§6.1" />
            <ResultRow label="左端反力" value={(result as BeamResult).reactions.left} unit="kN" />
            <ResultRow label="右端反力" value={(result as BeamResult).reactions.right} unit="kN" />
            {(result as BeamResult).requiredZx !== undefined && (
              <ResultRow label="需求斷面模數 Zreq" value={(result as BeamResult).requiredZx!} unit="cm³" highlight />
            )}
            {(result as BeamResult).safetyRatio !== undefined && (
              <ResultRow label="使用率" value={(result as BeamResult).safetyRatio!} highlight />
            )}
          </>
        )}

        {/* ── 柱結果（鋼柱） ── */}
        {isColumn && isSteelColumn(result) && (
          <>
            <ResultRow label="軸向載重 P" value={result.axialLoad} unit="kN" />
            <ResultRow label="長細比 λ" value={result.slenderness} highlight code="§E2" />
            <ResultRow label="尤拉臨界載重 Pcr" value={result.criticalLoad} unit="kN" highlight code="§E3" />
            <ResultRow label="容許載重 Pa" value={result.allowableLoad} unit="kN" />
            <ResultRow label="有效長度係數 k" value={result.k} />
            <ResultRow label="使用率" value={result.safetyRatio} highlight />
          </>
        )}

        {/* ── 版結果 ── */}
        {isSlab && isSlabResult(result) && (
          <>
            {/* 版類型 */}
            <ResultRow label="版類型" value={result.Mu_y > 0 ? '雙向版' : '單向版'} highlight />

            {/* 版厚檢討 */}
            <SectionTitle title="版厚檢討" code="ACI 318 表 7.3.1.1" />
            <ResultRow label="最小版厚 h_min" value={result.h_min} unit="mm" code="§7.3.1" />
            <ResultRow label="採用版厚 h" value={result.h_provided} unit="mm" highlight />
            <CheckBadge
              ok={result.isThicknessOK}
              label={`版厚合格（${result.h_provided}mm ≥ ${result.h_min}mm）`}
              failLabel={`版厚不合格（${result.h_provided}mm < ${result.h_min}mm）— 請增加版厚`}
            />

            {/* 彎矩設計值 */}
            <SectionTitle title="彎矩設計值" code="ACI 318 §8.10" />
            <ResultRow label="短向彎矩 Mu_x" value={result.Mu_x} unit="kN·m/m" highlight />
            {result.Mu_y > 0 && (
              <ResultRow label="長向彎矩 Mu_y" value={result.Mu_y} unit="kN·m/m" highlight />
            )}

            {/* 配筋結果 */}
            <SectionTitle title="配筋結果" code="ACI 318 §7.6.1" />
            <FormulaCard
              formula="As = Mu / (φ·fy·(d - a/2))"
              description="版配筋計算（ACI 318-19 §8.5.1）"
            />
            <ResultRow label="短向主筋 As_x" value={result.As_main_x} unit="mm²/m" highlight />
            {result.Mu_y > 0 && (
              <ResultRow label="長向主筋 As_y" value={result.As_main_y} unit="mm²/m" highlight />
            )}
            <ResultRow label="溫度鋼筋 As_temp" value={result.As_temp} unit="mm²/m" code="§24.4" />
            <ResultRow label="主筋間距" value={result.spacing_main} unit="mm" />
            <ResultRow label="溫度筋間距" value={result.spacing_temp} unit="mm" />

            {/* 配筋配置 */}
            <SectionTitle title="配筋配置" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
              <div className="p-2.5 rounded bg-[var(--bg-tertiary)] text-center">
                <div className="text-[10px] text-[var(--text-tertiary)]">短向主筋</div>
                <div className="text-sm font-mono font-bold text-[var(--theme-color)]">
                  {result.rebar_desc_x}
                </div>
              </div>
              {result.Mu_y > 0 && (
                <div className="p-2.5 rounded bg-[var(--bg-tertiary)] text-center">
                  <div className="text-[10px] text-[var(--text-tertiary)]">長向主筋</div>
                  <div className="text-sm font-mono font-bold text-[var(--theme-color)]">
                    {result.rebar_desc_y}
                  </div>
                </div>
              )}
              <div className="p-2.5 rounded bg-[var(--bg-tertiary)] text-center">
                <div className="text-[10px] text-[var(--text-tertiary)]">溫度鋼筋</div>
                <div className="text-sm font-mono font-bold text-[var(--text-primary)]">
                  {result.rebar_desc_temp}
                </div>
              </div>
            </div>

            {/* 撓度檢討 */}
            <SectionTitle title="撓度檢討" code="ACI 318 §7.3.2" />
            <CheckBadge
              ok={result.isDeflectionOK}
              label="撓度合格"
              failLabel="撓度不合格 — 請增加版厚"
            />
          </>
        )}

        {/* ── 基礎結果（基腳） ── */}
        {isFooting && isFootingResult(result) && (
          <>
            <ResultRow label="基腳寬度 B" value={result.B} unit="m" highlight />
            <ResultRow label="基腳長度 L" value={result.L} unit="m" highlight />
            <ResultRow label="基腳厚度 H" value={result.H} unit="mm" />
            <ResultRow label="基腳自重" value={result.selfWeight} unit="kN" />
            <ResultRow label="實際承載力 q_actual" value={result.q_actual} unit="kN/m²" highlight />
            <ResultRow label="容許承載力 q_allow" value={result.q_allowable} unit="kN/m²" />
            <ResultRow label="設計彎矩 Mu" value={result.Mu} unit="kN·m" code="§13.3" />

            {/* 承載力檢討 */}
            <SectionTitle title="承載力檢討" />
            <CheckBadge
              ok={result.isBearingOK}
              label="承載力合格"
              failLabel="承載力不合格 — 請加大基腳尺寸"
            />

            {/* 厚度與剪力檢討 */}
            <SectionTitle title="厚度與剪力檢討" code="ACI 318 §13.2" />
            <CheckBadge
              ok={result.isThicknessOK}
              label="厚度合格"
              failLabel="厚度不合格 — 請增加版厚"
            />
            <CheckBadge
              ok={result.isShearOK}
              label="剪力合格"
              failLabel="剪力不合格 — 請增加版厚"
            />

            {/* 配筋 */}
            <SectionTitle title="配筋結果" />
            <ResultRow label="鋼筋面積 As" value={result.As} unit="mm²/m" highlight />
            <ResultRow label="鋼筋間距" value={result.spacing} unit="mm" />
            <div className="p-2.5 rounded bg-[var(--bg-tertiary)] text-center mt-2">
              <div className="text-[10px] text-[var(--text-tertiary)]">配筋</div>
              <div className="text-sm font-mono font-bold text-[var(--theme-color)]">
                {result.rebar_desc}
              </div>
            </div>
          </>
        )}

        {/* ── 鋼構結果（螺栓連接） ── */}
        {isSteel && isBoltConnection(result) && (
          <>
            <ResultRow label="螺栓直徑" value={result.boltDiameter} unit="mm" />
            <ResultRow label="螺栓數量" value={result.boltCount} unit="支" highlight />
            <ResultRow label="螺栓等級" value={result.boltGrade} />
            <ResultRow
              label="連接類型"
              value={result.connectionType === 'bearing' ? '承壓連接' : '滑動臨界'}
            />
            <ResultRow label="需求剪力" value={result.shearDemand} unit="kN" />
            <ResultRow label="抗剪容量 φVn" value={result.shearCapacity} unit="kN" highlight code="§J3.6" />
            <ResultRow label="需求拉力" value={result.tensionDemand} unit="kN" />
            <ResultRow label="抗拉容量 φTn" value={result.tensionCapacity} unit="kN" highlight code="§J3.7" />

            <SectionTitle title="檢討結果" />
            <CheckBadge
              ok={result.isShearOK}
              label="抗剪合格"
              failLabel="抗剪不合格 — 請增加螺栓數量或改用更高強度螺栓"
            />
            <CheckBadge
              ok={result.isTensionOK}
              label="抗拉合格"
              failLabel="抗拉不合格 — 請增加螺栓數量或改用更高強度螺栓"
            />
          </>
        )}

        {/* ── 鋼構結果（銲接） ── */}
        {isSteel && isWeldResult(result) && (
          <>
            <ResultRow label="銲道容量" value={result.capacity} unit="kN" highlight code="§J2.4" />
            <ResultRow label="使用率" value={result.ratio} highlight />
            <FormulaCard
              formula="Rn = Fw × Aw"
              description="銲道標稱強度（AISC 360 §J2.4）"
            />
            <SectionTitle title="檢討結果" />
            <CheckBadge
              ok={result.isOK}
              label="銲道強度合格"
              failLabel="銲道強度不合格 — 請加大銲道尺寸或長度"
            />
          </>
        )}

        {/* ═══════════════════════════════════
            RC 配筋結果（梁）
            ═══════════════════════════════════ */}
        {(result as BeamResult).rcResult && (
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

            <ResultRow label="拉力筋 As" value={(result as BeamResult).rcResult!.As_tension} unit="mm²" highlight />
            <ResultRow label="壓力筋 As'" value={(result as BeamResult).rcResult!.As_compression} unit="mm²" />
            <ResultRow label="剪力筋 Av" value={(result as BeamResult).rcResult!.As_shear} unit="mm²" />
            <ResultRow label="拉力筋比 ρ" value={(result as BeamResult).rcResult!.rho} highlight code="§9.6" />
            <ResultRow label="最大筋比 ρ_max" value={(result as BeamResult).rcResult!.rho_max} code="§10.3.5" />
            <ResultRow label="最小筋比 ρ_min" value={(result as BeamResult).rcResult!.rho_min} code="§9.6.1.2" />
            <ResultRow label="設計彎矩強度 φMn" value={(result as BeamResult).rcResult!.phiMn} unit="kN·m" highlight />
            <ResultRow label="設計剪力強度 φVn" value={(result as BeamResult).rcResult!.phiVn} unit="kN" highlight />
            <ResultRow label="剪力筋間距" value={(result as BeamResult).rcResult!.spacing} unit="mm" />

            <SectionTitle title="配筋配置" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
              <div className="p-2.5 rounded bg-[var(--bg-tertiary)] text-center">
                <div className="text-[10px] text-[var(--text-tertiary)]">拉力筋</div>
                <div className="text-sm font-mono font-bold text-[var(--theme-color)]">
                  {(result as BeamResult).rcResult!.bars_tension.join(', ')}
                </div>
              </div>
              <div className="p-2.5 rounded bg-[var(--bg-tertiary)] text-center">
                <div className="text-[10px] text-[var(--text-tertiary)]">壓力筋</div>
                <div className="text-sm font-mono font-bold text-[var(--text-secondary)]">
                  {(result as BeamResult).rcResult!.bars_compression.length > 0
                    ? (result as BeamResult).rcResult!.bars_compression.join(', ')
                    : '—'}
                </div>
              </div>
              <div className="p-2.5 rounded bg-[var(--bg-tertiary)] text-center">
                <div className="text-[10px] text-[var(--text-tertiary)]">剪力筋</div>
                <div className="text-sm font-mono font-bold text-[var(--text-primary)]">
                  {(result as BeamResult).rcResult!.stirrup}
                </div>
              </div>
            </div>

            <SectionTitle title="斷面控制狀態" />
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded text-sm font-medium',
                (result as BeamResult).rcResult!.isTensionControlled
                  ? 'bg-success/10 text-success'
                  : 'bg-warning/10 text-warning',
              )}
            >
              <span>{(result as BeamResult).rcResult!.isTensionControlled ? '✅' : '⚠️'}</span>
              <span>
                {(result as BeamResult).rcResult!.isTensionControlled
                  ? '拉力控制斷面 (εt ≥ 0.005)'
                  : '過渡區斷面 (εy < εt < 0.005)'}
              </span>
            </div>
          </>
        )}

        {/* ── RC 柱結果 ── */}
        {(isSteelColumn(result) ? (result as ColumnResult).rcResult : null) && (
          <>
            <SectionTitle title="四、RC 柱配筋結果" code="ACI 318-19 §10, §22" />

            <FormulaCard
              formula="ρ_g = A_st / A_g, 0.01 ≤ ρ_g ≤ 0.08"
              description="鋼筋比範圍（ACI 318-19 §10.6.1）"
            />

            <ResultRow
              label="總鋼筋面積 A_st"
              value={(result as ColumnResult).rcResult!.As_total}
              unit="mm²"
              highlight
            />
            <ResultRow
              label="鋼筋比 ρ_g"
              value={(result as ColumnResult).rcResult!.rho_g}
              highlight
              code="§10.6"
            />
            <ResultRow
              label="最小 ρ_g_min"
              value={(result as ColumnResult).rcResult!.rho_g_min}
              code="§10.6.1.1"
            />
            <ResultRow
              label="最大 ρ_g_max"
              value={(result as ColumnResult).rcResult!.rho_g_max}
              code="§10.6.1.2"
            />
            <ResultRow
              label="最大軸壓強度 φPn_max"
              value={(result as ColumnResult).rcResult!.phiPn_max}
              unit="kN"
              highlight
              code="§22.4"
            />
            <ResultRow
              label="圍束間距"
              value={(result as ColumnResult).rcResult!.tieSpacing}
              unit="mm"
              code="§25.7.2"
            />
            <ResultRow
              label="使用率"
              value={(result as ColumnResult).rcResult!.safetyRatio}
              highlight
            />

            <div className="p-2.5 rounded bg-[var(--bg-tertiary)] text-center mt-2">
              <div className="text-[10px] text-[var(--text-tertiary)]">配筋配置</div>
              <div className="text-sm font-mono font-bold text-[var(--theme-color)]">
                {(result as ColumnResult).rcResult!.bars.join(' | ')}
              </div>
            </div>
          </>
        )}

        {/* ── RC 柱結果（獨立 RCColumnResult） ── */}
        {isColumn && isRCColumn(result) && (
          <>
            <SectionTitle title="四、RC 柱配筋結果" code="ACI 318-19 §10, §22" />

            <FormulaCard
              formula="ρ_g = A_st / A_g, 0.01 ≤ ρ_g ≤ 0.08"
              description="鋼筋比範圍（ACI 318-19 §10.6.1）"
            />

            <ResultRow label="總鋼筋面積 A_st" value={result.As_total} unit="mm²" highlight />
            <ResultRow label="鋼筋比 ρ_g" value={result.rho_g} highlight code="§10.6" />
            <ResultRow label="最小 ρ_g_min" value={result.rho_g_min} code="§10.6.1.1" />
            <ResultRow label="最大 ρ_g_max" value={result.rho_g_max} code="§10.6.1.2" />
            <ResultRow
              label="最大軸壓強度 φPn_max"
              value={result.phiPn_max}
              unit="kN"
              highlight
              code="§22.4"
            />
            <ResultRow label="圍束間距" value={result.tieSpacing} unit="mm" code="§25.7.2" />
            <ResultRow label="使用率" value={result.safetyRatio} highlight />

            <div className="p-2.5 rounded bg-[var(--bg-tertiary)] text-center mt-2">
              <div className="text-[10px] text-[var(--text-tertiary)]">配筋配置</div>
              <div className="text-sm font-mono font-bold text-[var(--theme-color)]">
                {result.bars.join(' | ')}
              </div>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════
            公式推導（選用）
            ═══════════════════════════════════ */}
        {showDerivation && (
          <>
            <SectionTitle title={isBeam || isColumn ? '五、公式推導' : '四、公式推導'} />

            {isBeam && (
              <div className="space-y-2 text-xs text-[var(--text-secondary)] leading-relaxed">
                <CodeRef code="§5.2" title="彎矩計算" description="依支承類型選用彎矩公式" />
                <div className="bg-[var(--bg-tertiary)] rounded p-2.5 font-mono text-xs">
                  <p>簡支梁(集中): Mmax = P·L / 4</p>
                  <p>簡支梁(均佈): Mmax = w·L² / 8</p>
                  <p>懸臂梁(集中): Mmax = P·L</p>
                  <p>懸臂梁(均佈): Mmax = w·L² / 2</p>
                  <p className="mt-1 text-[var(--text-tertiary)]">
                    P = 集中載重 (kN), w = 均佈載重 (kN/m), L = 跨度 (m)
                  </p>
                </div>
              </div>
            )}

            {isColumn && (
              <div className="space-y-2 text-xs text-[var(--text-secondary)] leading-relaxed">
                <CodeRef code="§E2" title="長細比" description="λ = (k × L) / r" />
                <CodeRef code="§E3" title="尤拉臨界載重" description="Pcr = π²EI / (kL)²" />
                <div className="bg-[var(--bg-tertiary)] rounded p-2.5 font-mono text-xs">
                  <p>λ = k·L / r</p>
                  <p>Pcr = π²·E·I / (k·L)²</p>
                  <p className="mt-1 text-[var(--text-tertiary)]">
                    k = 有效長度係數, L = 柱長 (m), r = 迴轉半徑 (cm)
                  </p>
                </div>
              </div>
            )}

            {isSlab && (
              <div className="space-y-2 text-xs text-[var(--text-secondary)] leading-relaxed">
                <CodeRef
                  code="§7.3.1"
                  title="最小版厚"
                  description="依 ACI 318 表 7.3.1.1 計算"
                />
                <div className="bg-[var(--bg-tertiary)] rounded p-2.5 font-mono text-xs">
                  <p>單向版(簡支): h ≥ L / 20</p>
                  <p>單向版(連續): h ≥ L / 24</p>
                  <p>雙向版: h ≥ 周長 / 180</p>
                  <p className="mt-1 text-[var(--text-tertiary)]">
                    L = 跨度 (mm), 周長 = 2(Lx + Ly) (mm)
                  </p>
                </div>
                <CodeRef
                  code="§8.5.1"
                  title="配筋計算"
                  description="As = Mu / (φ·fy·(d - a/2))"
                />
              </div>
            )}

            {isFooting && (
              <div className="space-y-2 text-xs text-[var(--text-secondary)] leading-relaxed">
                <CodeRef
                  code="§13.2"
                  title="基腳設計"
                  description="ACI 318-19 §13 獨立基腳設計"
                />
                <div className="bg-[var(--bg-tertiary)] rounded p-2.5 font-mono text-xs">
                  <p>所需面積: A ≥ P / q_net</p>
                  <p>彎矩: Mu = q_net × L × c² / 2</p>
                  <p>配筋: As = Mu / (φ·fy·(d - a/2))</p>
                  <p className="mt-1 text-[var(--text-tertiary)]">
                    c = 懸臂長度 (m), d = 有效深度 (mm)
                  </p>
                </div>
              </div>
            )}

            {isSteel && (
              <div className="space-y-2 text-xs text-[var(--text-secondary)] leading-relaxed">
                {isBoltConnection(result) && (
                  <>
                    <CodeRef
                      code="§J3.6"
                      title="螺栓抗剪"
                      description="φRn = φ × Fnv × Ab × n"
                    />
                    <CodeRef
                      code="§J3.7"
                      title="螺栓抗拉"
                      description="φRn = φ × Fnt × Ab × n"
                    />
                    <div className="bg-[var(--bg-tertiary)] rounded p-2.5 font-mono text-xs">
                      <p>φRn(shear) = 0.75 × Fnv × Ab × n</p>
                      <p>φRn(tension) = 0.75 × Fnt × Ab × n</p>
                      <p className="mt-1 text-[var(--text-tertiary)]">
                        Fnv = 標稱抗剪強度, Fnt = 標稱抗拉強度, Ab = 螺栓面積, n = 數量
                      </p>
                    </div>
                  </>
                )}
                {isWeldResult(result) && (
                  <>
                    <CodeRef code="§J2.4" title="銲道強度" description="Rn = Fw × Aw" />
                    <div className="bg-[var(--bg-tertiary)] rounded p-2.5 font-mono text-xs">
                      <p>Fw = 0.60 × FEXX × (1.0 + 0.5 × sin¹·⁵θ)</p>
                      <p>Aw = 0.707 × w × L (填角銲)</p>
                      <p>φRn = 0.75 × Fw × Aw</p>
                      <p className="mt-1 text-[var(--text-tertiary)]">
                        FEXX = 電極強度, w = 腳長 (mm), L = 長度 (mm)
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════
            規範條文引用
            ═══════════════════════════════════ */}
        <SectionTitle title={isBeam || isColumn ? '六、規範條文引用' : '五、規範條文引用'} />

        <div className="flex flex-wrap gap-1.5 mt-1">
          {isBeam && (
            <>
              <span className="text-[10px] font-mono bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded text-[var(--text-secondary)]">ACI 318-19 §5</span>
              <span className="text-[10px] font-mono bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded text-[var(--text-secondary)]">ACI 318-19 §6</span>
              <span className="text-[10px] font-mono bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded text-[var(--text-secondary)]">ACI 318-19 §9~§22</span>
              <span className="text-[10px] font-mono bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded text-[var(--text-secondary)]">AISC 360 §F2</span>
            </>
          )}
          {isColumn && (
            <>
              <span className="text-[10px] font-mono bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded text-[var(--text-secondary)]">AISC 360 §E2~E3</span>
              <span className="text-[10px] font-mono bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded text-[var(--text-secondary)]">ACI 318-19 §10</span>
              <span className="text-[10px] font-mono bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded text-[var(--text-secondary)]">ACI 318-19 §22</span>
            </>
          )}
          {isSlab && (
            <>
              <span className="text-[10px] font-mono bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded text-[var(--text-secondary)]">ACI 318-19 §7</span>
              <span className="text-[10px] font-mono bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded text-[var(--text-secondary)]">ACI 318-19 §8</span>
              <span className="text-[10px] font-mono bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded text-[var(--text-secondary)]">ACI 318 表 7.3.1.1</span>
              <span className="text-[10px] font-mono bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded text-[var(--text-secondary)]">ACI 318 §24.4</span>
            </>
          )}
          {isFooting && (
            <>
              <span className="text-[10px] font-mono bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded text-[var(--text-secondary)]">ACI 318-19 §13</span>
              <span className="text-[10px] font-mono bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded text-[var(--text-secondary)]">ACI 318 §13.2.7</span>
              <span className="text-[10px] font-mono bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded text-[var(--text-secondary)]">ACI 318 §13.3</span>
            </>
          )}
          {isSteel && (
            <>
              <span className="text-[10px] font-mono bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded text-[var(--text-secondary)]">AISC 360 §J2</span>
              <span className="text-[10px] font-mono bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded text-[var(--text-secondary)]">AISC 360 §J3</span>
              <span className="text-[10px] font-mono bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded text-[var(--text-secondary)]">AISC 360 表 J3.2</span>
            </>
          )}
        </div>

        {/* ═══════════════════════════════════
            安全判定
            ═══════════════════════════════════ */}
        <SectionTitle title={isBeam || isColumn ? '七、安全判定' : '六、安全判定'} />
        <SafetyBadge safe={isSafe} />
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
