import { NextResponse } from "next/server";

/**
 * 商品條件（狀態）類型
 */
type ItemCondition = "new" | "used" | "refurbished";

/**
 * GET /api/marketplace/items
 * 列出商品（Mock 列表）
 * Query: ?page=1&limit=12&category=&search=&condition=
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const condition = searchParams.get("condition") as ItemCondition | null;

    // Mock 商品數據
    const allItems = [
      {
        id: "item-001",
        title: "MacBook Pro 14\" M3 Pro 2024",
        price: 52000,
        originalPrice: 64900,
        images: ["/images/marketplace/macbook.jpg"],
        condition: "used" as ItemCondition,
        category: "電子產品",
        seller: { id: "user-001", name: "科技小明", rating: 4.8 },
        location: "台北市",
        createdAt: "2025-03-15T10:30:00Z",
        status: "active",
      },
      {
        id: "item-002",
        title: "Logitech MX Master 3S 無線滑鼠",
        price: 1800,
        originalPrice: 3290,
        images: ["/images/marketplace/mouse.jpg"],
        condition: "used" as ItemCondition,
        category: "電子產品",
        seller: { id: "user-002", name: "滑鼠達人", rating: 4.5 },
        location: "新北市",
        createdAt: "2025-03-14T14:20:00Z",
        status: "active",
      },
      {
        id: "item-003",
        title: "SONY WH-1000XM5 無線降噪耳機",
        price: 6800,
        originalPrice: null,
        images: ["/images/marketplace/headphone.jpg"],
        condition: "new" as ItemCondition,
        category: "電子產品",
        seller: { id: "user-003", name: "音響發燒友", rating: 4.9 },
        location: "台中市",
        createdAt: "2025-03-13T09:00:00Z",
        status: "active",
      },
      {
        id: "item-004",
        title: "IKEA KALLAX 層架組 4x4 (白色)",
        price: 2500,
        originalPrice: 3990,
        images: ["/images/marketplace/shelf.jpg"],
        condition: "used" as ItemCondition,
        category: "家具",
        seller: { id: "user-004", name: "居家改造王", rating: 4.3 },
        location: "台北市",
        createdAt: "2025-03-12T16:45:00Z",
        status: "active",
      },
      {
        id: "item-005",
        title: "Nintendo Switch OLED 薩爾達同捆機",
        price: 10800,
        originalPrice: 12580,
        images: ["/images/marketplace/switch.jpg"],
        condition: "refurbished" as ItemCondition,
        category: "遊戲",
        seller: { id: "user-005", name: "遊戲收藏家", rating: 4.7 },
        location: "高雄市",
        createdAt: "2025-03-11T11:30:00Z",
        status: "active",
      },
      {
        id: "item-006",
        title: "Garmin Forerunner 265 運動手錶",
        price: 9500,
        originalPrice: null,
        images: ["/images/marketplace/watch.jpg"],
        condition: "new" as ItemCondition,
        category: "電子產品",
        seller: { id: "user-006", name: "跑步愛好者", rating: 4.6 },
        location: "桃園市",
        createdAt: "2025-03-10T08:15:00Z",
        status: "active",
      },
    ];

    // 篩選邏輯
    let filtered = [...allItems];
    if (category) {
      filtered = filtered.filter((item) => item.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.seller.name.toLowerCase().includes(q)
      );
    }
    if (condition) {
      filtered = filtered.filter((item) => item.condition === condition);
    }

    // 分頁
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);
    const hasMore = page < totalPages;

    return NextResponse.json(
      {
        success: true,
        data: {
          items: paginated,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasMore,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Marketplace items error:", error);
    return NextResponse.json(
      { success: false, error: "無法獲取商品列表" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketplace/items
 * 刊登商品（Mock）
 * Body: { title, price, condition, category, description }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, price, condition, category, description } = body;

    // 參數驗證
    if (!title || !price || !condition || !category) {
      return NextResponse.json(
        {
          success: false,
          error: "請填寫所有必填欄位（title, price, condition, category）",
        },
        { status: 400 }
      );
    }

    if (typeof price !== "number" || price <= 0) {
      return NextResponse.json(
        { success: false, error: "價格必須為正數" },
        { status: 400 }
      );
    }

    const validConditions = ["new", "used", "refurbished"];
    if (!validConditions.includes(condition)) {
      return NextResponse.json(
        {
          success: false,
          error: `無效的商品狀態。有效值: ${validConditions.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // 模擬建立商品
    const newItem = {
      id: `item-${Date.now()}`,
      title,
      price,
      condition,
      category,
      description: description || "",
      seller: { id: "user-current", name: "目前用戶", rating: 5.0 },
      location: "未指定",
      createdAt: new Date().toISOString(),
      status: "active",
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          item: newItem,
          message: "商品刊登成功",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Marketplace item create error:", error);
    return NextResponse.json(
      { success: false, error: "無法刊登商品" },
      { status: 500 }
    );
  }
}
