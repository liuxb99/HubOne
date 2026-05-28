import { NextResponse } from "next/server";

/**
 * NextAuth 路由處理
 * 此功能尚未實作，預計在後續階段使用 next-auth 套件完成配置
 *
 * 計劃實作內容：
 * - Credentials Provider（Email + Password 登入）
 * - Google OAuth Provider（可選）
 * - JWT Session 策略
 * - 會話狀態與角色管理
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "NextAuth 尚未配置，請聯繫管理員",
    },
    { status: 501 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "NextAuth 尚未配置，請聯繫管理員",
    },
    { status: 501 }
  );
}
