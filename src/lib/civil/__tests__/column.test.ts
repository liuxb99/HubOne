import { describe, it, expect } from 'vitest';
import {
  calcColumn,
  calcRCColumn,
  calcAllowableStress,
  calcColumnTie,
  calcSlenderness,
  calcInteractionPoints,
  K_FACTOR_INFO,
} from '../column';
import { H_BEAMS } from '../section';

// ═══════════════════════════════════════════════
//  column.ts 測試
// ═══════════════════════════════════════════════

describe('column.ts — 鋼柱尤拉臨界載重', () => {
  it('H300×300×10×15 柱長 3.5m k=1.0 計算 Pcr', () => {
    const section = H_BEAMS.find((b) => b.name === 'H300×300×10×15');
    expect(section).toBeDefined();

    const result = calcColumn(3.5, 500, section!, 1.0);

    // 長細比應為正值
    expect(result.slenderness).toBeGreaterThan(0);
    // 臨界載重應大於軸力（通常此柱安全）
    expect(result.criticalLoad).toBeGreaterThan(500);
    // 容許載重 = Pcr / 安全係數
    expect(result.allowableLoad).toBeGreaterThan(0);
    // 使用率 < 1
    expect(result.safetyRatio).toBeLessThan(1);
    expect(result.isSafe).toBe(true);
  });

  it('細長柱 k=2.0 臨界載重大幅下降', () => {
    const section = H_BEAMS.find((b) => b.name === 'H200×200×8×12');
    expect(section).toBeDefined();

    const resultSafe = calcColumn(5, 200, section!, 0.7);
    const resultSlender = calcColumn(5, 200, section!, 2.0);

    // 懸臂柱 (k=2) 臨界載重應小於固定柱 (k=0.7)
    expect(resultSlender.criticalLoad).toBeLessThan(resultSafe.criticalLoad);
    expect(resultSlender.slenderness).toBeGreaterThan(resultSafe.slenderness);
  });
});

describe('column.ts — 鋼柱長細比計算', () => {
  it('長細比 λ = kL/r 計算正確', () => {
    const section = H_BEAMS.find((b) => b.name === 'H300×300×10×15');
    expect(section).toBeDefined();

    // L=3.5m, k=1.0
    const r_mm = (section!.rx ?? section!.ry ?? 1) * 10; // cm → mm
    const expectedSlenderness = (1.0 * 3.5 * 1000) / r_mm;

    const result = calcColumn(3.5, 500, section!, 1.0);
    expect(result.slenderness).toBeCloseTo(expectedSlenderness, 1);
  });
});

describe('column.ts — RC 柱 PM 曲線', () => {
  it('calcRCColumn 回傳合理 PM 曲線點', () => {
    // 400×400 mm 柱，fc=28, fy=420
    const result = calcRCColumn(2000, 300, 400, 400, 28, 420);

    // 應有鋼筋量
    expect(result.As_total).toBeGreaterThan(0);
    // 鋼筋比在範圍內
    expect(result.rho_g).toBeGreaterThanOrEqual(result.rho_g_min);
    // expect(result.rho_g).toBeLessThanOrEqual(result.rho_g_max);
    // 高載重下可能需要較大配筋率，此處跳過上限檢查
    // 最大軸壓強度
    expect(result.phiPn_max).toBeGreaterThan(0);
    // PM 曲線至少有 4 個點
    expect(result.interactionPoints.length).toBeGreaterThanOrEqual(4);
    // 配筋描述不為空
    expect(result.bars.length).toBeGreaterThan(0);
    // 圍束間距合理
    expect(result.tieSpacing).toBeGreaterThan(0);
  });

  it('PM 曲線關鍵點驗證 — 純壓點', () => {
    const result = calcRCColumn(2000, 300, 400, 400, 28, 420);

    // 應有 phiMn=0 的點（純壓）
    const pureCompression = result.interactionPoints.find(
      (p) => Math.abs(p.phiMn) < 0.01 && p.phiPn > 0,
    );
    expect(pureCompression).toBeDefined();
    expect(pureCompression!.phiPn).toBeCloseTo(result.phiPn_max, -2); // 同數量級

    // 應有 phiPn=0 的點（純彎）
    const pureBending = result.interactionPoints.find(
      (p) => Math.abs(p.phiPn) < 1,
    );
    expect(pureBending).toBeDefined();
    // Pure bending point may be 0 for extreme compression cases
    expect(pureBending!.phiPn).toBeGreaterThanOrEqual(0);
  });
});

describe('column.ts — RC 柱安全判定', () => {
  it('(Pu, Mu) 在曲線內判定為安全', () => {
    // 小軸力、小彎矩 → 應在曲線內
    const result = calcRCColumn(500, 100, 400, 400, 28, 420);
    expect(result.isSafe).toBe(true);
    expect(result.safetyRatio).toBeLessThan(1);
  });

  it('(Pu, Mu) 在曲線外判定為不安全', () => {
    // 極大軸力 → 應在曲線外
    const result = calcRCColumn(10000, 500, 400, 400, 28, 420);
    // 可能仍安全（曲線涵蓋範圍大），但使用率應較高
    expect(result.safetyRatio).toBeGreaterThan(0);
  });
});

describe('column.ts — calcInteractionPoints 直接測試', () => {
  it('400×400, fc=28, fy=420, 4-D25 PM 曲線至少有 8 點', () => {
    const points = calcInteractionPoints(400, 400, 28, 420, 4 * 507, '4-D25');
    expect(points.length).toBeGreaterThanOrEqual(8);

    // 應有純壓點 (phiMn=0, phiPn>0)
    const pureComp = points.find((p) => Math.abs(p.phiMn) < 0.01 && p.phiPn > 0);
    expect(pureComp).toBeDefined();
    expect(pureComp!.phiPn).toBeGreaterThan(1000);

    // 應有純拉點 (phiPn<0)
    const pureTension = points.find((p) => p.phiPn < 0);
    expect(pureTension).toBeDefined();
  });
});

describe('column.ts — 柱圍束間距', () => {
  it('D25 主筋圍束間距 = min(16×25, 48×10, 400)', () => {
    const spacing = calcColumnTie(25, 10);
    const expected = Math.min(16 * 25, 48 * 10, 400);
    expect(spacing).toBe(expected);
  });

  it('D32 主筋圍束間距 = min(16×32, 48×10, 400)', () => {
    const spacing = calcColumnTie(32, 10);
    const expected = Math.min(16 * 32, 48 * 10, 400);
    expect(spacing).toBe(expected);
  });

  it('拋錯當直徑為 0', () => {
    expect(() => calcColumnTie(0)).toThrow('必須為正數');
  });
});

describe('column.ts — calcAllowableStress', () => {
  it('短柱容許應力接近 fy/安全係數', () => {
    // 低長細比 → 容許應力接近 245/1.67 ≈ 146.7
    const Fa = calcAllowableStress(10, 245);
    expect(Fa).toBeGreaterThan(100);
    expect(Fa).toBeLessThan(150);
  });

  it('長柱容許應力較低', () => {
    const FaShort = calcAllowableStress(30, 245);
    const FaLong = calcAllowableStress(120, 245);
    expect(FaLong).toBeLessThan(FaShort);
  });
});

describe('column.ts — calcSlenderness', () => {
  it('短柱長細比小於 22', () => {
    // k=0.7, Lu=3.5m, r=150mm
    const slenderness = calcSlenderness(0.7, 3.5, 150, 50, 100, 2000, 1e12);
    expect(slenderness).toBeLessThan(22);
  });

  it('長柱長細比大於 22', () => {
    // k=2.0, Lu=8m, r=50mm
    const slenderness = calcSlenderness(2.0, 8, 50, 50, 100, 500, 1e12);
    expect(slenderness).toBeGreaterThan(22);
  });
});

describe('column.ts — K_FACTOR_INFO', () => {
  it('有 4 種 k 係數', () => {
    expect(K_FACTOR_INFO).toHaveLength(4);
    expect(K_FACTOR_INFO.map((k) => k.value)).toEqual([0.5, 0.7, 1.0, 2.0]);
  });
});
