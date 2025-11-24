import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Switch, Route } from "wouter";
import { StatisticsTab } from "./admin/statistics";
import { NumbersTab } from "./admin/numbers";
import { ApiSettingsTab } from "./admin/api-settings";
import { UsersTab } from "./admin/users";
import { ModeratorsTab } from "./admin/moderators";
import { NotificationsTab } from "./admin/notifications";
import { AnnouncementsTab } from "./admin/announcements";
import { WalletTab } from "./admin/wallet";
import { GiftCodesTab } from "./admin/giftcodes";

export default function Admin() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Switch>
              <Route path="/admin/giftcodes" component={GiftCodesTab} />
              <Route path="/admin/wallet" component={WalletTab} />
              <Route path="/admin/announcements" component={AnnouncementsTab} />
              <Route path="/admin/notifications" component={NotificationsTab} />
              <Route path="/admin/moderators" component={ModeratorsTab} />
              <Route path="/admin/users" component={UsersTab} />
              <Route path="/admin/api" component={ApiSettingsTab} />
              <Route path="/admin/numbers" component={NumbersTab} />
              <Route path="/admin" component={StatisticsTab} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
