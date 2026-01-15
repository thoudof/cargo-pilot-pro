
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { Home, Truck, Building2, Users, Car, MapPin, Package, BarChart3, Shield, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { AppPermission } from '@/types';
import { useAuth } from "@/components/Auth/AuthProvider";

const allMenuItems = [
  { title: "Главная", url: "/", icon: Home, permission: null },
  { title: "Рейсы", url: "/trips", icon: Truck, permission: AppPermission.VIEW_TRIPS },
  { title: "Отчеты", url: "/reports", icon: BarChart3, permission: AppPermission.VIEW_REPORTS },
  { title: "Контрагенты", url: "/contractors", icon: Building2, permission: AppPermission.VIEW_CONTRACTORS },
  { title: "Водители", url: "/drivers", icon: Users, permission: AppPermission.VIEW_DRIVERS },
  { title: "Транспорт", url: "/vehicles", icon: Car, permission: AppPermission.VIEW_VEHICLES },
  { title: "Маршруты", url: "/routes", icon: MapPin, permission: AppPermission.VIEW_ROUTES },
  { title: "Типы грузов", url: "/cargo-types", icon: Package, permission: AppPermission.VIEW_CARGO_TYPES },
  { title: "Уведомления", url: "/notifications", icon: Bell, permission: null },
  { title: "Админ панель", url: "/admin", icon: Shield, permission: AppPermission.VIEW_ADMIN_PANEL },
];

export function AppSidebar() {
  const location = useLocation();
  const { hasPermission, loading } = useAuth();
  
  const menuItems = allMenuItems.filter(item => !item.permission || hasPermission(item.permission));

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <img 
            src="/lovable-uploads/8085f690-6d29-4dc3-8dfc-890319ea82ed.png" 
            alt="Fix Logistics" 
            className="h-8 w-auto object-contain"
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Приложение</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {loading ? (
                Array.from({ length: 9 }).map((_, index) => (
                  <SidebarMenuSkeleton key={index} showIcon />
                ))
              ) : (
                menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
