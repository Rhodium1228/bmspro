import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function QuotationSettings() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [selectedFont, setSelectedFont] = useState("inter");
  const [headerText, setHeaderText] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#1D8FCC");
  const [secondaryColor, setSecondaryColor] = useState("#0B1E3D");

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
      toast({
        title: "Logo uploaded",
        description: "Your logo has been uploaded successfully.",
      });
    }
  };

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your quotation settings have been saved successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-8 w-8 text-primary" />
          Quotation Settings
        </h1>
        <p className="text-muted-foreground">Customize your quotation PDF preview</p>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="fonts">Fonts</TabsTrigger>
          <TabsTrigger value="header">Header</TabsTrigger>
          <TabsTrigger value="logo">Logo</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>PDF Templates</CardTitle>
              <CardDescription>Choose a template for your quotation PDFs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card 
                  className={`cursor-pointer transition-all ${selectedTemplate === "modern" ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSelectedTemplate("modern")}
                >
                  <CardContent className="p-6">
                    <div className="aspect-[3/4] bg-gradient-to-br from-primary/10 to-primary/5 rounded-md mb-3 flex items-center justify-center">
                      <span className="text-muted-foreground">Modern</span>
                    </div>
                    <h3 className="font-semibold">Modern Template</h3>
                    <p className="text-sm text-muted-foreground">Clean and professional design</p>
                  </CardContent>
                </Card>

                <Card 
                  className={`cursor-pointer transition-all ${selectedTemplate === "classic" ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSelectedTemplate("classic")}
                >
                  <CardContent className="p-6">
                    <div className="aspect-[3/4] bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-md mb-3 flex items-center justify-center">
                      <span className="text-muted-foreground">Classic</span>
                    </div>
                    <h3 className="font-semibold">Classic Template</h3>
                    <p className="text-sm text-muted-foreground">Traditional business layout</p>
                  </CardContent>
                </Card>

                <Card 
                  className={`cursor-pointer transition-all ${selectedTemplate === "minimal" ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSelectedTemplate("minimal")}
                >
                  <CardContent className="p-6">
                    <div className="aspect-[3/4] bg-gradient-to-br from-muted/50 to-muted/20 rounded-md mb-3 flex items-center justify-center">
                      <span className="text-muted-foreground">Minimal</span>
                    </div>
                    <h3 className="font-semibold">Minimal Template</h3>
                    <p className="text-sm text-muted-foreground">Simple and elegant style</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fonts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Font Selection</CardTitle>
              <CardDescription>Choose fonts for your quotation documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="heading-font">Heading Font</Label>
                <Select value={selectedFont} onValueChange={setSelectedFont}>
                  <SelectTrigger id="heading-font">
                    <SelectValue placeholder="Select heading font" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inter">Inter</SelectItem>
                    <SelectItem value="roboto">Roboto</SelectItem>
                    <SelectItem value="opensans">Open Sans</SelectItem>
                    <SelectItem value="lato">Lato</SelectItem>
                    <SelectItem value="montserrat">Montserrat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="body-font">Body Font</Label>
                <Select defaultValue="inter">
                  <SelectTrigger id="body-font">
                    <SelectValue placeholder="Select body font" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inter">Inter</SelectItem>
                    <SelectItem value="roboto">Roboto</SelectItem>
                    <SelectItem value="opensans">Open Sans</SelectItem>
                    <SelectItem value="lato">Lato</SelectItem>
                    <SelectItem value="arial">Arial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="header" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Header Customization</CardTitle>
              <CardDescription>Customize the header section of your quotations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input 
                  id="company-name" 
                  placeholder="Enter company name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="header-text">Header Text</Label>
                <Textarea 
                  id="header-text"
                  placeholder="Enter header text or tagline"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="footer-text">Footer Text</Label>
                <Textarea 
                  id="footer-text"
                  placeholder="Enter footer text"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logo Upload</CardTitle>
              <CardDescription>Upload your company logo for quotations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logo-upload">Company Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input 
                      id="logo-upload" 
                      type="file" 
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="cursor-pointer"
                    />
                  </div>
                  <Button variant="outline" className="shrink-0">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
                {logo && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {logo.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Logo Preview</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 flex items-center justify-center bg-muted/20">
                  {logo ? (
                    <img 
                      src={URL.createObjectURL(logo)} 
                      alt="Logo preview" 
                      className="max-h-32 object-contain"
                    />
                  ) : (
                    <p className="text-muted-foreground">No logo uploaded</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Color Scheme</CardTitle>
              <CardDescription>Customize colors for your quotation PDFs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex items-center gap-4">
                  <Input 
                    id="primary-color" 
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-20 cursor-pointer"
                  />
                  <Input 
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1"
                    placeholder="#1D8FCC"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary-color">Secondary Color</Label>
                <div className="flex items-center gap-4">
                  <Input 
                    id="secondary-color" 
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-10 w-20 cursor-pointer"
                  />
                  <Input 
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1"
                    placeholder="#0B1E3D"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="text-color">Text Color</Label>
                <div className="flex items-center gap-4">
                  <Input 
                    id="text-color" 
                    type="color"
                    defaultValue="#000000"
                    className="h-10 w-20 cursor-pointer"
                  />
                  <Input 
                    type="text"
                    defaultValue="#000000"
                    className="flex-1"
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Label className="mb-2 block">Preview</Label>
                <div className="border rounded-lg p-6 space-y-2">
                  <div 
                    className="h-12 rounded-md flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Primary Color
                  </div>
                  <div 
                    className="h-12 rounded-md flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: secondaryColor }}
                  >
                    Secondary Color
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          Save Settings
        </Button>
      </div>
    </div>
  );
}
