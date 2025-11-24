import { Bell, User, Smartphone, Gem, Wallet, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "./theme-toggle";
import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { User as UserType, Notification } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function Header() {
  const [, setLocation] = useLocation();
  const { data: user } = useQuery<UserType>({ 
    queryKey: ["/api/auth/me"],
    retry: false,
  });
  const { data: notifications } = useQuery<Notification[]>({ 
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest("POST", `/api/notifications/${notificationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setLocation("/login");
    },
  });

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left: Profile and Notifications - Only shown when logged in */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="button-profile">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" data-testid="link-profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/history" data-testid="link-history">
                      History
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-80">
                  {notifications && notifications.length > 0 ? (
                    notifications.slice(0, 5).map((notification) => (
                      <DropdownMenuItem 
                        key={notification.id} 
                        className="flex flex-col items-start gap-1 py-3 cursor-pointer"
                        onClick={() => handleNotificationClick(notification)}
                        data-testid={`notification-item-${notification.id}`}
                      >
                        <div className="font-semibold text-sm">{notification.title}</div>
                        <div className="text-xs text-muted-foreground">{notification.message}</div>
                        {!notification.isRead && (
                          <div className="mt-1 h-2 w-2 rounded-full bg-destructive" data-testid={`notification-unread-indicator-${notification.id}`}></div>
                        )}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>No notifications</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/login">
              <Button variant="ghost" data-testid="button-login">
                Login
              </Button>
            </Link>
          )}
        </div>

        {/* Center: Logo */}
        <Link href="/" className="flex items-center gap-2" data-testid="link-home">
          <div className="relative flex items-center gap-2">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary blur-lg opacity-30"></div>
            <Smartphone className="relative h-6 w-6 text-primary" />
            <h1 className="relative text-2xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              OTP King
            </h1>
          </div>
        </Link>

        {/* Right: Credits/SignUp and Theme Toggle */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {user.isModerator && (
                <Link href="/mod">
                  <Button variant="ghost" size="icon" className="relative" data-testid="button-mod-dashboard">
                    <Shield className="h-5 w-5 text-primary" />
                  </Button>
                </Link>
              )}
              <Link href="/wallet">
                <Badge 
                  variant="secondary" 
                  className="px-4 py-2 font-mono text-sm font-semibold bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 flex items-center gap-1.5 cursor-pointer hover-elevate"
                  data-testid="badge-credits"
                >
                  <Gem className="h-3.5 w-3.5" />
                  {user.credits ?? 0} Credits
                </Badge>
              </Link>
              <Link href="/wallet">
                <Button variant="ghost" size="icon" className="relative" data-testid="button-wallet">
                  <Wallet className="h-5 w-5" />
                </Button>
              </Link>
            </>
          ) : (
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90" data-testid="button-signup">
                Sign Up
              </Button>
            </Link>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
