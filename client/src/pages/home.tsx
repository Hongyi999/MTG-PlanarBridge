import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MOCK_CARDS } from "@/lib/mock-data";
import { MTGCard } from "@/components/mtg-card";
import { Search, TrendingUp, Flame, List, Clock } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Link } from "wouter";

export default function Home() {
  const hotCards = MOCK_CARDS.slice(0, 3);
  const recentCards = MOCK_CARDS.slice(2, 5);

  return (
    <div className="space-y-8 pb-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading font-bold text-primary">发现</h1>
          <div className="p-2 bg-primary/10 rounded-full">
            <span className="text-lg">🇨🇳</span>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="搜索卡牌、系列或规则..."
            className="pl-9 bg-card/50 border-primary/20 focus-visible:ring-primary/30"
            data-testid="input-search"
          />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Link href="/price-lists">
          <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl shadow-sm hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer" data-testid="link-price-lists">
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
          <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl shadow-sm hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer" data-testid="link-history">
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

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-heading font-semibold">市场动向 (CN)</h2>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {hotCards.map(card => (
            <Link key={card.id} href={`/card/${card.id}`}>
              <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg shadow-sm hover:bg-accent/5 transition-colors cursor-pointer" data-testid={`card-market-${card.id}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-border">
                    <img src={card.image_uri} alt={card.name_en} className="w-full h-full object-cover scale-150" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{card.name_cn}</div>
                    <div className="text-xs text-muted-foreground">{card.name_en}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-medium">¥{card.prices.cny}</div>
                  <div className="text-xs text-green-600 flex items-center justify-end gap-0.5">
                    <span>+{(Math.random() * 5).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-heading font-semibold">社区热门</h2>
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

      <section className="grid grid-cols-2 gap-3">
        {['Standard', 'Modern', 'Commander', 'Legacy'].map((format) => (
          <div key={format} className="h-16 flex items-center justify-center bg-card border border-border rounded-lg font-heading font-medium text-muted-foreground hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all cursor-pointer">
            {format}
          </div>
        ))}
      </section>
    </div>
  );
}
