
import React from 'react';
import { Home, Truck, Building2, Users, Car, MapPin, Package, BarChart3 } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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

interface AppNavigationProps {
  variant?: 'desktop' | 'mobile' | 'bottom';
  onItemClick?: () => void;
}

export const AppNavigation: React.FC<AppNavigationProps> = ({ 
  variant = 'desktop', 
  onItemClick 
}) => {
  const location = useLocation();

  const updatedNavigation = navigation.map(item => ({
    ...item,
    current: item.href === location.pathname,
  }));

  if (variant === 'bottom') {
    // Bottom navigation for mobile
    return (
      <div className="grid grid-cols-4 gap-1">
        {updatedNavigation.slice(0, 4).map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center p-2 text-xs font-medium rounded-md transition-colors",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )
            }
            onClick={onItemClick}
          >
            <item.icon className="h-5 w-5 mb-1" />
            <span className="truncate">{item.name}</span>
          </NavLink>
        ))}
      </div>
    );
  }

  // Desktop and mobile variants
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
          onClick={onItemClick}
        >
          <item.icon className="mr-2 h-4 w-4" />
          <span>{item.name}</span>
        </NavLink>
      ))}
    </nav>
  );
};
