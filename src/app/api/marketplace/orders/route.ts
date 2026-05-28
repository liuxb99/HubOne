import { NextResponse } from "next/server";

/**
 * 訂單狀態
 */
type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

/**
 * GET /api/marketplace/orders
 * 訂單列表（Mock）
 * Query: ?page=1&limit=10&status=
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") as OrderStatus | null;

    const mockOrders = [
      {
        id: "order-001",
        itemId: "item-001",
        itemTitle: "MacBook Pro 14\" M3 Pro 2024",
        buyer: { id: "user-007", name: "陳小華" },
        seller: { id: "user-001", name: "科技小明" },
        price: 52000,
        quantity: 1,
        status: "delivered" as OrderStatus,
        createdAt: "2025-03-10T10:00:00Z",
        updatedAt: "2025-03-15T14:00:00Z",
      },
      {
        id: "order-002",
        itemId: "item-003",
        itemTitle: "SONY WH-1000XM5 無線降噪耳機",
        buyer: { id: "user-008", name: "李小華" },
        seller: { id: "user-003", name: "音響發燒友" },
        price: 6800,
        quantity: 1,
        status: "shipped" as OrderStatus,
        createdAt: "2025-03-13T09:00:00Z",
        updatedAt: "2025-03-14T16:00:00Z",
      },
      {
        id: "order-003",
        itemId: "item-005",
        itemTitle: "Nintendo Switch OLED 薩爾達同捆機",
        buyer: { id: "user-009", name: "張小華" },
        seller: { id: "user-005", name: "遊戲收藏家" },
        price: 10800,
        quantity: 1,
        status: "confirmed" as OrderStatus,
        createdAt: "2025-03-12T11:30:00Z",
        updatedAt: "2025-03-12T11:35:00Z",
      },
      {
        id: "order-004",
        itemId: "item-004",
        itemTitle: "IKEA KALLAX 層架組 4x4 (白色)",
        buyer: { id: "user-010", name: "王小華" },
        seller: { id: "user-004", name: "居家改造王" },
        price: 2500,
        quantity: 2,
        status: "pending" as OrderStatus,
        createdAt: "2025-03-15T08:00:00Z",
        updatedAt: "2025-03-15T08:00:00Z",
      },
    ];

    let filtered = [...mockOrders];
    if (status) {
      filtered = filtered.filter((order) => order.status === status);
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return NextResponse.json(
      {
        success: true,
        data: {
          orders: paginated,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasMore: page < totalPages,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Orders list error:", error);
    return NextResponse.json(
      { success: false, error: "無法獲取訂單列表" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketplace/orders
 * 建立訂單（Mock）
 * Body: { itemId, quantity }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { itemId, quantity } = body;

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: "請提供商品 ID（itemId）" },
        { status: 400 }
      );
    }

    if (quantity !== undefined && (typeof quantity !== "number" || quantity < 1)) {
      return NextResponse.json(
        { success: false, error: "數量必須為正整數" },
        { status: 400 }
      );
    }

    const newOrder = {
      id: `order-${Date.now()}`,
      itemId,
      itemTitle: "商品名稱待查",
      buyer: { id: "user-current", name: "目前用戶" },
      seller: { id: "user-seller", name: "賣家" },
      price: 0,
      quantity: quantity || 1,
      status: "pending" as OrderStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          order: newOrder,
          message: "訂單建立成功",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Order create error:", error);
    return NextResponse.json(
      { success: false, error: "無法建立訂單" },
      { status: 500 }
    );
  }
}
