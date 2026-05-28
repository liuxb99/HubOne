/**
 * 荷載組合與載重計算 — 依據台灣建築物結構設計規範
 *
 * 支援的載重類型：
 *   DL = Dead Load (靜載重)
 *   LL = Live Load (活載重)
 *   WL = Wind Load (風載重)
 *   EL = Earthquake Load (地震載重)
 *   SL = Snow Load (雪載重)
 *   TL = Temperature Load (溫度載重)
 *   CL = Construction Load (施工載重)
 *
 * 參考規範：
 * - 建築物結構設計規範（台灣內政部營建署）
 * - ACI 318-19（混凝土結構設計）
 * - ASCE 7-16 / 風載重與地震載重
 */

export type LoadType = 'DL' | 'LL' | 'WL' | 'EL' | 'SL' | 'TL' | 'CL';

/**
 * 載重案例
 */
export interface LoadCase {
  /** 載重類型 */
  type: LoadType;
  /** 數值 (kN 或 kN/m²，依分析類型而定) */
  value: number;
  /** 描述 */
  description: string;
}

/**
 * 載重組合定義
 */
export interface LoadCombination {
  /** 組合名稱 */
  name: string;
  /** 公式顯示 */
  formula: string;
  /** 說明 */
  description: string;
  /** 各載重類型的係數 */
  factors: Partial<Record<LoadType, number>>;
  /** 設計方法：LRFD（強度設計法）或 ASD（容許應力設計法） */
  method: 'LRFD' | 'ASD';
}

// ═══════════════════════════════════════════
//  載重組合表
// ═══════════════════════════════════════════

/**
 * 依據台灣建築物結構設計規範之載重組合
 *
 * LRFD（強度設計法）參考規範 §2.3
 * ASD（容許應力設計法）參考規範 §2.4
 */
export const LOAD_COMBINATIONS: LoadCombination[] = [
  // ── LRFD 強度設計法 ──
  {
    name: 'LC1',
    formula: '1.4 DL',
    description: '僅靜載重（LRFD）',
    factors: { DL: 1.4 },
    method: 'LRFD',
  },
  {
    name: 'LC2',
    formula: '1.2 DL + 1.6 LL',
    description: '靜載重 + 活載重（LRFD，一般情況）',
    factors: { DL: 1.2, LL: 1.6 },
    method: 'LRFD',
  },
  {
    name: 'LC3',
    formula: '1.2 DL + 1.6 LL + 0.5 SL',
    description: '靜載重 + 活載重 + 雪載重（LRFD）',
    factors: { DL: 1.2, LL: 1.6, SL: 0.5 },
    method: 'LRFD',
  },
  {
    name: 'LC4',
    formula: '1.2 DL + 0.5 LL + 1.3 WL',
    description: '靜載重 + 活載重 + 風載重（LRFD）',
    factors: { DL: 1.2, LL: 0.5, WL: 1.3 },
    method: 'LRFD',
  },
  {
    name: 'LC5',
    formula: '0.9 DL ± 1.3 WL',
    description: '靜載重 + 風載重反向（LRFD）',
    factors: { DL: 0.9, WL: 1.3 },
    method: 'LRFD',
  },
  {
    name: 'LC6',
    formula: '1.2 DL + 0.5 LL ± 1.0 EL',
    description: '靜載重 + 活載重 + 地震載重（LRFD）',
    factors: { DL: 1.2, LL: 0.5, EL: 1.0 },
    method: 'LRFD',
  },
  {
    name: 'LC7',
    formula: '0.9 DL ± 1.0 EL',
    description: '靜載重 + 地震載重反向（LRFD）',
    factors: { DL: 0.9, EL: 1.0 },
    method: 'LRFD',
  },
  {
    name: 'LC8',
    formula: '1.2 DL + 0.5 LL + 0.5 SL + 1.3 WL',
    description: '靜載重 + 活載重 + 雪載重 + 風載重（LRFD）',
    factors: { DL: 1.2, LL: 0.5, SL: 0.5, WL: 1.3 },
    method: 'LRFD',
  },
  {
    name: 'LC9',
    formula: '1.2 DL + 0.5 LL + 0.2 SL ± 1.0 EL',
    description: '靜載重 + 活載重 + 雪載重 + 地震載重（LRFD）',
    factors: { DL: 1.2, LL: 0.5, SL: 0.2, EL: 1.0 },
    method: 'LRFD',
  },
  {
    name: 'LC10',
    formula: '1.2 DL + 0.5 LL + 0.2 SL + 1.3 WL + 0.5 CL',
    description: '靜載重 + 活載重 + 雪載重 + 風載重 + 施工載重（LRFD）',
    factors: { DL: 1.2, LL: 0.5, SL: 0.2, WL: 1.3, CL: 0.5 },
    method: 'LRFD',
  },
  // ── ASD 容許應力設計法 ──
  {
    name: 'ASD1',
    formula: 'D + L',
    description: '靜載重 + 活載重（ASD，基本組合）',
    factors: { DL: 1.0, LL: 1.0 },
    method: 'ASD',
  },
  {
    name: 'ASD2',
    formula: 'D + 0.75L + 0.75W',
    description: '靜載重 + 活載重 + 風載重（ASD）',
    factors: { DL: 1.0, LL: 0.75, WL: 0.75 },
    method: 'ASD',
  },
  {
    name: 'ASD3',
    formula: 'D + 0.75L + 0.75E',
    description: '靜載重 + 活載重 + 地震載重（ASD）',
    factors: { DL: 1.0, LL: 0.75, EL: 0.75 },
    method: 'ASD',
  },
  {
    name: 'ASD4',
    formula: '0.6D + W',
    description: '靜載重 + 風載重反向（ASD）',
    factors: { DL: 0.6, WL: 1.0 },
    method: 'ASD',
  },
  {
    name: 'ASD5',
    formula: '0.6D + E',
    description: '靜載重 + 地震載重反向（ASD）',
    factors: { DL: 0.6, EL: 1.0 },
    method: 'ASD',
  },
  {
    name: 'ASD6',
    formula: 'D + L + 0.3S',
    description: '靜載重 + 活載重 + 雪載重（ASD）',
    factors: { DL: 1.0, LL: 1.0, SL: 0.3 },
    method: 'ASD',
  },
  {
    name: 'ASD7',
    formula: 'D + 0.75L + 0.75W + 0.75S',
    description: '靜載重 + 活載重 + 風載重 + 雪載重（ASD）',
    factors: { DL: 1.0, LL: 0.75, WL: 0.75, SL: 0.75 },
    method: 'ASD',
  },
];

// ═══════════════════════════════════════════
//  載重類型輔助資料
// ═══════════════════════════════════════════

/**
 * 載重類型對應中文說明
 */
export const LOAD_TYPE_LABELS: Record<LoadType, string> = {
  DL: '靜載重 (DL)',
  LL: '活載重 (LL)',
  WL: '風載重 (WL)',
  EL: '地震載重 (EL)',
  SL: '雪載重 (SL)',
  TL: '溫度載重 (TL)',
  CL: '施工載重 (CL)',
};

/**
 * 載重類型顏色（安全狀態用）
 */
export const LOAD_TYPE_COLORS: Record<LoadType, string> = {
  DL: '#37474F',
  LL: '#FF6D00',
  WL: '#2196F3',
  EL: '#F44336',
  SL: '#9C27B0',
  TL: '#FF9800',
  CL: '#607D8B',
};

// ═══════════════════════════════════════════
//  載重組合計算
// ═══════════════════════════════════════════

/**
 * 單一載重組合的逐步計算過程
 */
export interface CalcStep {
  /** 載重類型 */
  loadType: LoadType;
  /** 係數 */
  factor: number;
  /** 原始值 */
  value: number;
  /** 貢獻值（係數 × 數值） */
  contribution: number;
  /** 說明文字 */
  detail: string;
}

/**
 * 載重組合計算結果（含逐步過程）
 */
export interface CombinationResult {
  /** 組合名稱 */
  name: string;
  /** 公式 */
  formula: string;
  /** 設計方法 */
  method: 'LRFD' | 'ASD';
  /** 總和值 */
  total: number;
  /** 逐步計算 */
  steps: CalcStep[];
}

/**
 * 計算單一載重組合（回傳逐步過程）
 *
 * @param loads - 載重案例陣列
 * @param combo - 載重組合定義
 * @returns CombinationResult 含逐步計算過程
 *
 * @example
 * ```ts
 * const loads = [
 *   { type: 'DL', value: 100, description: '自重' },
 *   { type: 'LL', value: 50, description: '活載重' },
 * ];
 * const result = calcCombinationDetail(loads, LOAD_COMBINATIONS[1]);
 * // result.steps = [
 * //   { loadType: 'DL', factor: 1.2, value: 100, contribution: 120, ... },
 * //   { loadType: 'LL', factor: 1.6, value: 50, contribution: 80, ... },
 * // ]
 * // result.total = 200
 * ```
 */
export function calcCombinationDetail(
  loads: LoadCase[],
  combo: LoadCombination,
): CombinationResult {
  const steps: CalcStep[] = [];
  let total = 0;

  for (const load of loads) {
    const factor = combo.factors[load.type] ?? 0;
    if (factor === 0) continue; // 此組合未用到此載重
    const contribution = factor * load.value;
    total += contribution;
    steps.push({
      loadType: load.type,
      factor,
      value: load.value,
      contribution: Math.round(contribution * 100) / 100,
      detail: `${factor} × ${load.value} (${load.description}) = ${Math.round(contribution * 100) / 100}`,
    });
  }

  return {
    name: combo.name,
    formula: combo.formula,
    method: combo.method,
    total: Math.round(total * 100) / 100,
    steps,
  };
}

/**
 * 計算所有載重組合（回傳逐步過程）
 *
 * @param loads - 載重案例陣列
 * @returns CombinationResult 陣列
 */
export function calcAllCombinationsDetail(
  loads: LoadCase[],
): CombinationResult[] {
  return LOAD_COMBINATIONS.map((combo) =>
    calcCombinationDetail(loads, combo),
  );
}

/**
 * 計算單一載重組合（僅回傳總值，簡化版）
 *
 * @param loads - 載重案例陣列
 * @param combo - 載重組合定義
 * @returns 組合後的總載重值
 */
export function calcCombination(
  loads: LoadCase[],
  combo: LoadCombination,
): number {
  return calcCombinationDetail(loads, combo).total;
}

/**
 * 計算所有載重組合（簡化版，僅回傳名稱與數值）
 *
 * @param loads - 載重案例陣列
 * @returns 每個組合的名稱、數值與公式
 */
export function calcAllCombinations(
  loads: LoadCase[],
): { name: string; value: number; formula: string; method: 'LRFD' | 'ASD' }[] {
  return calcAllCombinationsDetail(loads).map((r) => ({
    name: r.name,
    value: r.total,
    formula: r.formula,
    method: r.method,
  }));
}

/**
 * 依載重類型篩選載重案例
 */
export function filterLoadsByType(
  loads: LoadCase[],
  type: LoadType,
): LoadCase[] {
  return loads.filter((l) => l.type === type);
}

/**
 * 依設計方法篩選載重組合
 *
 * @param method - 'LRFD' 或 'ASD'
 * @returns 符合條件的載重組合
 */
export function filterCombinationsByMethod(
  method: 'LRFD' | 'ASD',
): LoadCombination[] {
  return LOAD_COMBINATIONS.filter((c) => c.method === method);
}

// ═══════════════════════════════════════════
//  地震載重計算（台灣規範）
// ═══════════════════════════════════════════

/**
 * 地震參數
 *
 * 參考台灣建築物結構設計規範 §3（地震力）
 */
export interface SeismicParams {
  /** 工址短週期設計地震加速度係數 Sds (g) */
  Sds: number;
  /** 工址1秒週期設計地震加速度係數 Sd1 (g) */
  Sd1: number;
  /** 用途係數 I（ Importance Factor ） */
  I: number;
  /** 結構韌性容量 R（ Response Modification Factor ） */
  R: number;
  /** 地震力重量 W (kN)，含靜載重 + 0.25 活載重 */
  W: number;
  /** 結構基本振動週期 T (sec)，可選，用於長週期折減 */
  T?: number;
  /** 特徵週期 T0 = Sd1 / Sds (sec) */
  T0?: number;
  /** 特徵週期 Ts = Sd1 / Sds (sec) */
  Ts?: number;
}

/**
 * 地震載重計算結果
 */
export interface SeismicResult {
  /** 設計地震總橫力 V (kN) */
  V: number;
  /** 基底剪力係數 Cs */
  Cs: number;
  /** 最小剪力係數 Cs_min */
  Cs_min: number;
  /** 最大剪力係數 Cs_max */
  Cs_max: number;
  /** 各項參數說明 */
  detail: {
    Sds: number;
    Sd1: number;
    I: number;
    R: number;
    W: number;
    T: number;
    T0: number;
    Ts: number;
    Cs_formula: string;
  };
  /** 逐步計算過程 */
  steps: string[];
}

/**
 * 計算台灣規範地震力
 *
 * 依建築物結構設計規範 §3.3，設計地震總橫力：
 *
 *   V = Cs × W
 *
 *   剪力係數 Cs 取決於週期 T：
 *   若 T ≤ T0： Cs = Sds × I / (1.4 × R)
 *   若 T0 < T ≤ Ts： Cs = Sd1 × I / (1.4 × R × T)
 *   若 T > Ts： Cs = Sd1 × I × Ts / (1.4 × R × T²)
 *
 *   不得小於 Cs_min = 0.01
 *   且短週期不得大於 Cs_max = Sds × I / (1.4 × R)
 *
 * 其中 T0 = 0.2 × Sd1 / Sds, Ts = Sd1 / Sds
 *
 * @param W   - 地震力重量 (kN)，含靜載重 + 0.25 活載重
 * @param Sds - 短週期設計地震加速度係數 (g)
 * @param Sd1 - 1秒週期設計地震加速度係數 (g)
 * @param I   - 用途係數（一般 1.0，重要建築 1.25~1.5）
 * @param R   - 結構韌性容量（韌性抗彎矩構架 3.2~5.0）
 * @param T   - 結構基本振動週期 (sec)，省略時使用近似值
 * @returns SeismicResult
 *
 * @example
 * ```ts
 * const result = calcSeismicLoad(10000, 0.8, 0.4, 1.0, 3.2, 0.5);
 * // result.V ≈ 1786 kN
 * ```
 */
export function calcSeismicLoad(
  W: number,
  Sds: number,
  Sd1: number,
  I: number,
  R: number,
  T?: number,
): SeismicResult {
  const steps: string[] = [];
  steps.push(`W = ${W} kN（地震力重量）`);
  steps.push(`Sds = ${Sds}g（短週期設計加速度）`);
  steps.push(`Sd1 = ${Sd1}g（1秒週期設計加速度）`);
  steps.push(`I = ${I}（用途係數）`);
  steps.push(`R = ${R}（韌性容量）`);

  // 特徵週期
  const T0 = Sds > 0 ? 0.2 * (Sd1 / Sds) : 0;
  const Ts = Sds > 0 ? Sd1 / Sds : 0;
  steps.push(`T0 = 0.2 × Sd1 / Sds = ${round(T0, 4)} sec（特徵週期下限）`);
  steps.push(`Ts = Sd1 / Sds = ${round(Ts, 4)} sec（特徵週期上限）`);

  // 若無指定 T，使用近似值 T = 0.07 × H^0.75（鋼構）
  // 此處若無 T 則假設 T = 0.5 sec
  const period = T ?? 0.5;
  steps.push(`T = ${period} sec（結構基本振動週期）`);

  // 計算 Cs
  let Cs: number;
  let csFormula: string;

  if (period <= T0) {
    Cs = (Sds * I) / (1.4 * R);
    csFormula = `Cs = Sds × I / (1.4 × R) = ${Sds} × ${I} / (1.4 × ${R}) = ${round(Cs, 4)}`;
  } else if (period <= Ts) {
    Cs = (Sd1 * I) / (1.4 * R * period);
    csFormula = `Cs = Sd1 × I / (1.4 × R × T) = ${Sd1} × ${I} / (1.4 × ${R} × ${period}) = ${round(Cs, 4)}`;
  } else {
    Cs = (Sd1 * I * Ts) / (1.4 * R * period * period);
    csFormula = `Cs = Sd1 × I × Ts / (1.4 × R × T²) = ${Sd1} × ${I} × ${round(Ts, 4)} / (1.4 × ${R} × ${period}²) = ${round(Cs, 4)}`;
  }
  steps.push(csFormula);

  // 最小值 Cs_min = 0.01
  const Cs_min = 0.01;
  steps.push(`Cs_min = ${Cs_min}（最小剪力係數）`);

  // 最大值 Cs_max = Sds × I / (1.4 × R)
  const Cs_max = (Sds * I) / (1.4 * R);
  steps.push(`Cs_max = Sds × I / (1.4 × R) = ${round(Cs_max, 4)}（最大剪力係數）`);

  // 取合理範圍
  const Cs_final = Math.max(Cs_min, Math.min(Cs, Cs_max));
  if (Cs_final !== Cs) {
    if (Cs < Cs_min) {
      steps.push(`Cs = ${round(Cs, 4)} < Cs_min = ${Cs_min}，取 Cs = ${Cs_min}`);
    }
    if (Cs > Cs_max) {
      steps.push(`Cs = ${round(Cs, 4)} > Cs_max = ${round(Cs_max, 4)}，取 Cs = ${round(Cs_max, 4)}`);
    }
  }
  steps.push(`Cs = ${round(Cs_final, 4)}（設計剪力係數）`);

  // 總地震力
  const V = Cs_final * W;
  steps.push(`V = Cs × W = ${round(Cs_final, 4)} × ${W} = ${round(V, 2)} kN`);

  return {
    V: round(V, 2),
    Cs: round(Cs_final, 4),
    Cs_min,
    Cs_max: round(Cs_max, 4),
    detail: {
      Sds,
      Sd1,
      I,
      R,
      W,
      T: period,
      T0: round(T0, 4),
      Ts: round(Ts, 4),
      Cs_formula: csFormula,
    },
    steps,
  };
}

// ═══════════════════════════════════════════
//  風載重計算
// ═══════════════════════════════════════════

/**
 * 風載重計算結果
 */
export interface WindLoadResult {
  /** 風壓力 (kN/m²) */
  pressure: number;
  /** 總風力 (kN) */
  totalForce: number;
  /** 受風面積 (m²) */
  area: number;
  /** 逐步計算過程 */
  steps: string[];
}

/**
 * 計算風載重
 *
 * 參考 ASCE 7-16 / 台灣建築物結構設計規範 §4：
 *
 *   設計風壓 p = q × G × Cp
 *   總風力 F = p × A
 *
 * 其中：
 *   q  = 基本風速壓 (kN/m²)，依地區與高度
 *   G  = 陣風效應因子（一般 0.85）
 *   Cp = 風壓係數（取決於形狀，牆面 0.8、屋頂 -0.7 等）
 *   A  = 受風面積 (m²)
 *
 * @param q  - 基本風速壓 (kN/m²)
 * @param A  - 受風面積 (m²)
 * @param G  - 陣風效應因子（預設 0.85）
 * @param Cp - 風壓係數（預設 0.8，迎風牆面）
 * @returns WindLoadResult
 *
 * @example
 * ```ts
 * const result = calcWindLoad(1.2, 50, 0.85, 0.8);
 * // result.pressure = 1.2 × 0.85 × 0.8 = 0.816 kN/m²
 * // result.totalForce = 0.816 × 50 = 40.8 kN
 * ```
 */
export function calcWindLoad(
  q: number,
  A: number,
  G: number = 0.85,
  Cp: number = 0.8,
): WindLoadResult {
  const steps: string[] = [];
  steps.push(`q = ${q} kN/m²（基本風速壓）`);
  steps.push(`G = ${G}（陣風效應因子）`);
  steps.push(`Cp = ${Cp}（風壓係數，迎風面）`);
  steps.push(`A = ${A} m²（受風面積）`);

  // 設計風壓 p = q × G × Cp
  const pressure = q * G * Cp;
  steps.push(`p = q × G × Cp = ${q} × ${G} × ${Cp} = ${round(pressure, 4)} kN/m²`);

  // 總風力 F = p × A
  const totalForce = pressure * A;
  steps.push(`F = p × A = ${round(pressure, 4)} × ${A} = ${round(totalForce, 2)} kN`);

  return {
    pressure: round(pressure, 4),
    totalForce: round(totalForce, 2),
    area: A,
    steps,
  };
}

// ═══════════════════════════════════════════
//  輔助
// ═══════════════════════════════════════════

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
