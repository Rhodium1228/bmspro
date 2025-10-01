import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, FileText, ShoppingCart, Package, Shield, BarChart, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Options() {
  const sections = [
    {
      title: "Invoices",
      description: "Manage invoice templates and settings",
      icon: FileText,
    },
    {
      title: "Purchase Orders",
      description: "Configure purchase order options",
      icon: ShoppingCart,
    },
    {
      title: "Inventory",
      description: "Inventory management settings",
      icon: Package,
    },
    {
      title: "Compliance",
      description: "Compliance and regulatory settings",
      icon: Shield,
    },
    {
      title: "Reports",
      description: "Reporting configuration and options",
      icon: BarChart,
    },
    {
      title: "Settings",
      description: "General system settings",
      icon: Sliders,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          Other Options
        </h1>
        <p className="text-muted-foreground">Additional system options and configurations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <Card key={section.title} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <section.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{section.title}</CardTitle>
              </div>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Configure
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
