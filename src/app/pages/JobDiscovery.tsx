import { useState } from "react";
import {
  Search,
  MapPin,
  Briefcase,
  Star,
  Clock,
  XCircle,
  Bookmark,
  ExternalLink,
  SlidersHorizontal,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Loader2,
  Plus,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Slider } from "../components/ui/slider";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { useJobSearch, JobWithAnalysis } from "../../hooks/useJobSearch";
import { useJobTrackerStore } from "../../store/useJobTrackerStore";

export function JobDiscovery() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [minMatchScore, setMinMatchScore] = useState([0]);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobWithAnalysis | null>(null);
  const [showHrDialog, setShowHrDialog] = useState(false);
  const [hrJobId, setHrJobId] = useState<string | null>(null);
  const [generatingHr, setGeneratingHr] = useState(false);

  const {
    jobs,
    isSearching,
    isAnalyzing,
    analysisProgress,
    searchError,
    analysisError,
    search,
    analyzeAll,
    generateIntro,
    hasResume,
    hasApiKey,
  } = useJobSearch();

  const { addJob, trackedJobs } = useJobTrackerStore();

  // 過濾職位
  const filteredJobs = jobs.filter((job) => {
    const matchesScore = !job.matchScore || job.matchScore >= minMatchScore[0];
    const matchesRemote = !remoteOnly || job.remote;
    return matchesScore && matchesRemote;
  });

  // 搜尋處理
  const handleSearch = () => {
    if (!searchQuery.trim()) { toast.error("請輸入搜尋關鍵字"); return; }
    search(searchQuery);
  };

  // 儲存職位到追蹤器
  const handleSaveJob = (job: JobWithAnalysis) => {
    const alreadyTracked = trackedJobs.some((t) => t.id === job.id);
    if (alreadyTracked) { toast.info("此職位已在追蹤清單中"); return; }

    addJob({
      id: job.id,
      company: job.company,
      role: job.title,
      location: job.location,
      salary: job.salary,
      status: "saved",
      matchScore: job.matchScore || 0,
      lastUpdate: new Date().toISOString().split("T")[0],
      description: job.description,
      requiredSkills: job.matchedSkills || [],
      missingSkills: job.missingSkills || [],
      notes: "",
      url: job.url,
      hrIntroMessage: job.hrIntro,
    });
    toast.success(`已將「${job.title}」加入追蹤清單`);
  };

  // 生成 HR 介紹信
  const handleGenerateHrIntro = async (jobId: string) => {
    if (!hasResume) { toast.error("請先在履歷分析頁面上傳您的履歷"); return; }
    if (!hasApiKey) { toast.error("請先在設定頁面輸入 OpenAI API Key"); return; }

    setHrJobId(jobId);
    setGeneratingHr(true);
    setShowHrDialog(true);
    try {
      await generateIntro(jobId);
      toast.success("HR 介紹信已生成！");
    } catch {
      toast.error("生成失敗，請重試");
    } finally {
      setGeneratingHr(false);
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return "from-slate-400 to-slate-500";
    if (score >= 85) return "from-emerald-500 to-teal-600";
    if (score >= 70) return "from-violet-500 to-indigo-600";
    if (score >= 55) return "from-amber-500 to-orange-500";
    return "from-red-500 to-rose-600";
  };

  const getSourceIcon = (source?: string) => {
    if (source === "104") return "📋";
    if (source === "cake") return "🎂";
    return "🏢";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
          <Search className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">職位探索</h1>
          <p className="text-slate-600">從 104、CakeResume 搜尋職位並進行 AI 配對分析</p>
        </div>
      </div>

      {/* 提示橫條 */}
      {(!hasResume || !hasApiKey) && (
        <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 space-y-1">
                {!hasResume && <p>• 尚未上傳履歷。請前往 <a href="/resume-analyzer" className="font-semibold underline">履歷分析</a> 頁面上傳，以啟用 AI 配對功能</p>}
                {!hasApiKey && <p>• 尚未設定 API Key。請前往 <a href="/settings" className="font-semibold underline">設定</a> 頁面輸入 OpenAI API Key</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 搜尋框 */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="搜尋職位、技能（例如：React 工程師、前端開發）..."
                className="pl-10 border-slate-200 focus-visible:ring-violet-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button
              variant="outline"
              className={`border-slate-200 hover:bg-slate-50 ${showFilters ? "bg-slate-100" : ""}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-5 h-5 mr-2" />
              篩選
            </Button>
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md"
            >
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "搜尋"}
            </Button>
          </div>

          {/* 篩選面板 */}
          {showFilters && (
            <div className="pt-4 border-t border-slate-200 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-slate-700">最低配對分數</Label>
                    <span className="text-sm font-semibold text-violet-700">{minMatchScore[0]}%</span>
                  </div>
                  <Slider
                    value={minMatchScore}
                    onValueChange={setMinMatchScore}
                    min={0}
                    max={100}
                    step={5}
                    disabled={jobs.every((j) => !j.matchScore)}
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700">工作型態</Label>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-sm text-slate-700">僅顯示遠端工作</span>
                    <Switch checked={remoteOnly} onCheckedChange={setRemoteOnly} />
                  </div>
                </div>
              </div>
              {minMatchScore[0] > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">已套用篩選：</span>
                  <Badge variant="secondary" className="bg-violet-100 text-violet-700">
                    配對分數 ≥ {minMatchScore[0]}%
                    <button onClick={() => setMinMatchScore([0])} className="ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 錯誤提示 */}
      {(searchError || analysisError) && (
        <div className="flex items-center gap-2 p-4 bg-red-50 rounded-xl border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{searchError || analysisError}</p>
        </div>
      )}

      {/* 結果數量 + AI 分析按鈕 */}
      {jobs.length > 0 && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">
              共找到 <span className="font-semibold text-slate-900">{filteredJobs.length}</span> 個職位
              {jobs.some((j) => j.matchScore !== undefined) && "，已依配對分數排序"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isAnalyzing && (
              <p className="text-sm text-violet-700 font-medium">
                分析中 {analysisProgress.completed}/{analysisProgress.total}...
              </p>
            )}
            <Button
              onClick={analyzeAll}
              disabled={isAnalyzing || !hasResume || !hasApiKey}
              variant="outline"
              className="border-violet-200 text-violet-700 hover:bg-violet-50"
            >
              {isAnalyzing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />AI 分析中...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />AI 批次分析所有職位</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* 搜尋中 Loading */}
      {isSearching && (
        <div className="flex flex-col items-center py-16">
          <Loader2 className="w-10 h-10 text-violet-600 animate-spin mb-4" />
          <p className="text-slate-600">正在搜尋職位...</p>
          <p className="text-sm text-slate-500 mt-1">從 104 及 CakeResume 抓取資料</p>
        </div>
      )}

      {/* 職位卡片 */}
      {!isSearching && (
        <div className="grid gap-4">
          {filteredJobs.map((job) => (
            <Card
              key={job.id}
              className="border-slate-200 shadow-sm hover:shadow-lg hover:border-violet-200 transition-all group"
            >
              <CardContent className="p-6">
                <div className="flex gap-5">
                  {/* Logo */}
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-2xl shadow-sm">
                      {getSourceIcon(job.source)}
                    </div>
                  </div>

                  {/* 職位資訊 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-slate-900 group-hover:text-violet-700 transition-colors">
                            {job.title}
                          </h3>
                          {job.source && (
                            <Badge variant="outline" className="text-xs text-slate-500 border-slate-200">
                              {job.source === "104" ? "104人力銀行" : "CakeResume"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-slate-700 font-medium mb-2">{job.company}</p>
                        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                          {job.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {job.location}
                            </div>
                          )}
                          {job.jobType && (
                            <div className="flex items-center gap-1">
                              <Briefcase className="w-4 h-4" />
                              {job.jobType}
                            </div>
                          )}
                          {job.remote && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                              遠端
                            </Badge>
                          )}
                          {job.salary && (
                            <span className="font-medium text-slate-900">{job.salary}</span>
                          )}
                          {job.postedDate && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {job.postedDate}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 配對分數 */}
                      {job.matchScore !== undefined ? (
                        <div className="flex flex-col items-end gap-1 ml-4">
                          <div className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${getScoreColor(job.matchScore)} rounded-full shadow-md`}>
                            <Star className="w-4 h-4 text-white fill-white" />
                            <span className="font-semibold text-white">{job.matchScore}%</span>
                          </div>
                          <span className="text-xs font-medium text-violet-700">AI 配對</span>
                        </div>
                      ) : job.isAnalyzing ? (
                        <div className="ml-4">
                          <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
                        </div>
                      ) : null}
                    </div>

                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">{job.description}</p>

                    {/* 技能標籤 */}
                    {job.matchedSkills && job.matchedSkills.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">符合技能</p>
                        <div className="flex flex-wrap gap-1.5">
                          {job.matchedSkills.slice(0, 5).map((skill) => (
                            <Badge key={skill} className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {job.missingSkills && job.missingSkills.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">需要加強</p>
                        <div className="flex flex-wrap gap-1.5">
                          {job.missingSkills.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 操作按鈕 */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                      <Button
                        asChild
                        className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-sm"
                      >
                        <a href={job.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          查看職缺
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        className="border-slate-200 hover:bg-slate-50"
                        onClick={() => handleSaveJob(job)}
                      >
                        <Bookmark className="w-4 h-4 mr-2" />
                        儲存
                      </Button>
                      <Button
                        variant="outline"
                        className="border-violet-200 text-violet-700 hover:bg-violet-50"
                        onClick={() => handleGenerateHrIntro(job.id)}
                        disabled={!hasResume || !hasApiKey}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        HR 介紹信
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 空狀態 */}
      {!isSearching && jobs.length === 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-16 text-center">
            <Search className="w-14 h-14 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">開始搜尋職位</h3>
            <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
              輸入職位關鍵字（例如：React、前端工程師、Python），系統將從 104 和 CakeResume 搜尋相關職缺
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-2"><span>📋</span>104 人力銀行</span>
              <span className="flex items-center gap-2"><span>🎂</span>CakeResume</span>
            </div>
          </CardContent>
        </Card>
      )}

      {!isSearching && jobs.length > 0 && filteredJobs.length === 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-12 text-center">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">找不到符合篩選條件的職位</h3>
            <Button variant="outline" onClick={() => { setMinMatchScore([0]); setRemoteOnly(false); }}>
              清除篩選
            </Button>
          </CardContent>
        </Card>
      )}

      {/* HR 介紹信 Dialog */}
      <Dialog open={showHrDialog} onOpenChange={setShowHrDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-violet-600" />
              HR 自我介紹信
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            {generatingHr ? (
              <div className="flex flex-col items-center py-8">
                <Loader2 className="w-8 h-8 text-violet-600 animate-spin mb-3" />
                <p className="text-sm text-slate-600">AI 正在生成個人化介紹信...</p>
              </div>
            ) : hrJobId && jobs.find((j) => j.id === hrJobId)?.hrIntro ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed">
                  {jobs.find((j) => j.id === hrJobId)?.hrIntro}
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    const text = jobs.find((j) => j.id === hrJobId)?.hrIntro || "";
                    navigator.clipboard.writeText(text);
                    toast.success("已複製到剪貼板！");
                  }}
                >
                  複製內容
                </Button>
              </div>
            ) : (
              <p className="text-sm text-red-600">生成失敗，請關閉後重試</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
