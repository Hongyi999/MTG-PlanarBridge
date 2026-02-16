import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Heart, Share2, Search, Bell, Pencil } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import type { CommunityPost } from "@shared/schema";

const TRENDING_TOPICS = [
  { id: 1, title: "#MH3 Spoilers", image: "https://images.unsplash.com/photo-1615678815958-5910c6811c25?w=300&q=80" },
  { id: 2, title: "#ProTour", image: "https://images.unsplash.com/photo-1544652478-6653e09f18a2?w=300&q=80" },
  { id: 3, title: "#Commander", image: "https://images.unsplash.com/photo-1611095777215-8473760a996c?w=300&q=80" },
];

const TYPE_LABELS: Record<string, { label: string; bgClass: string; textClass: string; borderClass: string }> = {
  discussion: { label: "话题讨论", bgClass: "bg-blue-50", textClass: "text-blue-700", borderClass: "border-blue-100" },
  sell: { label: "卡牌出售", bgClass: "bg-green-50", textClass: "text-green-700", borderClass: "border-green-100" },
  buy: { label: "卡牌收购", bgClass: "bg-orange-50", textClass: "text-orange-700", borderClass: "border-orange-100" },
  trade: { label: "卡牌交换", bgClass: "bg-purple-50", textClass: "text-purple-700", borderClass: "border-purple-100" },
};

const BORDER_COLORS: Record<string, string> = {
  sell: "border-l-green-500",
  buy: "border-l-orange-500",
  trade: "border-l-purple-500",
};

function timeAgo(date: string | Date) {
  const now = Date.now();
  const d = new Date(date).getTime();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins}分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}小时前`;
  const days = Math.floor(hrs / 24);
  return `${days}天前`;
}

export default function Community() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");

  const { data: dbPosts = [] } = useQuery<CommunityPost[]>({
    queryKey: ["/api/community-posts"],
  });

  const likePost = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/community-posts/${id}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community-posts"] });
    },
  });

  const allPosts = dbPosts.map(p => ({
    id: `db-${p.id}`,
    dbId: p.id,
    user: { name: p.authorName, avatar: p.authorAvatar || "" },
    content: p.content,
    type: p.type as string,
    timestamp: timeAgo(p.createdAt),
    likes: p.likes,
    comments: p.comments,
    images: p.images || [],
    cardMockId: p.cardMockId,
    cardName: p.cardName,
    cardImage: p.cardImage,
    price: p.price,
    isDb: true,
  }));

  const filteredPosts = activeTab === "all" ? allPosts : allPosts.filter(p => p.type === activeTab);

  const renderPost = (post: typeof allPosts[0]) => {
    const typeInfo = TYPE_LABELS[post.type] || TYPE_LABELS.discussion;
    const borderColor = BORDER_COLORS[post.type] || "";
    const attachedCard = null;

    return (
      <Card key={post.id} className={`border-border/40 bg-card/40 backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden group ${borderColor ? `border-l-4 ${borderColor}` : ""}`} data-testid={`card-post-${post.id}`}>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border border-primary/10">
                <AvatarImage src={post.user.avatar} />
                <AvatarFallback>{post.user.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-sm tracking-tight">{post.user.name}</p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{post.timestamp}</p>
              </div>
            </div>
            <Badge variant="secondary" className={`${typeInfo.bgClass} ${typeInfo.textClass} ${typeInfo.borderClass} px-3 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest`}>
              {typeInfo.label}
            </Badge>
          </div>

          <p className="text-sm text-foreground/90 leading-relaxed font-medium whitespace-pre-wrap">{post.content}</p>

          {post.images.length > 0 && (
            <div className={`grid gap-1.5 ${post.images.length === 1 ? "grid-cols-1" : post.images.length <= 4 ? "grid-cols-2" : "grid-cols-3"}`}>
              {post.images.map((url, idx) => (
                <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-border/40">
                  <img src={url} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {post.cardImage && (
            <div className="border border-border/60 rounded-xl p-3 bg-background/60 shadow-inner flex gap-3 items-center">
              <div className="w-12 h-16 rounded-md overflow-hidden shadow-md flex-shrink-0">
                <img src={post.cardImage || ""} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="font-bold text-sm truncate">{post.cardName}</p>
                <div className="flex items-center justify-between pt-0.5">
                  {post.price && <p className="text-xs font-mono font-bold text-green-600">报价 ¥{post.price}</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-3 bg-muted/10 border-t border-border/40 flex items-center justify-between text-muted-foreground">
          <div className="flex gap-6">
            <button
              className="flex items-center gap-2 hover:text-red-500 transition-colors"
              onClick={() => post.dbId && likePost.mutate(post.dbId)}
              data-testid={`button-like-${post.id}`}
            >
              <Heart className="w-5 h-5" />
              <span className="text-xs font-bold">{post.likes}</span>
            </button>
            <button className="flex items-center gap-2 hover:text-primary transition-colors" data-testid={`button-comment-${post.id}`}>
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs font-bold">{post.comments}</span>
            </button>
          </div>
          <button className="hover:text-primary transition-colors" data-testid={`button-share-${post.id}`}>
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-20 py-2 -mx-4 px-4 border-b border-border/10">
        <h1 className="text-2xl font-heading font-bold text-primary uppercase tracking-wider flex items-center gap-2">
          社区
        </h1>
        <div className="flex gap-4">
          <Search className="w-6 h-6 text-foreground/80" />
          <div className="relative">
            <Bell className="w-6 h-6 text-foreground/80" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <ScrollArea className="w-full">
          <TabsList className="bg-transparent h-auto p-0 flex gap-3 justify-start">
            <TabsTrigger value="all" className="rounded-full px-6 py-2 bg-muted/50 data-[state=active]:bg-foreground data-[state=active]:text-background transition-all font-medium text-sm" data-testid="tab-all">全部</TabsTrigger>
            <TabsTrigger value="discussion" className="rounded-full px-6 py-2 bg-muted/50 data-[state=active]:bg-foreground data-[state=active]:text-background transition-all font-medium text-sm flex gap-2" data-testid="tab-discussion">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" /> 讨论
            </TabsTrigger>
            <TabsTrigger value="sell" className="rounded-full px-6 py-2 bg-muted/50 data-[state=active]:bg-foreground data-[state=active]:text-background transition-all font-medium text-sm flex gap-2" data-testid="tab-sell">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" /> 出售
            </TabsTrigger>
            <TabsTrigger value="buy" className="rounded-full px-6 py-2 bg-muted/50 data-[state=active]:bg-foreground data-[state=active]:text-background transition-all font-medium text-sm flex gap-2" data-testid="tab-buy">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400" /> 收购
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" className="hidden" />
        </ScrollArea>

        <div className="pt-6 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-heading font-bold uppercase tracking-widest text-primary/80">热门话题</h2>
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">更多 <ChevronRightIcon /></span>
          </div>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex space-x-3">
              {TRENDING_TOPICS.map((topic) => (
                <div key={topic.id} className="relative w-36 h-20 rounded-xl overflow-hidden group cursor-pointer">
                  <img src={topic.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 flex items-end p-2">
                    <span className="text-white text-[10px] font-bold uppercase tracking-wider">{topic.title}</span>
                  </div>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="hidden" />
          </ScrollArea>
        </div>

        <div className="mt-8 space-y-6">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-muted-foreground text-sm">暂无帖子</p>
              <Link href="/create-post">
                <Button size="sm" variant="outline" data-testid="button-create-first">发布第一条动态</Button>
              </Link>
            </div>
          ) : (
            filteredPosts.map(post => renderPost(post))
          )}
        </div>
      </Tabs>

      <Link href="/create-post">
        <button className="fixed bottom-20 right-6 w-14 h-14 bg-foreground text-background rounded-full shadow-2xl shadow-foreground/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40" data-testid="button-create-post">
          <Pencil className="w-6 h-6" />
        </button>
      </Link>
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
