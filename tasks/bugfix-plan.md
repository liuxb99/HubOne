# 🐛 Bug 修復計劃

> 基於全站測試結果（9/9 頁面 ✅、API 部分失敗 ❌）制定的修復方案。  
> 日期：2025-07-16

---

## 📋 問題總覽

| # | 問題 | 嚴重性 | 影響範圍 | 優先級 |
|---|------|--------|----------|--------|
| 1 | **資料庫未連線** — `/api/auth/register` 500 | 🔴 高 | 註冊功能完全失效 | **P0** |
| 2 | **資料庫未連線** — `/api/games/scores` (GET/POST) 500 | 🔴 高 | 排行榜 API 完全失效 | **P0** |
| 3 | **NextAuth 未實作** — `[...nextauth]` 回傳 501 | 🟡 中 | 登入流程無法對接後端 | **P1** |
| 4 | **B/I/U 使用已棄用 execCommand** — `TextView.tsx:155` | 🟢 低 | 長期相容性風險 | **P2** |
| 5 | **無資料庫** — 所有遊戲分數無法持久化 | 🟡 中 | 排行榜無真實數據 | **P1** |

---

## 🔍 各問題詳細分析

### P0 — 問題 1 & 2：Prisma 資料庫未連線（API 500）

**根因：**
- `prisma/schema.prisma` 設定 `provider = "postgresql"`，`DATABASE_URL` 指向 `localhost:5432`
- 本地開發環境**未啟動 PostgreSQL**，Prisma Client 初始化時連線失敗
- 兩個 API route 直接呼叫 `prisma.*`，未做連線檢查或降級處理：
  - `src/app/api/auth/register/route.ts:41` → `prisma.user.findUnique`
  - `src/app/api/games/scores/route.ts` → 多處 `prisma.gameScore.*`
- `prisma/` 目錄下**無 `migrations/` 資料夾**（尚未執行 `prisma migrate`），即使 PostgreSQL 啟動也缺少資料表

**影響：**
- 用戶無法註冊新帳號（回傳 500 +「伺服器內部錯誤」）
- 排行榜 API 完全無法使用（GET 回傳 500、POST 回傳 500）
- 前端 `useGameScore` hook 雖有 try/catch 降級到 localStorage（`src/hooks/useGameScore.ts:84-88`），但仍會浪費一次失敗請求

**修復方案選擇：**

| 方案 | 說明 | 優點 | 缺點 |
|------|------|------|------|
| **A: 安裝 PostgreSQL** | 本地啟動 PG + 執行 `prisma migrate` + `prisma db push` | 完全符合原始架構設計 | 需安裝/管理 PG 服務；對僅展示用專案負擔過重 |
| **B: Mock 降級模式** | API 在 DB 不可用時回退到記憶體/檔案模擬 | 零外部依賴；前端已有降級邏輯可對接 | 重啟後資料消失；偏離 Prisma 設計 |

**建議：方案 B（Mock 降級）**，原因：
1. 該專案為功能展示型網站，非生產環境
2. 前端 `useGameScore` hook 已有完整 localStorage 降級機制（`src/hooks/useGameScore.ts:56-110`）
3. 統一改用 SQLite 做開發資料庫，Prisma 切換 provider 只需改一行 + `prisma generate`

---

### P1 — 問題 3：NextAuth 回傳 501

**根因：**
- `src/app/api/auth/[...nextauth]/route.ts` 是 stub 實作：
  ```ts
  export async function GET() {
    return NextResponse.json({ success: false, error: "NextAuth 尚未配置" }, { status: 501 });
  }
  ```
- `next-auth` 套件已安裝（`package.json` 中 `"next-auth": "^4.24.0"`）
- 登入頁面（`src/app/(auth)/login/`）和註冊頁面（`src/app/(auth)/register/`）已存在，但缺少 NextAuth Provider wrapper 和配置檔

**影響：**
- 登入功能只能在前端做 UI 展示，無法實際驗證用戶身份
- `useGameScore` 中的 `userId: "anonymous"` 無法替換為真實用戶 ID
- 無法建立「用戶 → 遊戲分數」的關聯

**修復方向：**
- 建立 `src/auth.ts`（或 `src/lib/auth.ts`）NextAuth 配置，啟用 Credentials Provider
- 將註冊 API（已存在）串接到 NextAuth 的 signIn 流程
- 在 `src/app/layout.tsx` 加入 `SessionProvider`

---

### P1 — 問題 5：遊戲分數無持久化

**根因：**
- 與問題 2 同一根源 — 資料庫不可用
- 前端已實作完整的 localStorage 降級方案（`src/hooks/useGameScore.ts`），但：
  - 提交分數時會先嘗試 POST API（必定失敗），浪費一次請求
  - 排行榜載入時同樣先嘗試 GET API（必定失敗），導致延遲
  - 各遊戲元件（`Breakout.tsx`, `Snake.tsx`, `Tetris.tsx` 等）皆透過 `useGameScore` 提交分數

**影響：**
- 所有 10 款遊戲的分數提交 → API 失敗 → 降級到 localStorage
- 排行榜只顯示本地資料，不同瀏覽器/裝置之間無法共享

**修復方向：**
- 與問題 2 綁定，解決資料庫問題後自然修復
- 短期可在 `useGameScore` 跳過 API 呼叫，直接寫 localStorage（減少無謂請求）

---

### P2 — 問題 4：execCommand 已棄用

**根因：**
- `src/components/ppt/TextView.tsx:155`：
  ```ts
  const applyFormat = useCallback(
    (command: string, value?: string) => {
      document.execCommand(command, false, value);
      editorRef.current?.focus();
    },
    []
  );
  ```
- `document.execCommand` 自 2020 年起被各大瀏覽器標記為 deprecated
- 附件問題：內容透過 `innerHTML` 讀取（`onInput` handler），會混雜 `<b>`/`<i>`/`<u>` 標籤與 plain text

**影響：**
- 目前仍可在多數瀏覽器運作，但無法保證長期相容
- 若瀏覽器移除 execCommand，B/I/U 按鈕將完全失效
- 內容中混入 HTML 標籤，可能影響跨編輯器相容性

**修復方向：**
- 方案一（輕量）：改用 `document.queryCommandState` + 自訂選單操作 Range/Selection API
- 方案二（推薦）：引入 TipTap（基於 ProseMirror）管理文字編輯狀態，完全取代 contentEditable

---

## 📌 修復優先級 & 時程建議

```
P0 ─┬─ 問題 1 (註冊 API 500) ── Mock 降級模式
    └─ 問題 2 (排行榜 API 500) ─ Mock 降級模式
         ├─ 問題 5 (分數無法持久化) → 跟隨問題 2 自動修復
         │
P1 ─┬─ 問題 3 (NextAuth 501)
    │
P2 └─ 問題 4 (execCommand 棄用)
```

---

## 🛠️ 詳細修復步驟

### Step 1 (P0)：切換 Prisma 至 SQLite + Mock 降級

**目標：** 讓 API 在無外部資料庫時能正常回應

**檔案修改：**

| 檔案 | 修改內容 |
|------|----------|
| `prisma/schema.prisma` | `provider = "postgresql"` → `provider = "sqlite"`，`url` → `file:./dev.db` |
| `.env` | `DATABASE_URL="file:./prisma/dev.db"` |
| `src/lib/prisma.ts` | 初始化時加入連線測試，失敗時回傳 mock 物件 |
| `src/app/api/auth/register/route.ts` | 包裝 `prisma` 呼叫，DB 不可用時使用記憶體 Map 模擬 |
| `src/app/api/games/scores/route.ts` | 同上，DB 不可用時使用記憶體 Map 儲存分數 |

**新增檔案：**

| 檔案 | 說明 |
|------|------|
| `src/lib/db-mock.ts` | 記憶體 Mock 資料庫：包含 user Map、gameScore Map，實作 findUnique、create、count、findMany 等必要方法 |
| `prisma/dev.db` | SQLite 資料庫檔案（透過 `prisma db push` 產生） |

**命題執行順序：**
```bash
# 1. 修改 schema 後重新 generate
npx prisma generate

# 2. 建立 SQLite 資料表
npx prisma db push

# 3. 可選：填入種子資料
npm run db:seed
```

**驗收標準：**
- `curl -X POST localhost:3000/api/auth/register` 回傳 201
- `curl localhost:3000/api/games/scores?game=tetris` 回傳 200 + 排行榜資料
- `curl -X POST localhost:3000/api/games/scores` 回傳 201

---

### Step 2 (P1)：實作 NextAuth 配置

**目標：** 讓登入/註冊流程完整串接

**檔案修改/新增：**

| 檔案 | 說明 |
|------|------|
| `src/auth.ts` **(新)** | NextAuth 主配置 — Credentials Provider（使用 bcryptjs 驗證密碼），JWT session 策略 |
| `src/app/api/auth/[...nextauth]/route.ts` | 改為 `import NextAuth from "next-auth"; import { authOptions } from "@/auth"; export const handler = NextAuth(authOptions); export { handler as GET, handler as POST };` |
| `src/app/layout.tsx` | 用 `SessionProvider` 包裹 children |
| `src/components/layout/Navbar.tsx` | 加入 `useSession` 判斷登入狀態，顯示用戶名稱 / 登入按鈕 |

**驗收標準：**
- 訪問 `/api/auth/signin` 顯示登入表單
- 使用註冊的帳號可成功登入
- Navbar 顯示用戶名稱而非「登入」按鈕

---

### Step 3 (P2)：取代 execCommand

**目標：** 移除已棄用 API，改用現代 Selection API

**檔案修改：**

| 檔案 | 修改內容 |
|------|----------|
| `src/components/ppt/TextView.tsx` | 移除 `applyFormat` 中的 `document.execCommand`，改為手動操作 `window.getSelection()` + `Range` 來包裹/移除 `<b>`/`<i>`/`<u>` 節點 |

**建議實作方式：**
```ts
// 取代 execCommand 的簡易方案
function toggleInlineStyle(tag: "b" | "i" | "u") {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount || sel.isCollapsed) return;
  const range = sel.getRangeAt(0);
  // 檢查選取範圍是否已被該標籤包裹 → 移除；否則 → 包裹
  const parent = range.commonAncestorContainer.parentElement;
  if (parent?.tagName === tag.toUpperCase()) {
    // unwrap: 將子節點移到父層，移除標籤
    parent.replaceWith(...parent.childNodes);
  } else {
    // wrap: 用新標籤包裹選取範圍
    const wrapper = document.createElement(tag);
    range.surroundContents(wrapper);
  }
}
```

**驗收標準：**
- 在 PPT 編輯器中選取文字，點擊 B/I/U 可正常切換格式
- 文字內容儲存後重新載入，格式保持不變
- 無 `document.execCommand` 相關 deprecation warning

---

### Step 4 (P1 跟隨)：遊戲分數串接

**目標：** 確保遊戲分數提交流程順暢（利用 Step 1 修復的 API）

**檔案修改：**

| 檔案 | 修改內容 |
|------|----------|
| `src/hooks/useGameScore.ts` | 移除「先呼叫必定失敗的 API → 再降級」模式，改為「檢查 API 可用性，不可用時直接寫 localStorage」 |
| 各遊戲元件 (`Breakout.tsx`, `Snake.tsx` 等) | 確認 Game Over 後正確呼叫 `submitScore`，傳入 `userId`（來自 session） |

**驗收標準：**
- 玩遊戲後分數寫入 SQLite 資料庫
- 排行榜正確顯示所有玩家的分數（跨瀏覽器）

---

## 📊 風險評估

| 步驟 | 風險 | 緩解措施 |
|------|------|----------|
| Step 1 (SQLite 切換) | SQLite 不支援 `cuid()` 預設值 | Prisma 的 `@default(cuid())` 由 Prisma Client 層級處理，SQLite 相容 |
| Step 1 (Mock 降級) | Mock 實作與 Prisma 行為不完全一致 | 僅在 Prisma 初始化失敗時啟用 Mock，正常時仍走 Prisma |
| Step 2 (NextAuth) | 與註冊 API 的密碼加密不一致 | 統一使用 `bcryptjs`，hash rounds = 12 |
| Step 3 (execCommand) | Selection API 在 contentEditable 中行為複雜 | 先在單一文字元素內測試；保留舊實作作為 fallback |
| Step 4 (遊戲分數) | 多人同時提交導致 race condition | SQLite 單寫入者特性天然防護；生產環境應換回 PostgreSQL |

---

## 🔗 關聯檔案索引

| 檔案 | 行數 | 關聯問題 |
|------|------|----------|
| `prisma/schema.prisma` | 全部 | 1, 2, 5 |
| `src/lib/prisma.ts` | 全部 | 1, 2 |
| `src/app/api/auth/register/route.ts` | 41, 57 | 1 |
| `src/app/api/games/scores/route.ts` | 44, 60, 68, 97, 122, 139 | 2, 5 |
| `src/app/api/auth/[...nextauth]/route.ts` | 全部 | 3 |
| `src/components/ppt/TextView.tsx` | 155 | 4 |
| `src/hooks/useGameScore.ts` | 56-110 | 5 |
| `prisma/seed.ts` | 全部 | 1, 2, 5 |
| `.env` | 1 | 1, 2 |
| `docs/ppt-audit.md` | 209-223 | 4 |

---

## 📝 總結

| 優先級 | 問題 | 建議方案 | 依賴 |
|--------|------|----------|------|
| **P0** | 資料庫未連線導致 API 500 | SQLite 切換 + Mock 降級模式 | 無 |
| **P1** | NextAuth 未實作 | 建立 `src/auth.ts` + Credentials Provider | P0（需資料庫存用戶） |
| **P1** | 遊戲分數無法持久化 | 跟隨 P0 修復，優化前端降級邏輯 | P0 |
| **P2** | execCommand 已棄用 | 改為 Selection API 手動操作 | 無 |

**立即執行建議：**
1. **Step 1 優先** — 解決資料庫問題後，註冊 + 排行榜 API 同步恢復
2. 先跑 `npx prisma db push` 驗證 SQLite 可正常建立資料表
3. 再依序處理 NextAuth 與 execCommand
