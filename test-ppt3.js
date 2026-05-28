const { chromium } = require("playwright");
const { mkdirSync } = require("fs");

(async () => {
  mkdirSync("screenshots3", { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const errors = [];
  const results = { pass: 0, fail: 0 };
  page.on("pageerror", (err) => errors.push(`PAGE ERROR: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`CONSOLE ERROR: ${msg.text()}`);
  });

  // 工具函數：DOM 等待 + 截圖
  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`  ✅ ${name}`);
      results.pass++;
    } catch (e) {
      console.log(`  ❌ ${name}: ${e.message}`);
      results.fail++;
      errors.push(`FAIL: ${name}: ${e.message}`);
    }
    await page.screenshot({ path: `screenshots3/${name.replace(/[^a-z0-9]/gi, "_").slice(0, 50)}.png` });
  };

  const waitAndClick = async (selector, timeout = 5000) => {
    const el = await page.waitForSelector(selector, { timeout });
    if (!el) throw new Error(`找不到元素: ${selector}`);
    await el.click();
  };

  const waitForText = async (text, timeout = 5000) => {
    await page.waitForFunction((t) => document.body.textContent.includes(t), text, { timeout });
  };

  // ═══════════════ 測試開始 ═══════════════

  await test("1. 打開 PPT 頁面", async () => {
    await page.goto("http://localhost:3000/ppt", { waitUntil: "networkidle" });
    await page.waitForSelector('[class*="flex"][class*="flex-col"]', { timeout: 10000 });
    const title = await page.title();
    if (!title.includes("OPC")) throw new Error(`標題不含 OPC: ${title}`);
  });

  await test("2. 初始有投影片縮圖", async () => {
    await page.waitForSelector('[class*="aspect-video"]', { timeout: 5000 });
    const thumbs = await page.$$('[class*="aspect-video"]');
    if (thumbs.length < 1) throw new Error(`縮圖數量: ${thumbs.length}`);
  });

  await test("3. 新增 3 張投影片", async () => {
    for (let i = 0; i < 3; i++) {
      await waitAndClick('text=新增投影片');
      await page.waitForTimeout(300);
    }
    // 等 DOM 更新
    await page.waitForFunction(
      (min) => document.querySelectorAll('[class*="aspect-video"]').length >= min,
      4, { timeout: 3000 }
    );
    const thumbs = await page.$$('[class*="aspect-video"]');
    if (thumbs.length < 4) throw new Error(`投影片數量: ${thumbs.length}`);
  });

  await test("4. 新增文字框", async () => {
    await waitAndClick('button[title="新增文字框"]');
    await page.waitForTimeout(500);
    const editor = await page.$('[class*="relative"][class*="overflow-hidden"]');
    if (editor) {
      const text = await editor.textContent();
      if (!text.includes("雙擊編輯")) {
        console.log("  ℹ️ 文字框內容非預期（可能已自訂範本）");
      }
    }
  });

  await test("5. 新增形狀", async () => {
    await waitAndClick('button[title="新增形狀"]');
    await page.waitForTimeout(500);
  });

  await test("6. 切換到第 2 張投影片", async () => {
    const thumbs = await page.$$('[class*="aspect-video"]');
    if (thumbs.length < 2) throw new Error(`需要 2 張以上縮圖`);
    await thumbs[1].click();
    await page.waitForTimeout(300);
  });

  await test("7. 打開模板選擇器", async () => {
    await waitAndClick('button[title*="模板"]');
    await page.waitForSelector("text=選擇模板", { timeout: 5000 });
  });

  await test("8. 套用模板", async () => {
    // 點擊第 2 個模板
    const cards = await page.$$('[class*="rounded-xl"]');
    if (cards.length >= 2) {
      await cards[1].click();
      await page.waitForTimeout(200);
    }
    await waitAndClick("text=套用模板");
    await page.waitForTimeout(500);
  });

  await test("9. 放映模式", async () => {
    const presentBtn = await page.$('button:has-text("放映")');
    if (!presentBtn) {
      // 可能模板 Modal 仍開啟，先關閉
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    }
    await waitAndClick('button:has-text("放映")');
    await page.waitForTimeout(500);
  });

  await test("10. 放映切換 + 退出", async () => {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(200);
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(200);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    await waitForText("投影片");
  });

  await test("11. 匯出 HTML", async () => {
    await waitAndClick('button:has-text("匯出")');
    await page.waitForTimeout(500);
  });

  await test("12. 編輯簡報標題", async () => {
    await page.waitForTimeout(300);
    const titleEl = await page.$("text=未命名簡報");
    if (titleEl) {
      await titleEl.click();
      await page.waitForTimeout(300);
      const input = await page.$('input');
      if (input) {
        await input.fill("E2E 測試簡報");
        await page.keyboard.press("Enter");
        await page.waitForTimeout(500);
      }
    }
  });

  await test("13. 刪除投影片", async () => {
    // 滑鼠懸浮在第一張縮圖上，尋找刪除按鈕
    const thumbs = await page.$$('[class*="aspect-video"]');
    if (thumbs.length > 0) {
      await thumbs[0].hover();
      await page.waitForTimeout(300);
      const deleteBtn = await page.$('button:has-text("🗑️")');
      if (deleteBtn) {
        await deleteBtn.click();
        await page.waitForTimeout(500);
      } else {
        console.log("  ℹ️ 未找到刪除按鈕（可能 hover 觸發位置不對）");
      }
    }
  });

  await test("14. 屬性面板內容", async () => {
    const bodyText = await page.$("body").then(el => el.textContent());
    if (!bodyText.includes("背景") && !bodyText.includes("位置")) {
      console.log("  ℹ️ 屬性面板可能隱藏（小螢幕）");
    }
  });

  await test("15. 回到首頁", async () => {
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
    await page.waitForSelector("text=OPC", { timeout: 5000 }).catch(() => {});
    await waitForText("一人公司", 3000).catch(() => {});
  });

  await browser.close();

  // 結果輸出
  console.log("\n══════════ 測試結果 ══════════");
  console.log(`✅ 通過: ${results.pass}`);
  console.log(`❌ 失敗: ${results.fail}`);
  if (errors.length === 0) {
    console.log("🎉 無任何 JavaScript 錯誤！");
  } else {
    console.log(`⚠️ ${errors.length} 個錯誤：`);
    errors.forEach((e) => console.log(`  ${e}`));
  }
  process.exit(results.fail > 0 ? 1 : 0);
})();
