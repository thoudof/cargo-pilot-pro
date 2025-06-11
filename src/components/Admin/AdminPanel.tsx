
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, Activity, BarChart3, TrendingUp } from 'lucide-react';
import { UserManagement } from './UserManagement';
import { ActivityLogs } from './ActivityLogs';
import { SystemStats } from './SystemStats';
import { AdvancedStats } from './AdvancedStats';
import { AdminRoute } from './AdminRoute';

export const AdminPanel: React.FC = () => {
  return (
    <AdminRoute>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Административная панель</h1>
            <p className="text-muted-foreground">Управление системой и пользователями</p>
          </div>
        </div>

        <SystemStats />

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Пользователи
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Логи активности
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Аналитика
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Расширенная статистика
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="logs">
            <ActivityLogs />
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Системная аналитика
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Базовая аналитика будет добавлена в следующих версиях</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced">
            <AdvancedStats />
          </TabsContent>
        </Tabs>
      </div>
    </AdminRoute>
  );
};
