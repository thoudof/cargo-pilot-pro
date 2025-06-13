import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/components/Auth/AuthProvider";
import { AuthPage } from "@/components/Auth/AuthPage";
import { MobileLayout } from "@/components/Layout/MobileLayout";
import { Dashboard } from "@/components/Dashboard/Dashboard";
import { PushNotificationManager } from "@/components/Notifications/PushNotificationManager";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { TripsPage } from "./TripsPage";
import { ContractorsPage } from "./ContractorsPage";
import { DriversPage } from "./DriversPage";
import { VehiclesPage } from "./VehiclesPage";
import { RoutesPage } from "./RoutesPage";
import { CargoTypesPage } from "./CargoTypesPage";
import { SettingsPage } from "./SettingsPage";
import AdminPage from "./AdminPage";
import { Home, Truck, Building2, Users, Car, MapPin, Package, Settings, Shield, BarChart3 } from 'lucide-react';
import { ReportsPage } from './ReportsPage';
import { SidebarProvider } from "@/components/Layout/SidebarProvider";
import { AppSidebar } from "@/components/Layout/AppSidebar";
import { SidebarTrigger } from "@/components/Layout/SidebarTrigger";
import { AdminRoute } from "@/components/Layout/AdminRoute";

const Index = () => {
  const { user, loading } = useAuth();
  
  useActivityLogger();

  console.log('Index render - user:', !!user, 'loading:', loading);

  // Показываем загрузку только во время инициализации авторизации
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-3 text-lg">Загрузка приложения...</p>
        </div>
      </div>
    );
  }

  // Если пользователя нет, показываем страницу аутентификации
  if (!user) {
    return <AuthPage />;
  }

  // Если пользователь аутентифицирован, показываем основное приложение
  return (
    <MobileLayout>
      <PushNotificationManager />
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1">
            <SidebarTrigger />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/trips" element={<TripsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/contractors" element={<ContractorsPage />} />
              <Route path="/drivers" element={<DriversPage />} />
              <Route path="/vehicles" element={<VehiclesPage />} />
              <Route path="/routes" element={<RoutesPage />} />
              <Route path="/cargo-types" element={<CargoTypesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </SidebarProvider>
    </MobileLayout>
  );
};

export default Index;
