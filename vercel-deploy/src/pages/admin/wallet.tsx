import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet, DollarSign, Plus, Trash2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PricingTier {
  credits: number;
  naira: number;
  id: string; // Temporary ID for UI
}

export function WalletTab() {
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([
    { credits: 100, naira: 100, id: "1" },
    { credits: 500, naira: 450, id: "2" },
    { credits: 1000, naira: 800, id: "3" },
  ]);
  const { data: stats = { totalTransactions: 0, totalPurchased: 0 } } = useQuery<{ totalTransactions: number; totalPurchased: number }>({ 
    queryKey: ["/api/admin/wallet/stats"],
    retry: false,
  });
  const { toast } = useToast();

  const pricingMutation = useMutation({
    mutationFn: async (tiers: PricingTier[]) => {
      return apiRequest("POST", "/api/admin/wallet/pricing", { pricingTiers: tiers });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Pricing tiers updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wallet/stats"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update pricing", variant: "destructive" });
    },
  });

  const handleAddTier = () => {
    const newId = Date.now().toString();
    setPricingTiers([...pricingTiers, { credits: 0, naira: 0, id: newId }]);
  };

  const handleRemoveTier = (id: string) => {
    if (pricingTiers.length > 1) {
      setPricingTiers(pricingTiers.filter(tier => tier.id !== id));
    } else {
      toast({ title: "Error", description: "You must have at least one pricing tier", variant: "destructive" });
    }
  };

  const handleTierChange = (id: string, field: 'credits' | 'naira', value: string) => {
    setPricingTiers(pricingTiers.map(tier =>
      tier.id === id
        ? { ...tier, [field]: parseInt(value) || 0 }
        : tier
    ));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Wallet Management</h1>
        <p className="text-muted-foreground">Manage credit pricing and transaction history</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              Total Credits Purchased
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(stats?.totalPurchased || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Tiers */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Tiers</CardTitle>
          <CardDescription>Set custom pricing for different credit amounts (e.g., 100 credits for ₦100)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {pricingTiers.map((tier, index) => (
              <div key={tier.id} className="flex items-end gap-3 p-4 border rounded-lg bg-muted/30">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Credits</label>
                  <Input
                    type="number"
                    value={tier.credits}
                    onChange={(e) => handleTierChange(tier.id, 'credits', e.target.value)}
                    placeholder="100"
                    min="1"
                    data-testid={`input-tier-credits-${index}`}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Naira (₦)</label>
                  <Input
                    type="number"
                    value={tier.naira}
                    onChange={(e) => handleTierChange(tier.id, 'naira', e.target.value)}
                    placeholder="100"
                    min="1"
                    data-testid={`input-tier-naira-${index}`}
                  />
                </div>
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                  {tier.credits > 0 ? `₦${(tier.naira / tier.credits).toFixed(2)}/credit` : '-'}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveTier(tier.id)}
                  disabled={pricingTiers.length === 1}
                  data-testid={`button-remove-tier-${index}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleAddTier}
              className="w-full"
              data-testid="button-add-tier"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Pricing Tier
            </Button>
            <Button
              onClick={() => pricingMutation.mutate(pricingTiers)}
              disabled={pricingMutation.isPending || pricingTiers.some(t => !t.credits || !t.naira)}
              data-testid="button-save-pricing"
            >
              {pricingMutation.isPending ? "Saving..." : "Save Tiers"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
