import { NextResponse } from "next/server";

/**
 * GET /api/quant/market
 * 回傳模擬行情 JSON 數據
 *
 * 模擬數據包含：
 * - 多個交易對的即時價格
 * - 24 小時漲跌幅
 * - 成交量
 */
export async function GET() {
  try {
    // 模擬行情數據
    const mockMarkets = [
      {
        symbol: "BTC/USDT",
        price: 67432.18,
        change24h: 2.35,
        high24h: 68210.00,
        low24h: 65890.50,
        volume24h: 28456700000,
        status: "open",
      },
      {
        symbol: "ETH/USDT",
        price: 3456.72,
        change24h: -1.28,
        high24h: 3520.10,
        low24h: 3410.80,
        volume24h: 15234800000,
        status: "open",
      },
      {
        symbol: "TSLA/USD",
        price: 245.80,
        change24h: 3.12,
        high24h: 248.50,
        low24h: 238.20,
        volume24h: 45820000000,
        status: "open",
      },
      {
        symbol: "AAPL/USD",
        price: 178.45,
        change24h: 0.85,
        high24h: 179.30,
        low24h: 176.80,
        volume24h: 32650000000,
        status: "open",
      },
      {
        symbol: "NVDA/USD",
        price: 824.16,
        change24h: 5.67,
        high24h: 835.00,
        low24h: 790.50,
        volume24h: 52100000000,
        status: "open",
      },
      {
        symbol: "BTC/ETH",
        price: 19.51,
        change24h: 3.67,
        high24h: 19.78,
        low24h: 18.95,
        volume24h: 892000000,
        status: "open",
      },
    ];

    return NextResponse.json(
      {
        success: true,
        data: {
          markets: mockMarkets,
          timestamp: new Date().toISOString(),
          total: mockMarkets.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Market data error:", error);
    return NextResponse.json(
      { success: false, error: "無法獲取行情數據" },
      { status: 500 }
    );
  }
}
