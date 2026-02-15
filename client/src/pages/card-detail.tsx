import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MOCK_CARDS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Share2, Heart, TrendingUp, TrendingDown, Settings2, Plus, X, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PriceList, PriceListItem, FollowedCard } from "@shared/schema";

const ALL_SOURCES = [
  { key: "us", label: "美国市场 (USD)", flag: "🇺🇸", desc: "TCGPlayer / Scryfall" },
  { key: "jp", label: "日本市场 (JPY)", flag: "🇯🇵", desc: "Hareruya (晴屋)" },
  { key: "cn", label: "中国市场 (CNY)", flag: "🇨🇳", desc: "综合均价" },
];

const SETTINGS_KEY = "price_sources";

export default function CardDetail() {
  const [match, params] = useRoute("/card/:id");
  const [, navigate] = useLocation();
  const id = params?.id;
  const card = MOCK_CARDS.find(c => c.id === id) || MOCK_CARDS[0];
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showListPicker, setShowListPicker] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);
  const [showCreateInline, setShowCreateInline] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [showSourceManager, setShowSourceManager] = useState(false);
  const [enabledSources, setEnabledSources] = useState<string[]>(["us", "jp", "cn"]);
  const [pendingSources, setPendingSources] = useState<string[]>([]);
  const [showApplyAllDialog, setShowApplyAllDialog] = useState(false);

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

  const { data: lists = [] } = useQuery<PriceList[]>({
    queryKey: ["/api/price-lists"],
  });

  const { data: followedCards = [] } = useQuery<FollowedCard[]>({
    queryKey: ["/api/followed-cards"],
  });

  useEffect(() => {
    const alreadyFollowed = followedCards.some(f => f.cardMockId === card.id);
    setIsFollowed(alreadyFollowed);
  }, [followedCards, card.id]);

  useEffect(() => {
    apiRequest("POST", "/api/card-history", {
      cardMockId: card.id,
      cardName: card.name_en,
      cardNameCn: card.name_cn,
      cardImage: card.image_uri,
    }).catch(() => {});
  }, [card.id]);

  const addToList = useMutation({
    mutationFn: async (listId: number) => {
      const listItems = await fetch(`/api/price-lists/${listId}/items`).then(r => r.json()) as PriceListItem[];
      const alreadyExists = listItems.some((item: PriceListItem) => item.cardMockId === card.id);
      if (alreadyExists) {
        throw new Error("DUPLICATE");
      }
      return apiRequest("POST", `/api/price-lists/${listId}/items`, {
        cardMockId: card.id,
        cardName: card.name_en,
        cardNameCn: card.name_cn,
        cardImage: card.image_uri,
        cardSetCode: card.set_code,
        quantity: 1,
        condition: "NM",
        priceCny: card.prices.cny,
        priceUsd: card.prices.usd,
        priceJpy: card.prices.jpy,
      });
    },
    onSuccess: () => {
      setShowListPicker(false);
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
      toast({ title: "添加成功", description: `${card.name_cn || card.name_en} 已添加到列表` });
    },
    onError: (err: Error) => {
      if (err.message === "DUPLICATE") {
        toast({ title: "重复添加", description: "该卡牌已在此列表中，请勿重复添加", variant: "destructive" });
      }
    },
  });

  const createListInline = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/price-lists", { name });
      return (await res.json()) as PriceList;
    },
    onSuccess: (newList) => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
      setShowCreateInline(false);
      setNewListName("");
      addToList.mutate(newList.id);
    },
  });

  const followCard = useMutation({
    mutationFn: async () => {
      if (isFollowed) {
        const existing = followedCards.find(f => f.cardMockId === card.id);
        if (existing) {
          return apiRequest("DELETE", `/api/followed-cards/${existing.id}`);
        }
      } else {
        return apiRequest("POST", "/api/followed-cards", {
          cardMockId: card.id,
          cardName: card.name_en,
          cardNameCn: card.name_cn,
          cardImage: card.image_uri,
        });
      }
    },
    onSuccess: () => {
      const wasFollowed = isFollowed;
      setIsFollowed(!isFollowed);
      queryClient.invalidateQueries({ queryKey: ["/api/followed-cards"] });
      toast({
        title: wasFollowed ? "已取消关注" : "已关注",
        description: wasFollowed ? `不再跟踪 ${card.name_cn || card.name_en} 价格` : `将持续跟踪 ${card.name_cn || card.name_en} 价格趋势`,
      });
    },
  });

  const openSourceManager = () => {
    setPendingSources([...enabledSources]);
    setShowSourceManager(true);
  };

  const togglePendingSource = (key: string) => {
    setPendingSources(prev => {
      if (prev.includes(key)) {
        if (prev.length <= 1) return prev;
        return prev.filter(k => k !== key);
      }
      return [...prev, key];
    });
  };

  const saveSourcesApi = useMutation({
    mutationFn: async (sources: string[]) => {
      return apiRequest("PUT", `/api/settings/${SETTINGS_KEY}`, { value: JSON.stringify(sources) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings", SETTINGS_KEY] });
    },
  });

  const confirmSourceChanges = () => {
    setEnabledSources(pendingSources);
    saveSourcesApi.mutate(pendingSources);
    setShowSourceManager(false);
    setShowApplyAllDialog(true);
  };

  const applyToAll = () => {
    setShowApplyAllDialog(false);
    toast({ title: "已应用", description: "价格来源设置已应用到所有卡牌" });
  };

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const swiping = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch.clientX < 40) {
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      swiping.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!swiping.current) return;
    swiping.current = false;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX.current;
    const dy = Math.abs(touch.clientY - touchStartY.current);
    if (dx > 80 && dy < 100) {
      window.history.back();
    }
  }, []);

  return (
    <div className="space-y-6 pb-24 bg-parchment/30" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-20 py-3 -mx-4 px-4 border-b border-border/50">
        <Link href="/library">
          <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-back-library">
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="font-heading font-bold text-sm uppercase tracking-widest text-primary/80">卡牌详情</h1>
        <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-share">
          <Share2 className="w-5 h-5" />
        </Button>
      </div>

      <div className="space-y-8 max-w-[400px] mx-auto">
        <div className="relative flex justify-center pt-4">
          <div className="relative w-[260px] aspect-[63/88] rounded-[4.5%] shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-transform duration-500 hover:scale-[1.02]">
            <img src={card.image_uri} alt={card.name_en} className="w-full h-full object-cover rounded-[4.5%]" />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1.5 bg-background border border-primary/20 px-4 py-1.5 rounded-full shadow-lg">
                <div className={`w-2.5 h-2.5 rounded-full ${card.rarity === 'mythic' ? 'bg-orange-500 shadow-[0_0_8px_orange]' : 'bg-primary'}`} />
                <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-primary">{card.rarity}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 text-center px-4 pt-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold font-heading text-primary leading-tight" data-testid="text-card-name">{card.name_en}</h2>
            <p className="text-sm text-muted-foreground font-medium">{card.name_cn} · {card.name_en.toLowerCase()}</p>
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
            <Badge variant="outline" className="bg-muted/50 border-none px-2 h-5">{card.type_line.split('—')[0]}</Badge>
            <span>·</span>
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 flex items-center justify-center rounded-full bg-muted border border-border text-[8px] font-bold">1</span>
              <span>{card.set_name} ({card.set_code}) #{card.collector_number}</span>
            </div>
          </div>

          <Card className="bg-card/50 border-border/40 shadow-sm rounded-xl overflow-hidden mt-6">
            <CardContent className="p-5 text-left relative">
              <p className="text-sm leading-relaxed font-sans font-medium text-foreground/80">{card.oracle_text}</p>
            </CardContent>
          </Card>

          <div className="flex justify-center gap-2 pt-2">
            {['Standard', 'Pioneer', 'Modern', 'Commander'].map(f => (
              <div key={f} className="flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold bg-muted/30 text-muted-foreground border-border/50">
                {f} ✅
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-xs uppercase tracking-widest flex items-center gap-2 text-primary">
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-primary/10 text-primary">$</span>
              市场价格
            </h3>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] font-heading uppercase text-muted-foreground gap-1" onClick={openSourceManager} data-testid="button-manage-sources">
              管理来源 <Settings2 className="w-3 h-3" />
            </Button>
          </div>

          <div className="space-y-3">
            {enabledSources.includes("us") && (
              <Card className="border-border/60 bg-card/60 shadow-sm overflow-hidden">
                <div className="bg-muted/20 px-3 py-1.5 border-b border-border/40 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">🇺🇸</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">美国市场 (USD)</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">2小时前更新</span>
                </div>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                      <div>
                        <p className="text-xs font-bold">TCGPlayer 市场价</p>
                        <p className="text-[9px] text-muted-foreground">近薄 (NM) · 英文</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-base leading-none" data-testid="text-price-usd">${card.prices.usd}</p>
                      <p className="text-[9px] text-muted-foreground font-medium mt-1">≈ ¥{(card.prices.usd * 7.25).toFixed(2)} CNY</p>
                      <p className="text-[10px] text-green-600 font-bold flex items-center justify-end gap-0.5 mt-0.5">
                        <TrendingUp className="w-2.5 h-2.5" /> 2.4%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 opacity-80">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                      <p className="text-xs font-medium">Scryfall 均价</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-sm">${(card.prices.usd * 0.98).toFixed(2)}</p>
                      <p className="text-[9px] text-muted-foreground">≈ ¥{(card.prices.usd * 0.98 * 7.25).toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {enabledSources.includes("jp") && (
              <Card className="border-border/60 bg-card/60 shadow-sm overflow-hidden">
                <div className="bg-muted/20 px-3 py-1.5 border-b border-border/40 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">🇯🇵</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">日本市场 (JPY)</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">今日 09:30 更新</span>
                </div>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                    <div>
                      <p className="text-xs font-bold">Hareruya (晴屋)</p>
                      <p className="text-[9px] text-muted-foreground">NM · 日文</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-base leading-none">¥{card.prices.jpy.toLocaleString()}</p>
                    <p className="text-[9px] text-muted-foreground font-medium mt-1">≈ ¥{(card.prices.jpy * 0.048).toFixed(1)} CNY</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {enabledSources.includes("cn") && (
              <Card className="border-primary/20 bg-primary/[0.02] shadow-sm overflow-hidden border">
                <div className="bg-primary/5 px-3 py-1.5 border-b border-primary/10 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">🇨🇳</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary/80">中国市场 (CNY)</span>
                  </div>
                  <span className="text-[9px] text-primary/60">实时更新</span>
                </div>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
                    <div>
                      <p className="text-xs font-bold text-primary">综合均价</p>
                      <p className="text-[9px] text-muted-foreground">社区与全网采集</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-base leading-none text-primary" data-testid="text-price-cny">¥{card.prices.cny.toFixed(2)}</p>
                    <p className="text-[10px] text-red-500 font-bold flex items-center justify-end gap-0.5 mt-1">
                      <TrendingDown className="w-2.5 h-2.5" /> 1.2%
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {enabledSources.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <p>未选择任何价格来源</p>
                <Button variant="link" size="sm" onClick={openSourceManager}>点击管理来源</Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showListPicker && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => { setShowListPicker(false); setShowCreateInline(false); }}>
          <div className="absolute bottom-0 left-0 right-0 max-w-[500px] mx-auto bg-background rounded-t-2xl shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-muted-foreground/20 rounded-full mx-auto" />
            <h3 className="font-heading font-bold text-base text-center">选择列表</h3>

            {showCreateInline ? (
              <div className="space-y-3 border border-primary/20 rounded-lg p-3 bg-primary/5">
                <p className="text-sm font-bold">新建列表</p>
                <Input
                  placeholder="输入列表名称..."
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  className="h-9"
                  autoFocus
                  data-testid="input-inline-new-list"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={!newListName.trim() || createListInline.isPending}
                    onClick={() => createListInline.mutate(newListName.trim())}
                    data-testid="button-confirm-inline-create"
                  >
                    创建并添加
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setShowCreateInline(false); setNewListName(""); }}>
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              <button
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-primary/30 hover:bg-primary/5 transition-all text-left text-primary"
                onClick={() => setShowCreateInline(true)}
                data-testid="button-new-list-inline"
              >
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm">新建列表</span>
              </button>
            )}

            {lists.length === 0 && !showCreateInline ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">还没有列表，先创建一个吧</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[35vh] overflow-y-auto">
                {lists.map(list => (
                  <button
                    key={list.id}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-primary/5 hover:border-primary/30 transition-all text-left"
                    onClick={() => addToList.mutate(list.id)}
                    disabled={addToList.isPending}
                    data-testid={`button-add-to-list-${list.id}`}
                  >
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {list.name[0]}
                    </div>
                    <span className="font-medium text-sm">{list.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showSourceManager && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowSourceManager(false)}>
          <div className="absolute bottom-0 left-0 right-0 max-w-[500px] mx-auto bg-background rounded-t-2xl shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-muted-foreground/20 rounded-full mx-auto" />
            <h3 className="font-heading font-bold text-base text-center">管理价格来源</h3>
            <p className="text-xs text-muted-foreground text-center">选择要显示的价格市场卡片</p>
            <div className="space-y-2">
              {ALL_SOURCES.map(src => {
                const isOn = pendingSources.includes(src.key);
                return (
                  <button
                    key={src.key}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${isOn ? 'border-primary/40 bg-primary/5' : 'border-border opacity-50'}`}
                    onClick={() => togglePendingSource(src.key)}
                    data-testid={`button-source-${src.key}`}
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
            </div>
            <Button className="w-full" onClick={confirmSourceChanges} data-testid="button-confirm-sources">
              确认设置
            </Button>
          </div>
        </div>
      )}

      {showApplyAllDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setShowApplyAllDialog(false)}>
          <div className="bg-background rounded-2xl shadow-2xl p-6 space-y-4 max-w-[360px] mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-heading font-bold text-base text-center">应用到全部卡牌？</h3>
            <p className="text-sm text-muted-foreground text-center">是否将此价格来源设置应用到所有卡牌的详情页？</p>
            <div className="flex gap-3">
              <Button className="flex-1" onClick={applyToAll} data-testid="button-apply-all">
                应用到全部
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => {
                setShowApplyAllDialog(false);
                toast({ title: "已保存", description: "价格来源设置仅应用到当前卡牌" });
              }} data-testid="button-apply-current">
                仅当前卡牌
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 h-20 bg-background/80 backdrop-blur-xl border-t border-border z-40 max-w-[500px] mx-auto flex items-center px-4 gap-3">
        <button
          className="flex flex-col items-center gap-1 w-12 text-muted-foreground hover:text-primary transition-colors"
          onClick={() => navigate("/history")}
          data-testid="button-history"
        >
          <HistoryIcon className="w-5 h-5" />
          <span className="text-[9px] font-bold">足迹</span>
        </button>
        <Button
          className="flex-1 bg-secondary hover:bg-secondary/90 text-white font-heading text-sm h-11 rounded-lg gap-2 shadow-lg shadow-secondary/20"
          onClick={() => setShowListPicker(true)}
          data-testid="button-add-to-list"
        >
          <ListIcon className="w-4 h-4" /> 加入列表
        </Button>
        <button
          className={`flex flex-col items-center gap-1 w-12 transition-colors ${isFollowed ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
          onClick={() => followCard.mutate()}
          data-testid="button-follow"
        >
          <Heart className={`w-5 h-5 ${isFollowed ? 'fill-current' : ''}`} />
          <span className="text-[9px] font-bold">{isFollowed ? '已关注' : '关注'}</span>
        </button>
      </div>
    </div>
  );
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
