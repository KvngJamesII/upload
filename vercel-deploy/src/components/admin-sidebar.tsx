import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { BarChart3, Globe, Settings, Users, Bell, Megaphone, Wallet, Gift, Shield } from "lucide-react";
import { useLocation } from "wouter";

const menuItems = [
  {
    title: "Statistics",
    icon: BarChart3,
    path: "/admin",
  },
  {
    title: "Numbers",
    icon: Globe,
    path: "/admin/numbers",
  },
  {
    title: "API Settings",
    icon: Settings,
    path: "/admin/api",
  },
  {
    title: "Users",
    icon: Users,
    path: "/admin/users",
  },
  {
    title: "Moderators",
    icon: Shield,
    path: "/admin/moderators",
  },
  {
    title: "Notifications",
    icon: Bell,
    path: "/admin/notifications",
  },
  {
    title: "Announcements",
    icon: Megaphone,
    path: "/admin/announcements",
  },
  {
    title: "Wallet & Pricing",
    icon: Wallet,
    path: "/admin/wallet",
  },
  {
    title: "Gift Codes",
    icon: Gift,
    path: "/admin/giftcodes",
  },
];

export function AdminSidebar() {
  const [location, setLocation] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
          Admin Panel
        </h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    onClick={() => setLocation(item.path)}
                    isActive={location === item.path}
                    data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
