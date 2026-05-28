import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 開始種子資料填寫...");

  // ── 1. 預設管理員帳號 ──
  const adminEmail = "admin@opc.tw";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  let adminId: string;
  if (existingAdmin) {
    console.log("👤 管理員已存在，跳過建立");
    adminId = existingAdmin.id;
  } else {
    const hashedPassword = await bcrypt.hash("Admin@123456", 12);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "站長",
        password: hashedPassword,
        avatar: "/avatars/admin.png",
      },
    });
    adminId = admin.id;
    console.log("✅ 管理員帳號建立成功:", admin.email);
  }

  // ── 2. 測試遊戲分數 ──
  const gameList = [
    "tetris",
    "snake",
    "minesweeper",
    "game2048",
    "breakout",
    "pacman",
    "invaders",
    "flappybird",
    "memory",
    "shooter",
  ] as const;

  // 刪除此 user 的舊分數，避免重複執行時疊加
  await prisma.gameScore.deleteMany({ where: { userId: adminId } });

  const scoresData = gameList.map((game) => ({
    userId: adminId,
    game,
    score: Math.floor(Math.random() * 5000) + 500,
    level: Math.floor(Math.random() * 10) + 1,
  }));

  for (const data of scoresData) {
    await prisma.gameScore.create({ data });
  }
  console.log(`🎮 已為管理員建立 ${scoresData.length} 筆遊戲測試分數`);

  // ── 3. 測試用一般用戶（選用） ──
  const testEmail = "test@opc.tw";
  const existingTest = await prisma.user.findUnique({
    where: { email: testEmail },
  });

  if (!existingTest) {
    const hashedPassword = await bcrypt.hash("Test@123456", 12);
    const testUser = await prisma.user.create({
      data: {
        email: testEmail,
        name: "測試用戶",
        password: hashedPassword,
      },
    });
    console.log("✅ 測試用戶建立成功:", testUser.email);

    // 也為測試用戶建立幾筆分數
    for (const game of gameList.slice(0, 3)) {
      await prisma.gameScore.create({
        data: {
          userId: testUser.id,
          game,
          score: Math.floor(Math.random() * 3000) + 200,
          level: Math.floor(Math.random() * 5) + 1,
        },
      });
    }
    console.log("🎮 已為測試用戶建立 3 筆遊戲分數");
  } else {
    console.log("👤 測試用戶已存在，跳過");
  }

  console.log("🎉 種子資料填寫完成！");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
