import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Clock } from "lucide-react";
import type { CardHistory } from "@shared/schema";

export default function CardHistoryPage() {
  const { data: history = [] } = useQuery<CardHistory[]>({
    queryKey: ["/api/card-history"],
  });

  return (
    <div className="space-y-6 pb-24" data-testid="card-history-page">
      <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-20 py-3 -mx-4 px-4 border-b border-border/50">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-back-from-history">
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="font-heading font-bold text-sm tracking-widest text-primary/80">浏览足迹</h1>
        <div className="w-8" />
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground text-sm">暂无浏览记录</p>
          <p className="text-xs text-muted-foreground">查看过的卡牌会自动记录在这里</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((entry) => (
            <Link key={entry.id} href={`/card/${entry.cardMockId}`}>
              <Card className="border-border/40 hover:border-primary/30 transition-colors cursor-pointer" data-testid={`card-history-${entry.id}`}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-12 h-16 rounded overflow-hidden flex-shrink-0 shadow-sm">
                    {entry.cardImage ? (
                      <img src={entry.cardImage} alt={entry.cardName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">MTG</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{entry.cardNameCn || entry.cardName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{entry.cardName}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(entry.viewedAt).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
