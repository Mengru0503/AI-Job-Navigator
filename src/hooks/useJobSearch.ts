import { useState, useRef } from "react";
import { Job, JobAnalysis } from "../types";
import { searchJobs } from "../services/jobSearchService";
import { analyzeMultipleJobs, generateHrIntro } from "../services/aiService";
import { useSettingsStore } from "../store/useSettingsStore";
import { useResumeStore } from "../store/useResumeStore";

export interface JobWithAnalysis extends Job {
    analysis?: JobAnalysis;
    hrIntro?: string;
    isAnalyzing?: boolean;
}

export function useJobSearch() {
    const [jobs, setJobs] = useState<JobWithAnalysis[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState({ completed: 0, total: 0 });
    const [searchError, setSearchError] = useState<string | null>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [lastKeyword, setLastKeyword] = useState("");

    const { settings } = useSettingsStore();
    const { resume } = useResumeStore();

    /**
     * 搜尋職位
     */
    const search = async (keyword: string) => {
        if (!keyword.trim()) {
            setSearchError("請輸入搜尋關鍵字");
            return;
        }

        setIsSearching(true);
        setSearchError(null);
        setLastKeyword(keyword);

        try {
            const results = await searchJobs(keyword, settings.searchSources);
            setJobs(results);
        } catch (err) {
            setSearchError(err instanceof Error ? err.message : "搜尋失敗，請重試");
        } finally {
            setIsSearching(false);
        }
    };

    /**
     * 對所有搜尋結果進行 AI 配對分析
     */
    const analyzeAll = async () => {
        if (!resume?.resumeText) {
            setAnalysisError("請先在履歷分析頁面上傳您的履歷");
            return;
        }

        const provider = settings.aiProvider;
        const apiKey = provider === "gemini" ? settings.geminiApiKey : settings.openaiApiKey;
        const model = provider === "gemini" ? settings.geminiModel : settings.openaiModel;

        if (!apiKey) {
            setAnalysisError(
                provider === "gemini"
                    ? "請先在設定頁面輸入 Gemini API Key"
                    : "請先在設定頁面輸入 OpenAI API Key"
            );
            return;
        }
        if (jobs.length === 0) {
            setAnalysisError("請先搜尋職位");
            return;
        }

        setIsAnalyzing(true);
        setAnalysisError(null);
        setAnalysisProgress({ completed: 0, total: jobs.length });

        try {
            const analyses = await analyzeMultipleJobs(
                apiKey,
                model,
                resume.resumeText,
                jobs.map((j) => ({
                    id: j.id,
                    title: j.title,
                    company: j.company,
                    description: j.description,
                })),
                (completed, total) => setAnalysisProgress({ completed, total }),
                provider
            );

            setJobs((prev) =>
                prev
                    .map((job) => ({
                        ...job,
                        analysis: analyses[job.id],
                        matchScore: analyses[job.id]?.matchScore,
                        matchedSkills: analyses[job.id]?.matchedSkills,
                        missingSkills: analyses[job.id]?.missingSkills,
                    }))
                    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
            );
        } catch (err) {
            setAnalysisError(err instanceof Error ? err.message : "AI 分析失敗，請重試");
        } finally {
            setIsAnalyzing(false);
        }
    };

    /**
     * 為特定職位生成 HR 介紹信
     */
    const generateIntro = async (jobId: string): Promise<string | null> => {
        if (!resume?.resumeText) {
            setAnalysisError("請先上傳您的履歷");
            return null;
        }

        const provider = settings.aiProvider;
        const apiKey = provider === "gemini" ? settings.geminiApiKey : settings.openaiApiKey;
        const model = provider === "gemini" ? settings.geminiModel : settings.openaiModel;

        if (!apiKey) {
            setAnalysisError(
                provider === "gemini"
                    ? "請先在設定頁面輸入 Gemini API Key"
                    : "請先在設定頁面輸入 OpenAI API Key"
            );
            return null;
        }

        const job = jobs.find((j) => j.id === jobId);
        if (!job) return null;

        try {
            const intro = await generateHrIntro(
                apiKey,
                model,
                resume.resumeText,
                job.description,
                job.company,
                job.title,
                provider
            );

            setJobs((prev) =>
                prev.map((j) => (j.id === jobId ? { ...j, hrIntro: intro } : j))
            );

            return intro;
        } catch (err) {
            setAnalysisError(err instanceof Error ? err.message : "HR 介紹信生成失敗");
            return null;
        }
    };

    return {
        jobs,
        isSearching,
        isAnalyzing,
        analysisProgress,
        searchError,
        analysisError,
        lastKeyword,
        search,
        analyzeAll,
        generateIntro,
        clearSearchError: () => setSearchError(null),
        clearAnalysisError: () => setAnalysisError(null),
        hasResume: Boolean(resume?.resumeText),
        hasApiKey: Boolean(
            settings.aiProvider === "gemini"
                ? settings.geminiApiKey
                : settings.openaiApiKey
        ),
    };
}
