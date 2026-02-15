import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MOCK_CARDS } from "@/lib/mock-data";
import { MTGCard } from "@/components/mtg-card";
import { Sparkles, Filter, SlidersHorizontal, X, ChevronRight, Info } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export default function Library() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAiMode, setIsAiMode] = useState(true);

  const filteredCards = MOCK_CARDS.filter(card => 
    card.name_en.toLowerCase().includes(searchQuery.toLowerCase()) || 
    card.name_cn.includes(searchQuery)
  );

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
                <SheetTitle className="font-heading text-primary flex items-center justify-between">
                  <span>高级筛选</span>
                </SheetTitle>
              </SheetHeader>
              
              <ScrollArea className="flex-1 px-4 py-6">
                <div className="space-y-8 pb-10">
                  {/* Card Name */}
                  <div className="space-y-3">
                    <label className="text-sm font-heading font-bold text-primary flex justify-between items-center">
                      卡牌名称 Card Name
                    </label>
                    <Input placeholder="输入卡牌名称 (支持中/英/日)" className="bg-background/50 border-primary/20 focus-visible:ring-primary/30" />
                  </div>

                  {/* Rules Text */}
                  <div className="space-y-3">
                    <label className="text-sm font-heading font-bold text-primary">规则叙述 Rules Text</label>
                    <Input placeholder="输入卡牌规则关键词" className="bg-background/50 border-primary/20 focus-visible:ring-primary/30" />
                  </div>

                  {/* Type */}
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

                  {/* Set / Expansion */}
                  <div className="space-y-3">
                    <label className="text-sm font-heading font-bold text-primary">系列 Set / Expansion</label>
                    <div className="flex gap-2">
                      <Input placeholder="输入系列代码 (如: MH3)" className="bg-background/50 border-primary/20" />
                      <Button variant="outline" className="border-primary/20 text-xs px-3">选择系列</Button>
                    </div>
                  </div>

                  {/* Rarity */}
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

                  {/* Color */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-heading font-bold text-primary">颜色 Color</label>
                      <Info className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex justify-between p-3 bg-background/50 rounded-xl border border-primary/10 shadow-inner">
                      {['W', 'U', 'B', 'R', 'G', 'C'].map(c => (
                        <div key={c} className="flex flex-col items-center gap-2">
                          <div className={`w-9 h-9 rounded-full border-2 border-transparent hover:border-primary/30 flex items-center justify-center bg-mtg-${c === 'W' ? 'white' : c === 'U' ? 'blue' : c === 'B' ? 'black' : c === 'R' ? 'red' : c === 'G' ? 'green' : 'muted'} text-[11px] font-bold shadow-md cursor-pointer transition-all active:scale-90`}>
                            {c}
                          </div>
                          <Checkbox id={`color-${c}`} className="w-3.5 h-3.5 border-primary/20" />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 gap-2.5 pt-2 px-1">
                      <div className="flex items-center space-x-2.5">
                        <Checkbox id="multicolor" />
                        <label htmlFor="multicolor" className="text-xs font-medium text-foreground/80">必须多色 Must be multicolor</label>
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <Checkbox id="exclude-unselected" />
                        <label htmlFor="exclude-unselected" className="text-xs font-medium text-foreground/80">不含未选 Exclude unselected</label>
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <Checkbox id="partial-match" />
                        <label htmlFor="partial-match" className="text-xs font-medium text-foreground/80">部分匹配 Partial match</label>
                      </div>
                    </div>
                  </div>

                  {/* Mana Cost & CMC */}
                  <div className="space-y-4">
                    <label className="text-sm font-heading font-bold text-primary">法术力费用 Mana Cost</label>
                    <div className="p-3 bg-background/30 rounded-lg border border-primary/5 space-y-4">
                       <div className="flex flex-wrap gap-2">
                         {['{0}', '{1}', '{2}', '{X}', '{W}', '{U}', '{B}', '{R}', '{G}'].map(m => (
                           <div key={m} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold border border-border cursor-pointer hover:bg-accent transition-colors">
                             {m}
                           </div>
                         ))}
                       </div>
                       <Separator className="bg-primary/5" />
                       <div className="flex gap-3 items-center">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase whitespace-nowrap">Converted Mana Value (CMC):</span>
                          <Select defaultValue="=">
                            <SelectTrigger className="w-16 h-8 bg-background/50 border-primary/10 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="=">=</SelectItem>
                              <SelectItem value="≤">≤</SelectItem>
                              <SelectItem value="≥">≥</SelectItem>
                              <SelectItem value="<">&lt;</SelectItem>
                              <SelectItem value=">">&gt;</SelectItem>
                              <SelectItem value="≠">≠</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input type="number" placeholder="数值" className="h-8 bg-background/50 border-primary/10 text-xs" />
                       </div>
                    </div>
                  </div>

                  {/* Power & Toughness */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="text-sm font-heading font-bold text-primary">力量 Power</label>
                      <div className="flex gap-1.5">
                        <Select defaultValue="=">
                          <SelectTrigger className="w-12 h-9 bg-background/50 border-primary/10 text-xs px-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="=">=</SelectItem>
                            <SelectItem value="≤">≤</SelectItem>
                            <SelectItem value="≥">≥</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input placeholder="*" className="h-9 bg-background/50 border-primary/10 text-xs" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-heading font-bold text-primary">防御 Toughness</label>
                      <div className="flex gap-1.5">
                        <Select defaultValue="=">
                          <SelectTrigger className="w-12 h-9 bg-background/50 border-primary/10 text-xs px-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="=">=</SelectItem>
                            <SelectItem value="≤">≤</SelectItem>
                            <SelectItem value="≥">≥</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input placeholder="*" className="h-9 bg-background/50 border-primary/10 text-xs" />
                      </div>
                    </div>
                  </div>

                  {/* Format Legality */}
                  <div className="space-y-3">
                    <label className="text-sm font-heading font-bold text-primary">赛制合法性 Format Legality</label>
                    <Select>
                      <SelectTrigger className="bg-background/50 border-primary/20 h-10">
                        <SelectValue placeholder="不限赛制 (All Formats)" />
                      </SelectTrigger>
                      <SelectContent>
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

                  {/* Extra Metadata */}
                  <div className="space-y-6 pt-2">
                    <div className="space-y-3">
                      <label className="text-sm font-heading font-bold text-primary">画师 Artist</label>
                      <Input placeholder="输入画师姓名" className="bg-background/50 border-primary/20 h-10" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-heading font-bold text-primary">背景叙述 Flavor Text</label>
                      <Input placeholder="输入背景描述关键词" className="bg-background/50 border-primary/20 h-10" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-heading font-bold text-primary">语言 Language</label>
                      <Select defaultValue="any">
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

                  {/* Sort Options */}
                  <div className="space-y-3 pt-4 border-t border-primary/10">
                    <label className="text-sm font-heading font-bold text-primary">排序方式</label>
                    <div className="grid grid-cols-[1fr,auto] gap-2">
                      <Select defaultValue="relevance">
                        <SelectTrigger className="bg-background/50 border-primary/20 h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="relevance">相关度</SelectItem>
                          <SelectItem value="name">名称</SelectItem>
                          <SelectItem value="mana">法术力</SelectItem>
                          <SelectItem value="price_cny">价格</SelectItem>
                          <SelectItem value="release">系列发售日期</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex border border-primary/20 rounded-md overflow-hidden h-10">
                        <button className="px-3 bg-primary text-primary-foreground flex items-center justify-center">↑</button>
                        <button className="px-3 bg-background/50 flex items-center justify-center border-l border-primary/10 hover:bg-muted">↓</button>
                      </div>
                    </div>
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
                    🔍 开始搜索 Search
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
              placeholder={isAiMode ? "试着输入 '标准赛制下20元以内的红色瞬间'..." : "搜索卡牌名称..."}
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
          <span className="text-xs text-muted-foreground font-bold tracking-tight">发现 {filteredCards.length} 张卡牌</span>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-widest bg-muted/30 px-2 py-1 rounded-md">
            默认排序 <ChevronRight className="w-3 h-3" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pb-24">
          {filteredCards.map(card => (
            <MTGCard key={card.id} card={card} variant="grid" />
          ))}
        </div>
      </div>
    </div>
  );
}
