
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
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/contractors" element={<ContractorsPage />} />
        <Route path="/drivers" element={<DriversPage />} />
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/cargo-types" element={<CargoTypesPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MobileLayout>
  );
};

export default Index;
