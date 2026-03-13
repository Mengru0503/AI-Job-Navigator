// ============================================================
// 核心資料類型定義
// ============================================================

/** 履歷來源類型 */
export type ResumeSourceType = "text" | "url" | "pdf";

/** 解析後的履歷資料 */
export interface ResumeData {
    resumeText: string;
    sourceType: ResumeSourceType;
    fileName?: string;
    url?: string;
    parsedAt: number; // timestamp
}

/** 職位資料（從職缺平台抓取） */
export interface Job {
    id: string;
    company: string;
    title: string;
    location: string;
    description: string;
    url: string;
    salary?: string;
    jobType?: string;
    postedDate?: string;
    remote?: boolean;
    logo?: string;
    source?: "104" | "cake" | "manual";
    // AI 分析結果（分析後填入）
    matchScore?: number;
    matchedSkills?: string[];
    missingSkills?: string[];
    hrIntroMessage?: string;
}

/** AI 職位配對分析結果 */
export interface JobAnalysis {
    matchScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    summary?: string;
}

/** HR 自我介紹訊息結果 */
export interface HrIntroResult {
    message: string;
    jobId: string;
}

/** 職位追蹤器狀態 */
export type JobStatus = "saved" | "applied" | "interview" | "rejected" | "offer";

/** 追蹤中的職位 */
export interface TrackedJob {
    id: string;
    company: string;
    role: string;
    location: string;
    salary?: string;
    status: JobStatus;
    matchScore: number;
    appliedDate?: string;
    lastUpdate: string;
    description: string;
    requiredSkills: string[];
    missingSkills: string[];
    notes: string;
    url?: string;
    hrIntroMessage?: string;
}

/** 職位搜尋參數 */
export interface JobSearchParams {
    keyword: string;
    location?: string;
    remoteOnly?: boolean;
}

/** API 錯誤 */
export interface ApiError {
    message: string;
    code?: string;
}

/** AI 服務提供者 */
export type AiProvider = "openai" | "gemini";

/** 應用設定 */
export interface AppSettings {
    aiProvider: AiProvider;
    openaiApiKey: string;
    openaiModel: string;
    geminiApiKey: string;
    geminiModel: string;
    searchSources: {
        cake: boolean;
        job104: boolean;
    };
    userName: string;
    userEmail: string;
    userLocation: string;
    userJobTitle: string;
}
