import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, History, RefreshCw } from "lucide-react";
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
      return await apiRequest("POST", `/api/countries/${countryId}/use-number`, {}) as Promise<{ number: string }>;
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
      return await apiRequest("POST", `/api/sms/check/${currentNumber}`, {}) as Promise<{ newMessages: number }>;
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
          <Card>
            <CardContent className="pt-8">
              {currentNumber ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Your Number</p>
                    <p className="text-4xl md:text-5xl font-mono font-bold" data-testid="text-phone-number">
                      {currentNumber}
                    </p>
                  </div>

                  <Button
                    onClick={() => getNumberMutation.mutate()}
                    disabled={getNumberMutation.isPending}
                    className="w-full"
                    data-testid="button-next-number"
                  >
                    {getNumberMutation.isPending ? "Loading..." : "Next Number"}
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">Click to get a number from {country?.name}</p>
                  <Button
                    onClick={() => getNumberMutation.mutate()}
                    disabled={getNumberMutation.isPending}
                    size="lg"
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
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>SMS Messages</CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="auto-refresh"
                        checked={autoRefresh}
                        onCheckedChange={setAutoRefresh}
                        data-testid="switch-auto-refresh"
                      />
                      <Label htmlFor="auto-refresh" className="text-sm cursor-pointer">
                        Auto-refresh (10s)
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
                          Check New SMS
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {smsMessages && smsMessages.length > 0 ? (
                    smsMessages.map((sms) => (
                      <div
                        key={sms.id}
                        className="p-4 rounded-lg border space-y-2"
                        data-testid={`sms-message-${sms.id}`}
                      >
                        <div className="font-semibold text-sm">From: {sms.sender}</div>
                        <div className="text-sm">{sms.message}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(sms.receivedAt).toLocaleString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No messages yet. Click "Check New SMS" to fetch messages.
                    </p>
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
