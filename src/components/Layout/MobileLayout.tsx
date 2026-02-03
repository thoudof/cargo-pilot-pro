import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Menu, Settings, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/components/Auth/AuthProvider';
import { AppNavigation } from '@/components/Navigation/AppNavigation';
import { ThemeToggle } from '@/components/Theme/ThemeToggle';
import { NotificationBell } from '@/components/Notifications/NotificationBell';
import { UserProfileDropdown } from './UserProfileDropdown';
import { activityLogger } from '@/services/activityLogger';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleLogout = useCallback(async () => {
    try {
      try {
        await activityLogger.logLogout();
      } catch (logError) {
        console.warn('Failed to log logout activity:', logError);
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Ошибка выхода",
          description: "Не удалось выйти из системы. Попробуйте еще раз.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Выход выполнен",
        description: "Вы успешно вышли из системы",
      });

      navigate('/', { replace: true });
      
    } catch (error) {
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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 xl:w-72 flex-col gradient-sidebar border-r border-sidebar-border">
        {/* Logo */}
        <div className="p-4 xl:p-6 border-b border-sidebar-border">
          <img 
            src="/lovable-uploads/8085f690-6d29-4dc3-8dfc-890319ea82ed.png" 
            alt="Fix Logistics" 
            className="h-10 w-auto object-contain brightness-0 invert"
          />
        </div>

        {/* User Info */}
        <div className="p-4 xl:p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-sidebar-primary/20">
              <AvatarImage src={user?.user_metadata?.avatar_url || ""} alt={userName} />
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground font-semibold">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-sidebar-foreground truncate">
                {userName}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <div className="px-3">
            <AppNavigation variant="desktop" />
          </div>
        </ScrollArea>
        
        {/* Bottom Actions */}
        <div className="p-4 border-t border-sidebar-border space-y-1">
          <Link
            to="/settings"
            className="nav-item w-full"
          >
            <Settings className="h-4 w-4" />
            <span>Настройки</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="nav-item w-full text-left hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-card border-b border-border px-4 lg:px-6 h-14 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Mobile Logo */}
            <img 
              src="/lovable-uploads/8085f690-6d29-4dc3-8dfc-890319ea82ed.png" 
              alt="Fix Logistics" 
              className="h-8 w-auto object-contain lg:hidden"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
            
            {/* Desktop User Menu */}
            <div className="hidden lg:flex items-center gap-3 ml-2">
              <UserProfileDropdown />
            </div>
            
            {/* Mobile User Avatar - links to settings */}
            <div className="lg:hidden">
              <UserProfileDropdown />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto pb-20 lg:pb-8">
            <div className="animate-fade-in">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0 gradient-sidebar border-sidebar-border">
          <SheetHeader className="p-6 border-b border-sidebar-border">
            <SheetTitle className="text-left">
              <img 
                src="/lovable-uploads/8085f690-6d29-4dc3-8dfc-890319ea82ed.png" 
                alt="Fix Logistics" 
                className="h-8 w-auto object-contain brightness-0 invert"
              />
            </SheetTitle>
          </SheetHeader>
          
          {/* User Info */}
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.user_metadata?.avatar_url || ""} alt={userName} />
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-sidebar-foreground truncate">
                  {userName}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
          
          <ScrollArea className="flex-1 h-[calc(100vh-280px)]">
            <div className="p-3">
              <AppNavigation variant="mobile" onItemClick={closeSidebar} />
            </div>
          </ScrollArea>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border bg-sidebar-background">
            <div className="space-y-1">
              <Link
                to="/settings"
                onClick={closeSidebar}
                className="nav-item w-full"
              >
                <Settings className="h-4 w-4" />
                <span>Настройки</span>
                <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
              </Link>
              <button 
                onClick={handleMobileLogout}
                className="nav-item w-full text-left hover:bg-red-500/10 hover:text-red-400"
              >
                <LogOut className="h-4 w-4" />
                <span>Выйти</span>
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Bottom Navigation - Mobile Only */}
      <div className="bottom-nav lg:hidden">
        <div className="max-w-lg mx-auto">
          <AppNavigation variant="bottom" />
        </div>
      </div>
    </div>
  );
};
