/**
 * 截面資料庫 — 台灣常用結構型鋼
 *
 * 支援種類：
 *   HBEAM  — H 型鋼（CNS 303 G3012）
 *   CHANNEL — C 型鋼 / 槽鋼（CNS 303 G3012）
 *   ANGLE   — 等邊角鋼（CNS 303 G3012）
 *   RC_RECT — 鋼筋混凝土矩形斷面
 *
 * 所有數值單位：
 *   height/width/webThick/flangeThick → mm
 *   area → cm²
 *   Ix → cm⁴ (X 軸慣性矩)
 *   Zx → cm³ (X 軸斷面模數)
 *   weight → kg/m
 */

// ═══════════════════════════════════════════
//  型別定義
// ═══════════════════════════════════════════

/** 斷面類型 */
export type SectionType = 'HBEAM' | 'CHANNEL' | 'ANGLE' | 'RC_RECT';

/** 斷面類型中文對照 */
export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  HBEAM: 'H 型鋼',
  CHANNEL: 'C 型鋼 / 槽鋼',
  ANGLE: '等邊角鋼',
  RC_RECT: 'RC 矩形斷面',
};

// ── H 型鋼 ──

export interface HBeam {
  /** 型號，如 'H100×100×6×8' */
  name: string;
  /** 梁高 (mm) */
  height: number;
  /** 翼板寬度 (mm) */
  width: number;
  /** 腹板厚度 (mm) */
  webThick: number;
  /** 翼板厚度 (mm) */
  flangeThick: number;
  /** 斷面積 (cm²) */
  area: number;
  /** X 軸慣性矩 (cm⁴) */
  Ix: number;
  /** X 軸斷面模數 (cm³) */
  Zx: number;
  /** 單位重量 (kg/m) */
  weight: number;
  /** 迴轉半徑 rx (cm) */
  rx?: number;
  /** 迴轉半徑 ry (cm) */
  ry?: number;
}

// ── C 型鋼 / 槽鋼 ──

export interface Channel {
  /** 型號，如 'C100×50×5×7.5' */
  name: string;
  /** 槽鋼高度 (mm) */
  height: number;
  /** 翼板寬度 (mm) */
  width: number;
  /** 腹板厚度 (mm) */
  webThick: number;
  /** 翼板厚度 (mm) */
  flangeThick: number;
  /** 斷面積 (cm²) */
  area: number;
  /** X 軸慣性矩 (cm⁴) */
  Ix: number;
  /** X 軸斷面模數 (cm³) */
  Zx: number;
  /** 單位重量 (kg/m) */
  weight: number;
  /** 迴轉半徑 rx (cm) */
  rx?: number;
  /** 迴轉半徑 ry (cm) */
  ry?: number;
}

// ── 等邊角鋼 ──

export interface Angle {
  /** 型號，如 'L65×65×6' */
  name: string;
  /** 邊長 (mm) */
  leg: number;
  /** 厚度 (mm) */
  thickness: number;
  /** 斷面積 (cm²) */
  area: number;
  /** 慣性矩 (cm⁴)，對主軸 */
  Ix: number;
  /** 斷面模數 (cm³) */
  Zx: number;
  /** 單位重量 (kg/m) */
  weight: number;
  /** 迴轉半徑 rz (cm) */
  rz?: number;
}

// ── RC 矩形斷面 ──

export interface RC_RECT {
  /** 斷面寬度 b (mm) */
  b: number;
  /** 斷面總深度 h (mm) */
  h: number;
  /** 保護層厚度 (mm)，從混凝土表面到箍筋中心 */
  cover: number;
  /** 混凝土抗壓強度 fc' (MPa) */
  fc: number;
  /** 鋼筋降伏強度 fy (MPa) */
  fy: number;
}

// ═══════════════════════════════════════════
//  H 型鋼資料（CNS 303 G3012）
// ═══════════════════════════════════════════

export const H_BEAMS: HBeam[] = [
  // ── H100 系列 ──
  {
    name: 'H100×100×6×8',
    height: 100,
    width: 100,
    webThick: 6,
    flangeThick: 8,
    area: 21.9,
    Ix: 383,
    Zx: 76.6,
    weight: 17.2,
    rx: 4.18,
    ry: 2.47,
  },
  {
    name: 'H125×125×6.5×9',
    height: 125,
    width: 125,
    webThick: 6.5,
    flangeThick: 9,
    area: 30.0,
    Ix: 793,
    Zx: 127,
    weight: 23.6,
    rx: 5.14,
    ry: 3.02,
  },
  // ── H150 系列 ──
  {
    name: 'H150×150×7×10',
    height: 150,
    width: 150,
    webThick: 7,
    flangeThick: 10,
    area: 40.1,
    Ix: 1640,
    Zx: 219,
    weight: 31.5,
    rx: 6.40,
    ry: 3.73,
  },
  // ── H175 系列 ──
  {
    name: 'H175×175×7.5×11',
    height: 175,
    width: 175,
    webThick: 7.5,
    flangeThick: 11,
    area: 51.2,
    Ix: 2880,
    Zx: 329,
    weight: 40.2,
    rx: 7.50,
    ry: 4.37,
  },
  // ── H200 系列 ──
  {
    name: 'H200×200×8×12',
    height: 200,
    width: 200,
    webThick: 8,
    flangeThick: 12,
    area: 63.5,
    Ix: 4720,
    Zx: 472,
    weight: 49.9,
    rx: 8.62,
    ry: 5.02,
  },
  // ── H250 系列 ──
  {
    name: 'H250×250×9×14',
    height: 250,
    width: 250,
    webThick: 9,
    flangeThick: 14,
    area: 91.4,
    Ix: 10800,
    Zx: 867,
    weight: 71.8,
    rx: 10.9,
    ry: 6.29,
  },
  // ── H300 系列 ──
  {
    name: 'H300×300×10×15',
    height: 300,
    width: 300,
    webThick: 10,
    flangeThick: 15,
    area: 119.8,
    Ix: 20400,
    Zx: 1360,
    weight: 94.0,
    rx: 13.1,
    ry: 7.51,
  },
  // ── H350 系列 ──
  {
    name: 'H350×350×12×19',
    height: 350,
    width: 350,
    webThick: 12,
    flangeThick: 19,
    area: 173.9,
    Ix: 40300,
    Zx: 2300,
    weight: 136,
    rx: 15.2,
    ry: 8.84,
  },
  // ── H400 系列 ──
  {
    name: 'H400×400×13×21',
    height: 400,
    width: 400,
    webThick: 13,
    flangeThick: 21,
    area: 218.7,
    Ix: 66600,
    Zx: 3330,
    weight: 172,
    rx: 17.5,
    ry: 10.1,
  },
  // ── H500×200 系列（窄翼板）─
  {
    name: 'H500×200×10×16',
    height: 500,
    width: 200,
    webThick: 10,
    flangeThick: 16,
    area: 114.2,
    Ix: 47800,
    Zx: 1910,
    weight: 89.6,
    rx: 20.5,
    ry: 4.33,
  },
  // ── H500×300 系列 ─
  {
    name: 'H500×300×11×15',
    height: 500,
    width: 300,
    webThick: 11,
    flangeThick: 15,
    area: 146.0,
    Ix: 71000,
    Zx: 2840,
    weight: 115,
    rx: 22.1,
    ry: 6.86,
  },
  // ── H600×200 系列（窄翼板）─
  {
    name: 'H600×200×11×17',
    height: 600,
    width: 200,
    webThick: 11,
    flangeThick: 17,
    area: 134.4,
    Ix: 77600,
    Zx: 2590,
    weight: 106,
    rx: 24.0,
    ry: 4.54,
  },
  // ── H600×300 系列 ─
  {
    name: 'H600×300×12×20',
    height: 600,
    width: 300,
    webThick: 12,
    flangeThick: 20,
    area: 192.5,
    Ix: 118000,
    Zx: 3940,
    weight: 151,
    rx: 24.8,
    ry: 7.24,
  },
  // ── H700×300 系列 ─
  {
    name: 'H700×300×13×24',
    height: 700,
    width: 300,
    webThick: 13,
    flangeThick: 24,
    area: 235.5,
    Ix: 201000,
    Zx: 5760,
    weight: 185,
    rx: 29.3,
    ry: 7.53,
  },
  // ── H800×300 系列 ─
  {
    name: 'H800×300×14×26',
    height: 800,
    width: 300,
    webThick: 14,
    flangeThick: 26,
    area: 267.4,
    Ix: 292000,
    Zx: 7290,
    weight: 210,
    rx: 33.0,
    ry: 7.72,
  },
  // ── H900×300 系列 ─
  {
    name: 'H900×300×16×28',
    height: 900,
    width: 300,
    webThick: 16,
    flangeThick: 28,
    area: 309.8,
    Ix: 411000,
    Zx: 9140,
    weight: 243,
    rx: 36.5,
    ry: 7.82,
  },
  // ── H1000×300 系列 ─
  {
    name: 'H1000×300×19×36',
    height: 1000,
    width: 300,
    webThick: 19,
    flangeThick: 36,
    area: 400.0,
    Ix: 647000,
    Zx: 12900,
    weight: 314,
    rx: 40.2,
    ry: 7.82,
  },
  // ── H150×75 輕型 ─
  {
    name: 'H150×75×5×7',
    height: 150,
    width: 75,
    webThick: 5,
    flangeThick: 7,
    area: 17.5,
    Ix: 666,
    Zx: 88.8,
    weight: 13.7,
    rx: 6.17,
    ry: 1.66,
  },
  // ── H200×100 輕型 ─
  {
    name: 'H200×100×5.5×8',
    height: 200,
    width: 100,
    webThick: 5.5,
    flangeThick: 8,
    area: 26.7,
    Ix: 1810,
    Zx: 181,
    weight: 20.9,
    rx: 8.24,
    ry: 2.21,
  },
  // ── H300×150 中型 ─
  {
    name: 'H300×150×6.5×9',
    height: 300,
    width: 150,
    webThick: 6.5,
    flangeThick: 9,
    area: 46.8,
    Ix: 7210,
    Zx: 481,
    weight: 36.7,
    rx: 12.4,
    ry: 2.92,
  },
];

// ═══════════════════════════════════════════
//  C 型鋼 / 槽鋼（CNS 303 G3012）
// ═══════════════════════════════════════════

/**
 * 台灣常用 C 型鋼（槽鋼）資料表
 * 參考 CNS 303 G3012 標準
 */
export const CHANNELS: Channel[] = [
  {
    name: 'C100×50×5×7.5',
    height: 100,
    width: 50,
    webThick: 5,
    flangeThick: 7.5,
    area: 11.82,
    Ix: 188,
    Zx: 37.6,
    weight: 9.28,
    rx: 3.99,
    ry: 1.33,
  },
  {
    name: 'C125×65×6×8',
    height: 125,
    width: 65,
    webThick: 6,
    flangeThick: 8,
    area: 16.72,
    Ix: 363,
    Zx: 58.1,
    weight: 13.1,
    rx: 4.66,
    ry: 1.54,
  },
  {
    name: 'C150×75×6.5×10',
    height: 150,
    width: 75,
    webThick: 6.5,
    flangeThick: 10,
    area: 21.78,
    Ix: 683,
    Zx: 91.1,
    weight: 17.1,
    rx: 5.60,
    ry: 1.77,
  },
  {
    name: 'C180×75×7×10.5',
    height: 180,
    width: 75,
    webThick: 7,
    flangeThick: 10.5,
    area: 25.00,
    Ix: 1078,
    Zx: 119.8,
    weight: 19.6,
    rx: 6.57,
    ry: 1.70,
  },
  {
    name: 'C200×80×7.5×11',
    height: 200,
    width: 80,
    webThick: 7.5,
    flangeThick: 11,
    area: 29.44,
    Ix: 1598,
    Zx: 159.8,
    weight: 23.1,
    rx: 7.37,
    ry: 1.77,
  },
  {
    name: 'C250×82×7.5×12',
    height: 250,
    width: 82,
    webThick: 7.5,
    flangeThick: 12,
    area: 34.42,
    Ix: 2884,
    Zx: 230.7,
    weight: 27.0,
    rx: 9.15,
    ry: 1.76,
  },
  {
    name: 'C300×90×9×13',
    height: 300,
    width: 90,
    webThick: 9,
    flangeThick: 13,
    area: 44.10,
    Ix: 5223,
    Zx: 348.2,
    weight: 34.6,
    rx: 10.88,
    ry: 1.97,
  },
  {
    name: 'C380×100×10.5×16',
    height: 380,
    width: 100,
    webThick: 10.5,
    flangeThick: 16,
    area: 61.38,
    Ix: 10642,
    Zx: 560.1,
    weight: 48.2,
    rx: 13.17,
    ry: 2.09,
  },
];

// ═══════════════════════════════════════════
//  等邊角鋼（CNS 303 G3012）
// ═══════════════════════════════════════════

/**
 * 台灣常用等邊角鋼資料表
 * 參考 CNS 303 G3012 標準
 */
export const ANGLES: Angle[] = [
  {
    name: 'L65×65×6',
    leg: 65,
    thickness: 6,
    area: 7.53,
    Ix: 30.0,
    Zx: 6.94,
    weight: 5.91,
    rz: 1.25,
  },
  {
    name: 'L75×75×9',
    leg: 75,
    thickness: 9,
    area: 12.50,
    Ix: 62.6,
    Zx: 12.2,
    weight: 9.81,
    rz: 1.46,
  },
  {
    name: 'L90×90×7',
    leg: 90,
    thickness: 7,
    area: 12.20,
    Ix: 91.5,
    Zx: 15.6,
    weight: 9.58,
    rz: 1.76,
  },
  {
    name: 'L100×100×10',
    leg: 100,
    thickness: 10,
    area: 19.00,
    Ix: 179,
    Zx: 26.3,
    weight: 14.9,
    rz: 1.96,
  },
  {
    name: 'L125×125×9',
    leg: 125,
    thickness: 9,
    area: 21.80,
    Ix: 293,
    Zx: 35.5,
    weight: 17.1,
    rz: 2.47,
  },
  {
    name: 'L130×130×12',
    leg: 130,
    thickness: 12,
    area: 29.80,
    Ix: 500,
    Zx: 56.1,
    weight: 23.4,
    rz: 2.52,
  },
  {
    name: 'L150×150×12',
    leg: 150,
    thickness: 12,
    area: 34.60,
    Ix: 745,
    Zx: 73.0,
    weight: 27.2,
    rz: 2.92,
  },
  {
    name: 'L200×200×15',
    leg: 200,
    thickness: 15,
    area: 57.80,
    Ix: 2090,
    Zx: 153,
    weight: 45.4,
    rz: 3.84,
  },
];

// ═══════════════════════════════════════════
//  RC 斷面計算（ACI 318）
// ═══════════════════════════════════════════

/**
 * RC 矩形斷面幾何計算結果
 */
export interface RCGeoProps {
  /** 總斷面積 Ag = b × h (mm²) */
  Ag: number;
  /** 有效深度 d (mm)，從受壓區邊緣到拉力鋼筋重心 */
  d: number;
  /** 壓力鋼筋深度 d' (mm)，從受壓區邊緣到壓力鋼筋重心 */
  d_prime: number;
  /** 最小鋼筋量 As_min (mm²)，依 ACI 318-19 §9.6.1.2 */
  As_min: number;
  /** 最大鋼筋量 As_max (mm²)，依 ACI 318-19 §10.3.5（0.04Ag） */
  As_max: number;
  /** 最小鋼筋比 ρ_min */
  rho_min: number;
  /** 最大鋼筋比 ρ_max */
  rho_max: number;
}

/**
 * 計算 RC 矩形斷面幾何性質
 *
 * 假設：
 * - 單層拉力鋼筋，主筋直徑 db = 25mm（可透過參數調整）
 * - 箍筋直徑 ds = 10mm
 *
 * 參考：ACI 318-19 §9.6.1.2（最小鋼筋）、§10.3.5（最大鋼筋）
 *
 * @param b     - 斷面寬度 (mm)
 * @param h     - 斷面總深度 (mm)
 * @param cover - 保護層厚度 (mm)，從混凝土表面到箍筋中心
 * @param fc    - 混凝土抗壓強度 (MPa)
 * @param fy    - 鋼筋降伏強度 (MPa)
 * @param db    - 主筋直徑 (mm)，預設 25mm
 * @param ds    - 箍筋直徑 (mm)，預設 10mm
 * @returns RCGeoProps 包含 Ag、d、d'、As_min、As_max
 *
 * @example
 * ```ts
 * const props = calcRCGeoProps(300, 500, 40, 28, 420);
 * // props.Ag = 150000 mm², props.d ≈ 445 mm
 * ```
 */
export function calcRCGeoProps(
  b: number,
  h: number,
  cover: number,
  fc: number,
  fy: number,
  db: number = 25,
  ds: number = 10,
): RCGeoProps {
  // 總斷面積
  const Ag = b * h;

  // 有效深度 d = h - cover - ds - db/2
  const d = h - cover - ds - db / 2;

  // 壓力鋼筋深度 d' = cover + ds + db/2
  const d_prime = cover + ds + db / 2;

  // ── 最小鋼筋量 As_min（ACI 318-19 §9.6.1.2）──
  // As_min = max(0.25√fc/fy × b × d, 1.4 × b × d / fy)
  const sqrtFc = Math.sqrt(fc);
  const As_min_1 = (0.25 * sqrtFc * b * d) / fy;
  const As_min_2 = (1.4 * b * d) / fy;
  const As_min = Math.max(As_min_1, As_min_2);

  // 最小鋼筋比
  const rho_min = As_min / (b * d);

  // ── 最大鋼筋量 As_max（ACI 318-19 §10.3.5）──
  // 實務上限為 0.04 × Ag（4% 鋼筋比）
  const As_max = 0.04 * Ag;
  const rho_max = As_max / (b * d);

  return {
    Ag,
    d: Math.round(d * 100) / 100,
    d_prime: Math.round(d_prime * 100) / 100,
    As_min: Math.round(As_min * 100) / 100,
    As_max: Math.round(As_max * 100) / 100,
    rho_min: Math.round(rho_min * 1000000) / 1000000,
    rho_max: Math.round(rho_max * 1000000) / 1000000,
  };
}

// ═══════════════════════════════════════════
//  H 型鋼查詢工具
// ═══════════════════════════════════════════

/**
 * 根據最小需求斷面模數 (Zx) 尋找適用的 H 型鋼
 * @param minZx - 最小需求斷面模數 (cm³)
 * @returns 符合條件的最小 H 型鋼，若無符合則回傳 null
 */
export function findHBeam(minZx: number): HBeam | null {
  const sorted = [...H_BEAMS].sort((a, b) => a.Zx - b.Zx);
  for (const beam of sorted) {
    if (beam.Zx >= minZx) {
      return beam;
    }
  }
  return null;
}

/**
 * 依型號名稱查詢 H 型鋼
 * @param name - 型號名稱，例如 'H300×300×10×15'
 */
export function getHBeamByName(name: string): HBeam | undefined {
  return H_BEAMS.find((b) => b.name === name);
}

/**
 * 將 H 型鋼資料轉換為 Select 選項格式
 */
export function getHBeamOptions() {
  return H_BEAMS.map((b) => ({
    value: b.name,
    label: `${b.name} (Zx=${b.Zx} cm³, W=${b.weight} kg/m)`,
  }));
}

// ═══════════════════════════════════════════
//  C 型鋼查詢工具
// ═══════════════════════════════════════════

/**
 * 根據最小需求斷面模數 (Zx) 尋找適用的 C 型鋼
 * @param minZx - 最小需求斷面模數 (cm³)
 * @returns 符合條件的最小 C 型鋼，若無符合則回傳 null
 */
export function findChannel(minZx: number): Channel | null {
  const sorted = [...CHANNELS].sort((a, b) => a.Zx - b.Zx);
  for (const ch of sorted) {
    if (ch.Zx >= minZx) {
      return ch;
    }
  }
  return null;
}

/**
 * 依型號名稱查詢 C 型鋼
 * @param name - 型號名稱，例如 'C200×80×7.5×11'
 */
export function getChannelByName(name: string): Channel | undefined {
  return CHANNELS.find((c) => c.name === name);
}

/**
 * 將 C 型鋼資料轉換為 Select 選項格式
 */
export function getChannelOptions() {
  return CHANNELS.map((c) => ({
    value: c.name,
    label: `${c.name} (Zx=${c.Zx} cm³, W=${c.weight} kg/m)`,
  }));
}

// ═══════════════════════════════════════════
//  等邊角鋼查詢工具
// ═══════════════════════════════════════════

/**
 * 根據最小需求斷面模數 (Zx) 尋找適用的等邊角鋼
 * @param minZx - 最小需求斷面模數 (cm³)
 * @returns 符合條件的最小角鋼，若無符合則回傳 null
 */
export function findAngle(minZx: number): Angle | null {
  const sorted = [...ANGLES].sort((a, b) => a.Zx - b.Zx);
  for (const ang of sorted) {
    if (ang.Zx >= minZx) {
      return ang;
    }
  }
  return null;
}

/**
 * 依型號名稱查詢等邊角鋼
 * @param name - 型號名稱，例如 'L100×100×10'
 */
export function getAngleByName(name: string): Angle | undefined {
  return ANGLES.find((a) => a.name === name);
}

/**
 * 將等邊角鋼資料轉換為 Select 選項格式
 */
export function getAngleOptions() {
  return ANGLES.map((a) => ({
    value: a.name,
    label: `${a.name} (Zx=${a.Zx} cm³, W=${a.weight} kg/m)`,
  }));
}

// ═══════════════════════════════════════════
//  通用斷面選項（按類型篩選）
// ═══════════════════════════════════════════

/**
 * 通用斷面選項格式
 */
export interface SectionOption {
  value: string;
  label: string;
  type: SectionType;
  /** Zx 斷面模數 (cm³)，為空表 RC 斷面 */
  Zx?: number;
  /** 單位重量 (kg/m)，為空表 RC 斷面 */
  weight?: number;
}

/**
 * 依斷面類型取得 Select 選項
 *
 * @param type - 斷面類型，若省略則回傳所有類型
 * @returns SectionOption 陣列
 *
 * @example
 * ```ts
 * const hBeams = getSectionOptions('HBEAM');
 * const all = getSectionOptions();
 * const channels = getSectionOptions('CHANNEL');
 * ```
 */
export function getSectionOptions(type?: SectionType): SectionOption[] {
  const options: SectionOption[] = [];

  if (!type || type === 'HBEAM') {
    options.push(
      ...H_BEAMS.map((b) => ({
        value: b.name,
        label: `${b.name} (Zx=${b.Zx} cm³, W=${b.weight} kg/m)`,
        type: 'HBEAM' as SectionType,
        Zx: b.Zx,
        weight: b.weight,
      })),
    );
  }

  if (!type || type === 'CHANNEL') {
    options.push(
      ...CHANNELS.map((c) => ({
        value: c.name,
        label: `${c.name} (Zx=${c.Zx} cm³, W=${c.weight} kg/m)`,
        type: 'CHANNEL' as SectionType,
        Zx: c.Zx,
        weight: c.weight,
      })),
    );
  }

  if (!type || type === 'ANGLE') {
    options.push(
      ...ANGLES.map((a) => ({
        value: a.name,
        label: `${a.name} (Zx=${a.Zx} cm³, W=${a.weight} kg/m)`,
        type: 'ANGLE' as SectionType,
        Zx: a.Zx,
        weight: a.weight,
      })),
    );
  }

  if (!type || type === 'RC_RECT') {
    options.push({
      value: 'RC_RECT',
      label: 'RC 矩形斷面（自定義）',
      type: 'RC_RECT',
    });
  }

  return options;
}
