import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ban, CheckCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

type UserWithStats = User & {
  numbersUsed: number;
};

export function UsersTab() {
  const { toast } = useToast();

  const { data: users } = useQuery<UserWithStats[]>({
    queryKey: ["/api/admin/users"],
  });

  const banMutation = useMutation({
    mutationFn: async ({ userId, ban }: { userId: string; ban: boolean }) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/ban`, { ban });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User updated",
        description: "User ban status has been changed",
      });
    },
  });

  const sortedUsers = users?.sort((a, b) => b.numbersUsed - a.numbersUsed) || [];
  const newUsers = users?.filter((u) => {
    const createdDate = new Date(u.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return createdDate > weekAgo;
  }) || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">User Management</h2>
        <p className="text-muted-foreground">View and manage platform users</p>
      </div>

      {/* New Users */}
      <Card>
        <CardHeader>
          <CardTitle>New Users (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {newUsers.length > 0 ? (
              newUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <span className="font-medium">{user.username}</span>
                    {user.isBanned && (
                      <Badge variant="destructive" className="ml-2">Banned</Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No new users this week</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Most Active Users */}
      <Card>
        <CardHeader>
          <CardTitle>Most Active Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedUsers.slice(0, 10).map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 border rounded-lg"
                data-testid={`user-item-${user.id}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{user.username}</span>
                    {user.isBanned && (
                      <Badge variant="destructive">Banned</Badge>
                    )}
                    {user.isAdmin && (
                      <Badge variant="secondary">Admin</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>Numbers used: {user.numbersUsed}</span>
                    <span>Credits: {user.credits}</span>
                    <span>Referrals: {user.successfulReferrals}</span>
                  </div>
                </div>
                <Button
                  variant={user.isBanned ? "outline" : "destructive"}
                  size="sm"
                  onClick={() => banMutation.mutate({ userId: user.id, ban: !user.isBanned })}
                  disabled={banMutation.isPending || user.isAdmin}
                  data-testid={`button-ban-${user.id}`}
                >
                  {user.isBanned ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Unban
                    </>
                  ) : (
                    <>
                      <Ban className="mr-2 h-4 w-4" />
                      Ban
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
