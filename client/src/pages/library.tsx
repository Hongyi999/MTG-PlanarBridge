import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MTGCard } from "@/components/mtg-card";
import { Sparkles, Filter, SlidersHorizontal, X, ChevronRight, Info, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useGame } from "@/lib/game-context";
import { useQuery } from "@tanstack/react-query";
import { searchCards } from "@/lib/api";

export default function Library() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAiMode, setIsAiMode] = useState(true);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const { game } = useGame();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
    setSearchQuery("");
    setDebouncedSearch("");
  }, [game]);

  const { data: result, isLoading } = useQuery({
    queryKey: ["/api/cards", game, debouncedSearch, page],
    queryFn: () => searchCards({ game, search: debouncedSearch, page, limit: 50 }),
  });

  const cards = result?.cards || [];
  const total = result?.total || 0;
  const totalPages = result?.totalPages || 1;

  return (
    <div className="space-y-6 h-full flex flex-col pb-4">
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading font-bold text-primary">
            {game === "mtg" ? "卡牌库" : "FAB 卡牌库"}
          </h1>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 border-primary/20 bg-card/50">
                <SlidersHorizontal className="w-4 h-4" />
                高级筛选
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[90vh] w-full p-0 flex flex-col bg-background border-t border-primary/20 rounded-t-[32px] overflow-hidden">
              <SheetHeader className="p-4 border-b bg-background/50 backdrop-blur sticky top-0 z-10">
                <SheetTitle className="font-heading text-primary flex items-center justify-between">
                  <span>高级筛选</span>
                </SheetTitle>
              </SheetHeader>
              
              <ScrollArea className="flex-1 px-4 py-6">
                <div className="space-y-8 pb-10">
                  <div className="space-y-3">
                    <label className="text-sm font-heading font-bold text-primary flex justify-between items-center">
                      卡牌名称 Card Name
                    </label>
                    <Input placeholder="输入卡牌名称 (支持中/英)" className="bg-background/50 border-primary/20 focus-visible:ring-primary/30" />
                  </div>

                  {game === "mtg" && (
                    <>
                      <div className="space-y-3">
                        <label className="text-sm font-heading font-bold text-primary">规则叙述 Rules Text</label>
                        <Input placeholder="输入卡牌规则关键词" className="bg-background/50 border-primary/20 focus-visible:ring-primary/30" />
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-heading font-bold text-primary">类别 Type</label>
                          <Badge variant="outline" className="text-[10px] h-5 border-primary/20">包含/排除</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Input placeholder="例如: 生物, 瞬间, 传奇..." className="bg-background/50 border-primary/20" />
                          <Button variant="outline" className="border-primary/20 font-heading text-xs hover:bg-primary/5">+</Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-heading font-bold text-primary">稀有度 Rarity</label>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 p-3 bg-background/30 rounded-lg border border-primary/5">
                          {[
                            { id: 'mythic', cn: '秘稀 Mythic', color: 'bg-orange-500' },
                            { id: 'rare', cn: '稀有 Rare', color: 'bg-yellow-500' },
                            { id: 'uncommon', cn: '非普通 Uncommon', color: 'bg-slate-400' },
                            { id: 'common', cn: '普通 Common', color: 'bg-slate-800' }
                          ].map(r => (
                            <div key={r.id} className="flex items-center space-x-2.5">
                              <Checkbox id={`rarity-${r.id}`} className="data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                              <div className={`w-1.5 h-1.5 rounded-full ${r.color}`} />
                              <label htmlFor={`rarity-${r.id}`} className="text-xs font-medium cursor-pointer">{r.cn}</label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-heading font-bold text-primary">颜色 Color</label>
                        </div>
                        <div className="flex justify-between p-3 bg-background/50 rounded-xl border border-primary/10 shadow-inner">
                          {['W', 'U', 'B', 'R', 'G', 'C'].map(c => (
                            <div key={c} className="flex flex-col items-center gap-2">
                              <div className={`w-9 h-9 rounded-full border-2 border-transparent hover:border-primary/30 flex items-center justify-center text-[11px] font-bold shadow-md cursor-pointer transition-all active:scale-90 bg-muted`}>
                                {c}
                              </div>
                              <Checkbox id={`color-${c}`} className="w-3.5 h-3.5 border-primary/20" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {game === "fab" && (
                    <>
                      <div className="space-y-3">
                        <label className="text-sm font-heading font-bold text-primary">类型 Type</label>
                        <div className="flex gap-2">
                          <Input placeholder="例如: Hero, Action, Equipment..." className="bg-background/50 border-primary/20" />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-heading font-bold text-primary">职业 Class</label>
                        <Select>
                          <SelectTrigger className="bg-background/50 border-primary/20 h-10">
                            <SelectValue placeholder="选择职业" />
                          </SelectTrigger>
                          <SelectContent>
                            {['Brute', 'Guardian', 'Illusionist', 'Mechanologist', 'Ninja', 'Ranger', 'Runeblade', 'Warrior', 'Wizard'].map(c => (
                              <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-heading font-bold text-primary">Pitch 值</label>
                        <div className="flex gap-2">
                          {[1, 2, 3].map(p => (
                            <div key={p} className="flex items-center space-x-2">
                              <Checkbox id={`pitch-${p}`} />
                              <label htmlFor={`pitch-${p}`} className={`text-sm font-bold cursor-pointer ${p === 1 ? "text-red-500" : p === 2 ? "text-yellow-500" : "text-blue-500"}`}>
                                {p}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-3 pt-4 border-t border-primary/10">
                    <label className="text-sm font-heading font-bold text-primary">排序方式</label>
                    <Select defaultValue="name">
                      <SelectTrigger className="bg-background/50 border-primary/20 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">名称</SelectItem>
                        <SelectItem value="price">价格</SelectItem>
                        <SelectItem value="rarity">稀有度</SelectItem>
                        <SelectItem value="set">系列</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </ScrollArea>

              <div className="p-4 border-t bg-background/90 backdrop-blur-xl grid grid-cols-[1fr,2fr] gap-4 sticky bottom-0 z-20">
                <SheetClose asChild>
                  <Button variant="outline" className="border-primary/30 font-heading text-sm h-11 active:scale-95 transition-transform">
                    重置 Clear
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button className="bg-primary text-primary-foreground font-heading text-sm h-11 shadow-lg shadow-primary/20 active:scale-95 transition-transform">
                    开始搜索 Search
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2.5">
            <Button 
              variant={isAiMode ? "default" : "outline"} 
              size="sm" 
              onClick={() => setIsAiMode(true)}
              className="gap-2 h-9 text-xs font-heading rounded-full px-4"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI 智能搜索
            </Button>
            <Button 
              variant={!isAiMode ? "default" : "outline"} 
              size="sm" 
              onClick={() => setIsAiMode(false)}
              className="h-9 text-xs font-heading rounded-full px-4"
            >
              关键词搜索
            </Button>
          </div>
          
          <div className="relative group">
            <Input 
              placeholder={isAiMode 
                ? (game === "mtg" ? "试着输入 '标准赛制下20元以内的红色瞬间'..." : "搜索 FAB 卡牌名称...")
                : "搜索卡牌名称..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-4 pr-10 border-primary/20 focus-visible:ring-primary/40 bg-card/40 backdrop-blur-md rounded-xl transition-all group-focus-within:shadow-lg group-focus-within:bg-card/60"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors">
              {isAiMode ? <Sparkles className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-4 px-1">
          <span className="text-xs text-muted-foreground font-bold tracking-tight">
            {isLoading ? "搜索中..." : `发现 ${total} 张卡牌`}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="h-6 text-xs"
              >
                上一页
              </Button>
              <span className="text-xs text-muted-foreground">{page}/{totalPages}</span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="h-6 text-xs"
              >
                下一页
              </Button>
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-sm">
              {total === 0 && !debouncedSearch
                ? `还没有${game === "mtg" ? "万智牌" : "FAB"}卡牌数据，请先在首页导入`
                : "没有找到匹配的卡牌"
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 pb-24">
            {cards.map(card => (
              <MTGCard key={card.id} card={card} variant="grid" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
