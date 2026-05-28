import { NextResponse } from "next/server";

/**
 * 結構計算類型
 */
type CalculationType = "beam" | "column" | "slab" | "foundation";

/**
 * POST /api/civil/calculate
 * 結構計算 API — 輸入結構參數，回傳計算結果（Mock）
 *
 * Body: {
 *   type: "beam" | "column" | "slab" | "foundation",
 *   length: number,
 *   width: number,
 *   height: number,
 *   load: number,
 *   material: "steel" | "concrete" | "wood"
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, length, width, height, load, material } = body;

    // 參數驗證
    if (!type || !length || !load) {
      return NextResponse.json(
        {
          success: false,
          error: "請填寫所有必填欄位（type, length, load）",
        },
        { status: 400 }
      );
    }

    const validTypes: CalculationType[] = ["beam", "column", "slab", "foundation"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: `無效的結構類型。有效值: ${validTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const validMaterials = ["steel", "concrete", "wood"];
    const mat = material || "concrete";
    if (!validMaterials.includes(mat)) {
      return NextResponse.json(
        {
          success: false,
          error: `無效的材料類型。有效值: ${validMaterials.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (typeof length !== "number" || length <= 0) {
      return NextResponse.json(
        { success: false, error: "長度必須為正數" },
        { status: 400 }
      );
    }

    if (typeof load !== "number" || load <= 0) {
      return NextResponse.json(
        { success: false, error: "載重必須為正數" },
        { status: 400 }
      );
    }

    // 模擬計算結果
    const area = (width || 0.3) * (height || 0.5);
    const stress = load / area;
    const maxStress = mat === "steel" ? 250 : mat === "concrete" ? 30 : 15; // MPa
    const safetyFactor = maxStress / stress;
    const passed = safetyFactor >= 1.5;

    const mockResult = {
      type,
      material: mat,
      dimensions: {
        length: length,
        width: width || 0.3,
        height: height || 0.5,
        area: Math.round(area * 1000) / 1000,
      },
      load: {
        applied: load,
        unit: "kN",
      },
      stress: {
        calculated: Math.round(stress * 100) / 100,
        maxAllowed: maxStress,
        unit: "MPa",
      },
      safetyFactor: Math.round(safetyFactor * 100) / 100,
      passed,
      deflection: {
        value: Math.round((length / 250) * 100) / 100,
        unit: "mm",
        withinLimit: length / 250 < length / 180,
      },
      recommendations: passed
        ? ["結構設計符合規範", "建議增加 5% 的鋼筋量以提升安全裕度"]
        : [
            "結構強度不足，請增加截面尺寸",
            "建議更換更高強度材料",
            "或考慮增加支撐結構",
          ],
    };

    return NextResponse.json(
      {
        success: true,
        data: mockResult,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Calculation error:", error);
    return NextResponse.json(
      { success: false, error: "計算過程發生錯誤，請檢查輸入參數" },
      { status: 500 }
    );
  }
}
