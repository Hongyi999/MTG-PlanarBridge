import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Library from "@/pages/library";
import Community from "@/pages/community";
import Me from "@/pages/me";
import CardDetail from "@/pages/card-detail";
import PriceLists from "@/pages/price-lists";
import CardHistoryPage from "@/pages/card-history-page";
import CreatePost from "@/pages/create-post";
import { Home as HomeIcon, Search, Users, User } from "lucide-react";

function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  const getLinkClass = (path: string) => {
    return `flex flex-col items-center justify-center w-full h-full space-y-1 ${
      isActive(path) ? "text-primary" : "text-muted-foreground"
    }`;
  };

  const hideTabBar = location.startsWith("/card/") || location === "/price-lists" || location === "/history" || location === "/create-post";

  return (
    <div className="min-h-screen bg-background font-sans pb-20 max-w-[500px] mx-auto shadow-2xl relative overflow-x-hidden border-x border-border/50">
      <header className="sticky top-0 left-0 right-0 h-16 bg-background/95 backdrop-blur border-b border-border z-50 flex items-center px-4 justify-end">
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
        <Route path="/price-lists" component={PriceLists} />
        <Route path="/history" component={CardHistoryPage} />
        <Route path="/create-post" component={CreatePost} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}

export default App;
