import { TrendingUp, Briefcase, Target, CheckCircle, ArrowUpRight, Star, AlertCircle, Key } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useJobTrackerStore } from "../../store/useJobTrackerStore";
import { useResumeStore } from "../../store/useResumeStore";
import { useSettingsStore } from "../../store/useSettingsStore";

const aiRecommendations = [
  {
    id: 1,
    type: "skill",
    title: "學習 TypeScript 進階模式",
    description: "有 3 個職位需要進階的 TypeScript 知識",
    priority: "high",
  },
  {
    id: 2,
    type: "job",
    title: "應徵最高配對職位",
    description: "前往職位探索頁面，查看 AI 配對結果並立即應徵",
    priority: "high",
  },
  {
    id: 3,
    type: "profile",
    title: "更新履歷加入最新專案",
    description: "新增近期工作經驗可提升職位配對率",
    priority: "medium",
  },
];

export function Dashboard() {
  const { trackedJobs } = useJobTrackerStore();
  const { resume } = useResumeStore();
  const { settings } = useSettingsStore();

  // 計算統計數據
  const jobsWithScore = trackedJobs.filter((j) => j.matchScore > 0);
  const avgScore = jobsWithScore.length
    ? Math.round(jobsWithScore.reduce((sum, j) => sum + j.matchScore, 0) / jobsWithScore.length)
    : 0;
  const appliedCount = trackedJobs.filter((j) => j.status === "applied" || j.status === "interview" || j.status === "offer").length;

  const stats = [
    {
      name: "追蹤職位",
      value: String(trackedJobs.length),
      change: `${trackedJobs.filter((j) => j.status === "saved").length} 個已儲存`,
      trend: "up",
      icon: Briefcase,
      color: "violet",
    },
    {
      name: "已投遞",
      value: String(appliedCount),
      change: `${trackedJobs.filter((j) => j.status === "interview").length} 個面試中`,
      trend: "up",
      icon: CheckCircle,
      color: "emerald",
    },
    {
      name: "平均配對分數",
      value: avgScore > 0 ? `${avgScore}%` : "─",
      change: avgScore >= 80 ? "表現優秀" : avgScore > 0 ? "持續優化中" : "尚未分析",
      trend: "up",
      icon: Target,
      color: "blue",
    },
    {
      name: "Offer 數",
      value: String(trackedJobs.filter((j) => j.status === "offer").length),
      change: `${trackedJobs.filter((j) => j.status === "rejected").length} 個未錄取`,
      trend: "up",
      icon: TrendingUp,
      color: "amber",
    },
  ];

  // 最佳配對職位（按 matchScore 排序）
  const topJobs = [...trackedJobs]
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* 新手引導提示 */}
      {(!resume?.resumeText || !(settings.aiProvider === "gemini" ? settings.geminiApiKey : settings.openaiApiKey)) && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 mb-1">完成以下設定以啟用所有功能：</p>
                <div className="space-y-1">
                  {!(settings.aiProvider === "gemini" ? settings.geminiApiKey : settings.openaiApiKey) && (
                    <p className="text-sm text-blue-800">
                      1.{" "}
                      <a href="/settings" className="font-semibold underline">前往設定</a>{" "}
                      輸入 {settings.aiProvider === "gemini" ? "Gemini" : "OpenAI"} API Key（用於 AI 分析）
                    </p>
                  )}
                  {!resume?.resumeText && (
                    <p className="text-sm text-blue-800">
                      2.{" "}
                      <a href="/resume-analyzer" className="font-semibold underline">上傳您的履歷</a>{" "}
                      以啟用 AI 配對功能
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            violet: "from-violet-500 to-purple-600",
            emerald: "from-emerald-500 to-teal-600",
            blue: "from-blue-500 to-cyan-600",
            amber: "from-amber-500 to-orange-600",
          };

          return (
            <Card key={stat.name} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">{stat.name}</p>
                    <p className="text-3xl font-semibold text-slate-900">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-slate-500">{stat.change}</span>
                    </div>
                  </div>
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[stat.color as keyof typeof colorClasses]
                      } shadow-lg`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 最佳配對職位 */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">追蹤職位（最高配對）</CardTitle>
              <a href="/job-tracker">
                <Badge variant="secondary" className="bg-violet-50 text-violet-700 hover:bg-violet-100 cursor-pointer">
                  查看全部
                </Badge>
              </a>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {topJobs.length > 0 ? (
                topJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-6 hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-violet-700 transition-colors">
                          {job.role}
                        </h3>
                        <p className="text-sm text-slate-600 mb-1">{job.company}</p>
                        <p className="text-sm text-slate-500">{job.location}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {job.matchScore > 0 && (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-violet-500 to-indigo-600 rounded-full shadow-sm">
                            <Star className="w-4 h-4 text-white fill-white" />
                            <span className="text-sm font-semibold text-white">{job.matchScore}%</span>
                          </div>
                        )}
                        <Badge
                          className={`text-xs ${job.status === "offer" ? "bg-emerald-100 text-emerald-700" :
                            job.status === "interview" ? "bg-violet-100 text-violet-700" :
                              job.status === "applied" ? "bg-blue-100 text-blue-700" :
                                "bg-slate-100 text-slate-700"
                            }`}
                        >
                          {job.status === "offer" ? "已錄取" :
                            job.status === "interview" ? "面試中" :
                              job.status === "applied" ? "已應徵" : "已儲存"}
                        </Badge>
                      </div>
                    </div>
                    {(job.requiredSkills.length > 0) && (
                      <div className="flex flex-wrap gap-2">
                        {job.requiredSkills.slice(0, 4).map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="bg-slate-100 text-slate-700 hover:bg-slate-200"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 mb-3">尚無追蹤職位</p>
                  <a
                    href="/job-discovery"
                    className="text-sm font-medium text-violet-600 hover:underline"
                  >
                    前往職位探索 →
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI 智慧建議 */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg">AI 智慧建議</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {aiRecommendations.map((rec) => (
                <div key={rec.id} className="p-4 hover:bg-slate-50/50 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 w-2 h-2 rounded-full ${rec.priority === "high" ? "bg-violet-500" : "bg-blue-500"
                        }`}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-slate-900 mb-1">{rec.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{rec.description}</p>
                      <Badge
                        variant="secondary"
                        className={`mt-2 text-xs ${rec.priority === "high"
                          ? "bg-violet-50 text-violet-700"
                          : "bg-blue-50 text-blue-700"
                          }`}
                      >
                        {rec.priority === "high" ? "高優先級" : "中優先級"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
