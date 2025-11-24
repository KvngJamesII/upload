import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import type { NumberHistory } from "@shared/schema";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type HistoryWithCountry = NumberHistory & {
  country: {
    name: string;
    code: string;
    id: string;
  };
};

export default function History() {
  const { data: history, isLoading } = useQuery<HistoryWithCountry[]>({
    queryKey: ["/api/history"],
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 md:px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" data-testid="button-back">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Number History</h1>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-16 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : history && history.length > 0 ? (
            <div className="space-y-4">
              {history.map((item) => (
                <Link key={item.id} href={`/country/${item.country.id}`}>
                  <Card className="hover-elevate cursor-pointer transition-all" data-testid={`history-item-${item.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{item.country.name}</h3>
                            <span className="text-sm text-muted-foreground font-mono">
                              {item.country.code}
                            </span>
                          </div>
                          <p className="font-mono text-xl font-bold" data-testid={`number-${item.id}`}>
                            {item.phoneNumber}
                          </p>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          {new Date(item.usedAt).toLocaleDateString()}
                          <br />
                          {new Date(item.usedAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No number history yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Numbers you use will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
