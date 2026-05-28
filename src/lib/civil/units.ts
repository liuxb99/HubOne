/**
 * 土木工程常用單位轉換工具
 *
 * 台灣土木實務常用單位系統：
 * - 力：kN（SI）、tf / kgf（公制）
 * - 應力：MPa（SI）、kgf/cm²（公制）
 * - 慣性矩：cm⁴（圖說常用）、mm⁴（分析常用）
 * - 彎矩：kN·m（設計）、N·mm（分析）
 *
 * 參考：SI 單位制、CNS 標準、台灣結構設計規範
 */

/** 單位類型 */
export type UnitCategory =
  | 'force'
  | 'stress'
  | 'moment'
  | 'inertia'
  | 'length'
  | 'area'
  | 'weight';

/**
 * 1 kN → kgf
 * 1 kgf = 9.80665 N → 1 kN = 1000/9.80665 ≈ 101.9716 kgf
 */
const KN_TO_KGF = 101.9716;

/**
 * 1 MPa → kgf/cm²
 * 1 MPa = 1 N/mm² = 10.197 kgf/cm²
 * （∵ 1 kgf = 9.80665 N, 1 cm² = 100 mm²）
 */
const MPA_TO_KGFCM2 = 10.197;

/**
 * 千牛頓 (kN) 轉換為公斤力 (kgf)
 *
 * 1 kN = 101.9716 kgf
 *
 * @param kN - 千牛頓值
 * @returns 公斤力值
 *
 * @example
 * ```ts
 * kN_to_kgf(100);   // → 10197.16 kgf
 * kN_to_kgf(10.5);  // → 1070.70 kgf
 * ```
 */
export function kN_to_kgf(kN: number): number {
  return round(kN * KN_TO_KGF, 2);
}

/**
 * 公斤力 (kgf) 轉換為千牛頓 (kN)
 *
 * @param kgf - 公斤力值
 * @returns 千牛頓值
 */
export function kgf_to_kN(kgf: number): number {
  return round(kgf / KN_TO_KGF, 4);
}

/**
 * 百萬帕 (MPa) 轉換為公斤力每平方公分 (kgf/cm²)
 *
 * 1 MPa = 10.197 kgf/cm²
 *
 * @param MPa - 百萬帕值
 * @returns 公斤力每平方公分值
 *
 * @example
 * ```ts
 * MPa_to_kgfcm2(28);   // → 285.52 kgf/cm²
 * MPa_to_kgfcm2(420);  // → 4282.74 kgf/cm²
 * ```
 */
export function MPa_to_kgfcm2(MPa: number): number {
  return round(MPa * MPA_TO_KGFCM2, 2);
}

/**
 * 公斤力每平方公分 (kgf/cm²) 轉換為百萬帕 (MPa)
 *
 * @param kgfcm2 - 公斤力每平方公分值
 * @returns 百萬帕值
 */
export function kgfcm2_to_MPa(kgfcm2: number): number {
  return round(kgfcm2 / MPA_TO_KGFCM2, 4);
}

/**
 * 慣性矩 cm⁴ → mm⁴
 *
 * 1 cm⁴ = 10⁴ mm⁴ = 10000 mm⁴
 *
 * @param cm4 - 慣性矩 (cm⁴)
 * @returns 慣性矩 (mm⁴)
 *
 * @example
 * ```ts
 * cm4_to_mm4(20400);  // → 204000000 mm⁴
 * ```
 */
export function cm4_to_mm4(cm4: number): number {
  return cm4 * 1e4;
}

/**
 * 慣性矩 mm⁴ → cm⁴
 *
 * @param mm4 - 慣性矩 (mm⁴)
 * @returns 慣性矩 (cm⁴)
 */
export function mm4_to_cm4(mm4: number): number {
  return mm4 / 1e4;
}

/**
 * 彎矩 kN·m → N·mm
 *
 * 1 kN·m = 10⁶ N·mm = 1000000 N·mm
 *
 * @param kNm - 彎矩 (kN·m)
 * @returns 彎矩 (N·mm)
 *
 * @example
 * ```ts
 * kNm_to_Nmm(100);  // → 100000000 N·mm
 * ```
 */
export function kNm_to_Nmm(kNm: number): number {
  return kNm * 1e6;
}

/**
 * 彎矩 N·mm → kN·m
 *
 * @param Nmm - 彎矩 (N·mm)
 * @returns 彎矩 (kN·m)
 */
export function Nmm_to_kNm(Nmm: number): number {
  return Nmm / 1e6;
}

/**
 * 長度 mm → cm
 *
 * @param mm - 長度 (mm)
 * @returns 長度 (cm)
 */
export function mm_to_cm(mm: number): number {
  return mm / 10;
}

/**
 * 長度 cm → mm
 *
 * @param cm - 長度 (cm)
 * @returns 長度 (mm)
 */
export function cm_to_mm(cm: number): number {
  return cm * 10;
}

/**
 * 壓力 MPa → N/mm²（數值相同，但語義轉換）
 *
 * 1 MPa = 1 N/mm²
 *
 * @param MPa - 壓力 (MPa)
 * @returns 單位應力 (N/mm²)
 */
export function MPa_to_Nmm2(MPa: number): number {
  return MPa;
}

/**
 * 在地格式化 — 將數值依單位類別輸出為台灣常用格式
 *
 * 支援單位標籤：
 *   'kN'      → 千牛頓
 *   'kgf'     → 公斤力
 *   'tf'      → 公噸力 (1 tf = 1000 kgf)
 *   'kN·m'    → 千牛頓米
 *   'N·mm'    → 牛頓毫米
 *   'MPa'     → 百萬帕
 *   'kgf/cm²' → 公斤力每平方公分
 *   'cm⁴'     → 四次方公分（慣性矩）
 *   'mm⁴'     → 四次方毫米
 *   'mm'      → 毫米
 *   'cm'      → 公分
 *   'm'       → 公尺
 *   'mm²'     → 平方毫米
 *   'cm²'     → 平方公分
 *   'm²'      → 平方公尺
 *   'kg/m'    → 公斤每公尺
 *
 * @param value - 數值
 * @param unit  - 單位標籤
 * @param digit - 小數位數（預設 2）
 * @returns 格式化的字串
 *
 * @example
 * ```ts
 * formatUnit(10197.16, 'kgf');   // → "10,197.16 kgf"
 * formatUnit(28, 'MPa');         // → "28.00 MPa"
 * formatUnit(20400, 'cm⁴');      // → "20,400.00 cm⁴"
 * ```
 */
export function formatUnit(
  value: number,
  unit: string,
  digit: number = 2,
): string {
  const formatted = value.toLocaleString('zh-TW', {
    minimumFractionDigits: digit,
    maximumFractionDigits: digit,
  });
  return `${formatted} ${unit}`;
}

/**
 * 將數值以工程記法輸出（適用大型數字）
 *
 * @param value - 數值
 * @param unit  - 單位標籤
 * @param digit - 小數位數（預設 2）
 * @returns 工程記法字串
 *
 * @example
 * ```ts
 * formatEng(204000000, 'mm⁴');  // → "2.04 × 10⁸ mm⁴"
 * ```
 */
export function formatEng(
  value: number,
  unit: string,
  digit: number = 2,
): string {
  if (value === 0) return `0 ${unit}`;
  const exp = Math.floor(Math.log10(Math.abs(value)));
  const mantissa = value / Math.pow(10, exp);
  const mantissaStr = mantissa.toFixed(digit);
  return `${mantissaStr} × 10${superscript(exp)} ${unit}`;
}

// ── 輔助 ──

/** 數字轉上標字串 */
function superscript(n: number): string {
  const supMap: Record<string, string> = {
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
    '-': '⁻',
  };
  return String(n)
    .split('')
    .map((c) => supMap[c] ?? c)
    .join('');
}

/** 四捨五入輔助 */
function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
