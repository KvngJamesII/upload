import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Gem, Send, TrendingUp, History } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User, WalletTransaction } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Wallet() {
  const [amount, setAmount] = useState("100");
  const { data: user } = useQuery<User>({ queryKey: ["/api/auth/me"] });
  const { data: transactions = [] } = useQuery<WalletTransaction[]>({
    queryKey: ["/api/wallet/transactions"],
  });
  const { toast } = useToast();

  const purchaseMutation = useMutation({
    mutationFn: async (credits: number) => {
      return apiRequest("POST", "/api/wallet/purchase", { amount: credits });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Credits purchased successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
      setAmount("100");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const packages = [
    { credits: 100, price: 9.99 },
    { credits: 500, price: 39.99 },
    { credits: 1000, price: 69.99 },
    { credits: 5000, price: 299.99 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 md:px-6">
        <div className="space-y-8">
          {/* Balance Card */}
          <Card className="bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Current Balance</p>
                  <div className="flex items-center gap-3">
                    <Gem className="h-8 w-8 text-primary" />
                    <span className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      {user?.credits ?? 0}
                    </span>
                    <span className="text-lg text-muted-foreground">Credits</span>
                  </div>
                </div>
                <TrendingUp className="h-12 w-12 text-primary/20" />
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Purchase Section */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Purchase Credits</h2>
                <div className="grid gap-3">
                  {packages.map((pkg) => (
                    <Button
                      key={pkg.credits}
                      variant="outline"
                      className="justify-between h-auto p-4 hover-elevate"
                      onClick={() => {
                        setAmount(pkg.credits.toString());
                        purchaseMutation.mutate(pkg.credits);
                      }}
                      disabled={purchaseMutation.isPending}
                      data-testid={`button-purchase-${pkg.credits}`}
                    >
                      <span>{pkg.credits} Credits</span>
                      <span className="text-primary font-semibold">${pkg.price}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Custom Amount</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Amount (credits)</label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="10"
                      step="10"
                      data-testid="input-custom-amount"
                    />
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-secondary"
                    onClick={() => purchaseMutation.mutate(parseInt(amount))}
                    disabled={purchaseMutation.isPending || !amount}
                    data-testid="button-purchase-custom"
                  >
                    {purchaseMutation.isPending ? "Processing..." : "Purchase Now"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Transaction History */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <History className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Transaction History</h2>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transactions.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      No transactions yet
                    </CardContent>
                  </Card>
                ) : (
                  transactions.map((tx) => (
                    <Card key={tx.id} data-testid={`transaction-${tx.id}`}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold capitalize">{tx.type}</p>
                            <p className="text-sm text-muted-foreground">{tx.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`font-bold text-lg ${tx.amount > 0 ? "text-green-500" : "text-red-500"}`}>
                              {tx.amount > 0 ? "+" : ""}{tx.amount}
                            </span>
                            <Badge variant="secondary" className="ml-2">
                              {tx.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Cost per Number</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">5 Credits</p>
                <p className="text-xs text-muted-foreground mt-1">Per virtual number</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Daily Bonus</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">50 Credits</p>
                <p className="text-xs text-muted-foreground mt-1">Login daily to earn</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Referral Bonus</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">50 Credits</p>
                <p className="text-xs text-muted-foreground mt-1">Per successful referral</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
