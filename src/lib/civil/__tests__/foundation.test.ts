import { describe, it, expect } from 'vitest';
import {
  calcSpreadFooting,
  checkFootingThickness,
} from '../foundation';

// ═══════════════════════════════════════════════
//  foundation.ts 測試
// ═══════════════════════════════════════════════

describe('foundation.ts — 獨立基腳面積檢討', () => {
  it('P=1500kN, qa=200kN/m² 基腳面積檢討', () => {
    const result = calcSpreadFooting(1500, 200, 28, 420, 400);

    // 承載力應合格
    expect(result.isBearingOK).toBe(true);
    // 實際承載力 ≤ 容許承載力
    expect(result.q_actual).toBeLessThanOrEqual(result.q_allowable);
    // 基腳尺寸應為正
    expect(result.B).toBeGreaterThan(0);
    expect(result.L).toBeGreaterThan(0);
    // 基腳面積至少可承載柱軸力
    const area = result.B * result.L;
    expect(area).toBeGreaterThan(5);
  });

  it('小承載力需要較大基腳', () => {
    const resultSmallQA = calcSpreadFooting(1500, 100, 28, 420, 400);
    const resultLargeQA = calcSpreadFooting(1500, 300, 28, 420, 400);

    // 容許承載力越小 → 基腳越大
    expect(resultSmallQA.B).toBeGreaterThan(resultLargeQA.B);
    expect(resultSmallQA.L).toBeGreaterThan(resultLargeQA.L);
  });
});

describe('foundation.ts — 基腳配筋', () => {
  it('基腳配筋計算結果合理', () => {
    const result = calcSpreadFooting(1500, 200, 28, 420, 400);

    // 有配筋
    expect(result.As).toBeGreaterThan(0);
    expect(result.spacing).toBeGreaterThan(0);
    expect(result.rebar_desc).toBeTruthy();
    // 間距合理
    expect(result.spacing).toBeGreaterThanOrEqual(100);
    expect(result.spacing).toBeLessThanOrEqual(500);
    // 彎矩 > 0
    expect(result.Mu).toBeGreaterThan(0);
  });
});

describe('foundation.ts — 基腳厚度檢討', () => {
  it('剪力控制厚度', () => {
    const H_min = checkFootingThickness(2.5, 2.5, 150, 28);
    // 厚度應為正整數且合理
    expect(H_min).toBeGreaterThan(0);
    expect(H_min).toBeLessThan(2000);
  });

  it('高承載力需要較厚基腳', () => {
    const H_low = checkFootingThickness(2.5, 2.5, 100, 28);
    const H_high = checkFootingThickness(2.5, 2.5, 300, 28);
    expect(H_high).toBeGreaterThanOrEqual(H_low);
  });

  it('基腳計算結果厚度檢討', () => {
    const result = calcSpreadFooting(1500, 200, 28, 420, 400);
    expect(result.H).toBeGreaterThan(0);
    // 應有剪力檢討結果
    expect(result.isShearOK).toBe(true);
    expect(result.isThicknessOK).toBe(true);
  });
});

describe('foundation.ts — 基腳計算書', () => {
  it('計算步驟完整', () => {
    const result = calcSpreadFooting(1500, 200, 28, 420, 400);
    expect(result.steps.length).toBeGreaterThan(5);
    // 應包含關鍵步驟文字
    const allSteps = result.steps.join(' ');
    expect(allSteps).toContain('獨立基腳設計');
    expect(allSteps).toContain('承載力');
    expect(allSteps).toContain('配筋');
  });
});
