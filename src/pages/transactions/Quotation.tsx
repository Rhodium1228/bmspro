import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileEdit, Wrench, Eye, Mail, Calculator } from "lucide-react";

export default function Quotation() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileEdit className="h-8 w-8 text-primary" />
            Quotation Management
          </h1>
          <p className="text-muted-foreground">Create and manage quotations</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Quotation
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Quotation Section - Left Side */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Quotation Workspace</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="create" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="create" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create
                  </TabsTrigger>
                  <TabsTrigger value="tool" className="gap-2">
                    <Wrench className="h-4 w-4" />
                    Tool
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="gap-2">
                    <Eye className="h-4 w-4" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="email" className="gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="create" className="space-y-4 mt-4">
                  <div className="text-muted-foreground">
                    <p>Create new quotation content here.</p>
                  </div>
                </TabsContent>

                <TabsContent value="tool" className="space-y-4 mt-4">
                  <div className="text-muted-foreground">
                    <p>Quotation tools and utilities.</p>
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="space-y-4 mt-4">
                  <div className="text-muted-foreground">
                    <p>Preview your quotation before sending.</p>
                  </div>
                </TabsContent>

                <TabsContent value="email" className="space-y-4 mt-4">
                  <div className="text-muted-foreground">
                    <p>Send quotation via email.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Estimates Section - Right Side */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Estimates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="font-medium">$0.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tax</span>
                  <span className="font-medium">$0.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Discount</span>
                  <span className="font-medium">$0.00</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-lg text-primary">$0.00</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
