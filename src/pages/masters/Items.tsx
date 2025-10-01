import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Package } from "lucide-react";

export default function Items() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            Items Management
          </h1>
          <p className="text-muted-foreground">Manage your inventory items</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No items added yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
