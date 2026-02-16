import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, CreditCard, Heart, List, Bell, Moon, Sun, Clock, Tag, Check, FileSpreadsheet, RotateCcw, LogOut, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import Login from "@/pages/login";

const ALL_SOURCES = [
  { key: "us", label: "美国市场 (USD)", flag: "\u{1F1FA}\u{1F1F8}", desc: "TCGPlayer / Scryfall" },
  { key: "cn", label: "中国市场 (CNY)", flag: "\u{1F1E8}\u{1F1F3}", desc: "综合均价" },
];

const SETTINGS_KEY = "price_sources";
const EXPORT_PRESET_KEY = "export_dimensions";

const EXPORT_DIM_LABELS: Record<string, string> = {
  name_cn: "中文名称", name_en: "英文名称",
  type_line: "类别", set: "系列", rarity: "稀有度",
  oracle_text: "规则文本", mana_cost: "法术力费用", colors: "颜色",
  quantity: "数量", condition: "品相", notes: "备注",
  price_tcg: "TCGPlayer (USD)", price_tcg_cny: "TCGPlayer (≈CNY)",
  price_cn: "中国市场 (CNY)", subtotal: "小计 (CNY)",
};

export default function Me() {
  const { user, isLoading: authLoading, login, logout } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [showSourceManager, setShowSourceManager] = useState(false);
  const [enabledSources, setEnabledSources] = useState<string[]>(["us", "cn"]);
  const [showExportPreset, setShowExportPreset] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sourceSetting } = useQuery<{ key: string; value: string | null }>({
    queryKey: ["/api/settings", SETTINGS_KEY],
    queryFn: async () => {
      const res = await fetch(`/api/settings/${SETTINGS_KEY}`);
      return res.json();
    },
  });

  useEffect(() => {
    if (sourceSetting?.value) {
      try { setEnabledSources(JSON.parse(sourceSetting.value)); } catch {}
    }
  }, [sourceSetting]);

  const saveSourcesApi = useMutation({
    mutationFn: async (sources: string[]) => {
      return apiRequest("PUT", `/api/settings/${SETTINGS_KEY}`, { value: JSON.stringify(sources) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings", SETTINGS_KEY] });
      toast({ title: "已保存", description: "价格来源设置已更新" });
    },
  });

  const { data: exportPreset } = useQuery<{ key: string; value: string | null }>({
    queryKey: ["/api/settings", EXPORT_PRESET_KEY],
    queryFn: async () => {
      const res = await fetch(`/api/settings/${EXPORT_PRESET_KEY}`);
      return res.json();
    },
  });

  const savedExportDims: string[] = (() => {
    if (!exportPreset?.value) return [];
    try { return JSON.parse(exportPreset.value); } catch { return []; }
  })();

  const resetExportPreset = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", `/api/settings/${EXPORT_PRESET_KEY}`, { value: JSON.stringify([]) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings", EXPORT_PRESET_KEY] });
      toast({ title: "已重置", description: "导出字段组合已恢复为默认" });
    },
  });

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = (checked: boolean) => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(checked ? "dark" : "light");
    setIsDark(checked);
  };

  const toggleSource = (key: string) => {
    setEnabledSources(prev => {
      const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      if (next.length === 0) return prev;
      saveSourcesApi.mutate(next);
      return next;
    });
  };

  const handleLogout = async () => {
    await logout();
    toast({ title: "已退出登录" });
  };

  // Show login page if not authenticated
  if (!user && !authLoading) {
    return <Login onLogin={login} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 py-4">
        <Avatar className="w-20 h-20 border-2 border-primary">
          <AvatarImage src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Planeswalker"} />
          <AvatarFallback>{user?.username?.slice(0, 2) || "PW"}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-heading font-bold">{user?.username || "..."}</h1>
          {user?.wechatNickname && (
            <p className="text-sm text-muted-foreground">微信: {user.wechatNickname}</p>
          )}
          {user?.phone && (
            <p className="text-xs text-muted-foreground">{user.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")}</p>
          )}
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="outline" className="h-7 text-xs" data-testid="button-edit-profile">编辑资料</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card/50 hover:bg-card transition-colors cursor-pointer border-border/60">
          <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
            <List className="w-6 h-6 text-primary" />
            <span className="font-medium text-sm">我的收藏</span>
            <span className="text-xs text-muted-foreground">1,240 张卡牌</span>
          </CardContent>
        </Card>
        <Card className="bg-card/50 hover:bg-card transition-colors cursor-pointer border-border/60">
          <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
            <Heart className="w-6 h-6 text-red-500" />
            <span className="font-medium text-sm">愿望清单</span>
            <span className="text-xs text-muted-foreground">42 个项目</span>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">工具</h2>

        <Card className="border-border/60">
          <div className="divide-y divide-border/40">
            <Link href="/price-lists">
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/5" data-testid="link-me-price-lists">
                <div className="flex items-center gap-3">
                  <Tag className="w-5 h-5 text-primary" />
                  <span>价格列表</span>
                </div>
                <span className="text-xs text-muted-foreground">管理与导出</span>
              </div>
            </Link>

            <Link href="/history">
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/5" data-testid="link-me-history">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <span>浏览足迹</span>
                </div>
                <span className="text-xs text-muted-foreground">查询历史</span>
              </div>
            </Link>

            <Link href="/chat">
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/5" data-testid="link-me-chat">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-blue-500" />
                  <span>私信</span>
                </div>
                <span className="text-xs text-muted-foreground">交易沟通</span>
              </div>
            </Link>
          </div>
        </Card>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">设置</h2>

        <Card className="border-border/60">
          <div className="divide-y divide-border/40">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {isDark ? <Moon className="w-5 h-5 text-purple-400" /> : <Sun className="w-5 h-5 text-orange-400" />}
                <span>深色模式</span>
              </div>
              <Switch checked={isDark} onCheckedChange={toggleTheme} data-testid="switch-dark-mode" />
            </div>

            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/5"
              onClick={() => setShowSourceManager(!showSourceManager)}
              data-testid="button-me-manage-sources"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-primary" />
                <span>价格来源管理</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {enabledSources.length}/{ALL_SOURCES.length} 已启用
              </span>
            </div>

            {showSourceManager && (
              <div className="p-4 space-y-2 bg-muted/5">
                <p className="text-xs text-muted-foreground mb-3">选择默认显示的价格来源（至少选择一个）</p>
                {ALL_SOURCES.map(src => {
                  const isOn = enabledSources.includes(src.key);
                  return (
                    <button
                      key={src.key}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${isOn ? 'border-primary/40 bg-primary/5' : 'border-border opacity-50'}`}
                      onClick={() => toggleSource(src.key)}
                      data-testid={`button-me-source-${src.key}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{src.flag}</span>
                        <div className="text-left">
                          <p className="font-medium text-sm">{src.label}</p>
                          <p className="text-[10px] text-muted-foreground">{src.desc}</p>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isOn ? 'border-primary bg-primary text-white' : 'border-muted-foreground/30'}`}>
                        {isOn && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
                <p className="text-[10px] text-muted-foreground pt-1">更改将同步到所有卡牌详情页</p>
              </div>
            )}

            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/5"
              onClick={() => setShowExportPreset(!showExportPreset)}
              data-testid="button-me-export-preset"
            >
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                <span>导出字段模板</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {savedExportDims.length > 0 ? `${savedExportDims.length} 项已保存` : "使用默认"}
              </span>
            </div>

            {showExportPreset && (
              <div className="p-4 space-y-3 bg-muted/5">
                {savedExportDims.length > 0 ? (
                  <>
                    <p className="text-xs text-muted-foreground">当前保存的导出字段组合：</p>
                    <div className="flex flex-wrap gap-1.5">
                      {savedExportDims.map(key => (
                        <span key={key} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                          {EXPORT_DIM_LABELS[key] || key}
                        </span>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs gap-1"
                      onClick={() => resetExportPreset.mutate()}
                      data-testid="button-reset-export-preset"
                    >
                      <RotateCcw className="w-3 h-3" /> 重置为默认
                    </Button>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">尚未保存自定义导出模板，导出时会使用默认字段。在价格列表导出后可以选择保存字段组合。</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/5">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span>通知设置</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/5">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-muted-foreground" />
                <span>账户与隐私</span>
              </div>
            </div>

            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/5"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5 text-red-500" />
                <span className="text-red-500">退出登录</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
