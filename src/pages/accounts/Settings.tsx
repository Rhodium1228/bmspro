import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default function AccountSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-8 w-8 text-primary" />
          Account Settings
        </h1>
        <p className="text-muted-foreground">Configure your account preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Configure your settings here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
