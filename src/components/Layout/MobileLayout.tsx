
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
    <div className="min-h-screen bg-gray-50">
      {/* Компонент для управления PUSH-уведомлениями */}
      <PushNotificationManager userId={user?.id} />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">
              {getPageTitle(currentPage)}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64">
          <SheetHeader className="text-left">
            <SheetTitle>Меню</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <div className="px-4 py-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.user_metadata?.avatar_url || ""} alt={user?.user_metadata?.full_name || "User Avatar"} />
                <AvatarFallback>{user?.user_metadata?.full_name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="mt-2">
                <p className="font-semibold">{user?.user_metadata?.full_name || 'Пользователь'}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate('/'); setIsSidebarOpen(false); }}>
                <Home className="h-4 w-4 mr-2" />
                Главная
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate('/trips'); setIsSidebarOpen(false); }}>
                <Truck className="h-4 w-4 mr-2" />
                Рейсы
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate('/contractors'); setIsSidebarOpen(false); }}>
                <Users className="h-4 w-4 mr-2" />
                Контрагенты
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate('/settings'); setIsSidebarOpen(false); }}>
                <Settings className="h-4 w-4 mr-2" />
                Настройки
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Выйти
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="p-4">
        {children}
      </main>

      {/* Bottom Navigation */}
      <footer className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 py-2 px-4">
        <div className="flex items-center justify-around">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="flex flex-col items-center">
            <Home className="h-5 w-5" />
            <span className="text-xs">Главная</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/trips')} className="flex flex-col items-center">
            <Truck className="h-5 w-5" />
            <span className="text-xs">Рейсы</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/contractors')} className="flex flex-col items-center">
            <Users className="h-5 w-5" />
            <span className="text-xs">Контрагенты</span>
          </Button>
        </div>
      </footer>
    </div>
  );
};
