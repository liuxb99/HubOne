"use client";

import { cn } from "@/lib/utils";

/**
 * 配筋詳圖 SVG 元件
 *
 * 繪製：
 * - RC 梁斷面配筋圖
 * - RC 柱斷面配筋圖
 * - 標註尺寸、保護層、鋼筋編號
 *
 * 採用 2D 斷面視圖，上方為受壓區，下方為受拉區。
 */
interface RebarDetailProps {
  /** 斷面類型 */
  type: 'beam' | 'column';
  /** 斷面寬度 (mm) */
  b: number;
  /** 斷面深度 (mm) */
  h: number;
  /** 保護層厚度 (mm) */
  cover?: number;
  /** 拉力鋼筋描述，如 "2-D25" */
  tensionBars?: string[];
  /** 壓力鋼筋描述，如 "2-D16" */
  compressionBars?: string[];
  /** 箍筋描述，如 "D13@200" */
  stirrup?: string;
  /** 總鋼筋量 (mm²) */
  As_total?: number;
  /** 鋼筋比 */
  rho_g?: number;
  /** SVG 尺寸 */
  width?: number;
  height?: number;
  className?: string;
}

// ── 佈局常數 ──
const PADDING = 30;
const SCALE = 0.7; // 縮放比例
const REBAR_RADIUS = 5;
const STIRRUP_OFFSET = 10;

export default function RebarDetail({
  type,
  b,
  h,
  cover = 40,
  tensionBars = ["2-D25"],
  compressionBars = ["2-D16"],
  stirrup = "D13@200",
  As_total,
  rho_g,
  width: svgWidth = 300,
  height: svgHeight = 350,
  className,
}: RebarDetailProps) {
  // 計算繪圖比例
  const drawW = b * SCALE;
  const drawH = h * SCALE;
  const drawCover = cover * SCALE;

  const centerX = PADDING + drawW / 2;
  const centerY = PADDING + drawH / 2;
  const leftX = PADDING;
  const rightX = PADDING + drawW;
  const topY = PADDING;
  const bottomY = PADDING + drawH;

  // 鋼筋位置（等間距分佈）
  const nTension = tensionBars.length > 0
    ? parseInt(tensionBars[0]?.split('-')[0] ?? '2')
    : 0;
  const nCompression = compressionBars.length > 0
    ? parseInt(compressionBars[0]?.split('-')[0] ?? '2')
    : 0;

  const tensionSpacing = nTension > 1 ? (drawW - 2 * drawCover) / (nTension - 1) : 0;
  const compressionSpacing = nCompression > 1 ? (drawW - 2 * drawCover) / (nCompression - 1) : 0;

  const tensionY = bottomY - drawCover;
  const compressionY = topY + drawCover;

  // 產生鋼筋圓
  const tensionRebars = [];
  for (let i = 0; i < nTension; i++) {
    const x = leftX + drawCover + i * tensionSpacing;
    tensionRebars.push({ x, y: tensionY, label: `${i + 1}` });
  }

  const compressionRebars = [];
  for (let i = 0; i < nCompression; i++) {
    const x = leftX + drawCover + i * compressionSpacing;
    compressionRebars.push({ x, y: compressionY, label: `${i + 1}` });
  }

  // 尺寸線位置
  const dimY = bottomY + 30;
  const dimX = rightX + 25;

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className={cn('w-full h-auto rounded-lg bg-white', className)}
    >
      <defs>
        <pattern id="concrete" patternUnits="userSpaceOnUse" width="8" height="8">
          <circle cx="4" cy="4" r="0.8" fill="#BCAAA4" opacity="0.3" />
        </pattern>
        <marker id="arrowStart" markerWidth="6" markerHeight="6" refX="0" refY="3" orient="auto">
          <path d="M6,0 L0,3 L6,6" fill="none" stroke="#546E7A" strokeWidth="1" />
        </marker>
        <marker id="arrowEnd" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6" fill="none" stroke="#546E7A" strokeWidth="1" />
        </marker>
      </defs>

      {/* ── 斷面外框 ── */}
      <rect
        x={leftX}
        y={topY}
        width={drawW}
        height={drawH}
        fill="url(#concrete)"
        stroke="#78909C"
        strokeWidth="2"
        rx="2"
      />

      {/* ── 保護層區域（虛線內框） ── */}
      <rect
        x={leftX + drawCover}
        y={topY + drawCover}
        width={drawW - 2 * drawCover}
        height={drawH - 2 * drawCover}
        fill="none"
        stroke="#90A4AE"
        strokeWidth="0.8"
        strokeDasharray="4,3"
        rx="1"
      />

      {/* ── 箍筋 ── */}
      <rect
        x={leftX + drawCover - STIRRUP_OFFSET * SCALE}
        y={topY + drawCover - STIRRUP_OFFSET * SCALE}
        width={drawW - 2 * drawCover + 2 * STIRRUP_OFFSET * SCALE}
        height={drawH - 2 * drawCover + 2 * STIRRUP_OFFSET * SCALE}
        fill="none"
        stroke="#FF6D00"
        strokeWidth="1.5"
        rx="1"
      />

      {/* ── 拉力鋼筋（下方） ── */}
      {tensionRebars.map((rebar, i) => (
        <g key={`t-${i}`}>
          <circle cx={rebar.x} cy={rebar.y} r={REBAR_RADIUS} fill="#37474F" stroke="#263238" strokeWidth="1" />
          <text
            x={rebar.x}
            y={rebar.y + 1.5}
            textAnchor="middle"
            fill="white"
            fontSize="7"
            fontWeight="600"
            fontFamily="sans-serif"
          >
            {rebar.label}
          </text>
        </g>
      ))}

      {/* ── 壓力鋼筋（上方） ── */}
      {compressionRebars.map((rebar, i) => (
        <g key={`c-${i}`}>
          <circle cx={rebar.x} cy={rebar.y} r={REBAR_RADIUS} fill="#78909C" stroke="#546E7A" strokeWidth="1" />
          <text
            x={rebar.x}
            y={rebar.y + 1.5}
            textAnchor="middle"
            fill="white"
            fontSize="7"
            fontWeight="600"
            fontFamily="sans-serif"
          >
            {rebar.label}
          </text>
        </g>
      ))}

      {/* ── 斷面寬度標註 (b) ── */}
      <line
        x1={leftX} y1={dimY}
        x2={rightX} y2={dimY}
        stroke="#546E7A"
        strokeWidth="1"
        markerStart="url(#arrowStart)"
        markerEnd="url(#arrowEnd)"
      />
      <line x1={leftX} y1={dimY - 5} x2={leftX} y2={dimY + 5} stroke="#546E7A" strokeWidth="1" />
      <line x1={rightX} y1={dimY - 5} x2={rightX} y2={dimY + 5} stroke="#546E7A" strokeWidth="1" />
      <text
        x={centerX}
        y={dimY + 16}
        textAnchor="middle"
        fill="#546E7A"
        fontSize="11"
        fontFamily="var(--font-mono)"
      >
        b = {b} mm
      </text>

      {/* ── 斷面深度標註 (h) ── */}
      <line
        x1={dimX} y1={topY}
        x2={dimX} y2={bottomY}
        stroke="#546E7A"
        strokeWidth="1"
        markerStart="url(#arrowStart)"
        markerEnd="url(#arrowEnd)"
      />
      <line x1={dimX - 5} y1={topY} x2={dimX + 5} y2={topY} stroke="#546E7A" strokeWidth="1" />
      <line x1={dimX - 5} y1={bottomY} x2={dimX + 5} y2={bottomY} stroke="#546E7A" strokeWidth="1" />
      <text
        x={dimX + 8}
        y={centerY + 4}
        textAnchor="start"
        fill="#546E7A"
        fontSize="11"
        fontFamily="var(--font-mono)"
      >
        h = {h} mm
      </text>

      {/* ── 保護層標註 ── */}
      <text
        x={leftX + drawCover / 2}
        y={topY + drawH + 12}
        textAnchor="middle"
        fill="#90A4AE"
        fontSize="8"
        fontFamily="var(--font-mono)"
      >
        c={cover}
      </text>

      {/* ── 鋼筋標籤 ── */}
      <text
        x={centerX}
        y={tensionY + REBAR_RADIUS + 14}
        textAnchor="middle"
        fill="#37474F"
        fontSize="9"
        fontWeight="600"
        fontFamily="var(--font-sans)"
      >
        {tensionBars.join(', ')} (拉力筋)
      </text>
      <text
        x={centerX}
        y={compressionY - REBAR_RADIUS - 6}
        textAnchor="middle"
        fill="#78909C"
        fontSize="9"
        fontWeight="600"
        fontFamily="var(--font-sans)"
      >
        {compressionBars.join(', ')} (壓力筋)
      </text>

      {/* ── 箍筋標籤 ── */}
      <text
        x={rightX + 8}
        y={topY + drawCover - STIRRUP_OFFSET * SCALE + 4}
        textAnchor="start"
        fill="#FF6D00"
        fontSize="9"
        fontWeight="600"
        fontFamily="var(--font-sans)"
      >
        箍筋 {stirrup}
      </text>

      {/* ── 底部資訊區 ── */}
      {type === 'beam' ? (
        <text
          x={centerX}
          y={svgHeight - 10}
          textAnchor="middle"
          fill="#546E7A"
          fontSize="11"
          fontWeight="600"
          fontFamily="var(--font-sans)"
        >
          RC 梁斷面配筋圖
        </text>
      ) : (
        <text
          x={centerX}
          y={svgHeight - 10}
          textAnchor="middle"
          fill="#546E7A"
          fontSize="11"
          fontWeight="600"
          fontFamily="var(--font-sans)"
        >
          RC 柱斷面配筋圖
          {rho_g !== undefined && As_total !== undefined && (
            <tspan fill="#90A4AE" fontSize="9">
              {'  '}ρ_g = {(rho_g * 100).toFixed(2)}% | As_total = {As_total} mm²
            </tspan>
          )}
        </text>
      )}
    </svg>
  );
}
