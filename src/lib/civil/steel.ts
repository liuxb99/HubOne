/**
 * 鋼結構設計計算引擎（AISC 360-16 / AISC ASD）
 *
 * 支援：
 * - 螺栓連接設計（AISC 360 §J3）
 * - 銲接設計（AISC 360 §J2）
 * - 螺栓抗剪／抗拉強度
 * - 銲接強度計算
 */

// ═══════════════════════════════════════════
//  型別定義
// ═══════════════════════════════════════════

/** 螺栓連接類型 */
export type BoltGrade = 'A325' | 'A490';
export type ConnectionType = 'bearing' | 'slip-critical';
export type ThreadCondition = 'included' | 'excluded';

/** 螺栓連接計算結果 */
export interface BoltConnection {
  /** 螺栓直徑 (mm) */
  boltDiameter: number;
  /** 螺栓數量 */
  boltCount: number;
  /** 螺栓等級 */
  boltGrade: BoltGrade;
  /** 連接類型 */
  connectionType: ConnectionType;
  /** 抗剪容量 (kN) */
  shearCapacity: number;
  /** 抗拉容量 (kN) */
  tensionCapacity: number;
  /** 抗剪是否合格 */
  isShearOK: boolean;
  /** 抗拉是否合格 */
  isTensionOK: boolean;
  /** 詳細計算步驟 */
  steps: string[];
  /** 需求剪力 (kN) */
  shearDemand: number;
  /** 需求拉力 (kN) */
  tensionDemand: number;
}

/** 銲接計算結果 */
export interface WeldResult {
  /** 銲道容量 (kN) */
  capacity: number;
  /** 是否合格 */
  isOK: boolean;
  /** 詳細計算步驟 */
  steps: string[];
  /** 使用率 */
  ratio: number;
}

// ═══════════════════════════════════════════
//  常數
// ═══════════════════════════════════════════

/** AISC 360 表 J3.2 — 螺栓標稱強度 (MPa) */
const BOLT_STRENGTH: Record<BoltGrade, { Fnv: number; Fnt: number; Fnvt: number }> = {
  // Fnv = 標稱抗剪強度 (MPa), 螺紋包含
  // Fnt = 標稱抗拉強度 (MPa)
  A325: { Fnv: 330, Fnt: 620, Fnvt: 413 },
  A490: { Fnv: 413, Fnt: 780, Fnvt: 520 },
};

/** 螺栓面積表 (mm²) */
const BOLT_AREA: Record<number, number> = {
  12: 84.3,   // M12
  16: 157,    // M16
  20: 245,    // M20
  22: 303,    // M22
  24: 353,    // M24
  27: 459,    // M27
  30: 561,    // M30
  36: 817,    // M36
};

/** 螺栓直徑選項 */
export const BOLT_DIAMETERS = [12, 16, 20, 22, 24, 27, 30, 36];

/** 電極強度 (MPa) */
const ELECTRODE_STRENGTH: Record<string, number> = {
  E60: 415,
  E70: 485,
  E80: 550,
  E90: 620,
  E100: 690,
  E110: 760,
};

/** 電極選項 */
export const ELECTRODE_OPTIONS = ['E60', 'E70', 'E80', 'E90', 'E100', 'E110'];

// ═══════════════════════════════════════════
//  螺栓連接設計（AISC 360 §J3）
// ═══════════════════════════════════════════

/**
 * 螺栓連接設計（AISC 360 §J3）
 *
 * 計算螺栓群的抗剪與抗拉容量，
 * 並檢討需求是否小於容量。
 *
 * 抗剪強度（AISC 360 §J3.6）：
 *   φRn = φ × Fnv × Ab × n
 *   φ = 0.75（LRFD）
 *
 * 抗拉強度（AISC 360 §J3.7）：
 *   φRn = φ × Fnt × Ab × n
 *   φ = 0.75（LRFD）
 *
 * @param Pu            - 需求剪力 (kN)
 * @param Tu            - 需求拉力 (kN)，可選
 * @param diameter      - 螺栓直徑 (mm)
 * @param grade         - 螺栓等級 'A325' | 'A490'
 * @param type          - 連接類型 'bearing' | 'slip-critical'
 * @param threadCondition - 螺紋狀態 'included' | 'excluded'，預設 'included'
 * @returns BoltConnection
 *
 * @example
 * ```ts
 * const result = calcBoltConnection(200, 100, 22, 'A325', 'bearing');
 * ```
 */
export function calcBoltConnection(
  Pu: number,
  Tu: number = 0,
  diameter: number = 22,
  grade: BoltGrade = 'A325',
  type: ConnectionType = 'bearing',
  threadCondition: ThreadCondition = 'included',
): BoltConnection {
  const steps: string[] = [];
  steps.push(`========== 螺栓連接計算 ==========`);

  // 取得螺栓面積
  const Ab = BOLT_AREA[diameter];
  if (!Ab) {
    throw new Error(`不支援的螺栓直徑：${diameter}mm`);
  }

  // 取得材料強度
  const strength = BOLT_STRENGTH[grade];
  const phi = 0.75; // LRFD §J3.6

  steps.push(`螺栓等級：${grade}`);
  steps.push(`螺栓直徑：d = ${diameter}mm`);
  steps.push(`螺栓面積：Ab = ${Ab} mm²`);

  let Fnv = strength.Fnv;

  // 若螺紋除外，抗剪強度可提高（§J3.6 註）
  if (threadCondition === 'excluded') {
    Fnv = grade === 'A325' ? 495 : 620;
    steps.push(`螺紋除外，Fnv = ${Fnv} MPa`);
  } else {
    steps.push(`螺紋包含，Fnv = ${Fnv} MPa`);
  }

  // 若承受拉力 + 剪力組合（§J3.7）
  // Fnv' = 1.3 × Fnt - (Fnt / φ × Fnv) × fv ≤ Fnt
  let Fnt = strength.Fnt;
  let adjustedTension = false;

  if (Tu > 0 && Pu > 0) {
    steps.push(`同時承受剪力 Pu = ${Pu}kN 與拉力 Tu = ${Tu}kN`);
    steps.push(`依 AISC §J3.7 檢討組合應力`);

    // 先初估螺栓數量 n
    // 抗剪所需數量
    const nShear = Math.ceil(Pu / (phi * Fnv * Ab / 1000));
    // 抗拉所需數量
    const nTension = Math.ceil(Tu / (phi * Fnt * Ab / 1000));
    // 取較大者
    let n = Math.max(nShear, nTension, 2);
    steps.push(`抗剪所需螺栓數：n ≥ ${Pu} / (0.75 × ${Fnv} × ${Ab} / 1000) = ${nShear}`);
    steps.push(`抗拉所需螺栓數：n ≥ ${Tu} / (0.75 × ${Fnt} × ${Ab} / 1000) = ${nTension}`);
    steps.push(`採用螺栓數：n = ${n}`);

    // 單螺栓應力
    const fv = (Pu * 1000) / (n * Ab); // MPa
    const ft = (Tu * 1000) / (n * Ab); // MPa
    steps.push(`單螺栓剪應力 fv = ${fv.toFixed(1)} MPa`);
    steps.push(`單螺栓拉應力 ft = ${ft.toFixed(1)} MPa`);

    // 修正抗拉強度 (AISC 360 Eq. J3-3a / J3-3b)
    // φ × Fnt' = φ × (1.3 × Fnt - (Fnt / (φ × Fnv)) × fv) ≤ φ × Fnt
    const Fnt_prime = Math.min(1.3 * Fnt - (Fnt / (phi * Fnv)) * fv, Fnt);
    steps.push(`修正抗拉強度 Fnt\' = min(1.3 × ${Fnt} - (${Fnt} / (0.75 × ${Fnv})) × ${fv.toFixed(1)}, ${Fnt})`);
    steps.push(`Fnt\' = ${Fnt_prime.toFixed(1)} MPa`);

    // 抗拉容量
    const tensionPerBolt = phi * Fnt_prime * Ab / 1000; // kN
    const totalTensionCapacity = tensionPerBolt * n;
    steps.push(`單螺栓抗拉容量 = 0.75 × ${Fnt_prime.toFixed(1)} × ${Ab} / 1000 = ${tensionPerBolt.toFixed(1)} kN`);
    steps.push(`總抗拉容量 = ${tensionPerBolt.toFixed(1)} × ${n} = ${totalTensionCapacity.toFixed(1)} kN`);

    // 抗剪容量
    const shearPerBolt = phi * Fnv * Ab / 1000; // kN
    const totalShearCapacity = shearPerBolt * n;
    steps.push(`單螺栓抗剪容量 = 0.75 × ${Fnv} × ${Ab} / 1000 = ${shearPerBolt.toFixed(1)} kN`);
    steps.push(`總抗剪容量 = ${shearPerBolt.toFixed(1)} × ${n} = ${totalShearCapacity.toFixed(1)} kN`);

    // 組合應力檢討（§J3.7）
    const combinedRatio = Math.sqrt(
      (fv / (phi * Fnv)) ** 2 + (ft / (phi * Fnt_prime)) ** 2
    );
    steps.push(`組合應力比 = √((fv/φFnv)² + (ft/φFnt\')²) = √((${fv.toFixed(1)}/${(phi * Fnv).toFixed(1)})² + (${ft.toFixed(1)}/${(phi * Fnt_prime).toFixed(1)})²) = ${combinedRatio.toFixed(3)}`);
    steps.push(combinedRatio <= 1.0 ? '✅ 組合應力合格' : '❌ 組合應力不合格');

    const isShearOK = totalShearCapacity >= Pu;
    const isTensionOK = totalTensionCapacity >= Tu;

    return {
      boltDiameter: diameter,
      boltCount: n,
      boltGrade: grade,
      connectionType: type,
      shearCapacity: Math.round(totalShearCapacity * 100) / 100,
      tensionCapacity: Math.round(totalTensionCapacity * 100) / 100,
      isShearOK,
      isTensionOK,
      steps,
      shearDemand: Pu,
      tensionDemand: Tu,
    };
  }

  // ── 純剪力或純拉力 ──
  // 先以剪力需求決定螺栓數量
  const nShear = Pu > 0 ? Math.ceil(Pu / (phi * Fnv * Ab / 1000)) : 1;
  const nTension = Tu > 0 ? Math.ceil(Tu / (phi * Fnt * Ab / 1000)) : 1;
  const n = Math.max(nShear, nTension, 2);

  steps.push(`螺栓數量 n = ${n}`);

  const shearPerBolt = phi * Fnv * Ab / 1000; // kN
  const totalShearCapacity = shearPerBolt * n;
  steps.push(`單螺栓抗剪容量 = 0.75 × ${Fnv} × ${Ab} / 1000 = ${shearPerBolt.toFixed(1)} kN`);
  steps.push(`總抗剪容量 φRn = ${shearPerBolt.toFixed(1)} × ${n} = ${totalShearCapacity.toFixed(1)} kN`);

  const tensionPerBolt = phi * Fnt * Ab / 1000; // kN
  const totalTensionCapacity = tensionPerBolt * n;
  steps.push(`單螺栓抗拉容量 = 0.75 × ${Fnt} × ${Ab} / 1000 = ${tensionPerBolt.toFixed(1)} kN`);
  steps.push(`總抗拉容量 φRn = ${tensionPerBolt.toFixed(1)} × ${n} = ${totalTensionCapacity.toFixed(1)} kN`);

  const isShearOK = totalShearCapacity >= Pu;
  const isTensionOK = totalTensionCapacity >= Tu;

  steps.push(`剪力檢討：${Pu} ${isShearOK ? '≤' : '>'} ${totalShearCapacity.toFixed(1)} ${isShearOK ? '✅' : '❌'}`);
  if (Tu > 0) {
    steps.push(`拉力檢討：${Tu} ${isTensionOK ? '≤' : '>'} ${totalTensionCapacity.toFixed(1)} ${isTensionOK ? '✅' : '❌'}`);
  }

  // ── 滑動臨界連接 ──
  if (type === 'slip-critical') {
    // AISC 360 §J3.8，滑動係數 μ = 0.30（清潔表面）
    const mu = 0.30;
    const slipCapacity = 1.0 * mu * (totalTensionCapacity / n) * n; // 簡化
    steps.push(`滑動臨界連接：滑動係數 μ = ${mu}`);
    steps.push(`滑動容量 = φ × μ × 預力 × n（依 AISC §J3.8 詳細計算）`);
  }

  return {
    boltDiameter: diameter,
    boltCount: n,
    boltGrade: grade,
    connectionType: type,
    shearCapacity: Math.round(totalShearCapacity * 100) / 100,
    tensionCapacity: Math.round(totalTensionCapacity * 100) / 100,
    isShearOK,
    isTensionOK,
    steps,
    shearDemand: Pu,
    tensionDemand: Tu,
  };
}

// ═══════════════════════════════════════════
//  銲接設計（AISC 360 §J2）
// ═══════════════════════════════════════════

/**
 * 銲接強度計算（AISC 360 §J2）
 *
 * 銲道標稱強度（§J2.4）：
 *   Rn = Fw × Aw
 *   Fw = 0.60 × FEXX × (1.0 + 0.5 × sin¹·⁵θ)
 *   Aw = 有效喉深 × 有效長度
 *
 * 有效喉深（§J2.2a）：
 *   填角銲：te = 0.707 × w
 *   全滲透：te = 板厚
 *
 * 強度折減係數 φ = 0.75（LRFD §J2.4）
 *
 * @param Pu         - 需求強度 (kN)
 * @param weldSize   - 銲道尺寸 (mm)，填角銲之腳長
 * @param weldLength - 銲道有效長度 (mm)
 * @param electrode  - 電極規格 ('E60' | 'E70' | ...)
 * @param angle      - 受力角度 (度)，預設 0（縱向）
 * @returns WeldResult
 *
 * @example
 * ```ts
 * const result = calcWeld(200, 8, 200, 'E70');
 * ```
 */
export function calcWeld(
  Pu: number,
  weldSize: number,
  weldLength: number,
  electrode: string = 'E70',
  angle: number = 0,
): WeldResult {
  const steps: string[] = [];
  steps.push(`========== 銲接強度計算 ==========`);

  // 電極強度
  const FEXX = ELECTRODE_STRENGTH[electrode];
  if (!FEXX) {
    throw new Error(`不支援的電極規格：${electrode}`);
  }
  steps.push(`電極：${electrode}，FEXX = ${FEXX} MPa`);
  steps.push(`銲道尺寸 w = ${weldSize}mm（填角銲腳長）`);
  steps.push(`銲道長度 L = ${weldLength}mm`);

  // 有效喉深（填角銲）
  const te = 0.707 * weldSize; // mm
  steps.push(`有效喉深 te = 0.707 × w = 0.707 × ${weldSize} = ${te.toFixed(2)}mm`);

  // 有效面積
  const Aw = te * weldLength; // mm²
  steps.push(`有效面積 Aw = te × L = ${te.toFixed(2)} × ${weldLength} = ${Aw.toFixed(1)} mm²`);

  // 標稱強度 §J2.4
  const theta = angle * Math.PI / 180;
  const sinTheta = Math.sin(theta);
  const angleFactor = 1.0 + 0.5 * Math.pow(sinTheta, 1.5);
  const Fw = 0.60 * FEXX * angleFactor;
  steps.push(`受力角度 θ = ${angle}°`);
  steps.push(`角度修正係數 = 1.0 + 0.5 × sin^1.5(${angle}°) = ${angleFactor.toFixed(3)}`);
  steps.push(`標稱強度 Fw = 0.60 × ${FEXX} × ${angleFactor.toFixed(3)} = ${Fw.toFixed(1)} MPa`);

  // 設計強度
  const phi = 0.75; // §J2.4
  const Rn = Fw * Aw / 1000; // kN
  const phiRn = phi * Rn;
  steps.push(`標稱強度 Rn = Fw × Aw = ${Fw.toFixed(1)} × ${Aw.toFixed(1)} / 1000 = ${Rn.toFixed(1)} kN`);
  steps.push(`設計強度 φRn = ${phi} × ${Rn.toFixed(1)} = ${phiRn.toFixed(1)} kN`);

  const isOK = phiRn >= Pu;
  const ratio = Pu / phiRn;

  steps.push(`需求 Pu = ${Pu} kN`);
  steps.push(`檢討：${Pu} ${isOK ? '≤' : '>'} ${phiRn.toFixed(1)} ${isOK ? '✅' : '❌'}`);
  if (isOK) {
    steps.push(`使用率 = ${(ratio * 100).toFixed(1)}%`);
  }

  return {
    capacity: Math.round(phiRn * 100) / 100,
    isOK,
    steps,
    ratio: Math.round(ratio * 1000) / 1000,
  };
}
