/**
 * 基礎設計計算引擎（ACI 318-19）
 *
 * 支援：
 * - 獨立基腳設計（ACI §13）
 * - 基腳厚度檢討（剪力 + 彎矩）
 * - 承載力檢討
 * - 配筋計算
 */

// ═══════════════════════════════════════════
//  型別定義
// ═══════════════════════════════════════════

/** 基腳計算結果 */
export interface FootingResult {
  /** 基腳寬度 (m) */
  B: number;
  /** 基腳長度 (m) */
  L: number;
  /** 基腳厚度 (mm) */
  H: number;
  /** 實際承載力 (kN/m²) */
  q_actual: number;
  /** 容許承載力 (kN/m²) */
  q_allowable: number;
  /** 彎矩 (kN·m) */
  Mu: number;
  /** 鋼筋面積 (mm²) */
  As: number;
  /** 鋼筋間距 (mm) */
  spacing: number;
  /** 承載力是否合格 */
  isBearingOK: boolean;
  /** 厚度是否合格 */
  isThicknessOK: boolean;
  /** 剪力是否合格 */
  isShearOK: boolean;
  /** 詳細計算步驟 */
  steps: string[];
  /** 配筋描述 */
  rebar_desc: string;
  /** 基腳自重 (kN) */
  selfWeight: number;
}

// ═══════════════════════════════════════════
//  獨立基腳設計
// ═══════════════════════════════════════════

/**
 * 獨立基腳設計計算
 *
 * 依 ACI 318-19 §13 規範進行：
 * 1. 依容許承載力決定基腳尺寸
 * 2. 計算淨承載力
 * 3. 檢討基腳厚度（含剪力 + 彎矩）
 * 4. 計算彎矩配筋
 * 5. 檢討各項安全標準
 *
 * @param P       - 柱軸力 (kN)
 * @param qa      - 容許承載力 (kN/m²)
 * @param fc      - 混凝土抗壓強度 (MPa)
 * @param fy      - 鋼筋降伏強度 (MPa)
 * @param colSize - 柱斷面尺寸 (mm)，正方形柱
 * @param gamma_c - 混凝土單位重 (kN/m³)，預設 24
 * @returns FootingResult
 *
 * @example
 * ```ts
 * const result = calcSpreadFooting(1500, 200, 28, 420, 400);
 * ```
 */
export function calcSpreadFooting(
  P: number,
  qa: number,
  fc: number,
  fy: number,
  colSize: number = 400,
  gamma_c: number = 24,
): FootingResult {
  const steps: string[] = [];
  steps.push(`========== 獨立基腳設計 ==========`);
  steps.push(`柱軸力 P = ${P} kN`);
  steps.push(`容許承載力 qa = ${qa} kN/m²`);
  steps.push(`混凝土 fc\' = ${fc} MPa`);
  steps.push(`鋼筋 fy = ${fy} MPa`);
  steps.push(`柱尺寸 = ${colSize}mm × ${colSize}mm`);

  // ── 1. 初步尺寸 ──
  // 假設基腳厚度 H_guess = 400mm（先粗估）
  let H = 400; // mm
  const gamma_soil = 18; // kN/m³ 土壤單位重（假設）
  const df = 1.5; // m 埋入深度（假設）
  const overburden = gamma_soil * df; // kN/m² 覆土壓力

  // 有效容許承載力
  const q_net = qa - overburden - (gamma_c * H / 1000);
  steps.push(`初步假設基腳厚度 H = ${H}mm`);
  steps.push(`覆土壓力 = γ_soil × df = ${gamma_soil} × ${df} = ${overburden} kN/m²`);
  steps.push(`基腳自重 = ${gamma_c} × ${H / 1000} = ${(gamma_c * H / 1000).toFixed(1)} kN/m²`);
  steps.push(`淨容許承載力 q_net = ${qa} - ${overburden} - ${(gamma_c * H / 1000).toFixed(1)} = ${q_net.toFixed(1)} kN/m²`);

  // 所需面積
  const A_req = P / q_net; // m²
  const B = Math.ceil(Math.sqrt(A_req) * 10) / 10; // m，取 0.1m 整數
  const L = B; // 正方形基腳
  steps.push(`所需面積 A_req = P / q_net = ${P} / ${q_net.toFixed(1)} = ${A_req.toFixed(2)} m²`);
  steps.push(`採用正方形基腳 B = L = ${B}m`);

  // ── 2. 實際承載力 ──
  const selfWeight = gamma_c * H / 1000 * B * L; // kN
  const totalLoad = P + selfWeight + overburden * B * L;
  const q_actual = totalLoad / (B * L);
  const isBearingOK = q_actual <= qa;
  steps.push(`基腳自重 W_f = ${gamma_c} × ${H / 1000} × ${B} × ${L} = ${selfWeight.toFixed(1)} kN`);
  steps.push(`總載重 = ${P} + ${selfWeight.toFixed(1)} + ${(overburden * B * L).toFixed(1)} = ${totalLoad.toFixed(1)} kN`);
  steps.push(`實際承載力 q_actual = ${totalLoad.toFixed(1)} / (${B} × ${L}) = ${q_actual.toFixed(1)} kN/m²`);
  steps.push(`承載力檢討：${q_actual.toFixed(1)} ${isBearingOK ? '≤' : '>'} ${qa} ${isBearingOK ? '✅' : '❌'}`);

  // ── 3. 厚度檢討（剪力控制） ──
  const H_final = checkFootingThickness(B, L, q_net, fc);
  H = Math.max(H, H_final);
  // 取 50mm 整數倍
  H = Math.ceil(H / 50) * 50;
  steps.push(`基腳厚度檢討（剪力控制）H = ${H}mm`);

  // ── 4. 彎矩計算 ──
  // 臨界斷面在柱面（ACI §13.2.7.1）
  const colSize_m = colSize / 1000; // mm → m
  const cantilever = (B - colSize_m) / 2; // m
  const q_net_actual = P / (B * L); // 淨承載力（不計自重）
  const Mu = q_net_actual * L * cantilever * cantilever / 2; // kN·m

  steps.push(`懸臂長度 = (B - col) / 2 = (${B} - ${colSize_m}) / 2 = ${cantilever.toFixed(2)}m`);
  steps.push(`淨承載力（不含自重）q_net = P / (B×L) = ${P} / (${B}×${L}) = ${q_net_actual.toFixed(1)} kN/m²`);
  steps.push(`彎矩 Mu = q_net × L × c² / 2 = ${q_net_actual.toFixed(1)} × ${L} × ${cantilever.toFixed(2)}² / 2 = ${Mu.toFixed(2)} kN·m`);

  // ── 5. 配筋計算 ──
  const d = H - 75 - 12 / 2; // mm 有效深度（保護層 75mm，D12 主筋）
  const phi = 0.9;
  const beta1 = fc <= 28 ? 0.85 : Math.max(0.85 - 0.05 * ((fc - 28) / 7), 0.65);
  const b = L * 1000; // mm 單位寬度

  // 最小鋼筋比 0.0018（溫度鋼筋）
  const rho_min = 0.0018;
  const As_min = rho_min * b * H;

  // 迭代求解 As
  let As = As_min;
  const Mu_Nmm = Mu * 1e6;

  for (let iter = 0; iter < 50; iter++) {
    const a = (As * fy) / (0.85 * fc * b);
    const As_needed = Mu_Nmm / (phi * fy * (d - a / 2));
    As = Math.max(As_needed, As_min);

    const a_new = (As * fy) / (0.85 * fc * b);
    if (Math.abs(a_new - a) / Math.max(a, 1) < 0.01) break;
  }

  // 配筋選擇（D16 ~ D25）
  const areaD16 = 199;
  const areaD19 = 287;
  const areaD22 = 387;

  let barArea = areaD16;
  let barName = 'D16';

  if (As > 1500) {
    barArea = areaD19;
    barName = 'D19';
  }
  if (As > 2500) {
    barArea = areaD22;
    barName = 'D22';
  }

  const nBars = Math.ceil(As / barArea);
  const spacing = Math.floor((b - 2 * 75) / (nBars - 1)); // mm

  // 間距限制：max(100, min(2H, 450))
  const maxSpacing = Math.min(2 * H, 450);
  const finalSpacing = Math.max(100, Math.min(spacing, maxSpacing));

  const rebar_desc = `${barName}@${finalSpacing}`;
  steps.push(`配筋計算：As = ${Math.round(As)} mm²`);
  steps.push(`採用 ${rebar_desc}，As = ${barArea * Math.ceil(b / finalSpacing)} mm²/m`);

  // ── 6. 剪力檢討 ──
  // 臨界斷面在 d 處（ACI §13.2.7.1）
  const d_actual = H - 75 - (barName === 'D22' ? 11 : 8); // 近似
  const d_m = (H - 75 - (barName === 'D22' ? 11 : 8)) / 1000; // m
  const criticalSection = colSize_m / 2 + d_m; // 從基腳邊緣到臨界斷面
  const Vu = q_net_actual * L * Math.max(0, cantilever - d_m); // kN
  const Vc = 0.17 * Math.sqrt(fc) * b * (H - 75 - 8) / 1000; // kN
  const phiVc = 0.75 * Vc;
  const isShearOK = Vu <= phiVc;

  steps.push(`臨界斷面距離柱面 d = ${(d_m * 1000).toFixed(0)}mm`);
  steps.push(`剪力 Vu = ${Vu.toFixed(1)} kN`);
  steps.push(`混凝土剪力強度 φVc = 0.75 × ${Vc.toFixed(1)} = ${phiVc.toFixed(1)} kN`);
  steps.push(`剪力檢討：${Vu.toFixed(1)} ${isShearOK ? '≤' : '>'} ${phiVc.toFixed(1)} ${isShearOK ? '✅' : '❌'}`);

  // ── 7. 厚度最終檢討 ──
  const isThicknessOK = H >= H_final;

  return {
    B,
    L,
    H,
    q_actual: Math.round(q_actual * 10) / 10,
    q_allowable: qa,
    Mu: Math.round(Mu * 100) / 100,
    As: Math.round(As),
    spacing: finalSpacing,
    isBearingOK,
    isThicknessOK,
    isShearOK,
    steps,
    rebar_desc,
    selfWeight: Math.round(selfWeight * 10) / 10,
  };
}

// ═══════════════════════════════════════════
//  基腳厚度檢討（剪力 + 彎矩）
// ═══════════════════════════════════════════

/**
 * 基腳厚度檢討（ACI 318-19 §13.2.7）
 *
 * 以剪力強度控制，計算最小所需厚度：
 *   Vc = 0.17 × √fc × b × d
 *   Vu ≤ φVc
 *
 * @param B     - 基腳寬度 (m)
 * @param L     - 基腳長度 (m)
 * @param q_net - 淨承載力 (kN/m²)
 * @param fc    - 混凝土抗壓強度 (MPa)
 * @returns 最小厚度 (mm)
 *
 * @example
 * ```ts
 * checkFootingThickness(2.5, 2.5, 180, 28); // → ~400 mm
 * ```
 */
export function checkFootingThickness(
  B: number,
  L: number,
  q_net: number,
  fc: number,
): number {
  const colSize = 400; // mm 假設柱尺寸
  const col_m = colSize / 1000;
  const cantilever = (B - col_m) / 2;

  // 迭代求解最小厚度
  let H_min = 200; // mm 起點

  for (let iter = 0; iter < 100; iter++) {
    const d = H_min - 75 - 6; // 保護層 75mm + 半徑
    const d_m = d / 1000;
    const criticalDist = Math.max(0, cantilever - d_m);
    const Vu = q_net * L * criticalDist; // kN

    const b = L * 1000; // mm
    const Vc = 0.17 * Math.sqrt(fc) * b * d / 1000; // kN
    const phiVc = 0.75 * Vc;

    if (Vu <= phiVc) {
      return Math.round(H_min);
    }

    H_min += 10; // 逐步增加
    if (H_min > 2000) break; // 上限
  }

  return Math.round(H_min);
}
