import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, Send, MessageCircle, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import Login from "@/pages/login";

interface ChatUser {
  id: number;
  username: string;
  avatar: string | null;
  wechatNickname: string | null;
}

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  read: boolean;
  createdAt: string;
}

interface Conversation {
  user: ChatUser;
  lastMessage: Message;
  unreadCount: number;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin}分钟前`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}小时前`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}天前`;
  return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

// Conversation list view
function ConversationList() {
  const { user, login } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/messages/conversations"],
    queryFn: async () => {
      const res = await fetch("/api/messages/conversations", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 10000, // Poll every 10s
  });

  const searchUsers = async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch { setSearchResults([]); }
  };

  if (!user) {
    return <Login onLogin={login} />;
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-20 py-3 -mx-4 px-4 border-b border-border/50">
        <Link href="/me">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="font-heading font-bold text-sm tracking-widest text-primary/80">私信</h1>
        <div className="w-8" />
      </div>

      {/* Search users */}
      <div className="relative">
        <Input
          placeholder="搜索用户名开始对话..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            searchUsers(e.target.value);
          }}
          className="h-10 pl-9"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      </div>

      {/* Search results */}
      {searchResults.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-1">搜索结果</p>
          {searchResults.map(u => (
            <Link key={u.id} href={`/chat/${u.id}`}>
              <Card className="border-border/40 hover:border-primary/30 cursor-pointer">
                <CardContent className="p-3 flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={u.avatar || undefined} />
                    <AvatarFallback>{u.username.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{u.username}</p>
                    {u.wechatNickname && <p className="text-[10px] text-muted-foreground">微信: {u.wechatNickname}</p>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Conversation list */}
      {conversations.length === 0 && searchResults.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground text-sm">暂无私信</p>
          <p className="text-xs text-muted-foreground">搜索用户名开始对话，或在社区帖子中联系卖家</p>
        </div>
      ) : (
        <div className="space-y-1">
          {conversations.map(conv => (
            <Link key={conv.user.id} href={`/chat/${conv.user.id}`}>
              <Card className="border-border/40 hover:border-primary/30 cursor-pointer transition-colors">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={conv.user.avatar || undefined} />
                      <AvatarFallback>{conv.user.username.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{conv.user.username}</p>
                      <span className="text-[10px] text-muted-foreground">{formatTime(conv.lastMessage.createdAt)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {conv.lastMessage.senderId === user?.id ? "我: " : ""}
                      {conv.lastMessage.content}
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

// Chat thread view
function ChatThread({ userId }: { userId: number }) {
  const { user, login } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages", userId],
    queryFn: async () => {
      const res = await fetch(`/api/messages/${userId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 3000, // Poll every 3s for real-time feel
  });

  // Get other user info from conversations or search
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/messages/conversations"],
    enabled: !!user,
  });

  const otherUser = conversations.find(c => c.user.id === userId)?.user;

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", "/api/messages", { receiverId: userId, content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
      setMessage("");
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = message.trim();
    if (!text) return;
    sendMutation.mutate(text);
  };

  if (!user) {
    return <Login onLogin={login} />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] -mx-4 -my-4">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-background/95 backdrop-blur">
        <Link href="/chat">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </Link>
        <Avatar className="w-8 h-8">
          <AvatarImage src={otherUser?.avatar || undefined} />
          <AvatarFallback>{otherUser?.username?.slice(0, 2) || "?"}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-bold text-sm">{otherUser?.username || `用户 #${userId}`}</p>
          {otherUser?.wechatNickname && (
            <p className="text-[10px] text-muted-foreground">微信: {otherUser.wechatNickname}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground">开始聊天吧！</p>
          </div>
        )}
        {messages.map(msg => {
          const isMine = msg.senderId === user.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                isMine
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted rounded-bl-sm"
              }`}>
                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                <p className={`text-[9px] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border/50 bg-background/95 backdrop-blur">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="输入消息..."
            className="h-10 flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            size="icon"
            className="h-10 w-10 shrink-0"
            disabled={!message.trim() || sendMutation.isPending}
            onClick={handleSend}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const [, params] = useRoute("/chat/:userId");

  if (params?.userId) {
    return <ChatThread userId={parseInt(params.userId)} />;
  }

  return <ConversationList />;
}
