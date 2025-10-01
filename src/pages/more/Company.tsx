import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building } from "lucide-react";

export default function Company() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Building className="h-8 w-8 text-primary" />
          Company Accounts
        </h1>
        <p className="text-muted-foreground">Manage your company accounts</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Configure your company accounts here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
