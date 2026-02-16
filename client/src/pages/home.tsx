import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MTGCard } from "@/components/mtg-card";
import { Search, TrendingUp, Flame, List, Clock, Download, Loader2 } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Link } from "wouter";
import { useGame } from "@/lib/game-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { searchCards, triggerImport, getImportStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

export default function Home() {
  const { game, gameName } = useGame();

  const { data: cardsResult, isLoading } = useQuery({
    queryKey: ["/api/cards", game, "home"],
    queryFn: () => searchCards({ game, limit: 10 }),
  });

  const { data: importStatus } = useQuery({
    queryKey: ["/api/import/status"],
    queryFn: getImportStatus,
    refetchInterval: 5000,
  });

  const importMutation = useMutation({
    mutationFn: (g: "mtg" | "fab") => triggerImport(g),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/import/status"] });
    },
  });

  const cardsList = cardsResult?.cards || [];
  const hotCards = cardsList.slice(0, 3);
  const recentCards = cardsList.slice(3, 8);
  const hasCards = cardsResult?.total ? cardsResult.total > 0 : false;

  const runningJobs = importStatus?.filter((j: any) => j.status === "running") || [];
  const isImporting = runningJobs.length > 0;

  return (
    <div className="space-y-8 pb-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading font-bold text-primary">发现</h1>
          <div className="p-2 bg-primary/10 rounded-full">
            <span className="text-lg">{game === "mtg" ? "🃏" : "⚔️"}</span>
          </div>
        </div>

        <Link href="/library">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={`搜索${game === "mtg" ? "万智牌" : "FAB"}卡牌...`}
              className="pl-9 bg-card/50 border-primary/20 focus-visible:ring-primary/30"
              readOnly
            />
          </div>
        </Link>
      </section>

      {!hasCards && (
        <section className="space-y-4 bg-card border border-border rounded-xl p-6 text-center">
          {isImporting ? (
            <>
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
              <h3 className="font-heading font-bold">正在导入卡牌数据...</h3>
              {runningJobs.map((j: any) => (
                <p key={j.id} className="text-sm text-muted-foreground">
                  {j.source}: {j.importedCards || 0}/{j.totalCards || "?"} 张卡牌
                </p>
              ))}
              <p className="text-xs text-muted-foreground">这可能需要几分钟，请耐心等待</p>
            </>
          ) : (
            <>
              <Download className="w-8 h-8 text-muted-foreground mx-auto" />
              <h3 className="font-heading font-bold">还没有{game === "mtg" ? "万智牌" : "FAB"}卡牌数据</h3>
              <p className="text-sm text-muted-foreground">点击下面的按钮开始导入卡牌数据库</p>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => importMutation.mutate("mtg")}
                  disabled={importMutation.isPending}
                  size="sm"
                  variant={game === "mtg" ? "default" : "outline"}
                >
                  导入 MTG 卡牌
                </Button>
                <Button
                  onClick={() => importMutation.mutate("fab")}
                  disabled={importMutation.isPending}
                  size="sm"
                  variant={game === "fab" ? "default" : "outline"}
                >
                  导入 FAB 卡牌
                </Button>
              </div>
            </>
          )}
        </section>
      )}

      <section className="grid grid-cols-2 gap-3">
        <Link href="/price-lists">
          <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl shadow-sm hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <List className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm">价格列表</p>
              <p className="text-[10px] text-muted-foreground">管理与导出</p>
            </div>
          </div>
        </Link>
        <Link href="/history">
          <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl shadow-sm hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-bold text-sm">浏览足迹</p>
              <p className="text-[10px] text-muted-foreground">查询历史</p>
            </div>
          </div>
        </Link>
      </section>

      {hasCards && hotCards.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-heading font-semibold">
              {game === "mtg" ? "市场动向" : "FAB 热门卡牌"}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {hotCards.map(card => {
              const prices = card.prices as any;
              const displayPrice = prices?.cny ? `¥${prices.cny}` : prices?.usd ? `$${prices.usd}` : null;
              return (
                <Link key={card.id} href={`/card/${card.id}`}>
                  <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg shadow-sm hover:bg-accent/5 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-border bg-muted">
                        {card.image_uri && (
                          <img src={card.image_uri} alt={card.name_en} className="w-full h-full object-cover scale-150" loading="lazy" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{card.name_cn || card.name_en}</div>
                        <div className="text-xs text-muted-foreground">{card.name_en}</div>
                      </div>
                    </div>
                    {displayPrice && (
                      <div className="text-right">
                        <div className="font-mono font-medium">{displayPrice}</div>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {hasCards && recentCards.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-heading font-semibold">更多卡牌</h2>
          </div>

          <ScrollArea className="w-full whitespace-nowrap pb-4">
            <div className="flex w-max space-x-4 p-1">
              {recentCards.map(card => (
                <div key={card.id} className="w-[140px]">
                  <MTGCard card={card} variant="grid" />
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>
      )}

      {game === "mtg" && (
        <section className="grid grid-cols-2 gap-3">
          {['Standard', 'Modern', 'Commander', 'Legacy'].map((format) => (
            <div key={format} className="h-16 flex items-center justify-center bg-card border border-border rounded-lg font-heading font-medium text-muted-foreground hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all cursor-pointer">
              {format}
            </div>
          ))}
        </section>
      )}

      {game === "fab" && (
        <section className="grid grid-cols-2 gap-3">
          {['Blitz', 'Classic Constructed', 'Commoner', 'Living Legend'].map((format) => (
            <div key={format} className="h-16 flex items-center justify-center bg-card border border-border rounded-lg font-heading font-medium text-muted-foreground hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all cursor-pointer text-sm">
              {format}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
