
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/components/Auth/AuthProvider';
import { activityLogger } from '@/services/activityLogger';

export const useActivityLogger = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Логируем навигацию только для аутентифицированных пользователей
    if (user && location.pathname) {
      const pageName = getPageName(location.pathname);
      activityLogger.logNavigation(pageName, { 
        path: location.pathname,
        search: location.search 
      });
    }
  }, [location.pathname, user]);

  const getPageName = (pathname: string): string => {
    const routes: Record<string, string> = {
      '/': 'Главная панель',
      '/trips': 'Рейсы',
      '/contractors': 'Контрагенты',
      '/drivers': 'Водители',
      '/vehicles': 'Транспорт',
      '/routes': 'Маршруты',
      '/cargo-types': 'Типы грузов',
      '/admin': 'Административная панель',
      '/settings': 'Настройки'
    };

    return routes[pathname] || `Страница ${pathname}`;
  };

  return { activityLogger };
};
