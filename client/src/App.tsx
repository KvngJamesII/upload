import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Home from "@/pages/home";
import Profile from "@/pages/profile";
import History from "@/pages/history";
import Wallet from "@/pages/wallet";
import CountryPage from "@/pages/country";
import Admin from "@/pages/admin";
import Maintenance from "@/pages/maintenance";
import type { User } from "@shared/schema";

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const { data: maintenanceMode } = useQuery<{ enabled: boolean }>({
    queryKey: ["/api/maintenance"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (user.isBanned) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Account Suspended</h1>
          <p className="text-muted-foreground">Your account has been banned. Please contact support.</p>
        </div>
      </div>
    );
  }

  if (maintenanceMode?.enabled && !user.isAdmin) {
    return <Maintenance />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/" component={Home} />
      
      {/* Protected Routes */}
      <Route path="/profile">
        {() => (
          <AuthWrapper>
            <Profile />
          </AuthWrapper>
        )}
      </Route>
      
      <Route path="/history">
        {() => (
          <AuthWrapper>
            <History />
          </AuthWrapper>
        )}
      </Route>
      
      <Route path="/wallet">
        {() => (
          <AuthWrapper>
            <Wallet />
          </AuthWrapper>
        )}
      </Route>
      
      <Route path="/country/:id">
        {() => (
          <AuthWrapper>
            <CountryPage />
          </AuthWrapper>
        )}
      </Route>
      
      {/* Admin Routes */}
      <Route path="/admin*">
        {() => (
          <AuthWrapper>
            <Admin />
          </AuthWrapper>
        )}
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
