# AI Job Navigator Dashboard

> 🤖 AI 驅動的智慧求職助理 — 協助您上傳履歷、搜尋職缺、分析配對分數、自動生成 HR 自我介紹信


---

## 🚀 快速開始

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

預設開啟於 `http://localhost:5173`

---

## ✨ 核心功能

### 1. 📄 履歷輸入系統
支援三種輸入方式，統一正規化為 `resumeText`：
- **文字貼上**：直接將履歷內容貼入文字框
- **網址匯入**：輸入 CakeResume / LinkedIn 等個人頁面網址，自動抓取文字內容
- **PDF 上傳**：拖曳或選擇 PDF 檔案，使用 `pdfjs-dist` 在瀏覽器端解析文字

### 2. 🔍 職位搜尋系統
從公開職缺平台即時抓取職缺資料：
- **104 人力銀行**（台灣最大職缺平台）
- **CakeResume**（適合外商、新創）
- 透過 `allorigins.win` CORS Proxy 繞過跨域限制
- 若 API 呼叫失敗，自動使用模擬資料作為後備

```typescript
// src/services/jobSearchService.ts
searchJobs(keyword: string, sources: { cake: boolean, job104: boolean })
// 回傳: Job[] { company, title, location, description, url, salary, source }
```

### 3. 🎯 AI 職位配對分析
使用 OpenAI API 比較履歷與職位描述：
```typescript
// src/services/aiService.ts
analyzeJobMatch(apiKey, model, resumeText, jobDescription, jobTitle, company)
// 回傳: { matchScore: number, matchedSkills: string[], missingSkills: string[] }
```

### 4. ✉️ HR 自我介紹信生成
針對每個職位生成 80-120 字的個人化介紹信（繁體中文）：
```typescript
generateHrIntro(apiKey, model, resumeText, jobDescription, company, jobTitle)
// 回傳: string（個人化自我介紹訊息）
```

### 5. 📊 職位配對排名
AI 分析完成後，自動依 `matchScore` 降序排列職位，最佳配對優先顯示

### 6. 📋 職位追蹤器（CRM 風格）
完整的求職狀態管理：
- 狀態流程：`saved → applied → interview → offer / rejected`
- 支援備註編輯、狀態即時切換、職位刪除
- 從職位探索頁一鍵儲存至追蹤器
- 資料持久化至 `localStorage`（透過 Zustand persist）

---

## 🏗️ 專案架構

```
src/
├── app/
│   ├── pages/
│   │   ├── Dashboard.tsx       # 儀表板（即時統計數據）
│   │   ├── ResumeAnalyzer.tsx  # 履歷上傳與 AI 分析
│   │   ├── JobDiscovery.tsx    # 職位搜尋 + AI 批次分析
│   │   ├── JobTracker.tsx      # 求職進度追蹤器
│   │   ├── SkillGapMap.tsx     # 技能落差雷達分析
│   │   └── Settings.tsx        # API Key & 設定管理
│   ├── components/
│   │   ├── Layout.tsx          # 側邊欄 + 頂部導覽
│   │   └── ui/                 # shadcn/ui 元件庫（48 個元件）
│   ├── App.tsx                 # TanStack Query Provider + Toaster
│   └── routes.tsx              # React Router 路由設定
│
├── services/
│   ├── jobSearchService.ts     # 職缺搜尋服務（104 + CakeResume）
│   ├── aiService.ts            # OpenAI API 整合
│   └── resumeParser.ts         # 履歷解析（文字/URL/PDF）
│
├── hooks/
│   ├── useResumeParser.ts      # 履歷解析 Hook（三種模式）
│   └── useJobSearch.ts         # 職位搜尋 + AI 分析 Hook
│
├── store/
│   ├── useResumeStore.ts       # 履歷全域狀態（Zustand）
│   ├── useJobTrackerStore.ts   # 職位追蹤狀態（Zustand）
│   └── useSettingsStore.ts     # 應用設定（含 API Key）
│
└── types/
    └── index.ts                # 核心 TypeScript 類型定義
```

---

## 🔧 技術棧

| 技術 | 用途 |
|------|------|
| **Vite** | 開發伺服器與打包工具 |
| **React 18** | UI 框架 |
| **TypeScript** | 靜態型別系統 |
| **Tailwind CSS v4** | 樣式系統 |
| **React Router v7** | 用戶端路由 |
| **Zustand** | 全域狀態管理（附 localStorage 持久化）|
| **TanStack Query** | 伺服器狀態快取 |
| **OpenAI API** | GPT-4o Mini 職位配對分析與 HR 信生成 |
| **pdfjs-dist** | 瀏覽器端 PDF 文字解析 |
| **Recharts** | 技能雷達圖表 |
| **Sonner** | Toast 通知系統 |
| **Radix UI / shadcn** | Headless UI 元件庫 |
| **Lucide React** | 圖示庫 |

---

## ⚙️ 初始設定

### AI 功能設定（必填）
1. 前往 [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys) 取得 API Key
2. 開啟應用後，點擊左側「設定」頁面
3. 輸入您的 OpenAI API Key
4. 選擇 AI 模型（預設：`gpt-4o-mini`，速度快且成本低）
5. 點擊「測試連線」確認 API Key 有效
6. 儲存設定

> ⚠️ API Key 僅儲存於瀏覽器的 `localStorage`，不會傳送至任何第三方伺服器。所有 AI 請求直接從瀏覽器發送至 OpenAI API。

### 推薦使用流程
```
1. 設定 → 輸入 OpenAI API Key
2. 履歷分析 → 上傳/貼入您的履歷
3. 職位探索 → 搜尋職位（例如：React 工程師）
4. 職位探索 → 點擊「AI 批次分析所有職位」
5. 儲存心儀職位至追蹤器
6. 生成 HR 自我介紹信 → 複製使用
7. 技能分析 → 查看技能落差與學習建議
```

---

## 📡 資料流

```
使用者操作
    │
    ├─ 上傳履歷 ──────────────────► useResumeStore (Zustand)
    │   (文字/URL/PDF)                    │
    │                                     │ resumeText
    │                                     ▼
    ├─ 搜尋職位 ──────────────────► jobSearchService
    │   (104 + CakeResume)                │
    │       │                             │
    │       ▼                             ▼
    │   Job[] ◄────────────────────── useJobSearch (Hook)
    │       │                             │
    │       └─ AI 批次分析 ────────────► aiService (OpenAI)
    │                                     │
    │                                     ▼
    │                               matchScore, matchedSkills
    │                               missingSkills, hrIntro
    │
    └─ 儲存職位 ──────────────────► useJobTrackerStore (Zustand)
                                          │
                                          └─► localStorage (持久化)
```

---

## 🌐 API 說明

### OpenAI API（客戶端直接呼叫）
- **Endpoint**: `https://api.openai.com/v1/chat/completions`
- **用途**: 職位配對分析、HR 介紹信生成
- **模型**: GPT-4o Mini（預設）、GPT-4o、GPT-3.5 Turbo

### 職缺搜尋 API（透過 CORS Proxy）
- **Proxy**: `https://api.allorigins.win/get?url=`
- **104 API**: `https://www.104.com.tw/jobs/search/api/jobs?keyword=`
- **CakeResume API**: `https://www.cakeresume.com/api/v2/jobs?query=`

---

## 🧪 本地開發

```bash
# 安裝所有依賴
npm install

# 啟動開發模式
npm run dev

# 建立生產版本
npm run build
```

---

## 📁 環境需求

- Node.js 18+
- npm 9+
- 現代瀏覽器（Chrome、Firefox、Safari、Edge 最新版）

---

