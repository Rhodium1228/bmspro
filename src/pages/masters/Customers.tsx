import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UserCog } from "lucide-react";

export default function Customers() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <UserCog className="h-8 w-8 text-primary" />
            Customer Management
          </h1>
          <p className="text-muted-foreground">Manage your customers</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No customers added yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
