"use client";

import { cn } from "@/lib/utils";

/**
 * PM 交互曲線 SVG 元件
 *
 * 繪製 RC 柱之 PM 交互曲線圖：
 * - X 軸：φMn (kN·m)
 * - Y 軸：φPn (kN)
 * - 繪製 PM 曲線
 * - 標示設計點 (Pu, Mu)
 * - 安全區填色
 */
interface PnCurveProps {
  /** PM 曲線點陣列 */
  points: { phiPn: number; phiMn: number }[];
  /** 設計軸壓力 Pu (kN) */
  Pu: number;
  /** 設計彎矩 Mu (kN·m) */
  Mu: number;
  /** 斷面描述 */
  sectionDesc?: string;
  /** SVG 尺寸 */
  width?: number;
  height?: number;
  className?: string;
}

// ── 佈局常數 ──
const MARGIN = { top: 30, right: 30, bottom: 40, left: 55 };
const ORANGE = "#FF6D00";
const ORANGE_LIGHT = "rgba(255,109,0,0.15)";
const GREEN = "#22C55E";
const GREEN_LIGHT = "rgba(34,197,94,0.15)";
const RED = "#EF4444";
const GRID_COLOR = "#E4E4E7";
const TEXT_COLOR = "#71717A";
const AXIS_COLOR = "#A1A1AA";

export default function PnCurve({
  points,
  Pu,
  Mu,
  sectionDesc = "RC 柱 PM 曲線",
  width = 400,
  height = 400,
  className,
}: PnCurveProps) {
  if (!points || points.length === 0) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={cn(
          "w-full h-auto rounded-lg border border-dashed border-[var(--border)] bg-white/50",
          className,
        )}
      >
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          fill={TEXT_COLOR}
          fontSize="13"
          fontFamily="var(--font-sans)"
        >
          請先執行計算以顯示 PM 曲線
        </text>
      </svg>
    );
  }

  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = height - MARGIN.top - MARGIN.bottom;
  const plotLeft = MARGIN.left;
  const plotBottom = height - MARGIN.bottom;

  // 尋找數據範圍
  const allPn = points.map((p) => p.phiPn);
  const allMn = points.map((p) => Math.abs(p.phiMn));

  // 右半側點（正彎矩）
  const rightPoints = points.filter((p) => p.phiMn >= 0);
  const rightMn = rightPoints.map((p) => p.phiMn);
  const rightPn = rightPoints.map((p) => p.phiPn);

  let maxMn = Math.max(...rightMn, Math.abs(Mu)) * 1.15;
  let maxPn = Math.max(...rightPn, Pu) * 1.15;
  let minPn = Math.min(...rightPn, 0) * 1.1;

  // 取整數
  maxMn = Math.ceil(maxMn / 50) * 50 || 100;
  maxPn = Math.ceil(maxPn / 50) * 50 || 100;
  minPn = Math.floor(minPn / 50) * 50 || -50;

  // 縮放函數
  const xScale = (m: number) => plotLeft + (m / maxMn) * plotW;
  const yScale = (p: number) => plotBottom - ((p - minPn) / (maxPn - minPn)) * plotH;

  // 繪製 PM 曲線路徑（右半側）
  const rightPath = rightPoints
    .map((p, i) => {
      const cmd = i === 0 ? "M" : "L";
      return `${cmd}${xScale(p.phiMn)},${yScale(p.phiPn)}`;
    })
    .join(" ");

  // 左半側（對稱，負彎矩）
  const leftPoints = points
    .filter((p) => p.phiMn < 0)
    .sort((a, b) => a.phiMn - b.phiMn);
  const leftPath = leftPoints
    .map((p, i) => {
      const cmd = i === 0 ? "M" : "L";
      return `${cmd}${xScale(Math.abs(p.phiMn))},${yScale(p.phiPn)}`;
    })
    .join(" ");

  // 安全區填色（封閉路徑）
  const fillPath = `${rightPath} L${xScale(0)},${yScale(0)} Z`;

  // 網格線
  const nGridX = 5;
  const nGridY = 5;
  const gridLinesX = Array.from({ length: nGridX + 1 }, (_, i) => (maxMn / nGridX) * i);
  const gridLinesY = Array.from({ length: nGridY + 1 }, (_, i) => minPn + ((maxPn - minPn) / nGridY) * i);

  // 設計點是否在安全區內
  const isSafe = (() => {
    // 射線法判斷
    if (Pu <= 0 && Math.abs(Mu) <= maxMn) return true;
    if (Math.abs(Mu) <= 0.01) {
      const maxPnAtZero = Math.max(...rightPoints.filter((p) => Math.abs(p.phiMn) < 0.01).map((p) => p.phiPn), 0);
      return Pu <= maxPnAtZero;
    }
    // 用角度比較
    const angle = Math.atan2(Pu, Math.abs(Mu));
    for (let i = 0; i < rightPoints.length - 1; i++) {
      const p1 = rightPoints[i];
      const p2 = rightPoints[i + 1];
      const a1 = Math.atan2(p1.phiPn, p1.phiMn);
      const a2 = Math.atan2(p2.phiPn, p2.phiMn);
      if (angle >= a1 && angle <= a2) {
        const r1 = Math.sqrt(p1.phiPn ** 2 + p1.phiMn ** 2);
        const r2 = Math.sqrt(p2.phiPn ** 2 + p2.phiMn ** 2);
        const r = Math.sqrt(Pu ** 2 + Mu ** 2);
        // 線性內插
        const t = a2 === a1 ? 0 : (angle - a1) / (a2 - a1);
        const boundaryR = r1 + t * (r2 - r1);
        return r <= boundaryR;
      }
    }
    return false;
  })();

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("w-full h-auto rounded-lg bg-white", className)}
    >
      {/* ── 網格 ── */}
      {gridLinesX.map((val) => (
        <line
          key={`gx-${val}`}
          x1={xScale(val)}
          y1={plotBottom}
          x2={xScale(val)}
          y2={plotBottom - plotH}
          stroke={GRID_COLOR}
          strokeWidth="0.5"
        />
      ))}
      {gridLinesY.map((val) => (
        <line
          key={`gy-${val}`}
          x1={plotLeft}
          y1={yScale(val)}
          x2={plotLeft + plotW}
          y2={yScale(val)}
          stroke={GRID_COLOR}
          strokeWidth="0.5"
        />
      ))}

      {/* ── 軸線 ── */}
      {/* X 軸 */}
      <line
        x1={plotLeft}
        y1={yScale(0)}
        x2={plotLeft + plotW}
        y2={yScale(0)}
        stroke={AXIS_COLOR}
        strokeWidth="1.5"
      />
      {/* Y 軸 */}
      <line
        x1={plotLeft}
        y1={plotBottom}
        x2={plotLeft}
        y2={plotBottom - plotH}
        stroke={AXIS_COLOR}
        strokeWidth="1.5"
      />

      {/* ── 軸標籤 ── */}
      <text
        x={plotLeft + plotW / 2}
        y={height - 5}
        textAnchor="middle"
        fill={TEXT_COLOR}
        fontSize="11"
        fontFamily="var(--font-sans)"
      >
        φMn (kN·m)
      </text>
      <text
        x={12}
        y={plotBottom - plotH / 2}
        textAnchor="middle"
        fill={TEXT_COLOR}
        fontSize="11"
        fontFamily="var(--font-sans)"
        transform={`rotate(-90, 12, ${plotBottom - plotH / 2})`}
      >
        φPn (kN)
      </text>

      {/* ── 刻度文字 ── */}
      {gridLinesX.map((val) => (
        <text
          key={`tx-${val}`}
          x={xScale(val)}
          y={plotBottom + 15}
          textAnchor="middle"
          fill={TEXT_COLOR}
          fontSize="9"
          fontFamily="var(--font-mono)"
        >
          {Math.round(val)}
        </text>
      ))}
      {gridLinesY.map((val) => (
        <text
          key={`ty-${val}`}
          x={plotLeft - 8}
          y={yScale(val) + 3}
          textAnchor="end"
          fill={TEXT_COLOR}
          fontSize="9"
          fontFamily="var(--font-mono)"
        >
          {Math.round(val)}
        </text>
      ))}

      {/* ── PM 曲線（左半側）── */}
      {leftPoints.length > 1 && (
        <path d={leftPath} fill="none" stroke={ORANGE} strokeWidth="2" />
      )}

      {/* ── 安全區填色 ── */}
      <path d={fillPath} fill={ORANGE_LIGHT} stroke="none" opacity="0.6" />

      {/* ── PM 曲線（右半側）── */}
      <path d={rightPath} fill="none" stroke={ORANGE} strokeWidth="2.5" />

      {/* ── 設計點 (Pu, Mu) ── */}
      <g>
        {/* 從原點到設計點的連線 */}
        <line
          x1={xScale(0)}
          y1={yScale(0)}
          x2={xScale(Math.abs(Mu))}
          y2={yScale(Pu)}
          stroke={isSafe ? GREEN : RED}
          strokeWidth="1.5"
          strokeDasharray="4,3"
        />
        {/* 設計點圓形 */}
        <circle
          cx={xScale(Math.abs(Mu))}
          cy={yScale(Pu)}
          r="6"
          fill={isSafe ? GREEN : RED}
          stroke="white"
          strokeWidth="2"
        />
        {/* 設計點標籤 */}
        <text
          x={xScale(Math.abs(Mu)) + 10}
          y={yScale(Pu) - 5}
          fill={isSafe ? GREEN : RED}
          fontSize="10"
          fontWeight="600"
          fontFamily="var(--font-mono)"
        >
          ({Mu.toFixed(1)}, {Pu.toFixed(1)})
        </text>
        <text
          x={xScale(Math.abs(Mu)) + 10}
          y={yScale(Pu) + 8}
          fill={isSafe ? GREEN : RED}
          fontSize="9"
          fontFamily="var(--font-sans)"
        >
          {isSafe ? "✅ 安全" : "❌ 不安全"}
        </text>
      </g>

      {/* ── 標題 ── */}
      <text
        x={plotLeft + plotW / 2}
        y={MARGIN.top - 8}
        textAnchor="middle"
        fill="#37474F"
        fontSize="12"
        fontWeight="600"
        fontFamily="var(--font-sans)"
      >
        {sectionDesc}
      </text>

      {/* ── 圖例 ── */}
      <g transform={`translate(${plotLeft + plotW - 100}, ${MARGIN.top + 5})`}>
        <rect x="0" y="0" width="95" height="48" rx="4" fill="white" stroke={GRID_COLOR} strokeWidth="0.5" />
        <line x1="8" y1="15" x2="30" y2="15" stroke={ORANGE} strokeWidth="2" />
        <text x="35" y="18" fill={TEXT_COLOR} fontSize="8" fontFamily="var(--font-sans)">PM 曲線</text>
        <circle cx="15" cy="33" r="3" fill={isSafe ? GREEN : RED} />
        <text x="25" y="36" fill={TEXT_COLOR} fontSize="8" fontFamily="var(--font-sans)">
          設計點 ({Pu.toFixed(0)},{Mu.toFixed(0)})
        </text>
      </g>
    </svg>
  );
}
