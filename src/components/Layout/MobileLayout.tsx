
import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Menu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/Auth/AuthProvider';
import { AppNavigation } from '@/components/Navigation/AppNavigation';
import { activityLogger } from '@/services/activityLogger';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface MobileLayoutProps {
  children: React.ReactNode;
}

const pageTitles: { [key: string]: string } = {
  '/': 'Главная',
  '/trips': 'Рейсы',
  '/reports': 'Отчеты',
  '/contractors': 'Контрагенты',
  '/drivers': 'Водители',
  '/vehicles': 'Транспорт',
  '/routes': 'Маршруты',
  '/cargo-types': 'Типы грузов',
  '/admin': 'Админ панель',
  '/settings': 'Настройки'
};

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleLogout = useCallback(async () => {
    try {
      console.log('Starting logout process...');
      
      // Логируем выход из системы
      try {
        await activityLogger.logLogout();
      } catch (logError) {
        console.warn('Failed to log logout activity:', logError);
      }
      
      // Выходим из Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        toast({
          title: "Ошибка выхода",
          description: "Не удалось выйти из системы. Попробуйте еще раз.",
          variant: "destructive",
        });
        return;
      }

      console.log('Logout successful, redirecting...');
      
      // Показываем уведомление об успешном выходе
      toast({
        title: "Выход выполнен",
        description: "Вы успешно вышли из системы",
      });

      // Перенаправляем на главную страницу
      navigate('/', { replace: true });
      
    } catch (error) {
      console.error('Unexpected logout error:', error);
      toast({
        title: "Ошибка",
        description: "Произошла неожиданная ошибка при выходе",
        variant: "destructive",
      });
    }
  }, [navigate, toast]);

  const handleMobileLogout = useCallback(async () => {
    setIsSidebarOpen(false);
    await handleLogout();
  }, [handleLogout]);

  const currentPage = useMemo(() => 
    location.pathname === '/' ? '/' : location.pathname,
    [location.pathname]
  );

  const pageTitle = useMemo(() => 
    pageTitles[currentPage] || 'Страница',
    [currentPage]
  );

  const userInitial = useMemo(() => 
    user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || "U",
    [user?.user_metadata?.full_name, user?.email]
  );

  const userName = useMemo(() => 
    user?.user_metadata?.full_name || 'Пользователь',
    [user?.user_metadata?.full_name]
  );

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const openSidebar = useCallback(() => {
    setIsSidebarOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header с логотипом и кнопкой меню */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={openSidebar}
              className="lg:hidden p-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/8085f690-6d29-4dc3-8dfc-890319ea82ed.png" 
                alt="Fix Logistics" 
                className="h-10 w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Заголовок страницы */}
      <div className="bg-white border-b border-gray-100 px-4 py-2">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-lg font-medium text-gray-900">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Desktop Sidebar для планшетов и больших экранов */}
      <div className="hidden lg:flex flex-1">
        <aside className="w-64 xl:w-72 bg-white border-r border-gray-200 flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-4 xl:p-6">
              <div className="flex items-center gap-3 mb-6">
                <Avatar className="h-10 w-10 xl:h-12 xl:w-12 flex-shrink-0">
                  <AvatarImage 
                    src={user?.user_metadata?.avatar_url || ""} 
                    alt={userName} 
                  />
                  <AvatarFallback>{userInitial}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm xl:text-base truncate">
                    {userName}
                  </p>
                  <p className="text-xs xl:text-sm text-gray-500 truncate break-all">{user?.email}</p>
                </div>
              </div>
              
              <AppNavigation />
            </div>
          </ScrollArea>
          
          <div className="p-4 xl:p-6 border-t">
            <Button 
              variant="ghost" 
              className="w-full justify-start h-10 xl:h-12 text-sm xl:text-base" 
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 xl:h-5 xl:w-5 mr-3" />
              Выйти
            </Button>
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
        <SheetContent side="left" className="w-72 sm:w-80 flex flex-col p-0">
          <SheetHeader className="text-left p-6 pb-0">
            <SheetTitle>Меню</SheetTitle>
          </SheetHeader>
          
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage 
                    src={user?.user_metadata?.avatar_url || ""} 
                    alt={userName} 
                  />
                  <AvatarFallback>{userInitial}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {userName}
                  </p>
                  <p className="text-xs text-gray-500 truncate break-all">{user?.email}</p>
                </div>
              </div>
              
              <AppNavigation onItemClick={closeSidebar} />
            </div>
          </ScrollArea>

          <div className="p-6 border-t">
            <Button 
              variant="ghost" 
              className="w-full justify-start h-12" 
              onClick={handleMobileLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Выйти
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Main Content */}
      <main className="flex-1 lg:hidden">
        <div className="p-2 sm:p-4 pb-20">
          {children}
        </div>
      </main>

      {/* Bottom Navigation - только для мобильных */}
      <footer className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 py-1 px-2 safe-area-inset">
        <AppNavigation variant="bottom" />
      </footer>
    </div>
  );
};
