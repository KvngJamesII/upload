import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, History, RefreshCw, Copy, Check, MessageCircle, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Country, SmsMessage } from "@shared/schema";

export default function CountryPage() {
  const [, params] = useRoute("/country/:id");
  const countryId = params?.id;
  const { toast } = useToast();
  
  const [currentNumber, setCurrentNumber] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const [justCopied, setJustCopied] = useState(false);

  // Extract number without country code (e.g., "+12125551234" with code "+1" -> "2125551234")
  const getNumberWithoutCountryCode = (fullNumber: string, countryCode: string) => {
    // Remove the country code from the start of the number
    if (fullNumber.startsWith(countryCode)) {
      return fullNumber.substring(countryCode.length);
    }
    return fullNumber;
  };

  const copyToClipboard = (fullNumber: string) => {
    const numberOnly = getNumberWithoutCountryCode(fullNumber, country?.code || "");
    navigator.clipboard.writeText(numberOnly).then(() => {
      setJustCopied(true);
      toast({
        title: "Copied!",
        description: `Number copied: ${numberOnly}`,
      });
      setTimeout(() => setJustCopied(false), 2000);
    }).catch(() => {
      toast({
        title: "Error",
        description: "Failed to copy number",
        variant: "destructive",
      });
    });
  };

  const { data: country } = useQuery<Country>({
    queryKey: ["/api/countries", countryId],
    enabled: !!countryId,
  });

  const { data: smsMessages, refetch: refetchSms } = useQuery<SmsMessage[]>({
    queryKey: ["/api/sms", currentNumber],
    enabled: !!currentNumber,
  });

  const getNumberMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/countries/${countryId}/use-number`, {});
    },
    onSuccess: (data: { number: string }) => {
      setCurrentNumber(data.number);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/countries", countryId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to get number",
        variant: "destructive",
      });
    },
  });

  const checkSmsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/sms/check/${currentNumber}`, {});
    },
    onSuccess: (data: { newMessages: number }) => {
      if (data.newMessages > 0) {
        toast({
          title: "New SMS Received!",
          description: `${data.newMessages} new message(s) received`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        refetchSms();
      } else {
        toast({
          title: "No New SMS",
          description: "No new messages found",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error checking SMS",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Auto-refresh SMS
  useEffect(() => {
    if (autoRefresh && currentNumber) {
      const interval = setInterval(() => {
        checkSmsMutation.mutate();
      }, 10000); // Check every 10 seconds
      setRefreshInterval(interval as any);
      
      return () => clearInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [autoRefresh, currentNumber]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 md:px-6">
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="outline" size="sm" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          
          <Link href="/history">
            <Button variant="outline" size="sm" data-testid="button-history">
              <History className="mr-2 h-4 w-4" />
              History
            </Button>
          </Link>
        </div>

        {/* Country Title */}
        {country && (
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{country.name}</h1>
            <p className="text-muted-foreground font-mono">{country.code}</p>
          </div>
        )}

        {/* Number Display */}
        <div className="max-w-3xl mx-auto space-y-8">
          <Card className="overflow-hidden">
            <CardContent className="pt-8">
              {currentNumber ? (
                <div className="space-y-6">
                  {/* Number Display Card */}
                  <div className="bg-gradient-to-br from-primary/10 via-transparent to-accent/10 rounded-lg p-8 border border-primary/20">
                    <div className="text-center space-y-4">
                      <div className="flex justify-center">
                        <div className="p-3 bg-primary/10 rounded-full">
                          <Zap className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Your Virtual Number</p>
                      
                      {/* Clickable Number */}
                      <button
                        onClick={() => copyToClipboard(currentNumber)}
                        className="group relative w-full rounded-lg hover-elevate transition-all duration-200"
                        data-testid="button-copy-number"
                      >
                        <div className="p-6 rounded-lg border border-primary/30 bg-background/50 group-hover:border-primary/50">
                          <p className="font-mono text-5xl md:text-6xl font-bold text-primary mb-3" data-testid="text-phone-number">
                            {currentNumber}
                          </p>
                          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                            {justCopied ? (
                              <>
                                <Check className="w-4 h-4 text-accent" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>Click to copy (without country code)</span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      onClick={() => getNumberMutation.mutate()}
                      disabled={getNumberMutation.isPending}
                      size="lg"
                      data-testid="button-next-number"
                    >
                      {getNumberMutation.isPending ? "Loading..." : "Get Another Number"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-6 py-8">
                  <div className="flex justify-center">
                    <div className="p-4 bg-accent/10 rounded-full">
                      <Zap className="w-8 h-8 text-accent" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold mb-2">Get Your Number</h2>
                    <p className="text-muted-foreground">Receive SMS instantly on a virtual number from {country?.name}</p>
                  </div>
                  <Button
                    onClick={() => getNumberMutation.mutate()}
                    disabled={getNumberMutation.isPending}
                    size="lg"
                    className="w-full bg-gradient-to-r from-primary to-accent"
                    data-testid="button-get-number"
                  >
                    {getNumberMutation.isPending ? "Loading..." : "Get Number (Free)"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SMS Tab */}
          {currentNumber && (
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    <CardTitle>SMS Messages</CardTitle>
                  </div>
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="auto-refresh"
                        checked={autoRefresh}
                        onCheckedChange={setAutoRefresh}
                        data-testid="switch-auto-refresh"
                      />
                      <Label htmlFor="auto-refresh" className="text-sm cursor-pointer whitespace-nowrap">
                        Auto-refresh
                      </Label>
                    </div>
                    <Button
                      onClick={() => checkSmsMutation.mutate()}
                      disabled={checkSmsMutation.isPending}
                      size="sm"
                      data-testid="button-check-sms"
                    >
                      {checkSmsMutation.isPending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Check SMS
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {smsMessages && smsMessages.length > 0 ? (
                    smsMessages.map((sms) => (
                      <div
                        key={sms.id}
                        className="p-4 rounded-lg border bg-muted/30 hover-elevate transition-all space-y-3"
                        data-testid={`sms-message-${sms.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold text-sm text-foreground">From: {sms.sender}</div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(sms.receivedAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-sm leading-relaxed break-words">{sms.message}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="flex justify-center mb-4">
                        <div className="p-3 bg-muted rounded-full">
                          <MessageCircle className="w-6 h-6 text-muted-foreground" />
                        </div>
                      </div>
                      <p className="text-muted-foreground">No messages yet</p>
                      <p className="text-sm text-muted-foreground mt-1">Click "Check SMS" to fetch new messages</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
