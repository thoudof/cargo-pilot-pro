
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Menu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/Auth/AuthProvider';
import { AppNavigation } from '@/components/Navigation/AppNavigation';
import { activityLogger } from '@/services/activityLogger';
import { supabaseService } from '@/services/supabaseService';

interface MobileLayoutProps {
  children: React.ReactNode;
}

const pageTitles: { [key: string]: string } = {
  '/': 'Главная',
  '/trips': 'Рейсы',
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

  const handleLogout = async () => {
    try {
      await activityLogger.logLogout();
      await supabaseService.signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const currentPage = useMemo(() => 
    location.pathname === '/' ? '/' : location.pathname,
    [location.pathname]
  );

  const pageTitle = useMemo(() => 
    pageTitles[currentPage] || 'Страница',
    [currentPage]
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header с логотипом и кнопкой меню */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/b2aa38ba-0396-49de-b859-549fd50b9a7f.png" 
                alt="Fix Logistics" 
                className="w-12 h-12 object-contain"
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
              
              <AppNavigation variant="desktop" />
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
              
              <AppNavigation 
                variant="mobile" 
                onItemClick={() => setIsSidebarOpen(false)} 
              />
            </div>
          </ScrollArea>

          <div className="p-6 border-t">
            <Button 
              variant="ghost" 
              className="w-full justify-start h-12" 
              onClick={() => { handleLogout(); setIsSidebarOpen(false); }}
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
