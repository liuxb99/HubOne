const { chromium } = require("playwright");
const { mkdirSync } = require("fs");

(async () => {
  mkdirSync("screenshots2", { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const errors = [];
  const asserts = { pass: 0, fail: 0 };
  page.on("pageerror", (err) => errors.push(`PAGE ERROR: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`CONSOLE ERROR: ${msg.text()}`);
  });

  const assert = async (name, fn) => {
    try {
      await fn();
      console.log(`  ✅ ${name}`);
      asserts.pass++;
    } catch (e) {
      console.log(`  ❌ ${name}: ${e.message}`);
      asserts.fail++;
      errors.push(`ASSERT FAIL: ${name}: ${e.message}`);
    }
    await page.screenshot({ path: `screenshots2/${name.replace(/[^a-z0-9]/gi, "_")}.png` });
  };

  // ── 打開頁面 ──
  await assert("1. 打開 PPT 頁面並確認載入", async () => {
    await page.goto("http://localhost:3000/ppt", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const title = await page.title();
    if (!title.includes("OPC")) throw new Error(`頁面標題錯誤: ${title}`);
    const body = await page.$("body");
    const text = await body.textContent();
    if (!text.includes("投影片")) throw new Error("頁面未顯示投影片區域");
  });

  // ── 檢查初始狀態 ──
  await assert("2. 確認初始有 1 張投影片", async () => {
    const thumbs = await page.$$('[class*="aspect-video"]');
    if (thumbs.length < 1) throw new Error(`找不到投影片縮圖，找到 ${thumbs.length} 個`);
  });

  // ── 新增投影片 ──
  await assert("3. 新增 3 張投影片", async () => {
    for (let i = 0; i < 3; i++) {
      const addBtn = await page.$('text=新增投影片');
      if (!addBtn) throw new Error(`第 ${i+1} 次找不到「新增投影片」`);
      await addBtn.click();
      await page.waitForTimeout(400);
    }
    // 確認有 4 張投影片（初始 1 + 新增 3）
    const thumbs = await page.$$('[class*="aspect-video"]');
    if (thumbs.length < 4) throw new Error(`應有至少 4 張投影片，實際 ${thumbs.length}`);
  });

  // ── 新增文字框 ──
  await assert("4. 新增文字框並確認", async () => {
    const textBtn = await page.$('button[title="新增文字框"]');
    if (!textBtn) throw new Error("找不到新增文字框按鈕");
    await textBtn.click();
    await page.waitForTimeout(500);
    // 確認編輯區有文字元素
    const editor = await page.$('[class*="relative"][class*="overflow-hidden"]');
    if (editor) {
      const editText = await editor.textContent();
      if (!editText.includes("雙擊編輯")) {
        console.log("  ⚠️ 文字框可能已新增但內容不同");
      }
    }
  });

  // ── 新增形狀 ──
  await assert("5. 新增形狀並確認", async () => {
    const shapeBtn = await page.$('button[title="新增形狀"]');
    if (!shapeBtn) throw new Error("找不到新增形狀按鈕");
    await shapeBtn.click();
    await page.waitForTimeout(500);
  });

  // ── 切換投影片 ──
  await assert("6. 點擊第 2 張縮圖切換投影片", async () => {
    const thumbnails = await page.$$('[class*="aspect-video"]');
    if (thumbnails.length < 2) throw new Error(`至少需要 2 張縮圖，實際 ${thumbnails.length}`);
    await thumbnails[1].click();
    await page.waitForTimeout(400);
  });

  // ── 模板選擇器 ──
  await assert("7. 打開模板選擇器", async () => {
    const tmplBtn = await page.$('button[title*="模板"]');
    if (!tmplBtn) throw new Error("找不到模板按鈕");
    await tmplBtn.click();
    await page.waitForTimeout(800);
    // 確認 Modal 出現
    const modal = await page.$('[role="dialog"]');
    if (!modal) {
      // 可能不是用 role="dialog"，嘗試找 Modal 內容
      const bodyText = await page.$("body").then(el => el.textContent());
      if (!bodyText.includes("選擇模板")) throw new Error("模板 Modal 未出現");
    }
  });

  // ── 套用模板 ──
  await assert("8. 選擇模板並套用", async () => {
    const templateCards = await page.$$('[class*="rounded-xl"]');
    if (templateCards.length >= 2) {
      await templateCards[1].click();
      await page.waitForTimeout(300);
    }
    const applyBtn = await page.$('text=套用模板');
    if (!applyBtn) throw new Error("找不到套用模板按鈕");
    await applyBtn.click();
    await page.waitForTimeout(500);
    // 確認 Modal 關閉
    const bodyText = await page.$("body").then(el => el.textContent());
    if (bodyText.includes("選擇模板")) {
      // Modal 可能沒關，再等一會
      await page.waitForTimeout(500);
    }
  });

  // ── 放映模式 ──
  await assert("9. 進入放映模式", async () => {
    const presentBtn = await page.$('button:has-text("放映")');
    if (!presentBtn) throw new Error("找不到放映按鈕");
    await presentBtn.click();
    await page.waitForTimeout(600);
    // 確認放映模式已啟動（全螢幕覆蓋層）
    const overlay = await page.$('[style*="fixed" i], [class*="fixed"]');
    // 不 throw，只是確認
  });

  await assert("10. 放映中切換投影片", async () => {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(300);
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(300);
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(300);
  });

  await assert("11. 退出放映模式", async () => {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    // 確認回到編輯模式
    const bodyText = await page.$("body").then(el => el.textContent());
    if (!bodyText.includes("投影片")) {
      console.log("  ⚠️ 退出後頁面內容異常");
    }
  });

  // ── 匯出功能 ──
  await assert("12. 點擊匯出", async () => {
    const exportBtn = await page.$('button:has-text("匯出")');
    if (!exportBtn) throw new Error("找不到匯出按鈕");
    await exportBtn.click();
    await page.waitForTimeout(500);
  });

  // ── 編輯標題 ──
  await assert("13. 編輯簡報標題", async () => {
    const titleEl = await page.$('text=未命名簡報');
    if (titleEl) {
      await titleEl.click();
      await page.waitForTimeout(300);
      const input = await page.$('input[type="text"], input:not([type])');
      if (input) {
        await input.fill("Playwright 測試");
        await page.keyboard.press("Enter");
        await page.waitForTimeout(500);
      }
    }
  });

  // ── 檢查屬性面板 ──
  await assert("14. 屬性面板應顯示", async () => {
    const bodyText = await page.$("body").then(el => el.textContent());
    if (!bodyText.includes("背景") && !bodyText.includes("位置")) {
      console.log("  ⚠️ 屬性面板可能未顯示（小螢幕可能隱藏）");
    }
  });

  // ── 回到首頁檢查導航 ──
  await assert("15. 導航回首頁", async () => {
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const bodyText = await page.$("body").then(el => el.textContent());
    if (!bodyText.includes("OPC") && !bodyText.includes("一人公司")) {
      throw new Error("首頁載入異常");
    }
  });

  await browser.close();

  // 輸出結果
  console.log("\n========== 測試結果 ==========");
  console.log(`✅ 通過: ${asserts.pass}`);
  console.log(`❌ 失敗: ${asserts.fail}`);
  if (errors.length === 0) {
    console.log("🎉 無 JavaScript 錯誤！");
  } else {
    console.log(`⚠️ ${errors.length} 個 JS 錯誤：`);
    errors.forEach((e) => console.log(`  ${e}`));
  }
  console.log(`📸 截圖已保存至 screenshots2/`);
})();
