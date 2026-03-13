import { useState } from "react";
import {
  Settings as SettingsIcon,
  User,
  Key,
  Globe,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Separator } from "../components/ui/separator";
import { toast } from "sonner";
import { useSettingsStore } from "../../store/useSettingsStore";
import { AiProvider } from "../../types";

export function Settings() {
  const { settings, updateSettings, resetSettings } = useSettingsStore();
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  // 本地 form state
  const [form, setForm] = useState({ ...settings });

  const handleSave = () => {
    updateSettings(form);
    toast.success("設定已儲存！");
  };

  const handleReset = () => {
    resetSettings();
    setForm({ ...settings });
    toast.info("設定已重置為預設值");
  };

  const handleTestOpenAI = async () => {
    if (!form.openaiApiKey) {
      toast.error("請先輸入 OpenAI API Key");
      return;
    }

    const toastId = toast.loading("測試 OpenAI API Key 中...");
    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${form.openaiApiKey}` },
      });

      if (response.ok) {
        toast.success("OpenAI API Key 有效！連線成功 ✓", { id: toastId });
      } else if (response.status === 401) {
        toast.error("OpenAI API Key 無效，請確認是否正確", { id: toastId });
      } else {
        toast.error(`OpenAI API 錯誤 (${response.status})`, { id: toastId });
      }
    } catch {
      toast.error("網路連線失敗，請確認網路狀態", { id: toastId });
    }
  };

  const handleTestGemini = async () => {
    if (!form.geminiApiKey) {
      toast.error("請先輸入 Gemini API Key");
      return;
    }

    const toastId = toast.loading("測試 Gemini API Key 中...");
    try {
      // 使用 Gemini API 列出模型來驗證 Key
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${form.geminiApiKey}`
      );

      if (response.ok) {
        toast.success("Gemini API Key 有效！連線成功 ✓", { id: toastId });
      } else if (response.status === 400 || response.status === 403) {
        toast.error("Gemini API Key 無效，請確認是否正確", { id: toastId });
      } else {
        toast.error(`Gemini API 錯誤 (${response.status})`, { id: toastId });
      }
    } catch {
      toast.error("網路連線失敗，請確認網路狀態", { id: toastId });
    }
  };

  const providerOptions: { value: AiProvider; label: string; emoji: string; desc: string }[] = [
    {
      value: "openai",
      label: "OpenAI",
      emoji: "🤖",
      desc: "GPT-4o / GPT-4o Mini，業界標竿，效果穩定",
    },
    {
      value: "gemini",
      label: "Google Gemini",
      emoji: "✨",
      desc: "Gemini 2.0 Flash，速度快，免費額度多",
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 shadow-lg">
          <SettingsIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">設定</h1>
          <p className="text-slate-600">管理您的帳戶、API 連線設定與偏好</p>
        </div>
      </div>

      {/* AI API 設定（最重要，放最上面） */}
      <Card className="border-violet-200 shadow-sm">
        <CardHeader className="border-b border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-violet-600" />
            <CardTitle className="text-lg">AI 功能設定</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">

          {/* AI Provider 選擇 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-500" />
              AI 服務提供者
            </Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {providerOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, aiProvider: opt.value }))}
                  className={`flex items-start gap-3 p-4 rounded-xl text-left border-2 transition-all ${form.aiProvider === opt.value
                    ? "border-violet-500 bg-violet-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/50"
                    }`}
                >
                  <span className="text-2xl mt-0.5">{opt.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{opt.label}</span>
                      {form.aiProvider === opt.value && (
                        <CheckCircle2 className="w-4 h-4 text-violet-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* OpenAI 設定區塊 - 僅在選擇 OpenAI 時顯示 */}
          {form.aiProvider === "openai" && (
            <div className="space-y-4 rounded-xl p-4 border border-violet-200 bg-violet-50/30">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">🤖</span>
                <span className="font-semibold text-slate-800 text-sm">OpenAI 設定</span>
              </div>

              {/* OpenAI API Key */}
              <div className="space-y-2">
                <Label htmlFor="openaiApiKey" className="text-sm font-medium text-slate-700">
                  OpenAI API Key
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="openaiApiKey"
                      type={showOpenaiKey ? "text" : "password"}
                      placeholder="sk-proj-..."
                      value={form.openaiApiKey}
                      onChange={(e) => setForm((p) => ({ ...p, openaiApiKey: e.target.value }))}
                      className="pr-10 border-slate-200 focus-visible:ring-violet-500 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showOpenaiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleTestOpenAI}
                    className="border-violet-200 text-violet-700 hover:bg-violet-50 whitespace-nowrap"
                  >
                    測試連線
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  前往{" "}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-600 underline"
                  >
                    OpenAI Platform
                  </a>{" "}
                  取得 API Key
                </p>
              </div>

              {/* OpenAI 模型選擇 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-slate-500" />
                  模型選擇
                </Label>
                <select
                  value={form.openaiModel}
                  onChange={(e) => setForm((p) => ({ ...p, openaiModel: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm bg-white"
                >
                  <option value="gpt-4o-mini">GPT-4o Mini（推薦，速度快，成本低）</option>
                  <option value="gpt-4o">GPT-4o（高品質，較貴）</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo（最便宜）</option>
                </select>
              </div>
            </div>
          )}

          {/* Gemini 設定區塊 - 僅在選擇 Gemini 時顯示 */}
          {form.aiProvider === "gemini" && (
            <div className="space-y-4 rounded-xl p-4 border border-blue-200 bg-blue-50/30">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">✨</span>
                <span className="font-semibold text-slate-800 text-sm">Google Gemini 設定</span>
              </div>

              {/* Gemini API Key */}
              <div className="space-y-2">
                <Label htmlFor="geminiApiKey" className="text-sm font-medium text-slate-700">
                  Gemini API Key
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="geminiApiKey"
                      type={showGeminiKey ? "text" : "password"}
                      placeholder="AIza..."
                      value={form.geminiApiKey}
                      onChange={(e) => setForm((p) => ({ ...p, geminiApiKey: e.target.value }))}
                      className="pr-10 border-slate-200 focus-visible:ring-blue-500 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGeminiKey(!showGeminiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleTestGemini}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 whitespace-nowrap"
                  >
                    測試連線
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  前往{" "}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    Google AI Studio
                  </a>{" "}
                  免費取得 Gemini API Key
                </p>
              </div>

              {/* Gemini 模型選擇 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-slate-500" />
                  模型選擇
                </Label>
                <select
                  value={form.geminiModel}
                  onChange={(e) => setForm((p) => ({ ...p, geminiModel: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash（推薦，速度快）</option>
                  <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite（最快，免費）</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro（高品質）</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                </select>
              </div>
            </div>
          )}

          {/* 安全說明 */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              所有 API Key 僅儲存在您的瀏覽器本地（localStorage），不會上傳至任何伺服器。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 搜尋來源設定 */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-violet-600" />
            <CardTitle className="text-lg">職位搜尋來源</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">📋 104 人力銀行</Label>
              <p className="text-sm text-slate-500">從台灣最大人力銀行搜尋職缺</p>
            </div>
            <Switch
              checked={form.searchSources.job104}
              onCheckedChange={(v) => setForm((p) => ({ ...p, searchSources: { ...p.searchSources, job104: v } }))}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">🎂 CakeResume</Label>
              <p className="text-sm text-slate-500">國際化職缺平台，適合找外商與新創職位</p>
            </div>
            <Switch
              checked={form.searchSources.cake}
              onCheckedChange={(v) => setForm((p) => ({ ...p, searchSources: { ...p.searchSources, cake: v } }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* 個人資料設定 */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-violet-600" />
            <CardTitle className="text-lg">個人資料</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="userName">姓名</Label>
              <Input
                id="userName"
                value={form.userName}
                onChange={(e) => setForm((p) => ({ ...p, userName: e.target.value }))}
                className="border-slate-200 focus-visible:ring-violet-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userEmail">電子郵件</Label>
              <Input
                id="userEmail"
                type="email"
                value={form.userEmail}
                onChange={(e) => setForm((p) => ({ ...p, userEmail: e.target.value }))}
                className="border-slate-200 focus-visible:ring-violet-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userLocation">所在地</Label>
              <Input
                id="userLocation"
                value={form.userLocation}
                onChange={(e) => setForm((p) => ({ ...p, userLocation: e.target.value }))}
                className="border-slate-200 focus-visible:ring-violet-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userJobTitle">目前職位</Label>
              <Input
                id="userJobTitle"
                value={form.userJobTitle}
                onChange={(e) => setForm((p) => ({ ...p, userJobTitle: e.target.value }))}
                className="border-slate-200 focus-visible:ring-violet-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 儲存 / 重置按鈕 */}
      <div className="flex justify-end gap-3 pb-8">
        <Button
          variant="outline"
          onClick={handleReset}
          className="border-slate-200 hover:bg-slate-50 gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          重置設定
        </Button>
        <Button
          onClick={handleSave}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-sm gap-2"
        >
          <Save className="w-4 h-4" />
          儲存所有設定
        </Button>
      </div>
    </div>
  );
}