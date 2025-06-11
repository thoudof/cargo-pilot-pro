
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Truck, Users, Settings, MapPin, Package, Shield } from 'lucide-react';
import { activityLogger } from '@/services/activityLogger';
import { useUserRole } from '@/hooks/useUserRole';

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navigationItems: NavigationItem[] = [
  { path: '/', label: 'Главная', icon: Home },
  { path: '/trips', label: 'Рейсы', icon: Truck },
  { path: '/contractors', label: 'Контрагенты', icon: Users },
  { path: '/drivers', label: 'Водители', icon: Users },
  { path: '/vehicles', label: 'Транспорт', icon: Truck },
  { path: '/routes', label: 'Маршруты', icon: MapPin },
  { path: '/cargo-types', label: 'Типы грузов', icon: Package },
  { path: '/admin', label: 'Админ панель', icon: Shield, adminOnly: true },
  { path: '/settings', label: 'Настройки', icon: Settings },
];

interface AppNavigationProps {
  variant?: 'desktop' | 'mobile' | 'bottom';
  className?: string;
  onItemClick?: () => void;
}

export const AppNavigation: React.FC<AppNavigationProps> = ({ 
  variant = 'desktop', 
  className = '',
  onItemClick 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useUserRole();

  const handleNavigate = async (path: string, label: string) => {
    navigate(path);
    await activityLogger.logNavigation(label);
    onItemClick?.();
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const getButtonClass = (path: string) => {
    const baseClass = variant === 'bottom' 
      ? "flex flex-col items-center gap-1 h-auto py-2 px-2 min-w-0"
      : variant === 'mobile'
        ? "w-full justify-start h-12"
        : "w-full justify-start h-10 xl:h-12 text-sm xl:text-base";
    
    const activeClass = isActive(path) ? "bg-accent text-accent-foreground" : "";
    
    return `${baseClass} ${activeClass}`;
  };

  const getIconSize = () => {
    return variant === 'bottom' ? "h-4 w-4" : "h-4 w-4 xl:h-5 xl:w-5";
  };

  // Фильтруем элементы навигации в зависимости от прав пользователя
  const filteredItems = navigationItems.filter(item => {
    if (item.adminOnly && !isAdmin) {
      return false;
    }
    return true;
  });

  if (variant === 'bottom') {
    // Показываем только основные страницы в нижней навигации
    const bottomItems = filteredItems.filter(item => 
      ['/', '/trips', '/contractors', '/settings'].includes(item.path)
    );

    return (
      <div className={`flex items-center justify-around max-w-md mx-auto ${className}`}>
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              onClick={() => handleNavigate(item.path, item.label)}
              className={getButtonClass(item.path)}
            >
              <Icon className={getIconSize()} />
              <span className="text-xs leading-none">{item.label}</span>
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <nav className={`space-y-1 ${className}`}>
      {filteredItems.map((item) => {
        const Icon = item.icon;
        return (
          <Button
            key={item.path}
            variant="ghost"
            onClick={() => handleNavigate(item.path, item.label)}
            className={getButtonClass(item.path)}
          >
            <Icon className={`${getIconSize()} mr-3`} />
            {item.label}
          </Button>
        );
      })}
    </nav>
  );
};
