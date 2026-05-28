import { describe, it, expect } from 'vitest';

// ── section.ts ──
import {
  H_BEAMS,
  CHANNELS,
  ANGLES,
  calcRCGeoProps,
  getSectionOptions,
} from '../section';

// ── rebar.ts ──
import {
  REBAR_SPEC,
  calcAs,
  calcRebarByArea,
  calcSpacing,
  checkMinSpacing,
  calcDevelopmentLength,
  calcLapSplice,
} from '../rebar';

// ── units.ts ──
import {
  kN_to_kgf,
  MPa_to_kgfcm2,
  cm4_to_mm4,
  kNm_to_Nmm,
  formatUnit,
} from '../units';

// ── load.ts ──
import {
  LOAD_COMBINATIONS,
  calcCombinationDetail,
  calcSeismicLoad,
  calcWindLoad,
  filterCombinationsByMethod,
} from '../load';

// ═══════════════════════════════════════════
//  T01：section.ts 驗證
// ═══════════════════════════════════════════

describe('section.ts — H 型鋼', () => {
  it('H_BEAMS 至少有 15 種', () => {
    expect(H_BEAMS.length).toBeGreaterThanOrEqual(15);
  });

  it('每筆 H 型鋼都有 name', () => {
    for (const b of H_BEAMS) {
      expect(b.name).toBeTruthy();
      expect(b.Zx).toBeGreaterThan(0);
    }
  });
});

describe('section.ts — C 型鋼', () => {
  it('CHANNELS 至少有 8 種', () => {
    expect(CHANNELS.length).toBeGreaterThanOrEqual(8);
  });

  it('C100 存在', () => {
    expect(CHANNELS[0].name).toContain('100');
  });

  it('C380 存在', () => {
    expect(CHANNELS[CHANNELS.length - 1].name).toContain('380');
  });
});

describe('section.ts — 等邊角鋼', () => {
  it('ANGLES 至少有 8 種', () => {
    expect(ANGLES.length).toBeGreaterThanOrEqual(8);
  });

  it('L65 存在', () => {
    expect(ANGLES[0].name).toContain('65');
  });

  it('L200 存在', () => {
    expect(ANGLES[ANGLES.length - 1].name).toContain('200');
  });
});

describe('section.ts — RC 幾何計算', () => {
  it('calcRCGeoProps 回傳合理值', () => {
    const r = calcRCGeoProps(300, 500, 40, 28, 420);
    expect(r.Ag).toBe(150000);
    expect(r.d).toBeGreaterThan(0);
    expect(r.d_prime).toBeGreaterThan(0);
    expect(r.As_min).toBeGreaterThan(0);
    expect(r.As_max).toBeGreaterThan(r.As_min);
  });
});

describe('section.ts — getSectionOptions', () => {
  it('不傳參數回傳所有類型', () => {
    const all = getSectionOptions();
    expect(all.length).toBeGreaterThan(H_BEAMS.length);
  });

  it('按 HBEAM 篩選', () => {
    const h = getSectionOptions('HBEAM');
    expect(h.length).toBe(H_BEAMS.length);
    expect(h[0].type).toBe('HBEAM');
  });

  it('按 CHANNEL 篩選', () => {
    const c = getSectionOptions('CHANNEL');
    expect(c.length).toBe(CHANNELS.length);
    expect(c[0].type).toBe('CHANNEL');
  });

  it('按 ANGLE 篩選', () => {
    const a = getSectionOptions('ANGLE');
    expect(a.length).toBe(ANGLES.length);
    expect(a[0].type).toBe('ANGLE');
  });

  it('按 RC_RECT 篩選', () => {
    const rc = getSectionOptions('RC_RECT');
    expect(rc.length).toBe(1);
    expect(rc[0].type).toBe('RC_RECT');
  });
});

// ═══════════════════════════════════════════
//  T02：rebar.ts 驗證
// ═══════════════════════════════════════════

describe('rebar.ts — REBAR_SPEC', () => {
  it('至少有 10 種鋼筋', () => {
    expect(REBAR_SPEC.length).toBeGreaterThanOrEqual(10);
  });

  it('D25 直徑為 25.4mm', () => {
    const d25 = REBAR_SPEC.find((r) => r.name === 'D25');
    expect(d25).toBeDefined();
    expect(d25!.diameter).toBeCloseTo(25.4, 1);
  });
});

describe('rebar.ts — calcAs', () => {
  it('4-D22 面積正確', () => {
    const d22 = REBAR_SPEC.find((r) => r.name === 'D22')!;
    const as = calcAs(4, d22);
    expect(as).toBeCloseTo(4 * 387, 0);
  });

  it('6-D25 面積正確', () => {
    const as = calcAs(6, 'D25');
    expect(as).toBeCloseTo(6 * 507, 0);
  });

  it('拋錯當找不到鋼筋', () => {
    expect(() => calcAs(2, 'D99')).toThrow();
  });
});

describe('rebar.ts — calcRebarByArea', () => {
  it('1500 mm² 用 D25 配筋', () => {
    const r = calcRebarByArea(1500, 'D25');
    expect(r.rebarName).toBe('D25');
    expect(r.totalArea).toBeGreaterThanOrEqual(1500);
    expect(r.count).toBeGreaterThan(0);
  });

  it('自動選筋功能正常', () => {
    const r = calcRebarByArea(1000);
    expect(r.totalArea).toBeGreaterThanOrEqual(1000);
    expect(r.count).toBeGreaterThan(0);
  });
});

describe('rebar.ts — calcSpacing', () => {
  it('300mm 寬 5-D25 間距正確', () => {
    const s = calcSpacing(300, 5, 25, 40, 10);
    // (300 - 2*40 - 2*10 - 5*25) / 4 = (300-80-20-125)/4 = 18.75
    expect(s).toBeCloseTo(18.75, 1);
  });
});

describe('rebar.ts — checkMinSpacing', () => {
  it('30mm ≥ 25mm 通過', () => {
    const r = checkMinSpacing(30, 25);
    expect(r.pass).toBe(true);
  });

  it('20mm < 25mm 不通過', () => {
    const r = checkMinSpacing(20, 25);
    expect(r.pass).toBe(false);
  });
});

describe('rebar.ts — calcDevelopmentLength', () => {
  it('D25 fy=420 fc=28 伸長長度合理', () => {
    const ld = calcDevelopmentLength(25.4, 420, 28);
    expect(ld).toBeGreaterThanOrEqual(300);
    // 預估 ~1130mm
    expect(ld).toBeGreaterThanOrEqual(300);
    expect(ld).toBeLessThan(2000);
  });
});

describe('rebar.ts — calcLapSplice', () => {
  it('B 級搭接比 A 級長', () => {
    const la = calcLapSplice(25.4, 420, 28, 'A');
    const lb = calcLapSplice(25.4, 420, 28, 'B');
    expect(lb).toBeGreaterThan(la);
  });
});

// ═══════════════════════════════════════════
//  T02：units.ts 驗證
// ═══════════════════════════════════════════

describe('units.ts — 單位轉換', () => {
  it('kN_to_kgf', () => {
    expect(kN_to_kgf(100)).toBeCloseTo(10197.16, 1);
  });

  it('MPa_to_kgfcm2', () => {
    expect(MPa_to_kgfcm2(28)).toBeCloseTo(285.52, 1);
  });

  it('cm4_to_mm4', () => {
    expect(cm4_to_mm4(1)).toBe(10000);
    expect(cm4_to_mm4(20400)).toBe(204000000);
  });

  it('kNm_to_Nmm', () => {
    expect(kNm_to_Nmm(1)).toBe(1000000);
    expect(kNm_to_Nmm(100)).toBe(100000000);
  });

  it('formatUnit', () => {
    expect(formatUnit(12345.6, 'kN', 1)).toBe('12,345.6 kN');
    expect(formatUnit(28, 'MPa', 0)).toBe('28 MPa');
  });
});

// ═══════════════════════════════════════════
//  T03：load.ts 驗證
// ═══════════════════════════════════════════

describe('load.ts — LOAD_COMBINATIONS', () => {
  it('至少有 10 個 LRFD + 6 個 ASD 組合', () => {
    const lrfd = LOAD_COMBINATIONS.filter((c) => c.method === 'LRFD');
    const asd = LOAD_COMBINATIONS.filter((c) => c.method === 'ASD');
    expect(lrfd.length).toBeGreaterThanOrEqual(10);
    expect(asd.length).toBeGreaterThanOrEqual(6);
  });
});

describe('load.ts — calcCombinationDetail', () => {
  const loads = [
    { type: 'DL' as const, value: 100, description: '自重' },
    { type: 'LL' as const, value: 50, description: '活載重' },
  ];
  const combo = LOAD_COMBINATIONS[1]; // 1.2DL + 1.6LL

  it('逐步計算步驟正確', () => {
    const result = calcCombinationDetail(loads, combo);
    expect(result.total).toBe(200); // 1.2*100 + 1.6*50 = 200
    expect(result.steps.length).toBe(2);
    expect(result.steps[0].contribution).toBe(120);
    expect(result.steps[1].contribution).toBe(80);
  });
});

describe('load.ts — calcSeismicLoad', () => {
  it('地震力計算結果合理', () => {
    const r = calcSeismicLoad(10000, 0.8, 0.4, 1.0, 3.2, 0.5);
    // Cs = Sd1*I/(1.4*R*T) = 0.4*1/(1.4*3.2*0.5) ≈ 0.1786
    // Cs_max = 0.8*1/(1.4*3.2) ≈ 0.1786
    // T0 = 0.2*0.4/0.8 = 0.1, Ts = 0.5
    // 0.1 < 0.5 ≤ 0.5 → 使用第二式
    expect(r.V).toBeGreaterThan(0);
    expect(r.steps.length).toBeGreaterThan(5);
    expect(r.Cs).toBeGreaterThan(0);
  });
});

describe('load.ts — calcWindLoad', () => {
  it('風載重計算正確', () => {
    const r = calcWindLoad(1.2, 50, 0.85, 0.8);
    // p = 1.2 * 0.85 * 0.8 = 0.816 kN/m²
    // F = 0.816 * 50 = 40.8 kN
    expect(r.pressure).toBeCloseTo(0.816, 3);
    expect(r.totalForce).toBeCloseTo(40.8, 1);
    expect(r.area).toBe(50);
  });
});

describe('load.ts — filterCombinationsByMethod', () => {
  it('LRFD 組合不少於 10 個', () => {
    expect(filterCombinationsByMethod('LRFD').length).toBeGreaterThanOrEqual(10);
  });

  it('ASD 組合不少於 6 個', () => {
    expect(filterCombinationsByMethod('ASD').length).toBeGreaterThanOrEqual(6);
  });
});
