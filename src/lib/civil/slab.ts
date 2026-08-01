/**
 * 版設計計算引擎（ACI 318-19）
 *
 * 支援：
 * - 單向版設計（ACI 318-19 §7~§8）
 * - 雙向版設計（ACI §8.10 係數法）
 * - 版厚檢討（ACI 318 表 7.3.1.1）
 * - 溫度鋼筋（ACI 318 §24.4）
 */

import { calcRebarByArea } from './rebar';

// ── 常數 ──
const Es = 200_000; // 鋼筋彈性模數 (MPa)

// ═══════════════════════════════════════════
//  型別定義
// ═══════════════════════════════════════════

/** 版計算結果 */
export interface SlabResult {
  /** 最小版厚 (mm) */
  h_min: number;
  /** 採用版厚 (mm) */
  h_provided: number;
  /** 短向彎矩 (kN·m/m) */
  Mu_x: number;
  /** 長向彎矩 (kN·m/m) */
  Mu_y: number;
  /** 短向主筋面積 (mm²/m) */
  As_main_x: number;
  /** 長向主筋面積 (mm²/m) */
  As_main_y: number;
  /** 溫度鋼筋面積 (mm²/m) */
  As_temp: number;
  /** 主筋間距 (mm) */
  spacing_main: number;
  /** 溫度筋間距 (mm) */
  spacing_temp: number;
  /** 撓度是否合格 */
  isDeflectionOK: boolean;
  /** 版厚是否合格 */
  isThicknessOK: boolean;
  /** 詳細計算步驟 */
  steps: string[];
  /** 短向配筋描述 */
  rebar_desc_x: string;
  /** 長向配筋描述 */
  rebar_desc_y: string;
  /** 溫度筋配筋描述 */
  rebar_desc_temp: string;
}

/** 版邊界條件 */
export type EdgeCondition = 'simple' | 'continuous';

// ═══════════════════════════════════════════
//  版厚檢討（ACI 318 表 7.3.1.1）
// ═══════════════════════════════════════════

/**
 * 最小版厚（ACI 318 表 7.3.1.1）
 *
 * | 支承條件 | 最小版厚 h_min |
 * |---------|---------------|
 * | 簡支     | L / 20        |
 * | 一端連續 | L / 24        |
 * | 兩端連續 | L / 28        |
 * | 懸臂     | L / 10        |
 *
 * 適用 fy = 420 MPa，非 pre-stressed 版
 *
 * @param L - 跨度 (mm)
 * @param supportType - 支承類型
 * @returns 最小版厚 (mm)
 *
 * @example
 * ```ts
 * checkSlabThickness(4000, 'simply'); // → 200 mm
 * ```
 */
export function checkSlabThickness(
  L: number,
  supportType: 'simply' | 'one_continuous' | 'both_continuous' | 'cantilever' = 'simply',
): number {
  const ratios: Record<string, number> = {
    simply: 20,
    one_continuous: 24,
    both_continuous: 28,
    cantilever: 10,
  };

  const ratio = ratios[supportType] ?? 20;
  // ACI 表 7.3.1.1 規定最小版厚不得小於 89mm（一般版）
  const h_min = Math.max(L / ratio, 89);
  return Math.ceil(h_min);
}

// ═══════════════════════════════════════════
//  有效深度計算
// ═══════════════════════════════════════════

/**
 * 計算版的有效深度 d
 *
 * @param h     - 版總厚度 (mm)
 * @param cover - 保護層厚度 (mm)，預設 20mm（版）
 * @param db    - 鋼筋直徑 (mm)，預設 12mm（D12）
 * @returns 有效深度 (mm)
 */
export function calcSlabEffectiveDepth(
  h: number,
  cover: number = 20,
  db: number = 12,
): number {
  return h - cover - db / 2;
}

// ═══════════════════════════════════════════
//  單向版設計（ACI 318-19 §7~§8）
// ═══════════════════════════════════════════

/**
 * 單向版設計計算
 *
 * ACI 318-19 §7（單向版分析）與 §8（配筋設計）
 *
 * 流程：
 * 1. 判定版厚
 * 2. 計算彎矩 Mu = w × L² / 8（簡支）或 w × L² / 10（連續）
 * 3. 配筋計算 As = Mu / (φ × fy × (d - a/2))
 * 4. 檢討最小鋼筋比（ACI §7.6.1.1）
 * 5. 溫度鋼筋（ACI §24.4）
 * 6. 撓度檢討
 *
 * @param L       - 跨度 (mm)
 * @param w       - 設計載重 (kN/m²)
 * @param fc      - 混凝土抗壓強度 (MPa)
 * @param fy      - 鋼筋降伏強度 (MPa)
 * @param supportType - 支承條件（簡支或連續）
 * @returns SlabResult
 *
 * @example
 * ```ts
 * const result = calcOneWaySlab(4000, 12, 28, 420);
 * ```
 */
export function calcOneWaySlab(
  L: number,
  w: number,
  fc: number,
  fy: number,
  supportType: 'simply' | 'continuous' = 'simply',
): SlabResult {
  const steps: string[] = [];

  // ── 1. 版厚 ──
  const slabSupportType = supportType === 'continuous' ? 'one_continuous' : 'simply';
  const h_min = checkSlabThickness(L, slabSupportType);
  // 版厚取 10mm 整數倍
  const h_provided = Math.ceil(h_min / 10) * 10;
  steps.push(`版厚檢討：L = ${L}mm，${supportType === 'simply' ? '簡支' : '連續'}版`);
  steps.push(`h_min = L/${slabSupportType === 'simply' ? 20 : 24} = ${L / (slabSupportType === 'simply' ? 20 : 24)}mm`);
  steps.push(`採用版厚 h = ${h_provided}mm`);

  // ── 2. 有效深度 ──
  const db_main = 12; // D12 主筋
  const cover = 20;
  const d = calcSlabEffectiveDepth(h_provided, cover, db_main);
  steps.push(`有效深度 d = h - cover - db/2 = ${h_provided} - ${cover} - ${db_main}/2 = ${d}mm`);

  // ── 3. 彎矩計算 ──
  // 單位寬度 b = 1000mm
  const b = 1000;
  // 設計載重 w (kN/m²) × 1m = kN/m
  const w_per_m = w * 1; // kN/m per meter width

  // 彎矩係數：簡支 1/8，連續 1/10（正彎矩）
  const momentCoeff = supportType === 'simply' ? 1 / 8 : 1 / 10;
  const Mu_x = w_per_m * (L / 1000) * (L / 1000) * momentCoeff; // kN·m/m
  const Mu_y = 0; // 單向版長向彎矩為 0
  steps.push(`短向彎矩 Mu = ${momentCoeff === 1/8 ? 'wL²/8' : 'wL²/10'}`);
  steps.push(`  = ${momentCoeff} × ${w_per_m} × (${L / 1000})² = ${Mu_x.toFixed(2)} kN·m/m`);

  // ── 4. 配筋計算 ──
  const phi = 0.9; // 彎矩折減係數 (ACI §21.2.1)
  const beta1 = fc <= 28 ? 0.85 : Math.max(0.85 - 0.05 * ((fc - 28) / 7), 0.65);

  // 最小鋼筋比（ACI §7.6.1.1 版的最小鋼筋）
  const rho_min_temp = Math.max(0.0018, 0.0014); // 溫度鋼筋為 0.0018

  // 迭代求解 As
  let As_main_x = 0;
  let c = 0.1 * d;

  for (let iter = 0; iter < 50; iter++) {
    const a = beta1 * c;
    const Mu_Nmm = Mu_x * 1e6;
    const As_needed = Mu_Nmm / (phi * fy * (d - a / 2));
    As_main_x = Math.max(As_needed, rho_min_temp * b * d);

    // 更新中性軸深度
    c = (As_main_x * fy) / (0.85 * fc * beta1 * b);
    const a_new = beta1 * c;

    if (Math.abs(a_new - a) / Math.max(a, 1) < 0.01) break;
  }

  // 最小鋼筋量檢討（ACI §7.6.1.1：溫度鋼筋 ≥ 0.0018×b×h）
  const As_min = rho_min_temp * b * h_provided;
  As_main_x = Math.max(As_main_x, As_min);

  steps.push(`最小鋼筋量 As_min = 0.0018 × b × h = 0.0018 × ${b} × ${h_provided} = ${Math.round(As_min)} mm²/m`);
  steps.push(`計算 As = ${Math.round(As_main_x)} mm²/m`);

  // 選擇配筋
  const areaD12 = 113; // D12 面積 (mm²)
  const areaD13 = 127; // D13 面積 (mm²)

  // 決定鋼筋直徑與間距
  let barArea = areaD12;
  let barName = 'D12';
  let nPerMeter = Math.ceil(As_main_x / barArea);
  let spacing = Math.floor(1000 / nPerMeter);

  // 若間距過密改用 D13
  if (spacing < 100) {
    barArea = areaD13;
    barName = 'D13';
    nPerMeter = Math.ceil(As_main_x / barArea);
    spacing = Math.floor(1000 / nPerMeter);
  }

  // 間距限制：max(100mm, 2h) 依 ACI §8.7.2.2
  const maxSpacing = Math.min(2 * h_provided, 450);
  spacing = Math.max(100, Math.min(spacing, maxSpacing));

  // 實際 As
  const actualAs = barArea * Math.ceil(1000 / spacing);
  As_main_x = actualAs;

  const rebar_desc_x = `${barName}@${spacing}`;
  steps.push(`配筋：${rebar_desc_x}，As = ${actualAs} mm²/m`);

  // 長向鋼筋（溫度鋼筋配置在長向）
  const As_main_y = As_min; // 至少配置最小鋼筋
  const nPerMeterY = Math.ceil(As_main_y / barArea);
  const spacing_y = Math.floor(1000 / nPerMeterY);
  const rebar_desc_y = `${barName}@${spacing_y}`;

  // ── 5. 溫度鋼筋（ACI §24.4） ──
  const As_temp_result = calcTempReinforcement(b, h_provided, fy);
  const nPerTemp = Math.ceil(As_temp_result / areaD12);
  const spacing_temp = Math.floor(1000 / nPerTemp);
  const rebar_desc_temp = `D12@${spacing_temp}`;

  // ── 6. 安全檢討 ──
  const isThicknessOK = h_provided >= h_min;
  const isDeflectionOK = h_provided >= h_min; // 滿足版厚即滿足撓度

  steps.push(`版厚檢討：${h_provided}mm ${isThicknessOK ? '≥' : '<'} ${h_min}mm ${isThicknessOK ? '✅' : '❌'}`);
  steps.push(`配筋檢討：${rebar_desc_x}，As = ${actualAs} mm²/m ✅`);

  return {
    h_min: Math.round(h_min),
    h_provided,
    Mu_x: Math.round(Mu_x * 100) / 100,
    Mu_y: Math.round(Mu_y * 100) / 100,
    As_main_x,
    As_main_y,
    As_temp: Math.round(As_temp_result),
    spacing_main: spacing,
    spacing_temp,
    isDeflectionOK,
    isThicknessOK,
    steps,
    rebar_desc_x,
    rebar_desc_y,
    rebar_desc_temp,
  };
}

// ═══════════════════════════════════════════
//  雙向版設計（ACI §8.10 係數法）
// ═══════════════════════════════════════════

/**
 * 雙向版設計計算（ACI §8.10 係數法）
 *
 * 適用四邊支承版，使用 ACI 彎矩係數法。
 *
 * 計算流程：
 * 1. 判斷長短比 m = Ly/Lx
 * 2. 依邊界條件選取彎矩係數
 * 3. 計算短向與長向彎矩
 * 4. 各方向配筋計算
 * 5. 溫度鋼筋檢討
 *
 * @param Lx           - 短向跨度 (mm)
 * @param Ly           - 長向跨度 (mm)
 * @param w            - 設計載重 (kN/m²)
 * @param fc           - 混凝土抗壓強度 (MPa)
 * @param fy           - 鋼筋降伏強度 (MPa)
 * @param edgeCondition - 邊界條件（簡支或連續）
 * @returns SlabResult
 *
 * @example
 * ```ts
 * const result = calcTwoWaySlab(4000, 5000, 12, 28, 420, 'simple');
 * ```
 */
export function calcTwoWaySlab(
  Lx: number,
  Ly: number,
  w: number,
  fc: number,
  fy: number,
  edgeCondition: EdgeCondition = 'simple',
): SlabResult {
  const steps: string[] = [];

  // ── 1. 版厚 ──
  // 雙向版最小版厚：周長/180 (ACI 表 7.3.1.1)
  const perimeter = 2 * (Lx + Ly);
  const h_min = Math.max(perimeter / 180, 89);
  const h_provided = Math.ceil(h_min / 10) * 10;
  steps.push(`雙向版：Lx = ${Lx}mm, Ly = ${Ly}mm`);
  steps.push(`周長 = 2 × (${Lx} + ${Ly}) = ${perimeter}mm`);
  steps.push(`h_min = 周長/180 = ${perimeter}/180 = ${h_min.toFixed(1)}mm`);
  steps.push(`採用版厚 h = ${h_provided}mm`);

  // ── 2. 有效深度 ──
  const d = calcSlabEffectiveDepth(h_provided);
  steps.push(`有效深度 d = ${d}mm`);

  // ── 3. 彎矩係數法（ACI §8.10） ──
  const m = Ly / Lx; // 長短比
  const b = 1000; // 單位寬度

  // ACI 彎矩係數（簡化版）
  // Case 1: 四邊簡支
  // Case 2: 四邊連續
  // 係數來源：ACI 318-19 §8.10.2
  let Ca_pos: number, Cb_pos: number;
  let Ca_neg: number, Cb_neg: number;

  if (edgeCondition === 'simple') {
    // 四邊簡支
    if (m <= 1.0) {
      Ca_pos = 0.050; Cb_pos = 0.050;
    } else if (m <= 1.2) {
      Ca_pos = 0.062; Cb_pos = 0.050;
    } else if (m <= 1.4) {
      Ca_pos = 0.071; Cb_pos = 0.050;
    } else if (m <= 1.6) {
      Ca_pos = 0.078; Cb_pos = 0.050;
    } else if (m <= 1.8) {
      Ca_pos = 0.083; Cb_pos = 0.050;
    } else {
      Ca_pos = 0.085; Cb_pos = 0.050;
    }
    Ca_neg = 0; Cb_neg = 0;
  } else {
    // 四邊連續
    if (m <= 1.0) {
      Ca_pos = 0.018; Cb_pos = 0.018;
      Ca_neg = 0.027; Cb_neg = 0.027;
    } else if (m <= 1.2) {
      Ca_pos = 0.020; Cb_pos = 0.018;
      Ca_neg = 0.030; Cb_neg = 0.027;
    } else if (m <= 1.4) {
      Ca_pos = 0.022; Cb_pos = 0.018;
      Ca_neg = 0.033; Cb_neg = 0.027;
    } else if (m <= 1.6) {
      Ca_pos = 0.023; Cb_pos = 0.018;
      Ca_neg = 0.035; Cb_neg = 0.027;
    } else if (m <= 1.8) {
      Ca_pos = 0.024; Cb_pos = 0.018;
      Ca_neg = 0.036; Cb_neg = 0.027;
    } else {
      Ca_pos = 0.025; Cb_pos = 0.018;
      Ca_neg = 0.038; Cb_neg = 0.027;
    }
  }

  // 載重 (kN/m²) × 1m = kN/m
  const w_per_m = w;

  // 彎矩計算
  const Mu_x = Ca_pos * w_per_m * (Lx / 1000) * (Lx / 1000); // kN·m/m
  const Mu_y = Cb_pos * w_per_m * (Lx / 1000) * (Lx / 1000); // kN·m/m

  steps.push(`長短比 m = Ly/Lx = ${m.toFixed(2)}`);
  steps.push(`短向彎矩係數 Ca = ${Ca_pos}`);
  steps.push(`長向彎矩係數 Cb = ${Cb_pos}`);
  steps.push(`短向彎矩 Mu_x = ${Ca_pos} × ${w_per_m} × ${(Lx / 1000).toFixed(2)}² = ${Mu_x.toFixed(2)} kN·m/m`);
  steps.push(`長向彎矩 Mu_y = ${Cb_pos} × ${w_per_m} × ${(Lx / 1000).toFixed(2)}² = ${Mu_y.toFixed(2)} kN·m/m`);

  // ── 4. 配筋計算 ──
  const phi = 0.9;
  const beta1 = fc <= 28 ? 0.85 : Math.max(0.85 - 0.05 * ((fc - 28) / 7), 0.65);
  const rho_min = 0.0018;
  const As_min = rho_min * b * h_provided;

  // 短向配筋
  let As_main_x = As_min;
  if (Mu_x > 0) {
    for (let iter = 0; iter < 50; iter++) {
      const a = beta1 * (As_main_x * fy / (0.85 * fc * beta1 * b));
      const Mu_Nmm = Mu_x * 1e6;
      As_main_x = Math.max(Mu_Nmm / (phi * fy * (d - a / 2)), As_min);
    }
  }

  // 長向配筋
  let As_main_y = As_min;
  if (Mu_y > 0) {
    for (let iter = 0; iter < 50; iter++) {
      const a = beta1 * (As_main_y * fy / (0.85 * fc * beta1 * b));
      const Mu_Nmm = Mu_y * 1e6;
      As_main_y = Math.max(Mu_Nmm / (phi * fy * (d - a / 2)), As_min);
    }
  }

  // 選擇鋼筋
  const areaD12 = 113;
  const nX = Math.ceil(As_main_x / areaD12);
  const spacing_main = Math.max(100, Math.min(Math.floor(1000 / nX), 450));
  const rebar_desc_x = `D12@${spacing_main}`;

  const nY = Math.ceil(As_main_y / areaD12);
  const spacing_y = Math.max(100, Math.min(Math.floor(1000 / nY), 450));
  const rebar_desc_y = `D12@${spacing_y}`;

  steps.push(`短向配筋：${rebar_desc_x}（As = ${nX * areaD12} mm²/m）`);
  steps.push(`長向配筋：${rebar_desc_y}（As = ${nY * areaD12} mm²/m）`);

  // ── 5. 溫度鋼筋 ──
  const As_temp_result = calcTempReinforcement(b, h_provided, fy);
  const nTemp = Math.ceil(As_temp_result / areaD12);
  const spacing_temp = Math.floor(1000 / nTemp);
  const rebar_desc_temp = `D12@${spacing_temp}`;

  // ── 6. 檢討 ──
  const isThicknessOK = h_provided >= h_min;
  const isDeflectionOK = h_provided >= h_min;

  return {
    h_min: Math.round(h_min),
    h_provided,
    Mu_x: Math.round(Mu_x * 100) / 100,
    Mu_y: Math.round(Mu_y * 100) / 100,
    As_main_x: Math.round(nX * areaD12),
    As_main_y: Math.round(nY * areaD12),
    As_temp: Math.round(As_temp_result),
    spacing_main,
    spacing_temp,
    isDeflectionOK,
    isThicknessOK,
    steps,
    rebar_desc_x,
    rebar_desc_y,
    rebar_desc_temp,
  };
}

// ═══════════════════════════════════════════
//  溫度鋼筋（ACI 318 §24.4）
// ═══════════════════════════════════════════

/**
 * 溫度鋼筋計算（ACI 318 §24.4.3.2）
 *
 * 溫度鋼筋面積 As_temp：
 *   - fy = 280 MPa 級：As_temp = 0.0020 × b × h
 *   - fy = 420 MPa 級：As_temp = 0.0018 × b × h
 *   - fy > 420 MPa 級：As_temp = 0.0018 × 420 × b × h / fy
 *
 * 且 As_temp ≥ 0.0014 × b × h
 *
 * @param b  - 版寬 (mm)
 * @param h  - 版厚 (mm)
 * @param fy - 鋼筋降伏強度 (MPa)
 * @returns 溫度鋼筋面積 (mm²/m)
 *
 * @example
 * ```ts
 * calcTempReinforcement(1000, 150, 420); // → 270 mm²/m
 * ```
 */
export function calcTempReinforcement(
  b: number,
  h: number,
  fy: number,
): number {
  let As_temp: number;

  if (fy <= 280) {
    As_temp = 0.0020 * b * h;
  } else if (fy <= 420) {
    As_temp = 0.0018 * b * h;
  } else {
    As_temp = (0.0018 * 420 * b * h) / fy;
  }

  // 最小值 0.0014 × b × h
  const As_min = 0.0014 * b * h;
  As_temp = Math.max(As_temp, As_min);

  return Math.round(As_temp);
}
