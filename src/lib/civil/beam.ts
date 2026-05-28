/**
 * 梁計算引擎
 *
 * 支援：
 * - 簡支梁 + 集中載重 / 均佈載重 / 三角形載重
 * - 懸臂梁 + 集中載重 / 均佈載重 / 三角形載重
 * - 固定梁 + 集中載重 / 均佈載重 / 三角形載重
 * - 多載重疊加
 * - 斷面驗算
 * - RC 梁彎矩／剪力配筋（ACI 318-19 §9~§22）
 * - 連續梁（三彎矩方程式／Clapeyron）
 */

import { type HBeam, findHBeam } from './section';

/** 支承類型 */
export type SupportType = 'simply' | 'fixed' | 'cantilever';

/** 梁載重定義 */
export interface BeamLoad {
  /** 載重類型 */
  type: 'point' | 'udl' | 'triangular';
  /** 數值：集中載重 (kN) 或均佈載重 (kN/m) 或三角形最大載重 (kN/m) */
  value: number;
  /** 集中載重位置，從左端算起 (m) */
  position?: number;
  /** 均佈／三角形載重起點 (m) */
  start?: number;
  /** 均佈／三角形載重終點 (m) */
  end?: number;
  /** 三角形載重方向，'up' | 'down'（預設 'down'） */
  direction?: 'up' | 'down';
}

// ═══════════════════════════════════════════
//  T04：RC 梁配筋介面
// ═══════════════════════════════════════════

/** RC 梁配筋結果 */
export interface RCBeamReinforcement {
  /** 拉力筋面積 (mm²) */
  As_tension: number;
  /** 壓力筋面積 (mm²)，可為 0 */
  As_compression: number;
  /** 剪力筋面積 (mm²) */
  As_shear: number;
  /** 拉力筋配置描述，例：["2-D25", "2-D22"] */
  bars_tension: string[];
  /** 壓力筋配置描述，例：["2-D16"] */
  bars_compression: string[];
  /** 剪力筋配置描述，例："D13@200" */
  stirrup: string;
  /** 剪力筋間距 (mm) */
  spacing: number;
  /** 拉力筋比 ρ */
  rho: number;
  /** 最大筋比 ρ_max */
  rho_max: number;
  /** 最小筋比 ρ_min */
  rho_min: number;
  /** 設計彎矩強度 φMn (kN·m) */
  phiMn: number;
  /** 設計剪力強度 φVn (kN) */
  phiVn: number;
  /** 是否安全（設計強度 ≥ 需求強度） */
  isSafe: boolean;
  /** 是否為拉力控制斷面（εt ≥ 0.005） */
  isTensionControlled: boolean;
}

// ═══════════════════════════════════════════
//  連續梁介面
// ═══════════════════════════════════════════

/** 連續梁跨定義 */
export interface ContinuousSpan {
  /** 跨長 (m) */
  L: number;
  /** 作用於該跨的載重 */
  loads: BeamLoad[];
  /** 支承類型（端跨或內跨） */
  supportType: 'end' | 'interior';
}

/** 連續梁計算結果 */
export interface ContinuousBeamResult {
  /** 各跨計算結果 */
  spans: {
    /** 跨編號（0-based） */
    index: number;
    /** 跨長 (m) */
    L: number;
    /** 左右支承反力 (kN) */
    reactions: { left: number; right: number };
    /** 最大彎矩 (kN·m) */
    maxMoment: number;
    /** 最大剪力 (kN) */
    maxShear: number;
    /** 彎矩圖取樣點 */
    momentPoints: { x: number; m: number }[];
    /** 剪力圖取樣點 */
    shearPoints: { x: number; v: number }[];
  }[];
  /** 包絡線 */
  envelope: {
    /** 彎矩包絡線 */
    moment: { x: number; m: number }[];
    /** 剪力包絡線 */
    shear: { x: number; v: number }[];
  };
}

/** 梁計算結果 */
export interface BeamResult {
  /** 梁長度 (m) */
  length: number;
  /** 支承類型 */
  supportType: SupportType;
  /** 反力 (kN) */
  reactions: { left: number; right: number };
  /** 最大彎矩 (kN·m) */
  maxMoment: number;
  /** 最大剪力 (kN) */
  maxShear: number;
  /** 最大撓度 (mm) */
  maxDeflection: number;
  /** 彎矩圖數據（50 取樣點） */
  momentPoints: { x: number; m: number }[];
  /** 剪力圖數據（50 取樣點） */
  shearPoints: { x: number; v: number }[];
  /** 變形圖數據（50 取樣點） */
  deflectionPoints: { x: number; d: number }[];
  /** 選用的 H 型鋼 */
  section?: HBeam;
  /** 所需斷面模數 (cm³) */
  requiredZx: number;
  /** 是否安全 */
  isSafe: boolean;
  /** 使用率 (Mmax / Mallow)，< 1 安全 */
  safetyRatio: number;
  /** RC 配筋結果（選用） */
  rcResult?: RCBeamReinforcement;
  /** 連續梁計算結果（選用） */
  continuousResult?: ContinuousBeamResult;
}

// ── 輔助常數 ──
const E = 205_000; // 鋼彈性模數 (MPa = N/mm²)
const SAFETY_FACTOR = 1.5; // 容許應力設計法安全係數
const FY = 245; // 鋼材降伏強度 (MPa, SN400B/SM490 常用)
const ALLOWABLE_STRESS = FY / SAFETY_FACTOR; // 容許彎曲應力 (MPa)

/** 鋼筋彈性模數 (MPa) */
const Es = 200_000;

/** 鋼材降伏應力對照表 (MPa) */
const yieldStressMap: Record<string, number> = {
  SN400: 235,
  SN400B: 235,
  SN490: 325,
  SM490: 325,
  SM490Y: 365,
  SM570: 440,
};

/**
 * 計算梁的內力與變形
 *
 * @param length   - 梁長度 (m)
 * @param supportType - 支承類型
 * @param loads    - 載重陣列
 * @param section  - 可選的 H 型鋼斷面
 * @param steelGrade - 鋼材等級 (預設 SM490)
 * @returns 完整的 BeamResult
 */
export function calcBeam(
  length: number,
  supportType: SupportType,
  loads: BeamLoad[],
  section?: HBeam,
  steelGrade: string = 'SM490',
): BeamResult {
  // 基本驗證
  if (length <= 0) throw new Error('梁長度必須大於 0');
  if (loads.length === 0) throw new Error('請至少加入一個載重');

  const fy = yieldStressMap[steelGrade] ?? 245;
  const allowableStress = fy / SAFETY_FACTOR;

  // 計算反力
  const reactions = calcReactions(length, supportType, loads);

  // 計算剪力、彎矩、變形（取樣 50 點）
  const nPoints = 50;
  const step = length / (nPoints - 1);

  const shearPoints: { x: number; v: number }[] = [];
  const momentPoints: { x: number; m: number }[] = [];
  const deflectionPoints: { x: number; d: number }[] = [];

  for (let i = 0; i < nPoints; i++) {
    const x = i * step;
    const v = calcShearAt(x, length, supportType, loads, reactions);
    const m = calcMomentAt(x, length, supportType, loads, reactions);
    const d = calcDeflectionAt(x, length, supportType, loads, reactions);

    shearPoints.push({ x: round(x), v: round(v) });
    momentPoints.push({ x: round(x), m: round(m) });
    deflectionPoints.push({ x: round(x), d: round(d) });
  }

  // 最大彎矩、剪力、變形
  const maxMoment = Math.max(...momentPoints.map((p) => Math.abs(p.m)));
  const maxShear = Math.max(...shearPoints.map((p) => Math.abs(p.v)));
  const maxDeflection = Math.max(...deflectionPoints.map((p) => Math.abs(p.d)));

  // 斷面驗算
  // 需求 Zx = Mmax × 10⁶ / (φ × Fy)   [N·mm → MPa]
  // Mmax (kN·m) → N·mm = * 10⁶
  // Zx (cm³) → mm³ = * 10³
  // σ = M / Z ≤ Fy / SF
  const requiredZx = (maxMoment * 1_000_000) / (allowableStress * 1_000); // cm³

  let isSafe = true;
  let safetyRatio = 0;

  if (section) {
    const actualStress = (maxMoment * 1_000_000) / (section.Zx * 1_000); // MPa
    safetyRatio = actualStress / allowableStress;
    isSafe = safetyRatio < 1.0;
  }

  return {
    length,
    supportType,
    reactions: {
      left: round(reactions.left),
      right: round(reactions.right),
    },
    maxMoment: round(maxMoment),
    maxShear: round(maxShear),
    maxDeflection: round(maxDeflection),
    momentPoints,
    shearPoints,
    deflectionPoints,
    section,
    requiredZx: round(requiredZx),
    isSafe,
    safetyRatio: round(safetyRatio),
  };
}

// ═══════════════════════════════════════════
//  T04-1：RC 梁彎矩配筋（ACI 318-19 §9~§22）
// ═══════════════════════════════════════════

const COVER_DEFAULT = 40; // mm 保護層厚度
const DS_DEFAULT = 10; // mm 箍筋直徑
const DB_DEFAULT = 25; // mm 主筋直徑預設

/**
 * 計算 β1 係數（ACI 318-19 §22.2.2.4.3）
 *
 * β1 = 0.85 for fc ≤ 28 MPa
 * β1 = 0.85 - 0.05 × (fc - 28)/7  for 28 < fc ≤ 55 MPa
 * β1 ≥ 0.65
 */
export function calcBeta1(fc: number): number {
  if (fc <= 28) return 0.85;
  const beta1 = 0.85 - 0.05 * ((fc - 28) / 7);
  return Math.max(0.65, beta1);
}

/**
 * 計算有效深度 d
 *
 * @param h     - 斷面總深度 (mm)
 * @param cover - 保護層厚度 (mm)
 * @param ds    - 箍筋直徑 (mm)
 * @param db    - 主筋直徑 (mm)
 * @returns 有效深度 (mm)
 */
export function calcEffectiveDepth(
  h: number,
  cover: number = COVER_DEFAULT,
  ds: number = DS_DEFAULT,
  db: number = DB_DEFAULT,
): number {
  return h - cover - ds - db / 2;
}

/**
 * RC 梁彎矩配筋計算（ACI 318-19 §9.6.1.2, §10.3.5）
 *
 * 迭代求解中性軸深度 c，計算拉力筋面積 As，
 * 必要時加入壓力筋。
 *
 * @param Mu - 需求彎矩強度 (kN·m)
 * @param Vu - 需求剪力強度 (kN)
 * @param b  - 斷面寬度 (mm)
 * @param h  - 斷面總深度 (mm)
 * @param fc - 混凝土抗壓強度 (MPa)
 * @param fy - 鋼筋降伏強度 (MPa)
 * @returns RCBeamReinforcement
 */
export function calcRCBeam(
  Mu: number,
  Vu: number,
  b: number,
  h: number,
  fc: number,
  fy: number,
): RCBeamReinforcement {
  // 基本參數
  const cover = COVER_DEFAULT;
  const ds = DS_DEFAULT;
  const db = DB_DEFAULT;
  const d = calcEffectiveDepth(h, cover, ds, db);
  const d_prime = cover + ds + db / 2; // 壓力筋深度

  const beta1 = calcBeta1(fc);
  const epsilon_cu = 0.003; // 混凝土極限壓應變 (ACI 318-19 §22.2.2.1)
  const epsilon_y = fy / Es; // 鋼筋降伏應變

  // ── 最小筋比 ρ_min (ACI 318-19 §9.6.1.2) ──
  const rho_min = Math.max((0.25 * Math.sqrt(fc)) / fy, 1.4 / fy);

  // ── 平衡筋比 ρ_balance ──
  // ρb = 0.85×β1×fc/fy × (0.003/(0.003+εy))
  const rho_balance =
    (0.85 * beta1 * fc * epsilon_cu) / (fy * (epsilon_cu + epsilon_y));

  // ── 最大筋比 ρ_max (ACI 318-19 §9.3.1.1, 拉力控制 εt ≥ 0.005) ──
  // 拉力控制時：c/dt = εc/(εc+εt) = 0.003/(0.003+0.005) = 0.375
  // ρ_max = 0.85×β1×fc/fy × c/dt = 0.85×β1×fc/fy × 0.375
  const rho_max = (0.85 * beta1 * fc * 0.375) / fy;

  // ── 迭代求解 As ──
  let As_tension = 0;
  let As_compression = 0;
  let c = 0.1 * d; // 初始猜值
  let phi = 0.9;
  let isTensionControlled = true;
  let phiMn = 0;
  const maxIter = 100;
  const tol = 0.01;

  // 先假設拉力控制，迭代求解
  for (let iter = 0; iter < maxIter; iter++) {
    const c_old = c;
    const a = beta1 * c; // 等效應力塊深度
    const eps_t = epsilon_cu * (d - c) / c; // 拉力筋應變

    // 判斷是否為拉力控制斷面
    if (eps_t >= 0.005) {
      phi = 0.9;
      isTensionControlled = true;
    } else if (eps_t <= epsilon_y) {
      // 受壓控制
      phi = 0.65;
      isTensionControlled = false;
    } else {
      // 過渡區：線性插值 (ACI 318-19 Table 21.2.2)
      phi = 0.65 + 0.25 * (eps_t - epsilon_y) / (0.005 - epsilon_y);
      isTensionControlled = false;
    }

    // 計算所需 As
    // Mu (kN·m) → N·mm: * 1e6
    // φ × As × fy × (d - a/2) = Mu × 1e6
    const Mu_Nmm = Mu * 1e6;
    const As_needed = Mu_Nmm / (phi * fy * (d - a / 2));

    // 檢查是否需壓力筋
    // 若 As_needed > ρ_max × b × d，則需壓力筋
    const As_max_allowed = rho_max * b * d;
    if (As_needed > As_max_allowed) {
      // 需要壓力筋
      // 設定拉力筋為 ρ_max × b × d
      As_tension = As_max_allowed;

      // 計算拉力筋對應的彎矩強度
      const a_max = As_tension * fy / (0.85 * fc * b);
      const Mn_tension = As_tension * fy * (d - a_max / 2); // N·mm

      // 剩餘彎矩由壓力筋承擔
      const Mn_remaining = Math.max(0, Mu_Nmm / phi - Mn_tension);
      if (Mn_remaining > 0 && (d - d_prime) > 0) {
        // 假設壓力筋降伏
        As_compression = Mn_remaining / (fy * (d - d_prime));
        const eps_prime = epsilon_cu * (c - d_prime) / c;
        if (eps_prime < epsilon_y) {
          // 壓力筋未降伏，修正
          const fs_prime = eps_prime * Es;
          As_compression = Mn_remaining / (fs_prime * (d - d_prime));
        }
      }
    } else {
      As_tension = As_needed;
      As_compression = 0;
    }

    // 更新中性軸深度
    // C = 0.85×fc×a×b
    // T = As_tension × fy
    // C' = As_compression × fs'
    let C = 0.85 * fc * a * b;
    let T = As_tension * fy;
    let C_prime = 0;
    if (As_compression > 0) {
      const eps_prime = epsilon_cu * (c - d_prime) / c;
      const fs_prime = Math.min(eps_prime * Es, fy);
      C_prime = As_compression * fs_prime;
    }
    const c_new = (T + C_prime - C) / (0.85 * fc * beta1 * b) + c; // 牛頓法近似
    // 更精確：由力平衡 C - C' = T
    // 0.85×fc×β1×c×b - As_compression×fs' = As_tension×fy
    // 但 fs' 也與 c 有關，故迭代求解
    // 此處用簡化方式計算新 c
    if (As_compression > 0) {
      const eps_prime = epsilon_cu * (c - d_prime) / c;
      const fs_prime = Math.min(eps_prime * Es, fy);
      // 0.85×fc×β1×c×b + As_compression×fs' - As_tension×fy = 0
      // 用牛頓法
      const f_c = 0.85 * fc * beta1 * c * b + As_compression * fs_prime - As_tension * fy;
      // df/dc ≈ 0.85×fc×β1×b + As_compression × (Es×epsilon_cu×d_prime)/c²
      const df =
        0.85 * fc * beta1 * b +
        (eps_prime < epsilon_y ? (As_compression * Es * epsilon_cu * d_prime) / (c * c) : 0);
      if (Math.abs(df) > 1e-10) {
        const c_newton = c - f_c / df;
        c = Math.max(d_prime + 1, Math.min(d, c_newton));
      }
    } else {
      // 單筋斷面：c = As×fy / (0.85×fc×β1×b)
      c = (As_tension * fy) / (0.85 * fc * beta1 * b);
    }

    // 收斂檢查
    if (Math.abs(c - c_old) / Math.max(c, 1) < tol) break;
  }

  // ── 計算最終 φMn ──
  const a_final = beta1 * c;
  const eps_t_final = epsilon_cu * (d - c) / c;
  if (eps_t_final >= 0.005) {
    phi = 0.9;
    isTensionControlled = true;
  } else if (eps_t_final <= epsilon_y) {
    phi = 0.65;
    isTensionControlled = false;
  } else {
    phi = 0.65 + 0.25 * (eps_t_final - epsilon_y) / (0.005 - epsilon_y);
    isTensionControlled = false;
  }

  const Mn_t = As_tension * fy * (d - a_final / 2); // N·mm
  let Mn_c = 0;
  if (As_compression > 0) {
    const eps_prime = epsilon_cu * (c - d_prime) / c;
    const fs_prime = Math.min(eps_prime * Es, fy);
    Mn_c = As_compression * fs_prime * (d - d_prime);
  }
  phiMn = phi * (Mn_t + Mn_c) / 1e6; // kN·m

  // ── 剪力配筋 ──
  const shearResult = calcRCBeamShear(Vu, b, d, fc, fy);

  // ── 配筋描述 ──
  const bars_tension = describeBars(As_tension);
  const bars_compression = describeBars(As_compression);

  const rho = As_tension / (b * d);

  // 安全檢查
  const isSafe = phiMn >= Mu && shearResult.phiVn >= Vu;

  return {
    As_tension: Math.round(As_tension),
    As_compression: Math.round(As_compression),
    As_shear: Math.round(shearResult.Av),
    bars_tension,
    bars_compression,
    stirrup: shearResult.stirrup_type,
    spacing: Math.round(shearResult.s),
    rho: Math.round(rho * 1000000) / 1000000,
    rho_max: Math.round(rho_max * 1000000) / 1000000,
    rho_min: Math.round(rho_min * 1000000) / 1000000,
    phiMn: Math.round(phiMn * 100) / 100,
    phiVn: Math.round(shearResult.phiVn * 100) / 100,
    isSafe,
    isTensionControlled,
  };
}

// ═══════════════════════════════════════════
//  T04-2：RC 梁剪力配筋（ACI 318-19 §22.5）
// ═══════════════════════════════════════════

/**
 * RC 梁剪力配筋計算（ACI 318-19 §22.5）
 *
 * Vc = 0.17·√fc·b·d   (ACI 318-19 Eq. 22.5.5.1)
 * Av/s = max((Vu-φVc)/(φ·fy·d), 0.062·√fc·b/fy)
 *
 * @param Vu - 需求剪力強度 (kN)
 * @param b  - 斷面寬度 (mm)
 * @param d  - 有效深度 (mm)
 * @param fc - 混凝土抗壓強度 (MPa)
 * @param fy - 鋼筋降伏強度 (MPa)
 * @returns { Av, s, phiVn, stirrup_type }
 */
export function calcRCBeamShear(
  Vu: number,
  b: number,
  d: number,
  fc: number,
  fy: number,
): { Av: number; s: number; phiVn: number; stirrup_type: string } {
  const phi_v = 0.75; // 剪力強度折減係數 (ACI 318-19 §21.2.1)

  // 混凝土貢獻 Vc (ACI 318-19 Eq. 22.5.5.1)
  const Vc = 0.17 * Math.sqrt(fc) * b * d / 1000; // kN

  const Vu_N = Vu * 1000; // kN → N

  // 若 Vu ≤ φVc/2，不需配剪力筋
  if (Vu <= phi_v * Vc / 2) {
    return {
      Av: 0,
      s: 0,
      phiVn: Math.round(phi_v * Vc * 100) / 100,
      stirrup_type: '不需剪力筋',
    };
  }

  // 需要剪力筋 (ACI 318-19 §9.6.3)
  // Av/s ≥ (Vu - φVc) / (φ·fy·d)
  // Av/s ≥ 0.062·√fc·b/fy (最小值)
  const Vu_Nmm = Vu * 1000; // kN → N
  const Vc_N = Vc * 1000; // kN → N

  const Av_s_required = Math.max(
    (Vu_Nmm - phi_v * Vc_N) / (phi_v * fy * d),
    (0.062 * Math.sqrt(fc) * b) / fy,
  );

  // 使用 D10 或 D13 作為剪力筋
  const Av_D10 = 2 * 71.3; // 2支 D10 (mm²)
  const Av_D13 = 2 * 127; // 2支 D13 (mm²)
  const Av = Av_D10 >= Av_s_required * 1 ? Av_D10 : Av_D13;

  // 計算間距
  let s = Math.round(Av / Av_s_required);

  // 最大間距限制 (ACI 318-19 §9.7.6.2.2)
  const s_max = Math.min(d / 2, 600);
  s = Math.min(s, s_max);

  // 最小間距 50mm
  s = Math.max(s, 50);

  // 計算 φVn
  const Vs = Av * fy * d / s / 1000; // kN (N → kN)
  const phiVn = phi_v * (Vc + Vs);

  // 決定箍筋類型
  const stirrup_type = Av >= 2 * 127 ? `D13@${s}` : `D10@${s}`;

  return {
    Av: Math.round(Av),
    s,
    phiVn: Math.round(phiVn * 100) / 100,
    stirrup_type,
  };
}

// ═══════════════════════════════════════════
//  T04-3：連續梁計算（三彎矩方程式／Clapeyron）
// ═══════════════════════════════════════════

/**
 * 連續梁內力計算（三彎矩方程式／Clapeyron）
 *
 * 對 n 跨連續梁，建立 n-1 個三彎矩方程式求解各支承彎矩，
 * 再依簡支梁疊加求各跨內力。
 *
 * @param spans - 連續梁跨定義
 * @returns ContinuousBeamResult
 */
export function calcContinuousBeam(spans: ContinuousSpan[]): ContinuousBeamResult {
  const nSpans = spans.length;
  if (nSpans < 2) throw new Error('連續梁至少需 2 跨');
  const nSupports = nSpans + 1;

  // 各跨長度
  const L = spans.map((s) => s.L);

  // ── 計算各跨簡支梁端點旋轉角 (EI×θ) ──
  // thetaL[i] = EI × θ at left support of span i
  // thetaR[i] = EI × θ at right support of span i
  const thetaL: number[] = new Array(nSpans).fill(0);
  const thetaR: number[] = new Array(nSpans).fill(0);

  for (let i = 0; i < nSpans; i++) {
    const span = spans[i];
    const Li = span.L;
    for (const load of span.loads) {
      const loadSign = load.direction === 'up' ? -1 : 1;
      if (load.type === 'point') {
        const a = load.position ?? Li / 2;
        const b = Li - a;
        const P = load.value * loadSign;
        // 集中載重產生的端點旋轉 (EI×θ)
        // θL = -Pab(L+b)/(6L), θR = Pab(L+a)/(6L)
        thetaL[i] += (-P * a * b * (Li + b)) / (6 * Li);
        thetaR[i] += (P * a * b * (Li + a)) / (6 * Li);
      } else if (load.type === 'udl') {
        const start = load.start ?? 0;
        const end = load.end ?? Li;
        const w = load.value * loadSign;
        const len = end - start;
        const c = (start + end) / 2; // 載重中心
        // 部分均佈載重可用疊加處理，此處簡化為全跨均佈
        // 精確解可將部分均佈視為兩端受載
        // 全跨均佈：θL = -wL³/24, θR = wL³/24
        // 部分均佈使用簡化公式
        if (start <= 0 && end >= Li) {
          thetaL[i] += (-w * Li * Li * Li) / 24;
          thetaR[i] += (w * Li * Li * Li) / 24;
        } else {
          // 部分均佈：用集中力近似（在重心位置）
          const totalLoad = w * len;
          const a = c;
          const b = Li - a;
          thetaL[i] += (-totalLoad * a * b * (Li + b)) / (6 * Li);
          thetaR[i] += (totalLoad * a * b * (Li + a)) / (6 * Li);
        }
      } else if (load.type === 'triangular') {
        const start = load.start ?? 0;
        const end = load.end ?? Li;
        const w = load.value * loadSign;
        const len = end - start;
        const c = (start + end) / 2;
        // 三角形載重用等效集中力近似
        const totalLoad = 0.5 * w * len; // 三角形面積
        const a = c;
        const b = Li - a;
        thetaL[i] += (-totalLoad * a * b * (Li + b)) / (6 * Li);
        thetaR[i] += (totalLoad * a * b * (Li + a)) / (6 * Li);
      }
    }
  }

  // ── 建立三彎矩方程式 ──
  // 對 nSpans 跨（nSupports 支承），有 nSpans-1 個內支承
  // 方程式：M_{i-1}×L_i + 2×M_i×(L_i+L_{i+1}) + M_{i+1}×L_{i+1} = -6×(θR_i + θL_{i+1})
  // 其中 i = 1, 2, ..., nSpans-1 (對應內支承編號)

  const nEq = nSpans - 1; // 方程式數
  if (nEq <= 0) {
    // 單跨（不應發生）
    throw new Error('連續梁至少需 2 跨');
  }

  // 建立係數矩陣 A (nEq × nEq)
  const A: number[][] = new Array(nEq).fill(0).map(() => new Array(nEq).fill(0));
  const b: number[] = new Array(nEq).fill(0);

  for (let eq = 0; eq < nEq; eq++) {
    const supportIdx = eq + 1; // 內支承編號 (1 ~ nSpans-1)

    // M_{i-1} × L_i
    if (eq > 0) {
      A[eq][eq - 1] = L[supportIdx - 1]; // L_i
    }

    // 2 × M_i × (L_i + L_{i+1})
    A[eq][eq] = 2 * (L[supportIdx - 1] + L[supportIdx]);

    // M_{i+1} × L_{i+1}
    if (eq < nEq - 1) {
      A[eq][eq + 1] = L[supportIdx];
    }

    // RHS = -6 × (θR_{i-1} + θL_i)
    b[eq] = -6 * (thetaR[supportIdx - 1] + thetaL[supportIdx]);
  }

  // 求解 M₁ ~ M_{nSpans-1}（內支承彎矩）
  const M_interior = solveLinearSystem(A, b);

  // 完整支承彎矩陣 M_support[0..nSupports-1]
  // M_support[0] = 0（端鉸支承）, M_support[nSpans] = 0（端鉸支承）
  const M_support: number[] = new Array(nSupports).fill(0);
  for (let i = 0; i < nEq; i++) {
    M_support[i + 1] = M_interior[i];
  }

  // ── 計算各跨內力 ──
  const spanResults: ContinuousBeamResult['spans'] = [];

  // 包絡線點數
  const nEnvPoints = 100;
  const totalLength = L.reduce((a, b) => a + b, 0);
  const envStep = totalLength / (nEnvPoints - 1);

  // 初始化包絡線
  const envMoment: { x: number; m: number }[] = [];
  const envShear: { x: number; v: number }[] = [];
  let globalX = 0;

  for (let i = 0; i < nSpans; i++) {
    const Li = L[i];
    const loads = spans[i].loads;
    const M_left = M_support[i]; // 左支承彎矩 (kN·m)
    const M_right = M_support[i + 1]; // 右支承彎矩 (kN·m)

    // 計算簡支梁反力
    const simpReactions = calcSimpleReactions(Li, loads);

    // 由支承彎矩產生的反力修正
    // ΔR_left = (M_right - M_left) / Li
    // ΔR_right = (M_left - M_right) / Li
    const deltaR_left = (M_right - M_left) / Li;
    const deltaR_right = (M_left - M_right) / Li;

    const R_left = simpReactions.left + deltaR_left;
    const R_right = simpReactions.right + deltaR_right;

    // 取樣該跨內力
    const nSpanPoints = 30;
    const spanStep = Li / (nSpanPoints - 1);
    const spanMoment: { x: number; m: number }[] = [];
    const spanShear: { x: number; v: number }[] = [];

    let maxM = 0;
    let maxV = 0;

    for (let j = 0; j < nSpanPoints; j++) {
      const x_local = j * spanStep; // 該跨內位置 (m)
      const x_global = globalX + x_local;

      // 簡支梁內力（支承彎矩 = 0）
      const V_simple = calcSimpleShearAt(x_local, Li, loads, simpReactions);
      const M_simple = calcSimpleMomentAt(x_local, Li, loads, simpReactions);

      // 疊加支承彎矩貢獻
      // V(x) = V_simple - (M_left - M_right)/Li
      // M(x) = M_simple + M_left × (1 - x/Li) + M_right × x/Li
      const V = V_simple + deltaR_left; // R_left already includes delta
      const M = M_simple + M_left * (1 - x_local / Li) + M_right * (x_local / Li);

      spanMoment.push({ x: round(x_local, 3), m: round(M, 2) });
      spanShear.push({ x: round(x_local, 3), v: round(V, 2) });

      maxM = Math.max(maxM, Math.abs(M));
      maxV = Math.max(maxV, Math.abs(V));
    }

    spanResults.push({
      index: i,
      L: Li,
      reactions: {
        left: round(R_left, 2),
        right: round(R_right, 2),
      },
      maxMoment: round(maxM, 2),
      maxShear: round(maxV, 2),
      momentPoints: spanMoment,
      shearPoints: spanShear,
    });

    globalX += Li;
  }

  // ── 建構包絡線 ──
  // 取所有跨的結果，以全域座標統整
  for (let p = 0; p < nEnvPoints; p++) {
    const x_env = p * envStep;
    let found = false;
    let cumLen = 0;
    for (let i = 0; i < nSpans; i++) {
      const Li = L[i];
      if (x_env >= cumLen && x_env <= cumLen + Li) {
        const x_local = x_env - cumLen;
        const spanData = spanResults[i];
        // 從取樣點中找最接近的
        const mp = spanData.momentPoints;
        const sp = spanData.shearPoints;
        // 線性插值
        const idx = Math.min(
          Math.floor((x_local / Li) * (mp.length - 1)),
          mp.length - 2,
        );
        const t = ((x_local / Li) * (mp.length - 1)) - idx;
        const m_val = mp[idx].m + t * (mp[Math.min(idx + 1, mp.length - 1)].m - mp[idx].m);
        const v_val = sp[idx].v + t * (sp[Math.min(idx + 1, sp.length - 1)].v - sp[idx].v);
        envMoment.push({ x: round(x_env, 3), m: round(m_val, 2) });
        envShear.push({ x: round(x_env, 3), v: round(v_val, 2) });
        found = true;
        break;
      }
      cumLen += Li;
    }
    if (!found) {
      envMoment.push({ x: round(x_env, 3), m: 0 });
      envShear.push({ x: round(x_env, 3), v: 0 });
    }
  }

  return {
    spans: spanResults,
    envelope: {
      moment: envMoment,
      shear: envShear,
    },
  };
}

// ═══════════════════════════════════════════
//  輔助：簡支梁內力計算（用於連續梁疊加）
// ═══════════════════════════════════════════

/** 計算簡支梁反力 */
function calcSimpleReactions(L: number, loads: BeamLoad[]): { left: number; right: number } {
  let totalLoad = 0;
  let momentSum = 0;
  for (const load of loads) {
    const sign = load.direction === 'up' ? -1 : 1;
    if (load.type === 'point') {
      const pos = load.position ?? L / 2;
      const P = load.value * sign;
      totalLoad += P;
      momentSum += P * (L - pos);
    } else if (load.type === 'udl') {
      const start = load.start ?? 0;
      const end = load.end ?? L;
      const w = load.value * sign;
      const len = end - start;
      const centroid = (start + end) / 2;
      totalLoad += w * len;
      momentSum += w * len * (L - centroid);
    } else if (load.type === 'triangular') {
      const start = load.start ?? 0;
      const end = load.end ?? L;
      const w = load.value * sign;
      const len = end - start;
      const totalW = 0.5 * w * len; // 三角形面積 = 等效集中載重
      const centroid = start + len * (2 / 3); // 三角形重心（從左起）
      // 若起點在0，最大值在 end
      totalLoad += totalW;
      momentSum += totalW * (L - centroid);
    }
  }
  const R_left = momentSum / L;
  const R_right = totalLoad - R_left;
  return { left: R_left, right: R_right };
}

/** 計算簡支梁在 x 處的剪力 */
function calcSimpleShearAt(
  x: number,
  L: number,
  loads: BeamLoad[],
  reactions: { left: number; right: number },
): number {
  let V = reactions.left;
  for (const load of loads) {
    const sign = load.direction === 'up' ? -1 : 1;
    if (load.type === 'point') {
      const pos = load.position ?? L / 2;
      if (x >= pos) V -= load.value * sign;
    } else if (load.type === 'udl') {
      const start = load.start ?? 0;
      const end = load.end ?? L;
      const w = load.value * sign;
      if (x > start && x <= end) {
        V -= w * (x - start);
      } else if (x > end) {
        V -= w * (end - start);
      }
    } else if (load.type === 'triangular') {
      const start = load.start ?? 0;
      const end = load.end ?? L;
      const w = load.value * sign;
      if (x > start && x <= end) {
        const len = end - start;
        const ratio = (x - start) / len;
        // 三角形載重在 x 處的累積剪力 = 從 start 到 x 的三角形面積
        V -= 0.5 * w * ratio * (x - start);
      } else if (x > end) {
        const len = end - start;
        V -= 0.5 * w * len; // 完整三角形面積
      }
    }
  }
  return V;
}

/** 計算簡支梁在 x 處的彎矩 */
function calcSimpleMomentAt(
  x: number,
  L: number,
  loads: BeamLoad[],
  reactions: { left: number; right: number },
): number {
  let M = reactions.left * x;
  for (const load of loads) {
    const sign = load.direction === 'up' ? -1 : 1;
    if (load.type === 'point') {
      const pos = load.position ?? L / 2;
      if (x >= pos) M -= load.value * sign * (x - pos);
    } else if (load.type === 'udl') {
      const start = load.start ?? 0;
      const end = load.end ?? L;
      const w = load.value * sign;
      if (x > start) {
        const effEnd = Math.min(x, end);
        const len = effEnd - start;
        M -= w * len * (x - start - len / 2);
      }
    } else if (load.type === 'triangular') {
      const start = load.start ?? 0;
      const end = load.end ?? L;
      const w = load.value * sign;
      if (x > start) {
        const effEnd = Math.min(x, end);
        const len = effEnd - start;
        const x_local = x - start;
        // 三角形載重：在 x 處的彎矩貢獻
        // 從 start 到 effEnd 的三角形載重面積 × 力臂
        const totalW = 0.5 * w * len;
        const centroid = start + len * (2 / 3);
        const arm = x - centroid;
        M -= totalW * arm;
      }
    }
  }
  return M;
}

// ═══════════════════════════════════════
//  反力計算（原有功能擴充三角形載重）
// ═══════════════════════════════════════

function calcReactions(
  L: number,
  support: SupportType,
  loads: BeamLoad[],
): { left: number; right: number } {
  let R_left = 0;
  let R_right = 0;

  if (support === 'cantilever') {
    // 懸臂梁：所有反力在固定端（左端）
    for (const load of loads) {
      if (load.type === 'point') {
        const pos = load.position ?? 0;
        R_left += load.value;
        R_right += load.value * pos;
      } else if (load.type === 'udl') {
        const start = load.start ?? 0;
        const end = load.end ?? L;
        const w = load.value;
        const len = end - start;
        const centroid = (start + end) / 2;
        R_left += w * len;
        R_right += w * len * centroid;
      } else if (load.type === 'triangular') {
        const start = load.start ?? 0;
        const end = load.end ?? L;
        const w = load.value;
        const sign = load.direction === 'up' ? -1 : 1;
        const len = end - start;
        const totalW = 0.5 * w * len * sign; // 三角形面積
        const centroid = start + len * (2 / 3); // 重心（從左端算起）
        R_left += totalW;
        R_right += totalW * centroid;
      }
    }
    return { left: round(R_left), right: round(R_right) };
  }

  if (support === 'simply' || support === 'fixed') {
    let totalLoad = 0;
    let momentSum = 0;

    for (const load of loads) {
      const sign = load.direction === 'up' ? -1 : 1;
      if (load.type === 'point') {
        const pos = load.position ?? L / 2;
        const P = load.value * sign;
        totalLoad += P;
        momentSum += P * (L - pos);
      } else if (load.type === 'udl') {
        const start = load.start ?? 0;
        const end = load.end ?? L;
        const w = load.value * sign;
        const len = end - start;
        const centroid = (start + end) / 2;
        totalLoad += w * len;
        momentSum += w * len * (L - centroid);
      } else if (load.type === 'triangular') {
        const start = load.start ?? 0;
        const end = load.end ?? L;
        const w = load.value * sign;
        const len = end - start;
        const totalW = 0.5 * w * len;
        const centroid = start + len * (2 / 3);
        totalLoad += totalW;
        momentSum += totalW * (L - centroid);
      }
    }

    R_left = momentSum / L;
    R_right = totalLoad - R_left;
    return { left: round(R_left), right: round(R_right) };
  }

  return { left: 0, right: 0 };
}

// ═══════════════════════════════════════
//  任意位置 x 的剪力計算（擴充三角形載重）
// ═══════════════════════════════════════

function calcShearAt(
  x: number,
  L: number,
  support: SupportType,
  loads: BeamLoad[],
  reactions: { left: number; right: number },
): number {
  let V = 0;

  if (support === 'cantilever') {
    for (const load of loads) {
      const sign = load.direction === 'up' ? -1 : 1;
      if (load.type === 'point') {
        const pos = load.position ?? 0;
        if (x < pos) V += load.value * sign;
      } else if (load.type === 'udl') {
        const start = load.start ?? 0;
        const end = load.end ?? L;
        const w = load.value * sign;
        if (x >= start && x < end) {
          V += w * (x - start);
        } else if (x >= end) {
          V += w * (end - start);
        }
      } else if (load.type === 'triangular') {
        const start = load.start ?? 0;
        const end = load.end ?? L;
        const w = load.value * sign;
        if (x >= start && x < end) {
          const len = end - start;
          const ratio = (x - start) / len;
          V += 0.5 * w * ratio * (x - start);
        } else if (x >= end) {
          const len = end - start;
          V += 0.5 * w * len;
        }
      }
    }
    return V;
  }

  // 簡支 / 固定
  V = reactions.left;

  for (const load of loads) {
    const sign = load.direction === 'up' ? -1 : 1;
    if (load.type === 'point') {
      const pos = load.position ?? L / 2;
      if (x >= pos) {
        V -= load.value * sign;
      }
    } else if (load.type === 'udl') {
      const start = load.start ?? 0;
      const end = load.end ?? L;
      const w = load.value * sign;
      if (x > start && x <= end) {
        V -= w * (x - start);
      } else if (x > end) {
        V -= w * (end - start);
      }
    } else if (load.type === 'triangular') {
      const start = load.start ?? 0;
      const end = load.end ?? L;
      const w = load.value * sign;
      if (x > start && x <= end) {
        const len = end - start;
        const ratio = (x - start) / len;
        V -= 0.5 * w * ratio * (x - start);
      } else if (x > end) {
        const len = end - start;
        V -= 0.5 * w * len;
      }
    }
  }

  return V;
}

// ═══════════════════════════════════════
//  任意位置 x 的彎矩計算（擴充三角形載重）
// ═══════════════════════════════════════

function calcMomentAt(
  x: number,
  L: number,
  support: SupportType,
  loads: BeamLoad[],
  reactions: { left: number; right: number },
): number {
  let M = 0;

  if (support === 'cantilever') {
    for (const load of loads) {
      const sign = load.direction === 'up' ? -1 : 1;
      if (load.type === 'point') {
        const pos = load.position ?? 0;
        if (x < pos) {
          M -= load.value * sign * (pos - x);
        }
      } else if (load.type === 'udl') {
        const start = load.start ?? 0;
        const end = load.end ?? L;
        const w = load.value * sign;
        if (x < start) {
          const effEnd = Math.min(x, end);
          const len = effEnd - start;
          M -= w * len * (start - x + len / 2);
        }
      } else if (load.type === 'triangular') {
        const start = load.start ?? 0;
        const end = load.end ?? L;
        const w = load.value * sign;
        if (x < start) {
          const effEnd = Math.min(x, end);
          const len = effEnd - start;
          const totalW = 0.5 * w * len;
          const centroid = start + len * (2 / 3);
          const arm = x - centroid;
          M -= totalW * (centroid - x);
        }
      }
    }
    return M;
  }

  // 簡支 / 固定
  M = reactions.left * x;

  for (const load of loads) {
    const sign = load.direction === 'up' ? -1 : 1;
    if (load.type === 'point') {
      const pos = load.position ?? L / 2;
      if (x >= pos) {
        M -= load.value * sign * (x - pos);
      }
    } else if (load.type === 'udl') {
      const start = load.start ?? 0;
      const end = load.end ?? L;
      const w = load.value * sign;
      if (x > start) {
        const effEnd = Math.min(x, end);
        const len = effEnd - start;
        M -= w * len * (x - start - len / 2);
      }
    } else if (load.type === 'triangular') {
      const start = load.start ?? 0;
      const end = load.end ?? L;
      const w = load.value * sign;
      if (x > start) {
        const effEnd = Math.min(x, end);
        const len = effEnd - start;
        const totalW = 0.5 * w * len;
        const centroid = start + len * (2 / 3);
        const arm = x - centroid;
        M -= totalW * arm;
      }
    }
  }

  return M;
}

// ═══════════════════════════════════════
//  任意位置 x 的撓度計算（近似疊加法）
// ═══════════════════════════════════════

function calcDeflectionAt(
  x: number,
  L: number,
  support: SupportType,
  loads: BeamLoad[],
  reactions: { left: number; right: number },
): number {
  const sinFactor = Math.sin((Math.PI * x) / L);

  if (support === 'simply') {
    let totalDelta = 0;
    for (const load of loads) {
      const sign = load.direction === 'up' ? -1 : 1;
      if (load.type === 'point') {
        const a = load.position ?? L / 2;
        const b = L - a;
        const P = load.value * sign;
        if (a > 0 && a < L) {
          const deltaMax = (P * 1000 * a * a * b * b) / (3 * L);
          totalDelta += deltaMax * sinFactor;
        }
      } else if (load.type === 'udl') {
        const start = load.start ?? 0;
        const end = load.end ?? L;
        const w = load.value * sign;
        const len = end - start;
        if (start <= 0 && end >= L) {
          const deltaMax = (5 * w * 1000 * L * L * L * L) / (384);
          totalDelta += deltaMax * sinFactor;
        } else {
          const deltaMax = (w * 1000 * len * L * L * L) / (24);
          totalDelta += deltaMax * sinFactor;
        }
      } else if (load.type === 'triangular') {
        const start = load.start ?? 0;
        const end = load.end ?? L;
        const w = load.value * sign;
        const len = end - start;
        const totalW = 0.5 * w * len;
        const deltaMax = (totalW * 1000 * L * L * L) / (48);
        totalDelta += deltaMax * sinFactor;
      }
    }
    const I_assumed = 2.04e8;
    const EI = E * I_assumed;
    return (totalDelta * 1e9) / EI;
  }

  if (support === 'cantilever') {
    const cantFactor = (x * x * (3 * L - x)) / (2 * L * L * L);
    let totalDelta = 0;
    for (const load of loads) {
      const sign = load.direction === 'up' ? -1 : 1;
      if (load.type === 'point') {
        const a = load.position ?? 0;
        const P = load.value * sign;
        if (x >= a) {
          const deltaMax = (P * 1000 * L * L * L) / (3);
          totalDelta += deltaMax * cantFactor;
        }
      } else if (load.type === 'udl') {
        const start = load.start ?? 0;
        const end = load.end ?? L;
        const w = load.value * sign;
        const len = end - start;
        if (x > start) {
          const deltaMax = (w * 1000 * len * L * L * L) / (8);
          totalDelta += deltaMax * cantFactor;
        }
      } else if (load.type === 'triangular') {
        const start = load.start ?? 0;
        const end = load.end ?? L;
        const w = load.value * sign;
        const len = end - start;
        if (x > start) {
          const deltaMax = (0.5 * w * 1000 * len * L * L * L) / (8);
          totalDelta += deltaMax * cantFactor;
        }
      }
    }
    const I_assumed = 2.04e8;
    const EI = E * I_assumed;
    return (totalDelta * 1e9) / EI;
  }

  if (support === 'fixed') {
    const fixFactor = (x * x * (L - x) * (L - x)) / (L * L * L * L / 16);
    let totalDelta = 0;
    for (const load of loads) {
      const sign = load.direction === 'up' ? -1 : 1;
      if (load.type === 'point') {
        const a = load.position ?? L / 2;
        const P = load.value * sign;
        const deltaMax = (P * 1000 * L * L * L) / (192);
        totalDelta += deltaMax * fixFactor;
      } else if (load.type === 'udl') {
        const start = load.start ?? 0;
        const end = load.end ?? L;
        const w = load.value * sign;
        if (start <= 0 && end >= L) {
          const deltaMax = (w * 1000 * L * L * L * L) / (384);
          totalDelta += deltaMax * fixFactor;
        }
      } else if (load.type === 'triangular') {
        const start = load.start ?? 0;
        const end = load.end ?? L;
        const w = load.value * sign;
        const len = end - start;
        if (start <= 0 && end >= L) {
          const deltaMax = (0.5 * w * 1000 * L * L * L * L) / (384);
          totalDelta += deltaMax * fixFactor;
        }
      }
    }
    const I_assumed = 2.04e8;
    const EI = E * I_assumed;
    return (totalDelta * 1e9) / EI;
  }

  return 0;
}

// ═══════════════════════════════════════════
//  配筋描述輔助
// ═══════════════════════════════════════════

/** 依鋼筋面積產生配筋描述，如 ["2-D25", "2-D22"] */
function describeBars(As: number): string[] {
  if (As <= 0) return [];

  // 常用鋼筋面積對照
  const rebarAreas: { name: string; area: number }[] = [
    { name: 'D36', area: 1006 },
    { name: 'D32', area: 794 },
    { name: 'D29', area: 645 },
    { name: 'D25', area: 507 },
    { name: 'D22', area: 387 },
    { name: 'D19', area: 287 },
    { name: 'D16', area: 199 },
    { name: 'D13', area: 127 },
    { name: 'D10', area: 71.3 },
  ];

  let remaining = As;
  const bars: string[] = [];

  for (const rb of rebarAreas) {
    if (remaining <= 0) break;
    const count = Math.min(Math.floor(remaining / rb.area), 6); // 最多 6 支
    if (count > 0) {
      bars.push(`${count}-${rb.name}`);
      remaining -= count * rb.area;
    }
  }

  // 若仍有剩餘，用最小鋼筋補足
  if (remaining > 10) {
    const smallest = rebarAreas[rebarAreas.length - 1];
    const count = Math.ceil(remaining / smallest.area);
    bars.push(`${count}-${smallest.name}`);
  }

  return bars;
}

// ═══════════════════════════════════════════
//  線性方程組求解（高斯消去法，列主元）
// ═══════════════════════════════════════════

function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = A.length;

  // 增廣矩陣
  const aug: number[][] = A.map((row, i) => [...row, b[i]]);

  // 前向消去
  for (let col = 0; col < n; col++) {
    // 尋找列主元
    let maxRow = col;
    let maxVal = Math.abs(aug[col][col]);
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > maxVal) {
        maxVal = Math.abs(aug[row][col]);
        maxRow = row;
      }
    }

    if (maxVal < 1e-12) continue; // 奇異矩陣，跳過

    // 交換列
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    // 消去下方列
    for (let row = col + 1; row < n; row++) {
      const factor = aug[row][col] / aug[col][col];
      for (let j = col; j <= n; j++) {
        aug[row][j] -= factor * aug[col][j];
      }
    }
  }

  // 回代
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = aug[i][n];
    for (let j = i + 1; j < n; j++) {
      sum -= aug[i][j] * x[j];
    }
    x[i] = Math.abs(aug[i][i]) > 1e-12 ? sum / aug[i][i] : 0;
  }

  return x;
}

// ═══════════════════════════════════════
//  工具函數
// ═══════════════════════════════════════

function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
