import { useState } from "react";
import { ResumeData, ResumeSourceType } from "../types";
import { fetchResumeFromUrl, extractTextFromPdf, normalizeResumeText } from "../services/resumeParser";
import { useResumeStore } from "../store/useResumeStore";

export interface UseResumeParserReturn {
    isLoading: boolean;
    error: string | null;
    parseText: (text: string) => void;
    parseUrl: (url: string) => Promise<void>;
    parsePdf: (file: File) => Promise<void>;
    clearError: () => void;
}

export function useResumeParser(): UseResumeParserReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { setResume } = useResumeStore();

    const saveResume = (text: string, sourceType: ResumeSourceType, extra?: Partial<ResumeData>) => {
        const normalized = normalizeResumeText(text);
        setResume({
            resumeText: normalized,
            sourceType,
            parsedAt: Date.now(),
            ...extra,
        });
    };

    const parseText = (text: string) => {
        if (!text.trim()) {
            setError("請輸入履歷內容");
            return;
        }
        setError(null);
        saveResume(text, "text");
    };

    const parseUrl = async (url: string) => {
        if (!url.trim()) {
            setError("請輸入有效的網址");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const text = await fetchResumeFromUrl(url);
            saveResume(text, "url", { url });
        } catch (err) {
            setError(err instanceof Error ? err.message : "網址讀取失敗，請重試");
        } finally {
            setIsLoading(false);
        }
    };

    const parsePdf = async (file: File) => {
        if (!file) {
            setError("請選擇 PDF 檔案");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const text = await extractTextFromPdf(file);
            saveResume(text, "pdf", { fileName: file.name });
        } catch (err) {
            setError(err instanceof Error ? err.message : "PDF 解析失敗，請重試");
        } finally {
            setIsLoading(false);
        }
    };

    return { isLoading, error, parseText, parseUrl, parsePdf, clearError: () => setError(null) };
}
