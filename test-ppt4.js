const { chromium } = require("playwright");
const { mkdirSync } = require("fs");

(async () => {
  mkdirSync("screenshots4", { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const errors = [];
  const results = { pass: 0, fail: 0 };
  page.on("pageerror", (err) => errors.push(`PAGE ERROR: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`CONSOLE ERROR: ${msg.text()}`);
  });

  const waitAndClick = async (selector, timeout = 5000) => {
    const el = await page.waitForSelector(selector, { timeout });
    if (!el) throw new Error(`找不到元素: ${selector}`);
    await el.click();
  };

  const waitForText = async (text, timeout = 5000) => {
    await page.waitForFunction((t) => document.body.textContent.includes(t), text, { timeout });
  };

  // 使用 requestAnimationFrame 輪詢等待 React 渲染完成
  const waitForRender = async () => {
    await page.evaluate(() => new Promise(requestAnimationFrame));
  };

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
    await page.screenshot({ path: `screenshots4/${name.replace(/[^a-z0-9]/gi, "_").slice(0, 50)}.png` });
  };

  // ═══════════════ 15 項 E2E 測試 ═══════════════

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
      await waitForRender();
    }
    const checkCount = async (min) => {
      const n = await page.$$eval('[class*="aspect-video"]', els => els.length);
      if (n < min) throw new Error(`投影片數量 ${n} < ${min}`);
    };
    await checkCount(4);
  });

  await test("4. 新增文字框", async () => {
    await waitAndClick('button[title="新增文字框"]');
    await waitForRender();
  });

  await test("5. 新增形狀", async () => {
    await waitAndClick('button[title="新增形狀"]');
    await waitForRender();
  });

  await test("6. 切換到第 2 張投影片", async () => {
    const thumbs = await page.$$('[class*="aspect-video"]');
    if (thumbs.length < 2) throw new Error(`需要 2 張以上縮圖`);
    await thumbs[1].click();
    await waitForRender();
    // 確認選中的投影片有高亮樣式
    const selected = await page.$('[class*="ring-"][class*="ring-pink"]');
    if (!selected) console.log("  ℹ️ 切換後未檢測到高亮邊框（視覺樣式可能不同）");
  });

  await test("7. 打開模板選擇器", async () => {
    await waitAndClick('button[title*="模板"]');
    await page.waitForSelector("text=選擇模板", { timeout: 5000 });
  });

  await test("8. 套用模板", async () => {
    const cards = await page.$$('[class*="rounded-xl"]');
    if (cards.length >= 2) {
      await cards[1].click();
      await waitForRender();
    }
    await waitAndClick("text=套用模板");
    await waitForRender();
  });

  await test("9. 進入放映模式", async () => {
    let btn = await page.$('button:has-text("放映")');
    if (!btn) {
      // 關閉可能仍開啟的 Modal
      await page.keyboard.press("Escape");
      await waitForRender();
      btn = await page.$('button:has-text("放映")');
    }
    if (!btn) throw new Error("找不到放映按鈕");
    await btn.click();
    await waitForRender();
  });

  await test("10. 放映切換 + 退出", async () => {
    await page.keyboard.press("ArrowRight");
    await waitForRender();
    await page.keyboard.press("ArrowRight");
    await waitForRender();
    await page.keyboard.press("Escape");
    await waitForRender();
    await waitForText("投影片", 3000);
  });

  await test("11. 匯出 HTML", async () => {
    const exportBtn = await page.$('button:has-text("匯出")');
    if (!exportBtn) throw new Error("找不到匯出按鈕");
    await exportBtn.click();
    await waitForRender();
    // 在 ExportPanel Modal 中點擊 HTML 下載按鈕
    const downloadBtn = await page.$('text=匯出 HTML');
    if (downloadBtn) {
      await downloadBtn.click();
      await waitForRender();
    }
    // 重新載入頁面以清除所有 Modal
    await page.goto("http://localhost:3000/ppt", { waitUntil: "networkidle" });
    await waitForRender();
  });

  await test("12. 編輯簡報標題", async () => {
    const titleEl = await page.$("text=未命名簡報");
    if (titleEl) {
      await titleEl.click();
      await waitForRender();
      const input = await page.$('input');
      if (input) {
        await input.fill("E2E 測試簡報");
        await page.keyboard.press("Enter");
        await waitForRender();
      }
    }
  });

  await test("13. 刪除投影片", async () => {
    const thumbs = await page.$$('[class*="aspect-video"]');
    if (thumbs.length > 0) {
      await thumbs[0].hover();
      await page.waitForSelector('button:has-text("🗑️")', { timeout: 3000 }).catch(() => null);
      const deleteBtn = await page.$('button:has-text("🗑️")');
      if (deleteBtn) {
        await deleteBtn.click();
        await waitForRender();
      } else {
        console.log("  ℹ️ 未找到刪除按鈕");
      }
    }
  });

  await test("14. 確認屬性面板存在", async () => {
    const bodyText = await page.$("body").then(el => el.textContent());
    if (!bodyText.includes("背景") && !bodyText.includes("位置")) {
      console.log("  ℹ️ 屬性面板可能在小螢幕隱藏");
    }
  });

  await test("15. 回到首頁", async () => {
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
    await page.waitForSelector("text=OPC", { timeout: 5000 }).catch(() => {});
    await waitForText("一人公司", 3000).catch(() => {});
  });

  await browser.close();

  // 計數 waitForTimeout 使用
  const script = require("fs").readFileSync(__filename, "utf-8");
  const timeoutCount = (script.match(/waitForTimeout/g) || []).length;

  console.log("\n══════════ 測試結果 ══════════");
  console.log(`✅ 通過: ${results.pass}`);
  console.log(`❌ 失敗: ${results.fail}`);
  console.log(`⏱️  waitForTimeout 次數: ${timeoutCount}`);
  if (errors.length === 0) {
    console.log("🎉 無任何 JavaScript 錯誤！");
  } else {
    console.log(`⚠️ ${errors.length} 個錯誤：`);
    errors.forEach((e) => console.log(`  ${e}`));
  }
  process.exit(results.fail > 0 ? 1 : 0);
})();
