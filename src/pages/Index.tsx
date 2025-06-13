
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
import { Suspense, lazy } from "react";

// Загружаем компоненты лениво для улучшения производительности
const LazyTripsPage = lazy(() => import("./TripsPage").then(module => ({ default: module.TripsPage })));
const LazyContractorsPage = lazy(() => import("./ContractorsPage").then(module => ({ default: module.ContractorsPage })));
const LazyDriversPage = lazy(() => import("./DriversPage").then(module => ({ default: module.DriversPage })));
const LazyVehiclesPage = lazy(() => import("./VehiclesPage").then(module => ({ default: module.VehiclesPage })));
const LazyRoutesPage = lazy(() => import("./RoutesPage").then(module => ({ default: module.RoutesPage })));
const LazyCargoTypesPage = lazy(() => import("./CargoTypesPage").then(module => ({ default: module.CargoTypesPage })));
const LazySettingsPage = lazy(() => import("./SettingsPage").then(module => ({ default: module.SettingsPage })));
const LazyAdminPage = lazy(() => import("./AdminPage"));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const Index = () => {
  const { user, loading } = useAuth();
  
  // Используем хук для автоматического логирования навигации
  useActivityLogger();

  console.log('Index: Current state', { user: !!user, loading });

  // Показываем загрузку только пока аутентификация инициализируется
  if (loading) {
    console.log('Index: Auth loading, showing spinner');
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Если пользователя нет, показываем страницу аутентификации
  if (!user) {
    console.log('Index: No user, showing auth page');
    return <AuthPage />;
  }

  // Если пользователь аутентифицирован, показываем основное приложение
  console.log('Index: User authenticated, showing main app');
  return (
    <MobileLayout>
      <PushNotificationManager />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trips" element={<LazyTripsPage />} />
          <Route path="/contractors" element={<LazyContractorsPage />} />
          <Route path="/drivers" element={<LazyDriversPage />} />
          <Route path="/vehicles" element={<LazyVehiclesPage />} />
          <Route path="/routes" element={<LazyRoutesPage />} />
          <Route path="/cargo-types" element={<LazyCargoTypesPage />} />
          <Route path="/admin" element={<LazyAdminPage />} />
          <Route path="/settings" element={<LazySettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </MobileLayout>
  );
};

export default Index;
