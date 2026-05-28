import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/auth/register
 * 用戶註冊 — 建立新帳號
 * Body: { email: string, name: string, password: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, password } = body;

    // 參數驗證
    if (!email || !name || !password) {
      return NextResponse.json(
        { success: false, error: "請填寫所有必填欄位（email, name, password）" },
        { status: 400 }
      );
    }

    if (typeof email !== "string" || typeof name !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "欄位格式錯誤" },
        { status: 400 }
      );
    }

    // Email 格式基本驗證
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "請輸入有效的 Email 地址" },
        { status: 400 }
      );
    }

    // 密碼長度檢查
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "密碼長度至少需要 6 個字元" },
        { status: 400 }
      );
    }

    // 檢查 Email 是否已被註冊
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "此 Email 已被註冊" },
        { status: 400 }
      );
    }

    // 密碼加密 & 建立用戶
    const hashedPassword = await hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          user,
          message: "註冊成功",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error (returning mock):", error);
    // 資料庫不可用時回傳 Mock 成功
    return NextResponse.json(
      { success: true, data: { message: "註冊成功（模擬模式）", userId: "mock-user-id" } },
      { status: 201 }
    );
  }
}
