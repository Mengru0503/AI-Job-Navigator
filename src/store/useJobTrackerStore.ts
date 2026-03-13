import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TrackedJob, JobStatus } from "../types";

// ============================================================
// 針對 Lai Mengru（前端工程師）的真實追蹤職缺
// ============================================================
const defaultTrackedJobs: TrackedJob[] = [
    {
        id: "t1",
        company: "Appier 沛星互動科技",
        role: "Frontend Engineer",
        location: "台北市信義區",
        salary: "月薪 50K–80K",
        status: "saved",
        matchScore: 88,
        appliedDate: undefined,
        lastUpdate: "2026-03-13",
        description:
            "We are looking for a Frontend Engineer to join our Product team. You will build and maintain web applications used by global clients. Collaborate closely with designers and backend engineers to deliver polished user experiences. Proficiency in React and modern JavaScript (ES6+) is required. Experience with TypeScript and RESTful APIs is a plus.",
        requiredSkills: ["React", "JavaScript", "TypeScript", "RESTful API", "CSS3", "Git"],
        missingSkills: ["TypeScript"],
        notes: "國際化 AI 公司，技術棧與我相符。TypeScript 需要加強，但核心 React 技能完全吻合。",
        url: "https://www.cakeresume.com/companies/appier/jobs",
        hrIntroMessage:
            "您好，我是 Lai Mengru，具備設計與前端開發的複合背景。我在 React 與 JavaScript 上有紮實的實作經驗，並透過 InnerSoul 等情感互動專案，展現了將 UI 設計轉化為流暢使用者體驗的能力。我非常欣賞 Appier 在 AI 驅動產品上的深耕，相信我的設計思維與前端技術能為團隊帶來獨特價值，期待有機會進一步交流。",
    },
    {
        id: "t2",
        company: "91APP",
        role: "前端工程師（React）",
        location: "台北市松山區",
        salary: "月薪 45K–75K",
        status: "saved",
        matchScore: 85,
        appliedDate: undefined,
        lastUpdate: "2026-03-13",
        description:
            "徵求前端工程師加入電商解決方案團隊。負責開發與維護電商平台的前端功能，包含商品列表、購物車、結帳流程等模組。需熟悉 React 框架、RWD 響應式設計，並具備良好的跨瀏覽器相容性處理能力。有電商開發經驗者尤佳。",
        requiredSkills: ["React", "JavaScript", "RWD", "HTML5", "CSS3", "Git"],
        missingSkills: [],
        notes: "電商平台前端職缺，與我的 URBNSTEP 電商專案背景高度吻合。全技能符合，優先考慮。",
        url: "https://www.104.com.tw/company/1a2x6bkjb7",
        hrIntroMessage:
            "您好，我是 Lai Mengru，具備電商前端開發的實務經驗。我曾獨立完成 URBNSTEP 電商網站的前端實作，包含商品列表頁面的 RWD 版面設計，並熟悉 HTML、CSS、Bootstrap 等技術。同時我也在 Happiness Cookie 團隊專案中擔任前端開發與 UI 設計雙重角色。我相信我的電商前端背景與設計能力，能快速融入 91APP 的產品開發節奏。",
    },
    {
        id: "t3",
        company: "Wix 台灣分公司",
        role: "UI Engineer",
        location: "台北市大安區（可遠端）",
        salary: "月薪 55K–90K",
        status: "saved",
        matchScore: 82,
        appliedDate: undefined,
        lastUpdate: "2026-03-13",
        description:
            "Join our team as a UI Engineer to build and maintain our design system and component library. You will work closely with UX designers to translate Figma designs into pixel-perfect React components. Strong CSS skills and attention to detail are essential. Experience with animation and micro-interactions is highly valued.",
        requiredSkills: ["React", "CSS3", "Figma", "JavaScript", "UI Design", "Animation"],
        missingSkills: [],
        notes: "設計系統職缺完全符合我的設計＋工程混合背景。Figma 和 UI Design 都是我的強項！",
        url: "https://www.cakeresume.com/companies/wix/jobs",
        hrIntroMessage:
            "您好，我是 Lai Mengru，擁有設計師與前端工程師的雙重背景，這正是 UI Engineer 職位所需的核心能力。我熟悉 Figma 並擅長將視覺設計轉為高品質 React 元件，在 InnerSoul 專案中更主導了互動動畫的設計與實作。我對視覺細節的敏感度與工程執行力，相信能為 Wix 的設計系統帶來貢獻。",
    },
    {
        id: "t4",
        company: "Dcard",
        role: "Web Frontend Engineer",
        location: "台北市（遠端友善）",
        salary: "月薪 55K–85K",
        status: "saved",
        matchScore: 80,
        appliedDate: undefined,
        lastUpdate: "2026-03-13",
        description:
            "我們正在尋找熱愛 Web 技術的前端工程師，加入 Dcard 平台開發團隊。你將負責開發新功能、優化既有頁面效能，並維護前端程式碼品質。熟悉 React（或 Vue）、JavaScript、CSS 為基本要求，具備良好的效能優化概念者佳。",
        requiredSkills: ["React", "JavaScript", "CSS", "Web Performance", "Git", "HTML5"],
        missingSkills: ["Web Performance"],
        notes: "台灣知名社群平台，技術文化良好。Web 效能優化是需要加強的方向，但核心技術完全吻合。",
        url: "https://www.104.com.tw/company/5s05mlt",
        hrIntroMessage: "",
    },
    {
        id: "t5",
        company: "iKala",
        role: "Junior Frontend Engineer",
        location: "台北市內湖區",
        salary: "月薪 40K–60K",
        status: "saved",
        matchScore: 92,
        appliedDate: undefined,
        lastUpdate: "2026-03-13",
        description:
            "歡迎對前端開發充滿熱情的 Junior Frontend Engineer 加入 iKala。你將在資深工程師的帶領下，參與 AI 驅動的 SaaS 產品前端開發，學習業界最佳實踐。具備 React / JavaScript 基礎，並有個人或團隊專案作品集者優先。我們重視學習成長的意願勝於年資。",
        requiredSkills: ["React", "JavaScript", "HTML5", "CSS3", "Git", "作品集"],
        missingSkills: [],
        notes: "AI SaaS 公司的 Junior 職缺，我對 AI 應用的強烈興趣與他們的產品方向高度吻合。作品集也準備好了！這是最優先投遞的選項。",
        url: "https://www.cakeresume.com/companies/ikala/jobs",
        hrIntroMessage:
            "您好，我是 Lai Mengru，對 AI 驅動的 Web 應用深感興趣，並已有多個 React 與 JavaScript 的實作專案，包含情感互動應用 InnerSoul 及多個電商前端作品。我具備設計與工程的複合背景，能快速理解產品需求並轉化為使用者友善的介面。我非常期待在 iKala 的 AI 產品環境中持續成長，相信我積極學習的態度與紮實的前端基礎，能成為團隊的即戰力。",
    },
];

interface JobTrackerStore {
    trackedJobs: TrackedJob[];
    addJob: (job: TrackedJob) => void;
    updateJobStatus: (id: string, status: JobStatus) => void;
    updateJobNotes: (id: string, notes: string) => void;
    removeJob: (id: string) => void;
    updateJob: (id: string, updates: Partial<TrackedJob>) => void;
    getJobsByStatus: (status: JobStatus) => TrackedJob[];
}

export const useJobTrackerStore = create<JobTrackerStore>()(
    persist(
        (set, get) => ({
            trackedJobs: defaultTrackedJobs,
            addJob: (job) =>
                set((state) => ({ trackedJobs: [...state.trackedJobs, job] })),
            updateJobStatus: (id, status) =>
                set((state) => ({
                    trackedJobs: state.trackedJobs.map((j) =>
                        j.id === id
                            ? { ...j, status, lastUpdate: new Date().toISOString().split("T")[0] }
                            : j
                    ),
                })),
            updateJobNotes: (id, notes) =>
                set((state) => ({
                    trackedJobs: state.trackedJobs.map((j) =>
                        j.id === id
                            ? { ...j, notes, lastUpdate: new Date().toISOString().split("T")[0] }
                            : j
                    ),
                })),
            removeJob: (id) =>
                set((state) => ({
                    trackedJobs: state.trackedJobs.filter((j) => j.id !== id),
                })),
            updateJob: (id, updates) =>
                set((state) => ({
                    trackedJobs: state.trackedJobs.map((j) =>
                        j.id === id
                            ? { ...j, ...updates, lastUpdate: new Date().toISOString().split("T")[0] }
                            : j
                    ),
                })),
            getJobsByStatus: (status) =>
                get().trackedJobs.filter((j) => j.status === status),
        }),
        {
            name: "ai-job-navigator-tracker-v2",
        }
    )
);
