import React, { useState } from 'react';
import { RouteList } from '@/components/Routes/RouteList';
import { RouteCalculator } from '@/components/Routes/RouteCalculator';
import { PageHeader } from '@/components/Layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Calculator } from 'lucide-react';

export const RoutesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('list');

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Маршруты" 
        description="Управление маршрутами доставки"
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Маршруты
          </TabsTrigger>
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Калькулятор
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-4">
          <RouteList />
        </TabsContent>
        
        <TabsContent value="calculator" className="mt-4">
          <RouteCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
};
