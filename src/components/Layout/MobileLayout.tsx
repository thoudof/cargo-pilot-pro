
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Menu, Home, Truck, Users, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NotificationBell } from '@/components/Notifications/NotificationBell';
import { PushNotificationManager } from '@/components/Notifications/PushNotificationManager';
import { useAuth } from '@/components/Auth/AuthProvider';

interface MobileLayoutProps {
  children: React.ReactNode;
}

const pageTitles: { [key: string]: string } = {
  '/': 'Главная',
  '/trips': 'Рейсы',
  '/contractors': 'Контрагенты',
  '/settings': 'Настройки'
};

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    // Логика выхода будет реализована через AuthProvider
    navigate('/login');
  };

  const getPageTitle = (path: string | null) => {
    return pageTitles[path || '/'] || 'Страница';
  };

  const currentPage = location.pathname === '/' ? '/' : location.pathname;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Компонент для управления PUSH-уведомлениями */}
      <PushNotificationManager userId={user?.id} />
      
      {/* Header - оптимизированный для мобильных устройств */}
      <header className="bg-white border-b border-gray-200 px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-1 sm:gap-3 min-w-0 flex-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1 sm:p-2 flex-shrink-0"
            >
              <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <h1 className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-900 truncate">
              {getPageTitle(currentPage)}
            </h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <NotificationBell />
            {/* Кнопка "Выйти" убрана из header - она есть только в sidebar */}
          </div>
        </div>
      </header>

      {/* Desktop Sidebar для планшетов и больших экранов */}
      <div className="hidden lg:flex flex-1">
        <aside className="w-64 xl:w-72 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 xl:p-6">
            <div className="flex items-center gap-3 mb-6">
              <Avatar className="h-10 w-10 xl:h-12 xl:w-12 flex-shrink-0">
                <AvatarImage 
                  src={user?.user_metadata?.avatar_url || ""} 
                  alt={user?.user_metadata?.full_name || "User Avatar"} 
                />
                <AvatarFallback>{user?.user_metadata?.full_name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm xl:text-base truncate">
                  {user?.user_metadata?.full_name || 'Пользователь'}
                </p>
                <p className="text-xs xl:text-sm text-gray-500 truncate break-all">{user?.email}</p>
              </div>
            </div>
            
            <nav className="space-y-1">
              <Button 
                variant="ghost" 
                className="w-full justify-start h-10 xl:h-12 text-sm xl:text-base" 
                onClick={() => navigate('/')}
              >
                <Home className="h-4 w-4 xl:h-5 xl:w-5 mr-3" />
                Главная
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start h-10 xl:h-12 text-sm xl:text-base" 
                onClick={() => navigate('/trips')}
              >
                <Truck className="h-4 w-4 xl:h-5 xl:w-5 mr-3" />
                Рейсы
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start h-10 xl:h-12 text-sm xl:text-base" 
                onClick={() => navigate('/contractors')}
              >
                <Users className="h-4 w-4 xl:h-5 xl:w-5 mr-3" />
                Контрагенты
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start h-10 xl:h-12 text-sm xl:text-base" 
                onClick={() => navigate('/settings')}
              >
                <Settings className="h-4 w-4 xl:h-5 xl:w-5 mr-3" />
                Настройки
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start h-10 xl:h-12 text-sm xl:text-base" 
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 xl:h-5 xl:w-5 mr-3" />
                Выйти
              </Button>
            </nav>
          </div>
        </aside>
        
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetTrigger asChild>
          <div className="hidden" />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 sm:w-80">
          <SheetHeader className="text-left mb-6">
            <SheetTitle>Меню</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-full">
            <div className="px-2 mb-6">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage 
                    src={user?.user_metadata?.avatar_url || ""} 
                    alt={user?.user_metadata?.full_name || "User Avatar"} 
                  />
                  <AvatarFallback>{user?.user_metadata?.full_name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {user?.user_metadata?.full_name || 'Пользователь'}
                  </p>
                  <p className="text-xs text-gray-500 truncate break-all">{user?.email}</p>
                </div>
              </div>
            </div>
            
            <nav className="flex-1 space-y-1">
              <Button 
                variant="ghost" 
                className="w-full justify-start h-12" 
                onClick={() => { navigate('/'); setIsSidebarOpen(false); }}
              >
                <Home className="h-5 w-5 mr-3" />
                Главная
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start h-12" 
                onClick={() => { navigate('/trips'); setIsSidebarOpen(false); }}
              >
                <Truck className="h-5 w-5 mr-3" />
                Рейсы
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start h-12" 
                onClick={() => { navigate('/contractors'); setIsSidebarOpen(false); }}
              >
                <Users className="h-5 w-5 mr-3" />
                Контрагенты
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start h-12" 
                onClick={() => { navigate('/settings'); setIsSidebarOpen(false); }}
              >
                <Settings className="h-5 w-5 mr-3" />
                Настройки
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start h-12" 
                onClick={() => { handleLogout(); setIsSidebarOpen(false); }}
              >
                <LogOut className="h-5 w-5 mr-3" />
                Выйти
              </Button>
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Main Content */}
      <main className="flex-1 lg:hidden">
        <div className="p-2 sm:p-4 pb-20">
          {children}
        </div>
      </main>

      {/* Bottom Navigation - только для мобильных, без кнопки "Выйти" */}
      <footer className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 py-1 px-2 safe-area-inset">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')} 
            className="flex flex-col items-center gap-1 h-auto py-2 px-2 min-w-0"
          >
            <Home className="h-4 w-4" />
            <span className="text-xs leading-none">Главная</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/trips')} 
            className="flex flex-col items-center gap-1 h-auto py-2 px-2 min-w-0"
          >
            <Truck className="h-4 w-4" />
            <span className="text-xs leading-none">Рейсы</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/contractors')} 
            className="flex flex-col items-center gap-1 h-auto py-2 px-2 min-w-0"
          >
            <Users className="h-4 w-4" />
            <span className="text-xs leading-none">Контрагенты</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/settings')} 
            className="flex flex-col items-center gap-1 h-auto py-2 px-2 min-w-0"
          >
            <Settings className="h-4 w-4" />
            <span className="text-xs leading-none">Настройки</span>
          </Button>
        </div>
      </footer>
    </div>
  );
};
