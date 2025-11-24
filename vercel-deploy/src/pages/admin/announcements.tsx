import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Announcement } from "@shared/schema";

export function AnnouncementsTab() {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: announcements } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        return await apiRequest("PUT", `/api/admin/announcements/${editingId}`, { content });
      } else {
        return await apiRequest("POST", "/api/admin/announcements", { content });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({
        title: editingId ? "Announcement updated" : "Announcement created",
        description: "Your announcement has been saved",
      });
      setContent("");
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/announcements/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({
        title: "Announcement deleted",
        description: "The announcement has been removed",
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return await apiRequest("PATCH", `/api/admin/announcements/${id}/toggle`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
    },
  });

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setContent(announcement.content);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Announcements</h2>
        <p className="text-muted-foreground">Manage announcements displayed on the homepage banner</p>
      </div>

      {/* Create/Edit Announcement */}
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Announcement" : "Create Announcement"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="announcement-content">Content</Label>
            <Textarea
              id="announcement-content"
              placeholder="Enter announcement text..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              data-testid="textarea-announcement"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !content}
              data-testid="button-save-announcement"
            >
              <Plus className="mr-2 h-4 w-4" />
              {createMutation.isPending ? "Saving..." : editingId ? "Update" : "Create"}
            </Button>
            {editingId && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setContent("");
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Announcements List */}
      <Card>
        <CardHeader>
          <CardTitle>All Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {announcements && announcements.length > 0 ? (
              announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                  data-testid={`announcement-item-${announcement.id}`}
                >
                  <div className="flex-1 mr-4">
                    <p className="text-sm">{announcement.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(announcement.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={announcement.isActive}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: announcement.id, isActive: checked })
                        }
                        data-testid={`switch-active-${announcement.id}`}
                      />
                      <Label className="text-xs">Active</Label>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(announcement)}
                      data-testid={`button-edit-${announcement.id}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate(announcement.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${announcement.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No announcements yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
