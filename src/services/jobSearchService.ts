/**
 * 職位搜尋服務
 * 透過 CORS Proxy 抓取 104、CakeResume 職缺列表
 */

import { Job } from "../types";

const CORS_PROXY = "https://api.allorigins.win/get?url=";

/**
 * 主要搜尋函數：整合多個平台
 */
export async function searchJobs(
    keyword: string,
    sources: { cake: boolean; job104: boolean } = { cake: true, job104: true }
): Promise<Job[]> {
    const promises: Promise<Job[]>[] = [];

    if (sources.job104) {
        promises.push(search104Jobs(keyword));
    }
    if (sources.cake) {
        promises.push(searchCakeJobs(keyword));
    }

    const results = await Promise.allSettled(promises);
    const allJobs: Job[] = [];

    results.forEach((result) => {
        if (result.status === "fulfilled") {
            allJobs.push(...result.value);
        }
    });

    // 依據 ID 去重
    const uniqueJobs = allJobs.filter(
        (job, index, self) => index === self.findIndex((j) => j.id === job.id)
    );

    return uniqueJobs;
}

/**
 * 104 人力銀行搜尋
 * 使用 104 公開 API
 */
async function search104Jobs(keyword: string): Promise<Job[]> {
    try {
        const encodedKeyword = encodeURIComponent(keyword);
        const apiUrl = `https://www.104.com.tw/jobs/search/api/jobs?keyword=${encodedKeyword}&mode=s&jobsource=2018indexpoc&page=1&pagesize=10`;
        const proxyUrl = `${CORS_PROXY}${encodeURIComponent(apiUrl)}`;

        const response = await fetch(proxyUrl, {
            headers: { Accept: "application/json" },
        });

        if (!response.ok) throw new Error("104 API 請求失敗");

        const data = await response.json();
        const rawContent = typeof data.contents === "string" ? JSON.parse(data.contents) : data.contents;

        // 解析 104 API 回應格式
        const jobList = rawContent?.data?.list || [];

        return jobList.map((item: Record<string, unknown>, index: number) => {
            const jobIdRaw = item.jobNo || item.id || `104-${index}`;
            const jobId = String(jobIdRaw);
            const companyName = extractString(item, ["custName", "company", "custno"]);
            const jobName = extractString(item, ["jobName", "name", "title"]);
            const jobAddrNoNum = extractString(item, ["jobAddrNoNum", "location", "addr"]);
            const salary = parseSalary104(item);

            return {
                id: `104-${jobId}`,
                company: companyName || "未知公司",
                title: jobName || "未知職位",
                location: jobAddrNoNum || "台灣",
                description: extractString(item, ["description", "appear", "jobDesc"]) || `${companyName} 徵求 ${jobName}，歡迎符合條件者投遞履歷。`,
                url: `https://www.104.com.tw/job/${jobId}`,
                salary,
                source: "104" as const,
                logo: "🏢",
                remote: Boolean(extractString(item, ["remoteWork"]) === "1"),
            };
        });
    } catch (error) {
        console.warn("104 搜尋失敗，使用備用資料:", error);
        return getMock104Jobs(keyword);
    }
}

/**
 * CakeResume 搜尋
 * 使用 CakeResume 公開 API
 */
async function searchCakeJobs(keyword: string): Promise<Job[]> {
    try {
        const encodedKeyword = encodeURIComponent(keyword);
        const apiUrl = `https://www.cakeresume.com/api/v2/jobs?query=${encodedKeyword}&locale=zh-TW&per=10&page=1`;
        const proxyUrl = `${CORS_PROXY}${encodeURIComponent(apiUrl)}`;

        const response = await fetch(proxyUrl, {
            headers: { Accept: "application/json" },
        });

        if (!response.ok) throw new Error("CakeResume API 請求失敗");

        const data = await response.json();
        const rawContent = typeof data.contents === "string" ? JSON.parse(data.contents) : data.contents;

        const jobList: Record<string, unknown>[] = rawContent?.jobs || rawContent?.data || [];

        return jobList.map((item: Record<string, unknown>, index: number) => {
            const id = String(item.id || item.slug || `cake-${index}`);
            const company = extractCakeCompany(item);
            const slug = String(item.slug || id);

            return {
                id: `cake-${id}`,
                company,
                title: extractString(item, ["title", "name", "position"]) || "未知職位",
                location: extractCakeLocation(item),
                description: extractString(item, ["description", "summary", "overview"]) || `${company} 正在招募優秀人才。`,
                url: `https://www.cakeresume.com/companies/${slug}/jobs/${slug}`,
                salary: extractCakeSalary(item),
                source: "cake" as const,
                logo: "🎂",
                remote: checkCakeRemote(item),
            };
        });
    } catch (error) {
        console.warn("CakeResume 搜尋失敗，使用備用資料:", error);
        return getMockCakeJobs(keyword);
    }
}

// ============================================================
// 輔助函數
// ============================================================

function extractString(obj: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
        const val = obj[key];
        if (typeof val === "string" && val.trim()) return val.trim();
        if (typeof val === "number") return String(val);
    }
    return "";
}

function parseSalary104(item: Record<string, unknown>): string {
    const salaryLow = item.salaryLow as number | undefined;
    const salaryHigh = item.salaryHigh as number | undefined;
    const salaryDesc = item.salaryDesc as string | undefined;

    if (salaryDesc) return salaryDesc;
    if (salaryLow && salaryHigh) {
        return `月薪 ${Math.round(salaryLow / 1000)}K-${Math.round(salaryHigh / 1000)}K`;
    }
    return "薪資面議";
}

function extractCakeCompany(item: Record<string, unknown>): string {
    if (item.company && typeof item.company === "object") {
        const c = item.company as Record<string, unknown>;
        return extractString(c, ["name", "display_name", "title"]) || "未知公司";
    }
    return extractString(item, ["company_name", "companyName", "employer"]) || "未知公司";
}

function extractCakeLocation(item: Record<string, unknown>): string {
    if (item.location && typeof item.location === "object") {
        const l = item.location as Record<string, unknown>;
        return extractString(l, ["name", "display", "city"]) || "台灣";
    }
    return extractString(item, ["location", "city", "region"]) || "台灣";
}

function extractCakeSalary(item: Record<string, unknown>): string {
    if (item.salary_range && typeof item.salary_range === "object") {
        const s = item.salary_range as Record<string, unknown>;
        const min = s.min as number | undefined;
        const max = s.max as number | undefined;
        if (min && max) return `月薪 ${Math.round(min / 1000)}K-${Math.round(max / 1000)}K`;
    }
    return extractString(item, ["salary", "compensation", "salary_desc"]) || "薪資面議";
}

function checkCakeRemote(item: Record<string, unknown>): boolean {
    const remoteAllowed = item.remote_allowed || item.remote || item.is_remote;
    return Boolean(remoteAllowed);
}

// ============================================================
// 備用 Mock 資料（針對前端工程師 Lai Mengru 優化）
// ============================================================

function getMock104Jobs(keyword: string): Job[] {
    const kw = keyword.toLowerCase();
    const isFrontend = kw.includes("前端") || kw.includes("frontend") ||
        kw.includes("react") || kw.includes("javascript") ||
        kw.includes("ui") || kw.includes("web");

    if (isFrontend) {
        return [
            {
                id: "104-mock-fe-1",
                company: "TrendMicro 趨勢科技",
                title: "Frontend Software Engineer",
                location: "台北市南港區",
                description: "Join our global product team to build world-class security software interfaces. You will develop React-based frontend applications, collaborate with UX designers, and work with international teams. Strong JavaScript and CSS skills are required. Experience with responsive design and Git workflow is essential. Passion for UI/UX and clean, maintainable code is a big plus.",
                url: "https://www.104.com.tw/company/1a2x6bkj8x",
                salary: "月薪 60K-90K",
                source: "104",
                logo: "🏢",
                remote: false,
            },
            {
                id: "104-mock-fe-2",
                company: "KKday 酷遊天",
                title: "前端工程師",
                location: "台北市中山區",
                description: "KKday 旅遊電商平台徵求前端工程師，加入我們的核心產品開發團隊。你將負責開發旅遊行程頁面、訂單流程及使用者體驗優化。需熟悉 React、JavaScript 及 RWD 開發，具備良好的跨瀏覽器相容性處理能力。有電商或旅遊平台前端開發經驗者加分，英文溝通能力佳者優先考慮。",
                url: "https://www.104.com.tw/company/kkday",
                salary: "月薪 50K-80K",
                source: "104",
                logo: "🏢",
                remote: true,
            },
            {
                id: "104-mock-fe-3",
                company: "LINE Taiwan",
                title: "Web Frontend Engineer",
                location: "台北市信義區",
                description: "LINE 台灣正在招募 Web Frontend Engineer，負責開發和維護 LINE 各項 Web 服務。你將使用現代化前端技術（React）建構高流量應用程式，與設計、後端及 QA 團隊緊密協作。具備良好的程式碼品質意識，對使用者體驗有熱忱。熟悉 HTML5、CSS3、JavaScript 及 Git 工作流程者優先。",
                url: "https://www.104.com.tw/company/line-taiwan",
                salary: "月薪 65K-110K",
                source: "104",
                logo: "🏢",
                remote: false,
            },
        ];
    }

    return [
        {
            id: "104-mock-1",
            company: "台灣科技股份有限公司",
            title: `${keyword} 工程師`,
            location: "台北市",
            description: `誠徵優秀的 ${keyword} 工程師加入我們的研發團隊。負責產品開發、系統設計及維護，並與不同部門協作推動技術創新。歡迎具備豐富相關經驗的求職者投遞履歷。`,
            url: "https://www.104.com.tw/job/mock1",
            salary: "月薪 60K-100K",
            source: "104",
            logo: "🏢",
            remote: false,
        },
        {
            id: "104-mock-2",
            company: "數位創新有限公司",
            title: `資深 ${keyword} 開發工程師`,
            location: "新北市",
            description: `招募資深 ${keyword} 工程師，負責系統架構設計與技術選型，帶領工程團隊進行產品迭代開發。需具備扎實的程式基礎及良好的溝通協調能力。`,
            url: "https://www.104.com.tw/job/mock2",
            salary: "月薪 80K-120K",
            source: "104",
            logo: "🏢",
            remote: true,
        },
    ];
}

function getMockCakeJobs(keyword: string): Job[] {
    const kw = keyword.toLowerCase();
    const isFrontend = kw.includes("前端") || kw.includes("frontend") ||
        kw.includes("react") || kw.includes("javascript") ||
        kw.includes("ui") || kw.includes("web");

    if (isFrontend) {
        return [
            {
                id: "cake-mock-fe-1",
                company: "Shopback 台灣",
                title: "Frontend Engineer (React)",
                location: "台北市（遠端友善）",
                description: "Shopback is looking for a Frontend Engineer to join our team. You'll build features for our cashback and rewards platform used by millions across Asia. We value clean code, strong UI sensibility, and a product-first mindset. Required: React, JavaScript, CSS, Git. Design background and passion for user experience is a big plus.",
                url: "https://www.cakeresume.com/companies/shopback/jobs",
                salary: "月薪 55K-90K",
                source: "cake",
                logo: "🎂",
                remote: true,
            },
            {
                id: "cake-mock-fe-2",
                company: "CakeResume 台灣",
                title: "Junior Frontend Developer",
                location: "台北市大安區",
                description: "CakeResume 招募 Junior Frontend Developer，加入我們打造下一代求職平台。你將在資深工程師的指導下，使用 React 開發新功能並維護既有元件。我們重視學習熱情與作品集展現的實踐能力。具備 HTML、CSS、JavaScript 基礎，Git 使用習慣良好者優先。歡迎有個人專案作品集者投遞。",
                url: "https://www.cakeresume.com/companies/cake/jobs",
                salary: "月薪 40K-65K",
                source: "cake",
                logo: "🎂",
                remote: true,
            },
        ];
    }

    return [
        {
            id: "cake-mock-1",
            company: "新創科技 StartupHub",
            title: `${keyword} 全端工程師`,
            location: "台北市（遠端優先）",
            description: `我們是一家快速成長的新創公司，正在尋找熱愛技術的 ${keyword} 全端工程師。你將有機會參與產品架構決策，並在扁平化的組織文化中快速成長。`,
            url: "https://www.cakeresume.com/companies/startuphub/jobs",
            salary: "月薪 70K-120K",
            source: "cake",
            logo: "🎂",
            remote: true,
        },
    ];
}
