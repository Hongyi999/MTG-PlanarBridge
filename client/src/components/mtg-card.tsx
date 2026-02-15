import { Card } from "@/lib/mock-data";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MTGCardProps {
  card: Card;
  variant?: "list" | "grid";
  showPrice?: boolean;
}

export function MTGCard({ card, variant = "grid", showPrice = true }: MTGCardProps) {
  if (variant === "list") {
    return (
      <Link href={`/card/${card.id}`}>
        <div className="flex gap-4 p-3 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors cursor-pointer group">
          <div className="w-16 h-24 flex-shrink-0 relative overflow-hidden rounded-sm shadow-sm">
            <img 
              src={card.image_uri} 
              alt={card.name_en} 
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
            />
          </div>
          <div className="flex-1 flex flex-col justify-between py-1">
            <div>
              <h3 className="font-semibold text-foreground line-clamp-1">{card.name_cn}</h3>
              <p className="text-xs text-muted-foreground line-clamp-1">{card.name_en}</p>
            </div>
            <div className="flex items-center justify-between mt-2">
              <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal border-primary/20 text-primary">
                {card.set_code}
              </Badge>
              {showPrice && (
                <div className="text-right">
                  <span className="font-mono font-medium text-primary">¥{card.prices.cny}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/card/${card.id}`}>
      <div className="group relative flex flex-col gap-2 cursor-pointer">
        <div className="relative aspect-[63/88] rounded-xl overflow-hidden shadow-md border border-black/5 transition-all group-hover:shadow-lg group-hover:-translate-y-1">
          <img 
            src={card.image_uri} 
            alt={card.name_en} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
             <span className="text-white font-medium text-sm">{card.name_cn}</span>
          </div>
        </div>
        {showPrice && (
          <div className="flex justify-between items-center px-1">
            <span className="text-xs text-muted-foreground">{card.set_code}</span>
            <span className="font-mono font-medium text-sm text-primary">¥{card.prices.cny}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
