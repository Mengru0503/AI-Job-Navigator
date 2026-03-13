/**
 * AI 服務層
 * 支援 OpenAI 與 Google Gemini 兩種 AI 提供者
 * API Key 從使用者設定中讀取，全部在前端執行（無需後端）
 */

import { JobAnalysis, AiProvider } from "../types";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// ─── OpenAI ─────────────────────────────────────────────────────────────────

/**
 * 呼叫 OpenAI Chat Completions API
 */
async function callOpenAI(
    apiKey: string,
    model: string,
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
    maxTokens: number = 800
): Promise<string> {
    if (!apiKey || apiKey.trim() === "") {
        throw new Error("請先在設定頁面輸入 OpenAI API Key");
    }

    const response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages,
            max_tokens: maxTokens,
            temperature: 0.3,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = (errorData as { error?: { message?: string } })?.error?.message || `API 請求失敗 (${response.status})`;

        if (response.status === 401) {
            throw new Error("OpenAI API Key 無效，請確認設定頁面的 API Key 是否正確");
        }
        if (response.status === 429) {
            throw new Error("API 請求頻率超限，請稍後再試");
        }
        throw new Error(errorMsg);
    }

    const data = await response.json() as {
        choices: Array<{ message: { content: string } }>;
    };
    return data.choices[0]?.message?.content || "";
}

// ─── Gemini ──────────────────────────────────────────────────────────────────

/**
 * 呼叫 Google Gemini API (generateContent)
 */
async function callGemini(
    apiKey: string,
    model: string,
    systemPrompt: string,
    userPrompt: string,
    maxTokens: number = 800
): Promise<string> {
    if (!apiKey || apiKey.trim() === "") {
        throw new Error("請先在設定頁面輸入 Gemini API Key");
    }

    const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            system_instruction: {
                parts: [{ text: systemPrompt }],
            },
            contents: [
                {
                    role: "user",
                    parts: [{ text: userPrompt }],
                },
            ],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: maxTokens,
            },
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg =
            (errorData as { error?: { message?: string } })?.error?.message ||
            `Gemini API 請求失敗 (${response.status})`;

        if (response.status === 400 || response.status === 403) {
            throw new Error("Gemini API Key 無效，請確認設定頁面的 API Key 是否正確");
        }
        if (response.status === 429) {
            throw new Error("Gemini API 請求頻率超限，請稍後再試");
        }
        throw new Error(errorMsg);
    }

    const data = await response.json() as {
        candidates: Array<{
            content: { parts: Array<{ text: string }> };
        }>;
    };

    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ─── 通用分發層 ──────────────────────────────────────────────────────────────

interface AiCallOptions {
    provider: AiProvider;
    apiKey: string;
    model: string;
    systemPrompt: string;
    userPrompt: string;
    maxTokens?: number;
}

/**
 * 根據 provider 分發到對應的 AI API
 */
async function callAI(options: AiCallOptions): Promise<string> {
    const { provider, apiKey, model, systemPrompt, userPrompt, maxTokens = 800 } = options;

    if (provider === "gemini") {
        return callGemini(apiKey, model, systemPrompt, userPrompt, maxTokens);
    } else {
        // OpenAI
        return callOpenAI(
            apiKey,
            model,
            [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            maxTokens
        );
    }
}

// ─── 業務功能 ────────────────────────────────────────────────────────────────

/**
 * 分析履歷與職位的配對程度
 * 返回結構化 JSON：matchScore, matchedSkills, missingSkills
 */
export async function analyzeJobMatch(
    apiKey: string,
    model: string,
    resumeText: string,
    jobDescription: string,
    jobTitle: string,
    company: string,
    provider: AiProvider = "openai"
): Promise<JobAnalysis> {
    const systemPrompt = `You are an expert HR analyst specializing in resume-job matching.
Analyze the resume and job description provided.
Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "matchScore": <number 0-100>,
  "matchedSkills": [<array of matched skill strings>],
  "missingSkills": [<array of missing skill strings>],
  "summary": "<one sentence in Traditional Chinese explaining the match>"
}`;

    const userPrompt = `Analyze this job match:

**Job Position:** ${jobTitle} at ${company}

**Job Description:**
${jobDescription.substring(0, 2000)}

**Resume:**
${resumeText.substring(0, 3000)}

Return structured JSON analysis only.`;

    try {
        const rawResponse = await callAI({
            provider,
            apiKey,
            model,
            systemPrompt,
            userPrompt,
            maxTokens: 600,
        });

        // 解析 JSON，移除可能的 markdown 代碼塊
        const cleanedResponse = rawResponse
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();

        const result = JSON.parse(cleanedResponse) as JobAnalysis;

        // 驗證必要欄位
        return {
            matchScore: Math.min(100, Math.max(0, Number(result.matchScore) || 0)),
            matchedSkills: Array.isArray(result.matchedSkills) ? result.matchedSkills : [],
            missingSkills: Array.isArray(result.missingSkills) ? result.missingSkills : [],
            summary: result.summary || "",
        };
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error("AI 回應格式錯誤，請重試");
        }
        throw error;
    }
}

/**
 * 生成 HR 自我介紹訊息
 * 輸出：80-120 字的個人化自我介紹
 */
export async function generateHrIntro(
    apiKey: string,
    model: string,
    resumeText: string,
    jobDescription: string,
    company: string,
    jobTitle: string,
    provider: AiProvider = "openai"
): Promise<string> {
    const systemPrompt = `You are a professional career coach who writes compelling HR introduction messages.
Write a concise, personalized message in Traditional Chinese (繁體中文) for a job applicant.
The message should be 80-120 words and include:
1. Why the candidate fits the role
2. 2-3 key relevant skills or experiences
3. Alignment with company culture/values
4. Enthusiasm for the position
Return ONLY the message text, nothing else.`;

    const userPrompt = `Write an HR introduction message for:

**Company:** ${company}
**Position:** ${jobTitle}

**Job Description:**
${jobDescription.substring(0, 1500)}

**Resume (key points):**
${resumeText.substring(0, 2000)}

Write the message in Traditional Chinese (繁體中文), 80-120 words.`;

    const message = await callAI({
        provider,
        apiKey,
        model,
        systemPrompt,
        userPrompt,
        maxTokens: 300,
    });

    return message.trim();
}

/**
 * 批次分析多個職位（依序執行避免 rate limit）
 */
export async function analyzeMultipleJobs(
    apiKey: string,
    model: string,
    resumeText: string,
    jobs: Array<{ id: string; title: string; company: string; description: string }>,
    onProgress?: (completed: number, total: number) => void,
    provider: AiProvider = "openai"
): Promise<Record<string, JobAnalysis>> {
    const results: Record<string, JobAnalysis> = {};
    let completed = 0;

    for (const job of jobs) {
        try {
            const analysis = await analyzeJobMatch(
                apiKey,
                model,
                resumeText,
                job.description,
                job.title,
                job.company,
                provider
            );
            results[job.id] = analysis;
        } catch (error) {
            // 單一職位失敗不中止批次，記錄錯誤資訊
            results[job.id] = {
                matchScore: 0,
                matchedSkills: [],
                missingSkills: [],
                summary: "分析失敗，請重試",
            };
        }

        completed++;
        onProgress?.(completed, jobs.length);

        // 每次請求之間等待 500ms 避免 rate limit
        if (completed < jobs.length) {
            await new Promise((r) => setTimeout(r, 500));
        }
    }

    return results;
}
