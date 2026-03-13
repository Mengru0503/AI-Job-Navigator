/**
 * 履歷解析服務
 * 支援三種輸入：文字直接輸入、URL 抓取、PDF 二進位讀取
 */

/**
 * 從 URL 抓取頁面文字
 * 使用 allorigins.win 作為 CORS proxy
 */
export async function fetchResumeFromUrl(url: string): Promise<string> {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

    const response = await fetch(proxyUrl);
    if (!response.ok) {
        throw new Error(`無法讀取網址：${url}，請確認網址是否正確`);
    }

    const data = await response.json();
    const html = data.contents as string;

    // 移除 HTML 標籤，擷取純文字
    const cleanText = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s{2,}/g, "\n")
        .trim();

    if (!cleanText || cleanText.length < 50) {
        throw new Error("無法從此網址擷取有效的履歷內容");
    }

    // 限制長度避免 token 過多
    return cleanText.substring(0, 8000);
}

/**
 * 從 PDF File 物件讀取文字
 * 使用 pdfjs-dist（純前端，無需伺服器）
 */
export async function extractTextFromPdf(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();

    // 動態 import pdfjs 避免 SSR 問題
    const pdfjsLib = await loadPdfJs();

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .map((item: Record<string, unknown>) => {
                if ("str" in item) return item.str as string;
                return "";
            })
            .join(" ");
        fullText += pageText + "\n";
    }

    if (!fullText.trim()) {
        throw new Error("無法從 PDF 擷取文字，請確認 PDF 不是純圖片格式");
    }

    return fullText.substring(0, 8000);
}

/**
 * 動態載入 pdfjs-dist
 */
async function loadPdfJs() {
    try {
        const pdfjs = await import("pdfjs-dist");
        // 設定 worker 路徑（使用 CDN）
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;
        return pdfjs;
    } catch (error) {
        throw new Error("PDF 解析模組載入失敗，請確認網路連線");
    }
}

/**
 * 標準化履歷文字（清理多餘空白）
 */
export function normalizeResumeText(text: string): string {
    return text
        .replace(/\r\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .substring(0, 8000); // 限制最大長度
}
