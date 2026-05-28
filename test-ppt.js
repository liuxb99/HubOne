const { chromium } = require("playwright");
const { mkdirSync } = require("fs");

(async () => {
  mkdirSync("screenshots", { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // 監聽 console 錯誤
  const errors = [];
  page.on("pageerror", (err) => errors.push(`PAGE ERROR: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`CONSOLE ERROR: ${msg.text()}`);
  });

  const step = async (name, fn) => {
    try {
      await fn();
      console.log(`  ✅ ${name}`);
    } catch (e) {
      console.log(`  ❌ ${name}: ${e.message}`);
      errors.push(`TEST FAIL: ${name}: ${e.message}`);
    }
    await page.screenshot({ path: `screenshots/${name.replace(/[^a-z0-9]/gi, "_")}.png` });
  };

  await step("1. 打開 PPT 頁面", async () => {
    await page.goto("http://localhost:3000/ppt", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
  });

  await step("2. 點擊「新增投影片」", async () => {
    const addBtn = await page.$('text=新增投影片');
    if (!addBtn) throw new Error("找不到「新增投影片」按鈕");
    await addBtn.click();
    await page.waitForTimeout(500);
    // 點擊兩次新增第2、3頁
    const addBtn2 = await page.$('text=新增投影片');
    if (addBtn2) await addBtn2.click();
    await page.waitForTimeout(500);
    const addBtn3 = await page.$('text=新增投影片');
    if (addBtn3) await addBtn3.click();
    await page.waitForTimeout(500);
  });

  await step("3. 點擊工具列「新增文字框」", async () => {
    const textBtn = await page.$('button[title="新增文字框"]');
    if (!textBtn) throw new Error("找不到「新增文字框」按鈕");
    await textBtn.click();
    await page.waitForTimeout(500);
  });

  await step("4. 點擊「新增形狀」", async () => {
    const shapeBtn = await page.$('button[title="新增形狀"]');
    if (!shapeBtn) throw new Error("找不到「新增形狀」按鈕");
    await shapeBtn.click();
    await page.waitForTimeout(500);
  });

  await step("5. 打開模板選擇器", async () => {
    const templateBtn = await page.$('button[title*="模板"]');
    if (!templateBtn) throw new Error("找不到模板按鈕");
    await templateBtn.click();
    await page.waitForTimeout(800);
  });

  await step("6. 選擇模板並套用", async () => {
    // 點擊第二個模板
    const templateCards = await page.$$('[class*="rounded-xl"][class*="border"]');
    if (templateCards.length >= 2) {
      await templateCards[1].click();
      await page.waitForTimeout(300);
    }
    const applyBtn = await page.$('text=套用模板');
    if (applyBtn) {
      await applyBtn.click();
      await page.waitForTimeout(500);
    } else {
      throw new Error("找不到「套用模板」按鈕");
    }
  });

  await step("7. 點擊「放映」", async () => {
    const presentBtn = await page.$('button:has-text("放映")');
    if (!presentBtn) throw new Error("找不到「放映」按鈕");
    await presentBtn.click();
    await page.waitForTimeout(500);
  });

  await step("8. 放映模式切換投影片", async () => {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(300);
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(300);
    // 退出放映
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  });

  await step("9. 點擊「匯出」", async () => {
    const exportBtn = await page.$('button:has-text("匯出")');
    if (!exportBtn) throw new Error("找不到「匯出」按鈕");
    await exportBtn.click();
    await page.waitForTimeout(500);
  });

  await step("10. 切換投影片縮圖", async () => {
    const thumbnails = await page.$$('[class*="cursor-pointer"][class*="rounded-lg"]');
    if (thumbnails.length >= 2) {
      await thumbnails[1].click();
      await page.waitForTimeout(300);
    }
  });

  await step("11. 編輯簡報標題", async () => {
    const titleEl = await page.$('text=未命名簡報');
    if (titleEl) {
      await titleEl.click();
      await page.waitForTimeout(300);
      // Type new title
      const input = await page.$('input');
      if (input) {
        await input.fill("測試簡報");
        await page.keyboard.press("Enter");
        await page.waitForTimeout(300);
      }
    }
  });

  await browser.close();

  // 輸出結果
  console.log("\n========== 測試結果 ==========");
  if (errors.length === 0) {
    console.log("🎉 全部通過！無任何錯誤！");
  } else {
    console.log(`⚠️ 有 ${errors.length} 個錯誤：`);
    errors.forEach((e) => console.log(`  ${e}`));
  }
})();
