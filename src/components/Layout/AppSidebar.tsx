
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
} from "@/components/ui/sidebar";
import { Home, Truck, Building2, Users, Car, MapPin, Package, BarChart3 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const menuItems = [
  {
    title: "Главная",
    url: "/",
    icon: Home,
  },
  {
    title: "Рейсы",
    url: "/trips",
    icon: Truck,
  },
  {
    title: "Отчеты",
    url: "/reports",
    icon: BarChart3,
  },
  {
    title: "Контрагенты",
    url: "/contractors",
    icon: Building2,
  },
  {
    title: "Водители",
    url: "/drivers",
    icon: Users,
  },
  {
    title: "Транспорт",
    url: "/vehicles",
    icon: Car,
  },
  {
    title: "Маршруты",
    url: "/routes",
    icon: MapPin,
  },
  {
    title: "Типы грузов",
    url: "/cargo-types",
    icon: Package,
  },
];

export function AppSidebar() {
  const location = useLocation();

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
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
