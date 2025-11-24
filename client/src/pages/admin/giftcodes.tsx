import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Gift, Trash2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function GiftCodesTab() {
  const [formData, setFormData] = useState({
    code: "",
    creditsAmount: "100",
    maxClaims: "10",
    expiryDate: "",
  });

  const { data: giftcodes = [] } = useQuery({ queryKey: ["/api/admin/giftcodes"] });
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/admin/giftcodes", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Gift code created!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/giftcodes"] });
      setFormData({ code: "", creditsAmount: "100", maxClaims: "10", expiryDate: "" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create gift code", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/giftcodes/${id}`, {});
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Gift code deleted!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/giftcodes"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete gift code", variant: "destructive" });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.expiryDate) {
      toast({ title: "Error", description: "All fields required", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      ...formData,
      creditsAmount: parseInt(formData.creditsAmount),
      maxClaims: parseInt(formData.maxClaims),
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gift Code Management</h1>
        <p className="text-muted-foreground">Create and manage gift codes for users</p>
      </div>

      {/* Create Gift Code Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Create New Gift Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Code</label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., WELCOME100"
                  data-testid="input-giftcode-code"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Credits Amount</label>
                <Input
                  type="number"
                  value={formData.creditsAmount}
                  onChange={(e) => setFormData({ ...formData, creditsAmount: e.target.value })}
                  min="1"
                  data-testid="input-giftcode-amount"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Max Claims</label>
                <Input
                  type="number"
                  value={formData.maxClaims}
                  onChange={(e) => setFormData({ ...formData, maxClaims: e.target.value })}
                  min="1"
                  data-testid="input-giftcode-maxclaims"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Expiry Date</label>
                <Input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  data-testid="input-giftcode-expiry"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-gradient-to-r from-primary to-secondary"
              data-testid="button-create-giftcode"
            >
              {createMutation.isPending ? "Creating..." : "Create Gift Code"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Gift Codes List */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Active Gift Codes</h2>
        {giftcodes.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No gift codes created yet
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {giftcodes.map((gift: any) => (
              <Card key={gift.id} data-testid={`giftcode-${gift.id}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-lg font-bold font-mono">{gift.code}</code>
                        <Badge variant={gift.isActive ? "default" : "secondary"}>
                          {gift.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Credits</p>
                          <p className="font-semibold">{gift.creditsAmount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Claims</p>
                          <p className="font-semibold">{gift.claimedCount} / {gift.maxClaims}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Expires</p>
                          <p className="font-semibold">{new Date(gift.expiryDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => deleteMutation.mutate(gift.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-giftcode-${gift.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
