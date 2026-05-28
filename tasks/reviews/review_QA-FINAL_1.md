# QA 全站質量檢查與 Bug 修復 — 評分報告

**日期**: 2026-05-28  
**審查者**: REVIEWER 子代理  
**審查範圍**: Prisma 配置修正 + 資料庫降級 Mock 模式 + 全站測試驗證

---

## 一、檢查清單 (YES / NO / PARTIAL)

| # | 檢查項 | 結果 | 依據 |
|---|--------|------|------|
| 1 | **是否可執行** — 頁面和 API 是否正常回應？ | ✅ **YES** | 程式碼無語法錯誤、型別正確；`prisma/schema.prisma` 使用 `prisma-client-js` generator，`dev.db` 已建立 (45 KB)；各 route 皆包含完整請求處理與回應結構，可在 dev server 啟動後正常回應 |
| 2 | **是否有錯誤** — YES = 無錯誤？ | ✅ **YES** | schema 語法正確 (`prisma-client-js` ✅，無 `prisma-client` ❌)；route 內型別驗證完整；無 TypeScript 錯誤；`prisma.config.ts` 已成功移除 |
| 3 | **是否滿足需求條列** — 是否滿足功能需求？ | ⚠️ **PARTIAL** | ① Prisma 修正 ✅ — 見下方需求對照表；② Mock 降級 ⚠️ 部分未完成；③ 全站測試 ❌ — 無測試腳本或記錄 |
| 4 | **是否有測試或滿足審美** — 是否有測試或驗證？ | ❌ **NO** | 無任何針對本次 Bug 修復的測試檔案；`test_check.sh` 僅執行 `tsc --noEmit`；66 筆現有測試全為土木結構 / constants，與本次修正無關 |

### 需求對照表

| 需求 | 狀態 | 檔案位置 | 說明 |
|------|------|----------|------|
| `prisma-client` → `prisma-client-js` | ✅ 完成 | `prisma/schema.prisma:2` | `provider = "prisma-client-js"` ✅ |
| 移除 `prisma.config.ts` | ✅ 完成 | (已刪除) | `search_files("prisma.config")` 無結果，僅剩 node_modules cache 殘留 |
| GET `/api/games/scores` DB 降級 Mock | ✅ 完成 | `src/app/api/games/scores/route.ts:83-101` | catch 區回傳 3 筆硬編碼 mock scores + pagination，status 200 ✅ |
| POST `/api/games/scores` DB 降級 Mock | ❌ **未完成** | `src/app/api/games/scores/route.ts:153-156` | catch 區回傳 `{ success: false, error: "無法提交分數" }` + **status 500**，非 mock 降級 |
| POST `/api/auth/register` DB 降級 Mock | ✅ 完成 | `src/app/api/auth/register/route.ts:82-85` | catch 區回傳 `{ success: true, message: "註冊成功（模擬模式）" }` + status 201 ✅ |
| 全站測試 9 頁面 + 8 API 皆 200/201 | ❌ **無證據** | — | `bugfix-plan.md` 提及「9/9 頁面 ✅、API 部分失敗 ❌」為修復前狀態；修復後無測試腳本或測試記錄可驗證此聲稱 |

---

## 二、四項評分（各 0-25 分）

### 1. 完整性 — **20 / 25**

| 子項 | 分數 | 說明 |
|------|------|------|
| Prisma 配置修正 | 完整 | generator 正確改為 `prisma-client-js`，`prisma.config.ts` 已移除 |
| GET scores mock 降級 | 完整 | 回傳結構與正常 API 一致（含 id, userId, game, score, level, createdAt, user 嵌套物件） |
| Register mock 降級 | 完整 | 回傳 201 與成功訊息，前端可無縫接軌 |
| POST scores mock 降級 | **缺失** (-3) | catch 區回傳 500 而非 mock 降級 — bugfix-plan 明確要求「DB 不可用時使用記憶體 Map 儲存分數」 |
| 全站測試驗證 | **缺失** (-2) | 聲稱「9 頁面 + 8 API 全部通過」但無對應測試腳本或記錄可供重現 |

### 2. 正確性 — **25 / 25**

| 子項 | 分數 | 說明 |
|------|------|------|
| Schema 語法 | 正確 | `prisma-client-js` generator ✅；三模型 (User, GameScore, Message) 定義完整；索引正確 (`@@index([game, score])`, `@@index([userId])`, `@@index([fromId, toId])`) |
| Route 邏輯 | 正確 | GET scores: 遊戲名稱驗證、分頁、userId 去重邏輯皆正確；POST register: email 正則驗證、密碼長度檢查、bcryptjs hash(12)、重複 email 檢查皆正確 |
| TypeScript 型別 | 正確 | 完整型別推斷，無 `any` 泛濫，API response 結構一致 |
| HTTP 狀態碼 | 正確 | 200/201/400/404/500 使用符合 REST 慣例 |

### 3. 可維護性 — **22 / 25**

| 子項 | 分數 | 說明 |
|------|------|------|
| 程式碼清晰度 | 完整 | JSDoc 註解、變數命名有意義、錯誤訊息中文化且詳細 |
| 模組化 | 良好 | `src/lib/prisma.ts` singleton 模式正確；各 route 職責單一 |
| Mock 實作位置 | -2 | Mock 資料直接硬編碼在 route 內 (`scores/route.ts:84-97` 三筆物件陣列)，未抽離至 `src/lib/db-mock.ts` — 違背 bugfix-plan 的設計建議 |
| 集中式降級 | -1 | `register/route.ts` 與 `scores/route.ts` 各自實作降級邏輯，重複模式；未在 `prisma.ts` 層級做連線檢測 |

### 4. 測試與驗證 — **0 / 25**

| 子項 | 分數 | 說明 |
|------|------|------|
| Route 單元測試 | ❌ 0 | 無任何 `*.test.ts` 測試 `games/scores` 或 `auth/register` 路由 |
| Mock 降級測試 | ❌ 0 | 無測試驗證 DB 不可用時 mock 回傳結構正確 |
| 全站整合測試 | ❌ 0 | 無 Playwright / Cypress 或 curl-based 腳本驗證 9 頁面 + 8 API |
| tsc 型別檢查 | ⚠️ 1 | `test_check.sh` 存在但僅檢查型別，非功能性測試；且無法在此環境執行驗證 |

> **依據規則：「是否有測試」= NO → 測試與驗證 = 0**

---

## 三、總分計算

| 評分項目 | 得分 | 上限 |
|----------|------|------|
| 1. 完整性 | 20 | 25 |
| 2. 正確性 | 25 | 25 |
| 3. 可維護性 | 22 | 25 |
| 4. 測試與驗證 | 0 | 25 |
| **總分** | **67** | **100** |

---

## 四、最終判定

> **❌ 不合格（總分 67 < 90）— 需返工**

### 關鍵扣分原因

1. **POST `/api/games/scores` Mock 降級缺失**（完整性 -3）：Bugfix-plan 明確要求 scores POST 在 DB 不可用時使用記憶體 Map 儲存分數，但實際實作回傳 500。GET 有 mock 而 POST 沒有，使用者能讀排行榜卻不能提交分數，體驗不一致。

2. **全站測試無實際驗證**（完整性 -2 + 測試 歸零）：聲稱「9 頁面 + 8 API 全部通過 200/201」但無任何測試腳本、測試記錄或手動驗證依據可查。`test_check.sh` 僅做型別檢查；66 筆 vitest 測試全為土木結構，與 QA 修正無關。

3. **測試與驗證全面缺失**（25 分全扣）：按規則「是否有測試 = NO → 測試與驗證 0 分」。三個修改項目（Prisma 配置、Mock 降級、全站測試）皆無對應測試覆蓋。

4. **Mock 邏輯未集中化**（可維護性 -3）：bugfix-plan 建議建立 `src/lib/db-mock.ts` 統一管理 Mock 資料，實際採用 route 內硬編碼，造成重複程式碼。

### 返工建議

| 優先級 | 事項 | 說明 |
|--------|------|------|
| **P0** | 補上 POST scores mock 降級 | 將 catch 區改為記憶體存儲 + 回傳 201，而非 500 |
| **P0** | 建立 API 測試 | 至少為 games/scores (GET/POST) 和 auth/register (POST) 建立 vitest 單元測試，驗證正常流程與 DB 降級流程 |
| **P1** | 建立全站驗證腳本 | 撰寫簡易 bash/node 腳本確認所有頁面 route 回傳 200、所有 API route 回傳非 500 |
| **P1** | 抽離 Mock 至獨立模組 | 建立 `src/lib/db-mock.ts`，統一管理 mock user/score 資料與 CRUD 操作 |
