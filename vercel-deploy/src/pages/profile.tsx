import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

export default function Profile() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const copyReferralCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const referralUrl = user?.referralCode 
    ? `${window.location.origin}/signup?ref=${user.referralCode}`
    : "";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 md:px-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {user?.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold" data-testid="text-username">
                    {user?.username}
                  </h1>
                  {user?.email && (
                    <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Credits</p>
                  <p className="text-2xl font-bold font-mono" data-testid="text-credits">
                    {user?.credits ?? 0}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Successful Referrals</p>
                  <p className="text-2xl font-bold" data-testid="text-referrals">
                    {user?.successfulReferrals ?? 0}
                  </p>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="text-base font-medium">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Referral Section */}
          <Card>
            <CardHeader>
              <CardTitle>Referral Program</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Share your referral code and earn bonus credits when friends sign up!
              </p>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2">Your Referral Code</p>
                  <div className="flex gap-2">
                    <div className="flex-1 p-3 rounded-lg bg-muted font-mono text-lg font-bold text-center">
                      {user?.referralCode}
                    </div>
                    <Button
                      onClick={copyReferralCode}
                      size="icon"
                      variant="outline"
                      data-testid="button-copy-code"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Referral Link</p>
                  <div className="flex gap-2">
                    <div className="flex-1 p-3 rounded-lg bg-muted text-sm break-all">
                      {referralUrl}
                    </div>
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(referralUrl);
                        toast({
                          title: "Copied!",
                          description: "Referral link copied to clipboard",
                        });
                      }}
                      size="icon"
                      variant="outline"
                      data-testid="button-copy-link"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
