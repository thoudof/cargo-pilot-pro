
import React from 'react';
import { Home, Truck, Building2, Users, Car, MapPin, Package, BarChart3, FileText, Shield } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/Auth/AuthProvider';
import { AppPermission } from '@/types';

interface NavItem {
  name: string;
  shortName?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: AppPermission | null;
}

const navigation: NavItem[] = [
  { name: 'Главная', shortName: 'Главная', href: '/', icon: Home, permission: null },
  { name: 'Рейсы', shortName: 'Рейсы', href: '/trips', icon: Truck, permission: AppPermission.VIEW_TRIPS },
  { name: 'Отчеты', shortName: 'Отчеты', href: '/reports', icon: BarChart3, permission: AppPermission.VIEW_REPORTS },
  { name: 'Документы', shortName: 'Докум.', href: '/documents', icon: FileText, permission: AppPermission.VIEW_REPORTS },
  { name: 'Контрагенты', shortName: 'Контр.', href: '/contractors', icon: Building2, permission: AppPermission.VIEW_CONTRACTORS },
  { name: 'Водители', shortName: 'Водит.', href: '/drivers', icon: Users, permission: AppPermission.VIEW_DRIVERS },
  { name: 'Транспорт', shortName: 'Транс.', href: '/vehicles', icon: Car, permission: AppPermission.VIEW_VEHICLES },
  { name: 'Маршруты', shortName: 'Маршр.', href: '/routes', icon: MapPin, permission: AppPermission.VIEW_ROUTES },
  { name: 'Типы грузов', shortName: 'Грузы', href: '/cargo-types', icon: Package, permission: AppPermission.VIEW_CARGO_TYPES },
  { name: 'Админ панель', shortName: 'Админ', href: '/admin', icon: Shield, permission: AppPermission.VIEW_ADMIN_PANEL },
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
  const { hasPermission } = useAuth();

  const filteredNavigation = navigation.filter(
    item => !item.permission || hasPermission(item.permission)
  );

  // Bottom navigation - show only main 5 items
  if (variant === 'bottom') {
    const bottomItems = filteredNavigation.slice(0, 5);
    
    return (
      <nav className="grid grid-cols-5 gap-1 py-1 px-2">
        {bottomItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={onItemClick}
              className={cn(
                "bottom-nav-item",
                isActive && "active"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={cn(
                "transition-colors",
                isActive ? "text-primary font-medium" : "text-muted-foreground"
              )}>
                {item.shortName || item.name}
              </span>
            </NavLink>
          );
        })}
      </nav>
    );
  }

  // Desktop and mobile sidebar navigation
  return (
    <nav className="space-y-1">
      {filteredNavigation.map((item) => {
        const isActive = location.pathname === item.href;
        const Icon = item.icon;
        
        return (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={onItemClick}
            className={cn(
              "nav-item",
              isActive && "active"
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{item.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
