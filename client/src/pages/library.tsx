import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MTGCard } from "@/components/mtg-card";
import { Filter, SlidersHorizontal, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { searchCards, type SearchResult } from "@/lib/api";

export default function Library() {
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [page, setPage] = useState(1);

  // Advanced filter state
  const [filterName, setFilterName] = useState("");
  const [filterRulesText, setFilterRulesText] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterSet, setFilterSet] = useState("");
  const [filterRarity, setFilterRarity] = useState<string[]>([]);
  const [filterColors, setFilterColors] = useState<string[]>([]);
  const [filterFormat, setFilterFormat] = useState("");
  const [filterArtist, setFilterArtist] = useState("");
  const [filterLang, setFilterLang] = useState("any");
  const [filterCmcOp, setFilterCmcOp] = useState("=");
  const [filterCmcVal, setFilterCmcVal] = useState("");

  const buildQuery = useCallback(() => {
    const parts: string[] = [];
    const name = filterName || submittedQuery;
    if (name) parts.push(name);
    if (filterRulesText) parts.push(`oracle:"${filterRulesText}"`);
    if (filterType) parts.push(`type:${filterType}`);
    if (filterSet) parts.push(`set:${filterSet}`);
    if (filterRarity.length > 0) {
      filterRarity.forEach(r => parts.push(`rarity:${r}`));
    }
    if (filterColors.length > 0) {
      parts.push(`color:${filterColors.join("")}`);
    }
    if (filterFormat && filterFormat !== "all") parts.push(`format:${filterFormat}`);
    if (filterArtist) parts.push(`artist:"${filterArtist}"`);
    if (filterLang && filterLang !== "any") {
      const langMap: Record<string, string> = { cn: "zhs", en: "en", jp: "ja" };
      parts.push(`lang:${langMap[filterLang] || filterLang}`);
    }
    if (filterCmcVal) {
      const opMap: Record<string, string> = { "=": "=", "\u2264": "<=", "\u2265": ">=", "<": "<", ">": ">" };
      parts.push(`cmc${opMap[filterCmcOp] || "="}${filterCmcVal}`);
    }
    return parts.join(" ");
  }, [submittedQuery, filterName, filterRulesText, filterType, filterSet, filterRarity, filterColors, filterFormat, filterArtist, filterLang, filterCmcOp, filterCmcVal]);

  const actualQuery = buildQuery();

  const { data, isLoading, error } = useQuery<SearchResult>({
    queryKey: ["card-search", actualQuery, page],
    queryFn: () => searchCards(actualQuery, page),
    enabled: actualQuery.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setSubmittedQuery(searchQuery);
    setPage(1);
  };

  const handleAdvancedSearch = () => {
    setSubmittedQuery("");
    setPage(1);
  };

  const resetFilters = () => {
    setFilterName("");
    setFilterRulesText("");
    setFilterType("");
    setFilterSet("");
    setFilterRarity([]);
    setFilterColors([]);
    setFilterFormat("");
    setFilterArtist("");
    setFilterLang("any");
    setFilterCmcOp("=");
    setFilterCmcVal("");
  };

  const toggleRarity = (r: string) => {
    setFilterRarity(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const toggleColor = (c: string) => {
    setFilterColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const cards = data?.cards || [];
  const totalCards = data?.total_cards || 0;
  const hasMore = data?.has_more || false;

  return (
    <div className="space-y-6 h-full flex flex-col pb-4">
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading font-bold text-primary">卡牌库</h1>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 border-primary/20 bg-card/50">
                <SlidersHorizontal className="w-4 h-4" />
                高级筛选
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[90vh] w-full p-0 flex flex-col bg-background border-t border-primary/20 rounded-t-[32px] overflow-hidden">
              <SheetHeader className="p-4 border-b bg-background/50 backdrop-blur sticky top-0 z-10">
                <SheetTitle className="font-heading text-primary">高级筛选</SheetTitle>
              </SheetHeader>

              <ScrollArea className="flex-1 px-4 py-6">
                <div className="space-y-8 pb-10">
                  <div className="space-y-3">
                    <label className="text-sm font-heading font-bold text-primary">卡牌名称 Card Name</label>
                    <Input placeholder="输入卡牌名称 (支持中/英/日)" className="bg-background/50 border-primary/20" value={filterName} onChange={e => setFilterName(e.target.value)} />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-heading font-bold text-primary">规则叙述 Rules Text</label>
                    <Input placeholder="输入卡牌规则关键词" className="bg-background/50 border-primary/20" value={filterRulesText} onChange={e => setFilterRulesText(e.target.value)} />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-heading font-bold text-primary">类别 Type</label>
                    <Input placeholder="例如: creature, instant, legendary..." className="bg-background/50 border-primary/20" value={filterType} onChange={e => setFilterType(e.target.value)} />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-heading font-bold text-primary">系列 Set / Expansion</label>
                    <Input placeholder="输入系列代码 (如: MH3, LTR, DMU)" className="bg-background/50 border-primary/20" value={filterSet} onChange={e => setFilterSet(e.target.value)} />
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
                          <Checkbox
                            id={`rarity-${r.id}`}
                            checked={filterRarity.includes(r.id)}
                            onCheckedChange={() => toggleRarity(r.id)}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <div className={`w-1.5 h-1.5 rounded-full ${r.color}`} />
                          <label htmlFor={`rarity-${r.id}`} className="text-xs font-medium cursor-pointer">{r.cn}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-heading font-bold text-primary">颜色 Color</label>
                    <div className="flex justify-between p-3 bg-background/50 rounded-xl border border-primary/10 shadow-inner">
                      {[
                        { key: 'W', label: 'white' },
                        { key: 'U', label: 'blue' },
                        { key: 'B', label: 'black' },
                        { key: 'R', label: 'red' },
                        { key: 'G', label: 'green' },
                        { key: 'C', label: 'muted' }
                      ].map(c => (
                        <div key={c.key} className="flex flex-col items-center gap-2">
                          <div
                            className={`w-9 h-9 rounded-full border-2 ${filterColors.includes(c.key) ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-primary/30'} flex items-center justify-center bg-mtg-${c.label} text-[11px] font-bold shadow-md cursor-pointer transition-all active:scale-90`}
                            onClick={() => toggleColor(c.key)}
                          >
                            {c.key}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-heading font-bold text-primary">法术力费用 CMC</label>
                    <div className="flex gap-3 items-center p-3 bg-background/30 rounded-lg border border-primary/5">
                      <Select value={filterCmcOp} onValueChange={setFilterCmcOp}>
                        <SelectTrigger className="w-16 h-8 bg-background/50 border-primary/10 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="=">=</SelectItem>
                          <SelectItem value="\u2264">\u2264</SelectItem>
                          <SelectItem value="\u2265">\u2265</SelectItem>
                          <SelectItem value="<">&lt;</SelectItem>
                          <SelectItem value=">">&gt;</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input type="number" placeholder="数值" className="h-8 bg-background/50 border-primary/10 text-xs" value={filterCmcVal} onChange={e => setFilterCmcVal(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-heading font-bold text-primary">赛制合法性 Format</label>
                    <Select value={filterFormat} onValueChange={setFilterFormat}>
                      <SelectTrigger className="bg-background/50 border-primary/20 h-10">
                        <SelectValue placeholder="不限赛制 (All Formats)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">不限赛制 (All Formats)</SelectItem>
                        <SelectItem value="standard">Standard (标准)</SelectItem>
                        <SelectItem value="pioneer">Pioneer (先驱)</SelectItem>
                        <SelectItem value="modern">Modern (近代)</SelectItem>
                        <SelectItem value="commander">Commander (指挥官)</SelectItem>
                        <SelectItem value="legacy">Legacy (薪传)</SelectItem>
                        <SelectItem value="vintage">Vintage (特选)</SelectItem>
                        <SelectItem value="pauper">Pauper (纯普)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-6 pt-2">
                    <div className="space-y-3">
                      <label className="text-sm font-heading font-bold text-primary">画师 Artist</label>
                      <Input placeholder="输入画师姓名" className="bg-background/50 border-primary/20 h-10" value={filterArtist} onChange={e => setFilterArtist(e.target.value)} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-heading font-bold text-primary">语言 Language</label>
                      <Select value={filterLang} onValueChange={setFilterLang}>
                        <SelectTrigger className="bg-background/50 border-primary/20 h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">所有语言 (All Languages)</SelectItem>
                          <SelectItem value="cn">简体中文</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="jp">日本語</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="p-4 border-t bg-background/90 backdrop-blur-xl grid grid-cols-[1fr,2fr] gap-4 sticky bottom-0 z-20">
                <SheetClose asChild>
                  <Button variant="outline" className="border-primary/30 font-heading text-sm h-11" onClick={resetFilters}>
                    重置 Clear
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button className="bg-primary text-primary-foreground font-heading text-sm h-11 shadow-lg shadow-primary/20" onClick={handleAdvancedSearch}>
                    开始搜索 Search
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <form onSubmit={handleSearch}>
          <div className="relative group">
            <Input
              placeholder="搜索卡牌名称 (支持中英文自动检测)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-4 pr-10 border-primary/20 focus-visible:ring-primary/40 bg-card/40 backdrop-blur-md rounded-xl transition-all group-focus-within:shadow-lg group-focus-within:bg-card/60"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </form>
      </header>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">正在搜索卡牌...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12 space-y-3">
            <p className="text-sm text-red-500">搜索出错: {(error as Error).message}</p>
            <p className="text-xs text-muted-foreground">请检查搜索条件后重试</p>
          </div>
        )}

        {!isLoading && !error && actualQuery.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <Filter className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground text-sm">输入关键词搜索万智牌卡牌</p>
            <p className="text-xs text-muted-foreground">支持中文名、英文名、系列代码等</p>
          </div>
        )}

        {!isLoading && !error && actualQuery.length > 0 && cards.length === 0 && (
          <div className="text-center py-12 space-y-3">
            <p className="text-muted-foreground text-sm">未找到匹配的卡牌</p>
            <p className="text-xs text-muted-foreground">试试其他搜索条件</p>
          </div>
        )}

        {cards.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="text-xs text-muted-foreground font-bold tracking-tight">发现 {totalCards.toLocaleString()} 张卡牌</span>
              {page > 1 && (
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setPage(p => Math.max(1, p - 1))}>
                  上一页
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pb-8">
              {cards.map(card => (
                <MTGCard key={card.scryfall_id} card={card} variant="grid" />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center pb-24">
                <Button variant="outline" onClick={() => setPage(p => p + 1)} className="font-heading">
                  加载更多
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
