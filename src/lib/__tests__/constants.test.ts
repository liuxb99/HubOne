import { describe, it, expect } from "vitest";
import { inferBusinessId, BUSINESS_COLORS, BUSINESS_NAMES } from "../constants";

describe("inferBusinessId", () => {
  it("returns 'quant' for /quant path", () => {
    expect(inferBusinessId("/quant")).toBe("quant");
  });

  it("returns 'game' for /games path", () => {
    expect(inferBusinessId("/games")).toBe("game");
  });

  it("returns 'market' for /marketplace/items/123", () => {
    expect(inferBusinessId("/marketplace/items/123")).toBe("market");
  });

  it("returns null for unknown path", () => {
    expect(inferBusinessId("/unknown")).toBeNull();
  });

  it("returns null for root path", () => {
    expect(inferBusinessId("/")).toBeNull();
  });
});

describe("BUSINESS_COLORS", () => {
  it("has all 6 business colors", () => {
    expect(Object.keys(BUSINESS_COLORS)).toHaveLength(6);
    expect(BUSINESS_COLORS.quant).toBeDefined();
    expect(BUSINESS_COLORS.game).toBeDefined();
  });
});

describe("BUSINESS_NAMES", () => {
  it("contains Chinese names for all businesses", () => {
    expect(BUSINESS_NAMES.quant).toBe("量化交易");
    expect(BUSINESS_NAMES.game).toBe("經典遊戲");
  });
});
