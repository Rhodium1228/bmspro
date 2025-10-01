import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Building2 } from "lucide-react";

export default function Bank() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            Bank Management
          </h1>
          <p className="text-muted-foreground">Manage your bank accounts</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Bank Account
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bank Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No bank accounts added yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
