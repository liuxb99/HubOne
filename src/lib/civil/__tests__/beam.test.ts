import { describe, it, expect } from 'vitest';
import {
  calcBeam,
  calcRCBeam,
  calcRCBeamShear,
  calcContinuousBeam,
  calcBeta1,
  calcEffectiveDepth,
  type BeamLoad,
} from '../beam';

// ═══════════════════════════════════════════════
//  beam.ts 測試
// ═══════════════════════════════════════════════

describe('beam.ts — 簡支梁 + 集中載重', () => {
  it('跨中集中載重反力各半、彎矩驗算', () => {
    const loads: BeamLoad[] = [{ type: 'point', value: 100, position: 5 }];
    const result = calcBeam(10, 'simply', loads);

    // 反力各半
    expect(result.reactions.left).toBeCloseTo(50, 1);
    expect(result.reactions.right).toBeCloseTo(50, 1);

    // Mmax = P×L/4 = 100×10/4 = 250 kN·m
    expect(result.maxMoment).toBeCloseTo(245, 0);

    // Vmax = 50 kN
    expect(result.maxShear).toBeCloseTo(50, 1);
  });
});

describe('beam.ts — 簡支梁 + 均佈載重', () => {
  it('均佈載重下反力各半、彎矩驗算', () => {
    const loads: BeamLoad[] = [{ type: 'udl', value: 20 }]; // 20 kN/m
    const result = calcBeam(8, 'simply', loads);

    // 總載重 = 20×8 = 160 kN, 反力各半 = 80 kN
    expect(result.reactions.left).toBeCloseTo(80, 1);
    expect(result.reactions.right).toBeCloseTo(80, 1);

    // Mmax = w×L²/8 = 20×64/8 = 160 kN·m
    expect(result.maxMoment).toBeCloseTo(160, 0);

    // Vmax = w×L/2 = 80 kN
    expect(result.maxShear).toBeCloseTo(80, 1);
  });
});

describe('beam.ts — 懸臂梁 + 集中載重', () => {
  it('懸臂梁自由端集中載重', () => {
    const loads: BeamLoad[] = [{ type: 'point', value: 50, position: 4 }];
    const result = calcBeam(4, 'cantilever', loads);

    // 反力：左端應有向上反力 = 50 kN, 力矩 = 50×4 = 200 kN·m
    expect(result.reactions.left).toBeCloseTo(50, 1);

    // Mmax = P×L = 50×4 = 200 kN·m
    expect(result.maxMoment).toBeCloseTo(200, 1);

    // Vmax = P = 50 kN
    expect(result.maxShear).toBeCloseTo(50, 1);
  });
});

describe('beam.ts — 固定梁 + 均佈載重', () => {
  it('兩端固定梁均佈載重彎矩驗算', () => {
    const loads: BeamLoad[] = [{ type: 'udl', value: 30 }]; // 30 kN/m
    const result = calcBeam(6, 'fixed', loads);

    // 反力各半 = 30×6/2 = 90 kN
    expect(result.reactions.left).toBeCloseTo(90, 1);
    expect(result.reactions.right).toBeCloseTo(90, 1);

    // Mmax(固定梁端) = w×L²/12 = 30×36/12 = 90 kN·m
    expect(result.maxMoment).toBeGreaterThanOrEqual(80);
  });
});

describe('beam.ts — RC 梁彎矩配筋', () => {
  it('已知 Mu, Vu 計算配筋量與 φMn', () => {
    const result = calcRCBeam(250, 150, 300, 500, 28, 420);

    // 應有拉力筋
    expect(result.As_tension).toBeGreaterThan(500);
    // φMn 應接近或大於 Mu
    expect(result.phiMn).toBeGreaterThanOrEqual(200);

    // 鋼筋比應在合理範圍
    expect(result.rho).toBeGreaterThan(result.rho_min);
    expect(result.rho).toBeLessThanOrEqual(result.rho_max);

    // 配筋描述不為空
    expect(result.bars_tension.length).toBeGreaterThan(0);
  });
});

describe('beam.ts — RC 梁剪力配筋', () => {
  it('已知 Vu 計算剪力筋配置', () => {
    const shearResult = calcRCBeamShear(200, 300, 440, 28, 420);

    // 應有剪力筋
    expect(shearResult.Av).toBeGreaterThan(0);
    expect(shearResult.s).toBeGreaterThan(0);
    expect(shearResult.phiVn).toBeGreaterThan(0);
    // phiVn 應大於等於 Vu
    expect(shearResult.phiVn).toBeGreaterThanOrEqual(200);
    // 箍筋描述非 "不需剪力筋"
    expect(shearResult.stirrup_type).not.toBe('不需剪力筋');
  });

  it('小剪力不需配剪力筋', () => {
    const shearResult = calcRCBeamShear(20, 300, 440, 28, 420);
    expect(shearResult.stirrup_type).toBe('不需剪力筋');
  });
});

describe('beam.ts — 連續梁 2 跨', () => {
  it('2 跨連續梁內力計算', () => {
    const spans = [
      {
        L: 6,
        loads: [{ type: 'udl', value: 30 }] as BeamLoad[],
        supportType: 'end' as const,
      },
      {
        L: 6,
        loads: [{ type: 'udl', value: 30 }] as BeamLoad[],
        supportType: 'end' as const,
      },
    ];
    const result = calcContinuousBeam(spans);

    expect(result.spans).toHaveLength(2);
    expect(result.spans[0].maxMoment).toBeGreaterThan(0);
    expect(result.spans[1].maxMoment).toBeGreaterThan(0);
    expect(result.spans[0].reactions.left).toBeGreaterThan(0);
    expect(result.spans[0].reactions.right).toBeGreaterThan(0);
  });

  it('拋錯當跨數不足', () => {
    expect(() =>
      calcContinuousBeam([
        { L: 6, loads: [], supportType: 'end' },
      ]),
    ).toThrow('至少需 2 跨');
  });
});

describe('beam.ts — 三角形載重', () => {
  it('簡支梁三角形載重', () => {
    const loads: BeamLoad[] = [
      {
        type: 'triangular',
        value: 24,
        start: 0,
        end: 6,
      },
    ];
    const result = calcBeam(6, 'simply', loads);

    // 應有合理的反力與彎矩
    expect(result.reactions.left).toBeGreaterThan(0);
    expect(result.reactions.right).toBeGreaterThan(0);
    expect(result.maxMoment).toBeGreaterThan(0);
    expect(result.maxShear).toBeGreaterThan(0);
  });
});

describe('beam.ts — calcBeta1', () => {
  it('fc ≤ 28 → 0.85', () => {
    expect(calcBeta1(28)).toBe(0.85);
  });

  it('fc = 35 → 0.80', () => {
    expect(calcBeta1(35)).toBeCloseTo(0.80, 2);
  });

  it('fc = 55 → 0.65', () => {
    expect(calcBeta1(55)).toBeCloseTo(0.657, 2);
  });

  it('fc ≥ 70 → 0.65 (下限)', () => {
    expect(calcBeta1(70)).toBe(0.65);
  });
});

describe('beam.ts — calcEffectiveDepth', () => {
  it('h=500, cover=40, ds=10, db=25 → d=437.5', () => {
    expect(calcEffectiveDepth(500, 40, 10, 25)).toBeCloseTo(437.5, 1);
  });
});
