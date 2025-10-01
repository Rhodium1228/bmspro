import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Package,
  Users,
  UserCog,
  FileEdit,
  TrendingUp,
  DollarSign,
  Activity,
} from "lucide-react";

const stats = [
  {
    title: "Total Revenue",
    value: "₹45,231.89",
    change: "+20.1%",
    icon: DollarSign,
    color: "text-green-600",
  },
  {
    title: "Active Customers",
    value: "2,350",
    change: "+12.5%",
    icon: Users,
    color: "text-blue-600",
  },
  {
    title: "Total Items",
    value: "1,234",
    change: "+5.2%",
    icon: Package,
    color: "text-purple-600",
  },
  {
    title: "Pending Quotations",
    value: "89",
    change: "-4.3%",
    icon: FileEdit,
    color: "text-orange-600",
  },
];

const recentActivity = [
  { action: "New quotation created", time: "2 hours ago", icon: FileEdit },
  { action: "Customer added", time: "4 hours ago", icon: UserCog },
  { action: "Item stock updated", time: "6 hours ago", icon: Package },
  { action: "Bank account verified", time: "1 day ago", icon: Building2 },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to BMS PRO - Your Business Management System</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <activity.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Employees</span>
                <span className="text-sm font-bold">156</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Bank Accounts</span>
                <span className="text-sm font-bold">8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Transactions</span>
                <span className="text-sm font-bold">3,456</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Customer Satisfaction</span>
                <span className="text-sm font-bold">94%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
