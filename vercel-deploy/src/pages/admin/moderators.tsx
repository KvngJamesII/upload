import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, X, Search } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

type UserWithStats = User & {
  numbersUsed: number;
};

export function ModeratorsTab() {
  const [username, setUsername] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: users } = useQuery<UserWithStats[]>({
    queryKey: ["/api/admin/users"],
  });

  const makeModeratorMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/moderator`, { isModerator: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setUsername("");
      toast({
        title: "Success",
        description: "User has been made a moderator",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to make user a moderator",
        variant: "destructive",
      });
    },
  });

  const removeModeratorMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/moderator`, { isModerator: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "Moderator status has been removed",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove moderator status",
        variant: "destructive",
      });
    },
  });

  const handleMakeModerator = () => {
    const targetUser = users?.find((u) => u.username === username);
    if (!targetUser) {
      toast({
        title: "Error",
        description: "User not found",
        variant: "destructive",
      });
      return;
    }
    makeModeratorMutation.mutate(targetUser.id);
  };

  const moderators = users?.filter((u) => u.isModerator) || [];
  const filteredModerators = moderators.filter((m) =>
    m.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Moderator Management</h2>
        <p className="text-muted-foreground">Make users moderators or remove their access</p>
      </div>

      {/* Add Moderator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Make User a Moderator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              data-testid="input-moderator-username"
              onKeyDown={(e) => e.key === "Enter" && handleMakeModerator()}
            />
            <Button
              onClick={handleMakeModerator}
              disabled={makeModeratorMutation.isPending || !username}
              className="bg-gradient-to-r from-primary to-secondary"
              data-testid="button-make-moderator"
            >
              {makeModeratorMutation.isPending ? "Adding..." : "Make Moderator"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Moderators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Moderators ({moderators.length})</span>
            <div className="w-64">
              <Input
                placeholder="Search moderators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9"
                data-testid="input-moderator-search"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredModerators.length === 0 ? (
            <p className="text-muted-foreground text-sm">No moderators found</p>
          ) : (
            <div className="space-y-3">
              {filteredModerators.map((moderator) => (
                <div
                  key={moderator.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                  data-testid={`moderator-item-${moderator.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{moderator.username}</span>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Moderator
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>Numbers used: {moderator.numbersUsed}</span>
                      <span>Credits: {moderator.credits}</span>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeModeratorMutation.mutate(moderator.id)}
                    disabled={removeModeratorMutation.isPending}
                    data-testid={`button-remove-moderator-${moderator.id}`}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
