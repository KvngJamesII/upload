import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Upload } from "lucide-react";
import type { User } from "@shared/schema";
import { NumbersTab } from "@/pages/admin/numbers";
import { StatisticsTab } from "@/pages/admin/statistics";

export default function ModDashboard() {
  const { data: user } = useQuery<User>({ queryKey: ["/api/auth/me"], retry: false });

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

  if (!user.isModerator && !user.isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-muted-foreground">You don't have moderator access.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 md:px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Moderator Dashboard
          </h1>
          <p className="text-muted-foreground">Manage phone numbers and view statistics</p>
        </div>

        <Tabs defaultValue="numbers" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="numbers" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload Numbers</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              <span className="hidden sm:inline">Statistics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="numbers" className="mt-6">
            <NumbersTab />
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
            <StatisticsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
