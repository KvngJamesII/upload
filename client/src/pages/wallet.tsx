import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gem, ShoppingCart, Gift, TrendingUp, History, AlertCircle } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User, WalletTransaction } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Wallet() {
  const [giftCode, setGiftCode] = useState("");
  const { data: user } = useQuery<User>({ queryKey: ["/api/auth/me"], retry: false });
  const { data: transactions = [] } = useQuery<WalletTransaction[]>({
    queryKey: ["/api/wallet/transactions"],
    enabled: !!user,
  });
  const { data: pricing } = useQuery({ queryKey: ["/api/wallet/pricing"] });
  const { toast } = useToast();

  const paystackMutation = useMutation({
    mutationFn: async (reference: string) => {
      return apiRequest("POST", "/api/wallet/verify-payment", { reference });
    },
    onSuccess: () => {
      toast({ title: "Success!", description: "Payment verified and credits added." });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Payment verification failed.", variant: "destructive" });
    },
  });

  const claimGiftMutation = useMutation({
    mutationFn: async (code: string) => {
      return apiRequest("POST", "/api/wallet/claim-giftcode", { code });
    },
    onSuccess: (data) => {
      toast({ 
        title: "Success!", 
        description: `${data.creditsAdded} credits added!` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
      setGiftCode("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Invalid or expired gift code.", 
        variant: "destructive" 
      });
    },
  });

  const handlePaystack = (amount: number) => {
    const handler = (window as any).PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_KEY,
      email: user?.email || "user@example.com",
      amount: amount * 100,
      ref: `${Date.now()}`,
      onClose: () => {
        toast({ title: "Payment cancelled" });
      },
      onSuccess: (response: any) => {
        paystackMutation.mutate(response.reference);
      },
    });
    handler.openIframe();
  };

  const creditPrice = pricing?.creditPrice || 1; // N per credit
  const packages = [
    { credits: 1000, price: 1000 * creditPrice },
    { credits: 5000, price: 5000 * creditPrice },
    { credits: 10000, price: 10000 * creditPrice },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

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
                      {user.credits}
                    </span>
                    <span className="text-lg text-muted-foreground">Credits</span>
                  </div>
                </div>
                <TrendingUp className="h-12 w-12 text-primary/20" />
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="purchase" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="purchase" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Purchase</span>
              </TabsTrigger>
              <TabsTrigger value="giftcode" className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                <span className="hidden sm:inline">Gift Code</span>
              </TabsTrigger>
            </TabsList>

            {/* Purchase Tab */}
            <TabsContent value="purchase" className="space-y-6 mt-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Buy Credits</h2>
                <p className="text-sm text-muted-foreground mb-4">1 Credit = ₦{creditPrice}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {packages.map((pkg) => (
                    <Card key={pkg.credits} className="hover-elevate cursor-pointer">
                      <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                          <div>
                            <p className="text-3xl font-bold text-primary">{pkg.credits.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Credits</p>
                          </div>
                          <div className="border-t pt-4">
                            <p className="text-2xl font-bold">₦{(pkg.price).toLocaleString()}</p>
                            <Button
                              className="w-full mt-4 bg-gradient-to-r from-primary to-secondary"
                              onClick={() => handlePaystack(pkg.price)}
                              disabled={paystackMutation.isPending}
                              data-testid={`button-buy-${pkg.credits}`}
                            >
                              Buy Now
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              <script src="https://js.paystack.co/v1/inline.js" async></script>
            </TabsContent>

            {/* Gift Code Tab */}
            <TabsContent value="giftcode" className="space-y-6 mt-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Redeem Gift Code</h2>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Gift Code</label>
                      <Input
                        placeholder="Enter your gift code"
                        value={giftCode}
                        onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                        data-testid="input-giftcode"
                      />
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-accent to-secondary"
                      onClick={() => claimGiftMutation.mutate(giftCode)}
                      disabled={claimGiftMutation.isPending || !giftCode}
                      data-testid="button-claim-giftcode"
                    >
                      {claimGiftMutation.isPending ? "Claiming..." : "Claim Gift Code"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Transaction History */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <History className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Transaction History</h2>
            </div>
            {transactions.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No transactions yet
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transactions.map((tx) => (
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
                ))}
              </div>
            )}
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Cost per Number
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">5 Credits</p>
                <p className="text-xs text-muted-foreground mt-1">Per virtual number</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Earn Credits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">50 Credits</p>
                <p className="text-xs text-muted-foreground mt-1">Daily login + per referral</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
