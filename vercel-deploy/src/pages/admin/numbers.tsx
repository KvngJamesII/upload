import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Upload } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Country } from "@shared/schema";

export function NumbersTab() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadData, setUploadData] = useState({
    name: "",
    code: "",
    flagUrl: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: countries } = useQuery<Country[]>({
    queryKey: ["/api/countries"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/countries/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/countries"] });
      toast({
        title: "Country deleted",
        description: "The country and its numbers have been removed",
      });
    },
  });

  const handleUpload = async () => {
    if (!uploadData.name || !uploadData.code || !selectedFile) {
      toast({
        title: "Missing fields",
        description: "Please fill all fields and select a file",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      const fileContent = await selectedFile.text();
      
      await apiRequest("POST", "/api/admin/countries", {
        name: uploadData.name,
        code: uploadData.code,
        flagUrl: uploadData.flagUrl || null,
        numbersFile: fileContent,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/countries"] });
      toast({
        title: "Country added",
        description: "Numbers have been uploaded successfully",
      });

      setUploadData({ name: "", code: "", flagUrl: "" });
      setSelectedFile(null);
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Numbers Management</h2>
        <p className="text-muted-foreground">Upload and manage country number databases</p>
      </div>

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle>Upload New Country Numbers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country-name">Country Name</Label>
              <Input
                id="country-name"
                placeholder="e.g., United States"
                value={uploadData.name}
                onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                data-testid="input-country-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country-code">Country Code</Label>
              <Input
                id="country-code"
                placeholder="e.g., +1"
                value={uploadData.code}
                onChange={(e) => setUploadData({ ...uploadData, code: e.target.value })}
                data-testid="input-country-code"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="flag-url">Flag Image URL (Optional)</Label>
              <Input
                id="flag-url"
                placeholder="https://example.com/flag.png"
                value={uploadData.flagUrl}
                onChange={(e) => setUploadData({ ...uploadData, flagUrl: e.target.value })}
                data-testid="input-flag-url"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="numbers-file">Numbers File (.txt)</Label>
              <Input
                id="numbers-file"
                type="file"
                accept=".txt"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                data-testid="input-numbers-file"
              />
              <p className="text-xs text-muted-foreground">
                Upload a .txt file with one phone number per line
              </p>
            </div>
          </div>

          <Button 
            onClick={handleUpload} 
            disabled={isUploading}
            data-testid="button-upload"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload Numbers"}
          </Button>
        </CardContent>
      </Card>

      {/* Numbers List */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Countries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {countries && countries.length > 0 ? (
              countries.map((country, index) => (
                <div
                  key={country.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`country-item-${country.id}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-muted-foreground">
                        #{index + 1}
                      </span>
                      <h3 className="font-semibold">{country.name}</h3>
                      <span className="text-sm text-muted-foreground">{country.code}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {country.totalNumbers} Numbers
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Used {country.usedNumbers}/{country.totalNumbers}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate(country.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${country.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm py-8 text-center">
                No countries uploaded yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
