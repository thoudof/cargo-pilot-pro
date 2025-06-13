
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, Activity, BarChart3, TrendingUp, Server } from 'lucide-react';
import { UserManagement } from './UserManagement';
import { ActivityLogs } from './ActivityLogs';
import { SystemStats } from './SystemStats';
import { AdvancedStats } from './AdvancedStats';
import { AdminRoute } from './AdminRoute';
import { SystemMonitoring } from './SystemMonitoring';
import { Analytics } from './Analytics';

export const AdminPanel: React.FC = () => {
  return (
    <AdminRoute>
      <div className="container mx-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 lg:h-8 lg:w-8 text-primary" />
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Административная панель</h1>
            <p className="text-sm lg:text-base text-muted-foreground">Управление системой и пользователями</p>
          </div>
        </div>

        <SystemStats />

        <Tabs defaultValue="users" className="space-y-4 lg:space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 min-w-max">
              <TabsTrigger value="users" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm px-2 lg:px-4">
                <Users className="h-3 w-3 lg:h-4 lg:w-4" />
                <span className="hidden sm:inline">Пользователи</span>
                <span className="sm:hidden">Польз.</span>
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm px-2 lg:px-4">
                <Activity className="h-3 w-3 lg:h-4 lg:w-4" />
                <span className="hidden sm:inline">Логи активности</span>
                <span className="sm:hidden">Логи</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm px-2 lg:px-4">
                <BarChart3 className="h-3 w-3 lg:h-4 lg:w-4" />
                <span className="hidden sm:inline">Аналитика</span>
                <span className="sm:hidden">Анал.</span>
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm px-2 lg:px-4">
                <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4" />
                <span className="hidden sm:inline">Расширенная статистика</span>
                <span className="sm:hidden">Стат.</span>
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm px-2 lg:px-4">
                <Server className="h-3 w-3 lg:h-4 lg:w-4" />
                <span className="hidden sm:inline">Система</span>
                <span className="sm:hidden">Сист.</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="logs">
            <ActivityLogs />
          </TabsContent>

          <TabsContent value="analytics">
            <Analytics />
          </TabsContent>

          <TabsContent value="advanced">
            <AdvancedStats />
          </TabsContent>

          <TabsContent value="system">
            <SystemMonitoring />
          </TabsContent>
        </Tabs>
      </div>
    </AdminRoute>
  );
};
