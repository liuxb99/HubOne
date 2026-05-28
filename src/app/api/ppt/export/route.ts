import { NextResponse } from "next/server";

/**
 * 匯出格式
 */
type ExportFormat = "pptx" | "pdf" | "image";

/**
 * POST /api/ppt/export
 * 簡報匯出 API — 接收投影片數據，回傳匯出連結（Mock）
 *
 * Body: {
 *   slides: Array<{ title: string, content: string, layout?: string }>,
 *   format: "pptx" | "pdf" | "image",
 *   options?: { theme?: string, includeNotes?: boolean }
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slides, format, options } = body;

    // 參數驗證
    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json(
        { success: false, error: "請提供投影片數據（slides 陣列）" },
        { status: 400 }
      );
    }

    if (slides.length > 50) {
      return NextResponse.json(
        { success: false, error: "投影片數量不得超過 50 頁" },
        { status: 400 }
      );
    }

    const validFormats: ExportFormat[] = ["pptx", "pdf", "image"];
    const exportFormat: ExportFormat =
      format && validFormats.includes(format) ? format : "pptx";

    // 檢查每頁投影片是否包含必要欄位
    for (let i = 0; i < slides.length; i++) {
      if (!slides[i].title) {
        return NextResponse.json(
          { success: false, error: `第 ${i + 1} 頁投影片缺少標題（title）` },
          { status: 400 }
        );
      }
    }

    // 模擬匯出作業
    const exportId = `export-${Date.now()}`;
    const mockExportUrl = `/api/ppt/download/${exportId}.${exportFormat === "image" ? "zip" : exportFormat}`;

    return NextResponse.json(
      {
        success: true,
        data: {
          exportId,
          format: exportFormat,
          slideCount: slides.length,
          url: mockExportUrl,
          expiresIn: "24 小時",
          estimatedSize: `${(slides.length * (exportFormat === "image" ? 0.5 : 0.05)).toFixed(1)} MB`,
          options: {
            theme: options?.theme || "default",
            includeNotes: options?.includeNotes ?? true,
          },
          message: "簡報匯出成功，連結將在 24 小時內有效",
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PPT export error:", error);
    return NextResponse.json(
      { success: false, error: "匯出失敗，請檢查投影片數據格式" },
      { status: 500 }
    );
  }
}
