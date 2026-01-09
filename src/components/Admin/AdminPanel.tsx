
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Activity, BarChart3, TrendingUp, Server, FileText } from 'lucide-react';
import { UserManagement } from './UserManagement';
import { ActivityLogs } from './ActivityLogs';
import { SystemStats } from './SystemStats';
import { AdvancedStats } from './AdvancedStats';
import { AdminRoute } from './AdminRoute';
import { SystemMonitoring } from './SystemMonitoring';
import { Analytics } from './Analytics';
import { DocumentTemplatesManager } from './DocumentTemplatesManager';
import { UserPermissionsManager } from './UserPermissionsManager';
import { PageHeader } from '@/components/Layout/PageHeader';

const tabItems = [
  { value: 'users', label: 'Пользователи', shortLabel: 'Польз.', icon: Users },
  { value: 'permissions', label: 'Права доступа', shortLabel: 'Права', icon: Shield },
  { value: 'logs', label: 'Логи активности', shortLabel: 'Логи', icon: Activity },
  { value: 'analytics', label: 'Аналитика', shortLabel: 'Анал.', icon: BarChart3 },
  { value: 'advanced', label: 'Статистика', shortLabel: 'Стат.', icon: TrendingUp },
  { value: 'system', label: 'Система', shortLabel: 'Сист.', icon: Server },
  { value: 'documents', label: 'Документы', shortLabel: 'Док.', icon: FileText },
];

export const AdminPanel: React.FC = () => {
  return (
    <AdminRoute>
      <div className="space-y-6 animate-fade-in">
        <PageHeader 
          title="Административная панель" 
          description="Управление системой, пользователями и правами доступа"
          icon={<Shield className="h-6 w-6 text-primary" />}
        />

        <SystemStats />

        <Tabs defaultValue="users" className="space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 pb-2">
            <TabsList className="inline-flex h-auto p-1 bg-muted/50 rounded-xl min-w-max">
              {tabItems.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden md:inline">{tab.label}</span>
                  <span className="md:hidden">{tab.shortLabel}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="users" className="mt-0">
            <UserManagement />
          </TabsContent>

          <TabsContent value="permissions" className="mt-0">
            <UserPermissionsManager />
          </TabsContent>

          <TabsContent value="logs" className="mt-0">
            <ActivityLogs />
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            <Analytics />
          </TabsContent>

          <TabsContent value="advanced" className="mt-0">
            <AdvancedStats />
          </TabsContent>

          <TabsContent value="system" className="mt-0">
            <SystemMonitoring />
          </TabsContent>

          <TabsContent value="documents" className="mt-0">
            <DocumentTemplatesManager />
          </TabsContent>
        </Tabs>
      </div>
    </AdminRoute>
  );
};
