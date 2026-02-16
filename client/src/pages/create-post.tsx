import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ChevronLeft, Image as ImageIcon, Mic, MicOff, X, Search, Plus, Loader2
} from "lucide-react";
import { searchCards, type CardData } from "@/lib/api";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const POST_TYPES = [
  { key: "discussion", label: "讨论", color: "bg-blue-500", desc: "分享想法和观点" },
  { key: "sell", label: "出售", color: "bg-green-500", desc: "出售你的卡牌" },
  { key: "buy", label: "收购", color: "bg-orange-500", desc: "寻找想要的卡牌" },
  { key: "trade", label: "交换", color: "bg-purple-500", desc: "卡牌以物换物" },
];

export default function CreatePost() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [postType, setPostType] = useState("discussion");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [cardSearch, setCardSearch] = useState("");
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [price, setPrice] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: cardResults, isLoading: cardSearchLoading } = useQuery({
    queryKey: ["card-picker-search", cardSearch],
    queryFn: () => searchCards(cardSearch),
    enabled: cardSearch.length >= 2,
    staleTime: 60000,
  });
  const filteredCards = cardResults?.cards || [];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (images.length + files.length > 9) {
      toast({ title: "最多上传9张图片", variant: "destructive" });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach(f => formData.append("images", f));

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.urls) {
        setImages(prev => [...prev, ...data.urls]);
      }
    } catch {
      toast({ title: "图片上传失败", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "当前浏览器不支持语音输入" });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setContent(prev => {
        const base = prev.replace(/\[语音输入中.*\]$/, "").trimEnd();
        if (event.results[event.results.length - 1].isFinal) {
          return base ? base + " " + transcript : transcript;
        }
        return (base ? base + " " : "") + transcript;
      });
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast({ title: "语音识别出错，请重试" });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    setIsListening(true);
  };

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const createPost = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/community-posts", {
        authorName: "鹏洛客_CN",
        authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Planeswalker",
        content,
        type: postType,
        images: images.length > 0 ? images : null,
        scryfallId: selectedCard?.scryfall_id || null,
        cardName: selectedCard?.name_cn || selectedCard?.name_en || null,
        cardImage: selectedCard?.image_uri || null,
        price: price ? parseFloat(price) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community-posts"] });
      toast({ title: "发布成功", description: "你的帖子已发布到社区" });
      navigate("/community");
    },
    onError: () => {
      toast({ title: "发布失败", variant: "destructive" });
    },
  });

  const canSubmit = content.trim().length > 0 && !createPost.isPending;

  return (
    <div className="space-y-5 pb-24" data-testid="create-post-page">
      <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-20 py-3 -mx-4 px-4 border-b border-border/50">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/community")} data-testid="button-back-community">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="font-heading font-bold text-sm tracking-widest text-primary/80">发布动态</h1>
        <Button
          size="sm"
          className="h-8 px-4 text-xs font-bold"
          disabled={!canSubmit}
          onClick={() => createPost.mutate()}
          data-testid="button-submit-post"
        >
          {createPost.isPending ? "发布中..." : "发布"}
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">帖子类型</p>
        <div className="flex gap-2">
          {POST_TYPES.map(t => (
            <button
              key={t.key}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                postType === t.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30"
              }`}
              onClick={() => setPostType(t.key)}
              data-testid={`button-type-${t.key}`}
            >
              <div className={`w-2 h-2 rounded-full ${t.color}`} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">内容</p>
          <button
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              isListening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
            onClick={toggleVoiceInput}
            data-testid="button-voice-input"
          >
            {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            {isListening ? "停止录音" : "语音输入"}
          </button>
        </div>
        <textarea
          ref={textareaRef}
          className="w-full min-h-[160px] border border-border rounded-xl p-4 text-sm bg-card/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 placeholder:text-muted-foreground/60"
          placeholder={
            postType === "sell" ? "描述你要出售的卡牌，品相、语言版本、价格等..."
            : postType === "buy" ? "描述你想收购的卡牌，预算、品相要求等..."
            : postType === "trade" ? "描述你想交换的卡牌，有什么、想换什么..."
            : "分享你的想法、讨论、策略分析..."
          }
          value={content}
          onChange={e => setContent(e.target.value)}
          data-testid="textarea-content"
        />
        <p className="text-[10px] text-muted-foreground text-right">{content.length} 字</p>
      </div>

      {(postType === "sell" || postType === "trade") && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">报价 (CNY)</p>
          <Input
            type="number"
            placeholder="输入价格..."
            value={price}
            onChange={e => setPrice(e.target.value)}
            className="h-9"
            data-testid="input-price"
          />
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">图片 ({images.length}/9)</p>
        <div className="flex flex-wrap gap-2">
          {images.map((url, idx) => (
            <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
              <img src={url} className="w-full h-full object-cover" />
              <button
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(idx)}
                data-testid={`button-remove-image-${idx}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {images.length < 9 && (
            <button
              className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              data-testid="button-add-image"
            >
              {uploading ? (
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                <>
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-[9px]">添加图片</span>
                </>
              )}
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">关联卡牌</p>
          {selectedCard && (
            <button
              className="text-[10px] text-red-500 font-medium"
              onClick={() => setSelectedCard(null)}
              data-testid="button-remove-card"
            >
              移除
            </button>
          )}
        </div>

        {selectedCard ? (
          <Card className="border-primary/20 bg-primary/5 p-3">
            <div className="flex gap-3 items-center">
              <div className="w-12 h-16 rounded overflow-hidden shadow-sm flex-shrink-0">
                <img src={selectedCard.image_uri ?? ""} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{selectedCard.name_cn ?? selectedCard.name_en}</p>
                <p className="text-[10px] text-muted-foreground">{selectedCard.name_en}</p>
                <p className="text-xs font-mono font-bold text-primary mt-1">
                  {selectedCard.prices.cny_converted != null
                    ? `¥${selectedCard.prices.cny_converted.toFixed(2)}`
                    : selectedCard.prices.usd != null
                    ? `$${selectedCard.prices.usd.toFixed(2)}`
                    : "N/A"}
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <button
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-border hover:border-primary/30 transition-colors"
            onClick={() => setShowCardPicker(true)}
            data-testid="button-attach-card"
          >
            <div className="w-8 h-8 rounded bg-muted/50 flex items-center justify-center">
              <Plus className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">选择要关联的卡牌</span>
          </button>
        )}
      </div>

      {showCardPicker && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowCardPicker(false)}>
          <div className="absolute bottom-0 left-0 right-0 max-w-[500px] mx-auto bg-background rounded-t-2xl shadow-2xl p-6 space-y-4 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-muted-foreground/20 rounded-full mx-auto" />
            <h3 className="font-heading font-bold text-base text-center">选择卡牌</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索卡牌名称..."
                value={cardSearch}
                onChange={e => setCardSearch(e.target.value)}
                className="pl-9 h-9"
                autoFocus
                data-testid="input-search-card"
              />
            </div>
            <div className="space-y-2">
              {cardSearchLoading && cardSearch.length >= 2 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                filteredCards.map(card => (
                  <button
                    key={card.scryfall_id}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-primary/5 hover:border-primary/30 transition-all text-left"
                    onClick={() => {
                      setSelectedCard(card);
                      setShowCardPicker(false);
                      setCardSearch("");
                    }}
                    data-testid={`button-pick-card-${card.scryfall_id}`}
                  >
                    <div className="w-10 h-14 rounded overflow-hidden shadow-sm flex-shrink-0">
                      <img src={card.image_uri ?? ""} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{card.name_cn ?? card.name_en}</p>
                      <p className="text-[10px] text-muted-foreground">{card.name_en} · {card.set_code}</p>
                    </div>
                    <p className="font-mono text-sm font-bold text-primary">
                      {card.prices.cny_converted != null
                        ? `¥${card.prices.cny_converted.toFixed(2)}`
                        : card.prices.usd != null
                        ? `$${card.prices.usd.toFixed(2)}`
                        : "N/A"}
                    </p>
                  </button>
                ))
              )}
              {!cardSearchLoading && filteredCards.length === 0 && cardSearch.length >= 2 && (
                <p className="text-center py-6 text-sm text-muted-foreground">未找到匹配的卡牌</p>
              )}
              {cardSearch.length < 2 && (
                <p className="text-center py-6 text-sm text-muted-foreground">请输入至少2个字符搜索</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
