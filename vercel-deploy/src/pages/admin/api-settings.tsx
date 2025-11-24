import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function ApiSettingsTab() {
  const { toast } = useToast();
  const [apiToken, setApiToken] = useState("");

  const { data: currentToken } = useQuery<{ value: string }>({
    queryKey: ["/api/admin/settings/sms-api-token"],
    onSuccess: (data) => {
      if (data?.value) {
        setApiToken(data.value);
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/settings/sms-api-token", {
        token: apiToken,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/sms-api-token"] });
      toast({
        title: "API token saved",
        description: "Your SMS panel API token has been updated",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">API Settings</h2>
        <p className="text-muted-foreground">Configure external API integrations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SMS Panel API Token</CardTitle>
          <CardDescription>
            Configure the API token for SMS message retrieval from your panel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-token">API Token</Label>
            <Input
              id="api-token"
              type="password"
              placeholder="Enter your SMS panel API token"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              data-testid="input-api-token"
            />
            <p className="text-xs text-muted-foreground">
              This token will be used to authenticate requests to your SMS panel API
            </p>
          </div>

          <div className="space-y-2">
            <Label>API Endpoint</Label>
            <div className="p-3 rounded-lg bg-muted font-mono text-sm break-all">
              http://51.77.216.195/crapi/dgroup/viewstats
            </div>
          </div>

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !apiToken}
            data-testid="button-save-token"
          >
            <Save className="mr-2 h-4 w-4" />
            {saveMutation.isPending ? "Saving..." : "Save Token"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Request Parameters:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li><code className="font-mono">token</code> - Your API token (configured above)</li>
              <li><code className="font-mono">filternum</code> - Phone number to query</li>
              <li><code className="font-mono">records</code> - Number of records to fetch (max 200)</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Response Format:</h4>
            <div className="p-3 rounded-lg bg-muted font-mono text-xs overflow-x-auto">
              {`{
  "status": "success",
  "total": 1,
  "data": [
    {
      "dt": "2025-03-16 21:38:27",
      "num": "84966570308",
      "cli": "msverify",
      "message": "Your code is 123456",
      "payout": "0.01"
    }
  ]
}`}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
