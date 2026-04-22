import {
  Laptop,
  Monitor,
  Wifi,
  Camera,
  Printer,
  LayoutDashboard,
  ArrowLeftRight,
  User,
  Users,
  Smartphone,
  LogOut,
} from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
];

const equipmentItems = [
  { title: "Notebooks", url: "/equipment/notebooks", icon: Laptop },
  { title: "Monitores", url: "/equipment/monitors", icon: Monitor },
  { title: "Roteadores", url: "/equipment/routers", icon: Wifi },
  { title: "Câmeras", url: "/equipment/cameras", icon: Camera },
  { title: "Impressoras", url: "/equipment/printers", icon: Printer },
];

const managementItems = [
  { title: "Funcionários", url: "/employees", icon: Users },
  { title: "Chips", url: "/sim-cards", icon: Smartphone },
  { title: "Movimentações", url: "/movements", icon: ArrowLeftRight },
  { title: "Perfil", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut } = useAuth();
  const currentPath = location.pathname;

  const isActive = (url: string) => currentPath === url || currentPath.startsWith(url + "/");

  const renderItems = (items: typeof navItems) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            asChild
            isActive={isActive(item.url)}
          >
            <Link to={item.url}>
              <item.icon className="h-4 w-4" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Laptop className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-sidebar-foreground">EquipControl</h2>
              <p className="text-xs text-sidebar-foreground/60">Gestão de Equipamentos</p>
            </div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Geral</SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(navItems)}</SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Equipamentos</SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(equipmentItems)}</SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Gestão</SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(managementItems)}</SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
