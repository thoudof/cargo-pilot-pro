import React from 'react';
import { Home, Truck, Building2, Users, Car, MapPin, Package, Settings, Shield, BarChart3 } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Menu } from 'lucide-react';
import { useSidebar } from '@/components/Sidebar/SidebarProvider';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  current: boolean;
}

const navigation = [
  {
    name: 'Главная',
    href: '/',
    icon: Home,
    current: false,
  },
  {
    name: 'Рейсы',
    href: '/trips',
    icon: Truck,
    current: false,
  },
  {
    name: 'Отчеты',
    href: '/reports',
    icon: BarChart3,
    current: false,
  },
  {
    name: 'Контрагенты',
    href: '/contractors',
    icon: Building2,
    current: false,
  },
  {
    name: 'Водители',
    href: '/drivers',
    icon: Users,
    current: false,
  },
  {
    name: 'Транспорт',
    href: '/vehicles',
    icon: Car,
    current: false,
  },
  {
    name: 'Маршруты',
    href: '/routes',
    icon: MapPin,
    current: false,
  },
  {
    name: 'Типы грузов',
    href: '/cargo-types',
    icon: Package,
    current: false,
  },
];

export const AppNavigation: React.FC = () => {
  const location = useLocation();
  const { isOpen, onOpen, onClose } = useSidebar();

  const updatedNavigation = navigation.map(item => ({
    ...item,
    current: item.href === location.pathname,
  }));

  return (
    <nav className="flex flex-col space-y-1">
      {updatedNavigation.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) =>
            cn(
              "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-muted hover:text-foreground",
              isActive ? "bg-muted text-foreground" : "text-muted-foreground"
            )
          }
        >
          <item.icon className="mr-2 h-4 w-4" />
          <span>{item.name}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export const MobileAppNavigation: React.FC = () => {
  const location = useLocation();
    const { isOpen, onOpen, onClose } = useSidebar();


  const updatedNavigation = navigation.map(item => ({
    ...item,
    current: item.href === location.pathname,
  }));

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="p-0">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 pt-6 w-64">
        <SheetHeader className="pl-4 pb-4">
          <SheetTitle>Меню</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col space-y-1">
          {updatedNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-muted hover:text-foreground",
                  isActive ? "bg-muted text-foreground" : "text-muted-foreground"
                )
              }
              onClick={onClose}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
