# 一人公司 — 全面需求說明（動態網站 + 後端）

## 專案概述
建立一個「理想的一人公司」網站，整合六大業務線。使用 Python 後端 + 資料庫，前端服務端渲染。

## 技術棧
- **後端**: Python 3.11+ + FastAPI + Uvicorn
- **模板引擎**: Jinja2（服務端渲染）
- **資料庫**: SQLite + SQLAlchemy（零配置，一人公司首選）
- **前端**: HTML5 + CSS3 + Vanilla JavaScript
- **圖表**: Chart.js + Canvas API
- **即時通訊**: WebSocket（FastAPI 原生支援，用於模擬行情、站內訊息）
- **檔案上傳**: python-multipart
- **部署**: Docker + Docker Compose 或直接部署

## 六大業務線

### 1. 量化交易 (Quantitative Trading)
- 模擬股票/加密貨幣行情（WebSocket 推送即時數據）
- K線圖、技術指標（MA、RSI、MACD、布林帶）
- 回測模擬器：設定策略參數進行歷史回測
- 策略編輯器：自定義買賣條件
- 虛擬交易（Paper Trading）與持倉管理
- 使用後端 Python 生成模擬數據（pandas/numpy）

### 2. 土木結構設計 (Civil Structure Design)
- 鋼結構/混凝土結構參數輸入
- 梁、柱、板內力計算（彎矩、剪力、撓度）
- 型鋼/鋼筋截面資料庫（存於 SQLite）
- 結構計算書產生器（HTML → PDF）
- 荷載組合計算（DL、LL、WL、SL）
- SVG/Canvas 示意圖繪製

### 3. 二手物品交易 (Second-hand Marketplace)
- 會員註冊/登入系統
- 商品刊登（圖片上傳、描述、價格、分類）
- 商品列表與搜尋（關鍵字、分類、價格範圍）
- 購物車與訂單管理
- 買賣雙方評價系統
- 站內訊息系統（WebSocket 即時推送）
- 資料存於 SQLite

### 4. AI 工具開發 (AI Tools)
- 文字生成工具（提示詞模板庫 + 串接 LLM API 或 Mock）
- 圖片生成展示（模擬 AI 繪圖）
- 程式碼生成助手（模板 + 規則匹配）
- 文件摘要工具（基於 Python NLP 或 Mock）
- Prompt 工程師助手（提示詞優化建議）
- 提示詞管理與歷史記錄

### 5. 線上做 PPT (Online PPT)
- 網頁版簡報編輯器（拖放式編輯）
- 多種模板（商務、學術、創意）
- 投影片編輯：文字、圖片、圖表、表格
- 實時預覽
- 後端渲染匯出 HTML/PDF
- 支援 Markdown 導入生成簡報
- 保存/載入專案（存於 SQLite）

### 6. 經典遊戲 (Classic Games)
- 俄羅斯方塊 (Tetris)
- 貪食蛇 (Snake)
- 踩地雷 (Minesweeper)
- 2048
- 打磚塊 (Breakout)
- 鍵盤/觸控控制
- 排行榜（存於 SQLite，全域高分）
- 難度選擇

## UI/UX 需求
- 統一導航欄，可切換六大業務線
- 每個業務線有獨立儀表板/入口頁
- 響應式設計（桌機 + 平板 + 手機）
- 深色/淺色主題切換
- 繁體中文介面
- 首頁展示公司概覽與各業務統計

## 非功能性需求
- 後端 API + WebSocket 支援
- SQLite 資料庫持久化
- Docker 一鍵部署
- 支援 Chrome、Firefox、Edge、Safari

## 目錄結構規劃
```
one-person-company/
├── app/                    # FastAPI 應用
│   ├── main.py             # 入口
│   ├── routes/             # 路由模組
│   │   ├── home.py
│   │   ├── auth.py
│   │   ├── quant.py
│   │   ├── civil.py
│   │   ├── marketplace.py
│   │   ├── ai_tools.py
│   │   ├── ppt.py
│   │   └── games.py
│   ├── models/             # SQLAlchemy 模型
│   ├── services/           # 業務邏輯
│   ├── templates/          # Jinja2 模板
│   │   ├── base.html
│   │   ├── home/
│   │   ├── quant/
│   │   ├── civil/
│   │   ├── marketplace/
│   │   ├── ai_tools/
│   │   ├── ppt/
│   │   └── games/
│   └── static/             # CSS / JS / 圖片
│       ├── css/
│       ├── js/
│       └── uploads/
├── data/                   # SQLite 資料庫檔案
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```
