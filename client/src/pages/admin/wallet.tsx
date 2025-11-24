import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet, DollarSign } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function WalletTab() {
  const [creditPrice, setCreditPrice] = useState("1");
  const { data: stats = { totalTransactions: 0, totalPurchased: 0, creditPrice: 1 } } = useQuery<{ totalTransactions: number; totalPurchased: number; creditPrice: number }>({ 
    queryKey: ["/api/admin/wallet/stats"],
    retry: false,
  });
  const { toast } = useToast();

  const pricingMutation = useMutation({
    mutationFn: async (price: number) => {
      return apiRequest("POST", "/api/admin/wallet/pricing", { creditPrice: price });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Pricing updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wallet/stats"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update pricing", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Wallet Management</h1>
        <p className="text-muted-foreground">Manage credit pricing and transaction history</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalTransactions || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Purchased
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(stats?.totalPurchased || 0).toLocaleString()} Credits</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Price Per Credit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₦{stats?.creditPrice || 1}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Update Credit Pricing</CardTitle>
          <CardDescription>Set the Naira price per credit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Price per Credit (₦)</label>
              <Input
                type="number"
                value={creditPrice}
                onChange={(e) => setCreditPrice(e.target.value)}
                placeholder="1"
                min="0.01"
                step="0.01"
                data-testid="input-credit-price"
              />
            </div>
            <Button
              onClick={() => pricingMutation.mutate(parseFloat(creditPrice))}
              disabled={pricingMutation.isPending || !creditPrice}
              data-testid="button-update-pricing"
            >
              Update Pricing
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
