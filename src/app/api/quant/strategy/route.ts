import { NextResponse } from "next/server";

/**
 * GET /api/quant/strategy
 * 列出所有策略（Mock 數據）
 */
export async function GET() {
  try {
    const mockStrategies = [
      {
        id: "strat-001",
        name: "移動平均線黃金交叉",
        type: "趨勢跟蹤",
        pair: "BTC/USDT",
        status: "running",
        profit: 12.45,
        risk: "medium",
        createdAt: "2025-01-15T08:30:00Z",
      },
      {
        id: "strat-002",
        name: "RSI 超買超賣策略",
        type: "反轉交易",
        pair: "ETH/USDT",
        status: "running",
        profit: 8.32,
        risk: "high",
        createdAt: "2025-02-20T14:00:00Z",
      },
      {
        id: "strat-003",
        name: "布林帶突破策略",
        type: "突破交易",
        pair: "TSLA/USD",
        status: "paused",
        profit: -2.18,
        risk: "medium",
        createdAt: "2025-03-10T10:00:00Z",
      },
      {
        id: "strat-004",
        name: "網格交易策略",
        type: "市場中性",
        pair: "BTC/USDT",
        status: "stopped",
        profit: 5.67,
        risk: "low",
        createdAt: "2024-11-05T09:00:00Z",
      },
    ];

    return NextResponse.json(
      {
        success: true,
        data: {
          strategies: mockStrategies,
          total: mockStrategies.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Strategy list error:", error);
    return NextResponse.json(
      { success: false, error: "無法獲取策略列表" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quant/strategy
 * 建立新策略（Mock）
 * Body: { name: string, type: string, pair: string, risk: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, pair, risk } = body;

    // 參數驗證
    if (!name || !type || !pair) {
      return NextResponse.json(
        { success: false, error: "請填寫所有必填欄位（name, type, pair）" },
        { status: 400 }
      );
    }

    // 模擬建立策略
    const newStrategy = {
      id: `strat-${Date.now()}`,
      name,
      type,
      pair,
      status: "running",
      profit: 0,
      risk: risk || "medium",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          strategy: newStrategy,
          message: "策略建立成功",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Strategy create error:", error);
    return NextResponse.json(
      { success: false, error: "無法建立策略" },
      { status: 500 }
    );
  }
}
