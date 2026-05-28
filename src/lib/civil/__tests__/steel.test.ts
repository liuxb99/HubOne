import { describe, it, expect } from 'vitest';
import {
  calcBoltConnection,
  calcWeld,
  BOLT_DIAMETERS,
  ELECTRODE_OPTIONS,
} from '../steel';

// ═══════════════════════════════════════════════
//  steel.ts 測試
// ═══════════════════════════════════════════════

describe('steel.ts — 螺栓抗剪容量', () => {
  it('A325 M22 純剪力計算', () => {
    const result = calcBoltConnection(200, 0, 22, 'A325', 'bearing');

    // 應有螺栓數量
    expect(result.boltCount).toBeGreaterThan(0);
    // 抗剪容量 ≥ 需求
    expect(result.isShearOK).toBe(true);
    expect(result.shearCapacity).toBeGreaterThanOrEqual(200);
    // 抗拉容量 > 0
    expect(result.tensionCapacity).toBeGreaterThan(0);
    // 計算步驟
    expect(result.steps.length).toBeGreaterThan(3);
  });

  it('M20 A490 高強度螺栓', () => {
    const result = calcBoltConnection(300, 0, 20, 'A490', 'bearing');

    expect(result.boltCount).toBeGreaterThan(0);
    expect(result.isShearOK).toBe(true);
    expect(result.shearCapacity).toBeGreaterThanOrEqual(300);
  });

  it('大剪力需要多顆螺栓', () => {
    const result = calcBoltConnection(1000, 0, 22, 'A325', 'bearing');
    expect(result.boltCount).toBeGreaterThanOrEqual(2);
    expect(result.isShearOK).toBe(true);
  });
});

describe('steel.ts — 銲接強度', () => {
  it('E70 填角銲 8mm 腳長 200mm 長', () => {
    const result = calcWeld(200, 8, 200, 'E70', 0);

    // 容量 > 0
    expect(result.capacity).toBeGreaterThan(0);
    // 應安全
    expect(result.isOK).toBe(true);
    // 使用率 < 1
    expect(result.ratio).toBeLessThan(1);
    // 計算步驟完整
    expect(result.steps.length).toBeGreaterThan(5);
  });

  it('小銲道容量不足', () => {
    const result = calcWeld(500, 6, 100, 'E70', 0);
    // 可能不足
    expect(result.capacity).toBeGreaterThan(0);
    // 使用率應較大
    expect(result.ratio).toBeGreaterThan(0);
  });

  it('受力角度影響強度', () => {
    const longWeld = calcWeld(200, 8, 200, 'E70', 0);
    const transWeld = calcWeld(200, 8, 200, 'E70', 90);

    // 橫向受力（90°）強度大於縱向（0°）
    expect(transWeld.capacity).toBeGreaterThan(longWeld.capacity);
  });
});

describe('steel.ts — 常數正確', () => {
  it('BOLT_DIAMETERS 包含常用規格', () => {
    expect(BOLT_DIAMETERS).toContain(12);
    expect(BOLT_DIAMETERS).toContain(20);
    expect(BOLT_DIAMETERS).toContain(22);
    expect(BOLT_DIAMETERS).toContain(24);
    expect(BOLT_DIAMETERS).toContain(30);
  });

  it('ELECTRODE_OPTIONS 包含 E60~E110', () => {
    expect(ELECTRODE_OPTIONS).toContain('E60');
    expect(ELECTRODE_OPTIONS).toContain('E70');
    expect(ELECTRODE_OPTIONS).toContain('E90');
    expect(ELECTRODE_OPTIONS).toContain('E110');
  });
});

describe('steel.ts — 螺栓剪拉組合', () => {
  it('同時受剪與受拉組合應力檢討', () => {
    const result = calcBoltConnection(100, 50, 22, 'A325', 'bearing');

    expect(result.boltCount).toBeGreaterThan(0);
    expect(result.isShearOK).toBe(true);
    expect(result.isTensionOK).toBe(true);
    // 計算步驟應包含組合應力檢討
    const allSteps = result.steps.join(' ');
    expect(allSteps).toContain('AISC');
    expect(allSteps).toContain('組合應力');
  });
});
