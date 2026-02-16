import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Loader2 } from "lucide-react";

interface FaBCard {
  identifier: string;
  name: string;
  text: string | null;
  cost: string | null;
  pitch: string | null;
  power: string | null;
  defense: string | null;
  health: string | null;
  rarity: string | null;
  keywords: string[];
  image: string | null;
  printings: { id: string; set_id: string; edition: string; image: string }[];
  prices: { usd: number | null; cny_converted: number | null };
}

async function getFaBCard(identifier: string): Promise<FaBCard> {
  const res = await fetch(`/api/fab/cards/${identifier}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message || `Failed to fetch FAB card: ${res.status}`);
  }
  return res.json();
}

export default function FaBCardDetail() {
  const [, params] = useRoute("/fab/:identifier");
  const identifier = params?.identifier || "";

  const { data: card, isLoading, error } = useQuery<FaBCard>({
    queryKey: ["fab-card", identifier],
    queryFn: () => getFaBCard(identifier),
    enabled: !!identifier,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="space-y-4">
        <Link href="/library">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div className="text-center py-12 space-y-3">
          <p className="text-sm text-red-500">加载失败: {error ? (error as Error).message : "未找到卡牌"}</p>
        </div>
      </div>
    );
  }

  const pitchColors: Record<string, string> = {
    "1": "border-red-500",
    "2": "border-yellow-500",
    "3": "border-blue-500",
  };

  const rarityColors: Record<string, string> = {
    "M": "text-orange-500",
    "L": "text-yellow-500",
    "S": "text-slate-400",
    "C": "text-slate-600",
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-20 py-3 -mx-4 px-4 border-b border-border/50">
        <Link href="/library">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="font-heading font-bold text-sm tracking-widest text-primary/80 truncate max-w-[250px]">
          {card.name}
        </h1>
        <div className="w-8" />
      </div>

      {/* Card Image */}
      {card.image && (
        <div className={`rounded-xl overflow-hidden border-4 ${card.pitch ? pitchColors[card.pitch] || "border-border" : "border-border"} shadow-xl mx-auto max-w-[300px]`}>
          <img src={card.image} alt={card.name} className="w-full" />
        </div>
      )}

      {/* Card Stats */}
      <Card className="border-border/60">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-heading font-bold">{card.name}</h2>
            {card.rarity && (
              <Badge variant="outline" className={rarityColors[card.rarity] || ""}>
                {card.rarity}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {card.cost && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Cost:</span>
                <Badge variant="secondary">{card.cost}</Badge>
              </div>
            )}
            {card.pitch && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Pitch:</span>
                <Badge variant="secondary">{card.pitch}</Badge>
              </div>
            )}
            {card.power && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Power:</span>
                <Badge variant="secondary">{card.power}</Badge>
              </div>
            )}
            {card.defense && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Defense:</span>
                <Badge variant="secondary">{card.defense}</Badge>
              </div>
            )}
            {card.health && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Health:</span>
                <Badge variant="secondary">{card.health}</Badge>
              </div>
            )}
          </div>

          {card.keywords && card.keywords.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Keywords</span>
              <div className="flex flex-wrap gap-1">
                {card.keywords.map((kw, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card Text */}
      {card.text && (
        <Card className="border-border/60">
          <CardContent className="p-4 space-y-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Card Text</h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{card.text}</p>
          </CardContent>
        </Card>
      )}

      {/* Printings */}
      {card.printings && card.printings.length > 0 && (
        <Card className="border-border/60">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Printings ({card.printings.length})
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {card.printings.slice(0, 6).map((printing, i) => (
                <div key={i} className="aspect-[5/7] rounded overflow-hidden border border-border">
                  {printing.image ? (
                    <img src={printing.image} alt={`${card.name} ${printing.edition}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-[8px] text-muted-foreground text-center px-1">{printing.edition}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Identifier */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Card ID: <span className="font-mono">{card.identifier}</span>
        </p>
      </div>
    </div>
  );
}
