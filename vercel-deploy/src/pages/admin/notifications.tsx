import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Notification } from "@shared/schema";

export function NotificationsTab() {
  const { toast } = useToast();
  const [notificationData, setNotificationData] = useState({
    title: "",
    message: "",
  });

  const { data: recentNotifications } = useQuery<Notification[]>({
    queryKey: ["/api/admin/notifications"],
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/notifications/broadcast", notificationData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      toast({
        title: "Notification sent",
        description: "Your broadcast has been sent to all users",
      });
      setNotificationData({ title: "", message: "" });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Notifications</h2>
        <p className="text-muted-foreground">Send notifications to all users</p>
      </div>

      {/* Send Notification */}
      <Card>
        <CardHeader>
          <CardTitle>Broadcast Notification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notification-title">Title</Label>
            <Input
              id="notification-title"
              placeholder="Notification title"
              value={notificationData.title}
              onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })}
              data-testid="input-notification-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notification-message">Message</Label>
            <Textarea
              id="notification-message"
              placeholder="Notification message..."
              value={notificationData.message}
              onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}
              rows={4}
              data-testid="textarea-notification-message"
            />
          </div>

          <Button
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending || !notificationData.title || !notificationData.message}
            data-testid="button-send-notification"
          >
            <Send className="mr-2 h-4 w-4" />
            {sendMutation.isPending ? "Sending..." : "Send to All Users"}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Broadcasts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentNotifications && recentNotifications.length > 0 ? (
              recentNotifications.slice(0, 10).map((notification) => (
                <div key={notification.id} className="p-3 border rounded-lg space-y-1">
                  <div className="font-semibold">{notification.title}</div>
                  <div className="text-sm text-muted-foreground">{notification.message}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(notification.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No notifications sent yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
