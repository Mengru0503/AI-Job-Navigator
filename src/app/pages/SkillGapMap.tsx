import { Target, TrendingUp, BookOpen, Award, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useJobTrackerStore } from "../../store/useJobTrackerStore";
import { useResumeStore } from "../../store/useResumeStore";

const learningRecommendations = [
  {
    id: 1,
    skill: "Docker 容器化基礎",
    provider: "Docker 官方文件",
    duration: "8 小時",
    level: "初級",
    rating: 4.8,
    impact: "+15% 職位配對",
    url: "https://docs.docker.com/get-started/",
  },
  {
    id: 2,
    skill: "AWS 解決方案架構師",
    provider: "AWS 官方培訓",
    duration: "40 小時",
    level: "中級",
    rating: 4.9,
    impact: "+20% 職位配對",
    url: "https://aws.amazon.com/training/",
  },
  {
    id: 3,
    skill: "GraphQL 與 Apollo",
    provider: "Apollo 官方教學",
    duration: "12 小時",
    level: "中級",
    rating: 4.7,
    impact: "+10% 職位配對",
    url: "https://www.apollographql.com/tutorials/",
  },
];

export function SkillGapMap() {
  const { trackedJobs } = useJobTrackerStore();
  const { resume } = useResumeStore();

  // 從追蹤職位中聚合技能資料
  const allRequiredSkills = trackedJobs.flatMap((j) => j.requiredSkills);
  const allMissingSkills = trackedJobs.flatMap((j) => j.missingSkills);

  // 計算各技能出現次數
  const skillCount = allRequiredSkills.reduce<Record<string, number>>((acc, skill) => {
    acc[skill] = (acc[skill] || 0) + 1;
    return acc;
  }, {});

  const missingSkillCount = allMissingSkills.reduce<Record<string, number>>((acc, skill) => {
    acc[skill] = (acc[skill] || 0) + 1;
    return acc;
  }, {});

  // 計算匹配的技能（在所需技能中但不在缺少技能中）
  const matchedSkillCount = Object.entries(skillCount).reduce<Record<string, number>>(
    (acc, [skill, count]) => {
      if (!missingSkillCount[skill]) {
        acc[skill] = count;
      }
      return acc;
    },
    {}
  );

  // 建立雷達圖資料
  const topRequiredSkills = Object.entries(skillCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const totalJobs = trackedJobs.length || 1;
  const skillData = topRequiredSkills.map(([skill, count]) => ({
    skill,
    current: missingSkillCount[skill]
      ? Math.round((1 - missingSkillCount[skill] / count) * 100)
      : 95,
    market: Math.round((count / totalJobs) * 100),
  }));

  // 備用靜態資料（當沒有追蹤職位時）
  const defaultSkillData = [
    { skill: "React", current: 90, market: 95 },
    { skill: "TypeScript", current: 85, market: 90 },
    { skill: "Node.js", current: 80, market: 85 },
    { skill: "GraphQL", current: 60, market: 85 },
    { skill: "AWS", current: 55, market: 80 },
    { skill: "Docker", current: 50, market: 75 },
  ];

  const radarData = skillData.length >= 3 ? skillData : defaultSkillData;

  // 計算強項（符合技能排行）
  const strengths = Object.entries(matchedSkillCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count]) => ({
      name,
      level: Math.min(95, 60 + count * 10),
      description: count >= 3 ? "高需求技能 - 您已掌握" : "多個職位需要此技能",
    }));

  const defaultStrengths = [
    { name: "React 開發", level: 90, description: "專家級 - 前 10% 的開發者" },
    { name: "TypeScript", level: 85, description: "進階級 - 具備扎實能力" },
    { name: "前端架構設計", level: 88, description: "專家級 - 優秀的設計能力" },
  ];

  // 計算弱項（缺少技能排行）
  const weaknesses = Object.entries(missingSkillCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count]) => ({
      name,
      level: Math.max(20, 70 - count * 15),
      description: count >= 2 ? "多個職位需要此技能" : "部分職位需要此技能",
      impact: `${Math.round((count / totalJobs) * 100)}% 的追蹤職位需要此技能`,
    }));

  const defaultWeaknesses = [
    { name: "Docker 容器化", level: 50, description: "基礎級 - 需要加強", impact: "68% 的配對職位需要此技能" },
    { name: "AWS 雲端服務", level: 55, description: "基礎級 - 需要加強", impact: "72% 的配對職位需要此技能" },
    { name: "GraphQL", level: 60, description: "中級 - 還有成長空間", impact: "45% 的配對職位需要此技能" },
  ];

  const displayStrengths = strengths.length > 0 ? strengths : defaultStrengths;
  const displayWeaknesses = weaknesses.length > 0 ? weaknesses : defaultWeaknesses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
          <Target className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">技能分析</h1>
          <p className="text-slate-600">
            {trackedJobs.length > 0
              ? `根據 ${trackedJobs.length} 個追蹤職位分析您的技能差距`
              : "分析您的技能並找出可以成長的領域"}
          </p>
        </div>
      </div>

      {/* 資料來源提示 */}
      {trackedJobs.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              技能分析資料來自您的 <strong>{trackedJobs.length} 個追蹤職位</strong>，
              共涵蓋 <strong>{Object.keys(skillCount).length} 種技能需求</strong>
            </p>
          </CardContent>
        </Card>
      )}

      {/* 技能雷達圖 */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">技能雷達圖</CardTitle>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-violet-500" />
                <span className="text-slate-600">您的技能</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-600">
                  {trackedJobs.length > 0 ? "職位需求頻率" : "市場需求"}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                  dataKey="skill"
                  tick={{ fill: "#64748b", fontSize: 13 }}
                  stroke="#cbd5e1"
                />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#94a3b8" }} />
                <Radar
                  name="您的技能"
                  dataKey="current"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.5}
                  strokeWidth={2}
                />
                <Radar
                  name={trackedJobs.length > 0 ? "職位需求頻率" : "市場需求"}
                  dataKey="market"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.5rem",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 優勢技能 */}
        <Card className="border-emerald-200 shadow-sm">
          <CardHeader className="border-b border-emerald-100 bg-emerald-50/50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <CardTitle className="text-lg text-emerald-900">您的優勢</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {displayStrengths.map((strength, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">{strength.name}</span>
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                      {strength.level}%
                    </Badge>
                  </div>
                  <Progress value={strength.level} className="h-2" />
                  <p className="text-sm text-slate-600">{strength.description}</p>
                </div>
              ))}
              {displayStrengths.length === 0 && (
                <div className="text-center py-6 text-slate-500">
                  <p className="text-sm">前往職位探索頁面儲存職位，即可分析您的技能優勢</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 待加強技能 */}
        <Card className="border-amber-200 shadow-sm">
          <CardHeader className="border-b border-amber-100 bg-amber-50/50">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-amber-600" />
              <CardTitle className="text-lg text-amber-900">待加強領域</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {displayWeaknesses.map((weakness, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">{weakness.name}</span>
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200">
                      {weakness.level}%
                    </Badge>
                  </div>
                  <Progress value={weakness.level} className="h-2" />
                  <p className="text-sm text-slate-600">{weakness.description}</p>
                  <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                    <TrendingUp className="w-3 h-3" />
                    {weakness.impact}
                  </div>
                </div>
              ))}
              {displayWeaknesses.length === 0 && (
                <div className="text-center py-6 text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-emerald-700 font-medium">太棒了！您已符合所有追蹤職位的技能需求</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 推薦學習路徑 */}
      <Card className="border-violet-200 shadow-sm">
        <CardHeader className="border-b border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-violet-600" />
              <CardTitle className="text-lg text-violet-900">推薦學習路徑</CardTitle>
            </div>
            <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-200">
              為您量身打造
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {learningRecommendations.map((course) => (
              <Card
                key={course.id}
                className="border-slate-200 shadow-sm hover:shadow-md hover:border-violet-200 transition-all cursor-pointer group"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md group-hover:shadow-lg transition-shadow">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <Badge variant="outline" className="text-xs border-violet-200 text-violet-700">
                      {course.level}
                    </Badge>
                  </div>

                  <h4 className="font-semibold text-slate-900 mb-1 group-hover:text-violet-700 transition-colors">
                    {course.skill}
                  </h4>
                  <p className="text-sm text-slate-600 mb-3">{course.provider}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">課程時長：</span>
                      <span className="font-medium text-slate-900">{course.duration}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">評分：</span>
                      <div className="flex items-center gap-1">
                        <Award className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="font-medium text-slate-900">{course.rating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1.5 rounded-md border border-emerald-100 mb-4">
                    <TrendingUp className="w-3 h-3" />
                    {course.impact}
                  </div>

                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-sm"
                  >
                    <a href={course.url} target="_blank" rel="noopener noreferrer">
                      開始學習
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
