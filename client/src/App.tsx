import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { GameProvider, useGame, GAMES } from "@/hooks/use-game";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Library from "@/pages/library";
import Community from "@/pages/community";
import Me from "@/pages/me";
import CardDetail from "@/pages/card-detail";
import FaBCardDetail from "@/pages/fab-card-detail";
import PriceLists from "@/pages/price-lists";
import CardHistoryPage from "@/pages/card-history-page";
import CreatePost from "@/pages/create-post";
import Login from "@/pages/login";
import Chat from "@/pages/chat";
import { Home as HomeIcon, Search, Users, User, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

function GameSelector() {
  const { game, gameInfo, setGame } = useGame();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/20 bg-card/50 hover:bg-primary/5 transition-colors"
      >
        <span className="text-xs font-bold text-primary tracking-wider">{gameInfo.icon}</span>
        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-background border border-border rounded-xl shadow-xl z-50 min-w-[180px] overflow-hidden">
          {GAMES.map(g => (
            <button
              key={g.key}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                game === g.key ? "bg-primary/10" : "hover:bg-muted/50"
              }`}
              onClick={() => { setGame(g.key); setOpen(false); }}
            >
              <span className={`text-xs font-bold tracking-wider min-w-[30px] ${game === g.key ? "text-primary" : "text-muted-foreground"}`}>
                {g.icon}
              </span>
              <div>
                <p className={`text-sm font-medium ${game === g.key ? "text-primary" : ""}`}>{g.nameCn}</p>
                <p className="text-[10px] text-muted-foreground">{g.name}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  const getLinkClass = (path: string) => {
    return `flex flex-col items-center justify-center w-full h-full space-y-1 ${
      isActive(path) ? "text-primary" : "text-muted-foreground"
    }`;
  };

  const hideTabBar = location.startsWith("/card/") || location.startsWith("/fab/") || location === "/price-lists" || location === "/history" || location === "/create-post" || location.startsWith("/chat");

  return (
    <div className="min-h-screen bg-background font-sans pb-20 max-w-[500px] mx-auto shadow-2xl relative overflow-x-hidden border-x border-border/50">
      <header className="sticky top-0 left-0 right-0 h-16 bg-background/95 backdrop-blur border-b border-border z-50 flex items-center px-4 justify-between">
        <GameSelector />
        <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 rounded-full px-3 py-1 border border-border/50">
          <div className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
          <div className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
          <div className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
          <div className="w-px h-3 bg-border mx-1" />
          <div className="w-3.5 h-3.5 rounded-full border-2 border-foreground/30" />
        </div>
      </header>

      <main className="px-4 py-4">
        {children}
      </main>

      {!hideTabBar && (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur border-t border-border z-50 max-w-[500px] mx-auto border-x">
          <div className="flex justify-around items-center h-full">
            <Link href="/" className={getLinkClass("/")}>
              <HomeIcon size={22} strokeWidth={isActive("/") ? 2.5 : 2} />
              <span className="text-[10px] font-medium">发现</span>
            </Link>
            <Link href="/library" className={getLinkClass("/library")}>
              <Search size={22} strokeWidth={isActive("/library") ? 2.5 : 2} />
              <span className="text-[10px] font-medium">卡库</span>
            </Link>
            <Link href="/community" className={getLinkClass("/community")}>
              <Users size={22} strokeWidth={isActive("/community") ? 2.5 : 2} />
              <span className="text-[10px] font-medium">社区</span>
            </Link>
            <Link href="/me" className={getLinkClass("/me")}>
              <User size={22} strokeWidth={isActive("/me") ? 2.5 : 2} />
              <span className="text-[10px] font-medium">我的</span>
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/library" component={Library} />
        <Route path="/community" component={Community} />
        <Route path="/me" component={Me} />
        <Route path="/card/:id" component={CardDetail} />
        <Route path="/fab/:identifier" component={FaBCardDetail} />
        <Route path="/price-lists" component={PriceLists} />
        <Route path="/history" component={CardHistoryPage} />
        <Route path="/create-post" component={CreatePost} />
        <Route path="/chat" component={Chat} />
        <Route path="/chat/:userId" component={Chat} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GameProvider>
          <Toaster />
          <Router />
        </GameProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
