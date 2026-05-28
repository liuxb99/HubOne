import { describe, it, expect } from 'vitest';
import {
  calcOneWaySlab,
  calcTwoWaySlab,
  checkSlabThickness,
  calcSlabEffectiveDepth,
  calcTempReinforcement,
} from '../slab';

// ═══════════════════════════════════════════════
//  slab.ts 測試
// ═══════════════════════════════════════════════

describe('slab.ts — 單向版版厚檢討', () => {
  it('L=4000mm 簡支版最小版厚 = 200mm', () => {
    const h_min = checkSlabThickness(4000, 'simply');
    expect(h_min).toBe(200); // L/20 = 200
  });

  it('L=4000mm 一端連續版最小版厚 = 167mm', () => {
    const h_min = checkSlabThickness(4000, 'one_continuous');
    expect(h_min).toBe(167); // L/24 = 166.67 → 167
  });

  it('L=4000mm 兩端連續版最小版厚 = 143mm', () => {
    const h_min = checkSlabThickness(4000, 'both_continuous');
    expect(h_min).toBe(143); // L/28 ≈ 142.86 → 143
  });

  it('懸臂版 L=2000mm 最小版厚 = 200mm', () => {
    const h_min = checkSlabThickness(2000, 'cantilever');
    expect(h_min).toBe(200); // L/10 = 200
  });

  it('最小版厚不得小於 89mm', () => {
    const h_min = checkSlabThickness(1000, 'simply');
    expect(h_min).toBeGreaterThanOrEqual(89);
  });
});

describe('slab.ts — 單向版配筋', () => {
  it('L=4000mm, w=12kN/m², fc=28, fy=420 簡支版配筋計算', () => {
    const result = calcOneWaySlab(4000, 12, 28, 420, 'simply');

    // 版厚應合理
    expect(result.h_provided).toBeGreaterThanOrEqual(result.h_min);
    expect(result.isThicknessOK).toBe(true);

    // 短向彎矩應 > 0
    expect(result.Mu_x).toBeGreaterThan(0);
    // 長向彎矩單向版為 0
    expect(result.Mu_y).toBe(0);

    // 有配筋
    expect(result.As_main_x).toBeGreaterThan(0);
    expect(result.rebar_desc_x).toBeTruthy();

    // 溫度筋
    expect(result.As_temp).toBeGreaterThan(0);
    expect(result.rebar_desc_temp).toBeTruthy();

    // 撓度合格
    expect(result.isDeflectionOK).toBe(true);

    // 有計算步驟
    expect(result.steps.length).toBeGreaterThan(3);
  });
});

describe('slab.ts — 雙向版彎矩分配', () => {
  it('Lx=4000, Ly=5000 四邊簡支版彎矩計算', () => {
    const result = calcTwoWaySlab(4000, 5000, 12, 28, 420, 'simple');

    // 版厚應合理
    expect(result.h_provided).toBeGreaterThanOrEqual(result.h_min);
    expect(result.isThicknessOK).toBe(true);

    // 短向彎矩 > 長向彎矩（短向受力較大）
    expect(result.Mu_x).toBeGreaterThan(result.Mu_y);

    // 雙向都有配筋
    expect(result.As_main_x).toBeGreaterThan(0);
    expect(result.As_main_y).toBeGreaterThan(0);
    expect(result.rebar_desc_x).toBeTruthy();
    expect(result.rebar_desc_y).toBeTruthy();

    // 溫度筋
    expect(result.As_temp).toBeGreaterThan(0);

    // 計算步驟
    expect(result.steps.length).toBeGreaterThan(3);
  });

  it('Lx=4000, Ly=5000 四邊連續版彎矩較小', () => {
    const simpleResult = calcTwoWaySlab(4000, 5000, 12, 28, 420, 'simple');
    const continuousResult = calcTwoWaySlab(4000, 5000, 12, 28, 420, 'continuous');

    // 連續版彎矩應小於簡支版
    expect(continuousResult.Mu_x).toBeLessThan(simpleResult.Mu_x);
  });
});

describe('slab.ts — calcSlabEffectiveDepth', () => {
  it('h=200, cover=20, db=12 → d=174', () => {
    expect(calcSlabEffectiveDepth(200, 20, 12)).toBeCloseTo(174, 0);
  });
});

describe('slab.ts — calcTempReinforcement', () => {
  it('fy=420, b=1000, h=150 → As=270 mm²/m', () => {
    const As = calcTempReinforcement(1000, 150, 420);
    // 0.0018 × 1000 × 150 = 270
    expect(As).toBe(270);
  });

  it('fy=280 → As=0.0020×b×h', () => {
    const As = calcTempReinforcement(1000, 150, 280);
    expect(As).toBe(300); // 0.0020 × 1000 × 150
  });

  it('fy=560 → As 按比例折減，但不小於 0.0014×b×h', () => {
    const As = calcTempReinforcement(1000, 150, 560);
    // 0.0018 × 420 × 1000 × 150 / 560 = 202.5
    // min = 0.0014 × 1000 × 150 = 210
    expect(As).toBeGreaterThanOrEqual(202);
    expect(As).toBeLessThanOrEqual(270);
  });
});
