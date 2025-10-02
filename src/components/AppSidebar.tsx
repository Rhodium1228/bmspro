import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Database,
  FileText,
  Settings,
  MoreHorizontal,
  Building2,
  Package,
  Users,
  UserCog,
  FileEdit,
  Wallet,
  Building,
  ChevronDown,
  Briefcase,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import logo from "@/assets/bms-pro-logo.jpg";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Masters",
    icon: Database,
    items: [
      { title: "Bank", url: "/masters/bank", icon: Building2 },
      { title: "Items", url: "/masters/items", icon: Package },
      { title: "Employees", url: "/masters/employees", icon: Users },
      { title: "Customer Management", url: "/masters/customers", icon: UserCog },
    ],
  },
  {
    title: "Transactions",
    icon: FileText,
    items: [
      { title: "Quotation", url: "/transactions/quotation", icon: FileEdit },
      { title: "Job Card", url: "/transactions/jobcard", icon: Briefcase },
    ],
  },
  {
    title: "More",
    icon: MoreHorizontal,
    items: [
      { title: "Company Accounts", url: "/more/company", icon: Building },
      { title: "Other Options", url: "/more/options", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();

  const getNavCls = (isActive: boolean) =>
    isActive
      ? "bg-primary text-primary-foreground font-medium"
      : "hover:bg-sidebar-accent";

  return (
    <Sidebar>
      <SidebarContent className="bg-sidebar-background">
        <div className="p-4 flex items-center justify-center border-b border-sidebar-border">
          {state !== "collapsed" && (
            <img src={logo} alt="BMS PRO" className="h-12 object-contain" />
          )}
        </div>

        <SidebarGroup>
          <SidebarMenu>
            {menuItems.map((item) =>
              item.items ? (
                <Collapsible key={item.title} defaultOpen>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="text-sidebar-foreground hover:bg-sidebar-accent">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.url}>
                            <SidebarMenuSubButton asChild>
                              <NavLink
                                to={subItem.url}
                                className={({ isActive }) => getNavCls(isActive)}
                              >
                                <subItem.icon className="h-4 w-4" />
                                <span>{subItem.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url!}
                      className={({ isActive }) => getNavCls(isActive)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
