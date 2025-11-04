// ===== IMPORTS =====
// Navigation and routing
import { NavLink, useLocation } from "react-router-dom";

// Icons from lucide-react
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
  Building,
  ChevronDown,
  Briefcase,
  ShoppingCart,
  ShoppingBag,
  Wrench,
  Camera,
  Sun,
} from "lucide-react";

// Sidebar UI components
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

// Collapsible components for expandable menu sections
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

// Application logo
import logo from "@/assets/bms-pro-logo.jpg";

// ===== MENU CONFIGURATION =====
/**
 * Navigation menu structure
 * Defines all menu items, their icons, and routes
 * 
 * Structure:
 * - Dashboard: Main dashboard page (single item)
 * - Masters: Master data management (expandable section)
 *   - Bank accounts
 *   - Items/Products
 *   - Employee management
 *   - Customer management
 * - Transactions: Business transactions (expandable section)
 *   - Quotations
 *   - Sale Orders
 *   - Purchase Orders
 * - More: Additional settings (expandable section)
 *   - Company information
 *   - Other options
 */
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
      { title: "Sale Order", url: "/transactions/sale-order", icon: ShoppingCart },
      { title: "Purchase Order", url: "/transactions/purchase-order", icon: ShoppingBag },
      { title: "Job Work Schedule", url: "/transactions/job-work-schedule", icon: Briefcase },
    ],
  },
  {
    title: "Tools",
    icon: Wrench,
    items: [
      { title: "Security Projects", url: "/tools/security-projects", icon: Camera },
      { title: "Security Layout", url: "/tools/security-layout", icon: Camera },
      { title: "Solar Projects", url: "/tools/solar-projects", icon: Sun },
      { title: "Solar Layout", url: "/tools/solar-layout", icon: Sun },
    ],
  },
  {
    title: "More",
    icon: MoreHorizontal,
    items: [
      { title: "Company", url: "/more/company", icon: Building },
      { title: "Other Options", url: "/more/options", icon: Settings },
    ],
  },
];

/**
 * AppSidebar Component
 * 
 * Main navigation sidebar for the application
 * Features:
 * - Collapsible sidebar with logo
 * - Hierarchical menu structure
 * - Active route highlighting
 * - Expandable sections for grouped items
 */
export function AppSidebar() {
  // ===== HOOKS =====
  // Get sidebar state (collapsed/expanded)
  const { state } = useSidebar();
  // Get current location for active route highlighting
  const location = useLocation();

  // ===== STYLING HELPERS =====
  /**
   * Get navigation link classes based on active state
   * Active links are highlighted with primary colors
   * Inactive links show accent color on hover
   */
  const getNavCls = (isActive: boolean) =>
    isActive
      ? "bg-primary text-primary-foreground font-medium"
      : "hover:bg-sidebar-accent";

  // ===== RENDER =====
  return (
    <Sidebar>
      <SidebarContent className="bg-sidebar-background">
        {/* Logo section - hidden when sidebar is collapsed */}
        <div className="p-4 flex items-center justify-center border-b border-sidebar-border">
          {state !== "collapsed" && (
            <img src={logo} alt="BMS PRO" className="h-12 object-contain" />
          )}
        </div>

        {/* Navigation menu */}
        <SidebarGroup>
          <SidebarMenu>
            {/* Loop through all menu items */}
            {menuItems.map((item) =>
              item.items ? (
                // Expandable menu section with sub-items
                <Collapsible key={item.title} defaultOpen>
                  <SidebarMenuItem>
                    {/* Main menu item trigger */}
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="text-sidebar-foreground hover:bg-sidebar-accent">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {/* Chevron icon rotates when section is expanded */}
                        <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    {/* Sub-menu items */}
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.url}>
                            <SidebarMenuSubButton asChild>
                              {/* Navigation link with active state highlighting */}
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
                // Single menu item without sub-items
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
