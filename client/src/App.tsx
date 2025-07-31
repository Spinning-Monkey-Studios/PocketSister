import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Home from "@/pages/home";
import Landing from "@/pages/landing";
import Subscribe from "@/pages/subscribe";
import CompanionSetup from "@/pages/companion-setup";
import AdminPortal from "@/pages/admin-portal";
import ChatPage from "@/pages/chat";
import ParentPortal from "@/pages/parent-portal";
import AvatarCreator from "@/pages/avatar-creator";
import NotFound from "@/pages/not-found";
import TestDashboard from "@/pages/test-dashboard";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/subscribe" component={Subscribe} />
          <Route path="/setup" component={CompanionSetup} />
          <Route path="/admin" component={AdminPortal} />
          <Route path="/chat" component={ChatPage} />
          <Route path="/parent-portal" component={ParentPortal} />
          <Route path="/avatar" component={AvatarCreator} />
        </>
      )}
      <Route path="/test" component={TestDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
