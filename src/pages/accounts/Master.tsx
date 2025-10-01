import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Database } from "lucide-react";

export default function AccountMaster() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Database className="h-8 w-8 text-primary" />
            Account Master
          </h1>
          <p className="text-muted-foreground">Manage your account ledgers</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Account
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chart of Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No accounts added yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
