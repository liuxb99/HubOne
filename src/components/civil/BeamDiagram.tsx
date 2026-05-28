"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { BeamResult, ContinuousBeamResult } from "@/lib/civil/beam";
import RebarDetail from "./RebarDetail";

/**
 * 梁結構 SVG 示意圖（Midas 風格・垂直分離式佈局）
 *
 * ┌───────────────────────────────────┐
 * │  📐 梁示意圖（含支座+載重）        │
 * ├───────────────────────────────────┤
 * │  📊 彎矩圖 M (kN·m)   Mmax=XXX   │
 * │  [── 紅色系彎矩圖 ──]            │
 * ├───────────────────────────────────┤
 * │  📊 剪力圖 V (kN)     Vmax=XXX   │
 * │  [── 藍色系剪力圖 ──]            │
 * ├───────────────────────────────────┤
 * │  📊 變形圖 δ (mm)     δmax=XXX   │
 * │  [── 灰色變形圖 ──]              │
 * └───────────────────────────────────┘
 */

// ── Midas 風格配色（透過 CSS 變數支援深色/淺色主題） ──
const MIDAS = {
  beam: '#1E40AF',
  support: '#DC2626',
  supportFill: '#DC2626',
  moment: '#DC2626',
  momentFill: 'rgba(220, 38, 38, 0.15)',
  shear: '#2563EB',
  shearFill: 'rgba(37, 99, 235, 0.12)',
  deflection: '#6B7280',
  text: 'var(--text-primary, #1F2937)',
  textSecondary: 'var(--text-secondary, #6B7280)',
  textTertiary: 'var(--text-tertiary, #9CA3AF)',
  grid: 'var(--border, #E5E7EB)',
  bg: 'var(--card-bg, #FFFFFF)',
  border: 'var(--border, #E5E7EB)',
  safe: '#16A34A',
  danger: '#DC2626',
};

// ── 佈局常數 ──
const PAD = { top: 8, left: 44, right: 16 };
const BEAM_SEC = 48;       // 梁示意圖區塊高度
const DIAG_H = 156;        // 每張圖表高度
const DIAG_GAP = 13;       // 圖表間距（含分隔線）
const TITLE_H = 20;        // 圖表標題列高度
const BEAM_BAR = 14;       // 梁本體高度
const SUP_SZ = 10;         // 支座箭頭大小

interface BeamDiagramProps {
  result: BeamResult | null;
  width?: number;
  height?: number;
  className?: string;
}

export default function BeamDiagram({
  result,
  width = 500,
  height,
  className,
}: BeamDiagramProps) {
  const [showRebar, setShowRebar] = useState(false);

  if (!result) {
    const h = height ?? 180;
    return (
      <svg
        viewBox={`0 0 ${width} ${h}`}
        className={cn('w-full h-auto rounded-lg border border-dashed border-gray-200 bg-white/50', className)}
      >
        <text
          x={width / 2} y={h / 2}
          textAnchor="middle" fill={MIDAS.textSecondary}
          fontSize="13" fontFamily="var(--font-sans)"
        >
          請先執行計算以顯示圖表
        </text>
      </svg>
    );
  }

  const { length, momentPoints, shearPoints, deflectionPoints, maxMoment, maxShear, supportType, continuousResult, rcResult } = result;

  // 連續梁
  if (continuousResult && continuousResult.spans.length > 1) {
    return (
      <ContinuousBeamSVG result={continuousResult} width={width} className={className} />
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

  // ── 計算縱向佈局（忽略外部傳入 height，改為自動計算） ──
  const svgH = PAD.top + BEAM_SEC + DIAG_GAP + (DIAG_H + DIAG_GAP) * 3 + 8;

  const plotLeft = PAD.left;
  const plotW = width - PAD.left - PAD.right;

  // 各區塊 Y 位置
  const beamSecTop = PAD.top;
  const momSecTop = beamSecTop + BEAM_SEC + DIAG_GAP;
  const shearSecTop = momSecTop + DIAG_H + DIAG_GAP;
  const defSecTop = shearSecTop + DIAG_H + DIAG_GAP;

  // 圖表內繪圖區域
  const chartTop = (secTop: number) => secTop + TITLE_H;
  const chartH = DIAG_H - TITLE_H;
  const chartCenter = (secTop: number) => chartTop(secTop) + chartH / 2;

  // 縮放比例
  const scaleX = (x: number) => plotLeft + (x / length) * plotW;

  // ── 彎矩圖 ──
  const absMom = Math.max(Math.abs(maxMoment), 0.01);
  const momCenter = chartCenter(momSecTop);
  const momScale = (chartH * 0.78) / absMom;
  const momY = (m: number) => momCenter + m * momScale;
  const momPath = momentPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${scaleX(p.x)},${momY(-p.m)}`).join(' ');
  const momFill = `${momPath} L${scaleX(length)},${momCenter} L${scaleX(0)},${momCenter} Z`;

  // ── 剪力圖 ──
  const absSh = Math.max(Math.abs(maxShear), 0.01);
  const shCenter = chartCenter(shearSecTop);
  const shScale = (chartH * 0.78) / absSh;
  const shY = (v: number) => shCenter + v * shScale;
  const shPath = shearPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${scaleX(p.x)},${shY(p.v)}`).join(' ');
  const shFill = `${shPath} L${scaleX(length)},${shCenter} L${scaleX(0)},${shCenter} Z`;

  // ── 變形圖 ──
  const absDef = Math.max(Math.abs(result.maxDeflection), 0.01);
  const defCenter = chartCenter(defSecTop);
  const defScale = (chartH * 0.65) / absDef;
  const defY = (d: number) => defCenter + d * defScale;
  const defPath = deflectionPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${scaleX(p.x)},${defY(p.d)}`).join(' ');

  // ── 網格線（垂直） ──
  const gridVert = Array.from({ length: 6 }).map((_, i) => {
    const x = plotLeft + (plotW / 5) * i;
    return x;
  });

  return (
    <div className="relative">
      {rcResult && (
        <button
          onClick={() => setShowRebar(true)}
          className="absolute top-1 right-1 z-10 text-[10px] px-2 py-1 rounded bg-white border border-gray-200 text-gray-500 hover:text-[#FF6D00] dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400"
        >
          📋 配筋詳圖
        </button>
      )}

      <svg
        viewBox={`0 0 ${width} ${svgH}`}
        className={cn('w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700', className)}
        style={{ background: MIDAS.bg }}
      >
        <defs>
          {/* 彎矩圖漸層 */}
          <linearGradient id="momGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={MIDAS.moment} stopOpacity="0.22" />
            <stop offset="100%" stopColor={MIDAS.moment} stopOpacity="0.04" />
          </linearGradient>
          {/* 剪力圖漸層 */}
          <linearGradient id="shGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={MIDAS.shear} stopOpacity="0.18" />
            <stop offset="100%" stopColor={MIDAS.shear} stopOpacity="0.04" />
          </linearGradient>
          {/* 箭頭標記 */}
          <marker id="arrStart" markerWidth="5" markerHeight="5" refX="0" refY="2.5" orient="auto">
            <path d="M5,0 L0,2.5 L5,5" fill="none" stroke={MIDAS.textSecondary} strokeWidth="0.7" />
          </marker>
          <marker id="arrEnd" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
            <path d="M0,0 L5,2.5 L0,5" fill="none" stroke={MIDAS.textSecondary} strokeWidth="0.7" />
          </marker>
        </defs>

        {/* ═══════════════════════════════════════
            分隔線（區塊之間）
            ═══════════════════════════════════════ */}
        {/* 梁 → 彎矩 */}
        <line x1={plotLeft} y1={momSecTop - 1} x2={plotLeft + plotW} y2={momSecTop - 1} stroke={MIDAS.border} strokeWidth="0.8" />
        {/* 彎矩 → 剪力 */}
        <line x1={plotLeft} y1={shearSecTop - 1} x2={plotLeft + plotW} y2={shearSecTop - 1} stroke={MIDAS.border} strokeWidth="0.8" />
        {/* 剪力 → 變形 */}
        <line x1={plotLeft} y1={defSecTop - 1} x2={plotLeft + plotW} y2={defSecTop - 1} stroke={MIDAS.border} strokeWidth="0.8" />

        {/* ═══════════════════════════════════════
            梁示意圖
            ═══════════════════════════════════════ */}
        <g>
          {/* 標題 */}
          <text
            x={plotLeft} y={beamSecTop + 14}
            fill={MIDAS.text} fontSize="10" fontWeight="600" fontFamily="var(--font-sans)"
          >
            📐 梁示意圖
          </text>

          {/* 梁本體 */}
          <rect
            x={scaleX(0)}
            y={beamSecTop + 22}
            width={scaleX(length) - scaleX(0)}
            height={BEAM_BAR}
            rx="2"
            fill={MIDAS.beam}
            opacity="0.88"
          />

          {/* 梁類型標籤 */}
          <text
            x={plotLeft + plotW / 2} y={beamSecTop + 16}
            textAnchor="middle" fill={MIDAS.textSecondary}
            fontSize="8" fontFamily="var(--font-sans)"
          >
            {supportType === 'simply' && '簡支梁'}
            {supportType === 'fixed' && '固定梁'}
            {supportType === 'cantilever' && '懸臂梁'}
          </text>

          {/* 跨度標註 */}
          <line
            x1={scaleX(0)} y1={beamSecTop + 22 + BEAM_BAR + 5}
            x2={scaleX(length)} y2={beamSecTop + 22 + BEAM_BAR + 5}
            stroke={MIDAS.textSecondary} strokeWidth="0.6"
            markerStart="url(#arrStart)" markerEnd="url(#arrEnd)"
          />
          <text
            x={(scaleX(0) + scaleX(length)) / 2}
            y={beamSecTop + 22 + BEAM_BAR + 14}
            textAnchor="middle" fill={MIDAS.textSecondary}
            fontSize="8" fontFamily="var(--font-mono)"
          >
            L = {length} m
          </text>

          {/* 支座 */}
          {(supportType === 'simply' || supportType === 'fixed') && (
            <>
              {/* 左支座 */}
              <polygon
                points={`${scaleX(0) - SUP_SZ / 2},${beamSecTop + 22 + BEAM_BAR} ${scaleX(0) + SUP_SZ / 2},${beamSecTop + 22 + BEAM_BAR} ${scaleX(0)},${beamSecTop + 22 + BEAM_BAR + SUP_SZ}`}
                fill={MIDAS.supportFill} stroke={MIDAS.support} strokeWidth="0.8"
              />
              <circle cx={scaleX(0)} cy={beamSecTop + 22 + BEAM_BAR} r="2" fill={MIDAS.support} />
              {/* 右支座 */}
              <polygon
                points={`${scaleX(length) - SUP_SZ / 2},${beamSecTop + 22 + BEAM_BAR} ${scaleX(length) + SUP_SZ / 2},${beamSecTop + 22 + BEAM_BAR} ${scaleX(length)},${beamSecTop + 22 + BEAM_BAR + SUP_SZ}`}
                fill={MIDAS.supportFill} stroke={MIDAS.support} strokeWidth="0.8"
              />
              <circle cx={scaleX(length)} cy={beamSecTop + 22 + BEAM_BAR} r="2" fill={MIDAS.support} />
            </>
          )}

          {/* 固定端標記 */}
          {supportType === 'fixed' && (
            <>
              <line x1={scaleX(0)} y1={beamSecTop + 19} x2={scaleX(0)} y2={beamSecTop + 22 + BEAM_BAR + 8} stroke={MIDAS.support} strokeWidth="2.5" />
              <line x1={scaleX(length)} y1={beamSecTop + 19} x2={scaleX(length)} y2={beamSecTop + 22 + BEAM_BAR + 8} stroke={MIDAS.support} strokeWidth="2.5" />
            </>
          )}

          {/* 懸臂端 */}
          {supportType === 'cantilever' && (
            <>
              <rect x={scaleX(0) - 3} y={beamSecTop + 19} width="6" height={BEAM_BAR + 6} rx="1" fill={MIDAS.support} />
              <line x1={scaleX(0) - 7} y1={beamSecTop + 21} x2={scaleX(0) - 7} y2={beamSecTop + 22 + BEAM_BAR - 1} stroke={MIDAS.support} strokeWidth="1.2" />
              <line x1={scaleX(0) - 11} y1={beamSecTop + 22} x2={scaleX(0) - 11} y2={beamSecTop + 22 + BEAM_BAR} stroke={MIDAS.support} strokeWidth="0.8" />
            </>
          )}
        </g>

        {/* ═══════════════════════════════════════
            彎矩圖 M（紅色系）
            ═══════════════════════════════════════ */}
        <g>
          {/* 背景網格 */}
          {gridVert.map((x, i) => (
            <line key={`mom-gv-${i}`} x1={x} y1={chartTop(momSecTop)} x2={x} y2={chartTop(momSecTop) + chartH} stroke={MIDAS.grid} strokeWidth="0.4" />
          ))}
          {Array.from({ length: 4 }).map((_, i) => {
            const y = chartTop(momSecTop) + (chartH / 3) * i;
            return (
              <line key={`mom-gh-${i}`} x1={plotLeft} y1={y} x2={plotLeft + plotW} y2={y} stroke={MIDAS.grid} strokeWidth="0.4" strokeDasharray="2,3" />
            );
          })}

          {/* 零線 */}
          <line x1={plotLeft} y1={momCenter} x2={plotLeft + plotW} y2={momCenter} stroke={MIDAS.grid} strokeWidth="0.6" strokeDasharray="3,3" />

          {/* 圖表名稱（左上） */}
          <text x={plotLeft} y={momSecTop + 13} fill={MIDAS.moment} fontSize="10" fontWeight="700" fontFamily="var(--font-sans)">
            彎矩圖 M (kN·m)
          </text>

          {/* 最大值（右上） */}
          <text
            x={plotLeft + plotW} y={momSecTop + 13}
            textAnchor="end" fill={MIDAS.moment} fontSize="9" fontWeight="700" fontFamily="var(--font-mono)"
          >
            Mmax = {maxMoment.toFixed(1)} kN·m
          </text>

          {/* 填色 */}
          <path d={momFill} fill="url(#momGrad)" stroke="none" />
          {/* 曲線 */}
          <path d={momPath} fill="none" stroke={MIDAS.moment} strokeWidth="1.8" />
        </g>

        {/* ═══════════════════════════════════════
            剪力圖 V（藍色系）
            ═══════════════════════════════════════ */}
        <g>
          {/* 背景網格 */}
          {gridVert.map((x, i) => (
            <line key={`sh-gv-${i}`} x1={x} y1={chartTop(shearSecTop)} x2={x} y2={chartTop(shearSecTop) + chartH} stroke={MIDAS.grid} strokeWidth="0.4" />
          ))}
          {Array.from({ length: 4 }).map((_, i) => {
            const y = chartTop(shearSecTop) + (chartH / 3) * i;
            return (
              <line key={`sh-gh-${i}`} x1={plotLeft} y1={y} x2={plotLeft + plotW} y2={y} stroke={MIDAS.grid} strokeWidth="0.4" strokeDasharray="2,3" />
            );
          })}

          {/* 零線 */}
          <line x1={plotLeft} y1={shCenter} x2={plotLeft + plotW} y2={shCenter} stroke={MIDAS.grid} strokeWidth="0.6" strokeDasharray="3,3" />

          {/* 圖表名稱 */}
          <text x={plotLeft} y={shearSecTop + 13} fill={MIDAS.shear} fontSize="10" fontWeight="700" fontFamily="var(--font-sans)">
            剪力圖 V (kN)
          </text>

          {/* 最大值 */}
          <text
            x={plotLeft + plotW} y={shearSecTop + 13}
            textAnchor="end" fill={MIDAS.shear} fontSize="9" fontWeight="700" fontFamily="var(--font-mono)"
          >
            Vmax = {maxShear.toFixed(1)} kN
          </text>

          {/* 填色 */}
          <path d={shFill} fill="url(#shGrad)" stroke="none" />
          {/* 曲線 */}
          <path d={shPath} fill="none" stroke={MIDAS.shear} strokeWidth="1.8" />
        </g>

        {/* ═══════════════════════════════════════
            變形圖 δ（灰色系）
            ═══════════════════════════════════════ */}
        <g>
          {/* 背景網格 */}
          {gridVert.map((x, i) => (
            <line key={`def-gv-${i}`} x1={x} y1={chartTop(defSecTop)} x2={x} y2={chartTop(defSecTop) + chartH} stroke={MIDAS.grid} strokeWidth="0.4" />
          ))}
          {Array.from({ length: 4 }).map((_, i) => {
            const y = chartTop(defSecTop) + (chartH / 3) * i;
            return (
              <line key={`def-gh-${i}`} x1={plotLeft} y1={y} x2={plotLeft + plotW} y2={y} stroke={MIDAS.grid} strokeWidth="0.4" strokeDasharray="2,3" />
            );
          })}

          {/* 零線 */}
          <line x1={plotLeft} y1={defCenter} x2={plotLeft + plotW} y2={defCenter} stroke={MIDAS.grid} strokeWidth="0.6" strokeDasharray="3,3" />

          {/* 圖表名稱 */}
          <text x={plotLeft} y={defSecTop + 13} fill={MIDAS.deflection} fontSize="10" fontWeight="700" fontFamily="var(--font-sans)">
            變形圖 δ (mm)
          </text>

          {/* 最大值 */}
          <text
            x={plotLeft + plotW} y={defSecTop + 13}
            textAnchor="end" fill={MIDAS.deflection} fontSize="9" fontWeight="700" fontFamily="var(--font-mono)"
          >
            δmax = {result.maxDeflection.toFixed(2)} mm
          </text>

          {/* 變形曲線（虛線） */}
          <path d={defPath} fill="none" stroke={MIDAS.deflection} strokeWidth="1.5" strokeDasharray="4,3" />
        </g>

        {/* ═══════════════════════════════════════
            安全狀態標籤
            ═══════════════════════════════════════ */}
        {result.section && (
          <g>
            <rect x={width - 90} y={2} width="82" height="18" rx="4" fill={result.isSafe ? '#F0FDF4' : '#FEF2F2'} stroke={result.isSafe ? MIDAS.safe : MIDAS.danger} strokeWidth="0.5" />
            <text x={width - 49} y={14} textAnchor="middle" fill={result.isSafe ? MIDAS.safe : MIDAS.danger} fontSize="9" fontWeight="700" fontFamily="var(--font-sans)">
              {result.isSafe ? '🟢 安全' : '🔴 不合格'}
            </text>
          </g>
        )}

        {/* ═══════════════════════════════════════
            圖例（底部）
            ═══════════════════════════════════════ */}
        <g transform={`translate(${plotLeft + 4}, ${svgH - 10})`}>
          <line x1="0" y1="0" x2="12" y2="0" stroke={MIDAS.moment} strokeWidth="1.5" />
          <text x="14" y="2" fill={MIDAS.textTertiary} fontSize="7" fontFamily="var(--font-sans)">M</text>
          <line x1="34" y1="0" x2="46" y2="0" stroke={MIDAS.shear} strokeWidth="1.5" />
          <text x="48" y="2" fill={MIDAS.textTertiary} fontSize="7" fontFamily="var(--font-sans)">V</text>
          <line x1="68" y1="0" x2="80" y2="0" stroke={MIDAS.deflection} strokeWidth="1.5" strokeDasharray="3,2" />
          <text x="82" y="2" fill={MIDAS.textTertiary} fontSize="7" fontFamily="var(--font-sans)">δ</text>
          <rect x="102" y="-3" width="7" height="7" rx="1" fill={MIDAS.supportFill} />
          <text x="111" y="2" fill={MIDAS.textTertiary} fontSize="7" fontFamily="var(--font-sans)">支座</text>
          <rect x="140" y="-3" width="7" height="7" rx="1" fill={MIDAS.beam} opacity="0.85" />
          <text x="149" y="2" fill={MIDAS.textTertiary} fontSize="7" fontFamily="var(--font-sans)">梁</text>
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
  className,
}: {
  result: ContinuousBeamResult;
  width?: number;
  className?: string;
}) {
  // ── 佈局 ──
  const plotW = width - PAD.left - PAD.right;
  const plotLeft = PAD.left;

  const totalLength = result.spans.reduce((sum, s) => sum + s.L, 0);
  let currentX = 0;
  const spanStarts = result.spans.map((span) => {
    const start = currentX;
    currentX += span.L;
    return start;
  });

  const scaleX = (x: number) => plotLeft + (x / totalLength) * plotW;

  // 最大值
  const allMoments = result.envelope.moment.map((p) => Math.abs(p.m));
  const allShears = result.envelope.shear.map((p) => Math.abs(p.v));
  const maxMom = Math.max(...allMoments, 0.01);
  const maxSh = Math.max(...allShears, 0.01);

  // 縱向佈局
  const beamSecTop = PAD.top;
  const momSecTop = beamSecTop + BEAM_SEC + DIAG_GAP;
  const shearSecTop = momSecTop + DIAG_H + DIAG_GAP;

  const svgH = PAD.top + BEAM_SEC + DIAG_GAP + (DIAG_H + DIAG_GAP) * 2 + 28;

  const chartTop = (secTop: number) => secTop + TITLE_H;
  const chartH = DIAG_H - TITLE_H;
  const chartCenter = (secTop: number) => chartTop(secTop) + chartH / 2;

  // ── 彎矩包絡線 ──
  const momCenter = chartCenter(momSecTop);
  const momScale = (chartH * 0.78) / maxMom;
  const momY = (m: number) => momCenter + m * momScale;

  const envMomentPath = result.envelope.moment
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${scaleX(p.x)},${momY(-p.m)}`)
    .join(' ');
  const envMomentFill = `${envMomentPath} L${scaleX(totalLength)},${momCenter} L${scaleX(0)},${momCenter} Z`;

  const spanMomentPaths = result.spans.map((span) =>
    span.momentPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${scaleX(p.x + spanStarts[span.index])},${momY(-p.m)}`)
      .join(' ')
  );

  // ── 剪力包絡線 ──
  const shCenter = chartCenter(shearSecTop);
  const shScale = (chartH * 0.78) / maxSh;
  const shY = (v: number) => shCenter + v * shScale;

  const envShearPath = result.envelope.shear
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${scaleX(p.x)},${shY(p.v)}`)
    .join(' ');
  const envShearFill = `${envShearPath} L${scaleX(totalLength)},${shCenter} L${scaleX(0)},${shCenter} Z`;

  // 垂直網格
  const gridVert = Array.from({ length: 6 }).map((_, i) => plotLeft + (plotW / 5) * i);

  return (
    <svg
      viewBox={`0 0 ${width} ${svgH}`}
      className={cn('w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700', className)}
      style={{ background: MIDAS.bg }}
    >
      <defs>
        <linearGradient id="envM" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={MIDAS.moment} stopOpacity="0.22" />
          <stop offset="100%" stopColor={MIDAS.moment} stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id="envV" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={MIDAS.shear} stopOpacity="0.18" />
          <stop offset="100%" stopColor={MIDAS.shear} stopOpacity="0.04" />
        </linearGradient>
        <marker id="arrStart" markerWidth="5" markerHeight="5" refX="0" refY="2.5" orient="auto">
          <path d="M5,0 L0,2.5 L5,5" fill="none" stroke={MIDAS.textSecondary} strokeWidth="0.7" />
        </marker>
        <marker id="arrEnd" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
          <path d="M0,0 L5,2.5 L0,5" fill="none" stroke={MIDAS.textSecondary} strokeWidth="0.7" />
        </marker>
      </defs>

      {/* 分隔線 */}
      <line x1={plotLeft} y1={momSecTop - 1} x2={plotLeft + plotW} y2={momSecTop - 1} stroke={MIDAS.border} strokeWidth="0.8" />
      <line x1={plotLeft} y1={shearSecTop - 1} x2={plotLeft + plotW} y2={shearSecTop - 1} stroke={MIDAS.border} strokeWidth="0.8" />

      {/* ═══════════════════════════════════════
          連續梁示意圖
          ═══════════════════════════════════════ */}
      <g>
        {/* 標題 */}
        <text
          x={plotLeft} y={beamSecTop + 14}
          fill={MIDAS.text} fontSize="10" fontWeight="600" fontFamily="var(--font-sans)"
        >
          📐 連續梁示意圖（{result.spans.length} 跨）
        </text>

        {/* 梁本體 */}
        <rect
          x={scaleX(0)} y={beamSecTop + 22}
          width={scaleX(totalLength) - scaleX(0)}
          height={BEAM_BAR} rx="1"
          fill={MIDAS.beam} opacity="0.88"
        />

        {/* 跨度標註 */}
        {result.spans.map((span, i) => {
          const sx = scaleX(spanStarts[i]);
          const ex = scaleX(spanStarts[i] + span.L);
          const cx = (sx + ex) / 2;
          return (
            <g key={`cspan-${i}`}>
              <line x1={sx} y1={beamSecTop + 22 + BEAM_BAR + 5} x2={ex} y2={beamSecTop + 22 + BEAM_BAR + 5} stroke={MIDAS.textSecondary} strokeWidth="0.6" markerStart="url(#arrStart)" markerEnd="url(#arrEnd)" />
              <text x={cx} y={beamSecTop + 22 + BEAM_BAR + 14} textAnchor="middle" fill={MIDAS.textSecondary} fontSize="7" fontFamily="var(--font-mono)">
                Span {i + 1}: {span.L.toFixed(1)}m
              </text>
            </g>
          );
        })}

        {/* 支座 */}
        {Array.from({ length: result.spans.length + 1 }).map((_, i) => {
          const x = scaleX(i === 0 ? 0 : i === result.spans.length ? totalLength : spanStarts[i]);
          return (
            <g key={`csupp-${i}`}>
              <polygon
                points={`${x - SUP_SZ / 2},${beamSecTop + 22 + BEAM_BAR} ${x + SUP_SZ / 2},${beamSecTop + 22 + BEAM_BAR} ${x},${beamSecTop + 22 + BEAM_BAR + SUP_SZ}`}
                fill={MIDAS.supportFill} stroke={MIDAS.support} strokeWidth="0.8"
              />
              <circle cx={x} cy={beamSecTop + 22 + BEAM_BAR} r="2" fill={MIDAS.support} />
            </g>
          );
        })}
      </g>

      {/* ═══════════════════════════════════════
          彎矩包絡線（紅色系）
          ═══════════════════════════════════════ */}
      <g>
        {/* 網格 */}
        {gridVert.map((x, i) => (
          <line key={`cm-gv-${i}`} x1={x} y1={chartTop(momSecTop)} x2={x} y2={chartTop(momSecTop) + chartH} stroke={MIDAS.grid} strokeWidth="0.4" />
        ))}
        {Array.from({ length: 4 }).map((_, i) => {
          const y = chartTop(momSecTop) + (chartH / 3) * i;
          return (
            <line key={`cm-gh-${i}`} x1={plotLeft} y1={y} x2={plotLeft + plotW} y2={y} stroke={MIDAS.grid} strokeWidth="0.4" strokeDasharray="2,3" />
          );
        })}

        <line x1={plotLeft} y1={momCenter} x2={plotLeft + plotW} y2={momCenter} stroke={MIDAS.grid} strokeWidth="0.6" strokeDasharray="3,3" />

        <text x={plotLeft} y={momSecTop + 13} fill={MIDAS.moment} fontSize="10" fontWeight="700" fontFamily="var(--font-sans)">
          彎矩包絡線 M (kN·m)
        </text>
        <text x={plotLeft + plotW} y={momSecTop + 13} textAnchor="end" fill={MIDAS.moment} fontSize="9" fontWeight="700" fontFamily="var(--font-mono)">
          Mmax = {maxMom.toFixed(1)} kN·m
        </text>

        <path d={envMomentFill} fill="url(#envM)" stroke="none" />
        {spanMomentPaths.map((path, i) => (
          <path key={`csm-${i}`} d={path} fill="none" stroke={MIDAS.moment} strokeWidth="0.8" opacity="0.35" />
        ))}
        <path d={envMomentPath} fill="none" stroke={MIDAS.moment} strokeWidth="2.2" />
      </g>

      {/* ═══════════════════════════════════════
          剪力包絡線（藍色系）
          ═══════════════════════════════════════ */}
      <g>
        {/* 網格 */}
        {gridVert.map((x, i) => (
          <line key={`cv-gv-${i}`} x1={x} y1={chartTop(shearSecTop)} x2={x} y2={chartTop(shearSecTop) + chartH} stroke={MIDAS.grid} strokeWidth="0.4" />
        ))}
        {Array.from({ length: 4 }).map((_, i) => {
          const y = chartTop(shearSecTop) + (chartH / 3) * i;
          return (
            <line key={`cv-gh-${i}`} x1={plotLeft} y1={y} x2={plotLeft + plotW} y2={y} stroke={MIDAS.grid} strokeWidth="0.4" strokeDasharray="2,3" />
          );
        })}

        <line x1={plotLeft} y1={shCenter} x2={plotLeft + plotW} y2={shCenter} stroke={MIDAS.grid} strokeWidth="0.6" strokeDasharray="3,3" />

        <text x={plotLeft} y={shearSecTop + 13} fill={MIDAS.shear} fontSize="10" fontWeight="700" fontFamily="var(--font-sans)">
          剪力包絡線 V (kN)
        </text>
        <text x={plotLeft + plotW} y={shearSecTop + 13} textAnchor="end" fill={MIDAS.shear} fontSize="9" fontWeight="700" fontFamily="var(--font-mono)">
          Vmax = {maxSh.toFixed(1)} kN
        </text>

        <path d={envShearFill} fill="url(#envV)" stroke="none" />
        <path d={envShearPath} fill="none" stroke={MIDAS.shear} strokeWidth="2.2" />
      </g>

      {/* 反力資訊 */}
      <text x={plotLeft} y={svgH - 10} fill={MIDAS.textTertiary} fontSize="7" fontFamily="var(--font-sans)">
        各跨反力：
        {result.spans.map((s, i) => `R${i + 1}L=${s.reactions.left.toFixed(0)}kN R${i + 1}R=${s.reactions.right.toFixed(0)}kN`).join(' | ')}
      </text>
    </svg>
  );
}
