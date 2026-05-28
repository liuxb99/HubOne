import { NextResponse } from "next/server";

/**
 * 生成類型
 */
type GenerationType = "chat" | "image" | "code" | "summary";

/**
 * POST /api/ai-tools/generate
 * AI 生成 API — 接收 prompt，回傳 Mock AI 回覆
 *
 * Body: {
 *   prompt: string,
 *   type: "chat" | "image" | "code" | "summary",
 *   options?: { temperature?: number, maxTokens?: number }
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, type, options } = body;

    // 參數驗證
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { success: false, error: "請提供有效的 prompt（字串）" },
        { status: 400 }
      );
    }

    if (prompt.length < 2) {
      return NextResponse.json(
        { success: false, error: "prompt 長度至少需要 2 個字元" },
        { status: 400 }
      );
    }

    const validTypes: GenerationType[] = ["chat", "image", "code", "summary"];
    const genType: GenerationType = type && validTypes.includes(type) ? type : "chat";

    // 模擬 AI 回覆 — 根據類型與 prompt 內容生成不同回應
    const mockResponses: Record<GenerationType, string> = {
      chat: `您好！感謝您的提問。關於「${prompt}」，這是一個很好的問題。\n\n根據我的分析，以下是一些建議與觀點：\n\n1. 首先，我們需要理解問題的核心背景\n2. 其次，考慮各種可能的解決方案\n3. 最後，選擇最適合的方法來執行\n\n如果您需要更詳細的說明，歡迎繼續追問！`,
      image: `🎨 [模擬圖片生成]\n\n根據您的描述：「${prompt}」\n\n生成參數：\n- 解析度：1024×1024\n- 風格：現代數位藝術\n- 種子：${Math.floor(Math.random() * 999999)}\n\n（此為 Mock 回應，實際圖片生成功能待串接 AI API）`,
      code: `// 根據需求「${prompt}」生成的範例程式碼\n\n\`\`\`typescript\ninterface Solution {\n  id: string;\n  description: string;\n  implement(): void;\n}\n\nclass CodeGenerator implements Solution {\n  id = "generated-${Date.now()}";\n  description = "自動生成的解決方案";\n\n  implement() {\n    console.log("執行: ${prompt}");\n    // TODO: 實作具體邏輯\n  }\n}\n\n// 使用範例\nconst solution = new CodeGenerator();\nsolution.implement();\n\`\`\`\n\n> 💡 提示：此為 Mock 生成的程式碼，請根據實際需求調整。`,
      summary: `📝 **文章摘要**\n\n原文主題：${prompt}\n\n**重點摘要：**\n1. 這是根據您提供的內容生成的模擬摘要\n2. 主要論點將會在這裡呈現\n3. 關鍵數據與結論\n\n**關鍵字：** #${prompt.replace(/\s+/g, " #")}\n\n---\n*摘要長度：約 ${Math.ceil(prompt.length * 0.3)} 字*\n*信心指數：${Math.floor(Math.random() * 20 + 80)}%*`,
    };

    const response = mockResponses[genType];

    return NextResponse.json(
      {
        success: true,
        data: {
          type: genType,
          prompt,
          response,
          model: "opc-ai-mock-v1",
          usage: {
            promptTokens: prompt.length,
            completionTokens: response.length,
            totalTokens: prompt.length + response.length,
          },
          options: {
            temperature: options?.temperature || 0.7,
            maxTokens: options?.maxTokens || 2048,
          },
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("AI generate error:", error);
    return NextResponse.json(
      { success: false, error: "AI 生成失敗，請稍後再試" },
      { status: 500 }
    );
  }
}
