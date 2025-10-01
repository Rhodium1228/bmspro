import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileEdit } from "lucide-react";

export default function Quotation() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileEdit className="h-8 w-8 text-primary" />
            Quotation Management
          </h1>
          <p className="text-muted-foreground">Manage your quotations</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Quotation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quotations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No quotations created yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
