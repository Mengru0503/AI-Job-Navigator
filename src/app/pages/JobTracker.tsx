import { useState } from "react";
import {
  ClipboardList,
  Plus,
  MapPin,
  DollarSign,
  Calendar,
  Building2,
  ExternalLink,
  Star,
  XCircle,
  Edit,
  Trash2,
  Save,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { useJobTrackerStore } from "../../store/useJobTrackerStore";
import { TrackedJob, JobStatus } from "../../types";

const statusConfig: Record<
  JobStatus,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  saved: { label: "已儲存", color: "text-slate-700", bgColor: "bg-slate-100", borderColor: "border-slate-200" },
  applied: { label: "已應徵", color: "text-blue-700", bgColor: "bg-blue-100", borderColor: "border-blue-200" },
  interview: { label: "面試中", color: "text-violet-700", bgColor: "bg-violet-100", borderColor: "border-violet-200" },
  rejected: { label: "未錄取", color: "text-red-700", bgColor: "bg-red-100", borderColor: "border-red-200" },
  offer: { label: "已錄取", color: "text-emerald-700", bgColor: "bg-emerald-100", borderColor: "border-emerald-200" },
};

const statusOrder: JobStatus[] = ["saved", "applied", "interview", "offer", "rejected"];

// 新增職位表單初始值
const emptyJob: Omit<TrackedJob, "id"> = {
  company: "",
  role: "",
  location: "",
  salary: "",
  status: "saved",
  matchScore: 0,
  lastUpdate: new Date().toISOString().split("T")[0],
  description: "",
  requiredSkills: [],
  missingSkills: [],
  notes: "",
  url: "",
};

export function JobTracker() {
  const { trackedJobs, addJob, updateJobStatus, updateJobNotes, updateJob, removeJob } = useJobTrackerStore();

  const [selectedJob, setSelectedJob] = useState<TrackedJob | null>(trackedJobs[0] || null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newJob, setNewJob] = useState({ ...emptyJob });
  const [skillInput, setSkillInput] = useState("");

  const stats = {
    saved: trackedJobs.filter((j) => j.status === "saved").length,
    applied: trackedJobs.filter((j) => j.status === "applied").length,
    interview: trackedJobs.filter((j) => j.status === "interview").length,
    offer: trackedJobs.filter((j) => j.status === "offer").length,
  };

  // 開始編輯備註
  const startEditNotes = (job: TrackedJob) => {
    setNotesValue(job.notes);
    setEditingNotes(true);
  };

  // 儲存備註
  const saveNotes = () => {
    if (!selectedJob) return;
    updateJobNotes(selectedJob.id, notesValue);
    setSelectedJob((prev) => prev ? { ...prev, notes: notesValue } : null);
    setEditingNotes(false);
    toast.success("備註已儲存");
  };

  // 更新狀態
  const handleStatusChange = (id: string, status: JobStatus) => {
    updateJobStatus(id, status);
    if (selectedJob?.id === id) {
      setSelectedJob((prev) => prev ? { ...prev, status } : null);
    }
    toast.success(`狀態已更新為「${statusConfig[status].label}」`);
  };

  // 刪除職位
  const handleRemove = (id: string) => {
    removeJob(id);
    if (selectedJob?.id === id) {
      setSelectedJob(trackedJobs.find((j) => j.id !== id) || null);
    }
    toast.success("職位已移除");
  };

  // 新增職位
  const handleAddJob = () => {
    if (!newJob.company.trim() || !newJob.role.trim()) {
      toast.error("請填寫公司名稱和職位名稱");
      return;
    }
    const id = `manual-${Date.now()}`;
    addJob({ ...newJob, id });
    setNewJob({ ...emptyJob });
    setShowAddDialog(false);
    toast.success("職位已新增！");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">應徵追蹤</h1>
            <p className="text-slate-600">追蹤和管理您的職位應徵進度（共 {trackedJobs.length} 個職位）</p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md"
        >
          <Plus className="w-5 h-5 mr-2" />
          新增職位
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-slate-900 mb-1">{stats.saved}</div>
            <div className="text-sm text-slate-600">已儲存</div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 shadow-sm bg-blue-50/30 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-900 mb-1">{stats.applied}</div>
            <div className="text-sm text-blue-700">已投遞</div>
          </CardContent>
        </Card>
        <Card className="border-violet-200 shadow-sm bg-violet-50/30 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-violet-900 mb-1">{stats.interview}</div>
            <div className="text-sm text-violet-700">面試中</div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 shadow-sm bg-emerald-50/30 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-emerald-900 mb-1">{stats.offer}</div>
            <div className="text-sm text-emerald-700">已收到 Offer</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 職位列表 */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-lg">職位列表</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                    <TableHead className="font-semibold">公司 / 職位</TableHead>
                    <TableHead className="font-semibold">配對分數</TableHead>
                    <TableHead className="font-semibold">狀態</TableHead>
                    <TableHead className="font-semibold w-32">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trackedJobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-slate-500">
                        尚無追蹤職位，請點擊「新增職位」或從職位探索頁面儲存職位
                      </TableCell>
                    </TableRow>
                  ) : (
                    trackedJobs.map((job) => {
                      const config = statusConfig[job.status];
                      const isSelected = selectedJob?.id === job.id;
                      return (
                        <TableRow
                          key={job.id}
                          className={`cursor-pointer transition-colors ${isSelected ? "bg-violet-50 border-l-4 border-l-violet-500" : "hover:bg-slate-50"
                            }`}
                          onClick={() => { setSelectedJob(job); setEditingNotes(false); }}
                        >
                          <TableCell>
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                <span className="font-medium text-slate-900">{job.company}</span>
                              </div>
                              <span className="text-sm text-slate-600 ml-6">{job.role}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {job.matchScore > 0 ? (
                              <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-violet-500 fill-violet-500" />
                                <span className="font-semibold text-violet-700">{job.matchScore}%</span>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">─</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <select
                              value={job.status}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleStatusChange(job.id, e.target.value as JobStatus);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className={`text-xs font-medium px-2 py-1 rounded-full border cursor-pointer ${config.bgColor} ${config.color} ${config.borderColor}`}
                            >
                              {statusOrder.map((s) => (
                                <option key={s} value={s}>{statusConfig[s].label}</option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {job.url && (
                                <a
                                  href={job.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1.5 rounded hover:bg-blue-50 transition-colors"
                                >
                                  <ExternalLink className="w-4 h-4 text-blue-500" />
                                </a>
                              )}
                              <button
                                className="p-1.5 rounded hover:bg-red-50 transition-colors"
                                onClick={(e) => { e.stopPropagation(); handleRemove(job.id); }}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 職位詳細資訊 */}
        <Card className="border-slate-200 shadow-sm lg:sticky lg:top-24 lg:self-start">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-violet-50 to-indigo-50">
            <CardTitle className="text-lg">職位詳情</CardTitle>
          </CardHeader>
          <CardContent className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {selectedJob ? (
              <div className="space-y-5">
                {/* 標題 */}
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-lg mb-1">{selectedJob.role}</h3>
                      <p className="text-slate-700 font-medium flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        {selectedJob.company}
                      </p>
                    </div>
                    <Badge
                      className={`${statusConfig[selectedJob.status].bgColor} ${statusConfig[selectedJob.status].color} ${statusConfig[selectedJob.status].borderColor} border px-3 py-1`}
                    >
                      {statusConfig[selectedJob.status].label}
                    </Badge>
                  </div>
                </div>

                {/* 配對分數 */}
                {selectedJob.matchScore > 0 && (
                  <div className="p-4 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl border border-violet-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">AI 配對分數</span>
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-violet-500 fill-violet-500" />
                        <span className="text-2xl font-bold text-violet-700">{selectedJob.matchScore}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-violet-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-violet-500 to-indigo-600 h-2 rounded-full transition-all"
                        style={{ width: `${selectedJob.matchScore}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* 基本資訊 */}
                <div className="space-y-2.5 py-4 border-y border-slate-100">
                  {selectedJob.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{selectedJob.location}</span>
                    </div>
                  )}
                  {selectedJob.salary && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{selectedJob.salary}</span>
                    </div>
                  )}
                  {selectedJob.appliedDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">應徵日期：{selectedJob.appliedDate}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">最後更新：{selectedJob.lastUpdate}</span>
                  </div>
                </div>

                {/* HR 介紹信 */}
                {selectedJob.hrIntroMessage && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">AI HR 介紹信</h4>
                    <div className="p-3 bg-violet-50 rounded-lg border border-violet-100 text-sm text-slate-700 leading-relaxed">
                      {selectedJob.hrIntroMessage}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedJob.hrIntroMessage || "");
                        toast.success("已複製！");
                      }}
                      className="mt-2 text-xs text-violet-600 hover:underline"
                    >
                      複製介紹信
                    </button>
                  </div>
                )}

                {/* 所需/缺少技能 */}
                {selectedJob.requiredSkills.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">所需技能</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedJob.requiredSkills.map((skill) => (
                        <Badge key={skill} className="bg-slate-100 text-slate-700 border border-slate-200 text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selectedJob.missingSkills.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="w-4 h-4 text-amber-600" />
                      <h4 className="text-sm font-semibold text-amber-900">需要加強</h4>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedJob.missingSkills.map((skill) => (
                        <Badge key={skill} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 備註 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-slate-900">備註</h4>
                    {!editingNotes ? (
                      <button
                        onClick={() => startEditNotes(selectedJob)}
                        className="text-xs text-violet-600 hover:underline flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        編輯
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={saveNotes} className="text-xs text-emerald-600 hover:underline flex items-center gap-1">
                          <Save className="w-3 h-3" />儲存
                        </button>
                        <button onClick={() => setEditingNotes(false)} className="text-xs text-slate-500 hover:underline flex items-center gap-1">
                          <X className="w-3 h-3" />取消
                        </button>
                      </div>
                    )}
                  </div>
                  {editingNotes ? (
                    <Textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      className="min-h-[100px] resize-none border-slate-200 focus-visible:ring-violet-500"
                      placeholder="輸入備註..."
                      autoFocus
                    />
                  ) : (
                    <div
                      className="min-h-[80px] p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-600 cursor-text"
                      onClick={() => startEditNotes(selectedJob)}
                    >
                      {selectedJob.notes || <span className="text-slate-400 italic">點擊新增備註...</span>}
                    </div>
                  )}
                </div>

                {/* 操作按鈕 */}
                <div className="flex gap-2 pt-2">
                  {selectedJob.url && (
                    <Button asChild className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                      <a href={selectedJob.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        查看職位
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => handleRemove(selectedJob.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">選擇一個職位以查看詳情</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 新增職位 Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新增追蹤職位</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>公司名稱 *</Label>
                <Input
                  placeholder="例如：台積電"
                  value={newJob.company}
                  onChange={(e) => setNewJob((p) => ({ ...p, company: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>職位名稱 *</Label>
                <Input
                  placeholder="例如：前端工程師"
                  value={newJob.role}
                  onChange={(e) => setNewJob((p) => ({ ...p, role: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>地點</Label>
                <Input
                  placeholder="台北市"
                  value={newJob.location}
                  onChange={(e) => setNewJob((p) => ({ ...p, location: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>薪資</Label>
                <Input
                  placeholder="月薪 50K–80K"
                  value={newJob.salary || ""}
                  onChange={(e) => setNewJob((p) => ({ ...p, salary: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>職缺網址</Label>
              <Input
                placeholder="https://..."
                value={newJob.url || ""}
                onChange={(e) => setNewJob((p) => ({ ...p, url: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>狀態</Label>
              <select
                value={newJob.status}
                onChange={(e) => setNewJob((p) => ({ ...p, status: e.target.value as JobStatus }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {statusOrder.map((s) => (
                  <option key={s} value={s}>{statusConfig[s].label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>備註</Label>
              <Textarea
                placeholder="面試時間、面試官姓名等..."
                value={newJob.notes}
                onChange={(e) => setNewJob((p) => ({ ...p, notes: e.target.value }))}
                className="min-h-[80px] resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddDialog(false)}>
                取消
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                onClick={handleAddJob}
              >
                新增職位
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
