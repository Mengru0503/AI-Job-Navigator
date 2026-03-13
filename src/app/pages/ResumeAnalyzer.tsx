import { useState, useRef, useCallback } from "react";
import {
  FileText,
  Sparkles,
  Target,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Upload,
  Link,
  AlignLeft,
  X,
  AlertCircle,
  Key,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { useResumeParser } from "../../hooks/useResumeParser";
import { useResumeStore } from "../../store/useResumeStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { analyzeJobMatch } from "../../services/aiService";
import { JobAnalysis } from "../../types";

type InputMode = "text" | "url" | "pdf";

export function ResumeAnalyzer() {
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [textInput, setTextInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [jobDescription, setJobDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<JobAnalysis | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isLoading: isParsing, error: parseError, parseText, parseUrl, parsePdf, clearError } = useResumeParser();
  const { resume } = useResumeStore();
  const { settings } = useSettingsStore();

  // 處理履歷儲存
  const handleSaveResume = () => {
    if (inputMode === "text") {
      if (!textInput.trim()) { toast.error("請輸入履歷內容"); return; }
      parseText(textInput);
      toast.success("履歷已儲存！");
    } else if (inputMode === "url") {
      if (!urlInput.trim()) { toast.error("請輸入網址"); return; }
      parseUrl(urlInput).then(() => {
        if (!parseError) toast.success("已成功從網址讀取履歷！");
      });
    } else if (inputMode === "pdf") {
      if (!pdfFile) { toast.error("請選擇 PDF 檔案"); return; }
      parsePdf(pdfFile).then(() => {
        if (!parseError) toast.success("PDF 解析完成！");
      });
    }
  };

  // 拖曳上傳處理
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    } else {
      toast.error("請上傳 PDF 格式的檔案");
    }
  }, []);

  // AI 分析
  const handleAnalyze = async () => {
    if (!resume?.resumeText) {
      toast.error("請先上傳或輸入您的履歷");
      return;
    }
    if (!jobDescription.trim()) {
      toast.error("請輸入職位描述");
      return;
    }

    const provider = settings.aiProvider;
    const apiKey = provider === "gemini" ? settings.geminiApiKey : settings.openaiApiKey;
    const model = provider === "gemini" ? settings.geminiModel : settings.openaiModel;

    if (!apiKey) {
      toast.error(
        provider === "gemini"
          ? "請先在設定頁面輸入 Gemini API Key"
          : "請先在設定頁面輸入 OpenAI API Key"
      );
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeJobMatch(
        apiKey,
        model,
        resume.resumeText,
        jobDescription,
        "目標職位",
        "目標公司",
        provider
      );
      setAnalysisResult(result);
      toast.success("AI 分析完成！");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "分析失敗，請重試");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const scoreLabel = (score: number) => {
    if (score >= 85) return { text: "優秀", color: "text-emerald-700", bg: "bg-emerald-100" };
    if (score >= 70) return { text: "良好", color: "text-blue-700", bg: "bg-blue-100" };
    if (score >= 55) return { text: "普通", color: "text-amber-700", bg: "bg-amber-100" };
    return { text: "偏低", color: "text-red-700", bg: "bg-red-100" };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">履歷分析</h1>
          <p className="text-slate-600">上傳履歷並與職位描述進行 AI 智慧配對分析</p>
        </div>
      </div>

      {/* API Key 提示 */}
      {!(settings.aiProvider === "gemini" ? settings.geminiApiKey : settings.openaiApiKey) && (
        <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <Key className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              請先前往{" "}
              <a href="/settings" className="font-semibold underline hover:text-amber-900">
                設定頁面
              </a>{" "}
              輸入 {settings.aiProvider === "gemini" ? "Gemini" : "OpenAI"} API Key，才能使用 AI 分析功能
            </p>
          </CardContent>
        </Card>
      )}

      {/* 履歷來源選擇 */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-base">選擇履歷輸入方式</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* 模式切換 Tab */}
          <div className="flex gap-2 mb-6">
            {[
              { mode: "text" as InputMode, icon: AlignLeft, label: "文字輸入" },
              { mode: "url" as InputMode, icon: Link, label: "網址匯入" },
              { mode: "pdf" as InputMode, icon: Upload, label: "PDF 上傳" },
            ].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => { setInputMode(mode); clearError(); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${inputMode === mode
                  ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* 文字輸入模式 */}
          {inputMode === "text" && (
            <div className="space-y-3">
              <Label className="text-sm text-slate-700">貼上您的履歷內容</Label>
              <Textarea
                placeholder="請在此貼上您的履歷文字（工作經驗、技能、學歷等）..."
                className="min-h-[200px] resize-none border-slate-200 focus-visible:ring-violet-500"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
              <p className="text-xs text-slate-500">{textInput.length} 字元</p>
            </div>
          )}

          {/* URL 輸入模式 */}
          {inputMode === "url" && (
            <div className="space-y-3">
              <Label className="text-sm text-slate-700">履歷網址（例如：LinkedIn、CakeResume 個人頁面）</Label>
              <div className="flex gap-3">
                <Input
                  placeholder="https://www.cakeresume.com/your-profile"
                  className="border-slate-200 focus-visible:ring-violet-500"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
              </div>
              <p className="text-xs text-slate-500">
                系統將自動抓取頁面純文字內容作為履歷資料
              </p>
            </div>
          )}

          {/* PDF 上傳模式 */}
          {inputMode === "pdf" && (
            <div className="space-y-3">
              <Label className="text-sm text-slate-700">上傳 PDF 履歷</Label>
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${isDragging
                  ? "border-violet-400 bg-violet-50"
                  : "border-slate-300 hover:border-violet-400 hover:bg-slate-50"
                  }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setPdfFile(file);
                  }}
                />
                {pdfFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-violet-600" />
                    <div className="text-left">
                      <p className="font-medium text-slate-900">{pdfFile.name}</p>
                      <p className="text-sm text-slate-500">{(pdfFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPdfFile(null); }}
                      className="ml-2 p-1 rounded-full hover:bg-red-50 text-red-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className="font-medium text-slate-700">拖曳 PDF 到此處，或點擊上傳</p>
                    <p className="text-sm text-slate-500 mt-1">支援 PDF 格式，最大 10MB</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Parse 錯誤提示 */}
          {parseError && (
            <div className="flex items-center gap-2 p-3 mt-3 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{parseError}</p>
            </div>
          )}

          <Button
            onClick={handleSaveResume}
            disabled={isParsing}
            className="mt-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
          >
            {isParsing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                讀取中...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                儲存履歷
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 已儲存履歷狀態 */}
      {resume?.resumeText && (
        <Card className="border-emerald-200 bg-emerald-50/30 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-900">履歷已成功儲存</p>
              <p className="text-xs text-emerald-700">
                共 {resume.resumeText.length} 字元
                {resume.fileName && ` • ${resume.fileName}`}
                {resume.url && ` • 來源：${resume.url}`}
              </p>
            </div>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
              {resume.sourceType === "text" ? "文字輸入" : resume.sourceType === "url" ? "網址匯入" : "PDF 上傳"}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* 職位描述輸入 + 分析 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-base">您的履歷（預覽）</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Textarea
              placeholder="完成上方的履歷儲存後，這裡會顯示已儲存的內容..."
              className="min-h-[300px] resize-none border-slate-200 focus-visible:ring-violet-500 bg-slate-50"
              value={resume?.resumeText || ""}
              readOnly
            />
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-base">職位描述</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Textarea
              placeholder="請在此貼上目標職位的職位描述（JD）..."
              className="min-h-[300px] resize-none border-slate-200 focus-visible:ring-violet-500"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </CardContent>
        </Card>
      </div>

      {/* 分析按鈕 */}
      <div className="flex justify-center">
        <Button
          onClick={handleAnalyze}
          disabled={!resume?.resumeText || !jobDescription || isAnalyzing || !(settings.aiProvider === "gemini" ? settings.geminiApiKey : settings.openaiApiKey)}
          className="px-8 py-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all"
        >
          {isAnalyzing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              AI 分析中...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              AI 智慧分析
            </>
          )}
        </Button>
      </div>

      {/* 分析結果 */}
      {analysisResult && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* 整體配對分數 */}
          <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 shadow-md">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-6 h-6 text-violet-600" />
                    <h3 className="text-lg font-semibold text-slate-900">整體配對分數</h3>
                  </div>
                  {analysisResult.summary && (
                    <p className="text-slate-600 mb-4 max-w-md">{analysisResult.summary}</p>
                  )}
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                      {analysisResult.matchScore}%
                    </span>
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${scoreLabel(analysisResult.matchScore).bg}`}>
                      <TrendingUp className={`w-4 h-4 ${scoreLabel(analysisResult.matchScore).color}`} />
                      <span className={`text-sm font-medium ${scoreLabel(analysisResult.matchScore).color}`}>
                        {scoreLabel(analysisResult.matchScore).text}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <div className="relative w-32 h-32">
                    <svg className="transform -rotate-90 w-32 h-32">
                      <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="none" className="text-violet-200" />
                      <circle
                        cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="none"
                        strokeDasharray={`${analysisResult.matchScore * 3.51} ${100 * 3.51}`}
                        className="text-violet-600"
                        style={{ transition: "stroke-dasharray 1s ease" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-violet-600">{analysisResult.matchScore}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* 符合技能 */}
            <Card className="border-emerald-200 shadow-sm">
              <CardHeader className="border-b border-emerald-100 bg-emerald-50/50">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <CardTitle className="text-lg text-emerald-900">
                    符合技能（{analysisResult.matchedSkills.length}）
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {analysisResult.matchedSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.matchedSkills.map((skill) => (
                      <Badge key={skill} className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">未偵測到符合的技能</p>
                )}
              </CardContent>
            </Card>

            {/* 缺少技能 */}
            <Card className="border-amber-200 shadow-sm">
              <CardHeader className="border-b border-amber-100 bg-amber-50/50">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-amber-600" />
                  <CardTitle className="text-lg text-amber-900">
                    需要加強（{analysisResult.missingSkills.length}）
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {analysisResult.missingSkills.length > 0 ? (
                  <div className="space-y-2">
                    {analysisResult.missingSkills.map((skill) => (
                      <div
                        key={skill}
                        className="flex items-center justify-between p-2.5 bg-amber-50/50 rounded-lg border border-amber-100"
                      >
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-amber-600" />
                          <span className="font-medium text-slate-900 text-sm">{skill}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <p className="text-sm">恭喜！您已符合所有技能要求</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}