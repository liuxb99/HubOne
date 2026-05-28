/**
 * 鋼筋規格與配筋計算工具
 *
 * 參考標準：
 * - CNS 560 A2006 鋼筋混凝土用鋼筋
 * - ACI 318-19 Building Code Requirements for Structural Concrete
 *
 * 鋼筋代號對照（台灣 CNS 標準）：
 *   D10  → 直徑 9.53mm ( #3 )
 *   D13  → 直徑 12.7mm  ( #4 )
 *   D16  → 直徑 15.9mm  ( #5 )
 *   D19  → 直徑 19.1mm  ( #6 )
 *   D22  → 直徑 22.2mm  ( #7 )
 *   D25  → 直徑 25.4mm  ( #8 )
 *   D29  → 直徑 28.6mm  ( #9 )
 *   D32  → 直徑 31.8mm  ( #10 )
 *   D36  → 直徑 35.8mm  ( #11 )
 *   D43  → 直徑 42.8mm  ( #14 )
 */

// ═══════════════════════════════════════════
//  型別定義
// ═══════════════════════════════════════════

/** 鋼筋規格 */
export interface RebarSpec {
  /** CNS 代號，如 'D10', 'D13' */
  name: string;
  /** 標稱直徑 (mm) */
  diameter: number;
  /** 斷面積 (mm²) */
  area: number;
  /** 單位重量 (kg/m) */
  weight: number;
  /** 對應美規編號（#3, #4, ...） */
  imperial: string;
}

// ═══════════════════════════════════════════
//  CNS 鋼筋規格表
// ═══════════════════════════════════════════

/**
 * CNS 560 A2006 鋼筋規格表
 *
 * 台灣常用鋼筋從 D10 (ø10mm) 到 D43 (ø43mm)，
 * 涵蓋 #3 ~ #14 美規對應。
 *
 * 資料來源：CNS 560 A2006、ACI 318-19 §20.2
 */
export const REBAR_SPEC: RebarSpec[] = [
  { name: 'D10', diameter: 9.53, area: 71.3, weight: 0.560, imperial: '#3' },
  { name: 'D13', diameter: 12.7, area: 127, weight: 0.994, imperial: '#4' },
  { name: 'D16', diameter: 15.9, area: 199, weight: 1.56, imperial: '#5' },
  { name: 'D19', diameter: 19.1, area: 287, weight: 2.25, imperial: '#6' },
  { name: 'D22', diameter: 22.2, area: 387, weight: 3.04, imperial: '#7' },
  { name: 'D25', diameter: 25.4, area: 507, weight: 3.98, imperial: '#8' },
  { name: 'D29', diameter: 28.6, area: 645, weight: 5.06, imperial: '#9' },
  { name: 'D32', diameter: 31.8, area: 794, weight: 6.23, imperial: '#10' },
  { name: 'D36', diameter: 35.8, area: 1006, weight: 7.91, imperial: '#11' },
  { name: 'D43', diameter: 42.8, area: 1452, weight: 11.4, imperial: '#14' },
];

// ═══════════════════════════════════════════
//  鋼筋面積計算
// ═══════════════════════════════════════════

/**
 * 計算 n 根鋼筋的總面積
 *
 * @param n      - 鋼筋根數
 * @param rebar  - 鋼筋規格（可傳入名稱字串或 RebarSpec 物件）
 * @returns 總面積 (mm²)
 *
 * @example
 * ```ts
 * calcAs(4, REBAR_SPEC[4]);   // 4-D22 → 4 × 387 = 1548 mm²
 * calcAs(6, 'D25');           // 6-D25 → 6 × 507 = 3042 mm²
 * ```
 */
export function calcAs(n: number, rebar: RebarSpec | string): number {
  const spec = typeof rebar === 'string' ? getRebarByName(rebar) : rebar;
  if (!spec) {
    throw new Error(`找不到鋼筋規格：${rebar}`);
  }
  return n * spec.area;
}

/**
 * 依鋼筋名稱查詢規格
 *
 * @param name - CNS 代號（'D10' ~ 'D43'）
 * @returns RebarSpec | undefined
 */
export function getRebarByName(name: string): RebarSpec | undefined {
  return REBAR_SPEC.find((r) => r.name === name);
}

/**
 * 配筋方案（一層的配置）
 */
export interface RebarArrangement {
  /** 鋼筋規格名稱 */
  rebarName: string;
  /** 鋼筋根數 */
  count: number;
  /** 單支面積 (mm²) */
  areaPerBar: number;
  /** 總面積 (mm²) */
  totalArea: number;
  /** 與需求面積的差距 (mm²)，負值表示不足 */
  diff: number;
}

// ═══════════════════════════════════════════
//  配筋選用
// ═══════════════════════════════════════════

/**
 * 依需求鋼筋面積，自動選取最接近的配筋方案
 *
 * 會嘗試多種鋼筋規格（D13~D36），找出總面積 ≥ required 的最小組合。
 *
 * @param required - 需求鋼筋面積 (mm²)
 * @param rebar    - 指定的鋼筋規格（可省略，由函數自動選擇最佳方案）
 * @returns RebarArrangement 配筋方案
 *
 * @example
 * ```ts
 * const arr = calcRebarByArea(1500, 'D25');
 * // 可能回傳 { rebarName: 'D25', count: 3, totalArea: 1521, ... }
 * ```
 */
export function calcRebarByArea(
  required: number,
  rebar?: RebarSpec | string,
): RebarArrangement {
  if (required <= 0) {
    throw new Error('需求面積必須大於 0');
  }

  // 若指定鋼筋規格
  if (rebar) {
    const spec = typeof rebar === 'string' ? getRebarByName(rebar) : rebar;
    if (!spec) {
      throw new Error(`找不到鋼筋規格：${rebar}`);
    }
    const count = Math.ceil(required / spec.area);
    const totalArea = count * spec.area;
    return {
      rebarName: spec.name,
      count,
      areaPerBar: spec.area,
      totalArea,
      diff: totalArea - required,
    };
  }

  // 未指定 → 自動嘗試 D13~D36，選取最接近需求的方案
  const candidates: RebarArrangement[] = [];

  for (const spec of REBAR_SPEC) {
    if (spec.diameter < 12) continue; // 跳過 D10（過細）
    if (spec.diameter > 36) continue; // D43 過大，實務較少用
    const count = Math.ceil(required / spec.area);
    const totalArea = count * spec.area;
    candidates.push({
      rebarName: spec.name,
      count,
      areaPerBar: spec.area,
      totalArea,
      diff: totalArea - required,
    });
  }

  // 以總面積最小且 ≥ required 排序
  candidates.sort((a, b) => a.totalArea - b.totalArea);

  if (candidates.length === 0) {
    // fallback
    const fallback = REBAR_SPEC[REBAR_SPEC.length - 1];
    const count = Math.ceil(required / fallback.area);
    return {
      rebarName: fallback.name,
      count,
      areaPerBar: fallback.area,
      totalArea: count * fallback.area,
      diff: count * fallback.area - required,
    };
  }

  return candidates[0];
}

// ═══════════════════════════════════════════
//  鋼筋間距計算
// ═══════════════════════════════════════════

/**
 * 計算鋼筋淨間距
 *
 * @param b        - 斷面寬度 (mm)
 * @param n        - 鋼筋根數
 * @param db       - 鋼筋直徑 (mm)
 * @param cover    - 保護層厚度 (mm)，到箍筋中心
 * @param ds       - 箍筋直徑 (mm)，預設 10mm
 * @returns 淨間距 (mm)
 *
 * @example
 * ```ts
 * const s = calcSpacing(300, 5, 25, 40, 10);
 * // 若 b=300, 5-D25, cover=40, ds=10
 * // s ≈ (300 - 2*40 - 2*10 - 5*25) / (5-1) = (300-80-20-125)/4 = 18.75 mm
 * ```
 */
export function calcSpacing(
  b: number,
  n: number,
  db: number,
  cover: number = 40,
  ds: number = 10,
): number {
  if (n <= 1) return 0; // 單根鋼筋無間距問題
  const clearSpace = b - 2 * cover - 2 * ds - n * db;
  const spacing = clearSpace / (n - 1);
  return Math.round(spacing * 100) / 100;
}

/**
 * 檢驗鋼筋淨間距是否符合最小間距要求
 *
 * 依 ACI 318-19 §25.2.1：
 *   最小淨間距 = max(25mm, db, 4/3 * 粗骨材最大粒徑)
 * 此處簡化取 max(25mm, db)
 *
 * @param spacing - 鋼筋淨間距 (mm)
 * @param db      - 鋼筋直徑 (mm)
 * @returns { pass: boolean; message: string }
 *
 * @example
 * ```ts
 * checkMinSpacing(30, 25); // { pass: true, message: '間距 30mm ≥ 25mm ✓' }
 * ```
 */
export function checkMinSpacing(
  spacing: number,
  db: number = 25,
): { pass: boolean; message: string } {
  const minSpacing = Math.max(25, db);
  if (spacing >= minSpacing) {
    return {
      pass: true,
      message: `間距 ${spacing}mm ≥ ${minSpacing}mm ✓`,
    };
  }
  return {
    pass: false,
    message: `間距 ${spacing}mm < ${minSpacing}mm ✗ （須 ≥ ${minSpacing}mm）`,
  };
}

// ═══════════════════════════════════════════
//  伸展長度（ACI 318-19 §25.4）
// ═══════════════════════════════════════════

/**
 * 鋼筋基本伸展長度 ld（ACI 318-19 §25.4.2）
 *
 * 基本公式（簡化版，假設無護層修正、無輕質混凝土修正）：
 *   ld = (fy × ψt × ψe × ψs) / (λ × √fc') × db / (2.25)
 *
 * 此處使用 ACI 318-19 §25.4.2.2 簡化公式：
 *   ld = (fy × ψt × ψe × ψs × db) / (2.25 × λ × √fc')
 *
 * 其中：
 *   ψt = 1.0（鋼筋下方混凝土厚度 < 300mm）
 *   ψe = 1.0（未環氧塗層）
 *   ψs = 0.8（D19 及以下）或 1.0（D22 及以上）
 *   λ  = 1.0（常重混凝土）
 *
 * @param db  - 鋼筋直徑 (mm)
 * @param fy  - 鋼筋降伏強度 (MPa)，常用 280 或 420
 * @param fc  - 混凝土抗壓強度 (MPa)
 * @param isSmallBar - 是否為細徑鋼筋（D19 及以下），預設 false
 * @returns 基本伸展長度 (mm)
 *
 * @example
 * ```ts
 * calcDevelopmentLength(25.4, 420, 28);
 * // ≈ (420 × 1.0 × 1.0 × 1.0 × 25.4) / (2.25 × 1.0 × √28) ≈ 1129 mm
 * ```
 */
export function calcDevelopmentLength(
  db: number,
  fy: number,
  fc: number,
  isSmallBar: boolean = false,
): number {
  if (db <= 0 || fy <= 0 || fc <= 0) {
    throw new Error('所有參數必須為正數');
  }

  const psi_t = 1.0; // 鋼筋位置修正係數（非頂層鋼筋）
  const psi_e = 1.0; // 塗層修正係數（無環氧塗層）
  const psi_s = isSmallBar ? 0.8 : 1.0; // 尺寸修正係數
  const lambda = 1.0; // 常重混凝土

  const sqrtFc = Math.sqrt(fc);
  const ld =
    (fy * psi_t * psi_e * psi_s * db) / (2.25 * lambda * sqrtFc);

  // ACI 318-19 §25.4.2.4：ld ≥ 300mm
  const ldFinal = Math.max(ld, 300);

  return Math.round(ldFinal);
}

// ═══════════════════════════════════════════
//  搭接長度（ACI 318-19 §25.5）
// ═══════════════════════════════════════════

/**
 * 鋼筋搭接長度（ACI 318-19 §25.5.2）
 *
 * A 級搭接：搭接長度 = 1.0 × ld（鋼筋搭接率 ≤ 50%）
 * B 級搭接：搭接長度 = 1.3 × ld（鋼筋搭接率 = 100%）
 *
 * @param db       - 鋼筋直徑 (mm)
 * @param fy       - 鋼筋降伏強度 (MPa)
 * @param fc       - 混凝土抗壓強度 (MPa)
 * @param lapClass - 搭接等級 'A' 或 'B'（預設 'B'）
 * @param isSmallBar - 是否為細徑鋼筋
 * @returns 搭接長度 (mm)
 *
 * @example
 * ```ts
 * calcLapSplice(25.4, 420, 28, 'B');
 * // ≈ 1.3 × 1129 ≈ 1468 mm
 * ```
 */
export function calcLapSplice(
  db: number,
  fy: number,
  fc: number,
  lapClass: 'A' | 'B' = 'B',
  isSmallBar: boolean = false,
): number {
  const ld = calcDevelopmentLength(db, fy, fc, isSmallBar);
  const factor = lapClass === 'A' ? 1.0 : 1.3;
  const lap = ld * factor;
  return Math.round(lap);
}

// ═══════════════════════════════════════════
//  工具函數
// ═══════════════════════════════════════════

/**
 * 鋼筋選項（用於 UI 下拉選單）
 */
export function getRebarOptions() {
  return REBAR_SPEC.map((r) => ({
    value: r.name,
    label: `${r.name} (ø=${r.diameter}mm, As=${r.area}mm², ${r.weight}kg/m)`,
  }));
}

/**
 * 從鋼筋直徑反查鋼筋規格
 *
 * @param diameter - 鋼筋直徑 (mm)
 * @returns RebarSpec | undefined
 */
export function getRebarByDiameter(diameter: number): RebarSpec | undefined {
  return REBAR_SPEC.find((r) => Math.abs(r.diameter - diameter) < 0.1);
}
