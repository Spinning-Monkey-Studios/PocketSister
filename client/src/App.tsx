import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { useAuth } from "./hooks/useAuth";
import Home from "./pages/home";
import Landing from "./pages/landing";
import Subscribe from "./pages/subscribe";
import CompanionSetup from "./pages/companion-setup";
import AdminPortal from "./pages/admin-portal";
import AdminLogin from "./pages/admin-login";
import AdminNewLogin from "./pages/admin-new-login";
import AdminResetPassword from "./pages/admin-reset-password";
import AdminUsageMetrics from "./pages/admin-usage-metrics";
import AdminGpsTracking from "./pages/admin-gps-tracking";
import AdminOfflineMessages from "./pages/admin-offline-messages";
import ChatPage from "./pages/chat";
import ParentPortal from "./pages/parent-portal";
import ParentDashboard from "./pages/parent-dashboard";
import MobileDeviceTest from "./pages/mobile-device-test";
import AvatarCreator from "./pages/avatar-creator";
import NotFound from "./pages/not-found";
import TestDashboard from "./pages/test-dashboard";
import UpgradePage from "./pages/UpgradePage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProtectedRoute from "./components/admin-protected-route";
import { Support } from "./pages/support";
import OfflineHandler, { ApiErrorHandler, useOnlineStatus } from "./components/offline-handler";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const isOnline = useOnlineStatus();

  return (
    <ApiErrorHandler>
      <OfflineHandler isOnline={isOnline} />
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
          <Route path="/parent-dashboard" component={ParentDashboard} />
          <Route path="/avatar" component={AvatarCreator} />
          <Route path="/upgrade" component={UpgradePage} />
          <Route path="/support" component={Support} />
        </>
      )}
      <Route path="/test" component={TestDashboard} />
      <Route path="/test-mobile" component={MobileDeviceTest} />
      <Route path="/test-parent-portal" component={ParentPortal} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/admin-new-login" component={AdminNewLogin} />
      <Route path="/admin-reset-password" component={AdminResetPassword} />
      <Route path="/admin-portal" component={AdminPortal} />
      <Route path="/admin-dashboard">
        <AdminProtectedRoute>
          <AdminDashboard />
        </AdminProtectedRoute>
      </Route>
      <Route path="/admin-usage-metrics">
        <AdminProtectedRoute>
          <AdminUsageMetrics />
        </AdminProtectedRoute>
      </Route>
      <Route path="/admin-gps-tracking">
        <AdminProtectedRoute>
          <AdminGpsTracking />
        </AdminProtectedRoute>
      </Route>
      <Route path="/admin-offline-messages">
        <AdminProtectedRoute>
          <AdminOfflineMessages />
        </AdminProtectedRoute>
      </Route>
      <Route component={NotFound} />
      </Switch>
    </ApiErrorHandler>
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
