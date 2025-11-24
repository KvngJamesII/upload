import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Users, Globe, MessageSquare, TrendingUp } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Stats = {
  totalUsers: number;
  totalCountries: number;
  totalNumbersUsed: number;
  totalSmsReceived: number;
  maintenanceMode: boolean;
  recentUsers: Array<{ username: string; createdAt: string }>;
  mostUsedCountries: Array<{ name: string; usedCount: number }>;
};

export function StatisticsTab() {
  const { toast } = useToast();

  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/admin/stats"],
  });

  const toggleMaintenanceMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      return await apiRequest("POST", "/api/admin/maintenance", { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Maintenance mode updated",
        description: "Setting has been saved",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Statistics Dashboard</h2>
        <p className="text-muted-foreground">Overview of your platform metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-total-users">
              {stats?.totalUsers ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-countries">
              {stats?.totalCountries ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Numbers Used</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-numbers-used">
              {stats?.totalNumbersUsed ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMS Received</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-sms-received">
              {stats?.totalSmsReceived ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Mode */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="maintenance" className="text-base font-medium">
                Enable Maintenance Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                When enabled, all users except admins will see a maintenance page
              </p>
            </div>
            <Switch
              id="maintenance"
              checked={stats?.maintenanceMode ?? false}
              onCheckedChange={toggleMaintenanceMutation.mutate}
              data-testid="switch-maintenance"
            />
          </div>
        </CardContent>
      </Card>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.recentUsers && stats.recentUsers.length > 0 ? (
              stats.recentUsers.map((user, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="font-medium">{user.username}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No recent users</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Most Used Countries */}
      <Card>
        <CardHeader>
          <CardTitle>Most Used Countries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.mostUsedCountries && stats.mostUsedCountries.length > 0 ? (
              stats.mostUsedCountries.map((country, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="font-medium">{country.name}</span>
                  <span className="text-sm font-mono">{country.usedCount} uses</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No usage data</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
