# HubOne — AI Engineering Consulting Showcase

日期：2026-07-31  
狀態：DESIGN SOURCE OF TRUTH / DOCUMENTATION FIRST

## 1. 定位

HubOne 是一人公司對外展示與操作入口；`AI-Company-Handbook` 保存公司級 Source of Truth，各專業 Repository 保存確定性能力。

本文件定義 HubOne 如何落實展示「AI 工程顧問公司」，但在公司文件、Canonical ESM、Repository 邊界與 Golden Project 尚未封版前，不直接進入 Production UI 開發。

```text
AI-Company-Handbook
公司架構 / 契約 / Roadmap / Golden Project
        ↓
HubOne
對外展示 / 專案入口 / 能力狀態 / 產物瀏覽 / 工作流操作
        ↓
專業 Repository
DWG_todo / AI-BIM-Forge / AI-CivilDesign-Forge / AI-EngSketch / Budget / Schedule / Animation
```

## 2. HubOne 的責任

HubOne 負責：

- 展示公司級能力地圖與完整工程工作流；
- 顯示各專業 Repository 的健康度、完成度與版本；
- 建立 Project Workspace 與 Golden Project 展示頁；
- 瀏覽 DWG、ESM、IFC、工程圖、計算書、數量、預算、排程與動畫產物；
- 顯示 Digital Thread 與來源追溯；
- 透過受控 API / CLI 啟動專業工具；
- 顯示執行狀態、審查結果、警告與批准 Gate；
- 提供客戶、工程師、審查者不同視角。

HubOne 不負責：

- 重新實作 DWG 解析；
- 重新實作工程設計公式；
- 重新實作 IFC Builder；
- 在前端自行計算正式工程數值；
- 直接修改 DWG、IFC、預算資料庫；
- 維護第二套 ESM、Quantity、Identity 或 Schedule 模型。

## 3. 展示入口

現有首頁保留多業務平台定位，`/civil` 升級為：

```text
AI Engineering Consulting Studio
```

首頁「土木結構」卡片後續改為：

- 名稱：AI 工程顧問
- 描述：從既有圖說、工程語意、設計計算到 BIM、工程圖、數量預算、排程與正式交付
- 功能標籤：DWG/PDF、設計計算、BIM/IFC、工程圖、預算排程

## 4. `/civil` 資訊架構

### 4.1 Overview

展示：

- 公司願景；
- 端到端資料流；
- 活躍專案；
- 專業引擎狀態；
- 最新正式產物；
- P0/P1 風險；
- Golden Project 通過狀態。

### 4.2 Capability Map

依工作站展示：

1. Requirements & Project Brief
2. DWG / DXF / PDF Intake
3. Engineering Semantic Model
4. Knowledge Graph & Digital Thread
5. Engineering Calculation
6. BIM / IFC
7. Engineering Drawing
8. Quantity / Budget / PCCES
9. Schedule / PERT / CPM
10. Reports & Deliverables
11. 3D / 4D / Animation
12. Review & Approval

每個能力卡必須顯示：

- 主責 Repository；
- 當前成熟度；
- 已完成能力；
- 未完成缺口；
- 最近驗證；
- 可查看的 Demo / Artifact。

### 4.3 Project Workspace

每個 Project 至少有：

```text
Overview
Inputs
ESM
Calculations
BIM
Drawings
Quantities
Budget
Schedule
Reports
Animation
Digital Thread
Review
```

### 4.4 Repository Control Room

展示所有工程倉庫：

- Repository；
- 主責能力；
- Default branch；
- Latest accepted commit；
- Tests / Build / Review status；
- Contract version；
- Upstream / Downstream；
- Blocker；
- 下一個 Roadmap Segment。

### 4.5 Golden Projects

正式展示案例：

- Building Golden Project；
- Bridge Golden Project；
- Retaining Structure Golden Project；
- Culvert / Drainage Golden Project；
- Renovation / Existing Drawing Golden Project。

每個案例必須完整顯示：

```text
需求 / 原始資料
→ ESM
→ Calculation Trace
→ IFC
→ Engineering Drawings
→ Quantity
→ Budget
→ Schedule
→ Report
→ Animation
→ Review Evidence
```

## 5. 主要頁面路由

建議路由：

```text
/civil
/civil/capabilities
/civil/projects
/civil/projects/[projectId]
/civil/repositories
/civil/golden-projects
/civil/digital-thread
/civil/reviews
/civil/deliverables
```

專案工作區子路由：

```text
/civil/projects/[projectId]/inputs
/civil/projects/[projectId]/esm
/civil/projects/[projectId]/calculations
/civil/projects/[projectId]/bim
/civil/projects/[projectId]/drawings
/civil/projects/[projectId]/quantities
/civil/projects/[projectId]/budget
/civil/projects/[projectId]/schedule
/civil/projects/[projectId]/reports
/civil/projects/[projectId]/animation
/civil/projects/[projectId]/thread
```

## 6. 展示資料模型

HubOne 僅維護 Portal View Model，不建立新的工程真相模型。

### ProjectSummary

```json
{
  "project_id": "project-zengwen-bridge",
  "name": "曾文水庫防淤隧道鋼便橋",
  "project_type": "bridge",
  "status": "review",
  "current_stage": "report",
  "health": "warning",
  "contract_version": "esm/1.0",
  "latest_revision": "rev-2026-07-31-01"
}
```

### CapabilityStatus

```json
{
  "capability_id": "bim-ifc",
  "owner_repository": "liuxb99/AI-BIM-Forge",
  "maturity": "mvp-verified",
  "accepted_commit": "<sha>",
  "test_status": "passed",
  "blockers": [],
  "artifacts": []
}
```

### ArtifactSummary

```json
{
  "artifact_id": "artifact-ifc-001",
  "project_id": "project-zengwen-bridge",
  "artifact_type": "ifc",
  "revision_id": "rev-2026-07-31-01",
  "source_ids": ["esm-object-001"],
  "status": "accepted",
  "download_url": null,
  "viewer_url": null
}
```

### DigitalThreadEdge

```json
{
  "from_id": "cad-handle-2A1F",
  "relation": "DERIVED_FROM",
  "to_id": "esm-column-2f-a3",
  "evidence_ids": ["evidence-closed-polygon"],
  "revision_id": "rev-2026-07-31-01"
}
```

## 7. UI 原則

- 工程專業介面優先，避免娛樂化 Dashboard；
- 所有狀態必須有來源，不展示虛構的用戶數與完成率；
- 重要數值必須可點擊追溯至正式 Artifact / Calculation Trace；
- `Draft`、`Reviewed`、`Accepted`、`Superseded` 狀態必須清楚區分；
- 錯誤與警告不得被綠色成功卡遮蓋；
- 支援桌面大螢幕與主管 10 分鐘快速閱讀；
- 圖表、BIM Viewer、工程圖 Viewer 與報告 Viewer 彼此連動同一 Object ID。

## 8. Demo Mode 與 Live Mode

### Demo Mode

- 使用版本化靜態 JSON；
- 展示已驗證 Golden Project；
- 不呼叫尚未封版的專業服務；
- 適合目前文件與架構階段。

### Live Mode

- 透過 HubOne Backend / Orchestrator 呼叫專業服務；
- 需具備認證、權限、交易、審批、回滾與審計；
- 專業服務必須先通過各自的契約與編譯驗證。

正式順序：

```text
Documentation & Contracts
→ Demo Mode
→ Professional Service APIs
→ Live Mode
```

## 9. 開發前置 Gate

HubOne Civil Showcase 開發前必須完成：

- [ ] Repository Inventory 封版；
- [ ] Capability Matrix 封版；
- [ ] Canonical ESM 1.0 封版；
- [ ] Digital Thread 契約封版；
- [ ] Artifact / Revision 契約封版；
- [ ] 至少一個 Golden Project 規格封版；
- [ ] UI 資訊架構與展示資料模型通過審查。

未完成前，只能補文件、靜態 Mock Contract 與頁面骨架，不接入假資料冒充真實狀態。

## 10. 第一個落地版本

HubOne Civil Showcase V1 只做可驗證展示：

```text
/civil Overview
/civil/capabilities
/civil/repositories
/civil/golden-projects/[id]
```

展示資料來自版本化 Demo Dataset，內容以公司 Source of Truth 與已驗證倉庫狀態產生。

V1 驗收：

- 不顯示虛構統計；
- 能清楚說明整間 AI 工程顧問公司的資料流；
- 每項能力能追溯到主責 Repository；
- Golden Project 能呈現完整產物鏈；
- 頁面可由靜態部署運行；
- 未完成能力顯示為 Planned / Blocked，而非 Completed。
