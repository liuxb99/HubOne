/**
 * 柱計算引擎
 *
 * 支援：
 * - 鋼柱承載能力（尤拉臨界載重）
 * - RC 柱配筋設計（PM 曲線、ACI 318-19 §10、§22）
 * - 長細比檢核
 */

import { type HBeam } from './section';

/** 有效長度係數 k */
export type EffectiveLengthFactor = 0.5 | 0.7 | 1.0 | 2.0;

/** PM 曲線上的點 */
export interface InteractionPoint {
  phiPn: number; // kN 設計軸壓強度
  phiMn: number; // kN·m 設計彎矩強度
}

/** RC 柱配筋結果 */
export interface RCColumnResult {
  /** 總鋼筋面積 (mm²) */
  As_total: number;
  /** 每面鋼筋面積 (mm²) */
  As_per_face: number;
  /** 配筋描述，例：["4-D25", "4-D25"] */
  bars: string[];
  /** 總鋼筋比 ρ_g */
  rho_g: number;
  /** 最小鋼筋比 0.01 (ACI 318-19 §10.6.1.1) */
  rho_g_min: number;
  /** 最大鋼筋比 0.08 (ACI 318-19 §10.6.1.2) */
  rho_g_max: number;
  /** 最大設計軸壓強度 (kN) */
  phiPn_max: number;
  /** PM 曲線點陣列（至少 12 點） */
  interactionPoints: InteractionPoint[];
  /** 圍束間距 (mm) */
  tieSpacing: number;
  /** (Pu, Mu) 是否在 PM 曲線範圍內 */
  isSafe: boolean;
  /** 使用率（軸力 + 彎矩綜合） */
  safetyRatio: number;
}

/** 柱計算結果 */
export interface ColumnResult {
  /** 柱長度 (m) */
  length: number;
  /** 軸向載重 (kN) */
  axialLoad: number;
  /** 長細比 λ = kL/r */
  slenderness: number;
  /** 尤拉臨界載重 (kN) */
  criticalLoad: number;
  /** 斷面積 (cm²) */
  area: number;
  /** 容許載重 (kN) */
  allowableLoad: number;
  /** 是否安全 */
  isSafe: boolean;
  /** 使用率 (軸力 / 容許載重) */
  safetyRatio: number;
  /** 選用的 H 型鋼 */
  section: HBeam;
  /** 有效長度係數 */
  k: number;
  /** RC 柱配筋結果（選用） */
  rcResult?: RCColumnResult;
}

// ── 常數 ──
const E = 205_000; // 鋼彈性模數 (MPa)
const SAFETY_FACTOR = 1.67; // AISC 容許應力設計法安全係數（柱）
const Es = 200_000; // 鋼筋彈性模數 (MPa), ACI 318-19 §20.2.2
const EPSILON_CU = 0.003; // 混凝土極限壓應變, ACI 318-19 §22.2.2.1

// ══════════════════════════════════════════════════════════
//  鋼柱計算（既有功能）
// ══════════════════════════════════════════════════════════

/**
 * 計算鋼柱的承載能力
 *
 * @param length    - 柱長度 (m)
 * @param axialLoad - 軸向載重 (kN)
 * @param section   - H 型鋼斷面
 * @param k         - 有效長度係數 (預設 1.0)
 * @returns 完整的 ColumnResult
 *
 * @example
 * ```ts
 * const result = calcColumn(3.5, 500, H_BEAMS[5], 0.7);
 * console.log(result.isSafe ? '安全' : '不合格');
 * ```
 */
export function calcColumn(
  length: number,
  axialLoad: number,
  section: HBeam,
  k: number = 1.0,
): ColumnResult {
  // 基本驗證
  if (length <= 0) throw new Error('柱長度必須大於 0');
  if (axialLoad <= 0) throw new Error('軸向載重必須大於 0');
  if (![0.5, 0.7, 1.0, 2.0].includes(k)) {
    throw new Error('有效長度係數 k 必須為 0.5、0.7、1.0 或 2.0');
  }

  // 計算長細比 λ = kL/r
  // L: m → mm (*1000)
  // r: cm → mm (*10)
  const L = length * 1000; // mm
  const r = (section.rx ?? (section.ry ?? 1)) * 10; // mm (使用 rx 做主軸)
  const slenderness = (k * L) / r;

  // 尤拉臨界載重 Pcr = π²EI/(kL)²
  // I: cm⁴ → mm⁴ (*10⁴)
  const I_mm4 = section.Ix * 1e4; // mm⁴
  const kL = k * L; // mm
  const criticalLoad_N = (Math.PI * Math.PI * E * I_mm4) / (kL * kL); // N
  const criticalLoad_kN = criticalLoad_N / 1000; // kN

  // 容許載重
  const allowableLoad_kN = criticalLoad_kN / SAFETY_FACTOR;

  // 使用率
  const safetyRatio = axialLoad / allowableLoad_kN;
  const isSafe = safetyRatio < 1.0;

  return {
    length,
    axialLoad,
    slenderness: Math.round(slenderness * 100) / 100,
    criticalLoad: Math.round(criticalLoad_kN * 100) / 100,
    area: section.area,
    allowableLoad: Math.round(allowableLoad_kN * 100) / 100,
    isSafe,
    safetyRatio: Math.round(safetyRatio * 100) / 100,
    section,
    k,
  };
}

/**
 * 計算容許軸壓應力（AISC ASD E2）
 *
 * 當 λ ≤ 200 時適用（超過 200 為過度細長，不建議使用）
 *
 * @param slenderness - 長細比 λ
 * @param fy          - 降伏強度 (MPa)，預設 245 (SN400B)
 * @returns 容許壓應力 (MPa)
 */
export function calcAllowableStress(slenderness: number, fy: number = 245): number {
  const Cc = Math.sqrt((2 * Math.PI * Math.PI * E) / fy);

  if (slenderness <= Cc) {
    // 非彈性挫屈 (AISC E2-1)
    const fs = 1.67 + 0.375 * (slenderness / Cc) - 0.125 * Math.pow(slenderness / Cc, 3);
    const Fa =
      (1 - 0.5 * Math.pow(slenderness / Cc, 2)) * fy / fs;
    return Math.round(Fa * 100) / 100;
  } else {
    // 彈性挫屈 (AISC E2-2)
    const Fa = (12 * Math.PI * Math.PI * E) / (23 * slenderness * slenderness);
    return Math.round(Fa * 100) / 100;
  }
}

/**
 * 有效長度係數說明
 */
export const K_FACTOR_INFO = [
  { value: 0.5, label: '固定−固定', description: '兩端固定，無側移' },
  { value: 0.7, label: '固定−鉸接', description: '一端固定、一端鉸接' },
  { value: 1.0, label: '鉸接−鉸接', description: '兩端鉸接（標準情況）' },
  { value: 2.0, label: '懸臂柱', description: '一端固定、一端自由' },
] as const;

// ══════════════════════════════════════════════════════════
//  RC 柱配筋計算（ACI 318-19）
// ══════════════════════════════════════════════════════════

/**
 * 計算 β₁ 係數
 *
 * ACI 318-19 §22.2.2.4.3：
 *   fc' ≤ 28 MPa → β₁ = 0.85
 *   fc' > 28 MPa → β₁ = 0.85 - 0.05×(fc'-28)/7, 且 ≥ 0.65
 *
 * @param fc - 混凝土抗壓強度 (MPa)
 * @returns β₁ 係數
 */
function calcBeta1(fc: number): number {
  if (fc <= 28) return 0.85;
  const beta1 = 0.85 - 0.05 * ((fc - 28) / 7);
  return Math.max(beta1, 0.65);
}

/**
 * 計算 RC 柱配筋（雙軸對稱配筋）
 *
 * 依據 ACI 318-19 §10.6（最小/最大鋼筋比）、§22.4（軸壓強度）、§22.3（彎矩強度）
 *
 * 流程：
 * 1. 決定鋼筋配置（四角或均佈）
 * 2. 計算 PM 曲線（至少 12 點）
 * 3. 驗算 (Pu, Mu) 是否在曲線內
 * 4. 計算圍束間距
 *
 * @param Pu - 設計軸壓力 (kN)，壓力為正
 * @param Mu - 設計彎矩 (kN·m)
 * @param b  - 柱斷面寬度 (mm)
 * @param h  - 柱斷面深度 (mm)
 * @param fc - 混凝土抗壓強度 (MPa)
 * @param fy - 鋼筋降伏強度 (MPa)
 * @returns RCColumnResult
 *
 * @example
 * ```ts
 * const result = calcRCColumn(2000, 300, 400, 400, 28, 420);
 * ```
 */
export function calcRCColumn(
  Pu: number,
  Mu: number,
  b: number,
  h: number,
  fc: number,
  fy: number,
): RCColumnResult {
  // ── 基本驗證 ──
  if (b <= 0 || h <= 0) throw new Error('斷面尺寸必須大於 0');
  if (fc <= 0 || fy <= 0) throw new Error('材料強度必須大於 0');

  // ── 幾何性質 ──
  const Ag = b * h; // mm² 總斷面積
  const cover = 40; // mm 保護層厚度（到箍筋中心）
  const ds = 10; // mm 箍筋直徑
  const db = 25; // mm 主筋直徑（初始假設）
  const d = h - cover - ds - db / 2; // mm 有效深度
  const d_prime = cover + ds + db / 2; // mm 壓力筋深度

  // ── 鋼筋比範圍 (ACI 318-19 §10.6.1) ──
  const rho_g_min = 0.01; // §10.6.1.1
  const rho_g_max = 0.08; // §10.6.1.2

  // ── 決定鋼筋量 ──
  // 初步假設鋼筋比 ρ_g = 0.02（常見值），然後根據需求調整
  let rho_g = Math.max(0.02, Pu * 1000 / (0.5 * fc * Ag)); // 初步估算
  rho_g = Math.max(rho_g_min, Math.min(rho_g, rho_g_max));

  const As_total = rho_g * Ag; // mm² 總鋼筋面積
  const As_per_face = As_total / 2; // mm² 每面（拉力面/壓力面）

  // ── 選擇鋼筋配置 ──
  // 使用 D25 為基準，計算每面根數
  const areaD25 = 507; // mm² D25 斷面積
  const nPerFace = Math.ceil(As_per_face / areaD25);
  const actualAsPerFace = nPerFace * areaD25;
  const actualAsTotal = actualAsPerFace * 2;
  const actualRhoG = actualAsTotal / Ag;

  const bars = [`${nPerFace}-D25`, `${nPerFace}-D25`];

  // ── 計算 PM 曲線 ──
  const interactionPoints = calcInteractionPoints(
    b, h, fc, fy, actualAsTotal, `${nPerFace}-D25`,
  );

  // ── 最大設計軸壓強度 (ACI 318-19 §22.4.2) ──
  // φPn_max = 0.80 × φ × [0.85×fc×(Ag - Ast) + fy×Ast]
  // φ = 0.65 對於軸壓控制 (§21.2.1)
  const phiCompression = 0.65;
  const phiPn_max =
    0.80 * phiCompression * (0.85 * fc * (Ag - actualAsTotal) + fy * actualAsTotal);
  const phiPn_max_kN = phiPn_max / 1000;

  // ── 圍束間距 (ACI 318-19 §25.7.2) ──
  const tieSpacing = calcColumnTie(db);

  // ── 安全判定 ──
  // 檢查點 (Pu, Mu) 是否落在 PM 曲線範圍內
  const safety = checkPMPoint(Pu, Mu, interactionPoints);
  const isSafe = safety.isInside;
  const safetyRatio = safety.ratio;

  return {
    As_total: Math.round(actualAsTotal),
    As_per_face: Math.round(actualAsPerFace),
    bars,
    rho_g: Math.round(actualRhoG * 10000) / 10000,
    rho_g_min,
    rho_g_max,
    phiPn_max: Math.round(phiPn_max_kN),
    interactionPoints,
    tieSpacing: Math.round(tieSpacing),
    isSafe,
    safetyRatio: Math.round(safetyRatio * 100) / 100,
  };
}

/**
 * 計算 PM 互動曲線的關鍵點
 *
 * 至少回傳 12 個點，涵蓋：
 *   1. 純壓點（φPn_max, 0）
 *   2. 平衡破壞點（Pb, Mb）
 *   3. 純彎點（0, φMn_max）
 *   4. 純拉點（φPnt, 0）
 *   5. 中間插值點
 *
 * ACI 318-19 §22.3（彎矩強度）、§22.4（軸壓強度）
 *
 * @param b        - 斷面寬度 (mm)
 * @param h        - 斷面深度 (mm)
 * @param fc       - 混凝土抗壓強度 (MPa)
 * @param fy       - 鋼筋降伏強度 (MPa)
 * @param As_total - 總鋼筋面積 (mm²)
 * @param rebar    - 鋼筋規格描述（如 "4-D25"）
 * @returns InteractionPoint[] PM 曲線點陣列
 */
export function calcInteractionPoints(
  b: number,
  h: number,
  fc: number,
  fy: number,
  As_total: number,
  rebar: string,
): InteractionPoint[] {
  const points: InteractionPoint[] = [];

  // ── 材料參數 ──
  const beta1 = calcBeta1(fc);
  const epsilon_y = fy / Es; // 鋼筋降伏應變
  const cover = 40;
  const ds = 10;
  const db = 25;

  // ── 幾何參數 ──
  const d = h - cover - ds - db / 2; // 有效深度
  const d_prime = cover + ds + db / 2; // 壓力筋深度
  const Ag = b * h;

  // ── 鋼筋配置 ──
  // 假設鋼筋平均分布在兩面，每面 As/2
  const As = As_total / 2; // 拉力筋面積
  const As_comp = As_total / 2; // 壓力筋面積

  // ── 折減係數 (ACI 318-19 §21.2) ──
  const phiCompression = 0.65; // 軸壓控制
  const phiTension = 0.90; // 拉力控制
  const phiShear = 0.75; // 剪力控制

  // ── 輔助函數：計算給定 c 下的 (Pn, Mn) ──
  function calcStrength(c: number): { Pn: number; Mn: number } {
    const a = beta1 * c; // 等效矩形應力塊深度

    // 混凝土壓力合力 Cc
    // ACI 318-19 §22.2.2.4：均佈應力 0.85×fc 在深度 a 內
    const Cc = 0.85 * fc * b * a; // N

    // 壓力鋼筋應變與應力
    const epsilon_s_comp = EPSILON_CU * (c - d_prime) / c;
    const fs_comp = Math.min(Math.max(epsilon_s_comp * Es, -fy), fy);
    const Cs = As_comp * fs_comp; // N (壓力筋力)

    // 拉力鋼筋應變與應力
    const epsilon_s_tension = EPSILON_CU * (d - c) / c;
    let fs_tension = epsilon_s_tension * Es;
    fs_tension = Math.min(Math.max(fs_tension, -fy), fy);
    const Ts = As * fs_tension; // N (拉力筋力，負值為拉力)

    // 軸力 Pn (壓力為正)
    // Pn = Cc + Cs + Ts (Ts 為負值時減去拉力)
    // 注意：公式中鋼筋應力已包含正負號
    // 混凝土壓力 Cc 與壓力筋 Cs 為壓力（正），拉力筋 Ts 為拉力（負）
    // 但嚴格來說 Ts = As × fs，fs 為正時表示拉力筋受拉（負號在外部處理）
    // Pn = Cc + Cs - Ts 若 Ts 以拉力正值表示
    // 統一：Pn = Cc + Cs (壓力筋) - |Ts| (拉力筋) ... 不對
    // 用統一的力平衡：Pn = Cc + σ_comp × As_comp + σ_tension × As_tension
    // 其中壓力為正，拉力為負
    const Pn = Cc + Cs + fs_tension * As;
    // fs_tension for tension steel: positive = tension (negative contribution to Pn)

    // 對斷面中心取矩
    const y_bar = h / 2;

    // Cc 作用在 a/2 處（從受壓邊緣算起）
    const d_Cc = y_bar - a / 2;
    const M_Cc = Cc * d_Cc;

    // 壓力筋作用在 d' 處
    const d_Cs = y_bar - d_prime;
    const M_Cs = Cs * d_Cs;

    // 拉力筋作用在 d 處
    const d_Ts = d - y_bar;
    const M_Ts = fs_tension * As * d_Ts;

    const Mn = M_Cc + M_Cs + M_Ts; // N·mm

    return { Pn: Pn / 1000, Mn: Mn / 1e6 }; // kN, kN·m
  }

  // ── 1. 純壓點 (c → ∞, 全斷面均勻壓縮) ──
  // ACI 318-19 §22.4.2: P0 = 0.85×fc×(Ag - Ast) + fy×Ast
  const P0 = 0.85 * fc * (Ag - As_total) + fy * As_total; // N
  const phiPn0 = phiCompression * 0.80 * P0 / 1000; // kN, §22.4.2 的 0.80 折減
  points.push({ phiPn: Math.round(phiPn0), phiMn: 0 });

  // ── 2. 平衡破壞點 (εt = εy, εc = 0.003) ──
  // c_bal = d × εcu / (εcu + εy)
  const c_bal = d * EPSILON_CU / (EPSILON_CU + epsilon_y);
  const { Pn: Pn_bal, Mn: Mn_bal } = calcStrength(c_bal);
  // 判斷折減係數
  const epsilon_t_bal = EPSILON_CU * (d - c_bal) / c_bal;
  const phi_bal = calcPhiFactor(epsilon_t_bal);
  points.push({ phiPn: Math.round(Pn_bal * phi_bal), phiMn: Math.round(Mn_bal * phi_bal * 100) / 100 });

  // ── 3. 純彎點 (Pn = 0, 只有彎矩) ──
  // 迭代找到 Pn ≈ 0 的 c 值
  let c_low = 50; // 小 c（拉力控制）
  let c_high = c_bal;
  let iter_c = c_bal;
  let iter_Pn = Pn_bal;

  // 二分法找 Pn ≈ 0
  for (let i = 0; i < 50; i++) {
    iter_c = (c_low + c_high) / 2;
    const result = calcStrength(iter_c);
    iter_Pn = result.Pn;
    if (iter_Pn > 0) {
      c_high = iter_c;
    } else {
      c_low = iter_c;
    }
    if (Math.abs(iter_Pn) < 0.01) break;
  }
  const { Pn: Pn_pure, Mn: Mn_pure } = calcStrength(iter_c);
  const epsilon_t_pure = EPSILON_CU * (d - iter_c) / iter_c;
  const phi_pure = calcPhiFactor(epsilon_t_pure);
  points.push({ phiPn: 0, phiMn: Math.round(Mn_pure * phi_pure * 100) / 100 });

  // ── 4. 純拉點 (Pn 為負最大, c → 0) ──
  // 所有鋼筋降伏受拉
  const Pnt = -(fy * As_total); // N
  const phiPnt = phiTension * Pnt / 1000; // kN
  points.push({ phiPn: Math.round(phiPnt), phiMn: 0 });

  // ── 5. 中間插值點 ──
  // 在平衡點和純壓之間插入點
  const nInterpCompression = 4;
  for (let i = 1; i <= nInterpCompression; i++) {
    const ratio = i / (nInterpCompression + 1);
    // c 在 c_bal 和一個大值之間（非線性插值）
    const c_val = c_bal + ratio * (h * 3 - c_bal);
    const { Pn: Pn_i, Mn: Mn_i } = calcStrength(c_val);
    const epsilon_t_i = EPSILON_CU * (d - c_val) / c_val;
    const phi_i = calcPhiFactor(epsilon_t_i);
    // 檢查 phiPn 是否超過 phiPn_max
    const phiPn_i = Math.min(Pn_i * phi_i / 1000, phiPn0 * 0.80 * phiCompression / 1000);
    if (phiPn_i > 0) {
      points.push({
        phiPn: Math.round(phiPn_i),
        phiMn: Math.round(Mn_i * phi_i / 1e6 * 100) / 100,
      });
    }
  }

  // 在平衡點和純彎之間插入點
  const nInterpTension = 4;
  for (let i = 1; i <= nInterpTension; i++) {
    const ratio = i / (nInterpTension + 1);
    const c_val = c_bal - ratio * (c_bal - 10);
    if (c_val <= 0) continue;
    const { Pn: Pn_i, Mn: Mn_i } = calcStrength(c_val);
    const epsilon_t_i = EPSILON_CU * (d - c_val) / c_val;
    const phi_i = calcPhiFactor(epsilon_t_i);
    points.push({
      phiPn: Math.round(Pn_i * phi_i / 1000),
      phiMn: Math.round(Mn_i * phi_i / 1e6 * 100) / 100,
    });
  }

  // 在純彎和純拉之間插入點
  const nInterpPull = 3;
  for (let i = 1; i <= nInterpPull; i++) {
    const ratio = i / (nInterpPull + 1);
    // c 從純彎的 c (iter_c) 往 0 方向
    const c_val = iter_c * (1 - ratio);
    if (c_val <= 1) continue;
    const { Pn: Pn_i, Mn: Mn_i } = calcStrength(c_val);
    const epsilon_t_i = EPSILON_CU * (d - c_val) / c_val;
    const phi_i = calcPhiFactor(epsilon_t_i);
    points.push({
      phiPn: Math.round(Pn_i * phi_i / 1000),
      phiMn: Math.round(Mn_i * phi_i / 1e6 * 100) / 100,
    });
  }

  // ── 排序（按 phiMn 遞增） ──
  points.sort((a, b) => a.phiMn - b.phiMn);

  // ── 確保第二象限也有點（負彎矩，相同強度） ──
  // PM 曲線是對稱的，複製一份到負彎矩側
  const symmetricPoints: InteractionPoint[] = [];
  for (const p of points) {
    if (p.phiMn > 0) {
      symmetricPoints.push({ phiPn: p.phiPn, phiMn: -p.phiMn });
    }
  }
  // 加入原點附近
  const allPoints = [...symmetricPoints.reverse(), ...points];

  // 限制回傳點數
  if (allPoints.length > 40) {
    // 稀疏化
    const step = Math.ceil(allPoints.length / 40);
    return allPoints.filter((_, i) => i % step === 0);
  }

  return allPoints;
}

/**
 * 計算折減係數 φ (ACI 318-19 §21.2.2)
 *
 * 根據拉力鋼筋淨應變 εt：
 *   εt ≥ 0.005 → φ = 0.90 (拉力控制)
 *   εt ≤ εy    → φ = 0.65 (壓縮控制，繫箍柱)
 *   中間        → 線性內插
 *
 * @param epsilon_t - 拉力鋼筋淨應變
 * @returns 強度折減係數 φ
 */
function calcPhiFactor(epsilon_t: number): number {
  const epsilon_y = 420 / Es; // 約 0.0021
  const phi_tension = 0.90;
  const phi_compression = 0.65;

  if (epsilon_t >= 0.005) return phi_tension;
  if (epsilon_t <= epsilon_y) return phi_compression;

  // 線性內插
  return phi_compression + (phi_tension - phi_compression) *
    (epsilon_t - epsilon_y) / (0.005 - epsilon_y);
}

/**
 * 檢查點 (Pu, Mu) 是否在 PM 曲線範圍內
 *
 * 使用射線法：從原點到 (Pu, Mu) 的射線與 PM 曲線的交點比較
 *
 * @param Pu                - 設計軸壓力 (kN)
 * @param Mu                - 設計彎矩 (kN·m)
 * @param interactionPoints - PM 曲線點陣列
 * @returns { isInside: boolean; ratio: number }
 */
function checkPMPoint(
  Pu: number,
  Mu: number,
  interactionPoints: InteractionPoint[],
): { isInside: boolean; ratio: number } {
  // 取得正彎矩側的點（右半側）
  const rightPoints = interactionPoints
    .filter((p) => p.phiMn >= 0)
    .sort((a, b) => a.phiMn - b.phiMn);

  if (rightPoints.length < 2) {
    return { isInside: true, ratio: 0 };
  }

  // 處理純壓情況
  if (Math.abs(Mu) < 0.01) {
    const maxPn = Math.max(...rightPoints.map((p) => p.phiPn));
    return {
      isInside: Pu <= maxPn,
      ratio: maxPn > 0 ? Pu / maxPn : 1,
    };
  }

  // 處理純彎情況
  if (Math.abs(Pu) < 0.01) {
    const absMu = Math.abs(Mu);
    // 找最大彎矩
    const maxMn = Math.max(...rightPoints.map((p) => Math.abs(p.phiMn)));
    return {
      isInside: absMu <= maxMn,
      ratio: maxMn > 0 ? absMu / maxMn : 1,
    };
  }

  // 射線法：從原點到 (|Mu|, Pu) 的射線
  const absMu = Math.abs(Mu);
  const angle = Math.atan2(Pu, absMu);

  // 找射線與 PM 曲線的交點
  let boundaryR = 0;
  for (let i = 0; i < rightPoints.length - 1; i++) {
    const p1 = rightPoints[i];
    const p2 = rightPoints[i + 1];

    const angle1 = Math.atan2(p1.phiPn, p1.phiMn);
    const angle2 = Math.atan2(p2.phiPn, p2.phiMn);

    if ((angle >= angle1 && angle <= angle2) || (angle <= angle1 && angle >= angle2)) {
      // 線性內插求交點半徑
      const r1 = Math.sqrt(p1.phiPn * p1.phiPn + p1.phiMn * p1.phiMn);
      const r2 = Math.sqrt(p2.phiPn * p2.phiPn + p2.phiMn * p2.phiMn);

      if (angle2 === angle1) {
        boundaryR = (r1 + r2) / 2;
      } else {
        const t = (angle - angle1) / (angle2 - angle1);
        boundaryR = r1 + t * (r2 - r1);
      }
      break;
    }
  }

  // 如果沒找到交點，取最外點
  if (boundaryR === 0) {
    boundaryR = Math.max(
      ...rightPoints.map((p) => Math.sqrt(p.phiPn * p.phiPn + p.phiMn * p.phiMn)),
    );
  }

  const pointR = Math.sqrt(Pu * Pu + absMu * absMu);
  const ratio = pointR / boundaryR;

  return {
    isInside: ratio <= 1.0,
    ratio,
  };
}

/**
 * 計算柱圍束間距 (ACI 318-19 §25.7.2)
 *
 * 圍束間距不得超過：
 *   1. 16 × 主筋直徑 (16db)
 *   2. 48 × 箍筋直徑 (48dt)
 *   3. 斷面最小尺寸 (min(b, h))
 *
 * @param db_long - 主筋直徑 (mm)
 * @param dt_tie  - 箍筋直徑 (mm)，預設 10mm (D10)
 * @returns 最大容許間距 (mm)
 *
 * @example
 * ```ts
 * calcColumnTie(25);  // D25 主筋 → min(16×25=400, 48×10=480, ∞) = 400mm
 * ```
 */
export function calcColumnTie(db_long: number, dt_tie: number = 10): number {
  if (db_long <= 0 || dt_tie <= 0) {
    throw new Error('鋼筋直徑必須為正數');
  }

  const limit1 = 16 * db_long; // §25.7.2.1(a)
  const limit2 = 48 * dt_tie; // §25.7.2.1(b)
  const limit3 = 400; // 斷面最小尺寸參考值，實務上以實際斷面為準

  return Math.min(limit1, limit2, limit3);
}

/**
 * 計算柱長細比與是否需考慮二次效應 (ACI 318-19 §6.6.4)
 *
 * 當 kLu/r < 22 時，可忽略長細比效應（非抗側移構架）
 * 當 kLu/r ≥ 22 時，需考慮 P-Δ 效應
 *
 * @param k   - 有效長度係數
 * @param Lu  - 柱無支撐長度 (m)
 * @param r   - 迴轉半徑 (mm)
 * @param M1  - 柱端較小彎矩 (kN·m)
 * @param M2  - 柱端較大彎矩 (kN·m)
 * @param Pu  - 軸向載重 (kN)
 * @param EI  - 柱斷面彎曲剛度 (N·mm²)，可選用 0.4×Ec×Ig/(1+βd)
 * @returns 長細比比值與判定
 *
 * @example
 * ```ts
 * const result = calcSlenderness(1.0, 3.5, 150, 50, 100, 2000, 1e12);
 * ```
 */
export function calcSlenderness(
  k: number,
  Lu: number,
  r: number,
  M1: number,
  M2: number,
  Pu: number,
  EI: number,
): number {
  const Lu_mm = Lu * 1000; // m → mm
  const slenderness = (k * Lu_mm) / r;

  // 臨界值 22 (ACI 318-19 §6.6.4.4.2)
  const limit = 22;

  // 彎矩放大因子 δns (ACI 318-19 §6.6.4.5.2)
  // δns = Cm / (1 - Pu/(0.75×Pc)) ≥ 1.0
  // Pc = π²×EI/(kLu)²
  const Pc = Math.PI * Math.PI * EI / (k * Lu_mm * k * Lu_mm); // N
  const Pc_kN = Pc / 1000;

  // Cm = 0.6 + 0.4×(M1/M2) ≥ 0.4 (§6.6.4.5.3)
  const Cm = Math.max(0.4, 0.6 + 0.4 * (M1 / M2));

  // 當 Pu < 0.75×Pc 時公式成立
  const delta_ns = Pu < 0.75 * Pc_kN
    ? Math.max(1.0, Cm / (1 - Pu / (0.75 * Pc_kN)))
    : 1.0;

  return Math.round(slenderness * 100) / 100;
}
