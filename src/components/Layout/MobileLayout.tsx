
import React from 'react';
import { useState } from 'react';
import { Sidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  User, 
  Settings, 
  Bell,
  Search,
  Plus,
  Calendar,
  File
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: React.ReactNode;
  title: string;
  onMenuSelect: (item: string) => void;
  currentView: string;
}

const menuItems = [
  { id: 'dashboard', label: 'Главная', icon: Calendar },
  { id: 'trips', label: 'Рейсы', icon: Calendar },
  { id: 'contractors', label: 'Контрагенты', icon: User },
  { id: 'documents', label: 'Документы', icon: File },
  { id: 'statistics', label: 'Статистика', icon: Search },
  { id: 'settings', label: 'Настройки', icon: Settings },
];

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  title,
  onMenuSelect,
  currentView
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex flex-col h-full">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold">Грузоперевозки</h2>
                </div>
                <nav className="flex-1 p-4">
                  <div className="space-y-2">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Button
                          key={item.id}
                          variant={currentView === item.id ? "secondary" : "ghost"}
                          className="w-full justify-start text-left"
                          onClick={() => {
                            onMenuSelect(item.id);
                            setIsMenuOpen(false);
                          }}
                        >
                          <Icon className="mr-3 h-4 w-4" />
                          {item.label}
                        </Button>
                      );
                    })}
                  </div>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
          
          <h1 className="ml-4 text-lg font-semibold">{title}</h1>
          
          <div className="ml-auto flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-6">
        {children}
      </main>

      {/* Bottom Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
        <div className="grid grid-cols-4 h-16">
          {menuItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "h-full rounded-none flex-col space-y-1 text-xs",
                  currentView === item.id && "bg-secondary"
                )}
                onClick={() => onMenuSelect(item.id)}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
