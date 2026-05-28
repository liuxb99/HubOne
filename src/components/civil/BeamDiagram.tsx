"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { BeamResult, ContinuousBeamResult } from "@/lib/civil/beam";
import RebarDetail from "./RebarDetail";

/**
 * 梁結構 SVG 示意圖元件（Midas 風格配色）
 *
 * Midas 風格配色方案：
 * - 梁本體: 深藍 #1E40AF
 * - 支座: 紅 #DC2626（三角形）
 * - 彎矩圖: 紅 #DC2626（含透明填色）
 * - 剪力圖: 藍 #2563EB
 * - 變形圖: 灰 #6B7280（虛線）
 * - 網格: 淺灰 #E5E7EB
 * - 安全: 綠 #16A34A
 * - 危險: 紅 #DC2626
 */
interface BeamDiagramProps {
  result: BeamResult | null;
  width?: number;
  height?: number;
  className?: string;
}

// ── Midas 風格配色 ──
const MIDAS = {
  beam: '#1E40AF',
  support: '#DC2626',
  supportFill: '#DC2626',
  moment: '#DC2626',
  momentFill: 'rgba(220, 38, 38, 0.12)',
  shear: '#2563EB',
  shearFill: 'rgba(37, 99, 235, 0.10)',
  deflection: '#6B7280',
  text: '#1F2937',
  textSecondary: '#6B7280',
  grid: '#E5E7EB',
  safe: '#16A34A',
  danger: '#DC2626',
  bg: '#FFFFFF',
};

// ── 佈局常數 ──
const MARGIN = { top: 28, right: 20, bottom: 22, left: 38 };
const DIAGRAM_GAP = 6;
const DIAGRAM_HEIGHT = 72;
const BEAM_HEIGHT = 14;
const SUPPORT_SIZE = 9;

export default function BeamDiagram({
  result,
  width = 500,
  height = 380,
  className,
}: BeamDiagramProps) {
  const [showRebar, setShowRebar] = useState(false);

  const plotWidth = width - MARGIN.left - MARGIN.right;
  const plotLeft = MARGIN.left;
  const beamTop = MARGIN.top;

  if (!result) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={cn('w-full h-auto rounded-lg border border-dashed border-gray-200 bg-white/50', className)}
      >
        <text x={width / 2} y={height / 2} textAnchor="middle" fill={MIDAS.textSecondary} fontSize="13" fontFamily="var(--font-sans)">
          請先執行計算以顯示圖表
        </text>
      </svg>
    );
  }

  const { length, momentPoints, shearPoints, deflectionPoints, maxMoment, maxShear, supportType, continuousResult, rcResult } = result;

  // 連續梁
  if (continuousResult && continuousResult.spans.length > 1) {
    return (
      <ContinuousBeamSVG result={continuousResult} width={width} height={height} className={className} />
    );
  }

  // 配筋詳圖模式
  if (showRebar && rcResult) {
    return (
      <div className="space-y-2">
        <button onClick={() => setShowRebar(false)} className="text-xs text-[#FF6D00] hover:underline">
          ← 返回內力圖
        </button>
        <RebarDetail
          type="beam"
          b={300}
          h={500}
          tensionBars={rcResult.bars_tension}
          compressionBars={rcResult.bars_compression}
          stirrup={rcResult.stirrup}
        />
      </div>
    );
  }

  // ── 一般梁 SVG ──
  const shearTop = beamTop + BEAM_HEIGHT + 20;
  const momentTop = shearTop + DIAGRAM_HEIGHT + DIAGRAM_GAP + 16;
  const deflectTop = momentTop + DIAGRAM_HEIGHT + DIAGRAM_GAP + 22;

  const scaleX = (x: number) => plotLeft + (x / length) * plotWidth;

  // 彎矩圖縮放
  const maxMom = Math.max(Math.abs(maxMoment), 0.01);
  const momentScale = (DIAGRAM_HEIGHT * 0.82) / maxMom;
  const momentCenter = momentTop + DIAGRAM_HEIGHT / 2;
  const momentY = (m: number) => momentCenter + m * momentScale;

  // 剪力圖縮放
  const maxSh = Math.max(Math.abs(maxShear), 0.01);
  const shearScale = (DIAGRAM_HEIGHT * 0.82) / maxSh;
  const shearCenter = shearTop + DIAGRAM_HEIGHT / 2;
  const shearY = (v: number) => shearCenter + v * shearScale;

  // 變形圖縮放
  const maxDef = Math.max(Math.abs(result.maxDeflection), 0.01);
  const defScale = (DIAGRAM_HEIGHT * 0.6) / maxDef;
  const defCenter = deflectTop + DIAGRAM_HEIGHT / 2;
  const defY = (d: number) => defCenter + d * defScale;

  // 彎矩圖路徑
  const momentPath = momentPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${scaleX(p.x)},${momentY(-p.m)}`)
    .join(' ');
  const momentFillPath = `${momentPath} L${scaleX(length)},${momentCenter} L${scaleX(0)},${momentCenter} Z`;

  // 剪力圖路徑
  const shearPath = shearPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${scaleX(p.x)},${shearY(p.v)}`)
    .join(' ');
  const shearFillPath = `${shearPath} L${scaleX(length)},${shearCenter} L${scaleX(0)},${shearCenter} Z`;

  // 變形圖路徑
  const defPath = deflectionPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${scaleX(p.x)},${defY(p.d)}`)
    .join(' ');

  // 網格線 Y 位置
  const gridYPositions = [
    beamTop - 5,
    shearCenter,
    momentCenter,
    defCenter,
  ];

  return (
    <div className="relative">
      {rcResult && (
        <button
          onClick={() => setShowRebar(true)}
          className="absolute top-1 right-1 z-10 text-[10px] px-2 py-1 rounded bg-white border border-gray-200 text-gray-500 hover:text-[#FF6D00]"
        >
          📋 配筋詳圖
        </button>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={cn('w-full h-auto rounded-lg border border-gray-100', className)}
        style={{ background: MIDAS.bg }}
      >
        <defs>
          {/* 圖表漸層 */}
          <linearGradient id="momentGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={MIDAS.moment} stopOpacity="0.2" />
            <stop offset="100%" stopColor={MIDAS.moment} stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="shearGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={MIDAS.shear} stopOpacity="0.15" />
            <stop offset="100%" stopColor={MIDAS.shear} stopOpacity="0.04" />
          </linearGradient>

          {/* 箭頭標記 */}
          <marker id="arrowStart" markerWidth="5" markerHeight="5" refX="0" refY="2.5" orient="auto">
            <path d="M5,0 L0,2.5 L5,5" fill="none" stroke={MIDAS.textSecondary} strokeWidth="0.8" />
          </marker>
          <marker id="arrowEnd" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
            <path d="M0,0 L5,2.5 L0,5" fill="none" stroke={MIDAS.textSecondary} strokeWidth="0.8" />
          </marker>
        </defs>

        {/* ── 背景網格線 ── */}
        {Array.from({ length: 6 }).map((_, i) => {
          const x = plotLeft + (plotWidth / 5) * i;
          return (
            <line key={`grid-v-${i}`} x1={x} y1={beamTop - 4} x2={x} y2={deflectTop + DIAGRAM_HEIGHT + 4} stroke={MIDAS.grid} strokeWidth="0.5" />
          );
        })}
        {gridYPositions.map((y, i) => (
          <line key={`grid-h-${i}`} x1={plotLeft} y1={y} x2={plotLeft + plotWidth} y2={y} stroke={MIDAS.grid} strokeWidth="0.5" strokeDasharray="2,2" />
        ))}

        {/* ═══════════════════════════════════════
            梁示意圖
            ═══════════════════════════════════════ */}
        {/* 梁本體 — 深藍色 */}
        <rect
          x={scaleX(0)}
          y={beamTop}
          width={scaleX(length) - scaleX(0)}
          height={BEAM_HEIGHT}
          rx="2"
          fill={MIDAS.beam}
          opacity="0.85"
        />

        {/* 跨度標註 */}
        <line
          x1={scaleX(0)} y1={beamTop + BEAM_HEIGHT + 6}
          x2={scaleX(length)} y2={beamTop + BEAM_HEIGHT + 6}
          stroke={MIDAS.textSecondary} strokeWidth="0.6"
          markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)"
        />
        <text
          x={(scaleX(0) + scaleX(length)) / 2} y={beamTop + BEAM_HEIGHT + 16}
          textAnchor="middle" fill={MIDAS.textSecondary} fontSize="9" fontFamily="var(--font-mono)"
        >
          L = {length} m
        </text>

        {/* 梁類型標籤 */}
        <text x={scaleX(length / 2)} y={beamTop - 4} textAnchor="middle" fill={MIDAS.textSecondary} fontSize="9" fontFamily="var(--font-sans)">
          {supportType === 'simply' && '簡支梁'}
          {supportType === 'fixed' && '固定梁'}
          {supportType === 'cantilever' && '懸臂梁'}
        </text>

        {/* 支座 — 紅色三角形 */}
        {(supportType === 'simply' || supportType === 'fixed') && (
          <>
            {/* 左支座 */}
            <polygon
              points={`${scaleX(0) - SUPPORT_SIZE / 2},${beamTop + BEAM_HEIGHT} ${scaleX(0) + SUPPORT_SIZE / 2},${beamTop + BEAM_HEIGHT} ${scaleX(0)},${beamTop + BEAM_HEIGHT + SUPPORT_SIZE}`}
              fill={MIDAS.supportFill}
              stroke={MIDAS.support}
              strokeWidth="1"
            />
            <circle cx={scaleX(0)} cy={beamTop + BEAM_HEIGHT} r="2" fill={MIDAS.support} />
            {/* 右支座 */}
            <polygon
              points={`${scaleX(length) - SUPPORT_SIZE / 2},${beamTop + BEAM_HEIGHT} ${scaleX(length) + SUPPORT_SIZE / 2},${beamTop + BEAM_HEIGHT} ${scaleX(length)},${beamTop + BEAM_HEIGHT + SUPPORT_SIZE}`}
              fill={MIDAS.supportFill}
              stroke={MIDAS.support}
              strokeWidth="1"
            />
            <circle cx={scaleX(length)} cy={beamTop + BEAM_HEIGHT} r="2" fill={MIDAS.support} />
          </>
        )}

        {/* 固定端標記 */}
        {supportType === 'fixed' && (
          <>
            <line x1={scaleX(0)} y1={beamTop - 3} x2={scaleX(0)} y2={beamTop + BEAM_HEIGHT + 10} stroke={MIDAS.support} strokeWidth="2.5" />
            <line x1={scaleX(length)} y1={beamTop - 3} x2={scaleX(length)} y2={beamTop + BEAM_HEIGHT + 10} stroke={MIDAS.support} strokeWidth="2.5" />
          </>
        )}

        {/* 懸臂端 */}
        {supportType === 'cantilever' && (
          <>
            <rect x={scaleX(0) - 3} y={beamTop - 3} width="6" height={BEAM_HEIGHT + 6} rx="1" fill={MIDAS.support} />
            <line x1={scaleX(0) - 7} y1={beamTop - 1} x2={scaleX(0) - 7} y2={beamTop + BEAM_HEIGHT + 1} stroke={MIDAS.support} strokeWidth="1.2" />
            <line x1={scaleX(0) - 11} y1={beamTop} x2={scaleX(0) - 11} y2={beamTop + BEAM_HEIGHT} stroke={MIDAS.support} strokeWidth="0.8" />
          </>
        )}

        {/* ═══════════════════════════════════════
            剪力圖 V — 藍色
            ═══════════════════════════════════════ */}
        <text x={plotLeft} y={shearTop - 4} fill={MIDAS.shear} fontSize="9" fontWeight="600" fontFamily="var(--font-sans)">
          V 圖
        </text>
        <line x1={plotLeft} y1={shearCenter} x2={plotLeft + plotWidth} y2={shearCenter} stroke={MIDAS.grid} strokeWidth="0.5" strokeDasharray="2,3" />
        <path d={shearFillPath} fill="url(#shearGrad)" stroke="none" />
        <path d={shearPath} fill="none" stroke={MIDAS.shear} strokeWidth="1.8" />
        <text
          x={plotLeft + plotWidth} y={shearY(maxShear > 0 ? maxShear : 0) - 3}
          textAnchor="end" fill={MIDAS.shear} fontSize="8" fontFamily="var(--font-mono)" fontWeight="600"
        >
          Vmax={maxShear.toFixed(1)}kN
        </text>

        {/* ═══════════════════════════════════════
            彎矩圖 M — 紅色
            ═══════════════════════════════════════ */}
        <text x={plotLeft} y={momentTop - 4} fill={MIDAS.moment} fontSize="9" fontWeight="600" fontFamily="var(--font-sans)">
          M 圖
        </text>
        <line x1={plotLeft} y1={momentCenter} x2={plotLeft + plotWidth} y2={momentCenter} stroke={MIDAS.grid} strokeWidth="0.5" strokeDasharray="2,3" />
        <path d={momentFillPath} fill="url(#momentGrad)" stroke="none" />
        <path d={momentPath} fill="none" stroke={MIDAS.moment} strokeWidth="1.8" />
        <text
          x={plotLeft + plotWidth} y={momentY(-maxMoment) - 3}
          textAnchor="end" fill={MIDAS.moment} fontSize="8" fontFamily="var(--font-mono)" fontWeight="600"
        >
          Mmax={maxMoment.toFixed(1)}kN·m
        </text>

        {/* ═══════════════════════════════════════
            變形圖 δ — 灰色虛線
            ═══════════════════════════════════════ */}
        <text x={plotLeft} y={deflectTop - 4} fill={MIDAS.deflection} fontSize="9" fontWeight="600" fontFamily="var(--font-sans)">
          δ 圖
        </text>
        <line x1={plotLeft} y1={defCenter} x2={plotLeft + plotWidth} y2={defCenter} stroke={MIDAS.grid} strokeWidth="0.5" strokeDasharray="2,3" />
        <path d={defPath} fill="none" stroke={MIDAS.deflection} strokeWidth="1.5" strokeDasharray="4,3" />
        <text
          x={plotLeft + plotWidth} y={defY(result.maxDeflection) - 3}
          textAnchor="end" fill={MIDAS.deflection} fontSize="8" fontFamily="var(--font-mono)" fontWeight="600"
        >
          δmax={result.maxDeflection.toFixed(2)}mm
        </text>

        {/* ═══════════════════════════════════════
            安全狀態標籤
            ═══════════════════════════════════════ */}
        {result.section && (
          <g>
            <rect x={width - 98} y={4} width="90" height="20" rx="4" fill={result.isSafe ? '#F0FDF4' : '#FEF2F2'} stroke={result.isSafe ? MIDAS.safe : MIDAS.danger} strokeWidth="0.5" />
            <text x={width - 53} y={16} textAnchor="middle" fill={result.isSafe ? MIDAS.safe : MIDAS.danger} fontSize="10" fontWeight="700" fontFamily="var(--font-sans)">
              {result.isSafe ? '🟢 安全' : '🔴 不合格'}
            </text>
          </g>
        )}

        {/* ═══════════════════════════════════════
            圖例
            ═══════════════════════════════════════ */}
        <g transform={`translate(${plotLeft + 4}, ${height - 16})`}>
          <line x1="0" y1="0" x2="14" y2="0" stroke={MIDAS.moment} strokeWidth="1.5" />
          <text x="16" y="2" fill={MIDAS.moment} fontSize="7" fontFamily="var(--font-sans)">M</text>
          <line x1="40" y1="0" x2="54" y2="0" stroke={MIDAS.shear} strokeWidth="1.5" />
          <text x="56" y="2" fill={MIDAS.shear} fontSize="7" fontFamily="var(--font-sans)">V</text>
          <line x1="80" y1="0" x2="94" y2="0" stroke={MIDAS.deflection} strokeWidth="1.5" strokeDasharray="3,2" />
          <text x="96" y="2" fill={MIDAS.deflection} fontSize="7" fontFamily="var(--font-sans)">δ</text>
          <rect x="120" y="-4" width="8" height="8" rx="1" fill={MIDAS.supportFill} />
          <text x="130" y="2" fill={MIDAS.textSecondary} fontSize="7" fontFamily="var(--font-sans)">支座</text>
          <rect x="160" y="-4" width="8" height="8" rx="1" fill={MIDAS.beam} opacity="0.85" />
          <text x="170" y="2" fill={MIDAS.textSecondary} fontSize="7" fontFamily="var(--font-sans)">梁</text>
        </g>
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════
//  連續梁 SVG 元件
// ═══════════════════════════════════════════

function ContinuousBeamSVG({
  result,
  width = 550,
  height = 420,
  className,
}: {
  result: ContinuousBeamResult;
  width?: number;
  height?: number;
  className?: string;
}) {
  const plotWidth = width - MARGIN.left - MARGIN.right;
  const plotLeft = MARGIN.left;
  const beamTop = MARGIN.top;

  const totalLength = result.spans.reduce((sum, s) => sum + s.L, 0);

  let currentX = 0;
  const spanStarts = result.spans.map((span) => {
    const start = currentX;
    currentX += span.L;
    return start;
  });

  const scaleX = (x: number) => plotLeft + (x / totalLength) * plotWidth;

  const allMoments = result.envelope.moment.map((p) => Math.abs(p.m));
  const allShears = result.envelope.shear.map((p) => Math.abs(p.v));
  const maxMom = Math.max(...allMoments, 0.01);
  const maxSh = Math.max(...allShears, 0.01);

  const shearTop = beamTop + BEAM_HEIGHT + 22;
  const momentTop = shearTop + DIAGRAM_HEIGHT + DIAGRAM_GAP + 18;

  const momentCenter = momentTop + DIAGRAM_HEIGHT / 2;
  const momentScale = (DIAGRAM_HEIGHT * 0.8) / maxMom;
  const momentY = (m: number) => momentCenter + m * momentScale;

  const shearCenter = shearTop + DIAGRAM_HEIGHT / 2;
  const shearScale = (DIAGRAM_HEIGHT * 0.8) / maxSh;
  const shearY = (v: number) => shearCenter + v * shearScale;

  const envMomentPath = result.envelope.moment
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${scaleX(p.x)},${momentY(-p.m)}`)
    .join(' ');
  const envMomentFill = `${envMomentPath} L${scaleX(totalLength)},${momentCenter} L${scaleX(0)},${momentCenter} Z`;

  const envShearPath = result.envelope.shear
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${scaleX(p.x)},${shearY(p.v)}`)
    .join(' ');
  const envShearFill = `${envShearPath} L${scaleX(totalLength)},${shearCenter} L${scaleX(0)},${shearCenter} Z`;

  const spanMomentPaths = result.spans.map((span) => {
    return span.momentPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${scaleX(p.x + spanStarts[span.index])},${momentY(-p.m)}`)
      .join(' ');
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('w-full h-auto rounded-lg', className)}
      style={{ background: MIDAS.bg }}
    >
      <defs>
        <linearGradient id="envM" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={MIDAS.moment} stopOpacity="0.2" />
          <stop offset="100%" stopColor={MIDAS.moment} stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id="envV" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={MIDAS.shear} stopOpacity="0.15" />
          <stop offset="100%" stopColor={MIDAS.shear} stopOpacity="0.04" />
        </linearGradient>
      </defs>

      {/* ── 連續梁本體 ── */}
      <rect
        x={scaleX(0)} y={beamTop}
        width={scaleX(totalLength) - scaleX(0)} height={BEAM_HEIGHT}
        rx="1" fill={MIDAS.beam} opacity="0.85"
      />

      {/* 跨度標註 */}
      {result.spans.map((span, i) => {
        const sx = scaleX(spanStarts[i]);
        const ex = scaleX(spanStarts[i] + span.L);
        const cx = (sx + ex) / 2;
        return (
          <g key={`span-${i}`}>
            <line x1={sx} y1={beamTop + BEAM_HEIGHT + 6} x2={ex} y2={beamTop + BEAM_HEIGHT + 6} stroke={MIDAS.textSecondary} strokeWidth="0.6" markerStart="url(#arrowStart)" markerEnd="url(#arrowEnd)" />
            <text x={cx} y={beamTop + BEAM_HEIGHT + 16} textAnchor="middle" fill={MIDAS.textSecondary} fontSize="8" fontFamily="var(--font-mono)">
              Span {i + 1}: {span.L.toFixed(1)}m
            </text>
          </g>
        );
      })}

      {/* 支座 — 紅色三角形 */}
      {Array.from({ length: result.spans.length + 1 }).map((_, i) => {
        const x = scaleX(i === 0 ? 0 : i === result.spans.length ? totalLength : spanStarts[i]);
        return (
          <g key={`supp-${i}`}>
            <polygon
              points={`${x - SUPPORT_SIZE / 2},${beamTop + BEAM_HEIGHT} ${x + SUPPORT_SIZE / 2},${beamTop + BEAM_HEIGHT} ${x},${beamTop + BEAM_HEIGHT + SUPPORT_SIZE}`}
              fill={MIDAS.supportFill} stroke={MIDAS.support} strokeWidth="1"
            />
            <circle cx={x} cy={beamTop + BEAM_HEIGHT} r="2" fill={MIDAS.support} />
            {i > 0 && i < result.spans.length && (
              <text x={x} y={beamTop - 3} textAnchor="middle" fill={MIDAS.support} fontSize="8" fontFamily="var(--font-sans)">▽</text>
            )}
          </g>
        );
      })}

      <text x={plotLeft + plotWidth / 2} y={beamTop - 5} textAnchor="middle" fill={MIDAS.text} fontSize="10" fontWeight="600" fontFamily="var(--font-sans)">
        連續梁示意圖（{result.spans.length} 跨）
      </text>

      {/* ── 彎矩包絡線 ── */}
      <text x={plotLeft} y={momentTop - 4} fill={MIDAS.moment} fontSize="9" fontWeight="600" fontFamily="var(--font-sans)">M 包絡線</text>
      <line x1={plotLeft} y1={momentCenter} x2={plotLeft + plotWidth} y2={momentCenter} stroke={MIDAS.grid} strokeWidth="0.5" strokeDasharray="2,3" />
      <path d={envMomentFill} fill="url(#envM)" stroke="none" />
      {spanMomentPaths.map((path, i) => (
        <path key={`sm-${i}`} d={path} fill="none" stroke={MIDAS.moment} strokeWidth="1" opacity="0.4" />
      ))}
      <path d={envMomentPath} fill="none" stroke={MIDAS.moment} strokeWidth="2.2" />
      <text x={plotLeft + plotWidth} y={momentY(-maxMom) - 3} textAnchor="end" fill={MIDAS.moment} fontSize="8" fontFamily="var(--font-mono)" fontWeight="600">
        Mmax={maxMom.toFixed(1)}kN·m
      </text>

      {/* ── 剪力包絡線 ── */}
      <text x={plotLeft} y={shearTop - 4} fill={MIDAS.shear} fontSize="9" fontWeight="600" fontFamily="var(--font-sans)">V 包絡線</text>
      <line x1={plotLeft} y1={shearCenter} x2={plotLeft + plotWidth} y2={shearCenter} stroke={MIDAS.grid} strokeWidth="0.5" strokeDasharray="2,3" />
      <path d={envShearFill} fill="url(#envV)" stroke="none" />
      <path d={envShearPath} fill="none" stroke={MIDAS.shear} strokeWidth="2.2" />
      <text x={plotLeft + plotWidth} y={shearY(maxSh > 0 ? maxSh : 0) - 3} textAnchor="end" fill={MIDAS.shear} fontSize="8" fontFamily="var(--font-mono)" fontWeight="600">
        Vmax={maxSh.toFixed(1)}kN
      </text>

      {/* 反力 */}
      <text x={plotLeft} y={height - 12} fill={MIDAS.textSecondary} fontSize="7" fontFamily="var(--font-sans)">
        各跨反力：
        {result.spans.map((s, i) => `R${i + 1}L=${s.reactions.left.toFixed(0)}kN R${i + 1}R=${s.reactions.right.toFixed(0)}kN`).join(' | ')}
      </text>
    </svg>
  );
}
