import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Globe, Smartphone, Zap } from "lucide-react";
import { Link } from "wouter";
import type { Country } from "@shared/schema";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const { data: countries, isLoading } = useQuery<Country[]>({
    queryKey: ["/api/countries"],
  });

  const filteredCountries = countries
    ?.filter((country) =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.code.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "most-used":
          return b.usedNumbers - a.usedNumbers;
        case "most-available":
          return (b.totalNumbers - b.usedNumbers) - (a.totalNumbers - a.usedNumbers);
        default:
          return 0;
      }
    }) || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <AnnouncementBanner />

      {/* Hero Section */}
      <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDEzNGg3MjB2NzIwSDM2eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
        <div className="container relative mx-auto px-4 py-12 md:py-16 text-center">
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Live Virtual Numbers Available
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Get Virtual Phone Numbers
              <span className="block bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                For SMS Verification
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Access temporary phone numbers from multiple countries. Perfect for OTP verification, SMS testing, and privacy protection.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-5 w-5 text-primary" />
                <span className="font-semibold">{countries?.length || 0}+</span>
                <span className="text-muted-foreground">Countries</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Smartphone className="h-5 w-5 text-primary" />
                <span className="font-semibold">{countries?.reduce((sum, c) => sum + (c.totalNumbers - c.usedNumbers), 0) || 0}+</span>
                <span className="text-muted-foreground">Numbers Available</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-5 w-5 text-primary" />
                <span className="font-semibold">Instant</span>
                <span className="text-muted-foreground">Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 md:px-6">
        {/* Search and Filter */}
        <div className="mb-8 max-w-2xl mx-auto space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search countries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]" data-testid="select-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="most-used">Most Used</SelectItem>
                <SelectItem value="most-available">Most Available</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Country Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="aspect-[4/3] animate-pulse bg-muted" />
            ))}
          </div>
        ) : filteredCountries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No countries available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="countries-grid">
            {filteredCountries.map((country) => (
              <Link key={country.id} href={`/country/${country.id}`}>
                <Card 
                  className="group relative aspect-[4/3] overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover-elevate border-2"
                  data-testid={`card-country-${country.id}`}
                >
                  {/* Animated gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20"></div>
                  
                  {/* Blurred flag background */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center blur-sm scale-110 opacity-40 group-hover:opacity-60 transition-opacity"
                    style={{
                      backgroundImage: country.flagUrl 
                        ? `url(${country.flagUrl})` 
                        : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 50%, hsl(var(--secondary)) 100%)',
                    }}
                  />
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/80 group-hover:from-black/60 group-hover:via-black/50 group-hover:to-black/70 transition-all" />

                  {/* Decorative elements */}
                  <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-white/10 blur-2xl"></div>
                  <div className="absolute bottom-4 left-4 w-20 h-20 rounded-full bg-primary/20 blur-2xl"></div>

                  {/* Content */}
                  <div className="relative h-full flex flex-col items-center justify-center text-center p-6 text-white">
                    <div className="mb-4 group-hover:scale-110 transition-transform">
                      {country.flagUrl ? (
                        <Globe className="h-12 w-12 text-primary" />
                      ) : (
                        <Smartphone className="h-12 w-12 text-primary" />
                      )}
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold mb-2 drop-shadow-lg group-hover:text-primary transition-colors">
                      {country.name}
                    </h3>
                    <p className="text-sm font-mono mb-4 opacity-90 bg-black/30 px-3 py-1 rounded-full">
                      {country.code}
                    </p>
                    <div className="mt-auto space-y-2">
                      <div className="flex items-center gap-2 justify-center">
                        <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                          {country.totalNumbers - country.usedNumbers}
                        </span>
                        <span className="text-sm opacity-75">/ {country.totalNumbers}</span>
                      </div>
                      <p className="text-xs font-medium bg-primary/20 px-3 py-1 rounded-full backdrop-blur-sm">
                        Numbers Available
                      </p>
                    </div>
                  </div>

                  {/* Hover effect border */}
                  <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-primary via-accent to-secondary p-[2px]">
                    <div className="h-full w-full rounded-lg bg-black/90"></div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
