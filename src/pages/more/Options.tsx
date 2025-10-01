import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function Options() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          Other Options
        </h1>
        <p className="text-muted-foreground">Additional system options</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Options</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Additional configuration options.</p>
        </CardContent>
      </Card>
    </div>
  );
}
